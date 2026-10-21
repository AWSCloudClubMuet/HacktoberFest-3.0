import 'package:cloud_firestore/cloud_firestore.dart';

class AppUser {
  final String id;
  final String name;
  final String phone;
  final String district;
  final String role; // "Farmer" | "Buyer"

  const AppUser({
    required this.id,
    required this.name,
    required this.phone,
    required this.district,
    required this.role,
  });

  bool get isFarmer => role == 'Farmer';
  bool get isBuyer => role == 'Buyer';

  factory AppUser.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return AppUser(
      id: doc.id,
      name: (data['name'] ?? '') as String,
      phone: (data['phone'] ?? '') as String,
      district: (data['district'] ?? '') as String,
      role: (data['role'] ?? 'Farmer') as String,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'phone': phone,
        'district': district,
        'role': role,
      };
}
