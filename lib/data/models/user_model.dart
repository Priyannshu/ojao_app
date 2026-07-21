import 'package:equatable/equatable.dart';

enum UserRole { patient, staff, admin }

class UserModel extends Equatable {
  final String uid;
  final String phoneNumber;
  final String? displayName;
  final String? email;
  final UserRole role;
  final String? clinicId;
  final String? doctorId;
  final bool isVerified;
  final DateTime? createdAt;

  const UserModel({
    required this.uid,
    required this.phoneNumber,
    this.displayName,
    this.email,
    required this.role,
    this.clinicId,
    this.doctorId,
    this.isVerified = false,
    this.createdAt,
  });

  bool get isStaff => role == UserRole.staff || role == UserRole.admin;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      uid: json['uid'] as String,
      phoneNumber: json['phoneNumber'] as String,
      displayName: json['displayName'] as String?,
      email: json['email'] as String?,
      role: UserRole.values.byName(json['role'] as String? ?? 'patient'),
      clinicId: json['clinicId'] as String?,
      doctorId: json['doctorId'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'uid': uid,
        'phoneNumber': phoneNumber,
        if (displayName != null) 'displayName': displayName,
        if (email != null) 'email': email,
        'role': role.name,
        if (clinicId != null) 'clinicId': clinicId,
        if (doctorId != null) 'doctorId': doctorId,
        'isVerified': isVerified,
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      };

  @override
  List<Object?> get props => [uid, phoneNumber, displayName, email, role, clinicId, doctorId, isVerified, createdAt];
}
