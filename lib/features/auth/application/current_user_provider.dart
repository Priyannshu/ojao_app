import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ojao_app/data/models/user_model.dart';
import 'package:ojao_app/features/auth/application/auth_controller.dart';

/// The signed-in [UserModel], or null when unauthenticated.
///
/// Screens read this instead of digging into the auth state shape.
final currentUserProvider = Provider<UserModel?>((ref) {
  final auth = ref.watch(authControllerProvider);
  return auth.valueOrNull?.user;
});
