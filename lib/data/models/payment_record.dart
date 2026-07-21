import 'package:equatable/equatable.dart';

enum PaymentStatus { pending, completed, failed, refunded }

class PaymentRecord extends Equatable {
  final String id;
  final String userId;
  final String appointmentId;
  final double amount;
  final String currency;
  final PaymentStatus status;
  final String? razorpayOrderId;
  final String? razorpayPaymentId;
  final String? razorpaySignature;
  final String? description;
  final DateTime createdAt;
  final DateTime? paidAt;

  const PaymentRecord({
    required this.id,
    required this.userId,
    required this.appointmentId,
    required this.amount,
    required this.currency,
    required this.status,
    this.razorpayOrderId,
    this.razorpayPaymentId,
    this.razorpaySignature,
    this.description,
    required this.createdAt,
    this.paidAt,
  });

  factory PaymentRecord.fromJson(Map<String, dynamic> json) {
    return PaymentRecord(
      id: json['id'] as String,
      userId: json['userId'] as String,
      appointmentId: json['appointmentId'] as String,
      amount: (json['amount'] as num).toDouble(),
      currency: json['currency'] as String? ?? 'INR',
      status: PaymentStatus.values.byName(json['status'] as String? ?? 'pending'),
      razorpayOrderId: json['razorpayOrderId'] as String?,
      razorpayPaymentId: json['razorpayPaymentId'] as String?,
      razorpaySignature: json['razorpaySignature'] as String?,
      description: json['description'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      paidAt: json['paidAt'] != null ? DateTime.parse(json['paidAt'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'userId': userId,
        'appointmentId': appointmentId,
        'amount': amount,
        'currency': currency,
        'status': status.name,
        if (razorpayOrderId != null) 'razorpayOrderId': razorpayOrderId,
        if (razorpayPaymentId != null) 'razorpayPaymentId': razorpayPaymentId,
        if (razorpaySignature != null) 'razorpaySignature': razorpaySignature,
        if (description != null) 'description': description,
        'createdAt': createdAt.toIso8601String(),
        if (paidAt != null) 'paidAt': paidAt!.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, userId, appointmentId, amount, currency, status, razorpayOrderId, createdAt];
}
