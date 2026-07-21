import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import 'package:ojao_app/data/models/patient_token.dart';
import 'package:ojao_app/data/services/firestore_service.dart';

class QueueService {
  final FirestoreService _fs;
  const QueueService(this._fs);

  static const String tokensPath = FirestorePaths.tokens;
  static const String positionsPath = FirestorePaths.positions;

  Future<PatientToken> issueToken({
    required String patientName,
    required String patientId,
    required String department,
    required String codePrefix,
    required int rateMinutes,
  }) async {
    final uid = const Uuid().v4();
    final tokenNumber = '$codePrefix-${(DateTime.now().millisecondsSinceEpoch % 900) + 100}';
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
      createdAt: now,
    );
    await _fs.setDoc('$tokensPath/$uid', token.toJson());
    await _fs.setDoc('$positionsPath/$uid', {
      'tokenId': uid,
      'department': department,
      'status': token.status.name,
      'updatedAt': now.toIso8601String(),
    });
    return token;
  }

  Stream<PatientToken?> watchPatientToken(String tokenId) {
    return _fs.docStream('$tokensPath/$tokenId').map((snap) {
      if (!snap.exists) return null;
      return PatientToken.fromJson(snap.data()!);
    });
  }

  Stream<List<PatientToken>> watchActiveTokens() {
    return _fs.queryStream(tokensPath, builder: (q) {
      return q.where('status', whereIn: ['waiting', 'called', 'serving']).orderBy('createdAt');
    }).map((snap) => snap.docs.map((d) => PatientToken.fromJson(d.data())).toList());
  }

  /// Active tokens for a single department, ordered by arrival.
  Stream<List<PatientToken>> watchDepartmentTokens(String department) {
    return _fs.queryStream(tokensPath, builder: (q) {
      return q
          .where('department', isEqualTo: department)
          .where('status', whereIn: ['waiting', 'called', 'serving'])
          .orderBy('createdAt');
    }).map((snap) => snap.docs.map((d) => PatientToken.fromJson(d.data())).toList());
  }

  /// The patient's most recent still-active token, or null if none.
  Stream<PatientToken?> watchPatientActiveToken(String patientId) {
    return _fs.queryStream(tokensPath, builder: (q) {
      return q
          .where('patientId', isEqualTo: patientId)
          .where('status', whereIn: ['waiting', 'called', 'serving'])
          .orderBy('createdAt', descending: true)
          .limit(1);
    }).map((snap) =>
        snap.docs.isEmpty ? null : PatientToken.fromJson(snap.docs.first.data()));
  }

  /// Marks a token as [TokenStatus.called] directly (staff "call next").
  Future<void> callToken(String tokenId) =>
      _fs.updateDoc('$tokensPath/$tokenId', {
        'status': TokenStatus.called.name,
        'calledAt': DateTime.now().toIso8601String(),
      });

  /// Cancels/removes a token from the active queue.
  Future<void> completeToken(String tokenId) =>
      _fs.updateDoc('$tokensPath/$tokenId', {
        'status': TokenStatus.completed.name,
        'completedAt': DateTime.now().toIso8601String(),
      });

  Future<void> advanceToken(String tokenId) async {
    final snap = await _fs.getDoc('$tokensPath/$tokenId');
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
    if (newStatus == TokenStatus.called) updates['calledAt'] = DateTime.now().toIso8601String();
    if (newStatus == TokenStatus.serving) updates['servedAt'] = DateTime.now().toIso8601String();
    if (newStatus == TokenStatus.completed) updates['completedAt'] = DateTime.now().toIso8601String();
    await _fs.updateDoc('$tokensPath/$tokenId', updates);
  }
}

final queueServiceProvider = Provider<QueueService>((ref) => QueueService(ref.watch(firestoreServiceProvider)));
