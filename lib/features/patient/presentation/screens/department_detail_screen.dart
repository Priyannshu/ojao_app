import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/core/utils/formatters.dart';
import 'package:ojao_app/features/patient/application/patient_actions_controller.dart';
import 'package:ojao_app/features/patient/application/patient_providers.dart';
import 'package:ojao_app/features/patient/presentation/widgets/department_card.dart';
import 'package:ojao_app/shared/widgets/info_card.dart';
import 'package:ojao_app/shared/widgets/primary_button.dart';

class DepartmentDetailScreen extends ConsumerWidget {
  final String departmentId;

  const DepartmentDetailScreen({super.key, required this.departmentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dept = ref.watch(departmentByIdProvider(departmentId));
    final action = ref.watch(patientActionsProvider);
    final isBusy = action.isLoading;

    if (dept == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(dept.name)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.medicalBlue.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(departmentIcon(dept.icon),
                      color: AppColors.medicalBlue, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(dept.name,
                          style: AppTextStyles.heading().copyWith(fontSize: 20)),
                      Text(dept.description, style: AppTextStyles.caption()),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _metric(
                    'Now serving',
                    dept.currentServing,
                    Icons.confirmation_number_rounded,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _metric(
                    'Avg wait',
                    AppFormatters.etaDisplay(dept.avgWaitMinutes.round()),
                    Icons.timelapse_rounded,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _metric(
                    'Doctors',
                    '${dept.activeDoctors}',
                    Icons.medical_services_rounded,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),
            if (action.hasError) ...[
              Text(
                action.error.toString().replaceFirst('Exception: ', ''),
                style: const TextStyle(color: AppColors.danger),
              ),
              const SizedBox(height: 12),
            ],
            PrimaryButton(
              label: 'Join the queue',
              icon: Icons.pin_rounded,
              isLoading: isBusy,
              onPressed: () async {
                final token = await ref
                    .read(patientActionsProvider.notifier)
                    .joinQueue(dept);
                if (token != null && context.mounted) {
                  context.go('${AppRoutes.patientHome}/token/${token.id}');
                }
              },
            ),
            const SizedBox(height: 12),
            PrimaryButton(
              label: 'Book an appointment',
              icon: Icons.event_rounded,
              outlined: true,
              onPressed: isBusy
                  ? null
                  : () => context.go(
                      '${AppRoutes.patientHome}/book/${dept.id}'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _metric(String label, String value, IconData icon) {
    return InfoCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Icon(icon, size: 20, color: AppColors.medicalBlue),
          const SizedBox(height: 8),
          Text(value,
              style: AppTextStyles.bodyBold().copyWith(fontSize: 15),
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
          Text(label,
              style: AppTextStyles.caption().copyWith(fontSize: 11),
              textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
