import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/api/api_client.dart';
import 'core/api/medscan_api.dart';
import 'core/notifications/alarm_guard.dart';
import 'core/notifications/reminder_alarm_prefs.dart';
import 'core/notifications/reminder_notification_service.dart';
import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/settings_provider.dart';
import 'router/app_router.dart';
import 'l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

class MedscanApp extends StatefulWidget {
  const MedscanApp({super.key, required this.services});

  final AppServices services;

  @override
  State<MedscanApp> createState() => _MedscanAppState();
}

class _MedscanAppState extends State<MedscanApp> {
  late final GoRouter _router = createRouter(widget.services);

  @override
  void initState() {
    super.initState();
    ReminderNotificationService.instance.onReminderOpened = _onReminderNotification;
  }

  Future<void> _onReminderNotification(int reminderId, {String? action}) async {
    if (!widget.services.auth.isAuthenticated) return;
    if (reminderId == 0) {
      _router.go('/reminders');
      return;
    }

    final strict = await ReminderAlarmPrefs.strictBlockEnabled();
    if (strict && (action == null || action == 'open')) {
      final raw = await ReminderAlarmPrefs.cachedRemindersJson();
      if (raw != null) {
        try {
          for (final item in jsonDecode(raw) as List) {
            final r = Map<String, dynamic>.from(item as Map);
            if (r['id'] == reminderId) {
              _router.go('/alarm-lock', extra: r);
              return;
            }
          }
        } catch (_) {}
      }
    }
    _router.go('/reminders');
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<AppServices>.value(value: widget.services),
        ChangeNotifierProvider<AuthProvider>.value(value: widget.services.auth),
        ChangeNotifierProvider<SettingsProvider>.value(value: widget.services.settings),
        Provider<MedscanApi>.value(value: widget.services.api),
        Provider<ApiClient>.value(value: widget.services.client),
      ],
      child: Consumer<SettingsProvider>(
        builder: (context, settings, _) {
          return MaterialApp.router(
            title: 'MedMx LABS',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: settings.themeMode,
            locale: settings.effectiveLocale,
            supportedLocales: AppLocalizations.supportedLocales,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            routerConfig: _router,
            builder: (context, child) {
              return AlarmGuard(
                router: _router,
                child: child ?? const SizedBox.shrink(),
              );
            },
          );
        },
      ),
    );
  }
}
