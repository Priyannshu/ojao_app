import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  /// Domain for the synthetic email we register phone users under. MUST match
  /// `SYNTHETIC_EMAIL_DOMAIN` in functions/otp_auth.js.
  static const String _syntheticEmailDomain = 'phone.ojao.app';

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();
  Future<void> signOut() => _auth.signOut();

  /// Strips a mobile number to bare digits, matching the server's
  /// normalizeMobile() so the synthetic email is identical on both sides.
  static String normalizeMobile(String mobile) =>
      mobile.replaceAll(RegExp(r'\D'), '');

  /// The deterministic email Firebase Auth stores for a mobile number.
  static String syntheticEmail(String mobile) =>
      '${normalizeMobile(mobile)}@$_syntheticEmailDomain';

  // --- Phone + password auth (Fast2SMS OTP via Cloud Functions) ------------

  /// Requests an OTP SMS for [mobile]. [purpose] is 'register' or 'reset';
  /// the server validates that an account does/doesn't already exist.
  Future<void> sendPhoneOtp({
    required String mobile,
    required String purpose,
  }) async {
    await _functions.httpsCallable('sendPhoneOtp').call(<String, dynamic>{
      'mobile': mobile,
      'purpose': purpose,
    });
  }

  /// Verifies the OTP and creates the account server-side, then signs the user
  /// in with the synthetic email + password.
  Future<UserCredential> registerWithOtp({
    required String mobile,
    required String name,
    required String email,
    required String password,
    required String code,
  }) async {
    await _functions.httpsCallable('registerWithOtp').call(<String, dynamic>{
      'mobile': mobile,
      'name': name,
      'email': email,
      'password': password,
      'code': code,
    });
    return _auth.signInWithEmailAndPassword(
      email: syntheticEmail(mobile),
      password: password,
    );
  }

  /// Signs in an existing phone user with their mobile number + 6-digit
  /// password (via the synthetic email under the hood).
  Future<UserCredential> loginWithPassword({
    required String mobile,
    required String password,
  }) {
    return _auth.signInWithEmailAndPassword(
      email: syntheticEmail(mobile),
      password: password,
    );
  }

  /// Verifies the OTP and resets the account's password server-side, then
  /// signs the user in with the new password.
  Future<UserCredential> resetPasswordWithOtp({
    required String mobile,
    required String password,
    required String code,
  }) async {
    await _functions.httpsCallable('resetPasswordWithOtp').call(<String, dynamic>{
      'mobile': mobile,
      'password': password,
      'code': code,
    });
    return _auth.signInWithEmailAndPassword(
      email: syntheticEmail(mobile),
      password: password,
    );
  }

  // --- Legacy phone (SMS) sign-in — kept available -------------------------

  Future<void> verifyPhoneNumber({
    required String phoneNumber,
    required PhoneVerificationCompleted verificationCompleted,
    required PhoneVerificationFailed verificationFailed,
    required void Function(String verificationId, int? forceResendingToken) codeSent,
    required void Function(String verificationId) autoRetrievalTimeout,
  }) {
    return _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: verificationCompleted,
      verificationFailed: verificationFailed,
      codeSent: codeSent,
      codeAutoRetrievalTimeout: autoRetrievalTimeout,
    );
  }

  Future<UserCredential> verifyOtp({required String smsCode, required String verificationId}) {
    return _auth.signInWithCredential(
      PhoneAuthProvider.credential(verificationId: verificationId, smsCode: smsCode),
    );
  }
}
