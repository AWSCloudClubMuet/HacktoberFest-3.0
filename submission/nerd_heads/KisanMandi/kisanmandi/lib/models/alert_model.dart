import 'package:cloud_firestore/cloud_firestore.dart';

class PriceAlert {
  final String id;
  final String userId;
  final String cropId;
  final String marketId;
  final String condition; // "Above" | "Below"
  final double targetPrice;
  final bool activeStatus;

  const PriceAlert({
    required this.id,
    required this.userId,
    required this.cropId,
    required this.marketId,
    required this.condition,
    required this.targetPrice,
    required this.activeStatus,
  });

  bool isTriggered(double? currentPrice) {
    if (currentPrice == null) return false;
    return condition == 'Above'
        ? currentPrice >= targetPrice
        : currentPrice <= targetPrice;
  }

  factory PriceAlert.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return PriceAlert(
      id: doc.id,
      userId: (data['user_id'] ?? '') as String,
      cropId: (data['crop_id'] ?? '') as String,
      marketId: (data['market_id'] ?? '') as String,
      condition: (data['condition'] ?? 'Above') as String,
      targetPrice: (data['target_price'] as num?)?.toDouble() ?? 0,
      activeStatus: (data['active_status'] ?? true) as bool,
    );
  }

  Map<String, dynamic> toMap() => {
        'user_id': userId,
        'crop_id': cropId,
        'market_id': marketId,
        'condition': condition,
        'target_price': targetPrice,
        'active_status': activeStatus,
      };

  PriceAlert copyWith({
    String? cropId,
    String? marketId,
    String? condition,
    double? targetPrice,
    bool? activeStatus,
  }) {
    return PriceAlert(
      id: id,
      userId: userId,
      cropId: cropId ?? this.cropId,
      marketId: marketId ?? this.marketId,
      condition: condition ?? this.condition,
      targetPrice: targetPrice ?? this.targetPrice,
      activeStatus: activeStatus ?? this.activeStatus,
    );
  }
}
