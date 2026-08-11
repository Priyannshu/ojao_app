import 'package:url_launcher/url_launcher.dart';

/// Opens external Google Maps for directions to a facility
/// (ARCHITECTURE.md §Google Maps).
///
/// Deliberately minimal: no map tiles, no embedded SDK, no route API call. We
/// just build the documented universal URL from the verified hospital
/// coordinates and hand off to the platform. If the native Maps app isn't
/// available, [launchUrl] falls back to opening the same URL in a browser.
class MapsLauncher {
  const MapsLauncher._();

  /// Builds `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG`.
  static Uri directionsUrl(double latitude, double longitude) {
    return Uri.https('www.google.com', '/maps/dir/', {
      'api': '1',
      'destination': '$latitude,$longitude',
    });
  }

  /// Launches directions to the given coordinates. Returns false if no handler
  /// (app or browser) could be opened, so the caller can show a message.
  static Future<bool> openDirections(double latitude, double longitude) {
    return launchUrl(
      directionsUrl(latitude, longitude),
      mode: LaunchMode.externalApplication,
    );
  }
}
