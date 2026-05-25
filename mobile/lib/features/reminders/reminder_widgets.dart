import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/theme.dart';
import 'models/reminder_draft.dart';

class FormSectionLabel extends StatelessWidget {
  const FormSectionLabel(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600, fontSize: 13)),
    );
  }
}

class DarkDropdown<T> extends StatelessWidget {
  const DarkDropdown({
    super.key,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final T value;
  final List<T> items;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.cardDark,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.6)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          dropdownColor: AppColors.cardDark,
          style: const TextStyle(color: Colors.white, fontSize: 15),
          icon: const Icon(Icons.keyboard_arrow_down, color: AppColors.textMuted),
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e.toString()))).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

class DurationStepper extends StatelessWidget {
  const DurationStepper({super.key, required this.days, required this.onChanged});

  final int days;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.cardDark,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.6)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.remove, color: Colors.white),
            onPressed: days > 1 ? () => onChanged(days - 1) : null,
          ),
          Text('$days Days', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
          IconButton(
            icon: const Icon(Icons.add, color: AppColors.lime),
            onPressed: days < 365 ? () => onChanged(days + 1) : null,
          ),
        ],
      ),
    );
  }
}

class TimeChipsRow extends StatelessWidget {
  const TimeChipsRow({
    super.key,
    required this.times,
    required this.onRemove,
    required this.onAdd,
  });

  final List<String> times;
  final ValueChanged<String> onRemove;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        ...times.map(
          (t) => Chip(
            label: Text(formatTime12h(t), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            deleteIcon: const Icon(Icons.close, size: 16, color: AppColors.textMuted),
            onDeleted: times.length > 1 ? () => onRemove(t) : null,
            backgroundColor: AppColors.navyLight,
            side: BorderSide(color: AppColors.teal.withValues(alpha: 0.4)),
          ),
        ),
        ActionChip(
          label: const Text('+ Add Time', style: TextStyle(color: AppColors.lime, fontWeight: FontWeight.w600)),
          backgroundColor: AppColors.cardDark,
          side: BorderSide(color: AppColors.lime.withValues(alpha: 0.4)),
          onPressed: onAdd,
        ),
      ],
    );
  }
}

Future<String?> pickTime24(BuildContext context, {String? initial}) async {
  TimeOfDay initialTime = const TimeOfDay(hour: 9, minute: 0);
  if (initial != null) {
    final p = initial.split(':');
    if (p.length >= 2) {
      initialTime = TimeOfDay(hour: int.tryParse(p[0]) ?? 9, minute: int.tryParse(p[1]) ?? 0);
    }
  }
  final picked = await showTimePicker(
    context: context,
    initialTime: initialTime,
    builder: (ctx, child) => Theme(
      data: Theme.of(ctx).copyWith(
        colorScheme: const ColorScheme.dark(primary: AppColors.teal, surface: AppColors.cardDark),
      ),
      child: child!,
    ),
  );
  if (picked == null) return null;
  return formatTime24(DateTime(2000, 1, 1, picked.hour, picked.minute));
}

Future<DateTime?> pickStartDate(BuildContext context, DateTime initial) async {
  final picked = await showDatePicker(
    context: context,
    initialDate: initial,
    firstDate: DateTime.now().subtract(const Duration(days: 1)),
    lastDate: DateTime.now().add(const Duration(days: 365)),
    builder: (ctx, child) => Theme(
      data: Theme.of(ctx).copyWith(
        colorScheme: const ColorScheme.dark(primary: AppColors.teal, surface: AppColors.cardDark),
      ),
      child: child!,
    ),
  );
  return picked;
}

String formatDisplayDate(DateTime dt) => DateFormat('d MMM yyyy').format(dt);

String reminderNotes(Map<String, dynamic> r) {
  final sch = r['schedule'];
  if (sch is Map) return sch['notes']?.toString() ?? '';
  return '';
}

String reminderTimesLabel(Map<String, dynamic> r) {
  final times = (r['schedule'] is Map ? (r['schedule'] as Map)['times'] : null) ?? r['times'];
  if (times is List && times.isNotEmpty) {
    return times.map((e) => formatTime12h(e.toString())).join(', ');
  }
  return '';
}

/// Whether a reminder dose is due now (within ±30 min of any scheduled time).
bool isReminderDueNow(Map<String, dynamic> r) {
  if (r['status'] == 'paused' || r['enabled'] == false) return false;
  final times = (r['schedule'] is Map ? (r['schedule'] as Map)['times'] : null) ?? r['times'];
  if (times is! List || times.isEmpty) return false;
  final now = DateTime.now();
  for (final t in times) {
    final p = t.toString().split(':');
    if (p.length < 2) continue;
    final h = int.tryParse(p[0]) ?? 0;
    final m = int.tryParse(p[1]) ?? 0;
    final scheduled = DateTime(now.year, now.month, now.day, h, m);
    if (now.difference(scheduled).inMinutes.abs() <= 30) return true;
  }
  return false;
}
