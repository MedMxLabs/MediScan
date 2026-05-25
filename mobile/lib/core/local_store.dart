import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Persists user-generated data locally (no backend list endpoints).
class LocalStore {
  static const _labReportsKey = 'lab_reports_v1';

  static Future<List<Map<String, dynamic>>> getLabReports() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_labReportsKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> addLabReport(Map<String, dynamic> report) async {
    final prefs = await SharedPreferences.getInstance();
    final existing = await getLabReports();
    existing.insert(0, report);
    final trimmed = existing.take(50).toList();
    await prefs.setString(_labReportsKey, jsonEncode(trimmed));
  }

  static Future<void> clearLabReports() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_labReportsKey);
  }
}
