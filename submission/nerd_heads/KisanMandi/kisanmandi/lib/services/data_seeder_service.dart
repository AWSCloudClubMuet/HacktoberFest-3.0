import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/alert_model.dart';
import '../models/listing_model.dart';
import '../models/market_models.dart';
import '../models/user_model.dart';
import '../utils/format.dart';

/// Seeds the Firestore database with demo data on first launch.
///
/// Writes, in one pass:
///  * 8 crops across 4 categories
///  * 3 Sindh markets
///  * 336 price documents (8 crops x 3 markets x 14 consecutive days)
///  * 6 users
///  * 12 active listings
///  * 5 price alerts
class DataSeederService {
  static FirebaseFirestore get _db => FirebaseFirestore.instance;

  static const List<Crop> crops = [
    Crop(id: 'cotton', name: 'Cotton', category: 'Fibres'),
    Crop(id: 'wheat', name: 'Wheat', category: 'Grains'),
    Crop(id: 'basmati', name: 'Basmati Rice', category: 'Grains'),
    Crop(id: 'sugarcane', name: 'Sugarcane', category: 'Grains'),
    Crop(id: 'tomatoes', name: 'Tomatoes', category: 'Vegetables'),
    Crop(id: 'onions', name: 'Onions', category: 'Vegetables'),
    Crop(id: 'chillies', name: 'Chillies', category: 'Vegetables'),
    Crop(id: 'mangoes', name: 'Mangoes', category: 'Fruits'),
  ];

  static const List<Market> markets = [
    Market(id: 'badin', name: 'Badin Mandi', district: 'Badin'),
    Market(id: 'hyderabad', name: 'Hyderabad Grain Market', district: 'Hyderabad'),
    Market(id: 'sukkur', name: 'Sukkur Wholesale Market', district: 'Sukkur'),
  ];

  static const Map<String, double> _basePrice = {
    'cotton': 9500,
    'wheat': 4000,
    'basmati': 11000,
    'sugarcane': 400,
    'tomatoes': 2800,
    'onions': 2200,
    'chillies': 6000,
    'mangoes': 4200,
  };

  static const Map<String, double> _marketFactor = {
    'badin': 0.98,
    'hyderabad': 1.00,
    'sukkur': 1.03,
  };

  static const List<List<AppUser>> _seedUsers = [
    [
      AppUser(
        id: 'farmer_karim',
        name: 'Karim Bakhsh',
        phone: '03001234567',
        district: 'Badin',
        role: 'Farmer',
      ),
    ],
    [
      AppUser(
        id: 'farmer_gul',
        name: 'Gul Hassan',
        phone: '03119876543',
        district: 'Hyderabad',
        role: 'Farmer',
      ),
    ],
    [
      AppUser(
        id: 'farmer_sheila',
        name: 'Sheila Devi',
        phone: '03332221100',
        district: 'Mirpurkhas',
        role: 'Farmer',
      ),
    ],
    [
      AppUser(
        id: 'farmer_allah',
        name: 'Allah Bux',
        phone: '03451112233',
        district: 'Sukkur',
        role: 'Farmer',
      ),
    ],
    [
      AppUser(
        id: 'buyer_rashid',
        name: 'Rashid Traders',
        phone: '03215556677',
        district: 'Hyderabad',
        role: 'Buyer',
      ),
    ],
    [
      AppUser(
        id: 'buyer_nadir',
        name: 'Nadir & Sons',
        phone: '03009998877',
        district: 'Sukkur',
        role: 'Buyer',
      ),
    ],
  ];

  /// Returns true when seeding was performed (crops collection was empty).
  static Future<bool> seedIfEmpty({required String deviceUserId}) async {
    final existing =
        await _db.collection('crops').limit(1).get();
    if (existing.docs.isNotEmpty) return false;
    await seedAll(deviceUserId: deviceUserId);
    return true;
  }

  static Future<void> seedAll({required String deviceUserId}) async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    // ------------------------------------------------------- batch 1
    // crops + markets + users + listings + alerts (34 docs)
    final b1 = _db.batch();

