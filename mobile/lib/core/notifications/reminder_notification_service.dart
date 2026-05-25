import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import '../../features/reminders/reminder_widgets.dart';
import 'reminder_alarm_prefs.dart';

/// Schedules OS-level medicine reminder notifications on Android/iOS.
class ReminderNotificationService {
  ReminderNotificationService._();
  static final ReminderNotificationService instance = ReminderNotificationService._();

  static const _channelId = 'medmx_reminders';
  static const _channelName = 'Medicine Reminders';
  static const _alarmChannelId = 'medmx_alarm';
  static const _alarmChannelName = 'Medicine Alarms';
  static const _prefsKey = 'scheduled_reminder_ids';

  /// Strong repeating vibration pattern for alarm-style alerts.
  static final Int64List _alarmVibrationPattern = Int64List.fromList([
    0, 1000, 400, 1000, 400, 1000, 400, 1200,
  ]);

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  void Function(int reminderId, {String? action})? onReminderOpened;

  int? pendingReminderId;
  String? pendingAction;

  int _notifId(int reminderId, int timeIndex) => reminderId * 10 + timeIndex;

  Future<void> initialize() async {
    if (_initialized) return;

    tz_data.initializeTimeZones();
    try {
      final tzName = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(tzName));
    } catch (_) {
      tz.setLocalLocation(tz.getLocation('Asia/Kolkata'));
    }

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const initSettings = InitializationSettings(android: androidInit, iOS: iosInit);

