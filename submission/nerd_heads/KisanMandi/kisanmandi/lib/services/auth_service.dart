import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';

/// Manages the local device session for KisanMandi.
///
/// The signed-in user id is generated once per device and persisted in
/// SharedPreferences. The same id is used as the Firestore `users` document
/// id, so the profile is both "persisted locally and in Firestore".
class AuthService {
  static const String _kUserId = 'kisanmandi_user_id';
  static const String _kName = 'kisanmandi_name';
  static const String _kPhone = 'kisanmandi_phone';
  static const String _kDistrict = 'kisanmandi_district';
  static const String _kRole = 'kisanmandi_role';

  /// Returns the stable device user id, creating one on first launch.
  static Future<String> ensureUserId() async {
    final prefs = await SharedPreferences.getInstance();
    var id = prefs.getString(_kUserId);
    if (id != null && id.isNotEmpty) return id;
    id = 'u_${DateTime.now().millisecondsSinceEpoch}_'
        '${Random().nextInt(999999).toString().padLeft(6, '0')}';
    await prefs.setString(_kUserId, id);
    return id;
  }

  /// Persists the onboarding profile locally.
  static Future<void> saveSession({
    required String id,
    required String name,
    required String phone,
    required String district,
    required String role,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kUserId, id);
    await prefs.setString(_kName, name);
    await prefs.setString(_kPhone, phone);
    await prefs.setString(_kDistrict, district);
    await prefs.setString(_kRole, role);
  }

  /// Returns the locally cached profile, or null when onboarding is pending.
  static Future<Map<String, String>?> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString(_kUserId);
    final name = prefs.getString(_kName);
    final phone = prefs.getString(_kPhone);
    final district = prefs.getString(_kDistrict);
    final role = prefs.getString(_kRole);
    if (name == null ||
        phone == null ||
        district == null ||
        role == null ||
        name.isEmpty) {
      return null;
    }
    return {
      'id': id ?? await ensureUserId(),
      'name': name,
      'phone': phone,
      'district': district,
      'role': role,
    };
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kName);
    await prefs.remove(_kPhone);
    await prefs.remove(_kDistrict);
    await prefs.remove(_kRole);
  }
}
