import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/appointment.dart';
import 'package:ojao_app/data/models/clinic_stats.dart';
import 'package:ojao_app/data/models/department.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/data/services/analytics_service.dart';
import 'package:ojao_app/data/services/appointment_service.dart';
import 'package:ojao_app/data/services/department_service.dart';
import 'package:ojao_app/data/services/queue_service.dart';
import 'package:ojao_app/features/auth/application/current_user_provider.dart';

/// Live list of active clinic departments.
final departmentsProvider = StreamProvider<List<Department>>((ref) {
  return ref.watch(departmentServiceProvider).watchDepartments();
});

/// A single department by id (derived from [departmentsProvider]).
final departmentByIdProvider =
    Provider.family<Department?, String>((ref, id) {
  final depts = ref.watch(departmentsProvider).valueOrNull ?? const [];
  for (final d in depts) {
    if (d.id == id) return d;
  }
  return null;
});

/// Rolling clinic statistics shown on the patient home header.
final clinicStatsProvider = StreamProvider<ClinicStats>((ref) {
  return ref.watch(analyticsServiceProvider).watchStats();
});

/// The current patient's active token, if they're in a queue.
final myActiveTokenProvider = StreamProvider<PatientToken?>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value(null);
  return ref.watch(queueServiceProvider).watchPatientActiveToken(user.uid);
});

/// Live view of one token by id (used on the tracking screen).
final tokenByIdProvider =
    StreamProvider.family<PatientToken?, String>((ref, tokenId) {
  return ref.watch(queueServiceProvider).watchPatientToken(tokenId);
});

/// The signed-in patient's appointments, newest first.
final myAppointmentsProvider = StreamProvider<List<Appointment>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value(const []);
  return ref.watch(appointmentServiceProvider).watchPatientAppointments(user.uid);
});
