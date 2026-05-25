import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../widgets/ui_components.dart';
import 'models/reminder_draft.dart';
import 'reminder_widgets.dart';

class AddMedicineScreen extends StatefulWidget {
  const AddMedicineScreen({super.key, this.initial});

  final ReminderDraft? initial;

  @override
  State<AddMedicineScreen> createState() => _AddMedicineScreenState();
}

class _AddMedicineScreenState extends State<AddMedicineScreen> {
  late final TextEditingController _name;
  late final TextEditingController _dosage;
  late final TextEditingController _notes;
  late String _frequency;
  late List<String> _times;
  late int _durationDays;

  @override
  void initState() {
    super.initState();
    final d = widget.initial ?? ReminderDraft();
    _name = TextEditingController(text: d.medicineName);
    _dosage = TextEditingController(text: d.dosage);
    _notes = TextEditingController(text: d.notes);
    _frequency = d.frequency;
    _times = List<String>.from(d.times);
    _durationDays = d.durationDays;
  }

  @override
  void dispose() {
    _name.dispose();
    _dosage.dispose();
    _notes.dispose();
    super.dispose();
  }

  ReminderDraft _buildDraft() {
    return ReminderDraft(
      medicineName: _name.text.trim(),
      dosage: _dosage.text.trim(),
      frequency: _frequency,
      times: _times,
      durationDays: _durationDays,
      notes: _notes.text.trim(),
    );
  }

  void _continue() {
    if (_name.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter medicine name')));
      return;
    }
    context.push('/reminders/schedule', extra: _buildDraft());
  }

  Future<void> _addTime() async {
    final t = await pickTime24(context);
    if (t == null || !mounted) return;
    if (_times.contains(t)) return;
    setState(() => _times = [..._times, t]..sort());
  }

  @override
  Widget build(BuildContext context) {
    return DarkScaffold(
      appBar: DarkAppBar(title: 'Add Medicine'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          const FormSectionLabel('Medicine Name'),
          DarkTextField(controller: _name, hint: 'Dolo 650', prefixIcon: Icons.medication),
          const SizedBox(height: 20),
          const FormSectionLabel('Dosage'),
          DarkTextField(controller: _dosage, hint: '1 Tablet', prefixIcon: Icons.medical_services_outlined),
          const SizedBox(height: 20),
          const FormSectionLabel('Frequency'),
          DarkDropdown<String>(
            value: _frequency,
            items: reminderFrequencies,
            onChanged: (v) {
              if (v == null) return;
              setState(() {
                _frequency = v;
                _times = defaultTimesForFrequency(v);
              });
            },
          ),
          const SizedBox(height: 20),
          const FormSectionLabel('Time'),
          TimeChipsRow(
            times: _times,
            onRemove: (t) => setState(() => _times.remove(t)),
            onAdd: _addTime,
          ),
          const SizedBox(height: 20),
          const FormSectionLabel('Duration'),
          DurationStepper(days: _durationDays, onChanged: (d) => setState(() => _durationDays = d)),
          const SizedBox(height: 20),
          const FormSectionLabel('Notes (Optional)'),
          DarkTextField(controller: _notes, hint: 'After Food', prefixIcon: Icons.notes_outlined),
          const SizedBox(height: 32),
          GradientButton(label: 'Save Medicine', onPressed: _continue),
        ],
      ),
    );
  }
}
