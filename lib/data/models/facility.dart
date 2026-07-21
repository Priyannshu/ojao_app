import 'package:equatable/equatable.dart';

/// The kind of healthcare facility. The patient home screen groups the
/// near-me list by these categories (Hospitals / Clinics / Diagnostic
/// Centers / Pharmacies).
enum FacilityType { hospital, clinic, diagnostic, pharmacy }

extension FacilityTypeX on FacilityType {
  /// Human-readable singular label.
  String get label {
    switch (this) {
      case FacilityType.hospital:
        return 'Hospital';
      case FacilityType.clinic:
        return 'Clinic';
      case FacilityType.diagnostic:
        return 'Diagnostic Center';
      case FacilityType.pharmacy:
        return 'Pharmacy';
    }
  }

  /// Human-readable plural label (used for category tiles).
  String get pluralLabel {
    switch (this) {
      case FacilityType.hospital:
        return 'Hospitals';
      case FacilityType.clinic:
        return 'Clinics';
      case FacilityType.diagnostic:
        return 'Diagnostic Centers';
      case FacilityType.pharmacy:
        return 'Pharmacies';
    }
  }
}

/// A physical healthcare location with its own departments, queue and
/// appointments. Facilities are the tenant boundary in the data model:
/// everything queue-related lives under `facilities/{id}/...`.
class Facility extends Equatable {
  final String id;
  final String name;
  final FacilityType type;
  final String address;

  /// Geographic coordinates, used to sort facilities by distance from the
  /// patient's current location.
  final double latitude;
  final double longitude;

  /// Average patient rating, 0–5. Display only.
  final double rating;

  /// Rough count of departments open for booking; shown on the list card.
  final int departmentCount;

  final bool isActive;

  const Facility({
    required this.id,
    required this.name,
    required this.type,
    required this.address,
    required this.latitude,
    required this.longitude,
    this.rating = 0.0,
    this.departmentCount = 0,
    this.isActive = true,
  });

  factory Facility.fromJson(Map<String, dynamic> json) {
    return Facility(
      id: json['id'] as String,
      name: json['name'] as String,
      type: FacilityType.values.byName(json['type'] as String? ?? 'clinic'),
      address: json['address'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      departmentCount: (json['departmentCount'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'type': type.name,
        'address': address,
        'latitude': latitude,
        'longitude': longitude,
        'rating': rating,
        'departmentCount': departmentCount,
        'isActive': isActive,
      };

  @override
  List<Object?> get props =>
      [id, name, type, address, latitude, longitude, rating, departmentCount, isActive];
}
