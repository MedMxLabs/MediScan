import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/reminders/reminder_notification_sheet.dart';
import '../../features/reminders/reminder_widgets.dart';
import 'reminder_alarm_prefs.dart';

/// Polls for due reminders and opens strict alarm lock when enabled.
class AlarmGuard extends StatefulWidget {
  const AlarmGuard({super.key, required this.router, required this.child});

  final GoRouter router;
  final Widget child;

  @override
  State<AlarmGuard> createState() => _AlarmGuardState();
}

class _AlarmGuardState extends State<AlarmGuard> with WidgetsBindingObserver {
  Timer? _timer;
  bool _checking = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _timer = Timer.periodic(const Duration(seconds: 20), (_) => _checkDueAlarm());
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkDueAlarm());
  }

  @override
  void dispose() {
    _timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkDueAlarm();
    }
  }

  Future<void> _checkDueAlarm() async {
    if (_checking) return;
    final loc = widget.router.state.matchedLocation;
    if (loc == '/alarm-lock' || loc == '/' || loc == '/login' || loc == '/signup') return;

    _checking = true;
    try {
      final strict = await ReminderAlarmPrefs.strictBlockEnabled();
      if (!strict) return;

      final raw = await ReminderAlarmPrefs.cachedRemindersJson();
      if (raw == null || raw.isEmpty) return;

      final list = (jsonDecode(raw) as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
      for (final r in list) {
        final id = r['id'] as int?;
        if (id == null) continue;
        if (r['status'] == 'paused' || r['enabled'] == false) continue;
        if (!isReminderDueNow(r)) continue;
        if (await isReminderSnoozed(id)) continue;

        if (!mounted) return;
        widget.router.go('/alarm-lock', extra: r);
        break;
      }
    } catch (_) {
    } finally {
      _checking = false;
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
