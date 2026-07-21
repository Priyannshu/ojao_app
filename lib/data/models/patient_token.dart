import 'package:equatable/equatable.dart';

enum TokenStatus {
  waiting('Waiting'),
  called('Called'),
  serving('Serving'),
  completed('Completed');

  final String label;
  const TokenStatus(this.label);
}

class PatientToken extends Equatable {
  final String id;
  final String tokenNumber;
  final String patientName;
  final String department;
  final TokenStatus status;
  final int queuePosition;
  final int etaMinutes;
  final String patientId;
  final String? doctorId;
  final DateTime? createdAt;
  final DateTime? calledAt;
  final DateTime? servedAt;
  final DateTime? completedAt;

  const PatientToken({
    required this.id,
    required this.tokenNumber,
    required this.patientName,
    required this.department,
    required this.status,
    required this.queuePosition,
    required this.etaMinutes,
    required this.patientId,
    this.doctorId,
    this.createdAt,
    this.calledAt,
    this.servedAt,
    this.completedAt,
  });

  factory PatientToken.fromJson(Map<String, dynamic> json) {
    return PatientToken(
      id: json['id'] as String,
      tokenNumber: json['tokenNumber'] as String,
      patientName: json['patientName'] as String,
      department: json['department'] as String,
      status: TokenStatus.values.byName(json['status'] as String),
      queuePosition: (json['queuePosition'] as num?)?.toInt() ?? 0,
      etaMinutes: (json['etaMinutes'] as num?)?.toInt() ?? 0,
      patientId: json['patientId'] as String,
      doctorId: json['doctorId'] as String?,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
      calledAt: json['calledAt'] != null ? DateTime.parse(json['calledAt'] as String) : null,
      servedAt: json['servedAt'] != null ? DateTime.parse(json['servedAt'] as String) : null,
      completedAt: json['completedAt'] != null ? DateTime.parse(json['completedAt'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'tokenNumber': tokenNumber,
        'patientName': patientName,
        'department': department,
        'status': status.name,
        'queuePosition': queuePosition,
        'etaMinutes': etaMinutes,
        'patientId': patientId,
        if (doctorId != null) 'doctorId': doctorId,
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (calledAt != null) 'calledAt': calledAt!.toIso8601String(),
        if (servedAt != null) 'servedAt': servedAt!.toIso8601String(),
        if (completedAt != null) 'completedAt': completedAt!.toIso8601String(),
      };

  @override
  List<Object?> get props => [
        id, tokenNumber, patientName, department, status,
        queuePosition, etaMinutes, patientId, doctorId,
        createdAt, calledAt, servedAt, completedAt,
      ];
}
