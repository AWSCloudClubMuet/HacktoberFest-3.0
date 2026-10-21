import 'package:cloud_firestore/cloud_firestore.dart';

class Listing {
  final String id;
  final String userId;
  final String cropId;
  final double quantity;
  final double askingPrice;
  final String district;
  final String grade; // "A" | "B" | "C"
  final String availableFrom; // YYYY-MM-DD
  final String status; // "Active" | "Sold"
  final String contactPhone;
  final String createdAt; // ISO-8601, used for newest-first sorting

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
    required this.createdAt,
  });

  bool get isActive => status == 'Active';

  factory Listing.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return Listing(
      id: doc.id,
      userId: (data['user_id'] ?? '') as String,
      cropId: (data['crop_id'] ?? '') as String,
      quantity: (data['quantity'] as num?)?.toDouble() ?? 0,
      askingPrice: (data['asking_price'] as num?)?.toDouble() ?? 0,
      district: (data['district'] ?? '') as String,
      grade: (data['grade'] ?? 'B') as String,
      availableFrom: (data['available_from'] ?? '') as String,
      status: (data['status'] ?? 'Active') as String,
      contactPhone: (data['contact_phone'] ?? '') as String,
      createdAt: (data['created_at'] ?? '') as String,
    );
  }

  Map<String, dynamic> toMap() => {
        'user_id': userId,
        'crop_id': cropId,
        'quantity': quantity,
        'asking_price': askingPrice,
        'district': district,
        'grade': grade,
        'available_from': availableFrom,
        'status': status,
        'contact_phone': contactPhone,
        'created_at': createdAt,
      };

  Listing copyWith({
    String? userId,
    String? cropId,
    double? quantity,
    double? askingPrice,
    String? district,
    String? grade,
    String? availableFrom,
    String? status,
    String? contactPhone,
    String? createdAt,
  }) {
    return Listing(
      id: id,
      userId: userId ?? this.userId,
      cropId: cropId ?? this.cropId,
      quantity: quantity ?? this.quantity,
      askingPrice: askingPrice ?? this.askingPrice,
      district: district ?? this.district,
      grade: grade ?? this.grade,
      availableFrom: availableFrom ?? this.availableFrom,
      status: status ?? this.status,
      contactPhone: contactPhone ?? this.contactPhone,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
