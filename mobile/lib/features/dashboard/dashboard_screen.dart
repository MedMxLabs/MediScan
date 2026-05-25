import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/medscan_api.dart';
import '../../core/api_error.dart';
import '../../core/app_helpers.dart';
import '../../core/app_navigation.dart';
import '../../core/l10n_ext.dart';
import '../../core/notifications/reminder_notification_service.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/shell_scope.dart';
import '../../widgets/ui_components.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _dash;
  List<Map<String, dynamic>> _refillAlerts = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load({bool refresh = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = context.read<MedscanApi>();
      final dash = await api.getDashboard(refresh: refresh);
      final refill = await api.getRefillAlerts().catchError((_) => {'alerts': []});

      if (!mounted) return;
      setState(() {
        _dash = Map<String, dynamic>.from(dash);
        _refillAlerts = ((refill['alerts'] as List?))
                ?.map((e) => Map<String, dynamic>.from(e as Map))
                .toList() ??
            [];
        _loading = false;
      });
      try {
        await ReminderNotificationService.instance.requestPermissions();
        final reminders = await api.getReminders();
        await ReminderNotificationService.instance.syncReminders(reminders);
      } catch (_) {}
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = friendlyApiError(e);
        _loading = false;
      });
    }
  }

  Map<String, dynamic>? get _nextReminder {
    final preview = (_dash?['reminders_preview'] as List?) ?? [];
    if (preview.isEmpty) return null;
    return Map<String, dynamic>.from(preview.first as Map);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final stats = (_dash?['stats'] as Map?) ?? {};
    final recent = (_dash?['recent_searches'] as List?) ?? [];
    final name = userDisplayName(auth.user);
    final adherence = (stats['adherence_score_percent'] ?? 0) as num;
    final next = _nextReminder;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        bottom: false,
        child: _loading
            ? LoadingOverlay(message: context.l10n.loading)
            : _error != null
                ? EmptyState(title: 'Could not load home', subtitle: _error)
                : RefreshIndicator(
                    color: AppColors.teal,
                    onRefresh: () => _load(refresh: true),
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                      padding: pagePadding(),
                      children: [
                        _Header(
                          name: name,
                          hasAlerts: _refillAlerts.isNotEmpty,
                          onMenu: () => ShellScope.openDrawer(context),
                          onNotifications: () => context.openPage('/reminders'),
                        ),
                        const SizedBox(height: 24),
                        _SearchBar(onTap: () => context.openTab('/search')),
                        const SizedBox(height: 20),
                        _StatsStrip(
                          dosesToday: stats['doses_logged_today'] ?? 0,
                          activeMeds: stats['medicines_tracked'] ?? 0,
                          adherence: adherence.toDouble(),
                        ),
                        const SizedBox(height: 20),
                        if (next != null)
                          _UpNextCard(
                            medicine: next['medicine_name']?.toString() ?? 'Medicine',
                            dose: next['dose']?.toString(),
                            time: formatTimeFromIso(next['next_trigger']?.toString()),
                            onTap: () => context.openPage('/reminders'),
                          )
                        else
                          _EmptyReminderCard(onTap: () => context.openPage('/reminders/add')),
                        const SizedBox(height: 24),
                        _QuickLinks(
                          onSearch: () => context.openTab('/search'),
                          onUpload: () => context.openPage('/upload'),
                          onReminders: () => context.openPage('/reminders'),
                          onAdherence: () => context.openPage('/adherence'),
                        ),
                        if (recent.isNotEmpty) ...[
                          const SizedBox(height: 28),
                          SectionHeader(
                            title: context.l10n.recentSearches,
                            action: context.l10n.history,
                            onAction: () => context.openPage('/history'),
                          ),
                          const SizedBox(height: 10),
                          ...recent.take(4).map((item) {
                            final row = Map<String, dynamic>.from(item as Map);
                            final query = row['query']?.toString() ?? '';
                            return _RecentRow(
                              query: query,
                              date: formatIsoDate(row['created_at']?.toString()),
                              onTap: () => context.openPage('/compare?q=${Uri.encodeComponent(query)}'),
                            );
                          }),
                        ],
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.name,
    required this.hasAlerts,
    required this.onMenu,
    required this.onNotifications,
  });

  final String name;
  final bool hasAlerts;
  final VoidCallback onMenu;
  final VoidCallback onNotifications;

  @override
  Widget build(BuildContext context) {
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        IconButton(
          icon: Icon(Icons.menu, color: muted),
          onPressed: onMenu,
          visualDensity: VisualDensity.compact,
        ),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${greetingForHour(context)}, $name',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: primary, height: 1.2),
              ),
              const SizedBox(height: 4),
              Text(formatTodayHeader(), style: TextStyle(color: muted, fontSize: 13)),
            ],
          ),
        ),
        Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              icon: Icon(Icons.notifications_none_outlined, color: muted),
              onPressed: onNotifications,
            ),
            if (hasAlerts)
              Positioned(
                right: 14,
                top: 14,
                child: Container(
                  width: 7,
                  height: 7,
                  decoration: const BoxDecoration(color: AppColors.lime, shape: BoxShape.circle),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final card = AppTheme.cardColor(context);
    final muted = AppTheme.mutedText(context);
    return Material(
      color: card,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              Icon(Icons.search, size: 20, color: muted),
              const SizedBox(width: 10),
              Text(l10n.searchHint, style: TextStyle(color: muted, fontSize: 15)),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatsStrip extends StatelessWidget {
  const _StatsStrip({
    required this.dosesToday,
    required this.activeMeds,
    required this.adherence,
  });

  final num dosesToday;
  final num activeMeds;
  final double adherence;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final card = AppTheme.cardColor(context);
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    final border = Theme.of(context).brightness == Brightness.dark
        ? AppColors.border.withValues(alpha: 0.5)
        : AppColors.borderLight;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          statCell(label: l10n.statDosesToday, value: '$dosesToday', primary: primary, muted: muted),
          divider(border),
          statCell(label: l10n.statActiveMeds, value: '$activeMeds', primary: primary, muted: muted),
          divider(border),
          statCell(label: l10n.statAdherence, value: '${adherence.round()}%', primary: primary, muted: muted),
        ],
      ),
    );
  }

  Widget divider(Color border) => Container(width: 1, height: 32, color: border.withValues(alpha: 0.6));

  Widget statCell({required String label, required String value, required Color primary, required Color muted}) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: primary)),
          const SizedBox(height: 2),
          Text(label, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: muted)),
        ],
      ),
    );
  }
}

