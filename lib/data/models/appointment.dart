import 'package:equatable/equatable.dart';

enum AppointmentStatus { pending, confirmed, completed, cancelled }

class Appointment extends Equatable {
  final String id;
  final String patientId;
  final String? patientName;
  final String doctorId;
  final String doctorName;
  final String department;
  final String? facilityId;
  final String? facilityName;
  final DateTime scheduledAt;
  final AppointmentStatus status;
  final String? notes;
  final String? consultationLink;
  final String? tokenId;
  final DateTime createdAt;

  const Appointment({
    required this.id,
    required this.patientId,
    this.patientName,
    required this.doctorId,
    required this.doctorName,
    required this.department,
    this.facilityId,
    this.facilityName,
    required this.scheduledAt,
    required this.status,
    this.notes,
    this.consultationLink,
    this.tokenId,
    required this.createdAt,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as String,
      patientId: json['patientId'] as String,
      patientName: json['patientName'] as String?,
      doctorId: json['doctorId'] as String,
      doctorName: json['doctorName'] as String,
      department: json['department'] as String,
      facilityId: json['facilityId'] as String?,
      facilityName: json['facilityName'] as String?,
      scheduledAt: DateTime.parse(json['scheduledAt'] as String),
      status: AppointmentStatus.values.byName(json['status'] as String? ?? 'pending'),
      notes: json['notes'] as String?,
      consultationLink: json['consultationLink'] as String?,
      tokenId: json['tokenId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'patientId': patientId,
        if (patientName != null) 'patientName': patientName,
        'doctorId': doctorId,
        'doctorName': doctorName,
        'department': department,
        if (facilityId != null) 'facilityId': facilityId,
        if (facilityName != null) 'facilityName': facilityName,
        'scheduledAt': scheduledAt.toIso8601String(),
        'status': status.name,
        if (notes != null) 'notes': notes,
        if (consultationLink != null) 'consultationLink': consultationLink,
        if (tokenId != null) 'tokenId': tokenId,
        'createdAt': createdAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, patientId, patientName, doctorId, doctorName, department, scheduledAt, status, notes, consultationLink, tokenId, createdAt];
}
