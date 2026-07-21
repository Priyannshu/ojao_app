import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/data/models/facility.dart';
import 'package:ojao_app/data/models/user_model.dart';
import 'package:ojao_app/features/auth/application/auth_controller.dart';
import 'package:ojao_app/features/auth/presentation/screens/otp_verify_screen.dart';
import 'package:ojao_app/features/auth/presentation/screens/login_screen.dart';
import 'package:ojao_app/features/auth/presentation/screens/register_screen.dart';
import 'package:ojao_app/features/auth/presentation/screens/forgot_password_screen.dart';
import 'package:ojao_app/features/auth/presentation/screens/phone_input_screen.dart';
import 'package:ojao_app/features/auth/presentation/screens/splash_screen.dart';
import 'package:ojao_app/features/patient/presentation/screens/patient_shell.dart';
import 'package:ojao_app/features/patient/presentation/screens/facility_list_screen.dart';
import 'package:ojao_app/features/patient/presentation/screens/book_appointment_screen.dart';
import 'package:ojao_app/features/patient/presentation/screens/department_detail_screen.dart';
import 'package:ojao_app/features/patient/presentation/screens/facility_home_screen.dart';
import 'package:ojao_app/features/patient/presentation/screens/token_tracking_screen.dart';
import 'package:ojao_app/features/patient/presentation/screens/video_consult_screen.dart';
import 'package:ojao_app/features/staff/presentation/screens/staff_shell.dart';
import 'package:ojao_app/features/staff/presentation/screens/token_detail_screen.dart';

/// Named route paths used across the app. Kept in one place so links stay
/// in sync with the [GoRouter] configuration below.
class AppRoutes {
  const AppRoutes._();

  static const splash = '/';
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const forgotPassword = '/auth/forgot';
  static const phone = '/auth/phone';
  static const otp = '/auth/otp';

  static const patientHome = '/patient';
  static const patientAppointments = '/patient/appointments';
  static const patientProfile = '/patient/profile';
  static const facilityList = '/patient/facilities'; // + /:type
  static const facilityHome = '/patient/facility'; // selected facility's departments
  static const departmentDetail = '/patient/department'; // + /:deptId
  static const bookAppointment = '/patient/book'; // + /:deptId
  static const tokenTracking = '/patient/token'; // + /:tokenId
  static const videoConsult = '/patient/consult'; // + /:appointmentId

  static const staffHome = '/staff';
  static const staffQueue = '/staff/queue';
  static const staffAnalytics = '/staff/analytics';
  static const tokenDetail = '/staff/token'; // + /:tokenId
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _AuthRefreshNotifier(ref);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    refreshListenable: refresh,
    debugLogDiagnostics: kDebugMode,
    redirect: (context, state) {
      final authAsync = ref.read(authControllerProvider);

      // While auth state is resolving, hold on the splash screen.
      if (authAsync.isLoading && !authAsync.hasValue) {
        return AppRoutes.splash;
      }

      // If auth initialization errored (e.g. backend unreachable), don't sit
      // on splash forever — send the user into the sign-in flow.
      if (authAsync.hasError && !authAsync.hasValue) {
        final loc = state.matchedLocation;
        return loc == AppRoutes.login ? null : AppRoutes.login;
      }

      final auth = authAsync.valueOrNull;
      if (auth == null) return AppRoutes.splash;

      final loc = state.matchedLocation;
      final onSplash = loc == AppRoutes.splash;
      final inAuthFlow = loc.startsWith('/auth');
      final signedIn = auth.step == AuthStep.complete && auth.user != null;

      if (!signedIn) {
        // Mid phone/SMS-OTP flow: keep the user on the OTP screen.
        if (auth.step == AuthStep.otpInput) {
          return inAuthFlow && loc == AppRoutes.otp ? null : AppRoutes.otp;
        }
        // Otherwise allow any /auth screen (login, register, forgot, phone);
        // default unauthenticated entry is the password login screen.
        return inAuthFlow ? null : AppRoutes.login;
      }

      // Authenticated: send to the correct role home if sitting on
      // splash/auth screens; otherwise leave navigation alone.
      final home = auth.user!.isStaff ? AppRoutes.staffHome : AppRoutes.patientHome;
      if (onSplash || inAuthFlow) return home;

      // Guard against cross-role deep links.
      final isStaff = auth.user!.role != UserRole.patient;
      if (isStaff && loc.startsWith('/patient')) return AppRoutes.staffHome;
      if (!isStaff && loc.startsWith('/staff')) return AppRoutes.patientHome;

      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (_, _) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (_, _) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, _) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        builder: (_, _) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: AppRoutes.phone,
        builder: (_, _) => const PhoneInputScreen(),
      ),
      GoRoute(
        path: AppRoutes.otp,
        builder: (_, _) => const OtpVerifyScreen(),
      ),

      // --- Patient ---
      GoRoute(
        path: AppRoutes.patientHome,
        builder: (_, _) => const PatientShell(tab: PatientTab.home),
        routes: [
          GoRoute(
            path: 'appointments',
            builder: (_, _) => const PatientShell(tab: PatientTab.appointments),
          ),
          GoRoute(
            path: 'profile',
            builder: (_, _) => const PatientShell(tab: PatientTab.profile),
          ),
          GoRoute(
            path: 'facilities/:type',
            builder: (_, s) {
              final type = FacilityType.values.asNameMap()[
                  s.pathParameters['type']];
              // Unknown type in the URL falls back to hospitals rather than
              // crashing on a bad deep link.
              return FacilityListScreen(type: type ?? FacilityType.hospital);
            },
          ),
          GoRoute(
            path: 'facility',
            builder: (_, _) => const FacilityHomeScreen(),
          ),
          GoRoute(
            path: 'department/:deptId',
            builder: (_, s) =>
                DepartmentDetailScreen(departmentId: s.pathParameters['deptId']!),
          ),
          GoRoute(
            path: 'book/:deptId',
            builder: (_, s) =>
                BookAppointmentScreen(departmentId: s.pathParameters['deptId']!),
          ),
          GoRoute(
            path: 'token/:tokenId',
            builder: (_, s) =>
                TokenTrackingScreen(tokenId: s.pathParameters['tokenId']!),
          ),
          GoRoute(
            path: 'consult/:appointmentId',
            builder: (_, s) => VideoConsultScreen(
              appointmentId: s.pathParameters['appointmentId']!,
            ),
          ),
        ],
      ),

      // --- Staff ---
      GoRoute(
        path: AppRoutes.staffHome,
        builder: (_, _) => const StaffShell(tab: StaffTab.dashboard),
        routes: [
          GoRoute(
            path: 'queue',
            builder: (_, _) => const StaffShell(tab: StaffTab.queue),
          ),
          GoRoute(
            path: 'analytics',
            builder: (_, _) => const StaffShell(tab: StaffTab.analytics),
          ),
          GoRoute(
            path: 'token/:tokenId',
            builder: (_, s) =>
                TokenDetailScreen(tokenId: s.pathParameters['tokenId']!),
          ),
        ],
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Route not found: ${state.uri}')),
    ),
  );
});

/// Bridges Riverpod's [authControllerProvider] to a [Listenable] so GoRouter
/// re-evaluates its redirect whenever auth state changes.
class _AuthRefreshNotifier extends ChangeNotifier {
  _AuthRefreshNotifier(Ref ref) {
    _sub = ref.listen(
      authControllerProvider,
      (_, _) => notifyListeners(),
      fireImmediately: false,
    );
  }

  late final ProviderSubscription _sub;

  @override
  void dispose() {
    _sub.close();
    super.dispose();
  }
}
