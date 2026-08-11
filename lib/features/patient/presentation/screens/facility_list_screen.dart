import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/core/utils/maps_launcher.dart';
import 'package:ojao_app/data/models/facility.dart';
import 'package:ojao_app/features/patient/application/facility_browse_providers.dart';
import 'package:ojao_app/features/patient/application/location_controller.dart';
import 'package:ojao_app/features/patient/application/patient_providers.dart';
import 'package:ojao_app/features/patient/presentation/widgets/facility_card.dart';
import 'package:ojao_app/features/patient/presentation/widgets/location_placeholder.dart';
import 'package:ojao_app/shared/widgets/async_value_view.dart';

/// Lists facilities of a single [FacilityType], nearest first. Selecting one
/// stores it as the active facility and opens that facility's department flow.
class FacilityListScreen extends ConsumerWidget {
  final FacilityType type;

  const FacilityListScreen({super.key, required this.type});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final facilitiesAsync = ref.watch(facilitiesProvider);
    final withDistance = ref.watch(facilitiesByTypeProvider(type));
    final hasLocation = ref.watch(currentPositionProvider) != null;

    return Scaffold(
      appBar: AppBar(title: Text(type.pluralLabel)),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(facilitiesProvider);
            await ref.read(locationControllerProvider.notifier).refresh();
          },
          child: AsyncValueView<List<Facility>>(
            value: facilitiesAsync,
            onRetry: () => ref.invalidate(facilitiesProvider),
            // Emptiness is judged on the filtered (by-type) list, not the raw
            // stream, so "no hospitals" shows even when other types exist.
            isEmpty: (_) => withDistance.isEmpty,
            emptyBuilder: () => _EmptyList(type: type),
            data: (_) => ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              children: [
                if (!hasLocation) ...[
                  const LocationPlaceholder(),
                  const SizedBox(height: 8),
                  Text(
                    'Turn on location to sort these by distance.',
                    style: AppTextStyles.caption().copyWith(fontSize: 12),
                  ),
                  const SizedBox(height: 16),
                ] else
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      '${withDistance.length} near you, closest first',
                      style: AppTextStyles.caption(),
                    ),
                  ),
                for (final item in withDistance) ...[
                  FacilityCard(
                    facility: item.facility,
                    distanceLabel: item.distanceLabel,
                    onTap: () => _selectFacility(context, ref, item.facility),
                    onDirections: () => _openDirections(context, item.facility),
                  ),
                  const SizedBox(height: 12),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _selectFacility(BuildContext context, WidgetRef ref, Facility facility) {
    // Scope the rest of the app (departments, queue, stats) to this facility,
    // then open its department list.
    ref.read(selectedFacilityIdProvider.notifier).state = facility.id;
    context.go('${AppRoutes.patientHome}/facility');
  }

  /// Hands off to external Google Maps for turn-by-turn directions. Only reached
  /// after the user taps the directions button (no directions call happens
  /// during search — ARCHITECTURE.md §Google Maps).
  Future<void> _openDirections(BuildContext context, Facility facility) async {
    final ok = await MapsLauncher.openDirections(
      facility.latitude,
      facility.longitude,
    );
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open Maps.')),
      );
    }
  }
}

class _EmptyList extends StatelessWidget {
  final FacilityType type;
  const _EmptyList({required this.type});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 32),
          child: Column(
            children: [
              Icon(facilityTypeIcon(type),
                  size: 44, color: const Color(0xFFCBD5E1)),
              const SizedBox(height: 12),
              Text('No ${type.pluralLabel.toLowerCase()} nearby',
                  style: AppTextStyles.bodyBold()),
              const SizedBox(height: 4),
              Text('Try another category or pull to refresh.',
                  textAlign: TextAlign.center, style: AppTextStyles.caption()),
            ],
          ),
        ),
      ],
    );
  }
}
