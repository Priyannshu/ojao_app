import 'package:equatable/equatable.dart';
import 'package:ojao_app/data/models/facility.dart';

/// A hospital returned by the backend nearby-search endpoint
/// (`GET /api/v1/hospitals/nearby`). Distance is computed **server-side** with
/// PostGIS, so the client no longer sorts by distance itself — it simply
/// displays [distanceMeters] (ARCHITECTURE.md section 3).
class NearbyHospital extends Equatable {
  final String id;
  final String displayName;
  final String? description;
  final String? phone;
  final String? emergencyPhone;
  final String address;
  final bool emergencyAvailable;
  final double latitude;
  final double longitude;

  /// Backend-computed distance in meters. Null only if the API omitted it.
  final int? distanceMeters;

  const NearbyHospital({
    required this.id,
    required this.displayName,
    required this.latitude,
    required this.longitude,
    this.description,
    this.phone,
    this.emergencyPhone,
    this.address = '',
    this.emergencyAvailable = false,
    this.distanceMeters,
  });

  double? get distanceKm =>
      distanceMeters == null ? null : distanceMeters! / 1000.0;

  factory NearbyHospital.fromJson(Map<String, dynamic> json) {
    // The API nests address parts under `address`; flatten to a single line the
    // existing facility card can render.
    final addr = json['address'] as Map<String, dynamic>?;
    final line = <String?>[
      addr?['line1'] as String?,
      addr?['line2'] as String?,
      addr?['city'] as String?,
      addr?['state'] as String?,
      addr?['postalCode'] as String?,
    ].where((s) => s != null && s.trim().isNotEmpty).join(', ');

    return NearbyHospital(
      id: json['id'] as String,
      displayName: json['displayName'] as String? ?? 'Hospital',
      description: json['description'] as String?,
      phone: json['phone'] as String?,
      emergencyPhone: json['emergencyPhone'] as String?,
      address: line,
      emergencyAvailable: json['emergencyAvailable'] as bool? ?? false,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      distanceMeters: (json['distanceMeters'] as num?)?.toInt(),
    );
  }

  /// Adapts to the existing [Facility] shape so current UI widgets
  /// (FacilityCard, department flow) keep working during the migration. All
  /// backend hospitals map to [FacilityType.hospital] for now — the target
  /// schema doesn't yet distinguish clinic/diagnostic/pharmacy.
  Facility toFacility() => Facility(
        id: id,
        name: displayName,
        type: FacilityType.hospital,
        address: address,
        latitude: latitude,
        longitude: longitude,
      );

  @override
  List<Object?> get props => [
        id,
        displayName,
        description,
        phone,
        emergencyPhone,
        address,
        emergencyAvailable,
        latitude,
        longitude,
        distanceMeters,
      ];
}
