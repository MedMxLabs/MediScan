import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../widgets/shell_scope.dart';
import 'theme.dart';

/// Bottom-tab routes — back from these (except home) goes to home first.
const mainTabRoutes = {'/home', '/search', '/reports', '/profile'};

const _publicRoutes = {'/', '/login', '/signup'};

/// Routes where system back is blocked (user must use on-screen actions).
const _backBlockedRoutes = {'/alarm-lock'};

/// Wrap route content so Android back works (must be under [GoRouter] in the tree).
class SystemBackScope extends StatefulWidget {
  const SystemBackScope({super.key, required this.child});

  final Widget child;

  @override
  State<SystemBackScope> createState() => _SystemBackScopeState();
}

class _SystemBackScopeState extends State<SystemBackScope> {
  bool _handlingBack = false;
  bool _exitDialogOpen = false;

  void _onSystemBack() {
    if (_handlingBack) return;
    final router = GoRouter.of(context);
    _handlingBack = true;
    handleAppBack(
      router,
      context,
      onExitDialog: _showExitDialog,
    ).whenComplete(() => _handlingBack = false);
  }

  Future<void> _showExitDialog(BuildContext context) async {
    if (_exitDialogOpen || !context.mounted) return;
    _exitDialogOpen = true;
    try {
      await showExitAppDialog(context);
    } finally {
      _exitDialogOpen = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return BackButtonListener(
      onBackButtonPressed: () async {
        _onSystemBack();
        return true;
      },
      child: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) {
          if (!didPop) _onSystemBack();
        },
        child: widget.child,
      ),
    );
  }
}

/// In-app back (toolbar / PageShell) — same logic as system back.
void navigateBack(BuildContext context) {
  final router = GoRouter.of(context);
  handleAppBack(
    router,
    context,
    onExitDialog: showExitAppDialog,
  );
}

/// Confirmation before leaving the app from root screens.
Future<void> showExitAppDialog(BuildContext context) async {
  if (!context.mounted) return;
  final exit = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => AlertDialog(
      backgroundColor: AppTheme.cardColor(ctx),
      title: Text('Exit App', style: TextStyle(color: AppTheme.primaryText(ctx), fontWeight: FontWeight.w700)),
      content: Text('Do you want to exit the app?', style: TextStyle(color: AppTheme.mutedText(ctx))),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text('No', style: TextStyle(color: AppTheme.mutedText(ctx))),
        ),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: const Text('Yes', style: TextStyle(color: AppColors.teal, fontWeight: FontWeight.w700)),
        ),
      ],
    ),
  );
  if (exit == true) {
    SystemNavigator.pop();
  }
}

/// Core back navigation: pop stack → fallback parent → exit confirm on root.
Future<void> handleAppBack(
  GoRouter router,
  BuildContext context, {
  Future<void> Function(BuildContext context)? onExitDialog,
}) async {
  if (_backBlockedRoutes.contains(router.state.matchedLocation)) {
    return;
  }

  if (ShellScope.closeDrawerIfOpen(context)) {
    return;
  }

  // Pop routes pushed onto the go_router stack (context.push).
  if (router.canPop()) {
    router.pop();
    return;
  }

  // Dismiss dialogs / bottom sheets (router stack unchanged).
  final navContext = router.routerDelegate.navigatorKey.currentContext;
  if (navContext != null && Navigator.of(navContext).canPop()) {
    Navigator.of(navContext).pop();
    return;
  }

  final location = router.state.matchedLocation;

  if (_publicRoutes.contains(location)) {
    if (location == '/login' || location == '/signup') {
      router.go('/');
      return;
    }
    await onExitDialog?.call(context);
    return;
  }

  final fallback = _fallbackBackRoute(location);
  if (fallback != null) {
    router.go(fallback);
    return;
  }

  await onExitDialog?.call(context);
}

/// Parent route when [GoRouter.canPop] is false (screens opened with [go]).
String? _fallbackBackRoute(String location) {
  if (location.startsWith('/reminders/dose-taken')) return '/reminders';
  if (location == '/reminders/saved') return '/reminders';
  if (location.startsWith('/reminders/schedule')) return '/reminders/add';
  if (location == '/reminders/add') return '/reminders';

  if (mainTabRoutes.contains(location)) {
    return location == '/home' ? null : '/home';
  }

  const secondaryFromHome = {
    '/upload',
    '/history',
    '/compare',
    '/reminders',
    '/adherence',
    '/assistant',
    '/pharmacies',
  };
  if (secondaryFromHome.contains(location)) {
    return '/home';
  }

  return '/home';
}
