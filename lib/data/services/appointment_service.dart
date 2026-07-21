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

  static const String basePath = FirestorePaths.appointments;

  Future<Appointment> bookAppointment({
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
    await _fs.setDoc('$basePath/$uid', appt.toJson());
    return appt;
  }

  Stream<List<Appointment>> watchPatientAppointments(String patientId) {
    return _fs.queryStream(basePath, builder: (q) {
      return q.where('patientId', isEqualTo: patientId).orderBy('scheduledAt', descending: true);
    }).map((snap) => snap.docs.map((d) => Appointment.fromJson(d.data())).toList());
  }

  Future<void> cancelAppointment(String appointmentId) async {
    await _fs.updateDoc('$basePath/$appointmentId', {'status': AppointmentStatus.cancelled.name});
  }
}

final firebaseFunctionsProvider = Provider<FirebaseFunctions>((ref) => FirebaseFunctions.instance);
final appointmentServiceProvider = Provider<AppointmentService>((ref) => AppointmentService(ref.watch(firestoreServiceProvider), ref.watch(firebaseFunctionsProvider)));
