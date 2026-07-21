import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/data/models/user_model.dart';
import 'package:ojao_app/features/auth/application/auth_controller.dart';
import 'package:ojao_app/shared/widgets/primary_button.dart';

class PhoneInputScreen extends ConsumerStatefulWidget {
  const PhoneInputScreen({super.key});

  @override
  ConsumerState<PhoneInputScreen> createState() => _PhoneInputScreenState();
}

class _PhoneInputScreenState extends ConsumerState<PhoneInputScreen> {
  final _controller = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isPatient = true;

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final isLoading = auth.valueOrNull?.isLoading ?? false;
    final error = auth.valueOrNull?.error;

    return Scaffold(
      appBar: AppBar(),
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
                Text('Welcome to ojao', style: AppTextStyles.heading()),
                const SizedBox(height: 8),
                Text('Sign in with your phone number', style: AppTextStyles.caption()),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _controller,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    hintText: '+91 98765 43210',
                    prefixIcon: Icon(Icons.phone_rounded),
                  ),
                  validator: (v) => (v == null || v.trim().length < 10) ? 'Enter a valid phone number' : null,
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: SegmentedButton<UserRole>(
                    segments: const [
                      ButtonSegment(value: UserRole.patient, label: Text('Patient'), icon: Icon(Icons.person_outline_rounded)),
                      ButtonSegment(value: UserRole.staff, label: Text('Staff'), icon: Icon(Icons.badge_outlined)),
                    ],
                    selected: {_isPatient ? UserRole.patient : UserRole.staff},
                    onSelectionChanged: (sel) => setState(() => _isPatient = sel.first == UserRole.patient),
                  ),
                ),
                if (error != null) ...[
                  const SizedBox(height: 12),
                  Text(error, style: const TextStyle(color: Colors.red)),
                ],
                const Spacer(),
                PrimaryButton(
                  label: 'Send OTP',
                  isLoading: isLoading,
                  onPressed: () async {
                    if (_formKey.currentState!.validate()) {
                      final phone = _controller.text.trim().startsWith('+')
                          ? _controller.text.trim()
                          : '+91${_controller.text.trim()}';
                      await ref.read(authControllerProvider.notifier)
                          .sendOtp(phone, role: _isPatient ? UserRole.patient : UserRole.staff);
                    }
                  },
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
