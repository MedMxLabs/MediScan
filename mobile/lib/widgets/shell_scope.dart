import 'package:flutter/material.dart';

/// Exposes the shell [Scaffold] drawer to nested child screens.
class ShellScope extends InheritedWidget {
  const ShellScope({
    super.key,
    required this.onOpenDrawer,
    required this.onCloseDrawer,
    required this.isDrawerOpen,
    required super.child,
  });

  final VoidCallback onOpenDrawer;
  final VoidCallback onCloseDrawer;
  final bool Function() isDrawerOpen;

  static ShellScope? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<ShellScope>();
  }

  static void openDrawer(BuildContext context) {
    maybeOf(context)?.onOpenDrawer();
  }

  static bool closeDrawerIfOpen(BuildContext context) {
    final scope = maybeOf(context);
    if (scope != null && scope.isDrawerOpen()) {
      scope.onCloseDrawer();
      return true;
    }
    return false;
  }

  @override
  bool updateShouldNotify(ShellScope oldWidget) =>
      onOpenDrawer != oldWidget.onOpenDrawer ||
      onCloseDrawer != oldWidget.onCloseDrawer;
}
