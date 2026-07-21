import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/data/services/firestore_service.dart';

class QueueService {
  final FirestoreService _fs;
  const QueueService(this._fs);

  /// Sorts tokens by [PatientToken.createdAt] in place. Null timestamps are
  /// treated as the epoch so they sort oldest. Set [descending] for
  /// newest-first ordering.
  static void _sortByCreatedAt(List<PatientToken> list,
      {bool descending = false}) {
    final epoch = DateTime.fromMillisecondsSinceEpoch(0);
    list.sort((a, b) {
      final av = a.createdAt ?? epoch;
      final bv = b.createdAt ?? epoch;
      return descending ? bv.compareTo(av) : av.compareTo(bv);
    });
  }

  /// Issues a token inside a specific facility's queue. [facilityId] scopes the
  /// document path; [facilityName] is denormalized onto the token for display
  /// on patient-side cross-facility screens.
  Future<PatientToken> issueToken({
    required String facilityId,
    required String facilityName,
    required String patientName,
    required String patientId,
    required String department,
    required String codePrefix,
    required int rateMinutes,
  }) async {
    final uid = const Uuid().v4();
    final tokenNumber =
        '$codePrefix-${(DateTime.now().millisecondsSinceEpoch % 900) + 100}';
    final now = DateTime.now();
    final token = PatientToken(
      id: uid,
      tokenNumber: tokenNumber,
      patientName: patientName,
      department: department,
      status: TokenStatus.waiting,
      queuePosition: 0,
      etaMinutes: 0,
      patientId: patientId,
      facilityId: facilityId,
      facilityName: facilityName,
      createdAt: now,
    );
    await _fs.setDoc(FirestorePaths.token(facilityId, uid), token.toJson());
    await _fs.setDoc(FirestorePaths.position(facilityId, uid), {
      'tokenId': uid,
      'department': department,
      'status': token.status.name,
      'updatedAt': now.toIso8601String(),
    });
    return token;
  }

  /// Watches a single token by id across **all** facilities via a collection
  /// group query. The patient screens only know the token id, not which
  /// facility owns it, so we resolve it here with a single equality filter.
  Stream<PatientToken?> watchPatientToken(String tokenId) {
    return _fs.collectionGroupStream(FirestorePaths.tokensGroup, builder: (q) {
      return q.where('id', isEqualTo: tokenId).limit(1);
    }).map((snap) {
      if (snap.docs.isEmpty) return null;
      return PatientToken.fromJson(snap.docs.first.data());
    });
  }

  /// Every active token in one facility, ordered by arrival (staff board).
  Stream<List<PatientToken>> watchActiveTokens(String facilityId) {
    // Sort client-side to avoid a composite index (status + createdAt).
    return _fs.queryStream(FirestorePaths.tokens(facilityId), builder: (q) {
      return q.where('status', whereIn: ['waiting', 'called', 'serving']);
    }).map((snap) {
      final list =
          snap.docs.map((d) => PatientToken.fromJson(d.data())).toList();
      _sortByCreatedAt(list);
      return list;
    });
  }

  /// Active tokens for a single department within a facility, ordered by
  /// arrival.
  Stream<List<PatientToken>> watchDepartmentTokens(
      String facilityId, String department) {
    // Sort client-side to avoid a composite index
    // (department + status + createdAt).
    return _fs.queryStream(FirestorePaths.tokens(facilityId), builder: (q) {
      return q
          .where('department', isEqualTo: department)
          .where('status', whereIn: ['waiting', 'called', 'serving']);
    }).map((snap) {
      final list =
          snap.docs.map((d) => PatientToken.fromJson(d.data())).toList();
      _sortByCreatedAt(list);
      return list;
    });
  }

  /// The patient's most recent still-active token across **all** facilities,
  /// or null if none. Uses a collection group query so a patient with a token
  /// at any facility sees it wherever they are in the app.
  Stream<PatientToken?> watchPatientActiveToken(String patientId) {
    return _fs.collectionGroupStream(FirestorePaths.tokensGroup, builder: (q) {
      return q
          .where('patientId', isEqualTo: patientId)
          .where('status', whereIn: ['waiting', 'called', 'serving']);
    }).map((snap) {
      if (snap.docs.isEmpty) return null;
      final list =
          snap.docs.map((d) => PatientToken.fromJson(d.data())).toList();
      _sortByCreatedAt(list, descending: true);
      return list.first;
    });
  }

  /// Marks a token as [TokenStatus.called] directly (staff "call next").
  Future<void> callToken(String facilityId, String tokenId) =>
      _fs.updateDoc(FirestorePaths.token(facilityId, tokenId), {
        'status': TokenStatus.called.name,
        'calledAt': DateTime.now().toIso8601String(),
      });

  /// Cancels/removes a token from the active queue.
  Future<void> completeToken(String facilityId, String tokenId) =>
      _fs.updateDoc(FirestorePaths.token(facilityId, tokenId), {
        'status': TokenStatus.completed.name,
        'completedAt': DateTime.now().toIso8601String(),
      });

  Future<void> advanceToken(String facilityId, String tokenId) async {
    final snap = await _fs.getDoc(FirestorePaths.token(facilityId, tokenId));
    if (!snap.exists) return;
    final data = Map<String, dynamic>.from(snap.data()!);
    final status = TokenStatus.values.firstWhere(
      (s) => s.name == data['status'],
      orElse: () => TokenStatus.waiting,
    );
    final nextIndex = status.index + 1;
    if (nextIndex >= TokenStatus.values.length) return;
    final newStatus = TokenStatus.values[nextIndex];
    final updates = <String, dynamic>{'status': newStatus.name};
    if (newStatus == TokenStatus.called) {
      updates['calledAt'] = DateTime.now().toIso8601String();
    }
    if (newStatus == TokenStatus.serving) {
      updates['servedAt'] = DateTime.now().toIso8601String();
    }
    if (newStatus == TokenStatus.completed) {
      updates['completedAt'] = DateTime.now().toIso8601String();
    }
    await _fs.updateDoc(FirestorePaths.token(facilityId, tokenId), updates);
  }
}

final queueServiceProvider =
    Provider<QueueService>((ref) => QueueService(ref.watch(firestoreServiceProvider)));
