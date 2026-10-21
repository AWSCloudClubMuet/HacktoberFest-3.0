import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/alert_model.dart';
import '../models/listing_model.dart';
import '../models/market_models.dart';
import '../models/user_model.dart';

class FirestoreService {
  static FirebaseFirestore get _db => FirebaseFirestore.instance;

  // ---------------------------------------------------------------- users

  static Future<void> saveUser(AppUser user) {
    return _db.collection('users').doc(user.id).set(user.toMap());
  }

  static Future<AppUser?> getUser(String id) async {
    final doc = await _db.collection('users').doc(id).get();
    if (!doc.exists) return null;
    return AppUser.fromDoc(doc);
  }

  // ------------------------------------------------- crops / markets

  static Future<List<Crop>> getCrops() async {
    final snap = await _db.collection('crops').get();
    final crops = snap.docs.map(Crop.fromDoc).toList();
    crops.sort((a, b) => a.name.compareTo(b.name));
    return crops;
  }

  static Future<List<Market>> getMarkets() async {
    final snap = await _db.collection('markets').get();
    final markets = snap.docs.map(Market.fromDoc).toList();
    markets.sort((a, b) => a.name.compareTo(b.name));
    return markets;
  }

  // ----------------------------------------------------------- prices

  static Future<List<Price>> getPricesForDate(String date) async {
    final snap = await _db
        .collection('prices')
        .where('date', isEqualTo: date)
        .get();
    return snap.docs.map(Price.fromDoc).toList();
  }

  /// 14-day (or N-day) history of a crop at one market.
  static Future<List<Price>> getPriceHistory({
    required String cropId,
    required String marketId,
  }) async {
    final snap = await _db
        .collection('prices')
        .where('crop_id', isEqualTo: cropId)
        .where('market_id', isEqualTo: marketId)
        .get();
    final prices = snap.docs.map(Price.fromDoc).toList();
    prices.sort((a, b) => a.date.compareTo(b.date));
    return prices;
  }

  /// Today's price for every crop at every market (one query, 24 docs).
  static Future<List<Price>> getPricesForDay(String date) async {
    final snap = await _db
        .collection('prices')
        .where('date', isEqualTo: date)
        .get();
    return snap.docs.map(Price.fromDoc).toList();
  }

  // --------------------------------------------------------- listings

  static Future<List<Listing>> getAllListings() async {
    final snap = await _db.collection('listings').get();
    final listings = snap.docs.map(Listing.fromDoc).toList();
    listings.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return listings;
  }

  static Future<List<Listing>> getListingsForUser(String userId) async {
    final snap = await _db
        .collection('listings')
        .where('user_id', isEqualTo: userId)
        .get();
    final listings = snap.docs.map(Listing.fromDoc).toList();
    listings.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return listings;
  }

  static Future<void> addListing(Listing listing) {
    return _db.collection('listings').doc(listing.id).set(listing.toMap());
  }

  static Future<void> updateListing(Listing listing) {
    return _db.collection('listings').doc(listing.id).update(listing.toMap());
  }

  static Future<void> deleteListing(String id) {
    return _db.collection('listings').doc(id).delete();
  }

  // ----------------------------------------------------------- alerts

  static Future<List<PriceAlert>> getAlertsForUser(String userId) async {
    final snap = await _db
        .collection('alerts')
        .where('user_id', isEqualTo: userId)
        .get();
    return snap.docs.map(PriceAlert.fromDoc).toList();
  }

  static Future<void> addAlert(PriceAlert alert) {
    return _db.collection('alerts').doc(alert.id).set(alert.toMap());
  }

  static Future<void> updateAlert(PriceAlert alert) {
    return _db.collection('alerts').doc(alert.id).update(alert.toMap());
  }

  static Future<void> deleteAlert(String id) {
    return _db.collection('alerts').doc(id).delete();
  }
}
