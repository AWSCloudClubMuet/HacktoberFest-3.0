class Crop {
  const Crop({required this.id, required this.name, required this.category, required this.unit});
  final int id;
  final String name;
  final String category;
  final String unit;

  factory Crop.fromJson(Map<String, dynamic> j) => Crop(
        id: j['id'] as int,
        name: j['name'] as String,
        category: j['category'] as String,
        unit: (j['unit'] as String?) ?? 'maund (40 kg)',
      );
}

class Market {
  const Market({required this.id, required this.name, required this.district});
  final int id;
  final String name;
  final String district;

  factory Market.fromJson(Map<String, dynamic> j) => Market(
        id: j['id'] as int,
        name: j['name'] as String,
        district: j['district'] as String,
      );
}

class PriceRecord {
  const PriceRecord({
    required this.id,
    required this.cropId,
    required this.marketId,
    required this.date,
    required this.price,
  });
  final int id;
  final int cropId;
  final int marketId;
  final String date;
  final double price;

  factory PriceRecord.fromJson(Map<String, dynamic> j) => PriceRecord(
        id: j['id'] as int,
        cropId: j['cropId'] as int,
        marketId: j['marketId'] as int,
        date: j['date'] as String,
        price: (j['price'] as num).toDouble(),
      );
}

class PricePoint {
  const PricePoint(this.date, this.price);
  final String date;
  final double price;
}

class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.phone,
    required this.district,
    required this.role,
  });
  final int id;
  final String name;
  final String phone;
  final String district;
  final String role;

  bool get isFarmer => role == 'farmer';

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['id'] as int,
        name: j['name'] as String,
        phone: j['phone'] as String,
        district: j['district'] as String,
        role: j['role'] as String,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'district': district,
        'role': role,
      };
}

class Listing {
  const Listing({
    this.id,
    required this.userId,
    required this.cropId,
    required this.quantity,
    required this.pricePerMaund,
    required this.grade,
    required this.district,
    required this.availableFrom,
    required this.contact,
    required this.status,
    required this.createdAt,
  });
  final int? id;
  final int userId;
  final int cropId;
  final double quantity;
  final double pricePerMaund;
  final String grade;
  final String district;
  final String availableFrom;
  final String contact;
  final String status;
  final String createdAt;

  bool get isActive => status == 'active';

  factory Listing.fromJson(Map<String, dynamic> j) => Listing(
        id: j['id'] as int,
        userId: j['userId'] as int,
        cropId: j['cropId'] as int,
        quantity: (j['quantity'] as num).toDouble(),
        pricePerMaund: (j['pricePerMaund'] as num).toDouble(),
        grade: j['grade'] as String,
        district: j['district'] as String,
        availableFrom: j['availableFrom'] as String,
        contact: j['contact'] as String,
        status: j['status'] as String,
        createdAt: j['createdAt'] as String,
      );

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'cropId': cropId,
        'quantity': quantity,
        'pricePerMaund': pricePerMaund,
        'grade': grade,
        'district': district,
        'availableFrom': availableFrom,
        'contact': contact,
        'status': status,
        'createdAt': createdAt,
      };
}

class PriceAlert {
  const PriceAlert({
    this.id,
    required this.userId,
    required this.cropId,
    required this.marketId,
    required this.condition,
    required this.targetPrice,
    required this.active,
    required this.createdAt,
  });
  final int? id;
  final int userId;
  final int cropId;
  final int marketId;
  final String condition;
  final double targetPrice;
  final bool active;
  final String createdAt;

  bool get isAbove => condition == 'above';

  factory PriceAlert.fromJson(Map<String, dynamic> j) => PriceAlert(
        id: j['id'] as int,
        userId: j['userId'] as int,
        cropId: j['cropId'] as int,
        marketId: j['marketId'] as int,
        condition: j['condition'] as String,
        targetPrice: (j['targetPrice'] as num).toDouble(),
        active: j['active'] as bool,
        createdAt: j['createdAt'] as String,
      );

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'cropId': cropId,
        'marketId': marketId,
        'condition': condition,
        'targetPrice': targetPrice,
        'active': active,
        'createdAt': createdAt,
      };
}
