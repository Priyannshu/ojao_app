import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:ojao_app/core/constants/app_constants.dart';
import 'package:ojao_app/data/models/nearby_hospital.dart';

/// Client for the target REST backend's hospital discovery endpoints
/// (ARCHITECTURE.md sections 3 & 7). Read-only and unauthenticated: nearby
/// search is public. Distance and the active/verified filter are enforced on
/// the server, so this client just parcels up coordinates and parses results.
class HospitalApiService {
  final http.Client _client;
  const HospitalApiService(this._client);

  String get _base => AppConstants.hospitalApiBaseUrl;

  /// Fetches verified hospitals near [latitude]/[longitude], nearest first.
  ///
  /// [radiusMeters] and [limit] are optional; the server clamps them to its
  /// configured maxima. Throws [HospitalApiException] on a non-2xx response so
  /// callers can surface the backend's user-facing message.
  Future<List<NearbyHospital>> nearby({
    required double latitude,
    required double longitude,
    int? radiusMeters,
    int? limit,
  }) async {
    final uri = Uri.parse('$_base/api/v1/hospitals/nearby').replace(
      queryParameters: <String, String>{
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        if (radiusMeters != null) 'radiusMeters': radiusMeters.toString(),
        if (limit != null) 'limit': limit.toString(),
      },
    );

    final res = await _client
        .get(uri, headers: const {'Accept': 'application/json'})
        .timeout(AppConstants.defaultNetworkTimeout);

    final body = _decode(res);
    final results = (body['results'] as List<dynamic>? ?? const [])
        .map((e) => NearbyHospital.fromJson(e as Map<String, dynamic>))
        .toList();
    return results;
  }

  /// Full public profile for a single verified hospital.
  Future<NearbyHospital> getById(String hospitalId) async {
    final uri = Uri.parse('$_base/api/v1/hospitals/$hospitalId');
    final res = await _client
        .get(uri, headers: const {'Accept': 'application/json'})
        .timeout(AppConstants.defaultNetworkTimeout);
    return NearbyHospital.fromJson(_decode(res));
  }

  Map<String, dynamic> _decode(http.Response res) {
    Map<String, dynamic> data;
    try {
      data = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw const HospitalApiException(
          'Could not reach the hospital service. Please try again.');
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw HospitalApiException(
        (data['message'] as String?) ??
            'Something went wrong. Please try again.',
        code: data['error'] as String?,
        statusCode: res.statusCode,
      );
    }
    return data;
  }
}

/// Error carrying the backend's stable code + user-facing message.
class HospitalApiException implements Exception {
  final String message;
  final String? code;
  final int? statusCode;
  const HospitalApiException(this.message, {this.code, this.statusCode});

  @override
  String toString() => 'HospitalApiException($code, $message)';
}

final hospitalApiServiceProvider = Provider<HospitalApiService>((ref) {
  final client = http.Client();
  ref.onDispose(client.close);
  return HospitalApiService(client);
});
