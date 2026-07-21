import 'package:firebase_auth/firebase_auth.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();
  Future<void> signOut() => _auth.signOut();

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
