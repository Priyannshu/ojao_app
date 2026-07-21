import 'package:flutter/material.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';

/// ojao wordmark + queue glyph. Used on the splash and auth surfaces.
class BrandLogo extends StatelessWidget {
  final double size;
  final bool showTagline;

  const BrandLogo({super.key, this.size = 120, this.showTagline = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppColors.medicalBlue, AppColors.calmNavy],
            ),
            borderRadius: BorderRadius.circular(size * 0.28),
            boxShadow: [
              BoxShadow(
                color: AppColors.medicalBlue.withValues(alpha: 0.25),
                blurRadius: size * 0.2,
                offset: Offset(0, size * 0.08),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: Icon(
            Icons.health_and_safety_rounded,
            color: Colors.white,
            size: size * 0.5,
          ),
        ),
        SizedBox(height: size * 0.12),
        Text(
          'ojao',
          style: AppTextStyles.display().copyWith(
            fontSize: size * 0.28,
            color: AppColors.charcoal,
          ),
        ),
        if (showTagline) ...[
          SizedBox(height: size * 0.04),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: size * 0.1),
            child: Text(
              'Smart queues. Calmer care.',
              textAlign: TextAlign.center,
              style: AppTextStyles.caption().copyWith(fontSize: size * 0.11),
            ),
          ),
        ],
      ],
    );
  }
}
