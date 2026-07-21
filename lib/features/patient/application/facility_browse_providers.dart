import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/core/utils/geo_utils.dart';
import 'package:ojao_app/data/models/facility.dart';
import 'package:ojao_app/features/patient/application/location_controller.dart';
import 'package:ojao_app/features/patient/application/patient_providers.dart';

/// A facility paired with its distance from the patient, if a location is
/// known. [distanceKm] is null when location is unavailable/denied — the UI
/// then shows the facility without a distance chip and keeps a stable order.
class FacilityWithDistance {
  final Facility facility;
  final double? distanceKm;

  const FacilityWithDistance(this.facility, this.distanceKm);

  String? get distanceLabel =>
      distanceKm == null ? null : GeoUtils.formatDistance(distanceKm!);
}

/// All active facilities decorated with distance and sorted nearest-first.
///
/// When no position is available the list falls back to alphabetical order so
/// the screen is still useful (and deterministic) without location access.
final facilitiesWithDistanceProvider =
    Provider<List<FacilityWithDistance>>((ref) {
  final facilities = ref.watch(facilitiesProvider).valueOrNull ?? const [];
  final position = ref.watch(currentPositionProvider);

  final decorated = facilities.map((f) {
    final dist = position == null
        ? null
        : GeoUtils.distanceKm(
            position.latitude, position.longitude, f.latitude, f.longitude);
    return FacilityWithDistance(f, dist);
  }).toList();

  decorated.sort((a, b) {
    if (a.distanceKm != null && b.distanceKm != null) {
      return a.distanceKm!.compareTo(b.distanceKm!);
    }
    return a.facility.name.compareTo(b.facility.name);
  });
  return decorated;
});

/// Nearest facilities of a single [FacilityType], for the category list screen.
final facilitiesByTypeProvider =
    Provider.family<List<FacilityWithDistance>, FacilityType>((ref, type) {
  return ref
      .watch(facilitiesWithDistanceProvider)
      .where((f) => f.facility.type == type)
      .toList();
});

/// How many active facilities exist per type, for the category tile counts.
final facilityTypeCountsProvider = Provider<Map<FacilityType, int>>((ref) {
  final facilities = ref.watch(facilitiesProvider).valueOrNull ?? const [];
  final counts = <FacilityType, int>{for (final t in FacilityType.values) t: 0};
  for (final f in facilities) {
    counts[f.type] = (counts[f.type] ?? 0) + 1;
  }
  return counts;
});
