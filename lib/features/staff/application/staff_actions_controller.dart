import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/services/queue_service.dart';

/// Queue operations available to clinic staff. The async state powers
/// per-action button spinners; errors surface via [state].
class StaffActionsController extends AutoDisposeAsyncNotifier<void> {
  @override
  Future<void> build() async {}

  QueueService get _queue => ref.read(queueServiceProvider);

  /// Moves a token to its next lifecycle status
  /// (waiting -> called -> serving -> completed).
  Future<void> advance(String tokenId) => _run(() => _queue.advanceToken(tokenId));

  /// Calls a specific token (jumps straight to "called").
  Future<void> call(String tokenId) => _run(() => _queue.callToken(tokenId));

  /// Completes/removes a token from the active queue.
  Future<void> complete(String tokenId) =>
      _run(() => _queue.completeToken(tokenId));

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
