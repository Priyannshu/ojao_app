import 'package:flutter/material.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/core/utils/formatters.dart';
import 'package:ojao_app/data/models/department.dart';
import 'package:ojao_app/shared/widgets/info_card.dart';

/// Maps a department's stored icon string to a Material icon.
IconData departmentIcon(String key) {
  switch (key.toLowerCase()) {
    case 'cardiology':
    case 'heart':
      return Icons.favorite_rounded;
    case 'radiology':
    case 'imaging':
      return Icons.medical_information_rounded;
    case 'orthopedics':
    case 'ortho':
      return Icons.accessibility_new_rounded;
    case 'pediatrics':
    case 'child':
      return Icons.child_care_rounded;
    case 'dental':
      return Icons.medication_rounded;
    case 'neurology':
      return Icons.psychology_rounded;
    case 'general':
      return Icons.local_hospital_rounded;
    case 'lab':
    case 'pathology':
      return Icons.biotech_rounded;
    default:
      return Icons.medical_services_rounded;
  }
}

class DepartmentCard extends StatelessWidget {
  final Department department;
  final VoidCallback onTap;

  const DepartmentCard({
    super.key,
    required this.department,
    required this.onTap,
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
            child: Icon(departmentIcon(department.icon),
                color: AppColors.medicalBlue, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(department.name, style: AppTextStyles.bodyBold()),
                const SizedBox(height: 2),
                Text(
                  '${department.activeDoctors} doctor(s) • serving ${department.currentServing}',
                  style: AppTextStyles.caption().copyWith(fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                AppFormatters.etaDisplay(department.avgWaitMinutes.round()),
                style: AppTextStyles.bodyBold().copyWith(
                  color: AppColors.medicalBlue,
                  fontSize: 14,
                ),
              ),
              Text('avg wait',
                  style: AppTextStyles.caption().copyWith(fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}
