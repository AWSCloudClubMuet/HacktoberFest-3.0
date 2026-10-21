import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../domain/models.dart';
import 'api.dart';

class AppStore extends ChangeNotifier {
  final Api api;
  SharedPreferencesAsync? _prefs;
  SharedPreferencesAsync get prefs => _prefs ??= SharedPreferencesAsync();
  Profile? user;
  List<Crop> crops = [];
  List<Market> markets = [];
  List<Price> prices = [];
  List<ProduceListing> listings = [];
  List<PriceAlert> alerts = [];
  String marketId = 'm1';
  String? error;
  bool loading = false;
  DateTime? refreshedAt;
  Future<void>? _refreshing;

  AppStore(this.api, {SharedPreferencesAsync? prefs}) : _prefs = prefs;

  Future<void> initialize() async {
    api.baseUrl = await prefs.getString('api_url') ?? api.baseUrl;
    api.token = await prefs.getString('session_token');
    if (api.token != null) {
      try {
        user = Profile.fromJson(Json.from(await api.request('GET', 'session')));
      } on ApiException catch (e) {
        if (e.status == 401) {
          api.token = null;
          await prefs.remove('session_token');
        } else {
          error = e.message;
        }
      }
    }
    if (user != null) await refresh();
  }

  Future<void> saveApiUrl(String value) async {
    final url = Uri.tryParse(value.trim());
    if (url == null ||
        !['http', 'https'].contains(url.scheme) ||
        url.host.isEmpty ||
        url.hasQuery ||
        url.hasFragment ||
        (url.path.isNotEmpty && url.path != '/')) {
      throw ApiException('Use an address such as http://192.168.1.10:8080');
    }
    if (api.baseUrl != value.trim()) await signOut();
    api.baseUrl = value.trim();
    await prefs.setString('api_url', api.baseUrl);
    await api.request('GET', 'health');
    notifyListeners();
  }

  Future<void> onboard(Json profile) async =>
      _accept(await api.request('POST', 'users', profile));
  Future<void> demo(String id) async =>
      _accept(await api.request('POST', 'sessions', {'demo_user_id': id}));

  Future<void> _accept(dynamic json) async {
    user = Profile.fromJson(Json.from(json));
    await prefs.setString('session_token', api.token!);
    await refresh();
    notifyListeners();
  }

  Future<void> signOut() async {
    // Invalidate local responses from an in-flight refresh before changing identity.
    await _refreshing;
    user = null;
    api.token = null;
    crops = [];
    markets = [];
    prices = [];
    listings = [];
    alerts = [];
    error = null;
    refreshedAt = null;
    await prefs.remove('session_token');
    notifyListeners();
  }

  Future<void> refresh() =>
      _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);

  Future<void> _doRefresh() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      // Prices first: advances the 14-day window before evaluating alerts.
      final nextPrices = (await api.all('prices')).map(Price.fromJson).toList();
      final data = await Future.wait([
        api.all('crops'),
        api.all('markets'),
        api.all('listings'),
        if (user?.isFarmer == true) api.all('alerts'),
      ]);
      crops = data[0].map(Crop.fromJson).toList();
      markets = data[1].map(Market.fromJson).toList();
      listings = data[2].map(ProduceListing.fromJson).toList();
      alerts = user?.isFarmer == true
          ? data[3].map(PriceAlert.fromJson).toList()
          : [];
      prices = nextPrices;
      refreshedAt = DateTime.now();
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> mutate(String method, String path, [Json? body]) async {
    await api.request(method, path, body);
    // An overlapping pull-to-refresh may have read before the write completed.
    await _refreshing;
    await refresh();
    // A write may succeed while a subsequent refresh fails. Keep the visible retry banner.
  }

  void selectMarket(String id) {
    marketId = id;
    notifyListeners();
  }

  Crop crop(String id) => crops.firstWhere((c) => c.id == id);
  Market market(String id) => markets.firstWhere((m) => m.id == id);
  int get triggeredCount => alerts.where((a) => a.active && a.triggered).length;

  List<Price> history(String cropId, [String? market]) =>
      prices
          .where(
            (p) => p.cropId == cropId && p.marketId == (market ?? marketId),
          )
          .toList()
        ..sort((a, b) => a.date.compareTo(b.date));
  Price? latest(String cropId, [String? market]) {
    final list = history(cropId, market);
    return list.isEmpty ? null : list.last;
  }

  double? dailyChange(String cropId) {
    final list = history(cropId);
    if (list.length < 2) return null;
    final today = DateTime.parse(list.last.date);
    final yesterday = dateOnly(today.subtract(const Duration(days: 1)));
    final previous = list.where((p) => p.date == yesterday).firstOrNull;
    return previous == null ? null : list.last.price - previous.price;
  }

  double averagePrice(String cropId) {
    final values = markets
        .map((m) => latest(cropId, m.id)?.price)
        .whereType<double>()
        .toList();
    return values.isEmpty ? 0 : values.reduce((a, b) => a + b) / values.length;
  }

  List<({Market market, double price})> comparison(String cropId) =>
      markets
          .where((m) => latest(cropId, m.id) != null)
          .map((m) => (market: m, price: latest(cropId, m.id)!.price))
          .toList()
        ..sort((a, b) => b.price.compareTo(a.price));

  @override
  void dispose() {
    api.dispose();
    super.dispose();
  }
}
