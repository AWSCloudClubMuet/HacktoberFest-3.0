import 'dart:convert';
import 'package:http/http.dart' as http;

typedef M = Map<String, dynamic>;

/// Android emulator (Pixel 5) reaches the PC at 10.0.2.2
const baseUrl = 'http://10.0.2.2:3000';

num nn(dynamic x) => x is num ? x : (num.tryParse('$x') ?? 0);
bool same(dynamic a, dynamic b) => '$a' == '$b';

/// Auto-mark Full when families reach capacity.
String statusFor(String s, int fam, int cap) =>
    s == 'Closed' ? 'Closed' : (fam >= cap ? 'Full' : 'Active');

class Api {
  static const _h = {'Content-Type': 'application/json'};

  static void _ok(http.Response r, String w) {
    if (r.statusCode >= 300) throw 'API error ${r.statusCode} ($w)';
  }

  static Future<List<M>> list(String c) async {
    final r = await http.get(Uri.parse('$baseUrl/$c'));
    _ok(r, 'GET $c');
    return (jsonDecode(r.body) as List)
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  static Future<M> one(String c, dynamic id) async {
    final r = await http.get(Uri.parse('$baseUrl/$c/$id'));
    _ok(r, 'GET $c/$id');
    return Map<String, dynamic>.from(jsonDecode(r.body));
  }

  static Future<M> create(String c, M b) async {
    final r = await http.post(Uri.parse('$baseUrl/$c'), headers: _h, body: jsonEncode(b));
    _ok(r, 'POST $c');
    return Map<String, dynamic>.from(jsonDecode(r.body));
  }

  static Future<void> update(String c, dynamic id, M b) async {
    final r = await http.patch(Uri.parse('$baseUrl/$c/$id'), headers: _h, body: jsonEncode(b));
    _ok(r, 'PATCH $c/$id');
  }

  static Future<void> remove(String c, dynamic id) async {
    final r = await http.delete(Uri.parse('$baseUrl/$c/$id'));
    _ok(r, 'DELETE $c/$id');
  }
}

/// Business rules (dispatch reservation, volunteers)
class Svc {
  static int reserved(List<M> ds, dynamic needId) => ds
      .where((d) =>
  same(d['need_id'], needId) &&
      (d['status'] == 'Pending' || d['status'] == 'In Transit'))
      .fold(0, (s, d) => s + nn(d['quantity']).toInt());

  /// required - fulfilled - Pending/In Transit dispatches
  static int remaining(M need, List<M> ds) =>
      nn(need['required_quantity']).toInt() -
          nn(need['fulfilled_quantity']).toInt() -
          reserved(ds, need['id']);

  static Future<void> createDispatch(dynamic needId, int qty) async {
    if (qty <= 0) throw 'Quantity must be greater than 0';
    final need = await Api.one('needs', needId);
    final item = await Api.one('inventory', need['inventory_item_id']);
    final ds = await Api.list('dispatches');
    final stock = nn(item['stock']).toInt();
    final rem = remaining(need, ds);
    if (qty > stock) throw 'Only $stock ${item['unit']} in stock';
    if (qty > rem) throw 'Only $rem remaining for this need';
    await Api.create('dispatches', {
      'camp_id': need['camp_id'],
      'need_id': need['id'],
      'quantity': qty,
      'status': 'Pending'
    });
    await Api.update('inventory', item['id'], {'stock': stock - qty}); // reserve now
  }

  static Future<void> setStatus(M d, String status) async {
    final fresh = await Api.one('dispatches', d['id']);
    final from = fresh['status'];
    final q = nn(fresh['quantity']).toInt();
    if (from == 'Delivered' || from == 'Cancelled') throw 'Dispatch is already $from';
    if (status == 'In Transit' && from != 'Pending') throw 'Invalid transition';
    if (status == 'Delivered') {
      final need = await Api.one('needs', fresh['need_id']);
      await Api.update('needs', need['id'],
          {'fulfilled_quantity': nn(need['fulfilled_quantity']).toInt() + q});
    }
    if (status == 'Cancelled') {
      final need = await Api.one('needs', fresh['need_id']);
      final item = await Api.one('inventory', need['inventory_item_id']);
      await Api.update('inventory', item['id'], {'stock': nn(item['stock']).toInt() + q});
    }
    await Api.update('dispatches', d['id'], {'status': status});
  }

  static Future<void> assignVolunteer(dynamic volId, dynamic campId) async {
    final v = await Api.one('volunteers', volId);
    final c = await Api.one('camps', campId);
    if (v['camp_id'] != null) throw 'Volunteer already assigned. Unassign first.';
    if (c['status'] == 'Closed') throw 'Cannot assign to a Closed camp';
    await Api.update('volunteers', volId, {'camp_id': campId});
  }
}