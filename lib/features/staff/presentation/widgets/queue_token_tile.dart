import 'package:flutter/material.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/shared/widgets/info_card.dart';
import 'package:ojao_app/shared/widgets/status_chip.dart';

/// Row used on the staff queue board. Shows the token, patient and the
/// next queue action (call/serve/complete) inline.
class QueueTokenTile extends StatelessWidget {
  final PatientToken token;
  final VoidCallback onTap;
  final VoidCallback? onAdvance;
  final bool busy;

  const QueueTokenTile({
    super.key,
    required this.token,
    required this.onTap,
    this.onAdvance,
    this.busy = false,
  });

  String get _nextLabel {
    switch (token.status) {
      case TokenStatus.waiting:
        return 'Call';
      case TokenStatus.called:
        return 'Serve';
      case TokenStatus.serving:
        return 'Done';
      case TokenStatus.completed:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return InfoCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.medicalBlue.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Text(
              token.tokenNumber.split('-').last,
              style: AppTextStyles.bodyBold()
                  .copyWith(color: AppColors.medicalBlue, fontSize: 16),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(token.patientName,
                    style: AppTextStyles.bodyBold(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                StatusChip(status: token.status),
              ],
            ),
          ),
          if (onAdvance != null && _nextLabel.isNotEmpty)
            SizedBox(
              height: 38,
              child: ElevatedButton(
                onPressed: busy ? null : onAdvance,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                ),
                child: busy
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : Text(_nextLabel),
              ),
            ),
        ],
      ),
    );
  }
}
