// GENERATED FILE — PLACEHOLDER.
//
// This is a stub so the project compiles before Firebase is wired up.
// Replace it by running, from the project root:
//
//   dart pub global activate flutterfire_cli
//   flutterfire configure
//
// That command connects to your Firebase project and OVERWRITES this file
// with real API keys and app IDs for each platform. Do not hand-edit the
// generated version. See FIREBASE_SETUP.md for the full walkthrough.
//
// ignore_for_file: type=lint
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not configured for this platform. '
          'Run `flutterfire configure` to generate real values.',
        );
    }
  }

  // --- PLACEHOLDER VALUES — replaced by `flutterfire configure` ---

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBIqfv0znVux20yP_WOZZfi7-3MdC94YOY',
    appId: '1:507588041845:android:27a6615fcaa6d13254ec3c',
    messagingSenderId: '507588041845',
    projectId: 'flutter-ai-playground-c5471',
    storageBucket: 'flutter-ai-playground-c5471.firebasestorage.app',
  );
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBjtL4W9zVUwxTYHJEXDzwOI1Xg1sRaDTc',
    appId: '1:507588041845:ios:1a025bab2e941e4e54ec3c',
    messagingSenderId: '507588041845',
    projectId: 'flutter-ai-playground-c5471',
    storageBucket: 'flutter-ai-playground-c5471.firebasestorage.app',
    iosBundleId: 'com.ojao.ojaoApp',
  );
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'REPLACE_ME',
    appId: 'REPLACE_ME',
    messagingSenderId: 'REPLACE_ME',
    projectId: 'REPLACE_ME',
    storageBucket: 'REPLACE_ME',
    authDomain: 'REPLACE_ME',
  );
}
