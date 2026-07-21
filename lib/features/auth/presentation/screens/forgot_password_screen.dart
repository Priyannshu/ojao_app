import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/features/auth/application/auth_controller.dart';
import 'package:ojao_app/shared/widgets/primary_button.dart';

/// Reset a forgotten password:
///   1. Enter mobile number → OTP sent to that number.
///   2. Enter OTP + a new 6-digit password → reset and sign in.
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _mobileCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  bool _obscure = true;
  bool _otpSent = false;

  @override
  void dispose() {
    _mobileCtrl.dispose();
    _otpCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final digits = _mobileCtrl.text.trim().replaceAll(RegExp(r'\D'), '');
    if (digits.length < 10) {
      _formKey.currentState!.validate();
      return;
    }
    final ok = await ref.read(authControllerProvider.notifier).sendPhoneOtp(
          mobile: _mobileCtrl.text.trim(),
          purpose: 'reset',
        );
    if (ok && mounted) setState(() => _otpSent = true);
  }

  Future<void> _reset() async {
    if (!_formKey.currentState!.validate()) return;
    if (_otpCtrl.text.trim().length != 6) return;
    await ref.read(authControllerProvider.notifier).resetPasswordWithOtp(
          mobile: _mobileCtrl.text.trim(),
          password: _passwordCtrl.text.trim(),
          code: _otpCtrl.text.trim(),
        );
    // On success the router redirect signs the user into the app.
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final isLoading = auth.valueOrNull?.isLoading ?? false;
    final error = auth.valueOrNull?.error;

    return Scaffold(
      appBar: AppBar(title: const Text('Reset password')),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight - 48),
              child: IntrinsicHeight(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Forgot your password?',
                          style: AppTextStyles.heading()),
                      const SizedBox(height: 6),
                      Text(
                        _otpSent
                            ? 'Enter the code sent to ${_mobileCtrl.text.trim()} and choose a new password.'
                            : "Enter your mobile number and we'll send a reset code.",
                        style: AppTextStyles.caption(),
                      ),
                      const SizedBox(height: 24),
                      TextFormField(
                        controller: _mobileCtrl,
                        enabled: !_otpSent,
                        keyboardType: TextInputType.phone,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[0-9+ ]')),
                        ],
                        decoration: const InputDecoration(
                          labelText: 'Mobile number',
                          hintText: '+91 98765 43210',
                          prefixIcon: Icon(Icons.phone_rounded),
                        ),
                        validator: (v) => (v == null ||
                                v.trim().replaceAll(RegExp(r'\D'), '').length < 10)
                            ? 'Enter a valid mobile number'
                            : null,
                      ),
                      if (_otpSent) ...[
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _otpCtrl,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          decoration: const InputDecoration(
                            labelText: 'Enter OTP',
                            hintText: '123456',
                            counterText: '',
                            prefixIcon: Icon(Icons.sms_outlined),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _passwordCtrl,
                          obscureText: _obscure,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          decoration: InputDecoration(
                            labelText: 'New 6-digit password',
                            counterText: '',
                            prefixIcon: const Icon(Icons.lock_outline_rounded),
                            suffixIcon: IconButton(
                              icon: Icon(_obscure
                                  ? Icons.visibility_rounded
                                  : Icons.visibility_off_rounded),
                              onPressed: () =>
                                  setState(() => _obscure = !_obscure),
                            ),
                          ),
                          validator: (v) => (v == null || v.trim().length != 6)
                              ? 'Password must be 6 digits'
                              : null,
                        ),
                        TextButton(
                          onPressed: isLoading ? null : _sendOtp,
                          child: const Text('Resend code'),
                        ),
                      ],
                      if (error != null) ...[
                        const SizedBox(height: 8),
                        Text(error,
                            style: const TextStyle(color: AppColors.danger)),
                      ],
                      const Spacer(),
                      const SizedBox(height: 12),
                      PrimaryButton(
                        label: _otpSent ? 'Reset password' : 'Send reset code',
                        isLoading: isLoading,
                        onPressed: _otpSent ? _reset : _sendOtp,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
