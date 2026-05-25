import 'package:flutter/material.dart';
import '../../core/app_navigation.dart';
import 'package:provider/provider.dart';

import '../../core/api/medscan_api.dart';
import '../../core/app_helpers.dart';
import '../../core/theme.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/ui_components.dart';
import '../reminders/models/reminder_draft.dart';
import '../reminders/reminder_notification_sheet.dart';
import '../reminders/reminder_widgets.dart';

class AdherenceScreen extends StatefulWidget {
  const AdherenceScreen({super.key});

  @override
  State<AdherenceScreen> createState() => _AdherenceScreenState();
}

class _AdherenceScreenState extends State<AdherenceScreen> {
  Map<String, dynamic>? _data;
  List<Map<String, dynamic>> _reminders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<MedscanApi>();
      final results = await Future.wait([api.getAdherence(), api.getReminders()]);
      if (!mounted) return;
      setState(() {
        _data = results[0] as Map<String, dynamic>;
        _reminders = results[1] as List<Map<String, dynamic>>;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Map<String, dynamic>? _findReminder(int? id) {
    if (id == null) return null;
    for (final r in _reminders) {
      if (r['id'] == id) return r;
    }
    return null;
  }

  List<Map<String, dynamic>> get _weekBars {
    final series = ((_data?['weekly_series'] as List?) ?? [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
    final byDate = {for (final s in series) s['date']?.toString(): s};
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));
    return List.generate(7, (i) {
      final day = monday.add(Duration(days: i));
      final key = day.toIso8601String().split('T').first;
      final row = byDate[key] ?? {'taken': 0, 'missed': 0, 'skipped': 0};
      final taken = (row['taken'] as num?)?.toInt() ?? 0;
      final missed = (row['missed'] as num?)?.toInt() ?? 0;
      final skipped = (row['skipped'] as num?)?.toInt() ?? 0;
      final total = taken + missed + skipped;
      return {
        'label': formatShortDay(key),
        'ratio': total > 0 ? taken / total : 0.0,
      };
    });
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'taken':
        return AppColors.lime;
      case 'skipped':
        return AppColors.amber;
      default:
        return AppColors.red;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'taken':
        return 'Taken';
      case 'skipped':
        return 'Skipped';
      default:
        return 'Missed';
    }
  }

  @override
  Widget build(BuildContext context) {
    final pct = (_data?['completion_percent'] ?? 0) as num;
    final taken = _data?['taken_doses'] ?? 0;
    final missed = _data?['missed_doses'] ?? 0;
    final skipped = _data?['skipped_doses'] ?? 0;
    final logs = ((_data?['logs'] as List?) ?? []).take(5).toList();
    final weekBars = _weekBars;

    return PageShell(
      title: 'Adherence',
      showBack: true,
      child: _loading
          ? const LoadingOverlay()
          : RefreshIndicator(
              color: AppColors.teal,
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  FadeSlideIn(
                    child: Center(
                      child: Column(
                        children: [
                          ProgressRing(
                            percent: pct.toDouble(),
                            size: 160,
                            subtitle: adherenceRating(pct),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            pct >= 70
                                ? "You're taking your medicines consistently."
                                : 'Log doses from reminders to improve your score.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  FadeSlideIn(
                    delay: const Duration(milliseconds: 100),
                    child: Row(
                      children: [
                        Expanded(child: StatCard(label: 'Taken', value: '$taken', valueColor: AppColors.lime)),
                        const SizedBox(width: 10),
                        Expanded(child: StatCard(label: 'Missed', value: '$missed', valueColor: AppColors.red)),
                        const SizedBox(width: 10),
                        Expanded(child: StatCard(label: 'Skipped', value: '$skipped', valueColor: AppColors.amber)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  const SectionHeader(title: 'This week'),
                  const SizedBox(height: 16),
                  FadeSlideIn(
                    delay: const Duration(milliseconds: 200),
                    child: SizedBox(
                      height: 160,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: weekBars.asMap().entries.map((e) {
                          final row = e.value;
                          final ratio = row['ratio'] as double;
                          return Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 4),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  TweenAnimationBuilder<double>(
                                    tween: Tween(begin: 0, end: ratio),
                                    duration: Duration(milliseconds: 600 + e.key * 100),
                                    curve: Curves.easeOutCubic,
                                    builder: (_, h, _) => Container(
                                      height: 100 * (ratio > 0 ? h.clamp(0.08, 1.0) : 0.04),
                                      decoration: BoxDecoration(
                                        gradient: ratio > 0 ? AppTheme.brandGradient : null,
                                        color: ratio > 0 ? null : AppColors.navyLight,
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(row['label']?.toString() ?? '', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  SectionHeader(title: 'Recent Activity', action: 'View all', onAction: () => context.openPage('/reminders')),
                  const SizedBox(height: 12),
                  if (logs.isEmpty)
                    const EmptyState(title: 'No activity yet', subtitle: 'Respond to a reminder to log doses')
                  else
                    ...logs.map((raw) {
                      final log = Map<String, dynamic>.from(raw as Map);
                      final rid = log['reminder_id'] as int?;
                      final rem = _findReminder(rid);
                      final name = rem?['medicine_name']?.toString() ?? 'Medicine';
                      final status = log['status']?.toString() ?? 'taken';
                      final when = formatIsoDate(log['taken_at']?.toString());
                      final timeHint = rem != null ? reminderTimesLabel(rem) : '';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: DarkCard(
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(name, style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
                                    Text('$when${timeHint.isNotEmpty ? ' · $timeHint' : ''}',
                                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _statusColor(status).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  _statusLabel(status),
                                  style: TextStyle(color: _statusColor(status), fontWeight: FontWeight.w700, fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  const SizedBox(height: 28),
                  const SectionHeader(title: 'Due reminders'),
                  const SizedBox(height: 12),
                  if (_reminders.where((r) => r['status'] != 'paused').isEmpty)
                    const EmptyState(title: 'Add a reminder first', icon: Icons.medication_liquid)
                  else
                    ..._reminders.where((r) => r['status'] != 'paused').map((r) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: DarkCard(
                          onTap: () => showReminderNotificationSheet(context, r),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  r['medicine_name']?.toString() ?? '',
                                  style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white),
                                ),
                              ),
                              const Icon(Icons.notifications_active_outlined, color: AppColors.lime),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
