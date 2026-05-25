import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/back_navigation.dart';
import '../providers/auth_provider.dart';
import '../features/landing/landing_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/signup_screen.dart';
import '../features/home/shell_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/search/search_screen.dart';
import '../features/compare/compare_screen.dart';
import '../features/prescription/upload_prescription_screen.dart';
import '../features/history/history_screen.dart';
import '../features/reminders/reminders_screen.dart';
import '../features/reminders/add_medicine_screen.dart';
import '../features/reminders/set_schedule_screen.dart';
import '../features/reminders/reminder_saved_screen.dart';
import '../features/reminders/dose_taken_screen.dart';
import '../features/reminders/alarm_lock_screen.dart';
import '../features/reminders/models/reminder_draft.dart';
import '../features/adherence/adherence_screen.dart';
import '../features/reports/lab_report_screen.dart';
import '../features/assistant/assistant_screen.dart';
import '../features/pharmacies/nearby_pharmacies_screen.dart';
import '../features/profile/profile_screen.dart';

/// Root navigator — used for system back handling.
final rootNavigatorKey = GlobalKey<NavigatorState>();

GoRouter createRouter(AppServices services) {
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: services.auth,
    redirect: (context, state) {
      final auth = services.auth;
      if (!auth.initialized) return null;

      final loc = state.matchedLocation;
      const publicRoutes = {'/', '/login', '/signup'};
      final isPublic = publicRoutes.contains(loc);

      if (!auth.isAuthenticated && !isPublic) return '/';
      if (auth.isAuthenticated && isPublic) return '/home';
      // Allow alarm lock while authenticated.
      if (loc == '/alarm-lock') return null;
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (_, _) => const SystemBackScope(child: LandingScreen()),
      ),
      GoRoute(
        path: '/login',
        builder: (_, _) => const SystemBackScope(child: LoginScreen()),
      ),
      GoRoute(
        path: '/signup',
        builder: (_, _) => const SystemBackScope(child: SignupScreen()),
      ),
      GoRoute(
        path: '/alarm-lock',
        builder: (context, state) => AlarmLockScreen(
          reminder: Map<String, dynamic>.from(state.extra as Map),
        ),
      ),
      ShellRoute(
        builder: (context, state, child) =>
            SystemBackScope(child: ShellScreen(child: child)),
        routes: [
          GoRoute(path: '/home', builder: (_, _) => const DashboardScreen()),
          GoRoute(path: '/search', builder: (_, _) => const SearchScreen()),
          GoRoute(
            path: '/compare',
            builder: (context, state) =>
                CompareScreen(initialQuery: state.uri.queryParameters['q']),
          ),
          GoRoute(
            path: '/upload',
            builder: (_, _) => const UploadPrescriptionScreen(),
          ),
          GoRoute(path: '/history', builder: (_, _) => const HistoryScreen()),
          GoRoute(
            path: '/reminders',
            builder: (_, _) => const RemindersScreen(),
            routes: [
              GoRoute(
                path: 'add',
                builder: (_, _) => const AddMedicineScreen(),
              ),
              GoRoute(
                path: 'schedule',
                builder: (context, state) =>
                    SetScheduleScreen(draft: state.extra as ReminderDraft),
              ),
              GoRoute(
                path: 'saved',
                builder: (context, state) {
                  final extra = state.extra as Map<String, dynamic>? ?? {};
                  return ReminderSavedScreen(
                    draft: extra['draft'] as ReminderDraft,
                  );
                },
              ),
              GoRoute(
                path: 'dose-taken',
                builder: (context, state) => DoseTakenScreen(
                  reminder: Map<String, dynamic>.from(state.extra as Map),
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/adherence',
            builder: (_, _) => const AdherenceScreen(),
          ),
          GoRoute(path: '/reports', builder: (_, _) => const LabReportScreen()),
          GoRoute(
            path: '/assistant',
            builder: (_, _) => const AssistantScreen(),
          ),
          GoRoute(
            path: '/pharmacies',
            builder: (_, _) => const NearbyPharmaciesScreen(),
          ),
          GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
        ],
      ),
    ],
  );
}
