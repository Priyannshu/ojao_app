import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/clinic_stats.dart';
import 'package:ojao_app/data/services/firestore_service.dart';

class AnalyticsService {
  final FirestoreService _fs;
  const AnalyticsService(this._fs);

  Future<ClinicStats> fetchLatestStats(String facilityId) async {
    final snap = await _fs.getDoc(FirestorePaths.analyticsCurrent(facilityId));
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

  Stream<ClinicStats> watchStats(String facilityId) {
    return _fs.docStream(FirestorePaths.analyticsCurrent(facilityId)).map((snap) {
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
