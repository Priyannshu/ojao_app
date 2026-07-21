import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

/// Why the app doesn't currently have a usable position. Screens map these to
/// friendly copy and the right call to action (open settings vs. retry).
enum LocationFailure {
  /// Device location (GPS) is switched off system-wide.
  serviceDisabled,

  /// The user declined the runtime permission this session.
  permissionDenied,

  /// The user selected "Don't ask again" / denied forever — must go to
  /// system settings to re-enable.
  permissionDeniedForever,

  /// Getting a fix failed for another reason (timeout, hardware, etc.).
  unavailable,
}

/// A resolved location outcome: either coordinates or a typed failure.
class LocationResult {
  final Position? position;
  final LocationFailure? failure;

  const LocationResult.success(this.position) : failure = null;
  const LocationResult.failed(this.failure) : position = null;

  bool get ok => position != null;
}

/// Wraps geolocator with the full permission dance so callers get one simple
/// call: check service -> check/request permission -> get position, each step
/// short-circuiting to a typed [LocationFailure].
class LocationService {
  const LocationService();

  Future<LocationResult> getCurrentLocation() async {
    // 1. Is device location turned on at all?
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return const LocationResult.failed(LocationFailure.serviceDisabled);
    }

    // 2. Do we have permission? Request it if not yet decided.
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) {
      return const LocationResult.failed(
          LocationFailure.permissionDeniedForever);
    }
    if (permission == LocationPermission.denied) {
      return const LocationResult.failed(LocationFailure.permissionDenied);
    }

    // 3. Permission granted — get a fix.
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 15),
        ),
      );
      return LocationResult.success(position);
    } catch (_) {
      // Fall back to the last known position if a live fix times out.
      final last = await Geolocator.getLastKnownPosition();
      if (last != null) return LocationResult.success(last);
      return const LocationResult.failed(LocationFailure.unavailable);
    }
  }

  /// Opens the OS location settings so the user can re-enable a
  /// permanently-denied permission or turn the service back on.
  Future<void> openSettings() => Geolocator.openAppSettings();
}

final locationServiceProvider =
    Provider<LocationService>((ref) => const LocationService());
