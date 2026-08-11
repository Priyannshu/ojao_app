import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/features/auth/application/auth_controller.dart';
import 'package:ojao_app/features/auth/application/current_user_provider.dart';
import 'package:ojao_app/shared/widgets/info_card.dart';

class PatientProfileScreen extends ConsumerWidget {
  const PatientProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      children: [
        Center(
          child: Column(
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: AppColors.medicalBlue.withValues(alpha: 0.12),
                child: const Icon(Icons.person_rounded,
                    size: 40, color: AppColors.medicalBlue),
              ),
              const SizedBox(height: 12),
              Text(
                (user?.displayName?.isNotEmpty ?? false)
                    ? user!.displayName!
                    : 'Patient',
                style: AppTextStyles.heading().copyWith(fontSize: 20),
              ),
              Text(user?.phoneNumber ?? '', style: AppTextStyles.caption()),
            ],
          ),
        ),
        const SizedBox(height: 24),
        InfoCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              _row(Icons.verified_user_rounded, 'Account',
                  user?.isVerified ?? false ? 'Verified' : 'Unverified'),
              const Divider(height: 1),
              _row(Icons.badge_rounded, 'Role', user?.role.name ?? '-'),
            ],
          ),
        ),
        const SizedBox(height: 24),
        OutlinedButton.icon(
          onPressed: () => _signOut(context, ref),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.danger,
            side: const BorderSide(color: AppColors.danger),
            minimumSize: const Size.fromHeight(50),
          ),
          icon: const Icon(Icons.logout_rounded, size: 18),
          label: const Text('Sign out'),
        ),
      ],
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return ListTile(
      leading: Icon(icon, color: AppColors.slateGray),
      title: Text(label, style: AppTextStyles.bodyMedium()),
      trailing: Text(value, style: AppTextStyles.caption()),
    );
  }

  Future<void> _signOut(BuildContext context, WidgetRef ref) async {
    await ref.read(authControllerProvider.notifier).signOut();
  }
}
