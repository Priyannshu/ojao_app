import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/features/staff/application/staff_actions_controller.dart';
import 'package:ojao_app/features/staff/application/staff_providers.dart';
import 'package:ojao_app/features/staff/presentation/widgets/queue_token_tile.dart';
import 'package:ojao_app/shared/widgets/async_value_view.dart';

/// Full live queue with a status filter. Staff advance tokens inline.
class StaffQueueScreen extends ConsumerStatefulWidget {
  const StaffQueueScreen({super.key});

  @override
  ConsumerState<StaffQueueScreen> createState() => _StaffQueueScreenState();
}

class _StaffQueueScreenState extends ConsumerState<StaffQueueScreen> {
  TokenStatus? _filter;

  @override
  Widget build(BuildContext context) {
    final tokens = ref.watch(activeTokensProvider);
    final action = ref.watch(staffActionsProvider);
    final busyId = action.isLoading;

    // Surface action failures without blocking the board.
    ref.listen(staffActionsProvider, (_, next) {
      if (next.hasError && !next.isLoading) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                next.error.toString().replaceFirst('Exception: ', '')),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    });

    return Column(
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              _chip('All', _filter == null, () => setState(() => _filter = null)),
              for (final s in [
                TokenStatus.waiting,
                TokenStatus.called,
                TokenStatus.serving,
              ])
                _chip(s.label, _filter == s,
                    () => setState(() => _filter = s)),
            ],
          ),
        ),
        Expanded(
          child: AsyncValueView<List<PatientToken>>(
            value: tokens,
            onRetry: () => ref.invalidate(activeTokensProvider),
            data: (list) {
              final filtered = _filter == null
                  ? list
                  : list.where((t) => t.status == _filter).toList();
              if (filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.inbox_rounded,
                  message: 'No tokens in this view.',
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
                itemCount: filtered.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final t = filtered[i];
                  return QueueTokenTile(
                    token: t,
                    busy: busyId,
                    onTap: () =>
                        context.go('${AppRoutes.staffHome}/token/${t.id}'),
                    onAdvance: () => ref
                        .read(staffActionsProvider.notifier)
                        .advance(t.id),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}
