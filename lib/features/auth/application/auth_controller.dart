import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/user_model.dart';
import 'package:ojao_app/data/services/auth_service.dart';
import 'package:ojao_app/data/services/fcm_service.dart';
import 'package:ojao_app/data/services/firestore_service.dart';

enum AuthStep { phoneInput, otpInput, complete }

class AuthState {
  final UserRole role;
  final AuthStep step;
  final String? phoneNumber;
  final String? verificationId;
  final UserModel? user;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.role = UserRole.patient,
    this.step = AuthStep.phoneInput,
    this.phoneNumber,
    this.verificationId,
    this.user,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    UserRole? role,
    AuthStep? step,
    String? phoneNumber,
    String? verificationId,
    UserModel? user,
    bool? isLoading,
    String? error,
    bool clearError = false,
    bool clearVerificationId = false,
  }) {
    return AuthState(
      role: role ?? this.role,
      step: step ?? this.step,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      verificationId: clearVerificationId
          ? null
          : (verificationId ?? this.verificationId),
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthController extends AsyncNotifier<AuthState> {
  late final AuthService _authService;
  late final FirestoreService _fs;
  late final FcmService _fcm;

  @override
  Future<AuthState> build() async {
    _authService = AuthService();
    _fs = FirestoreService();
    _fcm = FcmService();

    // Push-notification setup must never gate the app's startup. On some
    // devices/emulators FirebaseMessaging.requestPermission() can hang or
    // throw; awaiting it here previously left the app stuck on the splash
    // screen forever. Fire it off in the background and swallow failures.
    unawaited(_initFcmSafely());

    // Reading the signed-in user's profile is the one thing that gates
    // startup, so bound it with a timeout — a misconfigured or unreachable
    // Firestore backend should surface as "signed out", not an infinite splash.
    final user = _authService.currentUser;
    if (user != null) {
      try {
        final snap = await _fs
            .getDoc(FirestorePaths.user(user.uid))
            .timeout(const Duration(seconds: 10));
        if (snap.exists) {
          final model = UserModel.fromJson(snap.data()!);
          return AuthState(
            role: model.role,
            step: AuthStep.complete,
            user: model,
            phoneNumber: model.phoneNumber,
          );
        }
      } catch (_) {
        // Fall through to the signed-out state so the app reaches the login
        // screen instead of hanging when the profile read fails or times out.
      }
    }
    return const AuthState();
  }

  Future<void> _initFcmSafely() async {
    try {
      await _fcm.init().timeout(const Duration(seconds: 10));
    } catch (_) {
      // Notifications are non-essential to sign-in; ignore setup failures.
    }
  }

  Future<void> sendOtp(String phone, {UserRole? role}) async {
    final current = state.value ?? const AuthState();
    state = AsyncData(current.copyWith(isLoading: true, clearError: true));
    try {
      await _authService.verifyPhoneNumber(
        phoneNumber: phone,
        verificationCompleted: (_) {},
        verificationFailed: (e) {
          state = AsyncData(
            current.copyWith(
              isLoading: false,
              error: e.message ?? 'OTP failed',
            ),
          );
        },
        codeSent: (vid, _) {
          state = AsyncData(
            current.copyWith(
              isLoading: false,
              step: AuthStep.otpInput,
              phoneNumber: phone,
              verificationId: vid,
              role: role ?? current.role,
            ),
          );
        },
        autoRetrievalTimeout: (_) {},
      );
    } catch (e) {
      state = AsyncData(
        current.copyWith(isLoading: false, error: e.toString()),
      );
    }
  }

  Future<void> verifyOtp(String smsCode) async {
    final current = state.value ?? const AuthState();
    if (current.verificationId == null) return;
    state = AsyncData(current.copyWith(isLoading: true, clearError: true));
    try {
      final cred = await _authService.verifyOtp(
        smsCode: smsCode,
        verificationId: current.verificationId!,
      );
      final firebaseUser = cred.user;
      if (firebaseUser == null) throw Exception('User is null after OTP');
      final snap = await _fs.getDoc(FirestorePaths.user(firebaseUser.uid));
      if (!snap.exists) {
        final model = UserModel(
          uid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber ?? current.phoneNumber ?? '',
          role: current.role,
          createdAt: DateTime.now(),
          isVerified: true,
        );
        await _fs.setDoc(FirestorePaths.user(firebaseUser.uid), model.toJson());
        state = AsyncData(
          current.copyWith(
            isLoading: false,
            step: AuthStep.complete,
            user: model,
          ),
        );
      } else {
        final model = UserModel.fromJson(snap.data()!);
        state = AsyncData(
          current.copyWith(
            isLoading: false,
            step: AuthStep.complete,
            user: model,
          ),
        );
      }
    } catch (e) {
      state = AsyncData(
        current.copyWith(isLoading: false, error: e.toString()),
      );
    }
  }

  // --- Phone + password auth (Fast2SMS OTP) --------------------------------

  /// Maps backend/Firebase errors to short, user-facing messages.
  String _friendlyError(Object e) {
    if (e is FirebaseAuthException) {
      switch (e.code) {
        case 'wrong-password':
        case 'invalid-credential':
          return 'Incorrect mobile number or password.';
        case 'user-not-found':
          return 'No account found for this number.';
        case 'too-many-requests':
          return 'Too many attempts. Please try again later.';
        default:
          return e.message ?? 'Sign-in failed. Please try again.';
      }
    }
    // Errors thrown by AuthService._post carry the server's user-facing
    // message (e.g. "That number is already registered."). Surface it.
    final msg = e.toString().replaceFirst('Exception: ', '');
    return msg.isEmpty ? 'Something went wrong. Please try again.' : msg;
  }

  /// Requests an OTP for registration or password reset. [purpose] is
  /// 'register' or 'reset'. Returns true when the SMS was sent.
  Future<bool> sendPhoneOtp({
    required String mobile,
    required String purpose,
  }) async {
    final current = state.value ?? const AuthState();
    state = AsyncData(current.copyWith(isLoading: true, clearError: true));
    try {
      await _authService.sendPhoneOtp(mobile: mobile, purpose: purpose);
      state = AsyncData(current.copyWith(isLoading: false));
      return true;
    } catch (e) {
      state = AsyncData(
        current.copyWith(isLoading: false, error: _friendlyError(e)),
      );
      return false;
    }
  }

  /// Registers a new account (verifies OTP server-side) and signs in.
  Future<bool> registerWithOtp({
    required String mobile,
    required String name,
    required String email,
    required String password,
    required String code,
  }) async {
    final current = state.value ?? const AuthState();
    state = AsyncData(current.copyWith(isLoading: true, clearError: true));
    try {
      final cred = await _authService.registerWithOtp(
        mobile: mobile,
        name: name,
        email: email,
        password: password,
        code: code,
      );
      await _completeSignIn(cred);
      return true;
    } catch (e) {
      state = AsyncData(
        current.copyWith(isLoading: false, error: _friendlyError(e)),
      );
      return false;
    }
  }

  /// Signs in with mobile number + 6-digit password.
  Future<bool> loginWithPassword({
    required String mobile,
    required String password,
  }) async {
    final current = state.value ?? const AuthState();
    state = AsyncData(current.copyWith(isLoading: true, clearError: true));
    try {
      final cred = await _authService.loginWithPassword(
        mobile: mobile,
        password: password,
      );
      await _completeSignIn(cred);
      return true;
    } catch (e) {
      state = AsyncData(
        current.copyWith(isLoading: false, error: _friendlyError(e)),
      );
      return false;
    }
  }

  /// Signs in with Google and creates a patient profile on first use.
  Future<bool> signInWithGoogle() async {
    final current = state.value ?? const AuthState();
    state = AsyncData(current.copyWith(isLoading: true, clearError: true));
    try {
      final cred = await _authService.signInWithGoogle();
      if (cred == null) {
        state = AsyncData(current.copyWith(isLoading: false, clearError: true));
        return false;
      }

      final firebaseUser = cred.user;
      if (firebaseUser == null) {
        throw FirebaseAuthException(
          code: 'google-sign-in-failed',
          message: 'Google sign-in failed. Please try again.',
        );
      }

      final path = FirestorePaths.user(firebaseUser.uid);
      final snap = await _fs.getDoc(path);
      if (!snap.exists) {
        final model = UserModel(
          uid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber ?? '',
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          role: UserRole.patient,
          isVerified: firebaseUser.emailVerified,
          createdAt: DateTime.now(),
        );
        await _fs.setDoc(path, model.toJson());
        state = AsyncData(
          AuthState(
            role: model.role,
            step: AuthStep.complete,
            user: model,
            phoneNumber: model.phoneNumber,
          ),
        );
      } else {
        final model = UserModel.fromJson(snap.data()!);
        state = AsyncData(
          AuthState(
            role: model.role,
            step: AuthStep.complete,
            user: model,
            phoneNumber: model.phoneNumber,
          ),
        );
      }
      return true;
    } catch (e) {
      state = AsyncData(
        current.copyWith(isLoading: false, error: _friendlyError(e)),
      );
      return false;
    }
  }

  /// Signs out of Firebase and immediately publishes an unauthenticated state
  /// so GoRouter can redirect without waiting for provider invalidation.
  Future<bool> signOut() async {
    final current = state.value ?? const AuthState();
    try {
      await _authService.signOut();
      state = const AsyncData(AuthState());
      return true;
    } catch (e) {
      state = AsyncData(current.copyWith(error: _friendlyError(e)));
      return false;
    }
  }

  /// Resets the password after OTP verification and signs in.
  Future<bool> resetPasswordWithOtp({
    required String mobile,
    required String password,
    required String code,
  }) async {
    final current = state.value ?? const AuthState();
    state = AsyncData(current.copyWith(isLoading: true, clearError: true));
    try {
      final cred = await _authService.resetPasswordWithOtp(
        mobile: mobile,
        password: password,
        code: code,
      );
      await _completeSignIn(cred);
      return true;
    } catch (e) {
      state = AsyncData(
        current.copyWith(isLoading: false, error: _friendlyError(e)),
      );
      return false;
    }
  }

  /// Loads the profile for a freshly signed-in credential and moves auth to
  /// the completed state. The profile doc is written by the Cloud Function on
  /// register, so it should exist; we tolerate a brief miss on reset/login.
  Future<void> _completeSignIn(UserCredential cred) async {
    final firebaseUser = cred.user;
    final current = state.value ?? const AuthState();
    if (firebaseUser == null) {
      state = AsyncData(
        current.copyWith(
          isLoading: false,
          error: 'Sign-in failed. Please try again.',
        ),
      );
      return;
    }
    UserModel? model;
    try {
      final snap = await _fs.getDoc(FirestorePaths.user(firebaseUser.uid));
      if (snap.exists) model = UserModel.fromJson(snap.data()!);
    } catch (_) {
      // Ignore — fall back to a minimal model below.
    }
    model ??= UserModel(
      uid: firebaseUser.uid,
      phoneNumber: firebaseUser.phoneNumber ?? current.phoneNumber ?? '',
      role: UserRole.patient,
      isVerified: true,
    );
    state = AsyncData(
      current.copyWith(
        isLoading: false,
        step: AuthStep.complete,
        user: model,
        role: model.role,
        phoneNumber: model.phoneNumber,
      ),
    );
  }
}

final authControllerProvider = AsyncNotifierProvider<AuthController, AuthState>(
  AuthController.new,
);
