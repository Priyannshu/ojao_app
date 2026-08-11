import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:ojao_app/core/constants/app_constants.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  static const String _syntheticEmailDomain = 'phone.ojao.app';

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();
  Future<void> signOut() async {
    await Future.wait([_auth.signOut(), _googleSignIn.signOut()]);
  }

  static String normalizeMobile(String mobile) =>
      mobile.replaceAll(RegExp(r'\D'), '');

  static String syntheticEmail(String mobile) =>
      '${normalizeMobile(mobile)}@$_syntheticEmailDomain';

  // --- Phone + password auth (EC2 OTP service) ------------------------------

  Future<void> sendPhoneOtp({
    required String mobile,
    required String purpose,
  }) => _post('/auth/send-otp', {'mobile': mobile, 'purpose': purpose});

  Future<UserCredential> registerWithOtp({
    required String mobile,
    required String name,
    required String email,
    required String password,
    required String code,
  }) async {
    await _post('/auth/register', {
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

  Future<UserCredential> resetPasswordWithOtp({
    required String mobile,
    required String password,
    required String code,
  }) async {
    await _post('/auth/reset-password', {
      'mobile': mobile,
      'password': password,
      'code': code,
    });
    return _auth.signInWithEmailAndPassword(
      email: syntheticEmail(mobile),
      password: password,
    );
  }

  Future<UserCredential> loginWithPassword({
    required String mobile,
    required String password,
  }) => _auth.signInWithEmailAndPassword(
    email: syntheticEmail(mobile),
    password: password,
  );

  Future<UserCredential?> signInWithGoogle() async {
    final account = await _googleSignIn.signIn();
    if (account == null) return null;

    final authentication = await account.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: authentication.accessToken,
      idToken: authentication.idToken,
    );
    return _auth.signInWithCredential(credential);
  }

  Future<void> _post(String path, Map<String, dynamic> body) async {
    final res = await http
        .post(
          Uri.parse('${AppConstants.apiBaseUrl}$path'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(AppConstants.defaultNetworkTimeout);
    if (res.statusCode != 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      throw Exception(
        data['message'] ?? 'Something went wrong. Please try again.',
      );
    }
  }

  // --- Legacy phone (SMS) sign-in — kept available -------------------------

  Future<void> verifyPhoneNumber({
    required String phoneNumber,
    required PhoneVerificationCompleted verificationCompleted,
    required PhoneVerificationFailed verificationFailed,
    required void Function(String verificationId, int? forceResendingToken)
    codeSent,
    required void Function(String verificationId) autoRetrievalTimeout,
  }) => _auth.verifyPhoneNumber(
    phoneNumber: phoneNumber,
    verificationCompleted: verificationCompleted,
    verificationFailed: verificationFailed,
    codeSent: codeSent,
    codeAutoRetrievalTimeout: autoRetrievalTimeout,
  );

  Future<UserCredential> verifyOtp({
    required String smsCode,
    required String verificationId,
  }) => _auth.signInWithCredential(
    PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    ),
  );
}
