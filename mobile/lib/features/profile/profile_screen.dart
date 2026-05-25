import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/medscan_api.dart';
import '../../core/app_helpers.dart';
import '../../core/app_navigation.dart';
import '../../core/l10n_ext.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/settings_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/settings_pickers.dart';
import '../../widgets/ui_components.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  bool _loading = true;
  bool _saving = false;
  bool _editing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final profile = await context.read<MedscanApi>().getProfile();
      if (!mounted) return;
      _name.text = profile['name']?.toString() ?? '';
      _phone.text = profile['phone']?.toString() ?? '';
      setState(() => _loading = false);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await context.read<MedscanApi>().updateProfile({
        'name': _name.text.trim(),
        'phone': _phone.text.trim(),
      });
      if (!mounted) return;
      context.read<AuthProvider>().updateUser({'name': _name.text.trim()});
      setState(() => _editing = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.profileUpdated)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _logout() async {
    await context.read<AuthProvider>().logout();
    if (mounted) context.go('/');
  }

  Future<void> _resetActivity() async {
    final l10n = context.l10n;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardColor(ctx),
        title: Text(l10n.resetDataTitle, style: TextStyle(color: AppTheme.primaryText(ctx))),
        content: Text(l10n.resetDataBody, style: TextStyle(color: AppTheme.mutedText(ctx))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.cancel)),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.reset, style: const TextStyle(color: AppColors.red)),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    try {
      await context.read<MedscanApi>().resetUserActivity();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.activityReset)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  List<_MenuItem> _menuItems(BuildContext context) {
    final l10n = context.l10n;
    return [
      _MenuItem(Icons.person_outline, l10n.profilePersonalInfo, action: 'edit'),
      _MenuItem(Icons.medical_information_outlined, l10n.profileMedicalRecords, route: '/reports'),
      _MenuItem(Icons.description_outlined, l10n.profilePrescriptions, route: '/history'),
      _MenuItem(Icons.notifications_outlined, l10n.profileReminders, route: '/reminders'),
      _MenuItem(Icons.upload_file_outlined, l10n.profileUpload, route: '/upload'),
      _MenuItem(Icons.chat_bubble_outline, l10n.profileAssistant, route: '/assistant'),
      _MenuItem(Icons.location_on_outlined, l10n.profilePharmacies, route: '/pharmacies'),
      _MenuItem(Icons.help_outline, l10n.profileHelp, route: '/assistant'),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final settings = context.watch<SettingsProvider>();
    final l10n = context.l10n;
    final email = auth.user?['email']?.toString() ?? '';
    final displayName = userDisplayName(auth.user);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bodyBg = isDark ? AppColors.darkBg : AppColors.lightBg;
    final textColor = AppTheme.primaryText(context);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: _loading
          ? LoadingOverlay(message: l10n.loading)
          : Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 56, 20, 32),
                  decoration: BoxDecoration(gradient: AppTheme.headerGradient),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 32,
                        backgroundColor: Colors.white24,
                        child: Text(
                          displayName.isNotEmpty ? displayName[0].toUpperCase() : '?',
                          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(displayName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                            Text(
                              _phone.text.isNotEmpty ? _phone.text : email,
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, color: Colors.white),
                        onPressed: () => setState(() => _editing = !_editing),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: bodyBg,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(0, 8, 0, AppSpacing.bottomNavClearance),
                      children: [
                        if (_editing) ...[
                          Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              children: [
                                DarkTextField(controller: _name, hint: l10n.profileName, prefixIcon: Icons.person_outline),
                                const SizedBox(height: 12),
                                DarkTextField(controller: _phone, hint: l10n.profilePhone, prefixIcon: Icons.phone_outlined),
                                const SizedBox(height: 16),
                                GradientButton(label: l10n.profileSave, onPressed: _save, loading: _saving),
                              ],
                            ),
                          ),
                        ],
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
                          child: Text(
                            l10n.settings,
                            style: TextStyle(
                              color: AppTheme.mutedText(context),
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        ListTile(
                          leading: const Icon(Icons.brightness_6_outlined, color: AppColors.teal, size: 22),
                          title: Text(l10n.settingsAppearance, style: TextStyle(color: textColor, fontWeight: FontWeight.w500)),
                          subtitle: Text(
                            themeModeLabel(context, settings.themeMode),
                            style: TextStyle(color: AppTheme.mutedText(context), fontSize: 12),
                          ),
                          trailing: Icon(Icons.chevron_right, color: textColor.withValues(alpha: 0.4)),
                          onTap: () => showThemePicker(context),
                        ),
                        ListTile(
                          leading: const Icon(Icons.language_outlined, color: AppColors.teal, size: 22),
                          title: Text(l10n.settingsLanguage, style: TextStyle(color: textColor, fontWeight: FontWeight.w500)),
                          subtitle: Text(
                            languageLabel(context, settings.effectiveLocale.languageCode),
                            style: TextStyle(color: AppTheme.mutedText(context), fontSize: 12),
                          ),
                          trailing: Icon(Icons.chevron_right, color: textColor.withValues(alpha: 0.4)),
                          onTap: () => showLanguagePicker(context),
                        ),
                        const Divider(),
                        ..._menuItems(context).map((item) {
                          return ListTile(
                            leading: Icon(item.icon, color: AppColors.lime, size: 22),
                            title: Text(item.label, style: TextStyle(color: textColor, fontWeight: FontWeight.w500)),
                            trailing: Icon(Icons.chevron_right, color: textColor.withValues(alpha: 0.4)),
                            onTap: () {
                              if (item.action == 'edit') {
                                setState(() => _editing = !_editing);
                              } else if (item.route != null) {
                                context.openPage(item.route!);
                              }
                            },
                          );
                        }),
                        const Divider(),
                        ListTile(
                          leading: const Icon(Icons.restart_alt, color: AppColors.amber),
                          title: Text(l10n.profileResetData, style: TextStyle(color: textColor, fontWeight: FontWeight.w500)),
                          onTap: _resetActivity,
                        ),
                        ListTile(
                          leading: const Icon(Icons.logout, color: AppColors.red),
                          title: Text(l10n.profileLogout, style: const TextStyle(color: AppColors.red, fontWeight: FontWeight.w600)),
                          onTap: _logout,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _MenuItem {
  const _MenuItem(this.icon, this.label, {this.route, this.action});
  final IconData icon;
  final String label;
  final String? route;
  final String? action;
}
