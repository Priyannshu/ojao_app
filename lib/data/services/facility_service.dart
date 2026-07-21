import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/facility.dart';
import 'package:ojao_app/data/services/firestore_service.dart';

/// Reads the top-level `facilities` collection. Facilities are the tenants of
/// the app — each hospital / clinic / diagnostic center owns its own
/// departments, queue and appointments beneath its document.
class FacilityService {
  final FirestoreService _fs;
  const FacilityService(this._fs);

  static const String basePath = FirestorePaths.facilities;

  /// All active facilities. Distance sorting is done client-side against the
  /// user's location, so no geo-query / index is required here.
  Stream<List<Facility>> watchFacilities() {
    return _fs
        .queryStream(basePath, builder: (q) => q.where('isActive', isEqualTo: true))
        .map((snap) => snap.docs.map((d) => Facility.fromJson(d.data())).toList());
  }

  Future<Facility?> getFacility(String id) async {
    final snap = await _fs.getDoc(FirestorePaths.facility(id));
    if (!snap.exists) return null;
    return Facility.fromJson(snap.data()!);
  }

  Future<void> createFacility(Facility facility) async {
    await _fs.setDoc(FirestorePaths.facility(facility.id), facility.toJson());
  }
}

final facilityServiceProvider =
    Provider<FacilityService>((ref) => FacilityService(ref.watch(firestoreServiceProvider)));
