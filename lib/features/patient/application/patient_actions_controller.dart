import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/appointment.dart';
import 'package:ojao_app/data/models/department.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/data/services/appointment_service.dart';
import 'package:ojao_app/data/services/queue_service.dart';
import 'package:ojao_app/features/auth/application/current_user_provider.dart';

/// Imperative patient operations that report success/failure to the UI.
///
/// Read as `ref.read(patientActionsProvider.notifier)`; the async state
/// drives button spinners on the calling screen.
class PatientActionsController extends AutoDisposeAsyncNotifier<void> {
  @override
  Future<void> build() async {}

  QueueService get _queue => ref.read(queueServiceProvider);
  AppointmentService get _appts => ref.read(appointmentServiceProvider);

  String _prefixFor(String departmentName) {
    final letters = departmentName
        .replaceAll(RegExp(r'[^A-Za-z]'), '')
        .toUpperCase();
    return letters.isEmpty ? 'OJ' : letters.substring(0, letters.length >= 2 ? 2 : 1);
  }

  /// Issues a virtual queue token for the given department.
  /// Returns the created token, or null on failure (error is in [state]).
  Future<PatientToken?> joinQueue(Department department) async {
    final user = ref.read(currentUserProvider);
    if (user == null) {
      state = AsyncError('You must be signed in.', StackTrace.current);
      return null;
    }
    state = const AsyncLoading();
    try {
      final token = await _queue.issueToken(
        patientName: user.displayName ?? user.phoneNumber,
        patientId: user.uid,
        department: department.name,
        codePrefix: _prefixFor(department.name),
        rateMinutes: department.avgWaitMinutes.round(),
      );
      state = const AsyncData(null);
      return token;
    } catch (e, st) {
      state = AsyncError(e, st);
      return null;
    }
  }

  /// Books a scheduled appointment with a doctor in a department.
  Future<Appointment?> bookAppointment({
    required String doctorId,
    required String doctorName,
    required String department,
    required DateTime scheduledAt,
    String? notes,
  }) async {
    final user = ref.read(currentUserProvider);
    if (user == null) {
      state = AsyncError('You must be signed in.', StackTrace.current);
      return null;
    }
    state = const AsyncLoading();
    try {
      final appt = await _appts.bookAppointment(
        patientId: user.uid,
        patientName: user.displayName ?? user.phoneNumber,
        doctorId: doctorId,
        doctorName: doctorName,
        department: department,
        scheduledAt: scheduledAt,
        notes: notes,
      );
      state = const AsyncData(null);
      return appt;
    } catch (e, st) {
      state = AsyncError(e, st);
      return null;
    }
  }

  Future<void> cancelAppointment(String appointmentId) async {
    state = const AsyncLoading();
    try {
      await _appts.cancelAppointment(appointmentId);
      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  /// Leaves the active queue (marks the token completed/cancelled).
  Future<void> leaveQueue(String tokenId) async {
    state = const AsyncLoading();
    try {
      await _queue.completeToken(tokenId);
      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}

final patientActionsProvider =
    AutoDisposeAsyncNotifierProvider<PatientActionsController, void>(
  PatientActionsController.new,
);
