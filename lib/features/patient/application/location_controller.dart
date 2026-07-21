import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:ojao_app/data/services/location_service.dart';

/// Holds the patient's current location, resolving it on first read and
/// exposing a [refresh] for the "enable location" call to action.
///
/// The value is a [LocationResult] rather than a raw position so the UI can
/// distinguish "still loading" (AsyncLoading) from "resolved but denied"
/// (AsyncData holding a failure) and render the right prompt.
class LocationController extends AsyncNotifier<LocationResult> {
  @override
  Future<LocationResult> build() {
    return ref.read(locationServiceProvider).getCurrentLocation();
  }

  /// Re-runs the permission + fix flow (e.g. after the user enables GPS or
  /// grants permission). Shows a spinner while it re-resolves.
  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(locationServiceProvider).getCurrentLocation(),
    );
  }

  /// Opens system settings for a permanently-denied permission.
  Future<void> openSettings() =>
      ref.read(locationServiceProvider).openSettings();
}

final locationControllerProvider =
    AsyncNotifierProvider<LocationController, LocationResult>(
  LocationController.new,
);

/// The resolved [Position], or null when unavailable/denied/still loading.
/// Facility distance sorting reads this.
final currentPositionProvider = Provider<Position?>((ref) {
  return ref.watch(locationControllerProvider).valueOrNull?.position;
});
