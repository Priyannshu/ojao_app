import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/clinic_stats.dart';
import 'package:ojao_app/data/services/firestore_service.dart';

class AnalyticsService {
  final FirestoreService _fs;
  const AnalyticsService(this._fs);

  static const String statsPath = FirestorePaths.analyticsCurrent;

  Future<ClinicStats> fetchLatestStats() async {
    final snap = await _fs.getDoc(statsPath);
    if (!snap.exists) {
      return ClinicStats(
        id: 'current',
        activePatients: 0,
        avgWaitReduction: 0.0,
        patientSatisfaction: 0.0,
        imagingTurnaround: 0.0,
        patientsServed: 0,
        updatedAt: DateTime.now(),
      );
    }
    return ClinicStats.fromJson(snap.data()!);
  }

  Stream<ClinicStats> watchStats() {
    return _fs.docStream(statsPath).map((snap) {
      if (!snap.exists) {
        return ClinicStats(
          id: 'current',
          activePatients: 0,
          avgWaitReduction: 0.0,
          patientSatisfaction: 0.0,
          imagingTurnaround: 0.0,
          patientsServed: 0,
          updatedAt: DateTime.now(),
        );
      }
      return ClinicStats.fromJson(snap.data()!);
    });
  }
}

final analyticsServiceProvider = Provider<AnalyticsService>((ref) => AnalyticsService(ref.watch(firestoreServiceProvider)));
