import 'package:connectivity_plus/connectivity_plus.dart';

class StorageService {
  final Connectivity _connectivity = Connectivity();

  Stream<bool> get connectivityStream {
    return _connectivity.onConnectivityChanged.map((results) => results.any((r) => r != ConnectivityResult.none));
  }

  Future<bool> hasNetwork() async {
    final result = await _connectivity.checkConnectivity();
    return result.any((r) => r != ConnectivityResult.none);
  }
}
