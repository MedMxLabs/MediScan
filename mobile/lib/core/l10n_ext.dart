import 'package:flutter/material.dart';
import 'package:medscan_mobile/l10n/app_localizations.dart';

extension L10nX on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}

String greetingForHour(BuildContext context) {
  final l10n = AppLocalizations.of(context);
  final h = DateTime.now().hour;
  if (h < 12) return l10n.greetingMorning;
  if (h < 17) return l10n.greetingAfternoon;
  return l10n.greetingEvening;
}

String languageLabel(BuildContext context, String code) {
  final l10n = AppLocalizations.of(context);
  return switch (code) {
    'hi' => l10n.langHindi,
    'ta' => l10n.langTamil,
    'te' => l10n.langTelugu,
    'kn' => l10n.langKannada,
    'mr' => l10n.langMarathi,
    _ => l10n.langEnglish,
  };
}

String themeModeLabel(BuildContext context, ThemeMode mode) {
  final l10n = AppLocalizations.of(context);
  return switch (mode) {
    ThemeMode.light => l10n.themeLight,
    ThemeMode.dark => l10n.themeDark,
    ThemeMode.system => l10n.themeSystem,
  };
}
