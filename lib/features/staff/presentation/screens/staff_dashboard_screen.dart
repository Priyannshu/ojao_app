import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/features/staff/application/staff_providers.dart';
import 'package:ojao_app/features/staff/presentation/widgets/queue_token_tile.dart';
import 'package:ojao_app/shared/widgets/async_value_view.dart';
import 'package:ojao_app/shared/widgets/info_card.dart';

class StaffDashboardScreen extends ConsumerWidget {
  const StaffDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final byStatus = ref.watch(tokensByStatusProvider);
    final stats = ref.watch(staffStatsProvider);
    final tokens = ref.watch(activeTokensProvider);

    final waiting = byStatus[TokenStatus.waiting]?.length ?? 0;
    final serving = byStatus[TokenStatus.serving]?.length ?? 0;
    final called = byStatus[TokenStatus.called]?.length ?? 0;

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(activeTokensProvider);
        ref.invalidate(staffStatsProvider);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text('Live overview',
              style: AppTextStyles.heading().copyWith(fontSize: 22)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _stat('$waiting', 'Waiting', AppColors.waiting),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _stat('$called', 'Called', AppColors.called),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _stat('$serving', 'Serving', AppColors.serving),
              ),
            ],
          ),
          const SizedBox(height: 12),
          stats.maybeWhen(
            data: (s) => InfoCard(
              child: Row(
                children: [
                  const Icon(Icons.insights_rounded,
                      color: AppColors.medicalBlue),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '${s.patientsServed} served today • ${s.patientSatisfaction.toStringAsFixed(1)}/5 satisfaction',
                      style: AppTextStyles.bodyMedium().copyWith(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            orElse: () => const SizedBox.shrink(),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text('Next up',
                  style: AppTextStyles.bodyBold().copyWith(fontSize: 16)),
              const Spacer(),
              TextButton(
                onPressed: () => context.go(AppRoutes.staffQueue),
                child: const Text('Full queue'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          AsyncValueView<List<PatientToken>>(
            value: tokens,
            onRetry: () => ref.invalidate(activeTokensProvider),
            isEmpty: (list) =>
                list.where((t) => t.status == TokenStatus.waiting).isEmpty,
            emptyBuilder: () => const EmptyState(
              icon: Icons.done_all_rounded,
              message: 'No one is waiting. Queue is clear.',
            ),
            data: (list) {
              final upNext = list
                  .where((t) => t.status == TokenStatus.waiting)
                  .take(5)
                  .toList();
              return Column(
                children: [
                  for (final t in upNext) ...[
                    QueueTokenTile(
                      token: t,
                      onTap: () =>
                          context.go('${AppRoutes.staffHome}/token/${t.id}'),
                    ),
                    const SizedBox(height: 10),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _stat(String value, String label, Color color) {
    return InfoCard(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        children: [
          Text(value,
              style: AppTextStyles.display()
                  .copyWith(fontSize: 26, color: color)),
          const SizedBox(height: 2),
          Text(label, style: AppTextStyles.caption().copyWith(fontSize: 12)),
        ],
      ),
    );
  }
}
