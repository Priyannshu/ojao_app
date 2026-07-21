import 'package:cloud_functions/cloud_functions.dart' hide Result;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:ojao_app/core/errors/failures.dart';
import 'package:ojao_app/data/models/payment_record.dart';
import 'package:ojao_app/data/services/appointment_service.dart';
import 'package:ojao_app/data/services/firestore_service.dart';

class PaymentService {
  final FirestoreService _fs;
  final FirebaseFunctions _functions;
  final FirebaseAuth _auth;
  final Razorpay _razorpay = Razorpay();

  PaymentService(this._fs, this._functions, this._auth);

  Future<Result<String>> createOrder({required double amount, required String appointmentId}) async {
    try {
      final callable = _functions.httpsCallable('createRazorpayOrder');
      final result = await callable.call(<String, dynamic>{
        'amount': amount,
        'currency': 'INR',
        'userId': _auth.currentUser?.uid ?? '',
        'appointmentId': appointmentId,
      });
      final orderId = result.data?['orderId'] as String?;
      if (orderId == null) return const Result.failure(PaymentFailure(message: 'No order ID'));
      return Result.success(orderId);
    } catch (e) {
      return Result.failure(PaymentFailure(message: e.toString()));
    }
  }

  Future<Result<PaymentRecord>> verifyPayment({
    required String facilityId,
    required String orderId,
    required String paymentId,
    required String signature,
    required String appointmentId,
  }) async {
    try {
      final callable = _functions.httpsCallable('verifyRazorpayPayment');
      final result = await callable.call(<String, dynamic>{
        'razorpayOrderId': orderId,
        'razorpayPaymentId': paymentId,
        'razorpaySignature': signature,
        'appointmentId': appointmentId,
      });
      final success = result.data?['success'] as bool? ?? false;
      final record = PaymentRecord(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: _auth.currentUser?.uid ?? '',
        appointmentId: appointmentId,
        amount: (result.data?['amount'] as num?)?.toDouble() ?? 0.0,
        currency: 'INR',
        status: success ? PaymentStatus.completed : PaymentStatus.failed,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        createdAt: DateTime.now(),
        paidAt: success ? DateTime.now() : null,
      );
      await _fs.setDoc(
          FirestorePaths.payment(facilityId, record.id), record.toJson());
      return Result.success(record);
    } catch (e) {
      return Result.failure(PaymentFailure(message: e.toString()));
    }
  }

  void openRazorpayCheckout(Map<String, dynamic> options) {
    _razorpay.open(options);
  }

  void on(String event, Function(dynamic) handler) => _razorpay.on(event, handler);
  void dispose() => _razorpay.clear();
}

final paymentServiceProvider = Provider<PaymentService>((ref) => PaymentService(
      ref.watch(firestoreServiceProvider),
      ref.watch(firebaseFunctionsProvider),
      FirebaseAuth.instance,
    ));
