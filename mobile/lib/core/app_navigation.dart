import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'back_navigation.dart';

/// Use [openTab] for bottom nav / drawer tabs; [openPage] for stackable screens.
extension AppNavigation on BuildContext {
  void openTab(String path) => go(path);

  void openPage(String path, {Object? extra}) {
    if (mainTabRoutes.contains(path)) {
      go(path);
    } else {
      push(path, extra: extra);
    }
  }
}
