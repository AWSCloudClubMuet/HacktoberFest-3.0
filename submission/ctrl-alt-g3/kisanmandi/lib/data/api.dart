import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../domain/models.dart';

class ApiException implements Exception {
  final String message;
  final int? status;
  ApiException(this.message, [this.status]);
  @override
  String toString() => message;
}

class Api {
  final http.Client client;
  String baseUrl;
  String? token;
  Api(this.baseUrl, {http.Client? client}) : client = client ?? http.Client();

  Future<dynamic> request(String method, String path, [Json? body]) async {
    try {
      final req = http.Request(
        method,
        Uri.parse('${baseUrl.replaceAll(RegExp(r'/+$'), '')}/$path'),
      );
      req.headers['Content-Type'] = 'application/json';
      if (token != null) req.headers['Authorization'] = 'Bearer $token';
      if (body != null) req.body = jsonEncode(body);
      final response = await http.Response.fromStream(
        await client.send(req).timeout(const Duration(seconds: 12)),
      ).timeout(const Duration(seconds: 12));
      final data = jsonDecode(response.body);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(
          data is Map ? data['error'] ?? 'Request failed' : 'Request failed',
          response.statusCode,
        );
      }
      if (response.headers['x-session-token'] case final String newToken) {
        token = newToken;
      }
      return data;
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw ApiException(
        'The API took too long. Check the server and try again.',
      );
    } on FormatException {
      throw ApiException(
        'The server returned an unexpected response. Check the API address.',
      );
    } catch (_) {
      throw ApiException(
        'Cannot reach the mock API. Start the server and check the API address.',
      );
    }
  }

  Future<List<Json>> all(String path) async =>
      (await request('GET', path) as List).map((e) => Json.from(e)).toList();
  void dispose() => client.close();
}
