part of 'dashboard_screen.dart';

class _UpNextCard extends StatelessWidget {
  const _UpNextCard({
    required this.medicine,
    this.dose,
    required this.time,
    required this.onTap,
  });

  final String medicine;
  final String? dose;
  final String time;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    return Material(
      color: AppColors.navyLight,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.upNext, style: TextStyle(color: muted, fontSize: 12)),
                    const SizedBox(height: 6),
                    Text(medicine, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: primary)),
                    if (dose != null && dose!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(dose!, style: TextStyle(color: muted, fontSize: 13)),
                    ],
                  ],
                ),
              ),
              if (time.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.teal.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(time, style: const TextStyle(color: AppColors.teal, fontWeight: FontWeight.w600, fontSize: 13)),
                ),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right, color: muted.withValues(alpha: 0.6)),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyReminderCard extends StatelessWidget {
  const _EmptyReminderCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final card = AppTheme.cardColor(context);
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    return Material(
      color: card,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.noRemindersYet, style: TextStyle(fontWeight: FontWeight.w600, color: primary)),
                    const SizedBox(height: 4),
                    Text(l10n.addMedicineSchedule, style: TextStyle(color: muted, fontSize: 13)),
                  ],
                ),
              ),
              Text(l10n.add, style: const TextStyle(color: AppColors.teal, fontWeight: FontWeight.w600)),
              Icon(Icons.chevron_right, size: 18, color: AppColors.teal.withValues(alpha: 0.7)),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickLinks extends StatelessWidget {
  const _QuickLinks({
    required this.onSearch,
    required this.onUpload,
    required this.onReminders,
    required this.onAdherence,
  });

  final VoidCallback onSearch;
  final VoidCallback onUpload;
  final VoidCallback onReminders;
  final VoidCallback onAdherence;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return SizedBox(
      height: 36,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _LinkChip(icon: Icons.search, label: l10n.quickSearch, onTap: onSearch),
          _LinkChip(icon: Icons.upload_outlined, label: l10n.quickUpload, onTap: onUpload),
          _LinkChip(icon: Icons.alarm_outlined, label: l10n.quickReminders, onTap: onReminders),
          _LinkChip(icon: Icons.bar_chart_outlined, label: l10n.quickAdherence, onTap: onAdherence),
        ],
      ),
    );
  }
}

class _LinkChip extends StatelessWidget {
  const _LinkChip({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final card = AppTheme.cardColor(context);
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: card,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 16, color: muted),
                const SizedBox(width: 6),
                Text(label, style: TextStyle(color: primary, fontSize: 13, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RecentRow extends StatelessWidget {
  const _RecentRow({required this.query, required this.date, required this.onTap});

  final String query;
  final String date;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(query, style: TextStyle(fontWeight: FontWeight.w600, color: primary, fontSize: 15)),
                    if (date.isNotEmpty)
                      Text(date, style: TextStyle(color: muted, fontSize: 12)),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, size: 14, color: muted.withValues(alpha: 0.5)),
            ],
          ),
        ),
      ),
    );
  }
}
