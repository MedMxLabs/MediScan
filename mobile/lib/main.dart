import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app.dart';
import 'core/notifications/reminder_notification_service.dart';
import 'core/supabase_auth.dart';
import 'providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Plus Jakarta Sans 400/500 ship in assets/google_fonts/ (the only weights the M3 text theme loads).
  GoogleFonts.config.allowRuntimeFetching = false;
  LicenseRegistry.addLicense(() async* {
    final license = await rootBundle.loadString('assets/google_fonts/OFL.txt');
    yield LicenseEntryWithLineBreaks(['google_fonts'], license);
  });
  await ensureSupabase();
  await ReminderNotificationService.instance.initialize();
  final services = AppServices();
  await services.settings.load();
  runApp(MedscanApp(services: services));
}
