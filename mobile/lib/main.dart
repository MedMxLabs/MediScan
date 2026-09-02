import 'package:flutter/material.dart';

import 'app.dart';
import 'core/notifications/reminder_notification_service.dart';
import 'core/supabase_auth.dart';
import 'providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ensureSupabase();
  await ReminderNotificationService.instance.initialize();
  final services = AppServices();
  await services.settings.load();
  runApp(MedscanApp(services: services));
}
