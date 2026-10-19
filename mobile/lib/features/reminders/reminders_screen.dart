import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/medscan_api.dart';
import '../../core/app_helpers.dart';
import '../../core/notifications/alarm_vibration.dart';
import '../../core/notifications/reminder_alarm_prefs.dart';
import '../../core/notifications/reminder_notification_service.dart';
import '../../core/theme.dart';
import '../../widgets/async_body.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/ui_components.dart';
import 'reminder_notification_sheet.dart';
import 'reminder_widgets.dart';

part 'reminders_screen_widgets.dart';

class RemindersScreen extends StatefulWidget {
  const RemindersScreen({super.key});

  @override
  State<RemindersScreen> createState() => _RemindersScreenState();
}

class _RemindersScreenState extends State<RemindersScreen> with AsyncLoadState {
  List<Map<String, dynamic>> _reminders = [];
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
    final ok = await runLoad(() async {
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
      });
    });
    if (!ok) return;
    // Follow-up prompts are best-effort; the loaded list stays visible if they fail.
    try {
      await _handlePendingNotification(_reminders);
      if (ReminderNotificationService.instance.pendingReminderId == null) {
        await _maybeShowDueReminder(_reminders);
      }
    } catch (_) {}
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
      child: AsyncBody(
        loading: loading,
        error: loadError,
        errorTitle: 'Could not load reminders',
        onRetry: _load,
        builder: (context) => Column(
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
                  child: _AlertSettingsCard(
                    alarmMode: _alarmMode,
                    strictBlock: _strictBlock,
                    onAlarmMode: _setAlarmMode,
                    onStrictBlock: _setStrictBlock,
                    onPreview: _previewAlarmLock,
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
                              return FadeSlideIn(
                                delay: Duration(milliseconds: i * 60),
                                child: Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: _ReminderTile(
                                    reminder: r,
                                    onToggle: (v) => _toggle(r['id'] as int, v),
                                    onDelete: () => _delete(r['id'] as int),
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
      ),
    );
  }
}
