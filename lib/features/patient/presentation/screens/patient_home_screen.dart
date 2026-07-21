import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/data/models/facility.dart';
import 'package:ojao_app/features/auth/application/current_user_provider.dart';
import 'package:ojao_app/features/patient/application/facility_browse_providers.dart';
import 'package:ojao_app/features/patient/application/location_controller.dart';
import 'package:ojao_app/features/patient/application/patient_providers.dart';
import 'package:ojao_app/features/patient/presentation/widgets/active_token_banner.dart';
import 'package:ojao_app/features/patient/presentation/widgets/category_tile.dart';
import 'package:ojao_app/features/patient/presentation/widgets/location_placeholder.dart';

/// The patient landing screen. Instead of jumping straight into one clinic's
/// departments, it now shows a location header and category tiles (Hospitals /
/// Clinics / Diagnostic Centers …). Tapping a category opens the near-me list
/// of that type; picking a facility from there scopes the rest of the app to
/// it.
class PatientHomeScreen extends ConsumerWidget {
  const PatientHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final activeToken = ref.watch(myActiveTokenProvider);
    final counts = ref.watch(facilityTypeCountsProvider);

    // Only surface categories that actually have facilities, keeping the grid
    // meaningful as the dataset grows or shrinks.
    final types = FacilityType.values
        .where((t) => (counts[t] ?? 0) > 0)
        .toList(growable: false);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(facilitiesProvider);
        await ref.read(locationControllerProvider.notifier).refresh();
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text('Hello,', style: AppTextStyles.caption()),
          Text(
            (user?.displayName?.isNotEmpty ?? false)
                ? user!.displayName!
                : (user?.phoneNumber ?? 'there'),
            style: AppTextStyles.heading().copyWith(fontSize: 24),
          ),
          const SizedBox(height: 16),

          // Location placeholder — auto-detects, prompts for permission when
          // off, and drives the distance sorting on the list screens.
          const LocationPlaceholder(),
          const SizedBox(height: 20),

          // Active token banner (only when the patient is queued somewhere).
          activeToken.maybeWhen(
            data: (token) => token == null
                ? const SizedBox.shrink()
                : Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: ActiveTokenBanner(token: token),
                  ),
            orElse: () => const SizedBox.shrink(),
          ),

          Text('What are you looking for?',
              style: AppTextStyles.bodyBold().copyWith(fontSize: 16)),
          const SizedBox(height: 4),
          Text('Pick a category to see places near you.',
              style: AppTextStyles.caption()),
          const SizedBox(height: 14),

          if (types.isEmpty)
            _EmptyCategories(onRetry: () => ref.invalidate(facilitiesProvider))
          else
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.15,
              children: [
                for (final type in types)
                  CategoryTile(
                    type: type,
                    count: counts[type] ?? 0,
                    onTap: () => context.go(
                        '${AppRoutes.patientHome}/facilities/${type.name}'),
                  ),
              ],
            ),
        ],
      ),
    );
  }
}

class _EmptyCategories extends StatelessWidget {
  final VoidCallback onRetry;
  const _EmptyCategories({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          const Icon(Icons.location_city_rounded,
              size: 44, color: Color(0xFFCBD5E1)),
          const SizedBox(height: 12),
          Text('No facilities available yet',
              style: AppTextStyles.bodyBold()),
          const SizedBox(height: 4),
          Text('Pull to refresh or check back soon.',
              textAlign: TextAlign.center, style: AppTextStyles.caption()),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: const Text('Refresh'),
          ),
        ],
      ),
    );
  }
}
