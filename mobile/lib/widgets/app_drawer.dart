import 'package:flutter/material.dart';
import '../core/app_navigation.dart';
import '../core/l10n_ext.dart';
import '../core/back_navigation.dart';
import '../core/theme.dart';
import '../features/landing/medmx_logo.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key, required this.currentPath});

  final String currentPath;

  List<_DrawerItem> _items(BuildContext context) {
    final l10n = context.l10n;
    return [
      _DrawerItem('/home', Icons.dashboard_outlined, l10n.drawerOverview),
      _DrawerItem('/search', Icons.search, l10n.drawerSearch),
      _DrawerItem('/upload', Icons.upload_outlined, l10n.drawerUpload),
      _DrawerItem('/history', Icons.history, l10n.drawerHistory),
      _DrawerItem('/reminders', Icons.notifications_outlined, l10n.drawerReminders),
      _DrawerItem('/adherence', Icons.trending_up, l10n.drawerAdherence),
      _DrawerItem('/reports', Icons.description_outlined, l10n.drawerLabReports),
      _DrawerItem('/pharmacies', Icons.location_on_outlined, l10n.drawerPharmacies),
      _DrawerItem('/assistant', Icons.chat_bubble_outline, l10n.drawerAssistant),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final items = _items(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Drawer(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.lightCard,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(24, 20, 24, 16),
              child: MedMxLogo(height: 48),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                itemCount: items.length,
                itemBuilder: (_, i) {
                  final item = items[i];
                  final active = currentPath.startsWith(item.path);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () {
                          Navigator.pop(context);
                          if (mainTabRoutes.contains(item.path)) {
                            context.openTab(item.path);
                          } else {
                            context.openPage(item.path);
                          }
                        },
                        borderRadius: BorderRadius.circular(14),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            gradient: active ? AppTheme.brandGradient : null,
                            color: active
                                ? null
                                : (isDark ? Colors.transparent : AppColors.lightBg.withValues(alpha: 0.5)),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                item.icon,
                                color: active ? Colors.white : AppTheme.primaryText(context),
                                size: 20,
                              ),
                              const SizedBox(width: 14),
                              Text(
                                item.label,
                                style: TextStyle(
                                  color: active ? Colors.white : AppTheme.primaryText(context),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerItem {
  const _DrawerItem(this.path, this.icon, this.label);
  final String path;
  final IconData icon;
  final String label;
}
