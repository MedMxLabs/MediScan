import 'package:flutter/material.dart';
import '../../core/app_navigation.dart';

import '../../core/theme.dart';
import '../../widgets/ui_components.dart';
import 'reminder_widgets.dart';

class DoseTakenScreen extends StatelessWidget {
  const DoseTakenScreen({super.key, required this.reminder});

  final Map<String, dynamic> reminder;

  @override
  Widget build(BuildContext context) {
    final name = reminder['medicine_name']?.toString() ?? 'Medicine';
    final dose = reminder['dose']?.toString() ?? '';
    final time = reminderTimesLabel(reminder).split(',').first;

    return DarkScaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: AppColors.lime.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.medication_liquid, color: AppColors.lime, size: 48),
              ),
              const SizedBox(height: 24),
              Text(
                'Great! You marked $name as Taken.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              const SizedBox(height: 28),
              DarkCard(
                child: Column(
                  children: [
                    _row('Time', time),
                    const Divider(height: 20, color: AppColors.border),
                    _row('Medicine', name),
                    const Divider(height: 20, color: AppColors.border),
                    _row('Dosage', dose.isNotEmpty ? dose : '—'),
                  ],
                ),
              ),
              const Spacer(),
              GradientButton(label: 'Done', onPressed: () => context.openPage('/adherence')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textMuted)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
      ],
    );
  }
}
