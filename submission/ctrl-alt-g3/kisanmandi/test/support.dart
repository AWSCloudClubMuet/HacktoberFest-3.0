import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kisanmandi/data/api.dart';
import 'package:kisanmandi/data/store.dart';
import 'package:kisanmandi/domain/models.dart';

Map<String, List<Json>> fixture() {
  final now = DateTime.now();
  final names = [
    'Wheat',
    'Rice',
    'Cotton',
    'Sugarcane',
    'Onion',
    'Tomato',
    'Mango',
    'Banana',
  ];
  final categories = [
    'Grains',
    'Grains',
    'Cash crops',
    'Cash crops',
    'Vegetables',
    'Vegetables',
    'Fruit',
    'Fruit',
  ];
  return {
    'users': [
      {
        'id': 'u1',
        'name': 'Mehran Demo',
        'phone': '+920000000001',
        'district': 'Hyderabad',
        'role': 'Farmer',
      },
    ],
    'crops': [
      for (var i = 0; i < 8; i++)
        {'id': 'c${i + 1}', 'name': names[i], 'category': categories[i]},
    ],
    'markets': [
      for (var i = 0; i < 3; i++)
        {
          'id': 'm${i + 1}',
          'name': '${['Hyderabad', 'Sukkur', 'Larkana'][i]} Mandi',
          'district': ['Hyderabad', 'Sukkur', 'Larkana'][i],
        },
    ],
    'prices': [
      for (var c = 1; c <= 8; c++)
        for (var m = 1; m <= 3; m++)
          for (var d = 0; d < 14; d++)
            {
              'id': 'p$c$m$d',
              'crop_id': 'c$c',
              'market_id': 'm$m',
              'date': dateOnly(now.subtract(Duration(days: 13 - d))),
              'price': 3200 + c * 100 + m * 70 + d * 8,
            },
    ],
    'listings': [
      for (var i = 1; i <= 4; i++)
        {
          'id': 'l$i',
          'user_id': i == 1 ? 'u1' : 'u2',
          'crop_id': 'c$i',
          'quantity': 20 + i,
          'asking_price': 3400 + i * 100,
          'district': 'Hyderabad',
          'grade': 'A',
          'available_from': dateOnly(now),
          'contact_phone': '+920000000001',
          'status': 'Active',
          'created_at': '${dateOnly(now)}T09:00:00Z',
        },
    ],
    'alerts': [
      {
        'id': 'a1',
        'user_id': 'u1',
        'crop_id': 'c1',
        'market_id': 'm1',
        'condition': 'Above',
        'target_price': 3300,
        'active_status': true,
        'triggered': true,
      },
    ],
  };
}

class TestStore extends AppStore {
  final List<String> calls;
  TestStore._(super.api, this.calls);
  factory TestStore({bool farmer = true}) {
    final db = fixture();
    final calls = <String>[];
    final api = Api(
      'http://test',
      client: MockClient((r) async {
        calls.add('${r.method} ${r.url.path}');
        if (r.method == 'GET') {
          return http.Response(
            jsonEncode(db[r.url.path.substring(1)] ?? {}),
            200,
          );
        }
        if (r.method == 'PATCH') {
          final collection = r.url.path.split('/')[1],
              id = r.url.path.split('/')[2];
          final data = jsonDecode(r.body) as Json;
          final record = db[collection]!.firstWhere((j) => j['id'] == id);
          record.addAll(data);
          if (collection == 'alerts') {
            record['triggered'] = record['active_status'] == true;
          }
          return http.Response(jsonEncode(record), 200);
        }
        return http.Response('{}', 200);
      }),
    );
    final s = TestStore._(api, calls);
    s.user = Profile.fromJson({
      ...db['users']!.first,
      'role': farmer ? 'Farmer' : 'Buyer',
    });
    s.crops = db['crops']!.map(Crop.fromJson).toList();
    s.markets = db['markets']!.map(Market.fromJson).toList();
    s.prices = db['prices']!.map(Price.fromJson).toList();
    s.listings = db['listings']!.map(ProduceListing.fromJson).toList();
    s.alerts = farmer ? db['alerts']!.map(PriceAlert.fromJson).toList() : [];
    s.refreshedAt = DateTime.now();
    return s;
  }
  @override
  Future<void> initialize() async {}
}
