import 'package:flutter/material.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/data/models/facility.dart';
import 'package:ojao_app/shared/widgets/info_card.dart';

/// Maps a facility type to its representative icon.
IconData facilityTypeIcon(FacilityType type) {
  switch (type) {
    case FacilityType.hospital:
      return Icons.local_hospital_rounded;
    case FacilityType.clinic:
      return Icons.medical_services_rounded;
    case FacilityType.diagnostic:
      return Icons.biotech_rounded;
    case FacilityType.pharmacy:
      return Icons.local_pharmacy_rounded;
  }
}

/// A single facility in the near-me list: icon, name, address, rating and an
/// optional distance chip (shown only when the patient's location is known).
class FacilityCard extends StatelessWidget {
  final Facility facility;
  final String? distanceLabel;
  final VoidCallback onTap;

  const FacilityCard({
    super.key,
    required this.facility,
    required this.onTap,
    this.distanceLabel,
  });

  @override
  Widget build(BuildContext context) {
    return InfoCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: AppColors.medicalBlue.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(facilityTypeIcon(facility.type),
                color: AppColors.medicalBlue, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(facility.name, style: AppTextStyles.bodyBold()),
                const SizedBox(height: 2),
                Text(
                  facility.address,
                  style: AppTextStyles.caption().copyWith(fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.star_rounded,
                        size: 15, color: AppColors.warning),
                    const SizedBox(width: 3),
                    Text(facility.rating.toStringAsFixed(1),
                        style: AppTextStyles.caption().copyWith(fontSize: 12)),
                    if (facility.departmentCount > 0) ...[
                      const SizedBox(width: 10),
                      Flexible(
                        child: Text('${facility.departmentCount} departments',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.caption()
                                .copyWith(fontSize: 12)),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (distanceLabel != null)
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Icon(Icons.near_me_rounded,
                    size: 16, color: AppColors.medicalBlue),
                const SizedBox(height: 4),
                Text(distanceLabel!,
                    style: AppTextStyles.bodyBold().copyWith(
                      color: AppColors.medicalBlue,
                      fontSize: 13,
                    )),
              ],
            )
          else
            const Icon(Icons.chevron_right_rounded,
                color: AppColors.slateGray),
        ],
      ),
    );
  }
}