class _UpNextCard extends StatelessWidget {
  const _UpNextCard({
    required this.medicine,
    this.dose,
    required this.time,
    required this.onTap,
  });

  final String medicine;
  final String? dose;
  final String time;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    return Material(
      color: AppColors.navyLight,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.upNext, style: TextStyle(color: muted, fontSize: 12)),
                    const SizedBox(height: 6),
                    Text(medicine, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: primary)),
                    if (dose != null && dose!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(dose!, style: TextStyle(color: muted, fontSize: 13)),
                    ],
                  ],
                ),
              ),
              if (time.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.teal.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(time, style: const TextStyle(color: AppColors.teal, fontWeight: FontWeight.w600, fontSize: 13)),
                ),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right, color: muted.withValues(alpha: 0.6)),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyReminderCard extends StatelessWidget {
  const _EmptyReminderCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final card = AppTheme.cardColor(context);
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    return Material(
      color: card,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.noRemindersYet, style: TextStyle(fontWeight: FontWeight.w600, color: primary)),
                    const SizedBox(height: 4),
                    Text(l10n.addMedicineSchedule, style: TextStyle(color: muted, fontSize: 13)),
                  ],
                ),
              ),
              Text(l10n.add, style: const TextStyle(color: AppColors.teal, fontWeight: FontWeight.w600)),
              Icon(Icons.chevron_right, size: 18, color: AppColors.teal.withValues(alpha: 0.7)),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickLinks extends StatelessWidget {
  const _QuickLinks({
    required this.onSearch,
    required this.onUpload,
    required this.onReminders,
    required this.onAdherence,
  });

  final VoidCallback onSearch;
  final VoidCallback onUpload;
  final VoidCallback onReminders;
  final VoidCallback onAdherence;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return SizedBox(
      height: 36,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _LinkChip(icon: Icons.search, label: l10n.quickSearch, onTap: onSearch),
          _LinkChip(icon: Icons.upload_outlined, label: l10n.quickUpload, onTap: onUpload),
          _LinkChip(icon: Icons.alarm_outlined, label: l10n.quickReminders, onTap: onReminders),
          _LinkChip(icon: Icons.bar_chart_outlined, label: l10n.quickAdherence, onTap: onAdherence),
        ],
      ),
    );
  }
}

class _LinkChip extends StatelessWidget {
  const _LinkChip({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final card = AppTheme.cardColor(context);
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: card,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 16, color: muted),
                const SizedBox(width: 6),
                Text(label, style: TextStyle(color: primary, fontSize: 13, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RecentRow extends StatelessWidget {
  const _RecentRow({required this.query, required this.date, required this.onTap});

  final String query;
  final String date;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(query, style: TextStyle(fontWeight: FontWeight.w600, color: primary, fontSize: 15)),
                    if (date.isNotEmpty)
                      Text(date, style: TextStyle(color: muted, fontSize: 12)),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, size: 14, color: muted.withValues(alpha: 0.5)),
            ],
          ),
        ),
      ),
    );
  }
}
