import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/medscan_api.dart';
import '../../core/app_helpers.dart';
import '../../core/app_navigation.dart';
import '../../core/l10n_ext.dart';
import '../../core/notifications/reminder_notification_service.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/async_body.dart';
import '../../widgets/shell_scope.dart';
import '../../widgets/ui_components.dart';

part 'dashboard_cards.dart';
part 'dashboard_header.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with AsyncLoadState {
  Map<String, dynamic>? _dash;
  List<Map<String, dynamic>> _refillAlerts = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load({bool refresh = false}) async {
    final api = context.read<MedscanApi>();
    final ok = await runLoad(() async {
      final results = await Future.wait([
        api.getDashboard(refresh: refresh),
        api.getRefillAlerts().catchError((_) => <String, dynamic>{'alerts': []}),
      ]);
      if (!mounted) return;
      setState(() {
        _dash = Map<String, dynamic>.from(results[0]);
        _refillAlerts = ((results[1]['alerts'] as List?))
                ?.map((e) => Map<String, dynamic>.from(e as Map))
                .toList() ??
            [];
      });
    });
    if (!ok) return;
    try {
      await ReminderNotificationService.instance.requestPermissions();
      final reminders = await api.getReminders();
      await ReminderNotificationService.instance.syncReminders(reminders);
    } catch (_) {}
  }

  Map<String, dynamic>? get _nextReminder {
    final preview = (_dash?['reminders_preview'] as List?) ?? [];
    if (preview.isEmpty) return null;
    return Map<String, dynamic>.from(preview.first as Map);
  }

  @override
  Widget build(BuildContext context) {
    final name = context.select<AuthProvider, String>((a) => userDisplayName(a.user));
    final stats = (_dash?['stats'] as Map?) ?? {};
    final recent = (_dash?['recent_searches'] as List?) ?? [];
    final adherence = (stats['adherence_score_percent'] ?? 0) as num;
    final next = _nextReminder;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        bottom: false,
        child: AsyncBody(
          loading: loading,
          error: loadError,
          loadingMessage: context.l10n.loading,
          errorTitle: 'Could not load home',
          onRetry: _load,
          builder: (context) => RefreshIndicator(
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
      ),
    );
  }
}
