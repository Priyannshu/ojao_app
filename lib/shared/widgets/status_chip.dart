import 'package:flutter/material.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/data/models/patient_token.dart';

/// Small colored pill that reflects a [TokenStatus].
class StatusChip extends StatelessWidget {
  final TokenStatus status;

  const StatusChip({super.key, required this.status});

  Color get _color {
    switch (status) {
      case TokenStatus.waiting:
        return AppColors.waiting;
      case TokenStatus.called:
        return AppColors.called;
      case TokenStatus.serving:
        return AppColors.serving;
      case TokenStatus.completed:
        return AppColors.completed;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: _color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            status.label,
            style: TextStyle(
              color: _color,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
