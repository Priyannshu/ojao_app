import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/core/utils/formatters.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/shared/widgets/status_chip.dart';

/// Highlighted card shown on the patient home when a queue token is active.
class ActiveTokenBanner extends StatelessWidget {
  final PatientToken token;

  const ActiveTokenBanner({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go('${AppRoutes.patientHome}/token/${token.id}'),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.medicalBlue, AppColors.calmNavy],
          ),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('YOUR TOKEN',
                    style: AppTextStyles.caption().copyWith(
                      color: Colors.white70,
                      letterSpacing: 1,
                      fontSize: 11,
                    )),
                const Spacer(),
                StatusChip(status: token.status),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  token.tokenNumber,
                  style: AppTextStyles.display().copyWith(
                    color: Colors.white,
                    fontSize: 34,
                  ),
                ),
                const Spacer(),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      token.status == TokenStatus.waiting
                          ? '#${token.queuePosition} in line'
                          : token.status.label,
                      style: AppTextStyles.bodyBold().copyWith(color: Colors.white),
                    ),
                    Text(
                      'ETA ${AppFormatters.etaDisplay(token.etaMinutes)}',
                      style: AppTextStyles.caption().copyWith(color: Colors.white70),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              token.facilityName != null
                  ? '${token.department} · ${token.facilityName}'
                  : token.department,
              style: AppTextStyles.caption().copyWith(color: Colors.white70),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
