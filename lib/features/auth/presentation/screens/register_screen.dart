import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/features/auth/application/auth_controller.dart';
import 'package:ojao_app/shared/widgets/primary_button.dart';

/// Two-step registration:
///   1. Collect name, mobile, email, 6-digit password → send OTP to mobile.
///   2. Enter the OTP → create the account (verified server-side) and sign in.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();

  bool _obscure = true;
  bool _otpSent = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _mobileCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await ref.read(authControllerProvider.notifier).sendPhoneOtp(
          mobile: _mobileCtrl.text.trim(),
          purpose: 'register',
        );
    if (ok && mounted) setState(() => _otpSent = true);
  }

  Future<void> _verifyAndRegister() async {
    if (_otpCtrl.text.trim().length != 6) return;
    await ref.read(authControllerProvider.notifier).registerWithOtp(
          mobile: _mobileCtrl.text.trim(),
          name: _nameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text.trim(),
          code: _otpCtrl.text.trim(),
        );
    // On success the router redirect navigates into the app.
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final isLoading = auth.valueOrNull?.isLoading ?? false;
    final error = auth.valueOrNull?.error;

    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
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
                      Text(_otpSent ? 'Verify your number' : 'Your details',
                          style: AppTextStyles.heading()),
                      const SizedBox(height: 6),
                      Text(
                        _otpSent
                            ? 'Enter the 6-digit code we sent to ${_mobileCtrl.text.trim()}.'
                            : 'Fill in your details to get started.',
                        style: AppTextStyles.caption(),
                      ),
                      const SizedBox(height: 24),

                      // Step 1 fields (locked once the OTP is sent).
                      IgnorePointer(
                        ignoring: _otpSent,
                        child: Opacity(
                          opacity: _otpSent ? 0.5 : 1,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              TextFormField(
                                controller: _nameCtrl,
                                textCapitalization: TextCapitalization.words,
                                decoration: const InputDecoration(
                                  labelText: 'Full name',
                                  prefixIcon: Icon(Icons.person_outline_rounded),
                                ),
                                validator: (v) =>
                                    (v == null || v.trim().length < 2)
                                        ? 'Enter your name'
                                        : null,
                              ),
                              const SizedBox(height: 16),
                              TextFormField(
                                controller: _mobileCtrl,
                                keyboardType: TextInputType.phone,
                                inputFormatters: [
                                  FilteringTextInputFormatter.allow(
                                      RegExp(r'[0-9+ ]')),
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
                              const SizedBox(height: 16),
                              TextFormField(
                                controller: _emailCtrl,
                                keyboardType: TextInputType.emailAddress,
                                decoration: const InputDecoration(
                                  labelText: 'Email',
                                  prefixIcon: Icon(Icons.mail_outline_rounded),
                                ),
                                validator: (v) {
                                  final s = v?.trim() ?? '';
                                  final ok = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
                                      .hasMatch(s);
                                  return ok ? null : 'Enter a valid email';
                                },
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
                                  labelText: 'Create a 6-digit password',
                                  counterText: '',
                                  prefixIcon:
                                      const Icon(Icons.lock_outline_rounded),
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
                            ],
                          ),
                        ),
                      ),

                      // Step 2: OTP entry.
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
                        label: _otpSent ? 'Verify & create account' : 'Send OTP',
                        isLoading: isLoading,
                        onPressed: _otpSent ? _verifyAndRegister : _sendOtp,
                      ),
                      if (_otpSent) ...[
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: isLoading
                              ? null
                              : () => setState(() => _otpSent = false),
                          child: const Text('Edit details'),
                        ),
                      ],
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
