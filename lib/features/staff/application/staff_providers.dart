import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/clinic_stats.dart';
import 'package:ojao_app/data/models/department.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/data/services/analytics_service.dart';
import 'package:ojao_app/data/services/department_service.dart';
import 'package:ojao_app/data/services/queue_service.dart';
import 'package:ojao_app/features/auth/application/current_user_provider.dart';

/// The facility a staff member operates. Staff are pinned to a single facility
/// via [UserModel.clinicId]; every staff read/write below is scoped to it.
/// Null when the signed-in user has no facility assigned (misconfigured staff).
final staffFacilityIdProvider = Provider<String?>((ref) {
  final user = ref.watch(currentUserProvider);
  return user?.clinicId;
});

/// Every active token in the staff member's facility, ordered by arrival.
final activeTokensProvider = StreamProvider<List<PatientToken>>((ref) {
  final facilityId = ref.watch(staffFacilityIdProvider);
  if (facilityId == null) return Stream.value(const []);
  return ref.watch(queueServiceProvider).watchActiveTokens(facilityId);
});

/// A single token by id for the staff detail screen (cross-facility lookup,
/// but the staff console only ever surfaces its own facility's tokens).
final staffTokenByIdProvider =
    StreamProvider.family<PatientToken?, String>((ref, id) {
  return ref.watch(queueServiceProvider).watchPatientToken(id);
});

/// Stats for the staff member's facility.
final staffStatsProvider = StreamProvider<ClinicStats>((ref) {
  final facilityId = ref.watch(staffFacilityIdProvider);
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

/// Departments for the staff member's facility (used for filter chips).
final staffDepartmentsProvider = StreamProvider<List<Department>>((ref) {
  final facilityId = ref.watch(staffFacilityIdProvider);
  if (facilityId == null) return Stream.value(const []);
  return ref.watch(departmentServiceProvider).watchDepartments(facilityId);
});

/// Tokens grouped by status for the queue board columns.
final tokensByStatusProvider =
    Provider<Map<TokenStatus, List<PatientToken>>>((ref) {
  final tokens = ref.watch(activeTokensProvider).valueOrNull ?? const [];
  final map = <TokenStatus, List<PatientToken>>{
    for (final s in TokenStatus.values) s: <PatientToken>[],
  };
  for (final t in tokens) {
    map[t.status]!.add(t);
  }
  return map;
});
