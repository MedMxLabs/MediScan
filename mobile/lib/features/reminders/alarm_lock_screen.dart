import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/medscan_api.dart';
import '../../core/notifications/alarm_vibration.dart';
import '../../core/theme.dart';
import '../../widgets/ui_components.dart';
import 'reminder_notification_sheet.dart';
import 'reminder_widgets.dart';

/// Full-screen alarm — user must tap Yes or No before continuing (strict mode).
class AlarmLockScreen extends StatefulWidget {
  const AlarmLockScreen({super.key, required this.reminder});

  final Map<String, dynamic> reminder;

  @override
  State<AlarmLockScreen> createState() => _AlarmLockScreenState();
}

class _AlarmLockScreenState extends State<AlarmLockScreen> {
  bool _responding = false;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    unawaited(AlarmVibration.start());
  }

  @override
  void dispose() {
    unawaited(AlarmVibration.stop());
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  Future<void> _respond(String status) async {
    if (_responding) return;
    final id = widget.reminder['id'] as int;
    final api = context.read<MedscanApi>();
    setState(() => _responding = true);
    await AlarmVibration.stop();
    try {
      await api.markDose(id, status: status);
    } catch (_) {}

    if (!mounted) return;

    if (status == 'taken') {
      context.go('/reminders/dose-taken', extra: widget.reminder);
    } else if (status == 'skipped') {
      context.go('/home');
    } else {
      await snoozeReminder(id);
      if (!mounted) return;
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.reminder['medicine_name']?.toString() ?? 'Medicine';
    final dose = widget.reminder['dose']?.toString() ?? '';
    final notes = reminderNotes(widget.reminder);
    final time = reminderTimesLabel(widget.reminder);

    return PopScope(
      canPop: false,
      child: DarkScaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Spacer(),
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: AppColors.lime.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: AppColors.lime.withValues(alpha: 0.35), blurRadius: 32, spreadRadius: 4),
                    ],
                  ),
                  child: const Icon(Icons.alarm, color: AppColors.lime, size: 52),
                ),
                const SizedBox(height: 28),
                const Text(
                  '💊 Medicine Reminder 💊',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white),
                ),
                const SizedBox(height: 12),
                Text(
                  'Did you take your medicine?',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.65), fontSize: 16),
                ),
                const SizedBox(height: 28),
                DarkCard(
                  child: Column(
                    children: [
                      if (time.isNotEmpty) _row('Time', time.split(',').first),
                      if (time.isNotEmpty) const Divider(height: 20, color: AppColors.border),
                      _row('Medicine', name),
                      if (dose.isNotEmpty) ...[
                        const Divider(height: 20, color: AppColors.border),
                        _row('Dosage', dose),
                      ],
                      if (notes.isNotEmpty) ...[
                        const Divider(height: 20, color: AppColors.border),
                        _row('Notes', notes),
                      ],
                    ],
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 56,
                        child: OutlinedButton(
                          onPressed: _responding ? null : () => _respond('skipped'),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.red, width: 2),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Text('No', style: TextStyle(color: AppColors.red, fontWeight: FontWeight.w800, fontSize: 18)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: GradientButton(
                        label: 'Yes',
                        loading: _responding,
                        onPressed: _responding ? null : () => _respond('taken'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _responding ? null : () => _respond('snooze'),
                  child: const Text('Remind me in 15 min', style: TextStyle(color: AppColors.textMuted)),
                ),
                const SizedBox(height: 8),
                Text(
                  'Strict mode — respond to continue using the app',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.35), fontSize: 11),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textMuted)),
        Flexible(
          child: Text(value, textAlign: TextAlign.end, style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
        ),
      ],
    );
  }
}
