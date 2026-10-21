import 'dart:io';
import 'package:kisanmandi/data/api.dart';
import 'package:kisanmandi/domain/models.dart';

void check(bool ok, String message) {
  if (!ok) throw StateError(message);
}

Future<void> main(List<String> args) async {
  final base = args.isEmpty ? 'http://127.0.0.1:8080' : args.first;
  final owner = Api(base), other = Api(base), buyer = Api(base);
  String? listingId, alertId;
  try {
    check(
      (await owner.request('GET', 'health'))['status'] == 'ok',
      'Server health',
    );
    await owner.request('POST', 'sessions', {'demo_user_id': 'u1'});
    await other.request('POST', 'sessions', {'demo_user_id': 'u2'});
    await buyer.request('POST', 'sessions', {'demo_user_id': 'u5'});
    check(owner.token != null, 'Session header was not read');
    final profile = Profile.fromJson(
      Json.from(await owner.request('GET', 'session')),
    );
    check(profile.isFarmer && profile.id == 'u1', 'Session restoration');
    final collections = await Future.wait([
      for (final name in [
        'users',
        'crops',
        'markets',
        'prices',
        'listings',
        'alerts',
      ])
        owner.all(name),
    ]);
    check(
      collections[1].length == 8 &&
          collections[2].length == 3 &&
          collections[3].length == 336,
      'Reference seed counts',
    );
    final pair =
        collections[3]
            .where((p) => p['crop_id'] == 'c1' && p['market_id'] == 'm1')
            .toList()
          ..sort((a, b) => (a['date'] as String).compareTo(b['date']));
    check(pair.length == 14, '14-day crop history');
    final alert = Json.from(
      await owner.request('POST', 'alerts', {
        'crop_id': 'c1',
        'market_id': 'm1',
        'condition': 'Above',
        'target_price': pair.last['price'],
        'active_status': true,
      }),
    );
    alertId = alert['id'];
    check(alert['triggered'] == true, 'Inclusive Above target');
    final paused = await owner.request('PATCH', 'alerts/$alertId', {
      'active_status': false,
    });
    check(paused['triggered'] == false, 'Paused alert');
    final listing = Json.from(
      await owner.request('POST', 'listings', {
        'crop_id': 'c1',
        'quantity': 2.5,
        'asking_price': 3500,
        'district': 'Hyderabad',
        'grade': 'A',
        'available_from': pair.last['date'],
        'contact_phone': '+920000000001',
      }),
    );
    listingId = listing['id'];
    check(listing['user_id'] == 'u1', 'Server-assigned ownership');
    for (final client in [other, buyer]) {
      try {
        await client.request('PATCH', 'listings/$listingId', {
          'asking_price': 1,
        });
        throw StateError('Forbidden write was accepted');
      } on ApiException catch (e) {
        check(e.status == 403, 'Ownership/role status');
      }
    }
    final sold = await owner.request('PATCH', 'listings/$listingId', {
      'status': 'Sold',
    });
    check(sold['status'] == 'Sold', 'Sold listing');
    stdout.writeln(
      'PASS: Dart client → real HTTP API: all collections, sessions, 14-day history, inclusive alerts, pause, listing creation, ownership, buyer restrictions and Sold.',
    );
  } finally {
    if (listingId != null) await owner.request('DELETE', 'listings/$listingId');
    if (alertId != null) await owner.request('DELETE', 'alerts/$alertId');
    owner.dispose();
    other.dispose();
    buyer.dispose();
  }
}
