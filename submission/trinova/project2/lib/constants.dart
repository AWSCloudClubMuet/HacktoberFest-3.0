import 'dart:io' show Platform;

const String _apiOverride = String.fromEnvironment('API_BASE');

/// Linux/desktop: localhost. Android emulator: 10.0.2.2 (the host PC).
/// Physical phone: run with --dart-define=API_BASE=http://PC-IP:3000
String get apiBaseUrl {
  if (_apiOverride.isNotEmpty) return _apiOverride;
  if (Platform.isAndroid) return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

const String roleFarmer = 'Farmer';
const String roleBuyer = 'Buyer';
const String priceUnit = 'per 40 kg';
const List<String> grades = ['A', 'B', 'C'];

const List<String> sindhDistricts = [
  'Badin',
  'Dadu',
  'Hyderabad',
  'Jacobabad',
  'Karachi',
  'Khairpur',
  'Larkana',
  'Mirpurkhas',
  'Shaheed Benazirabad',
  'Sukkur',
  'Tharparkar',
  'Thatta',
];