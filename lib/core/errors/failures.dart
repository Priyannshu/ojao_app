class Failure implements Exception {
  final String message;
  final String? code;
  const Failure({required this.message, this.code});

  @override
  String toString() => 'Failure($code): $message';
}

class AuthFailure extends Failure {
  const AuthFailure({required super.message}) : super(code: 'auth');
}

class PaymentFailure extends Failure {
  const PaymentFailure({required super.message}) : super(code: 'payment');
}

class Result<T> {
  final T? data;
  final Failure? failure;
  const Result._({this.data, this.failure});
  const Result.success(T value) : this._(data: value);
  const Result.failure(Failure f) : this._(failure: f);

  bool get isSuccess => failure == null;
  bool get isFailure => failure != null;

  R when<R>({required R Function(T value) success, required R Function(Failure f) failure}) {
    if (this.failure != null) return failure(this.failure!);
    return success(data as T);
  }
}
