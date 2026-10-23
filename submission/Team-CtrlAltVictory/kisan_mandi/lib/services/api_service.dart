import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/models.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiService {
  ApiService({String? baseUrl})
      : baseUrl = baseUrl ??
            const String.fromEnvironment('API_BASE',
                defaultValue: 'http://localhost:3000');

  final String baseUrl;
  final http.Client _client = http.Client();
  static const _timeout = Duration(seconds: 10);

  Uri _uri(String path, [Map<String, String>? query]) {
    final u = Uri.parse('$baseUrl$path');
    return query == null ? u : u.replace(queryParameters: query);
  }

  Future<dynamic> _request(
    String method,
    String path, {
    Map<String, String>? query,
    Object? body,
  }) async {
    final req = http.Request(method, _uri(path, query));
    if (body != null) {
      req.headers['Content-Type'] = 'application/json';
      req.body = jsonEncode(body);
    }
    http.Response res;
    try {
      final streamed = await _client.send(req).timeout(_timeout);
      res = await http.Response.fromStream(streamed);
    } on TimeoutException {
      throw ApiException(
          'Server did not respond. Is JSON Server running at $baseUrl?');
    } catch (_) {
      throw ApiException(
          'Cannot reach server at $baseUrl. Check API_BASE / network.');
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw ApiException('Server error ${res.statusCode} on $method $path',
          statusCode: res.statusCode);
    }
    if (res.body.isEmpty) return null;
    return jsonDecode(res.body);
  }

  Future<List<T>> _list<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson, {
    Map<String, String>? query,
  }) async {
    final data = await _request('GET', path, query: query) as List<dynamic>;
    return data.map((e) => fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Crop>> getCrops() => _list('/crops', Crop.fromJson);
  Future<List<Market>> getMarkets() => _list('/markets', Market.fromJson);
  Future<List<PriceRecord>> getPrices() =>
      _list('/prices', PriceRecord.fromJson, query: {'_limit': '2000'});
  Future<List<AppUser>> getUsers() => _list('/users', AppUser.fromJson);
  Future<List<Listing>> getListings() => _list('/listings', Listing.fromJson);
  Future<List<PriceAlert>> getAlerts(int userId) =>
      _list('/alerts', PriceAlert.fromJson, query: {'userId': '$userId'});

  Future<AppUser> getUser(int id) async => AppUser.fromJson(
      await _request('GET', '/users/$id') as Map<String, dynamic>);

  Future<AppUser?> findUserByPhone(String phone) async {
    final r = await _list('/users', AppUser.fromJson, query: {'phone': phone});
    return r.isEmpty ? null : r.first;
  }

  Future<AppUser> createUser(AppUser u) async =>
      AppUser.fromJson(await _request('POST', '/users', body: u.toJson())
          as Map<String, dynamic>);

  Future<Listing> createListing(Listing l) async =>
      Listing.fromJson(await _request('POST', '/listings', body: l.toJson())
          as Map<String, dynamic>);

  Future<Listing> updateListing(Listing l) async => Listing.fromJson(
      await _request('PATCH', '/listings/${l.id}', body: l.toJson())
          as Map<String, dynamic>);

  Future<Listing> patchListing(int id, Map<String, dynamic> fields) async =>
      Listing.fromJson(await _request('PATCH', '/listings/$id', body: fields)
          as Map<String, dynamic>);

  Future<void> deleteListing(int id) => _request('DELETE', '/listings/$id');

  Future<PriceAlert> createAlert(PriceAlert a) async =>
      PriceAlert.fromJson(await _request('POST', '/alerts', body: a.toJson())
          as Map<String, dynamic>);

  Future<PriceAlert> patchAlert(int id, Map<String, dynamic> fields) async =>
      PriceAlert.fromJson(await _request('PATCH', '/alerts/$id', body: fields)
          as Map<String, dynamic>);

  Future<void> deleteAlert(int id) => _request('DELETE', '/alerts/$id');

  Future<void> patchPrice(int id, double price) =>
      _request('PATCH', '/prices/$id', body: {'price': price});
}
