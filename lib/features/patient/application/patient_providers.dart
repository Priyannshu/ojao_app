import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/core/constants/app_constants.dart';
import 'package:ojao_app/data/models/appointment.dart';
import 'package:ojao_app/data/models/clinic_stats.dart';
import 'package:ojao_app/data/models/department.dart';
import 'package:ojao_app/data/models/facility.dart';
import 'package:ojao_app/data/models/nearby_hospital.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/data/services/analytics_service.dart';
import 'package:ojao_app/data/services/appointment_service.dart';
import 'package:ojao_app/data/services/department_service.dart';
import 'package:ojao_app/data/services/facility_service.dart';
import 'package:ojao_app/data/services/hospital_api_service.dart';
import 'package:ojao_app/data/services/queue_service.dart';
import 'package:ojao_app/features/auth/application/current_user_provider.dart';
import 'package:ojao_app/features/patient/application/location_controller.dart';

/// Verified hospitals near the patient, fetched from the backend PostGIS
/// endpoint (ARCHITECTURE.md section 3). Only used when
/// [AppConstants.useHospitalApi] is enabled; distance is server-computed.
///
/// Waits for a resolved position — without one there's nothing to search by, so
/// it returns an empty list (the UI shows the enable-location prompt instead).
final nearbyHospitalsProvider = FutureProvider<List<NearbyHospital>>((ref) async {
  final position = ref.watch(currentPositionProvider);
  if (position == null) return const [];
  return ref.watch(hospitalApiServiceProvider).nearby(
        latitude: position.latitude,
        longitude: position.longitude,
      );
});

/// All active facilities (hospitals / clinics / diagnostic centers), unsorted.
///
/// Migration switch (delivery step 3): when [AppConstants.useHospitalApi] is on,
/// this sources from the backend nearby endpoint so every existing consumer —
/// loading, error, empty and data states — works unchanged against the REST API
/// instead of Firestore. Off by default, preserving the Firestore MVP.
final facilitiesProvider = StreamProvider<List<Facility>>((ref) {
  if (AppConstants.useHospitalApi) {
    // Re-expose the FutureProvider's async state as a single-value stream so the
    // StreamProvider contract (and AsyncValueView) is preserved.
    final async = ref.watch(nearbyHospitalsProvider);
    return async.when(
      data: (hospitals) =>
          Stream.value(hospitals.map((h) => h.toFacility()).toList()),
      loading: () => const Stream.empty(),
      error: Stream<List<Facility>>.error,
    );
  }
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
