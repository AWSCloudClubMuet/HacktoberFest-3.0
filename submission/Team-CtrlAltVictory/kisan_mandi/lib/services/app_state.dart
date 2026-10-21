import 'dart:math';

import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';
import 'api_service.dart';

class AppState extends ChangeNotifier {
  AppState(this.api);
  final ApiService api;

  AppUser? user;
  List<Crop> crops = const [];
  List<Market> markets = const [];
  List<PriceRecord> prices = const [];
  List<AppUser> users = const [];
  List<Listing> listings = const [];
  List<PriceAlert> alerts = const [];
  bool loading = false;
  String? error;
  String latestDate = '';

  final Map<String, List<PricePoint>> _series = {};

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getInt('userId');
    if (id == null) return;
    try {
      user = await api.getUser(id);
    } on ApiException catch (e) {
      if (e.statusCode == 404) {
        await prefs.remove('userId');
        return;
      }
      rethrow;
    }
    await loadAll();
  }

  Future<void> signIn({
    required String name,
    required String phone,
    required String district,
    required String role,
  }) async {
    final existing = await api.findUserByPhone(phone);
    user = existing ??
        await api.createUser(AppUser(id: 0, name: name, phone: phone, district: district, role: role));
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('userId', user!.id);
    await loadAll();
  }

  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('userId');
    user = null;
    alerts = const [];
    notifyListeners();
  }

  Future<void> loadAll() async {
    final u = user;
    if (u == null) return;
    loading = true;
    error = null;
    notifyListeners();
    try {
      final r = await Future.wait<Object>([
        api.getCrops(),
        api.getMarkets(),
        api.getPrices(),
        api.getListings(),
        api.getAlerts(u.id),
        api.getUsers(),
      ]);
      crops = r[0] as List<Crop>;
      markets = r[1] as List<Market>;
      prices = r[2] as List<PriceRecord>;
      listings = r[3] as List<Listing>;
      alerts = r[4] as List<PriceAlert>;
      users = r[5] as List<AppUser>;
      _buildIndex();
    } on ApiException catch (e) {
      error = e.message;
    } catch (e) {
      error = 'Unexpected error: $e';
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  void _buildIndex() {
    _series.clear();
    final byKey = <String, List<PriceRecord>>{};
    final byCropDate = <int, Map<String, List<double>>>{};
    for (final p in prices) {
      byKey.putIfAbsent('${p.cropId}-${p.marketId}', () => []).add(p);
      byCropDate.putIfAbsent(p.cropId, () => {}).putIfAbsent(p.date, () => []).add(p.price);
    }
    for (final e in byKey.entries) {
      e.value.sort((a, b) => a.date.compareTo(b.date));
      _series[e.key] = [for (final r in e.value) PricePoint(r.date, r.price)];
    }
    for (final e in byCropDate.entries) {
      final dates = e.value.keys.toList()..sort();
      _series['${e.key}-all'] = [
        for (final d in dates)
          PricePoint(d, e.value[d]!.reduce((a, b) => a + b) / e.value[d]!.length),
      ];
    }
    latestDate = prices.isEmpty
        ? ''
        : prices.map((p) => p.date).reduce((a, b) => a.compareTo(b) >= 0 ? a : b);
  }

  Crop? cropById(int id) {
    for (final c in crops) {
      if (c.id == id) return c;
    }
    return null;
  }

  Market? marketById(int id) {
    for (final m in markets) {
      if (m.id == id) return m;
    }
    return null;
  }

  AppUser? userById(int id) {
    for (final u in users) {
      if (u.id == id) return u;
    }
    return null;
  }

  List<PricePoint> series(int cropId, int? marketId) =>
      _series['$cropId-${marketId ?? 'all'}'] ?? const [];

  double? todayPrice(int cropId, int? marketId) {
    final s = series(cropId, marketId);
    return s.isEmpty ? null : s.last.price;
  }

  ({double abs, double pct})? dailyChange(int cropId, int? marketId) {
    final s = series(cropId, marketId);
    if (s.length < 2) return null;
    final prev = s[s.length - 2].price;
    final d = s.last.price - prev;
    return (abs: d, pct: prev == 0 ? 0 : d / prev * 100);
  }

  Future<void> simulatePriceMove() async {
    final rnd = Random();
    final today = prices.where((p) => p.date == latestDate).toList();
    await Future.wait(today.map((p) {
      final factor = 0.93 + rnd.nextDouble() * 0.14;
      final np = ((p.price * factor) / 10).round() * 10.0;
      return api.patchPrice(p.id, np < 10 ? 10 : np);
    }));
    await loadAll();
  }

  List<Listing> get activeListings => listings.where((l) => l.isActive).toList();
  List<Listing> get myListings => listings.where((l) => l.userId == user?.id).toList();

  Future<void> saveListing(Listing l) async {
    if (l.id == null) {
      final created = await api.createListing(l);
      listings = [created, ...listings];
    } else {
      final updated = await api.updateListing(l);
      listings = [for (final x in listings) x.id == updated.id ? updated : x];
    }
    notifyListeners();
  }

  Future<void> markSold(Listing l) async {
    final updated = await api.patchListing(l.id!, {'status': 'sold'});
    listings = [for (final x in listings) x.id == updated.id ? updated : x];
    notifyListeners();
  }

  Future<void> deleteListing(Listing l) async {
    await api.deleteListing(l.id!);
    listings = listings.where((x) => x.id != l.id).toList();
    notifyListeners();
  }

  bool isTriggered(PriceAlert a) {
    if (!a.active) return false;
    final p = todayPrice(a.cropId, a.marketId);
    if (p == null) return false;
    return a.isAbove ? p >= a.targetPrice : p <= a.targetPrice;
  }

  int get triggeredCount => alerts.where(isTriggered).length;

  Future<void> createAlert(PriceAlert a) async {
    final created = await api.createAlert(a);
    alerts = [created, ...alerts];
    notifyListeners();
  }

  Future<void> setAlertActive(PriceAlert a, bool active) async {
    final updated = await api.patchAlert(a.id!, {'active': active});
    alerts = [for (final x in alerts) x.id == updated.id ? updated : x];
    notifyListeners();
  }

  Future<void> deleteAlert(PriceAlert a) async {
    await api.deleteAlert(a.id!);
    alerts = alerts.where((x) => x.id != a.id).toList();
    notifyListeners();
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child})
      : super(notifier: state);

  static AppState of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;

  static AppState read(BuildContext context) =>
      context.getInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
