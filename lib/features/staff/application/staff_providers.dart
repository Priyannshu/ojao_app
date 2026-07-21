import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/clinic_stats.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/data/services/analytics_service.dart';
import 'package:ojao_app/data/services/queue_service.dart';
import 'package:ojao_app/features/patient/application/patient_providers.dart';

/// Every active token across the clinic, ordered by arrival.
final activeTokensProvider = StreamProvider<List<PatientToken>>((ref) {
  return ref.watch(queueServiceProvider).watchActiveTokens();
});

/// A single token by id for the staff detail screen.
final staffTokenByIdProvider =
    StreamProvider.family<PatientToken?, String>((ref, id) {
  return ref.watch(queueServiceProvider).watchPatientToken(id);
});

/// Clinic stats for the staff dashboard (reuses the shared stats stream).
final staffStatsProvider = StreamProvider<ClinicStats>((ref) {
  return ref.watch(analyticsServiceProvider).watchStats();
});

/// Departments list, reused from the patient side for filter chips.
final staffDepartmentsProvider = departmentsProvider;

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
