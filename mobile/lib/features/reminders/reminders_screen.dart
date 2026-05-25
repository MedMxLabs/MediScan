import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/medscan_api.dart';
import '../../core/app_helpers.dart';
import '../../core/notifications/alarm_vibration.dart';
import '../../core/notifications/reminder_alarm_prefs.dart';
import '../../core/notifications/reminder_notification_service.dart';
import '../../core/theme.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/ui_components.dart';
import 'reminder_notification_sheet.dart';
import 'reminder_widgets.dart';

class RemindersScreen extends StatefulWidget {
  const RemindersScreen({super.key});

  @override
  State<RemindersScreen> createState() => _RemindersScreenState();
}

class _RemindersScreenState extends State<RemindersScreen> {
  List<Map<String, dynamic>> _reminders = [];
  bool _loading = true;
  bool _notificationsEnabled = true;
  bool _alarmMode = true;
  bool _strictBlock = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final api = context.read<MedscanApi>();
    setState(() => _loading = true);
    try {
      final enabled = await ReminderNotificationService.instance.requestPermissions();
      final alarmMode = await ReminderAlarmPrefs.alarmModeEnabled();
      final strictBlock = await ReminderAlarmPrefs.strictBlockEnabled();
      final rows = await api.getReminders();
      await ReminderNotificationService.instance.syncReminders(rows);
      if (!mounted) return;
      setState(() {
        _reminders = rows;
        _notificationsEnabled = enabled;
        _alarmMode = alarmMode;
        _strictBlock = strictBlock;
        _loading = false;
      });
      await _handlePendingNotification(rows);
      if (ReminderNotificationService.instance.pendingReminderId == null) {
        await _maybeShowDueReminder(rows);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _handlePendingNotification(List<Map<String, dynamic>> rows) async {
    if (!mounted) return;
    final api = context.read<MedscanApi>();
    final messenger = ScaffoldMessenger.of(context);
    final svc = ReminderNotificationService.instance;
    final pendingId = svc.pendingReminderId;
    if (pendingId == null) return;

    final action = svc.pendingAction;
    svc.pendingReminderId = null;
    svc.pendingAction = null;

    Map<String, dynamic>? reminder;
    for (final r in rows) {
      if (r['id'] == pendingId) {
        reminder = r;
        break;
      }
    }
    if (reminder == null) return;

    if (action == 'taken') {
      await AlarmVibration.stop();
      await api.markDose(pendingId, status: 'taken');
      if (!mounted) return;
      context.push('/reminders/dose-taken', extra: reminder);
      return;
    }
    if (action == 'skip') {
      await api.markDose(pendingId, status: 'skipped');
      if (!mounted) return;
      messenger.showSnackBar(const SnackBar(content: Text('Dose skipped')));
      return;
    }
    if (action == 'snooze') {
      await snoozeReminder(pendingId);
      if (!mounted) return;
      messenger.showSnackBar(const SnackBar(content: Text('Reminder snoozed for 15 minutes')));
      return;
    }

    if (!mounted) return;
    await showReminderNotificationSheet(context, reminder);
  }

  Future<void> _showDueUi(Map<String, dynamic> r) async {
    if (_strictBlock) {
      context.push('/alarm-lock', extra: r);
    } else {
      await showReminderNotificationSheet(context, r);
    }
  }

  Future<void> _maybeShowDueReminder(List<Map<String, dynamic>> rows) async {
    for (final r in rows) {
      final id = r['id'] as int?;
      if (id == null) continue;
      if (!isReminderDueNow(r)) continue;
      if (await isReminderSnoozed(id)) continue;
      if (!mounted) return;
      await _showDueUi(r);
      break;
    }
  }

  Future<void> _setAlarmMode(bool v) async {
    await ReminderAlarmPrefs.setAlarmMode(v);
    setState(() => _alarmMode = v);
    await ReminderNotificationService.instance.syncReminders(_reminders);
  }

  Future<void> _setStrictBlock(bool v) async {
    await ReminderAlarmPrefs.setStrictBlock(v);
    setState(() => _strictBlock = v);
    await ReminderNotificationService.instance.syncReminders(_reminders);
    if (v && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Strict mode on — you must tap Yes or No when a dose is due')),
      );
    }
  }

  Future<void> _previewAlarmLock() async {
    if (_reminders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add a reminder first to preview strict mode')),
      );
      return;
    }
    context.push('/alarm-lock', extra: _reminders.first);
  }

  Future<void> _enableNotifications() async {
    final messenger = ScaffoldMessenger.of(context);
    final ok = await ReminderNotificationService.instance.requestPermissions();
    if (!mounted) return;
    setState(() => _notificationsEnabled = ok);
    if (ok) {
      await ReminderNotificationService.instance.syncReminders(_reminders);
      await ReminderNotificationService.instance.showTestNotification(seconds: 5);
      if (!mounted) return;
      messenger.showSnackBar(
        const SnackBar(content: Text('Test notification in 5 seconds — check your status bar')),
      );
    } else {
      messenger.showSnackBar(
        const SnackBar(content: Text('Allow notifications in phone Settings → Apps → MedMx LABS')),
      );
    }
  }

