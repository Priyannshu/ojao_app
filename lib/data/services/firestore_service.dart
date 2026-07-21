import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Centralized Firestore paths.
///
/// Firestore requires **documents** to have an even number of path segments
/// and **collections** an odd number. Everything the app owns lives under a
/// single clinic document (`clinics/main`) so that entity collections are
/// 3 segments (odd, valid) and entity documents are 4 segments (even, valid).
///
/// Keep every path in this class — never hand-build a `clinic/...` string,
/// which was the original bug (`clinic/users/{uid}` is 3 segments and is an
/// illegal document path).
class FirestorePaths {
  const FirestorePaths._();

  /// The clinic root document. Single-tenant for now; becomes the clinic id
  /// if the app goes multi-tenant later.
  static const String clinic = 'clinics/main';

  // Collections (odd segment count).
  static const String users = '$clinic/users';
  static const String departments = '$clinic/departments';
  static const String tokens = '$clinic/tokens';
  static const String positions = '$clinic/positions';
  static const String appointments = '$clinic/appointments';
  static const String payments = '$clinic/payments';
  static const String analytics = '$clinic/analytics';

  // Well-known single documents (even segment count).
  static const String analyticsCurrent = '$analytics/current';

  static String user(String uid) => '$users/$uid';
  static String department(String id) => '$departments/$id';
  static String token(String id) => '$tokens/$id';
  static String position(String id) => '$positions/$id';
  static String appointment(String id) => '$appointments/$id';
  static String payment(String id) => '$payments/$id';
}

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  CollectionReference<Map<String, dynamic>> collection(String path) => _db.collection(path);

  Stream<DocumentSnapshot<Map<String, dynamic>>> docStream(String path) => _db.doc(path).snapshots();

  Future<DocumentSnapshot<Map<String, dynamic>>> getDoc(String path) => _db.doc(path).get();

  Future<void> setDoc(String path, Map<String, dynamic> data) => _db.doc(path).set(data);

  Future<void> updateDoc(String path, Map<String, dynamic> data) => _db.doc(path).update(data);

  Future<void> deleteDoc(String path) => _db.doc(path).delete();

  Stream<QuerySnapshot<Map<String, dynamic>>> queryStream(
    String path, {
    Query<Map<String, dynamic>> Function(Query<Map<String, dynamic>>)? builder,
  }) {
    final base = _db.collection(path);
    final q = builder != null ? builder(base) : base;
    return q.snapshots();
  }
}

final firestoreServiceProvider = Provider<FirestoreService>((ref) => FirestoreService());
