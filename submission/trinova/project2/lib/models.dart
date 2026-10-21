double toD(dynamic v) => v is num ? v.toDouble() : (double.tryParse('$v') ?? 0);
bool toB(dynamic v) => v is bool ? v : '$v'.toLowerCase() == 'true';

class AppUser {
  final String id, name, phone, district, role;
  const AppUser({
    required this.id,
    required this.name,
    required this.phone,
    required this.district,
    required this.role,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: '${j['id']}',
        name: '${j['name']}',
        phone: '${j['phone']}',
        district: '${j['district']}',
        role: '${j['role']}',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'district': district,
        'role': role,
      };
}

class Crop {
  final String id, name, category;
  const Crop({required this.id, required this.name, required this.category});
  factory Crop.fromJson(Map<String, dynamic> j) =>
      Crop(id: '${j['id']}', name: '${j['name']}', category: '${j['category']}');
}

class Market {
  final String id, name, district;
  const Market({required this.id, required this.name, required this.district});
  factory Market.fromJson(Map<String, dynamic> j) => Market(
      id: '${j['id']}', name: '${j['name']}', district: '${j['district']}');
}

class PricePoint {
  final String id, cropId, marketId, date;
  final double price;
  const PricePoint({
    required this.id,
    required this.cropId,
    required this.marketId,
    required this.date,
    required this.price,
  });
  factory PricePoint.fromJson(Map<String, dynamic> j) => PricePoint(
        id: '${j['id']}',
        cropId: '${j['crop_id']}',
        marketId: '${j['market_id']}',
        date: '${j['date']}',
        price: toD(j['price']),
      );
}

class Listing {
  final String id, userId, cropId, district, grade, availableFrom, status;
  final String contactPhone;
  final double quantity, askingPrice;
  const Listing({
    required this.id,
    required this.userId,
    required this.cropId,
    required this.quantity,
    required this.askingPrice,
    required this.district,
    required this.grade,
    required this.availableFrom,
    required this.status,
    required this.contactPhone,
  });

  bool get isActive => status == 'Active';

  factory Listing.fromJson(Map<String, dynamic> j) => Listing(
        id: '${j['id']}',
        userId: '${j['user_id']}',
        cropId: '${j['crop_id']}',
        quantity: toD(j['quantity']),
        askingPrice: toD(j['asking_price']),
        district: '${j['district']}',
        grade: '${j['grade']}',
        availableFrom: '${j['available_from']}',
        status: '${j['status']}',
        contactPhone: '${j['contact_phone'] ?? ''}',
      );
}

class AlertRule {
  final String id, userId, cropId, marketId, condition;
  final double targetPrice;
  final bool active;
  const AlertRule({
    required this.id,
    required this.userId,
    required this.cropId,
    required this.marketId,
    required this.condition,
    required this.targetPrice,
    required this.active,
  });

  bool get isAbove => condition == 'Above';

  factory AlertRule.fromJson(Map<String, dynamic> j) => AlertRule(
        id: '${j['id']}',
        userId: '${j['user_id']}',
        cropId: '${j['crop_id']}',
        marketId: '${j['market_id']}',
        condition: '${j['condition']}',
        targetPrice: toD(j['target_price']),
        active: toB(j['active_status']),
      );
}