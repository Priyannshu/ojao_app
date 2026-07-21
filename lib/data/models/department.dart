import 'package:equatable/equatable.dart';

class Department extends Equatable {
  final String id;
  final String name;
  final String description;
  final String icon;
  final double avgWaitMinutes;
  final int activeDoctors;
  final String currentServing;
  final bool isActive;

  const Department({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.avgWaitMinutes,
    required this.activeDoctors,
    required this.currentServing,
    this.isActive = true,
  });

  factory Department.fromJson(Map<String, dynamic> json) {
    return Department(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      icon: json['icon'] as String,
      avgWaitMinutes: (json['avgWaitMinutes'] as num?)?.toDouble() ?? 0.0,
      activeDoctors: (json['activeDoctors'] as num?)?.toInt() ?? 0,
      currentServing: json['currentServing'] as String? ?? '-',
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'icon': icon,
        'avgWaitMinutes': avgWaitMinutes,
        'activeDoctors': activeDoctors,
        'currentServing': currentServing,
        'isActive': isActive,
      };

  @override
  List<Object?> get props => [id, name, description, icon, avgWaitMinutes, activeDoctors, currentServing, isActive];
}
