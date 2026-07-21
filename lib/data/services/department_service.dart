import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/department.dart';
import 'package:ojao_app/data/services/firestore_service.dart';

class DepartmentService {
  final FirestoreService _fs;
  const DepartmentService(this._fs);

  static const String basePath = FirestorePaths.departments;

  Stream<List<Department>> watchDepartments() {
    return _fs.queryStream(basePath, builder: (q) => q.where('isActive', isEqualTo: true))
        .map((snap) => snap.docs.map((d) => Department.fromJson(d.data())).toList());
  }

  Future<Department?> getDepartment(String id) async {
    final snap = await _fs.getDoc('$basePath/$id');
    if (!snap.exists) return null;
    return Department.fromJson(snap.data()!);
  }

  Future<void> createDepartment(Department dept) async {
    await _fs.setDoc('$basePath/${dept.id}', dept.toJson());
  }
}

final departmentServiceProvider = Provider<DepartmentService>((ref) => DepartmentService(ref.watch(firestoreServiceProvider)));
