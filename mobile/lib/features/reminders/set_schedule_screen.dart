import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/medscan_api.dart';
import '../../core/notifications/reminder_notification_service.dart';
import '../../core/theme.dart';
import '../../widgets/ui_components.dart';
import 'models/reminder_draft.dart';
import 'reminder_widgets.dart';

class SetScheduleScreen extends StatefulWidget {
  const SetScheduleScreen({super.key, required this.draft});

  final ReminderDraft draft;

  @override
  State<SetScheduleScreen> createState() => _SetScheduleScreenState();
}

class _SetScheduleScreenState extends State<SetScheduleScreen> {
  late List<String> _times;
  late String _frequency;
  late DateTime _startDate;
  late int _durationDays;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _times = List<String>.from(widget.draft.times);
    _frequency = widget.draft.frequency;
    _startDate = widget.draft.startDate;
    _durationDays = widget.draft.durationDays;
  }

  ReminderDraft get _draft {
    final d = widget.draft.copy();
    d.times = _times;
    d.frequency = _frequency;
    d.startDate = _startDate;
    d.durationDays = _durationDays;
    return d;
  }

  Future<void> _addTime() async {
    final t = await pickTime24(context);
    if (t == null || !mounted) return;
    if (_times.contains(t)) return;
    setState(() => _times = [..._times, t]..sort());
  }

  Future<void> _schedule() async {
    final api = context.read<MedscanApi>();
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _saving = true);
    try {
      final result = await api.createReminder(_draft.toApiPayload());
      final reminder = Map<String, dynamic>.from(result);
      final rows = await api.getReminders();
      await ReminderNotificationService.instance.requestPermissions();
      await ReminderNotificationService.instance.syncReminders(rows);
      if (!mounted) return;
      context.go('/reminders/saved', extra: {'draft': _draft, 'reminder': reminder});
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text(e.toString())));
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DarkScaffold(
      appBar: const DarkAppBar(title: 'Set Schedule'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          const FormSectionLabel('Times'),
          TimeChipsRow(
            times: _times,
            onRemove: (t) => setState(() => _times.remove(t)),
            onAdd: _addTime,
          ),
          const SizedBox(height: 24),
          const FormSectionLabel('Frequency'),
          DarkDropdown<String>(
            value: _frequency,
            items: reminderFrequencies,
            onChanged: (v) => setState(() => _frequency = v ?? _frequency),
          ),
          const SizedBox(height: 24),
          const FormSectionLabel('Start Date'),
          GestureDetector(
            onTap: () async {
              final d = await pickStartDate(context, _startDate);
              if (d != null) setState(() => _startDate = d);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                color: AppColors.cardDark,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border.withValues(alpha: 0.6)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_today_outlined, color: AppColors.textMuted, size: 20),
                  const SizedBox(width: 12),
                  Text(formatDisplayDate(_startDate), style: const TextStyle(color: Colors.white, fontSize: 15)),
                  const Spacer(),
                  const Icon(Icons.chevron_right, color: AppColors.textMuted),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          const FormSectionLabel('Duration'),
          DurationStepper(days: _durationDays, onChanged: (d) => setState(() => _durationDays = d)),
          const SizedBox(height: 32),
          GradientButton(label: 'Schedule Reminder', onPressed: _schedule, loading: _saving),
        ],
      ),
    );
  }
}
