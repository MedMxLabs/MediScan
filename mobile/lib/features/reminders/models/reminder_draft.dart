/// In-memory draft passed through the add-reminder wizard.
class ReminderDraft {
  ReminderDraft({
    this.medicineName = '',
    this.dosage = '',
    this.frequency = 'Twice Daily',
    this.times = const ['09:00', '21:00'],
    this.durationDays = 5,
    this.notes = '',
    DateTime? startDate,
  }) : startDate = startDate ?? DateTime.now();

  String medicineName;
  String dosage;
  String frequency;
  List<String> times;
  int durationDays;
  String notes;
  DateTime startDate;

  String get timesDisplay => times.map(formatTime12h).join(', ');

  Map<String, dynamic> toApiPayload() {
    return {
      'medicine_name': medicineName.trim(),
      'dose': dosage.trim(),
      'frequency': frequency,
      'duration_days': durationDays,
      'times': times,
      'schedule': {
        'times': times,
        'notes': notes.trim(),
        'start_date': startDate.toIso8601String().split('T').first,
      },
    };
  }

  ReminderDraft copy() {
    return ReminderDraft(
      medicineName: medicineName,
      dosage: dosage,
      frequency: frequency,
      times: List<String>.from(times),
      durationDays: durationDays,
      notes: notes,
      startDate: startDate,
    );
  }
}

const reminderFrequencies = [
  'Once Daily',
  'Twice Daily',
  'Thrice Daily',
  'Every 12 Hours',
  'Weekly',
];

/// Default times when frequency changes.
List<String> defaultTimesForFrequency(String frequency) {
  switch (frequency) {
    case 'Once Daily':
      return ['09:00'];
    case 'Thrice Daily':
      return ['08:00', '14:00', '21:00'];
    case 'Every 12 Hours':
      return ['08:00', '20:00'];
    case 'Weekly':
      return ['09:00'];
    default:
      return ['09:00', '21:00'];
  }
}

String formatTime12h(String time24) {
  final parts = time24.split(':');
  if (parts.length < 2) return time24;
  var h = int.tryParse(parts[0]) ?? 0;
  final m = parts[1].padLeft(2, '0');
  final period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h == 0) h = 12;
  return '$h:$m $period';
}

String formatTime24(DateTime dt) {
  return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
}

String adherenceRating(num pct) {
  if (pct >= 90) return 'Excellent';
  if (pct >= 75) return 'Great job!';
  if (pct >= 50) return 'Keep going!';
  return 'Needs attention';
}
