import 'package:intl/intl.dart';

class AppFormatters {
  const AppFormatters._();

  static final DateFormat dateTimeFmt = DateFormat('dd MMM, hh:mm a');

  static String etaMinutes(int minutes) => minutes > 0 ? '~$minutes Min' : '0 Min';

  static String etaDisplay(int minutes) {
    if (minutes <= 0) return 'Now';
    if (minutes < 60) return '$minutes min';
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return m > 0 ? '$h h $m min' : '$h h';
  }
}
