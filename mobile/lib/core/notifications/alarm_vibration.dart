import 'dart:async';

import 'package:vibration/vibration.dart';

/// Repeating alarm vibration until [stopAlarmVibration] is called.
class AlarmVibration {
  static Timer? _timer;
  static bool _running = false;

  static Future<void> start() async {
    if (_running) return;
    final has = await Vibration.hasVibrator();
    if (has != true) return;
    _running = true;

    // Strong pulse pattern: vibrate 1s, pause 0.4s, repeat.
    await Vibration.vibrate(pattern: [0, 1000, 400, 1000, 400, 1000, 800], repeat: 0);

    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) async {
      if (!_running) return;
      await Vibration.vibrate(pattern: [0, 1000, 400, 1000, 400, 1000, 800], repeat: 0);
    });
  }

  static Future<void> stop() async {
    _running = false;
    _timer?.cancel();
    _timer = null;
    await Vibration.cancel();
  }
}
