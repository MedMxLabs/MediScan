import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/api/medscan_api.dart';
import '../../core/theme.dart';
import 'reminder_widgets.dart';

Future<void> snoozeReminder(int id) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setInt(
    'reminder_snooze_$id',
    DateTime.now().add(const Duration(minutes: 15)).millisecondsSinceEpoch,
  );
}

Future<void> showReminderNotificationSheet(
  BuildContext context,
  Map<String, dynamic> reminder,
) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _ReminderNotificationSheet(reminder: reminder),
  );
}

class _ReminderNotificationSheet extends StatelessWidget {
  const _ReminderNotificationSheet({required this.reminder});

  final Map<String, dynamic> reminder;

  Future<void> _snooze(BuildContext context) async {
    final id = reminder['id'];
    await snoozeReminder(id as int);
    if (context.mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reminder snoozed for 15 minutes')),
      );
    }
  }

  Future<void> _mark(BuildContext context, String status) async {
    final id = reminder['id'] as int;
    await context.read<MedscanApi>().markDose(id, status: status);
    if (!context.mounted) return;
    Navigator.pop(context);
    if (status == 'taken') {
      context.push('/reminders/dose-taken', extra: reminder);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(status == 'skipped' ? 'Dose skipped' : 'Marked as missed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = reminder['medicine_name']?.toString() ?? 'Medicine';
    final dose = reminder['dose']?.toString() ?? '';
    final notes = reminderNotes(reminder);
    final time = reminderTimesLabel(reminder).split(',').first;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
      decoration: BoxDecoration(
        color: AppColors.cardDark,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.teal.withValues(alpha: 0.35)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('MedMx', style: TextStyle(color: AppColors.lime, fontWeight: FontWeight.w800)),
              const Spacer(),
              Text(time, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 16),
          const Center(
            child: Text(
              '💊 Time to take your medicine 💊',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
            ),
          ),
          const SizedBox(height: 16),
          Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
          if (dose.isNotEmpty) Text(dose, style: const TextStyle(color: AppColors.textMuted)),
          if (notes.isNotEmpty) Text(notes, style: const TextStyle(color: AppColors.lime, fontSize: 13)),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _ActionBtn(
                  label: 'Taken',
                  color: AppColors.lime,
                  icon: Icons.check,
                  onTap: () => _mark(context, 'taken'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ActionBtn(
                  label: 'Skip',
                  color: AppColors.amber,
                  icon: Icons.skip_next,
                  onTap: () => _mark(context, 'skipped'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _ActionBtn(
            label: 'Remind Later',
            color: AppColors.teal,
            icon: Icons.notifications_outlined,
            onTap: () => _snooze(context),
          ),
        ],
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  const _ActionBtn({
    required this.label,
    required this.color,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final Color color;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.2),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Returns true if reminder is snoozed.
Future<bool> isReminderSnoozed(int id) async {
  final prefs = await SharedPreferences.getInstance();
  final until = prefs.getInt('reminder_snooze_$id');
  if (until == null) return false;
  if (DateTime.now().millisecondsSinceEpoch < until) return true;
  await prefs.remove('reminder_snooze_$id');
  return false;
}
