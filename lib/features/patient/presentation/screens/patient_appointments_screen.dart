import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/core/utils/formatters.dart';
import 'package:ojao_app/data/models/appointment.dart';
import 'package:ojao_app/features/patient/application/patient_actions_controller.dart';
import 'package:ojao_app/features/patient/application/patient_providers.dart';
import 'package:ojao_app/shared/widgets/async_value_view.dart';
import 'package:ojao_app/shared/widgets/info_card.dart';

class PatientAppointmentsScreen extends ConsumerWidget {
  const PatientAppointmentsScreen({super.key});

  Color _statusColor(AppointmentStatus s) {
    switch (s) {
      case AppointmentStatus.pending:
        return AppColors.warning;
      case AppointmentStatus.confirmed:
        return AppColors.success;
      case AppointmentStatus.completed:
        return AppColors.slateGray;
      case AppointmentStatus.cancelled:
        return AppColors.danger;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appointments = ref.watch(myAppointmentsProvider);

    return AsyncValueView<List<Appointment>>(
      value: appointments,
      onRetry: () => ref.invalidate(myAppointmentsProvider),
      isEmpty: (list) => list.isEmpty,
      emptyBuilder: () => const EmptyState(
        icon: Icons.event_available_rounded,
        message: 'No appointments yet.\nBook one from a department.',
      ),
      data: (list) => ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        itemCount: list.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          final appt = list[i];
          final color = _statusColor(appt.status);
          final isUpcoming = appt.status == AppointmentStatus.pending ||
              appt.status == AppointmentStatus.confirmed;
          return InfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(appt.doctorName,
                          style: AppTextStyles.bodyBold()),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        appt.status.name,
                        style: TextStyle(
                            color: color,
                            fontWeight: FontWeight.w700,
                            fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(appt.department, style: AppTextStyles.caption()),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.schedule_rounded,
                        size: 15, color: AppColors.slateGray),
                    const SizedBox(width: 6),
                    Text(AppFormatters.dateTimeFmt.format(appt.scheduledAt),
                        style: AppTextStyles.caption()),
                  ],
                ),
                if (isUpcoming) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      if (appt.consultationLink != null ||
                          appt.status == AppointmentStatus.confirmed)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => context.go(
                                '${AppRoutes.patientHome}/consult/${appt.id}'),
                            icon: const Icon(Icons.videocam_rounded, size: 18),
                            label: const Text('Join consult'),
                          ),
                        ),
                      if (appt.consultationLink != null ||
                          appt.status == AppointmentStatus.confirmed)
                        const SizedBox(width: 10),
                      Expanded(
                        child: TextButton(
                          onPressed: () => _confirmCancel(context, ref, appt),
                          style: TextButton.styleFrom(
                              foregroundColor: AppColors.danger),
                          child: const Text('Cancel'),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _confirmCancel(
      BuildContext context, WidgetRef ref, Appointment appt) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel appointment?'),
        content: const Text('This will free up the slot for other patients.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Keep')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Cancel it'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(patientActionsProvider.notifier).cancelAppointment(appt);
    }
  }
}
