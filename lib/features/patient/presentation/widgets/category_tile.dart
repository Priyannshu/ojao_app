import 'package:flutter/material.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/data/models/facility.dart';
import 'package:ojao_app/features/patient/presentation/widgets/facility_card.dart';

/// A large tappable category tile on the patient home (Hospitals / Clinics /
/// Diagnostic Centers …). Shows the type icon, plural label and how many
/// facilities of that type are available nearby.
class CategoryTile extends StatelessWidget {
  final FacilityType type;
  final int count;
  final VoidCallback onTap;

  const CategoryTile({
    super.key,
    required this.type,
    required this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = count > 0;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: enabled ? onTap : null,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppColors.medicalBlue
                      .withValues(alpha: enabled ? 0.12 : 0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  facilityTypeIcon(type),
                  color: enabled
                      ? AppColors.medicalBlue
                      : AppColors.slateGray.withValues(alpha: 0.5),
                  size: 24,
                ),
              ),
              const SizedBox(height: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(type.pluralLabel,
                      style: AppTextStyles.bodyBold().copyWith(fontSize: 15),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text(
                    enabled ? '$count nearby' : 'None nearby',
                    style: AppTextStyles.caption().copyWith(fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
