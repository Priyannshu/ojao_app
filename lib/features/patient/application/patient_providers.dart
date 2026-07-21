import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/appointment.dart';
import 'package:ojao_app/data/models/clinic_stats.dart';
import 'package:ojao_app/data/models/department.dart';
import 'package:ojao_app/data/models/facility.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/data/services/analytics_service.dart';
import 'package:ojao_app/data/services/appointment_service.dart';
import 'package:ojao_app/data/services/department_service.dart';
import 'package:ojao_app/data/services/facility_service.dart';
import 'package:ojao_app/data/services/queue_service.dart';
import 'package:ojao_app/features/auth/application/current_user_provider.dart';

/// All active facilities (hospitals / clinics / diagnostic centers), unsorted.
/// The near-me list sorts these by distance from the patient's location.
final facilitiesProvider = StreamProvider<List<Facility>>((ref) {
  return ref.watch(facilityServiceProvider).watchFacilities();
});

/// The facility the patient is currently browsing. Null until they pick one
/// from the near-me list. Department / queue / stats reads below are scoped to
/// this id, so screens that need it should redirect home when it's null.
final selectedFacilityIdProvider = StateProvider<String?>((ref) => null);

/// The [Facility] object for [selectedFacilityIdProvider], if resolvable.
final selectedFacilityProvider = Provider<Facility?>((ref) {
  final id = ref.watch(selectedFacilityIdProvider);
  if (id == null) return null;
  final facilities = ref.watch(facilitiesProvider).valueOrNull ?? const [];
  for (final f in facilities) {
    if (f.id == id) return f;
  }
  return null;
});

/// Live list of active departments **for the selected facility**. Emits an
/// empty list when no facility is selected.
final departmentsProvider = StreamProvider<List<Department>>((ref) {
  final facilityId = ref.watch(selectedFacilityIdProvider);
  if (facilityId == null) return Stream.value(const []);
  return ref.watch(departmentServiceProvider).watchDepartments(facilityId);
});

/// A single department by id within the selected facility.
final departmentByIdProvider =
    Provider.family<Department?, String>((ref, id) {
  final depts = ref.watch(departmentsProvider).valueOrNull ?? const [];
  for (final d in depts) {
    if (d.id == id) return d;
  }
  return null;
});

/// Rolling stats for the selected facility, shown on the department list.
final clinicStatsProvider = StreamProvider<ClinicStats>((ref) {
  final facilityId = ref.watch(selectedFacilityIdProvider);
  if (facilityId == null) {
    return Stream.value(ClinicStats(
      id: 'current',
      activePatients: 0,
      avgWaitReduction: 0,
      patientSatisfaction: 0,
      imagingTurnaround: 0,
      patientsServed: 0,
      updatedAt: DateTime.fromMillisecondsSinceEpoch(0),
    ));
  }
  return ref.watch(analyticsServiceProvider).watchStats(facilityId);
});

/// The current patient's active token, if they're in a queue anywhere.
/// Cross-facility (collection group), so it does not depend on selection.
final myActiveTokenProvider = StreamProvider<PatientToken?>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value(null);
  return ref.watch(queueServiceProvider).watchPatientActiveToken(user.uid);
});

/// Live view of one token by id (used on the tracking screen). Cross-facility.
final tokenByIdProvider =
    StreamProvider.family<PatientToken?, String>((ref, tokenId) {
  return ref.watch(queueServiceProvider).watchPatientToken(tokenId);
});

/// The signed-in patient's appointments across all facilities, newest first.
final myAppointmentsProvider = StreamProvider<List<Appointment>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value(const []);
  return ref.watch(appointmentServiceProvider).watchPatientAppointments(user.uid);
});
