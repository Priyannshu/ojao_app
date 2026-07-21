import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import 'package:ojao_app/data/models/appointment.dart';
import 'package:ojao_app/data/services/firestore_service.dart';

class AppointmentService {
  final FirestoreService _fs;
  // ignore: unused_field
  final FirebaseFunctions _functions;
  const AppointmentService(this._fs, this._functions);

  /// Books an appointment inside a specific facility. The [facilityId] is
  /// stored on the doc so patient-side collection-group reads can resolve the
  /// owning facility (and thus the doc path for later updates).
  Future<Appointment> bookAppointment({
    required String facilityId,
    String? facilityName,
    required String patientId,
    String? patientName,
    required String doctorId,
    required String doctorName,
    required String department,
    required DateTime scheduledAt,
    String? notes,
  }) async {
    final uid = const Uuid().v4();
    final appt = Appointment(
      id: uid,
      facilityId: facilityId,
      facilityName: facilityName,
      patientId: patientId,
      patientName: patientName,
      doctorId: doctorId,
      doctorName: doctorName,
      department: department,
      scheduledAt: scheduledAt,
      status: AppointmentStatus.pending,
      notes: notes,
      createdAt: DateTime.now(),
    );
    await _fs.setDoc(FirestorePaths.appointment(facilityId, uid), appt.toJson());
    return appt;
  }

  /// A patient's appointments across **every** facility, newest first.
  ///
  /// Uses a `collectionGroup('appointments')` query with a single equality
  /// filter (patientId) and sorts client-side, so no composite index is
  /// required — the same failure mode that previously broke this screen.
  Stream<List<Appointment>> watchPatientAppointments(String patientId) {
    return _fs.collectionGroupStream(FirestorePaths.appointmentsGroup,
        builder: (q) {
      return q.where('patientId', isEqualTo: patientId);
    }).map((snap) {
      final list =
          snap.docs.map((d) => Appointment.fromJson(d.data())).toList();
      list.sort((a, b) => b.scheduledAt.compareTo(a.scheduledAt));
      return list;
    });
  }

  Future<void> cancelAppointment(
      String facilityId, String appointmentId) async {
    await _fs.updateDoc(FirestorePaths.appointment(facilityId, appointmentId),
        {'status': AppointmentStatus.cancelled.name});
  }
}

final firebaseFunctionsProvider = Provider<FirebaseFunctions>((ref) => FirebaseFunctions.instance);
final appointmentServiceProvider = Provider<AppointmentService>((ref) => AppointmentService(ref.watch(firestoreServiceProvider), ref.watch(firebaseFunctionsProvider)));