    for (final crop in crops) {
      b1.set(_db.collection('crops').doc(crop.id), crop.toMap());
    }
    for (final market in markets) {
      b1.set(_db.collection('markets').doc(market.id), market.toMap());
    }
    for (final userWrapper in _seedUsers) {
      final user = userWrapper.first;
      b1.set(_db.collection('users').doc(user.id), user.toMap());
    }

    final listings = _buildListings(today, deviceUserId);
    for (final listing in listings) {
      b1.set(_db.collection('listings').doc(listing.id), listing.toMap());
    }

    final alerts = _buildAlerts(deviceUserId);
    for (final alert in alerts) {
      b1.set(_db.collection('alerts').doc(alert.id), alert.toMap());
    }

    await b1.commit();

    // ------------------------------------------- batches 2 & 3: prices
    // 336 documents -> 250 + 86
    final priceDocs = _buildPrices(today);
    var batch = _db.batch();
    var count = 0;
    for (final doc in priceDocs) {
      batch.set(_db.collection('prices').doc(doc.id), doc.toMap());
      count++;
      if (count == 250) {
        await batch.commit();
        batch = _db.batch();
        count = 0;
      }
    }
    if (count > 0) {
      await batch.commit();
    }
  }

  /// 14 consecutive days ending today, one Price per crop x market x day.
  static List<Price> _buildPrices(DateTime today) {
    final rng = Random(20261021);
    final docs = <Price>[];
    for (final crop in crops) {
      final base = _basePrice[crop.id]!;
      for (final market in markets) {
        final factor = _marketFactor[market.id]!;
        // start slightly off the base so day-over-day changes exist
        var price = base * factor * (0.97 + rng.nextDouble() * 0.06);
        for (var i = 0; i < 14; i++) {
          final date = today.subtract(Duration(days: 13 - i));
          // daily random walk, mean-reverting towards the base
          final drift = (base * factor - price) * 0.08;
          final shock = (rng.nextDouble() - 0.5) * 0.07 * price;
          price = price + drift + shock;
          final minP = base * factor * 0.7;
          final maxP = base * factor * 1.35;
          price = price.clamp(minP, maxP);
          docs.add(
            Price(
              id: '${crop.id}_${market.id}_${toDateStr(date)}',
              cropId: crop.id,
              marketId: market.id,
              date: toDateStr(date),
              price: double.parse(price.toStringAsFixed(2)),
            ),
          );
        }
      }
    }
    return docs;
  }

  static List<Listing> _buildListings(DateTime today, String deviceUserId) {
    String isoOf(int daysFromNow) {
      final d = today.add(Duration(days: daysFromNow));
      return DateTime(d.year, d.month, d.day, 10).toIso8601String();
    }

    String dateOf(int daysFromNow) => toDateStr(today.add(Duration(days: daysFromNow)));

    Listing l({
      required String id,
      required String userId,
      required String cropId,
      required double quantity,
      required double askingPrice,
      required String district,
      required String grade,
      required int availableInDays,
      required String phone,
      required int createdDaysAgo,
    }) {
      return Listing(
        id: id,
        userId: userId,
        cropId: cropId,
        quantity: quantity,
        askingPrice: askingPrice,
        district: district,
        grade: grade,
        availableFrom: dateOf(availableInDays),
        status: 'Active',
        contactPhone: phone,
        createdAt: isoOf(-createdDaysAgo),
      );
    }

    // 7 listings owned by seeded farmers, 5 owned by the device user
    // so that "My Listings" and marketplace comparison demos work instantly.
    return [
      l(
        id: 'listing_01',
        userId: 'farmer_karim',
        cropId: 'cotton',
        quantity: 120,
        askingPrice: 9200,
        district: 'Badin',
        grade: 'A',
        availableInDays: 2,
        phone: '03001234567',
        createdDaysAgo: 5,
      ),
      l(
        id: 'listing_02',
        userId: 'farmer_karim',
        cropId: 'tomatoes',
        quantity: 45,
        askingPrice: 2450,
        district: 'Badin',
        grade: 'B',
        availableInDays: 0,
        phone: '03001234567',
        createdDaysAgo: 1,
      ),
      l(
        id: 'listing_03',
        userId: 'farmer_gul',
        cropId: 'wheat',
        quantity: 300,
        askingPrice: 3850,
        district: 'Hyderabad',
        grade: 'A',
        availableInDays: 5,
        phone: '03119876543',
        createdDaysAgo: 4,
      ),
      l(
        id: 'listing_04',
        userId: 'farmer_gul',
        cropId: 'basmati',
        quantity: 80,
        askingPrice: 12500,
        district: 'Hyderabad',
        grade: 'A',
        availableInDays: 10,
        phone: '03119876543',
        createdDaysAgo: 3,
      ),
      l(
        id: 'listing_05',
        userId: 'farmer_sheila',
        cropId: 'chillies',
        quantity: 25,
        askingPrice: 7400,
        district: 'Mirpurkhas',
        grade: 'A',
        availableInDays: 1,
        phone: '03332221100',
        createdDaysAgo: 2,
      ),
      l(
        id: 'listing_06',
        userId: 'farmer_sheila',
        cropId: 'mangoes',
        quantity: 200,
        askingPrice: 3900,
        district: 'Mirpurkhas',
        grade: 'B',
        availableInDays: 14,
        phone: '03332221100',
        createdDaysAgo: 6,
      ),
      l(
        id: 'listing_07',
        userId: 'farmer_allah',
        cropId: 'onions',
        quantity: 150,
        askingPrice: 2400,
        district: 'Sukkur',
        grade: 'B',
        availableInDays: 3,
        phone: '03451112233',
        createdDaysAgo: 7,
      ),
      l(
        id: 'listing_08',
        userId: deviceUserId,
        cropId: 'wheat',
        quantity: 90,
        askingPrice: 3900,
        district: 'Badin',
        grade: 'B',
        availableInDays: 4,
        phone: '03000000001',
        createdDaysAgo: 2,
      ),
      l(
        id: 'listing_09',
        userId: deviceUserId,
        cropId: 'onions',
        quantity: 60,
        askingPrice: 1950,
        district: 'Badin',
        grade: 'C',
        availableInDays: 1,
        phone: '03000000001',
        createdDaysAgo: 1,
      ),
      l(
        id: 'listing_10',
        userId: deviceUserId,
        cropId: 'cotton',
        quantity: 200,
        askingPrice: 9750,
        district: 'Badin',
        grade: 'A',
        availableInDays: 7,
        phone: '03000000001',
        createdDaysAgo: 3,
      ),
      l(
        id: 'listing_11',
        userId: deviceUserId,
        cropId: 'tomatoes',
        quantity: 30,
        askingPrice: 3100,
        district: 'Badin',
        grade: 'A',
        availableInDays: 0,
        phone: '03000000001',
        createdDaysAgo: 0,
      ),
      l(
        id: 'listing_12',
        userId: deviceUserId,
        cropId: 'sugarcane',
        quantity: 500,
        askingPrice: 420,
        district: 'Badin',
        grade: 'B',
        availableInDays: 6,
        phone: '03000000001',
        createdDaysAgo: 4,
      ),
    ];
  }

  static List<PriceAlert> _buildAlerts(String deviceUserId) {
    PriceAlert a({
      required String id,
      required String cropId,
      required String marketId,
      required String condition,
      required double target,
      bool active = true,
    }) {
      return PriceAlert(
        id: id,
        userId: deviceUserId,
        cropId: cropId,
        marketId: marketId,
        condition: condition,
        targetPrice: target,
        activeStatus: active,
      );
    }

    return [
      a(
        id: 'alert_01',
        cropId: 'cotton',
        marketId: 'hyderabad',
        condition: 'Above',
        target: 10000,
      ),
      a(
        id: 'alert_02',
        cropId: 'wheat',
        marketId: 'sukkur',
        condition: 'Below',
        target: 3800,
      ),
      a(
        id: 'alert_03',
        cropId: 'onions',
        marketId: 'badin',
        condition: 'Above',
        target: 2500,
      ),
      a(
        id: 'alert_04',
        cropId: 'basmati',
        marketId: 'hyderabad',
        condition: 'Below',
        target: 10500,
      ),
      a(
        id: 'alert_05',
        cropId: 'tomatoes',
        marketId: 'badin',
        condition: 'Above',
        target: 3000,
        active: false,
      ),
    ];
  }
}
