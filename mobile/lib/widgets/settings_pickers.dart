import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/l10n_ext.dart';
import '../core/theme.dart';
import '../providers/settings_provider.dart';

Future<void> showThemePicker(BuildContext context) async {
  final settings = context.read<SettingsProvider>();
  final l10n = context.l10n;

  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: Theme.of(context).colorScheme.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (ctx) {
      return SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(l10n.settingsAppearance, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            ),
            ...ThemeMode.values.map((mode) {
              final selected = settings.themeMode == mode;
              return ListTile(
                leading: Icon(
                  switch (mode) {
                    ThemeMode.light => Icons.light_mode_outlined,
                    ThemeMode.dark => Icons.dark_mode_outlined,
                    ThemeMode.system => Icons.brightness_auto_outlined,
                  },
                  color: selected ? AppColors.teal : null,
                ),
                title: Text(themeModeLabel(ctx, mode)),
                trailing: selected ? const Icon(Icons.check, color: AppColors.teal) : null,
                onTap: () {
                  settings.setThemeMode(mode);
                  Navigator.pop(ctx);
                },
              );
            }),
            const SizedBox(height: 8),
          ],
        ),
      );
    },
  );
}

Future<void> showLanguagePicker(BuildContext context) async {
  final settings = context.read<SettingsProvider>();
  final l10n = context.l10n;

  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: Theme.of(context).colorScheme.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (ctx) {
      return SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(l10n.settingsLanguage, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            ),
            ...SettingsProvider.supportedLocales.map((locale) {
              final selected = settings.effectiveLocale.languageCode == locale.languageCode;
              return ListTile(
                title: Text(languageLabel(ctx, locale.languageCode)),
                trailing: selected ? const Icon(Icons.check, color: AppColors.teal) : null,
                onTap: () {
                  settings.setLocale(locale);
                  Navigator.pop(ctx);
                },
              );
            }),
            const SizedBox(height: 8),
          ],
        ),
      );
    },
  );
}
