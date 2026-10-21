import 'package:flutter/foundation.dart';

import '../models/alert_model.dart';
import '../models/listing_model.dart';
import '../models/market_models.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/data_seeder_service.dart';
import '../services/firestore_service.dart';
import '../utils/format.dart';

class AppState extends ChangeNotifier {
  bool initialized = false;
  String? bootstrapError;

  AppUser? user;

  List<Crop> crops = [];
  List<Market> markets = [];

  String selectedMarketId = 'hyderabad';
  String categoryFilter = 'All';
  String searchQuery = '';

  /// Today's price per (crop|market).
  Map<String, Price> todayPrices = {};

  /// Yesterday's price per (crop|market) — used for daily change.
  Map<String, Price> yesterdayPrices = {};

  List<Listing> listings = [];
  List<PriceAlert> userAlerts = [];
  Set<String> triggeredAlertIds = {};

  bool loadingPrices = false;
  bool loadingListings = false;

  static const List<String> categories = [
    'All',
    'Fibres',
    'Grains',
    'Vegetables',
    'Fruits',
  ];

  // ------------------------------------------------------------ getters

  Market get selectedMarket =>
      markets.firstWhere((m) => m.id == selectedMarketId,
          orElse: () => markets.isNotEmpty
              ? markets.first
              : const Market(id: '', name: '', district: ''));

  Crop? cropById(String id) {
    for (final c in crops) {
      if (c.id == id) return c;
    }
    return null;
  }

  Market? marketById(String id) {
    for (final m in markets) {
      if (m.id == id) return m;
    }
    return null;
  }

  String get todayDateStr => toDateStr(DateTime.now());

  String get yesterdayDateStr =>
      toDateStr(DateTime.now().subtract(const Duration(days: 1)));

  Price? todayPriceFor(String cropId, {String? marketId}) {
    return todayPrices['$cropId|${marketId ?? selectedMarketId}'];
  }

  double? todayPriceValue(String cropId, {String? marketId}) =>
      todayPriceFor(cropId, marketId: marketId)?.price;

  /// Returns (changeAbs, changePct); null when either day is missing.
  Tuple2? priceChange(String cropId, {String? marketId}) {
    final market = marketId ?? selectedMarketId;
    final today = todayPrices['$cropId|$market']?.price;
    final yesterday = yesterdayPrices['$cropId|$market']?.price;
    if (today == null || yesterday == null || yesterday == 0) return null;
    final abs = today - yesterday;
    return Tuple2(abs, (abs / yesterday) * 100);
  }

  /// Average of today's prices for [cropId] across all markets.
  double? marketAverageFor(String cropId) {
    double sum = 0;
    var count = 0;
    for (final market in markets) {
      final p = todayPrices['$cropId|${market.id}']?.price;
      if (p != null) {
        sum += p;
        count++;
      }
    }
    if (count == 0) return null;
    return sum / count;
  }

  List<Crop> get filteredCrops {
    final q = searchQuery.trim().toLowerCase();
    return crops.where((c) {
      if (categoryFilter != 'All' && c.category != categoryFilter) {
        return false;
      }
      if (q.isEmpty) return true;
      return c.name.toLowerCase().contains(q);
    }).toList();
  }

  List<Listing> get myListings {
    final uid = user?.id ?? '';
    return listings.where((l) => l.userId == uid).toList();
  }

  int get triggeredCount => triggeredAlertIds.length;

  int get activeAlertCount =>
      userAlerts.where((a) => a.activeStatus).length;

  // ---------------------------------------------------------- bootstrap

  Future<void> bootstrap() async {
    initialized = false;
    bootstrapError = null;
    notifyListeners();
    try {
      final local = await AuthService.loadSession();
      final userId = local?['id'] ?? await AuthService.ensureUserId();

      final seeded =
          await DataSeederService.seedIfEmpty(deviceUserId: userId);

      if (local != null) {
        user = AppUser(
          id: userId,
          name: local['name']!,
          phone: local['phone']!,
          district: local['district']!,
          role: local['role']!,
        );
        // keep the Firestore profile in sync (and backfill after seeding)
        if (seeded || user != null) {
          try {
            await FirestoreService.saveUser(user!);
          } catch (_) {/* offline — local session still works */}
        }
      } else {
        // Seeded demo listings/alerts belong to the device user; make sure
        // the users collection knows about the pending onboarding profile
        // only after the user completes it.
        user = null;
      }

      await _loadStaticData();
      await refreshPrices();
      await refreshListings();
      await _loadAlerts();
      evaluateAlerts();
    } catch (e) {
      bootstrapError = e.toString();
    }
    initialized = true;
    notifyListeners();
  }

