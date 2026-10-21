import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_service.dart';
import 'models.dart';

final AppState appState = AppState();

class AppState extends ChangeNotifier {
  static const _prefsKey = 'kisanmandi_user';
  final ApiService _api = ApiService();

  AppUser? user;
  List<Crop> crops = [];
  List<Market> markets = [];
  List<Listing> listings = [];
  List<AlertRule> alerts = [];
  List<AppUser> users = [];
  Map<String, List<PricePoint>> _series = {};
  String? selectedMarketId;
  String latestDate = '';
  bool initialized = false;
  bool loading = false;
  String? error;

  // ---------- session ----------
  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_prefsKey);
      if (raw != null) {
        user = AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      }
    } catch (_) {
      user = null;
    }
    initialized = true;
    notifyListeners();
    if (user != null) await refresh();
  }

  Future<void> registerUser({
    required String name,
    required String phone,
    required String district,
    required String role,
  }) async {
    final json = await _api.create('users', {
      'name': name,
      'phone': phone,
      'district': district,
      'role': role,
    });
    final created = AppUser.fromJson(json);
    user = created;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, jsonEncode(created.toJson()));
    selectedMarketId = null;
    notifyListeners();
    await refresh();
  }

  Future<void> _clearSession() async {
    user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefsKey);
  }

  Future<void> signOut() async {
    await _clearSession();
    selectedMarketId = null;
    notifyListeners();
  }
  void selectMarket(String? id) {
    selectedMarketId = id;
    notifyListeners();
  }
  // ---------- loading (every refresh re-evaluates alerts) ----------
  Future<void> refresh() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        _api.list('crops'),
        _api.list('markets'),
        _api.list('prices'),
        _api.list('listings'),
        _api.list('alerts'),
        _api.list('users'),
      ]);
      crops = results[0].map(Crop.fromJson).toList();
      markets = results[1].map(Market.fromJson).toList();
      _buildSeries(results[2].map(PricePoint.fromJson).toList());
      listings = results[3].map(Listing.fromJson).toList();
      alerts = results[4].map(AlertRule.fromJson).toList();
      users = results[5].map(AppUser.fromJson).toList();

      final current = user;
      if (current != null) {
        final match = users.where((u) => u.id == current.id).firstOrNull;
        if (match == null) {
          await _clearSession();
        } else {
          user = match;
        }
      }
      if (markets.isNotEmpty &&
          !markets.any((m) => m.id == selectedMarketId)) {
        selectedMarketId = markets
            .firstWhere((m) => m.district == user?.district,
                orElse: () => markets.first)
            .id;
      }
    } catch (e) {
      error = '$e';
    }
    loading = false;
    notifyListeners();
  }

  void _buildSeries(List<PricePoint> all) {
    final map = <String, List<PricePoint>>{};
    var newest = '';
    for (final p in all) {
      map.putIfAbsent('${p.cropId}|${p.marketId}', () => []).add(p);
      if (p.date.compareTo(newest) > 0) newest = p.date;
    }
    for (final list in map.values) {
      list.sort((a, b) => a.date.compareTo(b.date));
    }
    _series = map;
    latestDate = newest;
  }

  Future<void> _reloadListings() async {
    listings = (await _api.list('listings')).map(Listing.fromJson).toList();
    notifyListeners();
  }

  Future<void> _reloadAlerts() async {
    alerts = (await _api.list('alerts')).map(AlertRule.fromJson).toList();
    notifyListeners();
  }

  // ---------- lookups ----------
  Crop? cropById(String id) => crops.where((c) => c.id == id).firstOrNull;
  Market? marketById(String id) => markets.where((m) => m.id == id).firstOrNull;
  AppUser? userById(String id) => users.where((u) => u.id == id).firstOrNull;
  Listing? listingById(String id) =>
      listings.where((l) => l.id == id).firstOrNull;
  String cropName(String id) => cropById(id)?.name ?? 'Unknown crop';
  String marketName(String id) => marketById(id)?.name ?? 'Unknown market';

  List<String> get categories =>
      (crops.map((c) => c.category).toSet().toList())..sort();

  // ---------- prices ----------
  List<PricePoint> series(String cropId, String marketId) =>
      _series['$cropId|$marketId'] ?? const [];

  List<PricePoint> last14(String cropId, String marketId) {
    final s = series(cropId, marketId);
    return s.length <= 14 ? s : s.sublist(s.length - 14);
  }

  double? latestPrice(String cropId, String marketId) {
    final s = series(cropId, marketId);
    return s.isEmpty ? null : s.last.price;
  }

  double? previousPrice(String cropId, String marketId) {
    final s = series(cropId, marketId);
    return s.length < 2 ? null : s[s.length - 2].price;
  }

  /// Average of today's latest price across all markets.
  double? averageMarketPrice(String cropId) {
    final values = <double>[];
    for (final m in markets) {
      final p = latestPrice(cropId, m.id);
      if (p != null) values.add(p);
    }
    if (values.isEmpty) return null;
    return values.reduce((a, b) => a + b) / values.length;
  }

  /// Markets sorted by best (highest) price today.
  List<(Market, double)> rankedMarkets(String cropId) {
    final list = <(Market, double)>[];
    for (final m in markets) {
      final p = latestPrice(cropId, m.id);
      if (p != null) list.add((m, p));
    }
    list.sort((a, b) => b.$2.compareTo(a.$2));
    return list;
  }

  /// 'Below market' / 'At market' / 'Above market' (within +-5% is At market).
  String? marketLabel(Listing l) {
    final avg = averageMarketPrice(l.cropId);
    if (avg == null || avg == 0) return null;
    final diff = (l.askingPrice - avg) / avg;
    if (diff.abs() <= 0.05) return 'At market';
    return diff < 0 ? 'Below market' : 'Above market';
  }

  // ---------- alerts ----------
  List<AlertRule> get myAlerts =>
      alerts.where((a) => a.userId == user?.id).toList();

  bool isTriggered(AlertRule a) {
    final p = latestPrice(a.cropId, a.marketId);
    if (p == null) return false;
    return a.isAbove ? p >= a.targetPrice : p <= a.targetPrice;
  }

  int get triggeredCount =>
      myAlerts.where((a) => a.active && isTriggered(a)).length;

  AppUser _requireUser() {
    final u = user;
    if (u == null) throw ApiException('No profile found.');
    return u;
  }

  Future<void> saveAlert({
    String? id,
    required String cropId,
    required String marketId,
    required String condition,
    required double targetPrice,
  }) async {
    final u = _requireUser();
    final body = <String, dynamic>{
      'crop_id': cropId,
      'market_id': marketId,
      'condition': condition,
      'target_price': targetPrice,
    };
    if (id == null) {
      body['user_id'] = u.id;
      body['active_status'] = true;
      await _api.create('alerts', body);
    } else {
      final existing = alerts.where((a) => a.id == id).firstOrNull;
      if (existing == null || existing.userId != u.id) {
        throw ApiException('You can only change your own alerts.');
      }
      await _api.update('alerts', id, body);
    }
    await _reloadAlerts();
  }

  Future<void> setAlertActive(AlertRule a, bool value) async {
    if (a.userId != _requireUser().id) {
      throw ApiException('You can only change your own alerts.');
    }
    await _api.update('alerts', a.id, {'active_status': value});
    await _reloadAlerts();
  }

  Future<void> deleteAlert(AlertRule a) async {
    if (a.userId != _requireUser().id) {
      throw ApiException('You can only delete your own alerts.');
    }
    await _api.delete('alerts', a.id);
    await _reloadAlerts();
  }

  // ---------- listings ----------
  bool isOwner(Listing l) => user != null && l.userId == user!.id;

  List<Listing> get myListings =>
      listings.where((l) => l.userId == user?.id).toList();

  void _assertOwner(Listing l) {
    if (!isOwner(l)) {
      throw ApiException('You can only change your own listings.');
    }
  }

  Future<void> saveListing({
    String? id,
    required String cropId,
    required double quantity,
    required double askingPrice,
    required String district,
    required String grade,
    required String availableFrom,
    required String contactPhone,
  }) async {
    final u = _requireUser();
    final body = <String, dynamic>{
      'crop_id': cropId,
      'quantity': quantity % 1 == 0 ? quantity.toInt() : quantity,
      'asking_price': askingPrice % 1 == 0 ? askingPrice.toInt() : askingPrice,
      'district': district,
      'grade': grade,
      'available_from': availableFrom,
      'contact_phone': contactPhone,
    };
    if (id == null) {
      body['user_id'] = u.id;
      body['status'] = 'Active';
      await _api.create('listings', body);
    } else {
      final existing = listingById(id);
      if (existing == null) throw ApiException('Listing not found.');
      _assertOwner(existing);
      await _api.update('listings', id, body);
    }
    await _reloadListings();
  }

  Future<void> markSold(Listing l) async {
    _assertOwner(l);
    await _api.update('listings', l.id, {'status': 'Sold'});
    await _reloadListings();
  }

  Future<void> deleteListing(Listing l) async {
    _assertOwner(l);
    await _api.delete('listings', l.id);
    await _reloadListings();
  }
}