class AppConstants {
  const AppConstants._();

  static const String appName = 'ojao';
  static const String appTagline =
      'Premium Healthcare Patient Flow & Virtual Queue Solution';
  static const String defaultRazorpayKey = 'rzp_test_REPLACE_ME';

  /// Base URL of the self-hosted OTP + auth service (EC2 behind Nginx/HTTPS).
  /// The Flutter app POSTs to `$apiBaseUrl/auth/...` for OTP send, register,
  /// and password reset; Firebase Auth still handles the actual sign-in.
  static const String apiBaseUrl = 'https://api.ojao.in';

  /// Base URL of the target REST backend (`api/` service — ARCHITECTURE.md).
  /// Owns PostGIS hospital discovery at `$hospitalApiBaseUrl/api/v1/hospitals/...`.
  /// Defaults to the same host; override per-build with
  /// `--dart-define=HOSPITAL_API_BASE_URL=...`.
  static const String hospitalApiBaseUrl = String.fromEnvironment(
    'HOSPITAL_API_BASE_URL',
    defaultValue: 'https://api.ojao.in',
  );

  /// Migration flag (delivery step 3): when true, hospital discovery reads from
  /// the backend `/api/v1/hospitals/nearby` endpoint (server-side PostGIS
  /// distance) instead of Firestore + client-side sorting. Off by default until
  /// the backend is deployed and the facility→hospital ID mapping is resolved.
  /// Toggle per-build with `--dart-define=USE_HOSPITAL_API=true`.
  static const bool useHospitalApi = bool.fromEnvironment(
    'USE_HOSPITAL_API',
    defaultValue: false,
  );

  static const Duration otpResendCooldown = Duration(seconds: 30);
  static const Duration defaultNetworkTimeout = Duration(seconds: 30);
}
