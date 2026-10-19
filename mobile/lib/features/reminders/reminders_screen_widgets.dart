part of 'reminders_screen.dart';

class _AlertSettingsCard extends StatelessWidget {
  const _AlertSettingsCard({
    required this.alarmMode,
    required this.strictBlock,
    required this.onAlarmMode,
    required this.onStrictBlock,
    required this.onPreview,
  });

  final bool alarmMode;
  final bool strictBlock;
  final ValueChanged<bool> onAlarmMode;
  final ValueChanged<bool> onStrictBlock;
  final VoidCallback onPreview;

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Alert settings', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 15)),
          const SizedBox(height: 4),
          Text(
            'Customize vibration and lock-screen behaviour',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 12),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Alarm mode', style: TextStyle(color: Colors.white, fontSize: 14)),
            subtitle: const Text('Loud alert + strong vibration', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            value: alarmMode,
            activeTrackColor: AppColors.lime.withValues(alpha: 0.4),
            thumbColor: WidgetStateProperty.resolveWith(
              (s) => s.contains(WidgetState.selected) ? AppColors.lime : null,
            ),
            onChanged: onAlarmMode,
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Strict mode (optional)', style: TextStyle(color: Colors.white, fontSize: 14)),
            subtitle: const Text('Must tap Yes/No before using the app', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            value: strictBlock,
            activeTrackColor: AppColors.amber.withValues(alpha: 0.4),
            thumbColor: WidgetStateProperty.resolveWith(
              (s) => s.contains(WidgetState.selected) ? AppColors.amber : null,
            ),
            onChanged: onStrictBlock,
          ),
          if (strictBlock)
            TextButton(
              onPressed: onPreview,
              child: const Text('Preview strict alarm screen'),
            ),
        ],
      ),
    );
  }
}

class _ReminderTile extends StatelessWidget {
  const _ReminderTile({
    required this.reminder,
    required this.onToggle,
    required this.onDelete,
  });

  final Map<String, dynamic> reminder;
  final ValueChanged<bool> onToggle;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final r = reminder;
    final timeLabel = reminderTimesLabel(r);
    final notes = reminderNotes(r);
    final enabled = r['enabled'] != false && r['status'] != 'paused';
    final due = isReminderDueNow(r);
    return DarkCard(
      onTap: () => showReminderNotificationSheet(context, r),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('💊', style: TextStyle(fontSize: 24)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (timeLabel.isNotEmpty)
                      Text(timeLabel, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    Text(
                      r['medicine_name']?.toString() ?? '',
                      style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                    Text(
                      '${r['dose'] ?? ''} · ${r['frequency'] ?? 'Daily'}',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                    if (notes.isNotEmpty)
                      Text(notes, style: const TextStyle(color: AppColors.lime, fontSize: 12)),
                  ],
                ),
              ),
              Switch(
                value: enabled,
                activeTrackColor: AppColors.lime.withValues(alpha: 0.4),
                thumbColor: WidgetStateProperty.resolveWith(
                  (s) => s.contains(WidgetState.selected) ? AppColors.lime : null,
                ),
                onChanged: onToggle,
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: AppColors.red, size: 20),
                onPressed: onDelete,
              ),
            ],
          ),
          if (due) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.lime.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Due now — tap to respond',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.lime, fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
