import 'package:flutter/material.dart';
import '../../core/app_navigation.dart';

import '../../core/theme.dart';
import '../../widgets/ui_components.dart';
import 'models/reminder_draft.dart';

class ReminderSavedScreen extends StatelessWidget {
  const ReminderSavedScreen({super.key, required this.draft});

  final ReminderDraft draft;

  @override
  Widget build(BuildContext context) {
    return DarkScaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              FadeSlideIn(
                child: Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: AppColors.lime.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle, color: AppColors.lime, size: 56),
                ),
              ),
              const SizedBox(height: 24),
              FadeSlideIn(
                delay: const Duration(milliseconds: 100),
                child: const Text(
                  'Medicine Saved!',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 150),
                child: Text(
                  '${draft.medicineName} · ${draft.dosage}\n${draft.frequency} · ${draft.timesDisplay}\n${draft.durationDays} days',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.65), height: 1.5),
                ),
              ),
              const SizedBox(height: 28),
              FadeSlideIn(
                delay: const Duration(milliseconds: 200),
                child: DarkCard(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.teal.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.notifications_active_outlined, color: AppColors.teal),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Reminders Scheduled', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
                            const SizedBox(height: 4),
                            Text(
                              'You will receive reminders as per your schedule.',
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.55), fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              GradientButton(label: 'Go to Dashboard', onPressed: () => context.openTab('/home')),
              const SizedBox(height: 12),
              GhostButton(label: 'View Reminders', onPressed: () => context.openPage('/reminders')),
            ],
          ),
        ),
      ),
    );
  }
}
