import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/department.dart';
import 'package:ojao_app/data/services/firestore_service.dart';

class DepartmentService {
  final FirestoreService _fs;
  const DepartmentService(this._fs);

  /// Active departments for a single facility.
  Stream<List<Department>> watchDepartments(String facilityId) {
    return _fs
        .queryStream(FirestorePaths.departments(facilityId),
            builder: (q) => q.where('isActive', isEqualTo: true))
        .map((snap) => snap.docs.map((d) => Department.fromJson(d.data())).toList());
  }

  Future<Department?> getDepartment(String facilityId, String id) async {
    final snap = await _fs.getDoc(FirestorePaths.department(facilityId, id));
    if (!snap.exists) return null;
    return Department.fromJson(snap.data()!);
  }

  Future<void> createDepartment(String facilityId, Department dept) async {
    await _fs.setDoc(FirestorePaths.department(facilityId, dept.id), dept.toJson());
  }
}

final departmentServiceProvider = Provider<DepartmentService>((ref) => DepartmentService(ref.watch(firestoreServiceProvider)));
