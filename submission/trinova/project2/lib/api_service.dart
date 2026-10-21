import 'dart:convert';

import 'package:http/http.dart' as http;

import 'constants.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

/// Thin wrapper over the mock API. Every read/write in the app goes through here.
class ApiService {
  final http.Client _client = http.Client();
  static const _timeout = Duration(seconds: 15);
  static const _headers = {'Content-Type': 'application/json'};

  Uri _uri(String path) => Uri.parse('$apiBaseUrl/$path');

  Future<dynamic> _run(Future<http.Response> Function() call) async {
    final http.Response response;
    try {
      response = await call().timeout(_timeout);
    } catch (_) {
      throw ApiException(
          'Cannot reach the server at $apiBaseUrl. Is the mock API running?');
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException('Server error ${response.statusCode}');
    }
    return response.body.isEmpty ? null : jsonDecode(response.body);
  }

  Future<List<Map<String, dynamic>>> list(String collection) async {
    final data = await _run(() => _client.get(_uri(collection)));
    return (data as List)
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }

  Future<Map<String, dynamic>> create(
      String collection, Map<String, dynamic> body) async {
    final data = await _run(() =>
        _client.post(_uri(collection), headers: _headers, body: jsonEncode(body)));
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> update(
      String collection, String id, Map<String, dynamic> body) async {
    final data = await _run(() => _client.put(_uri('$collection/$id'),
        headers: _headers, body: jsonEncode(body)));
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> delete(String collection, String id) async {
    await _run(() => _client.delete(_uri('$collection/$id')));
  }
}