import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Centralized Firestore paths.
///
/// Firestore requires **documents** to have an even number of path segments
/// and **collections** an odd number.
///
/// The app is **multi-facility**: each hospital / clinic / diagnostic center is
/// a document under the top-level `facilities` collection, and every entity it
/// owns (departments, tokens, appointments, analytics) lives in a subcollection
/// beneath that facility document. This keeps each facility's queue, token
/// sequence, and appointments fully isolated from every other facility's.
///
///   facilities/{facilityId}                      (doc,   2 segments)
///   facilities/{facilityId}/departments          (coll,  3 segments)
///   facilities/{facilityId}/departments/{id}      (doc,   4 segments)
///
/// `users` stays a single top-level collection — a user is global and simply
/// references a facility by id where relevant.
///
/// Keep every path in this class — never hand-build a path string. Getting the
/// segment count wrong (e.g. a 3-segment "document" path) throws at runtime.
class FirestorePaths {
  const FirestorePaths._();

  /// Top-level collections.
  static const String facilities = 'facilities';
  static const String users = 'users';

  static String facility(String facilityId) => '$facilities/$facilityId';
  static String user(String uid) => '$users/$uid';

  // --- Facility-scoped collections (odd segment count) ---------------------

  static String departments(String facilityId) =>
      '${facility(facilityId)}/departments';
  static String tokens(String facilityId) => '${facility(facilityId)}/tokens';
  static String positions(String facilityId) =>
      '${facility(facilityId)}/positions';
  static String appointments(String facilityId) =>
      '${facility(facilityId)}/appointments';
  static String payments(String facilityId) =>
      '${facility(facilityId)}/payments';
  static String analytics(String facilityId) =>
      '${facility(facilityId)}/analytics';

  // --- Facility-scoped documents (even segment count) ----------------------

  static String department(String facilityId, String id) =>
      '${departments(facilityId)}/$id';
  static String token(String facilityId, String id) =>
      '${tokens(facilityId)}/$id';
  static String position(String facilityId, String id) =>
      '${positions(facilityId)}/$id';
  static String appointment(String facilityId, String id) =>
      '${appointments(facilityId)}/$id';
  static String payment(String facilityId, String id) =>
      '${payments(facilityId)}/$id';
  static String analyticsCurrent(String facilityId) =>
      '${analytics(facilityId)}/current';

  // --- Collection-group ids (for cross-facility patient queries) -----------

  /// Used with `collectionGroup('tokens')` to find a patient's tokens across
  /// every facility with a single equality filter (no composite index).
  static const String tokensGroup = 'tokens';
  static const String appointmentsGroup = 'appointments';
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

  /// Queries every collection with [collectionId] regardless of its parent
  /// facility. Used for patient-centric reads that must span all facilities
  /// (e.g. "my appointments everywhere"). Keep the [builder] to a single
  /// equality filter and sort client-side to avoid composite indexes.
  Stream<QuerySnapshot<Map<String, dynamic>>> collectionGroupStream(
    String collectionId, {
    Query<Map<String, dynamic>> Function(Query<Map<String, dynamic>>)? builder,
  }) {
    final base = _db.collectionGroup(collectionId);
    final q = builder != null ? builder(base) : base;
    return q.snapshots();
  }
}

final firestoreServiceProvider = Provider<FirestoreService>((ref) => FirestoreService());