    await _plugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onResponse,
      onDidReceiveBackgroundNotificationResponse: _onBackgroundResponse,
    );

    final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

    await android?.createNotificationChannel(
      const AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: 'Standard medicine reminder alerts',
        importance: Importance.high,
        playSound: true,
        enableVibration: true,
      ),
    );

    await android?.createNotificationChannel(
      AndroidNotificationChannel(
        _alarmChannelId,
        _alarmChannelName,
        description: 'Loud alarm-style medicine reminders with vibration',
        importance: Importance.max,
        playSound: true,
        enableVibration: true,
        vibrationPattern: _alarmVibrationPattern,
        audioAttributesUsage: AudioAttributesUsage.alarm,
      ),
    );

    _initialized = true;

    final launch = await _plugin.getNotificationAppLaunchDetails();
    if (launch?.didNotificationLaunchApp == true) {
      _handlePayload(launch?.notificationResponse?.payload, launch?.notificationResponse?.actionId);
    }
  }

  Future<bool> requestPermissions() async {
    final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (android != null) {
      final notif = await android.requestNotificationsPermission();
      await android.requestExactAlarmsPermission();
      await android.requestFullScreenIntentPermission();
      return notif ?? true;
    }
    final ios = _plugin.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>();
    if (ios != null) {
      final granted = await ios.requestPermissions(alert: true, badge: true, sound: true);
      return granted ?? false;
    }
    return true;
  }

  Future<void> syncReminders(List<Map<String, dynamic>> reminders) async {
    if (!_initialized) await initialize();

    await ReminderAlarmPrefs.cacheRemindersJson(jsonEncode(reminders));

    final prefs = await SharedPreferences.getInstance();
    final oldIds = (prefs.getStringList(_prefsKey) ?? []).map(int.parse).toList();
    for (final id in oldIds) {
      await _plugin.cancel(id);
    }

    final alarmMode = await ReminderAlarmPrefs.alarmModeEnabled();
    final strict = await ReminderAlarmPrefs.strictBlockEnabled();
    final newIds = <int>[];
    final now = tz.TZDateTime.now(tz.local);

    for (final r in reminders) {
      if (r['status'] == 'paused' || r['enabled'] == false) continue;
      final id = r['id'];
      if (id is! int) continue;

      final times = _timesFor(r);
      if (times.isEmpty) continue;

      final endDate = _endDateFor(r);
      if (endDate != null && now.isAfter(endDate)) continue;

      for (var i = 0; i < times.length; i++) {
        final parts = times[i].split(':');
        if (parts.length < 2) continue;
        final h = int.tryParse(parts[0]) ?? 9;
        final m = int.tryParse(parts[1]) ?? 0;

        var scheduled = tz.TZDateTime(tz.local, now.year, now.month, now.day, h, m);
        if (scheduled.isBefore(now)) {
          scheduled = scheduled.add(const Duration(days: 1));
        }

        final notifId = _notifId(id, i);
        final name = r['medicine_name']?.toString() ?? 'Medicine';
        final dose = r['dose']?.toString() ?? '';
        final notes = reminderNotes(r);
        final body = [dose, notes].where((s) => s.isNotEmpty).join(' · ');

        final details = await _details(
          reminderId: id,
          alarmMode: alarmMode,
          strict: strict,
        );

        await _plugin.zonedSchedule(
          notifId,
          alarmMode ? '⏰ Medicine Alarm' : '💊 Time to take your medicine',
          body.isNotEmpty ? '$name — $body' : name,
          scheduled,
          details,
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          matchDateTimeComponents: DateTimeComponents.time,
          payload: '$id',
        );
        newIds.add(notifId);
      }
    }

    await prefs.setStringList(_prefsKey, newIds.map((e) => e.toString()).toList());
  }

  Future<void> cancelAll() async {
    final prefs = await SharedPreferences.getInstance();
    final oldIds = (prefs.getStringList(_prefsKey) ?? []).map(int.parse).toList();
    for (final id in oldIds) {
      await _plugin.cancel(id);
    }
    await prefs.remove(_prefsKey);
  }

  /// Immediate alarm notification (for testing alarm + vibration).
  Future<void> showTestNotification({int seconds = 5}) async {
    if (!_initialized) await initialize();
    final alarmMode = await ReminderAlarmPrefs.alarmModeEnabled();
    final strict = await ReminderAlarmPrefs.strictBlockEnabled();
    final when = tz.TZDateTime.now(tz.local).add(Duration(seconds: seconds));
    final details = await _details(reminderId: 0, alarmMode: alarmMode, strict: strict);

    await _plugin.zonedSchedule(
      999999,
      '⏰ MedMx test alarm',
      'Alarm + vibration test — you should feel the phone vibrate.',
      when,
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      payload: 'test',
    );
  }

  List<String> _timesFor(Map<String, dynamic> r) {
    final sch = r['schedule'];
    if (sch is Map && sch['times'] is List) {
      return (sch['times'] as List).map((e) => e.toString()).toList();
    }
    if (r['times'] is List) {
      return (r['times'] as List).map((e) => e.toString()).toList();
    }
    return [];
  }

  tz.TZDateTime? _endDateFor(Map<String, dynamic> r) {
    final days = r['duration_days'];
    if (days is! num || days <= 0) return null;
    final sch = r['schedule'];
    DateTime start = DateTime.now();
    if (sch is Map && sch['start_date'] != null) {
      try {
        start = DateTime.parse(sch['start_date'].toString());
      } catch (_) {}
    }
    final end = start.add(Duration(days: days.toInt()));
    return tz.TZDateTime(tz.local, end.year, end.month, end.day, 23, 59);
  }

  Future<NotificationDetails> _details({
    required int reminderId,
    required bool alarmMode,
    required bool strict,
  }) async {
    final channelId = alarmMode ? _alarmChannelId : _channelId;
    final channelName = alarmMode ? _alarmChannelName : _channelName;

    return NotificationDetails(
      android: AndroidNotificationDetails(
        channelId,
        channelName,
        channelDescription: alarmMode ? 'Alarm-style medicine reminders' : 'Medicine reminder alerts',
        importance: Importance.max,
        priority: Priority.max,
        category: alarmMode ? AndroidNotificationCategory.alarm : AndroidNotificationCategory.reminder,
        visibility: NotificationVisibility.public,
        playSound: true,
        enableVibration: true,
        vibrationPattern: alarmMode ? _alarmVibrationPattern : Int64List.fromList([0, 600, 300, 600, 300, 800]),
        audioAttributesUsage: alarmMode ? AudioAttributesUsage.alarm : AudioAttributesUsage.notification,
        fullScreenIntent: strict && reminderId > 0,
        ongoing: strict && reminderId > 0,
        autoCancel: !strict,
        ticker: 'Medicine reminder',
        actions: reminderId > 0
            ? [
                AndroidNotificationAction(
                  'taken',
                  strict ? 'Yes' : 'Taken',
                  showsUserInterface: true,
                  cancelNotification: true,
                ),
                AndroidNotificationAction(
                  'skip',
                  strict ? 'No' : 'Skip',
                  showsUserInterface: true,
                  cancelNotification: true,
                ),
                if (!strict)
                  const AndroidNotificationAction(
                    'snooze',
                    'Remind Later',
                    showsUserInterface: true,
                    cancelNotification: true,
                  ),
              ]
            : null,
      ),
      iOS: DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
        interruptionLevel: alarmMode ? InterruptionLevel.timeSensitive : InterruptionLevel.active,
      ),
    );
  }

  void _onResponse(NotificationResponse response) {
    _handlePayload(response.payload, response.actionId);
  }

  void _handlePayload(String? payload, String? actionId) {
    if (payload == null || payload == 'test') {
      if (payload == 'test') onReminderOpened?.call(0);
      return;
    }
    final id = int.tryParse(payload.split('|').first);
    if (id == null) return;

    final action = actionId ?? 'open';
    pendingReminderId = id;
    pendingAction = action == 'open' ? null : action;
    onReminderOpened?.call(id, action: action == 'open' ? null : action);
  }

  @pragma('vm:entry-point')
  static void _onBackgroundResponse(NotificationResponse response) {
    instance._handlePayload(response.payload, response.actionId);
  }
}
