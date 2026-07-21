import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/core/utils/formatters.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/features/staff/application/staff_actions_controller.dart';
import 'package:ojao_app/features/staff/application/staff_providers.dart';
import 'package:ojao_app/shared/widgets/async_value_view.dart';
import 'package:ojao_app/shared/widgets/info_card.dart';
import 'package:ojao_app/shared/widgets/primary_button.dart';
import 'package:ojao_app/shared/widgets/status_chip.dart';

class TokenDetailScreen extends ConsumerWidget {
  final String tokenId;

  const TokenDetailScreen({super.key, required this.tokenId});

  String _nextAction(TokenStatus s) {
    switch (s) {
      case TokenStatus.waiting:
        return 'Call patient';
      case TokenStatus.called:
        return 'Start serving';
      case TokenStatus.serving:
        return 'Mark complete';
      case TokenStatus.completed:
        return 'Completed';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokenAsync = ref.watch(staffTokenByIdProvider(tokenId));
    final action = ref.watch(staffActionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Token detail')),
      body: SafeArea(
        child: AsyncValueView<PatientToken?>(
          value: tokenAsync,
          onRetry: () => ref.invalidate(staffTokenByIdProvider(tokenId)),
          isEmpty: (t) => t == null,
          emptyBuilder: () => const EmptyState(
            message: 'This token is no longer active.',
          ),
          data: (token) {
            final t = token!;
            final isDone = t.status == TokenStatus.completed;
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              children: [
                Center(
                  child: Column(
                    children: [
                      Text(t.tokenNumber,
                          style: AppTextStyles.display().copyWith(fontSize: 40)),
                      const SizedBox(height: 8),
                      StatusChip(status: t.status),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                InfoCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      _row(Icons.person_rounded, 'Patient', t.patientName),
                      const Divider(height: 1),
                      _row(Icons.local_hospital_rounded, 'Department',
                          t.department),
                      const Divider(height: 1),
                      _row(Icons.timelapse_rounded, 'ETA',
                          AppFormatters.etaDisplay(t.etaMinutes)),
                      if (t.createdAt != null) ...[
                        const Divider(height: 1),
                        _row(Icons.login_rounded, 'Joined',
                            AppFormatters.dateTimeFmt.format(t.createdAt!)),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                if (!isDone) ...[
                  PrimaryButton(
                    label: _nextAction(t.status),
                    isLoading: action.isLoading,
                    onPressed: () => ref
                        .read(staffActionsProvider.notifier)
                        .advance(t.id),
                  ),
                  const SizedBox(height: 12),
                  PrimaryButton(
                    label: 'Remove from queue',
                    outlined: true,
                    onPressed: action.isLoading
                        ? null
                        : () => ref
                            .read(staffActionsProvider.notifier)
                            .complete(t.id),
                  ),
                ],
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return ListTile(
      leading: Icon(icon, color: AppColors.slateGray),
      title: Text(label, style: AppTextStyles.bodyMedium()),
      trailing: Flexible(
        child: Text(value,
            style: AppTextStyles.caption(), textAlign: TextAlign.right),
      ),
    );
  }
}
