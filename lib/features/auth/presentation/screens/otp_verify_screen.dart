import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/features/auth/application/auth_controller.dart';
import 'package:ojao_app/shared/widgets/primary_button.dart';

class OtpVerifyScreen extends ConsumerStatefulWidget {
  const OtpVerifyScreen({super.key});

  @override
  ConsumerState<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends ConsumerState<OtpVerifyScreen> {
  final _otpCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final phone = auth.valueOrNull?.phoneNumber ?? '';
    final isLoading = auth.valueOrNull?.isLoading ?? false;
    final error = auth.valueOrNull?.error;

    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Verify your number', style: AppTextStyles.heading()),
                const SizedBox(height: 8),
                Text('Enter the 6-digit OTP sent to $phone', style: AppTextStyles.caption()),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _otpCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'OTP',
                    hintText: '123456',
                    prefixIcon: Icon(Icons.pin_rounded),
                  ),
                  validator: (v) => (v == null || v.trim().length < 6) ? 'Enter 6-digit OTP' : null,
                ),
                if (error != null) ...[
                  const SizedBox(height: 12),
                  Text(error, style: const TextStyle(color: Colors.red)),
                ],
                const Spacer(),
                PrimaryButton(
                  label: 'Verify',
                  isLoading: isLoading,
                  onPressed: () async {
                    if (_formKey.currentState!.validate()) {
                      await ref.read(authControllerProvider.notifier).verifyOtp(_otpCtrl.text.trim());
                    }
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
