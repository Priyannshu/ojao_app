import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/core/utils/formatters.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/features/patient/application/patient_actions_controller.dart';
import 'package:ojao_app/features/patient/application/patient_providers.dart';
import 'package:ojao_app/shared/widgets/async_value_view.dart';
import 'package:ojao_app/shared/widgets/status_chip.dart';

class TokenTrackingScreen extends ConsumerWidget {
  final String tokenId;

  const TokenTrackingScreen({super.key, required this.tokenId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokenAsync = ref.watch(tokenByIdProvider(tokenId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your queue token'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.go(AppRoutes.patientHome),
        ),
      ),
      body: SafeArea(
        child: AsyncValueView<PatientToken?>(
          value: tokenAsync,
          onRetry: () => ref.invalidate(tokenByIdProvider(tokenId)),
          isEmpty: (t) => t == null,
          emptyBuilder: () => const EmptyState(
            icon: Icons.check_circle_outline_rounded,
            message: 'This token is no longer active.',
          ),
          data: (token) => _TokenBody(token: token!),
        ),
      ),
    );
  }
}

class _TokenBody extends ConsumerWidget {
  final PatientToken token;

  const _TokenBody({required this.token});

  double get _progress {
    switch (token.status) {
      case TokenStatus.waiting:
        return 0.25;
      case TokenStatus.called:
        return 0.6;
      case TokenStatus.serving:
        return 0.85;
      case TokenStatus.completed:
        return 1.0;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaving = ref.watch(patientActionsProvider).isLoading;
    final called = token.status == TokenStatus.called;

    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      children: [
        Center(
          child: Column(
            children: [
              StatusChip(status: token.status),
              const SizedBox(height: 20),
              Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: called
                        ? [AppColors.warning, const Color(0xFFD97706)]
                        : [AppColors.medicalBlue, AppColors.calmNavy],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: (called ? AppColors.warning : AppColors.medicalBlue)
                          .withValues(alpha: 0.3),
                      blurRadius: 30,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('TOKEN',
                        style: AppTextStyles.caption().copyWith(
                            color: Colors.white70,
                            letterSpacing: 2,
                            fontSize: 12)),
                    Text(
                      token.tokenNumber,
                      style: AppTextStyles.display()
                          .copyWith(color: Colors.white, fontSize: 40),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              if (called)
                Text(
                  "It's your turn! Please proceed.",
                  style: AppTextStyles.bodyBold()
                      .copyWith(color: AppColors.warning, fontSize: 16),
                  textAlign: TextAlign.center,
                )
              else if (token.status == TokenStatus.serving)
                Text('You are being served.',
                    style: AppTextStyles.bodyBold()
                        .copyWith(color: AppColors.success, fontSize: 16))
              else
                Column(
                  children: [
                    Text('#${token.queuePosition}',
                        style: AppTextStyles.display().copyWith(fontSize: 32)),
                    Text('people ahead of you',
                        style: AppTextStyles.caption()),
                  ],
                ),
            ],
          ),
        ),
        const SizedBox(height: 28),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: _progress,
            minHeight: 8,
            backgroundColor: AppColors.lightBlueGray,
            color: called ? AppColors.warning : AppColors.medicalBlue,
          ),
        ),
        const SizedBox(height: 24),
        _detailRow(Icons.local_hospital_rounded, 'Department', token.department),
        _detailRow(Icons.timelapse_rounded, 'Estimated wait',
            AppFormatters.etaDisplay(token.etaMinutes)),
        _detailRow(Icons.person_rounded, 'Patient', token.patientName),
        const SizedBox(height: 28),
        if (token.status == TokenStatus.waiting ||
            token.status == TokenStatus.called)
          OutlinedButton.icon(
            onPressed: leaving
                ? null
                : () async {
                    await ref
                        .read(patientActionsProvider.notifier)
                        .leaveQueue(token);
                    if (context.mounted) context.go(AppRoutes.patientHome);
                  },
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.danger,
              side: const BorderSide(color: AppColors.danger),
              minimumSize: const Size.fromHeight(50),
            ),
            icon: const Icon(Icons.exit_to_app_rounded, size: 18),
            label: const Text('Leave queue'),
          ),
      ],
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.slateGray),
          const SizedBox(width: 12),
          Text(label, style: AppTextStyles.caption()),
          const Spacer(),
          Flexible(
            child: Text(value,
                style: AppTextStyles.bodyMedium(),
                textAlign: TextAlign.right,
                overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }
}
