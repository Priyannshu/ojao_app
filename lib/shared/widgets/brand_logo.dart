import 'package:flutter/material.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';

/// ojao brand logo. Renders the bundled wordmark asset
/// (`assets/ojao_logo.png`), falling back to a drawn glyph + wordmark if the
/// asset ever fails to load. Used on the splash and auth surfaces.
class BrandLogo extends StatelessWidget {
  final double size;
  final bool showTagline;

  const BrandLogo({super.key, this.size = 120, this.showTagline = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset(
          'assets/ojao_logo.png',
          width: size,
          height: size,
          fit: BoxFit.contain,
          // If the asset is missing/unbundled, fall back to the drawn logo so
          // the splash/auth screens never render a broken-image box.
          errorBuilder: (_, _, _) => _FallbackLogo(size: size),
        ),
        if (showTagline) ...[
          SizedBox(height: size * 0.06),
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

/// The previous programmatically-drawn logo, kept as a safety net.
class _FallbackLogo extends StatelessWidget {
  final double size;
  const _FallbackLogo({required this.size});

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
      ],
    );
  }
}
