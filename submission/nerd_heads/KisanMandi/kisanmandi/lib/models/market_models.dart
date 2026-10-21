import 'package:cloud_firestore/cloud_firestore.dart';

class Crop {
  final String id;
  final String name;
  final String category; // "Fibres" | "Grains" | "Vegetables" | "Fruits"

  const Crop({
    required this.id,
    required this.name,
    required this.category,
  });

  factory Crop.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return Crop(
      id: doc.id,
      name: (data['name'] ?? '') as String,
      category: (data['category'] ?? '') as String,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'category': category,
      };
}

class Market {
  final String id;
  final String name;
  final String district;

  const Market({
    required this.id,
    required this.name,
    required this.district,
  });

  factory Market.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return Market(
      id: doc.id,
      name: (data['name'] ?? '') as String,
      district: (data['district'] ?? '') as String,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'district': district,
      };
}

class Price {
  final String id;
  final String cropId;
  final String marketId;
  final String date; // YYYY-MM-DD
  final double price;

  const Price({
    required this.id,
    required this.cropId,
    required this.marketId,
    required this.date,
    required this.price,
  });

  factory Price.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return Price(
      id: doc.id,
      cropId: (data['crop_id'] ?? '') as String,
      marketId: (data['market_id'] ?? '') as String,
      date: (data['date'] ?? '') as String,
      price: (data['price'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toMap() => {
        'crop_id': cropId,
        'market_id': marketId,
        'date': date,
        'price': price,
      };
}
