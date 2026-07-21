import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/services/queue_service.dart';
import 'package:ojao_app/features/staff/application/staff_providers.dart';

/// Queue operations available to clinic staff. The async state powers
/// per-action button spinners; errors surface via [state]. All operations are
/// scoped to the staff member's own facility ([staffFacilityIdProvider]).
class StaffActionsController extends AutoDisposeAsyncNotifier<void> {
  @override
  Future<void> build() async {}

  QueueService get _queue => ref.read(queueServiceProvider);

  /// The facility this staff member operates. Throws if unassigned so the
  /// error surfaces in the action's [state] rather than writing to a bad path.
  String get _facilityId {
    final id = ref.read(staffFacilityIdProvider);
    if (id == null) {
      throw Exception('No facility is assigned to your account.');
    }
    return id;
  }

  /// Moves a token to its next lifecycle status
  /// (waiting -> called -> serving -> completed).
  Future<void> advance(String tokenId) =>
      _run(() => _queue.advanceToken(_facilityId, tokenId));

  /// Calls a specific token (jumps straight to "called").
  Future<void> call(String tokenId) =>
      _run(() => _queue.callToken(_facilityId, tokenId));

  /// Completes/removes a token from the active queue.
  Future<void> complete(String tokenId) =>
      _run(() => _queue.completeToken(_facilityId, tokenId));

  Future<void> _run(Future<void> Function() op) async {
    state = const AsyncLoading();
    try {
      await op();
      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}

final staffActionsProvider =
    AutoDisposeAsyncNotifierProvider<StaffActionsController, void>(
  StaffActionsController.new,
);
