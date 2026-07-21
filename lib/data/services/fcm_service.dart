import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class FcmService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    await _messaging.requestPermission(alert: true, badge: true, sound: true);
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: android, iOS: DarwinInitializationSettings());
    await _local.initialize(initSettings);
    FirebaseMessaging.onMessage.listen((msg) {
      final n = msg.notification;
      if (n == null) return;
      _local.show(
        n.hashCode, n.title, n.body,
        const NotificationDetails(
          android: AndroidNotificationDetails('ojao_queue', 'Queue Alerts', importance: Importance.high, priority: Priority.high),
        ),
      );
    });
  }

  Future<String?> getToken() => _messaging.getToken();
  Future<void> subscribeToTopic(String topic) => _messaging.subscribeToTopic(topic);
}
