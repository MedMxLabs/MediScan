import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Shared layout constants for consistent spacing across screens.
class AppSpacing {
  static const pageHorizontal = 20.0;
  static const bottomNavClearance = 120.0;
}

String userDisplayName(Map<String, dynamic>? user) {
  final name = user?['name']?.toString().trim();
  if (name != null && name.isNotEmpty) return name;
  final email = user?['email']?.toString().trim();
  if (email != null && email.contains('@')) {
    final local = email.split('@').first;
    if (local.isNotEmpty) return local;
  }
  return 'there';
}

EdgeInsets pagePadding() {
  return const EdgeInsets.fromLTRB(
    AppSpacing.pageHorizontal,
    12,
    AppSpacing.pageHorizontal,
    AppSpacing.bottomNavClearance,
  );
}

String formatDistance(num? meters) {
  if (meters == null) return '';
  if (meters < 1000) return '${meters.round()} m';
  return '${(meters / 1000).toStringAsFixed(1)} km';
}

String formatIsoDate(String? iso, {String fallback = ''}) {
  if (iso == null || iso.isEmpty) return fallback;
  try {
    final dt = DateTime.parse(iso).toLocal();
    return DateFormat('MMM d, yyyy').format(dt);
  } catch (_) {
    return iso.split('T').first;
  }
}

String formatTimeFromIso(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  try {
    return DateFormat('h:mm a').format(DateTime.parse(iso).toLocal());
  } catch (_) {
    return '';
  }
}

String formatTodayHeader() {
  return DateFormat('EEEE, d MMMM').format(DateTime.now());
}

String formatShortDay(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  try {
    return DateFormat('EEE').format(DateTime.parse(iso).toLocal());
  } catch (_) {
    return '';
  }
}

String formatCoordsLabel(double lat, double lng) {
  return '${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}';
}

