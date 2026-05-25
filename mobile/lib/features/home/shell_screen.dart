import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/app_navigation.dart';
import '../../core/l10n_ext.dart';
import '../../core/theme.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/shell_scope.dart';

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key, required this.child});

  final Widget child;

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  List<_Tab> _tabs(BuildContext context) {
    final l10n = context.l10n;
    return [
      _Tab('/home', Icons.home_outlined, Icons.home, l10n.navHome),
      _Tab('/search', Icons.medication_outlined, Icons.medication, l10n.navMedicines),
      _Tab('/reports', Icons.bar_chart_outlined, Icons.bar_chart, l10n.navReports),
      _Tab('/profile', Icons.person_outline, Icons.person, l10n.navProfile),
    ];
  }

  int? _indexForLocation(String location, List<_Tab> tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (location.startsWith(tabs[i].path)) return i;
    }
    if (location.startsWith('/history') || location.startsWith('/compare')) return 1;
    return null;
  }

  bool _hideBottomNav(String location) {
    return location.startsWith('/upload') ||
        location.startsWith('/assistant') ||
        location.startsWith('/compare');
  }

  void _openDrawer() => _scaffoldKey.currentState?.openDrawer();

  void _closeDrawer() => _scaffoldKey.currentState?.closeDrawer();

  bool _isDrawerOpen() => _scaffoldKey.currentState?.isDrawerOpen ?? false;

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final tabs = _tabs(context);
    final index = _indexForLocation(location, tabs);
    final hideNav = _hideBottomNav(location);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final navBg = isDark ? AppColors.cardDark : AppColors.lightCard;
    final borderColor = isDark ? AppColors.border.withValues(alpha: 0.5) : AppColors.borderLight;

    return ShellScope(
      onOpenDrawer: _openDrawer,
      onCloseDrawer: _closeDrawer,
      isDrawerOpen: _isDrawerOpen,
      child: Container(
        decoration: AppTheme.scaffoldDecoration(context),
        child: Scaffold(
          key: _scaffoldKey,
          backgroundColor: Colors.transparent,
          drawer: AppDrawer(currentPath: location),
          drawerEnableOpenDragGesture: true,
          body: widget.child,
          floatingActionButton: hideNav
              ? null
              : FloatingActionButton(
                  onPressed: () => context.openPage('/upload'),
                  backgroundColor: AppColors.lime,
                  elevation: 6,
                  shape: const CircleBorder(),
                  child: const Icon(Icons.add, color: Colors.white, size: 28),
                ),
          floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
          bottomNavigationBar: hideNav
              ? null
              : Container(
                  decoration: BoxDecoration(
                    color: navBg,
                    border: Border(top: BorderSide(color: borderColor)),
                  ),
                  child: SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.only(top: 6, bottom: 4),
                      child: SizedBox(
                        height: 58,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _NavItem(
                              icon: tabs[0].icon,
                              selectedIcon: tabs[0].selectedIcon,
                              label: tabs[0].label,
                              selected: index == 0,
                              onTap: () => context.openTab(tabs[0].path),
                            ),
                            _NavItem(
                              icon: tabs[1].icon,
                              selectedIcon: tabs[1].selectedIcon,
                              label: tabs[1].label,
                              selected: index == 1,
                              onTap: () => context.openTab(tabs[1].path),
                            ),
                            const SizedBox(width: 52),
                            _NavItem(
                              icon: tabs[2].icon,
                              selectedIcon: tabs[2].selectedIcon,
                              label: tabs[2].label,
                              selected: index == 2,
                              onTap: () => context.openTab(tabs[2].path),
                            ),
                            _NavItem(
                              icon: tabs[3].icon,
                              selectedIcon: tabs[3].selectedIcon,
                              label: tabs[3].label,
                              selected: index == 3,
                              onTap: () => context.openTab(tabs[3].path),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final muted = AppTheme.mutedText(context);
    final color = selected ? AppColors.lime : muted;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(selected ? selectedIcon : icon, color: color, size: 24),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(color: color, fontSize: 11, fontWeight: selected ? FontWeight.w700 : FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tab {
  const _Tab(this.path, this.icon, this.selectedIcon, this.label);
  final String path;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
}
