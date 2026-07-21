import 'dart:math' as math;

/// Lightweight geographic helpers. Kept dependency-free (plain Dart math) so
/// distance sorting works even when no maps SDK is present.
class GeoUtils {
  const GeoUtils._();

  static const double _earthRadiusKm = 6371.0;

  /// Great-circle distance in kilometers between two lat/lng points using the
  /// Haversine formula. Accurate enough for "sort nearby facilities" — we only
  /// need relative ordering and a rough label, not survey precision.
  static double distanceKm(
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  ) {
    final dLat = _toRadians(lat2 - lat1);
    final dLng = _toRadians(lng2 - lng1);
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_toRadians(lat1)) *
            math.cos(_toRadians(lat2)) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return _earthRadiusKm * c;
  }

  /// Formats a distance in km into a compact, human-friendly label.
  /// Below 1 km it switches to meters ("650 m"), otherwise one decimal place.
  static String formatDistance(double km) {
    if (km < 1) return '${(km * 1000).round()} m';
    if (km < 10) return '${km.toStringAsFixed(1)} km';
    return '${km.round()} km';
  }

  static double _toRadians(double degrees) => degrees * math.pi / 180.0;
}