  Future<void> _loadStaticData() async {
    final results = await Future.wait([
      FirestoreService.getCrops(),
      FirestoreService.getMarkets(),
    ]);
    crops = results[0] as List<Crop>;
    markets = results[1] as List<Market>;
    if (markets.isNotEmpty &&
        !markets.any((m) => m.id == selectedMarketId)) {
      selectedMarketId = markets.first.id;
    }
    notifyListeners();
  }

  Future<void> completeOnboarding({
    required String name,
    required String phone,
    required String district,
    required String role,
  }) async {
    final id = await AuthService.ensureUserId();
    await AuthService.saveSession(
      id: id,
      name: name,
      phone: phone,
      district: district,
      role: role,
    );
    user = AppUser(
      id: id,
      name: name,
      phone: phone,
      district: district,
      role: role,
    );
    try {
      await FirestoreService.saveUser(user!);
    } catch (_) {/* offline */}
    await _loadAlerts();
    evaluateAlerts();
    notifyListeners();
  }

  // ------------------------------------------------------------- prices

  Future<void> refreshPrices() async {
    loadingPrices = true;
    notifyListeners();
    try {
      final today = todayDateStr;
      final yesterday = yesterdayDateStr;
      final results = await Future.wait([
        FirestoreService.getPricesForDay(today),
        FirestoreService.getPricesForDay(yesterday),
      ]);
      todayPrices = {
        for (final p in results[0]) '${p.cropId}|${p.marketId}': p,
      };
      yesterdayPrices = {
        for (final p in results[1]) '${p.cropId}|${p.marketId}': p,
      };
      evaluateAlerts();
    } catch (_) {
      // keep whatever we had; pull-to-refresh can be retried
    }
    loadingPrices = false;
    notifyListeners();
  }

  void setSelectedMarket(String marketId) {
    selectedMarketId = marketId;
    notifyListeners();
  }

  void setCategory(String category) {
    categoryFilter = category;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    searchQuery = query;
    notifyListeners();
  }

  /// 14-day history for a crop at the selected market.
  Future<List<Price>> loadHistory(String cropId, {String? marketId}) {
    return FirestoreService.getPriceHistory(
      cropId: cropId,
      marketId: marketId ?? selectedMarketId,
    );
  }

  // ---------------------------------------------------------- listings

  Future<void> refreshListings() async {
    loadingListings = true;
    notifyListeners();
    try {
      listings = await FirestoreService.getAllListings();
    } catch (_) {}
    loadingListings = false;
    notifyListeners();
  }

  Future<void> addListing(Listing listing) async {
    await FirestoreService.addListing(listing);
    await refreshListings();
  }

  Future<void> updateListing(Listing listing) async {
    await FirestoreService.updateListing(listing);
    await refreshListings();
  }

  Future<void> deleteListing(String id) async {
    await FirestoreService.deleteListing(id);
    await refreshListings();
  }

  Future<void> toggleListingSold(Listing listing) async {
    final updated = listing.copyWith(
      status: listing.isActive ? 'Sold' : 'Active',
    );
    await FirestoreService.updateListing(updated);
    await refreshListings();
  }

  // ----------------------------------------------------------- alerts

  Future<void> _loadAlerts() async {
    final uid = user?.id;
    if (uid == null) {
      userAlerts = [];
      return;
    }
    try {
      userAlerts = await FirestoreService.getAlertsForUser(uid);
      userAlerts.sort((a, b) => a.id.compareTo(b.id));
    } catch (_) {}
  }

  Future<void> addAlert(PriceAlert alert) async {
    await FirestoreService.addAlert(alert);
    await _loadAlerts();
    evaluateAlerts();
    notifyListeners();
  }

  Future<void> updateAlert(PriceAlert alert) async {
    await FirestoreService.updateAlert(alert);
    await _loadAlerts();
    evaluateAlerts();
    notifyListeners();
  }

  Future<void> deleteAlert(String id) async {
    await FirestoreService.deleteAlert(id);
    await _loadAlerts();
    evaluateAlerts();
    notifyListeners();
  }

  Future<void> toggleAlertActive(PriceAlert alert) async {
    final updated = alert.copyWith(activeStatus: !alert.activeStatus);
    await FirestoreService.updateAlert(updated);
    await _loadAlerts();
    evaluateAlerts();
    notifyListeners();
  }

  void evaluateAlerts() {
    triggeredAlertIds = {};
    for (final alert in userAlerts) {
      if (!alert.activeStatus) continue;
      final price = todayPriceValue(alert.cropId, marketId: alert.marketId);
      if (price != null && alert.isTriggered(price)) {
        triggeredAlertIds.add(alert.id);
      }
    }
    notifyListeners();
  }
}

/// Tiny immutable pair used for daily price change.
class Tuple2 {
  final double a;
  final double b;
  const Tuple2(this.a, this.b);
}
