import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/data/models/department.dart';
import 'package:ojao_app/data/models/facility.dart';
import 'package:ojao_app/features/patient/application/patient_providers.dart';
import 'package:ojao_app/features/patient/presentation/widgets/department_card.dart';
import 'package:ojao_app/features/patient/presentation/widgets/facility_card.dart';
import 'package:ojao_app/shared/widgets/async_value_view.dart';
import 'package:ojao_app/shared/widgets/info_card.dart';

/// The departments of the facility the patient has selected. Reached after
/// picking a facility from the near-me list. Scoped to
/// [selectedFacilityIdProvider]; if nothing is selected (e.g. deep link or a
/// fresh launch) it guides the patient back to browse.
class FacilityHomeScreen extends ConsumerWidget {
  const FacilityHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final facility = ref.watch(selectedFacilityProvider);
    final facilityId = ref.watch(selectedFacilityIdProvider);

    if (facilityId == null) {
      return _NoFacilitySelected();
    }

    final departments = ref.watch(departmentsProvider);
    final stats = ref.watch(clinicStatsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(facility?.name ?? 'Facility'),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(departmentsProvider);
            ref.invalidate(clinicStatsProvider);
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              if (facility != null) ...[
                _FacilityHeader(facility: facility),
                const SizedBox(height: 20),
              ],

              // Facility pulse strip.
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

              Text('Departments',
                  style: AppTextStyles.bodyBold().copyWith(fontSize: 16)),
              const SizedBox(height: 4),
              Text('Tap a department to join its queue or book a visit.',
                  style: AppTextStyles.caption()),
              const SizedBox(height: 12),

              AsyncValueView<List<Department>>(
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
        ),
      ),
    );
  }
}

class _FacilityHeader extends StatelessWidget {
  final Facility facility;
  const _FacilityHeader({required this.facility});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: AppColors.medicalBlue.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(facilityTypeIcon(facility.type),
              color: AppColors.medicalBlue, size: 26),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(facility.name,
                  style: AppTextStyles.heading().copyWith(fontSize: 20)),
              const SizedBox(height: 2),
              Text(
                facility.address,
                style: AppTextStyles.caption().copyWith(fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _NoFacilitySelected extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.location_city_rounded,
                  size: 44, color: AppColors.slateGray),
              const SizedBox(height: 12),
              Text('No facility selected', style: AppTextStyles.bodyBold()),
              const SizedBox(height: 4),
              Text('Choose a hospital, clinic or diagnostic center to see its departments.',
                  textAlign: TextAlign.center, style: AppTextStyles.caption()),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => context.go(AppRoutes.patientHome),
                icon: const Icon(Icons.search_rounded, size: 18),
                label: const Text('Browse facilities'),
              ),
            ],
          ),
        ),
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
