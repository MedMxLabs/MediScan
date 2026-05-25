import 'package:shared_preferences/shared_preferences.dart';

/// User preferences for reminder alarm behaviour.
class ReminderAlarmPrefs {
  static const _alarmModeKey = 'reminder_alarm_mode';
  static const _strictBlockKey = 'reminder_strict_block';
  static const _cachedRemindersKey = 'cached_reminders_json';

  /// Loud alarm-style alerts with strong vibration (default: on).
  static Future<bool> alarmModeEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_alarmModeKey) ?? true;
  }

  static Future<void> setAlarmMode(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_alarmModeKey, value);
  }

  /// Full-screen block until user taps Yes/No (default: off).
  static Future<bool> strictBlockEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_strictBlockKey) ?? false;
  }

  static Future<void> setStrictBlock(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_strictBlockKey, value);
  }

  static Future<void> cacheRemindersJson(String json) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_cachedRemindersKey, json);
  }

  static Future<String?> cachedRemindersJson() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_cachedRemindersKey);
  }
}