  Future<void> _toggle(int id, bool enabled) async {
    await context.read<MedscanApi>().updateReminder({'id': id, 'enabled': enabled});
    await _load();
  }

  Future<void> _delete(int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardDark,
        title: const Text('Delete reminder?', style: TextStyle(color: Colors.white)),
        content: const Text('This cannot be undone.', style: TextStyle(color: AppColors.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: AppColors.red))),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    await context.read<MedscanApi>().deleteReminder(id);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final todayLabel = formatIsoDate(DateTime.now().toIso8601String());

    return PageShell(
      title: 'Reminders',
      showBack: true,
      child: _loading
          ? const LoadingOverlay()
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!_notificationsEnabled)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: DarkCard(
                      onTap: _enableNotifications,
                      child: Row(
                        children: [
                          const Icon(Icons.notifications_off_outlined, color: AppColors.amber),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Notifications are off — tap to enable',
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontWeight: FontWeight.w600),
                            ),
                          ),
                          const Icon(Icons.chevron_right, color: AppColors.textMuted),
                        ],
                      ),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  child: DarkCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Alert settings', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 15)),
                        const SizedBox(height: 4),
                        Text(
                          'Customize vibration and lock-screen behaviour',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 12),
                        ),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Alarm mode', style: TextStyle(color: Colors.white, fontSize: 14)),
                          subtitle: const Text('Loud alert + strong vibration', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                          value: _alarmMode,
                          activeTrackColor: AppColors.lime.withValues(alpha: 0.4),
                          thumbColor: WidgetStateProperty.resolveWith(
                            (s) => s.contains(WidgetState.selected) ? AppColors.lime : null,
                          ),
                          onChanged: _setAlarmMode,
                        ),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Strict mode (optional)', style: TextStyle(color: Colors.white, fontSize: 14)),
                          subtitle: const Text('Must tap Yes/No before using the app', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                          value: _strictBlock,
                          activeTrackColor: AppColors.amber.withValues(alpha: 0.4),
                          thumbColor: WidgetStateProperty.resolveWith(
                            (s) => s.contains(WidgetState.selected) ? AppColors.amber : null,
                          ),
                          onChanged: _setStrictBlock,
                        ),
                        if (_strictBlock)
                          TextButton(
                            onPressed: _previewAlarmLock,
                            child: const Text('Preview strict alarm screen'),
                          ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                  child: Text('Today · $todayLabel', style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                ),
                Expanded(
                  child: _reminders.isEmpty
                      ? const EmptyState(
                          title: 'No reminders',
                          subtitle: 'Add a medicine to start your schedule',
                          icon: Icons.notifications_none,
                        )
                      : RefreshIndicator(
                          color: AppColors.teal,
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, AppSpacing.bottomNavClearance),
                            itemCount: _reminders.length,
                            itemBuilder: (_, i) {
                              final r = _reminders[i];
                              final timeLabel = reminderTimesLabel(r);
                              final notes = reminderNotes(r);
                              final enabled = r['enabled'] != false && r['status'] != 'paused';
                              final due = isReminderDueNow(r);
                              return FadeSlideIn(
                                delay: Duration(milliseconds: i * 60),
                                child: Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: DarkCard(
                                    onTap: () => showReminderNotificationSheet(context, r),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            const Text('💊', style: TextStyle(fontSize: 24)),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  if (timeLabel.isNotEmpty)
                                                    Text(timeLabel, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                                  Text(
                                                    r['medicine_name']?.toString() ?? '',
                                                    style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
                                                  ),
                                                  Text(
                                                    '${r['dose'] ?? ''} · ${r['frequency'] ?? 'Daily'}',
                                                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                                  ),
                                                  if (notes.isNotEmpty)
                                                    Text(notes, style: const TextStyle(color: AppColors.lime, fontSize: 12)),
                                                ],
                                              ),
                                            ),
                                            Switch(
                                              value: enabled,
                                              activeTrackColor: AppColors.lime.withValues(alpha: 0.4),
                                              thumbColor: WidgetStateProperty.resolveWith(
                                                (s) => s.contains(WidgetState.selected) ? AppColors.lime : null,
                                              ),
                                              onChanged: (v) => _toggle(r['id'] as int, v),
                                            ),
                                            IconButton(
                                              icon: const Icon(Icons.delete_outline, color: AppColors.red, size: 20),
                                              onPressed: () => _delete(r['id'] as int),
                                            ),
                                          ],
                                        ),
                                        if (due) ...[
                                          const SizedBox(height: 12),
                                          Container(
                                            width: double.infinity,
                                            padding: const EdgeInsets.symmetric(vertical: 10),
                                            decoration: BoxDecoration(
                                              color: AppColors.lime.withValues(alpha: 0.12),
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            child: const Text(
                                              'Due now — tap to respond',
                                              textAlign: TextAlign.center,
                                              style: TextStyle(color: AppColors.lime, fontWeight: FontWeight.w700, fontSize: 13),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  child: GradientButton(
                    label: '+ Add Reminder',
                    onPressed: () => context.push('/reminders/add'),
                  ),
                ),
              ],
            ),
    );
  }
}
