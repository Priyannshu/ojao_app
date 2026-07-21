import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/data/services/location_service.dart';
import 'package:ojao_app/features/patient/application/location_controller.dart';

/// A compact, tappable location indicator for the home header.
///
/// It reflects the four states of [LocationController]:
///  - resolving  → a subtle "Locating you…" shimmer row
///  - resolved   → a pin + approximate coordinates and a "Nearby" label
///  - denied/off → an actionable prompt (grant permission / open settings)
///
/// Tapping re-runs detection (or opens settings when permanently denied), so
/// the same control both shows status and fixes it.
class LocationPlaceholder extends ConsumerWidget {
  const LocationPlaceholder({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationAsync = ref.watch(locationControllerProvider);
    final controller = ref.read(locationControllerProvider.notifier);

    return locationAsync.when(
      loading: () => const _LocationRow(
        icon: Icons.my_location_rounded,
        title: 'Locating you…',
        subtitle: 'Finding facilities near you',
      ),
      error: (_, _) => _LocationRow(
        icon: Icons.location_off_rounded,
        title: 'Location unavailable',
        subtitle: 'Tap to try again',
        onTap: controller.refresh,
      ),
      data: (result) {
        if (result.ok) {
          final p = result.position!;
          return _LocationRow(
            icon: Icons.location_on_rounded,
            iconColor: AppColors.medicalBlue,
            title: 'Near you',
            subtitle: _coords(p),
            trailing: Text('Update', style: _actionStyle()),
            onTap: controller.refresh,
          );
        }
        return _LocationRow(
          icon: Icons.location_off_rounded,
          iconColor: AppColors.warning,
          title: _failureTitle(result.failure!),
          subtitle: _failureSubtitle(result.failure!),
          trailing: Text(
            _failureAction(result.failure!),
            style: _actionStyle(),
          ),
          onTap: result.failure == LocationFailure.permissionDeniedForever
              ? controller.openSettings
              : controller.refresh,
        );
      },
    );
  }

  String _coords(Position p) =>
      '${p.latitude.toStringAsFixed(3)}, ${p.longitude.toStringAsFixed(3)}';

  TextStyle _actionStyle() => AppTextStyles.bodyBold().copyWith(
        color: AppColors.medicalBlue,
        fontSize: 13,
      );

  String _failureTitle(LocationFailure f) => switch (f) {
        LocationFailure.serviceDisabled => 'Location is off',
        LocationFailure.permissionDenied => 'Location permission needed',
        LocationFailure.permissionDeniedForever => 'Location blocked',
        LocationFailure.unavailable => 'Location unavailable',
      };

  String _failureSubtitle(LocationFailure f) => switch (f) {
        LocationFailure.serviceDisabled =>
          'Turn on location to see facilities near you',
        LocationFailure.permissionDenied =>
          'Allow access to sort by distance',
        LocationFailure.permissionDeniedForever =>
          'Enable location in settings',
        LocationFailure.unavailable => 'Tap to try again',
      };

  String _failureAction(LocationFailure f) => switch (f) {
        LocationFailure.permissionDeniedForever => 'Settings',
        _ => 'Enable',
      };
}

class _LocationRow extends StatelessWidget {
  final IconData icon;
  final Color? iconColor;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _LocationRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.iconColor,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = iconColor ?? AppColors.slateGray;
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: AppTextStyles.bodyBold().copyWith(fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AppTextStyles.caption().copyWith(fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: 8),
                trailing!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}
