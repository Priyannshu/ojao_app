import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/features/auth/application/current_user_provider.dart';
import 'package:ojao_app/features/patient/application/patient_providers.dart';
import 'package:ojao_app/features/patient/presentation/widgets/active_token_banner.dart';
import 'package:ojao_app/features/patient/presentation/widgets/department_card.dart';
import 'package:ojao_app/shared/widgets/async_value_view.dart';
import 'package:ojao_app/shared/widgets/info_card.dart';

class PatientHomeScreen extends ConsumerWidget {
  const PatientHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final departments = ref.watch(departmentsProvider);
    final activeToken = ref.watch(myActiveTokenProvider);
    final stats = ref.watch(clinicStatsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(departmentsProvider);
        ref.invalidate(clinicStatsProvider);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text('Hello,', style: AppTextStyles.caption()),
          Text(
            (user?.displayName?.isNotEmpty ?? false)
                ? user!.displayName!
                : (user?.phoneNumber ?? 'there'),
            style: AppTextStyles.heading().copyWith(fontSize: 24),
          ),
          const SizedBox(height: 16),

          // Active token banner (only when the patient is queued).
          activeToken.maybeWhen(
            data: (token) => token == null
                ? const SizedBox.shrink()
                : Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: ActiveTokenBanner(token: token),
                  ),
            orElse: () => const SizedBox.shrink(),
          ),

          // Clinic pulse strip.
          stats.maybeWhen(
            data: (s) => Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Row(
                children: [
                  Expanded(
                    child: _PulseTile(
                      value: '${s.activePatients}',
                      label: 'In clinic now',
                      icon: Icons.people_alt_rounded,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _PulseTile(
                      value: '${s.avgWaitReduction.round()}%',
                      label: 'Less waiting',
                      icon: Icons.trending_down_rounded,
                      accent: AppColors.success,
                    ),
                  ),
                ],
              ),
            ),
            orElse: () => const SizedBox.shrink(),
          ),

          Text('Departments', style: AppTextStyles.bodyBold().copyWith(fontSize: 16)),
          const SizedBox(height: 4),
          Text('Tap a department to join its queue or book a visit.',
              style: AppTextStyles.caption()),
          const SizedBox(height: 12),

          AsyncValueView<List>(
            value: departments,
            onRetry: () => ref.invalidate(departmentsProvider),
            isEmpty: (list) => list.isEmpty,
            emptyMessage: 'No departments are open right now.',
            data: (list) => Column(
              children: [
                for (final dept in list) ...[
                  DepartmentCard(
                    department: dept,
                    onTap: () => context.go(
                        '${AppRoutes.patientHome}/department/${dept.id}'),
                  ),
                  const SizedBox(height: 12),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PulseTile extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color? accent;

  const _PulseTile({
    required this.value,
    required this.label,
    required this.icon,
    this.accent,
  });

  @override
  Widget build(BuildContext context) {
    final color = accent ?? AppColors.medicalBlue;
    return InfoCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 10),
          Text(value, style: AppTextStyles.heading().copyWith(fontSize: 20)),
          Text(label, style: AppTextStyles.caption().copyWith(fontSize: 12)),
        ],
      ),
    );
  }
}
