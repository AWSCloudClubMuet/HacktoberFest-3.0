typedef Json = Map<String, dynamic>;

const districts = [
  'Hyderabad',
  'Sukkur',
  'Larkana',
  'Karachi',
  'Badin',
  'Jamshoro',
  'Mirpurkhas',
  'Thatta',
  'Khairpur',
  'Shaheed Benazirabad',
];

String dateOnly(DateTime date) =>
    '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

String money(num value, {bool currency = true}) {
  final negative = value < 0;
  final digits = value.abs().toStringAsFixed(value % 1 == 0 ? 0 : 2);
  final formatted = digits.replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
    (m) => '${m[1]},',
  );
  return '${negative ? '−' : ''}${currency ? 'Rs ' : ''}$formatted';
}

class Profile {
  final String id, name, phone, district, role;
  Profile.fromJson(Json j)
    : id = j['id'],
      name = j['name'],
      phone = j['phone'],
      district = j['district'],
      role = j['role'];
  bool get isFarmer => role == 'Farmer';
}

class Crop {
  final String id, name, category;
  Crop.fromJson(Json j)
    : id = j['id'],
      name = j['name'],
      category = j['category'];
}

class Market {
  final String id, name, district;
  Market.fromJson(Json j)
    : id = j['id'],
      name = j['name'],
      district = j['district'];
}

class Price {
  final String id, cropId, marketId, date;
  final double price;
  Price.fromJson(Json j)
    : id = j['id'],
      cropId = j['crop_id'],
      marketId = j['market_id'],
      date = j['date'],
      price = (j['price'] as num).toDouble();
}

class ProduceListing {
  final String id,
      userId,
      cropId,
      district,
      grade,
      availableFrom,
      phone,
      status,
      createdAt;
  final double quantity, askingPrice;
  ProduceListing.fromJson(Json j)
    : id = j['id'],
      userId = j['user_id'],
      cropId = j['crop_id'],
      district = j['district'],
      grade = j['grade'],
      availableFrom = j['available_from'],
      phone = j['contact_phone'],
      status = j['status'],
      createdAt = j['created_at'],
      quantity = (j['quantity'] as num).toDouble(),
      askingPrice = (j['asking_price'] as num).toDouble();
}

class PriceAlert {
  final String id, cropId, marketId, condition;
  final double target;
  final bool active, triggered;
  PriceAlert.fromJson(Json j)
    : id = j['id'],
      cropId = j['crop_id'],
      marketId = j['market_id'],
      condition = j['condition'],
      target = (j['target_price'] as num).toDouble(),
      active = j['active_status'],
      triggered = j['triggered'] == true;
}

class ProfitEstimate {
  final double revenue, cost, profit, margin;
  ProfitEstimate({
    required double price,
    required double quantity,
    required double costPerUnit,
    double adjustment = 0,
  }) : revenue = price * (1 + adjustment) * quantity,
       cost = quantity * costPerUnit,
       profit = price * (1 + adjustment) * quantity - quantity * costPerUnit,
       margin = price * (1 + adjustment) * quantity == 0
           ? 0
           : (price * (1 + adjustment) * quantity - quantity * costPerUnit) /
                 (price * (1 + adjustment) * quantity) *
                 100;
}

String marketLabel(double asking, double average) {
  if (asking < average * .95 - 0.000001) return 'Below market';
  if (asking > average * 1.05 + 0.000001) return 'Above market';
  return 'At market';
}

bool targetReached(double latest, double target, String condition) =>
    condition == 'Above' ? latest >= target : latest <= target;
