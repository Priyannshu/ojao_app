import 'package:equatable/equatable.dart';

class ClinicStats extends Equatable {
  final String id;
  final int activePatients;
  final double avgWaitReduction;
  final double patientSatisfaction;
  final double imagingTurnaround;
  final int patientsServed;
  final DateTime updatedAt;

  const ClinicStats({
    required this.id,
    required this.activePatients,
    required this.avgWaitReduction,
    required this.patientSatisfaction,
    required this.imagingTurnaround,
    required this.patientsServed,
    required this.updatedAt,
  });

  factory ClinicStats.fromJson(Map<String, dynamic> json) {
    return ClinicStats(
      id: json['id'] as String,
      activePatients: (json['activePatients'] as num?)?.toInt() ?? 0,
      avgWaitReduction: (json['avgWaitReduction'] as num?)?.toDouble() ?? 0.0,
      patientSatisfaction: (json['patientSatisfaction'] as num?)?.toDouble() ?? 0.0,
      imagingTurnaround: (json['imagingTurnaround'] as num?)?.toDouble() ?? 0.0,
      patientsServed: (json['patientsServed'] as num?)?.toInt() ?? 0,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt'] as String) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'activePatients': activePatients,
        'avgWaitReduction': avgWaitReduction,
        'patientSatisfaction': patientSatisfaction,
        'imagingTurnaround': imagingTurnaround,
        'patientsServed': patientsServed,
        'updatedAt': updatedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, activePatients, avgWaitReduction, patientSatisfaction, imagingTurnaround, patientsServed, updatedAt];
}
