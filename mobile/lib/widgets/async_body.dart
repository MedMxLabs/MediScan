import 'package:flutter/material.dart';

import '../core/api_error.dart';
import '../core/l10n_ext.dart';
import 'common_widgets.dart';

/// Shared `loading` / `loadError` flags for screens that fetch on open.
mixin AsyncLoadState<T extends StatefulWidget> on State<T> {
  bool loading = true;
  String? loadError;

  /// Runs [task] (which applies its own data via setState) and tracks loading/error.
  Future<bool> runLoad(
    Future<void> Function() task, {
    String Function(Object error) describeError = friendlyApiError,
  }) async {
    setState(() {
      loading = true;
      loadError = null;
    });
    try {
      await task();
      if (mounted) setState(() => loading = false);
      return mounted;
    } catch (e) {
      if (mounted) {
        setState(() {
          loadError = describeError(e);
          loading = false;
        });
      }
      return false;
    }
  }
}

/// Loading spinner → error with retry → content.
class AsyncBody extends StatelessWidget {
  const AsyncBody({
    super.key,
    required this.loading,
    required this.error,
    required this.builder,
    this.errorTitle = 'Could not load',
    this.loadingMessage,
    this.onRetry,
  });

  final bool loading;
  final String? error;
  final WidgetBuilder builder;
  final String errorTitle;
  final String? loadingMessage;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    if (loading) return LoadingOverlay(message: loadingMessage);
    if (error != null) {
      return EmptyState(
        title: errorTitle,
        subtitle: error,
        icon: Icons.error_outline,
        action: onRetry == null
            ? null
            : OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: Text(context.l10n.retry),
              ),
      );
    }
    return builder(context);
  }
}
