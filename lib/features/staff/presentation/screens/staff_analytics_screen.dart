import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/data/models/clinic_stats.dart';
import 'package:ojao_app/features/staff/application/staff_providers.dart';
import 'package:ojao_app/shared/widgets/async_value_view.dart';
import 'package:ojao_app/shared/widgets/info_card.dart';

class StaffAnalyticsScreen extends ConsumerWidget {
  const StaffAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(staffStatsProvider);

    return AsyncValueView<ClinicStats>(
      value: stats,
      onRetry: () => ref.invalidate(staffStatsProvider),
      data: (s) => ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text('Today at a glance',
              style: AppTextStyles.heading().copyWith(fontSize: 22)),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.4,
            children: [
              StatTile(
                value: '${s.patientsServed}',
                label: 'Patients served',
                icon: Icons.people_alt_rounded,
              ),
              StatTile(
                value: '${s.activePatients}',
                label: 'Active now',
                icon: Icons.pending_actions_rounded,
                accent: AppColors.warning,
              ),
              StatTile(
                value: '${s.avgWaitReduction.round()}%',
                label: 'Wait reduction',
                icon: Icons.trending_down_rounded,
                accent: AppColors.success,
              ),
              StatTile(
                value: '${s.patientSatisfaction.toStringAsFixed(1)}/5',
                label: 'Satisfaction',
                icon: Icons.sentiment_satisfied_alt_rounded,
                accent: AppColors.softCyan,
              ),
            ],
          ),
          const SizedBox(height: 16),
          InfoCard(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.info.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.medical_information_rounded,
                      color: AppColors.info),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Imaging turnaround',
                          style: AppTextStyles.bodyBold()),
                      Text(
                        '${s.imagingTurnaround.toStringAsFixed(0)} min average',
                        style: AppTextStyles.caption(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Updated ${TimeOfDay.fromDateTime(s.updatedAt).format(context)}',
            style: AppTextStyles.caption().copyWith(fontSize: 12),
          ),
        ],
      ),
    );
  }
}
