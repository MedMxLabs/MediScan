part of 'dashboard_screen.dart';

class _Header extends StatelessWidget {
  const _Header({
    required this.name,
    required this.hasAlerts,
    required this.onMenu,
    required this.onNotifications,
  });

  final String name;
  final bool hasAlerts;
  final VoidCallback onMenu;
  final VoidCallback onNotifications;

  @override
  Widget build(BuildContext context) {
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        IconButton(
          icon: Icon(Icons.menu, color: muted),
          onPressed: onMenu,
          visualDensity: VisualDensity.compact,
        ),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${greetingForHour(context)}, $name',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: primary, height: 1.2),
              ),
              const SizedBox(height: 4),
              Text(formatTodayHeader(), style: TextStyle(color: muted, fontSize: 13)),
            ],
          ),
        ),
        Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              icon: Icon(Icons.notifications_none_outlined, color: muted),
              onPressed: onNotifications,
            ),
            if (hasAlerts)
              Positioned(
                right: 14,
                top: 14,
                child: Container(
                  width: 7,
                  height: 7,
                  decoration: const BoxDecoration(color: AppColors.lime, shape: BoxShape.circle),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final card = AppTheme.cardColor(context);
    final muted = AppTheme.mutedText(context);
    return Material(
      color: card,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              Icon(Icons.search, size: 20, color: muted),
              const SizedBox(width: 10),
              Text(l10n.searchHint, style: TextStyle(color: muted, fontSize: 15)),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatsStrip extends StatelessWidget {
  const _StatsStrip({
    required this.dosesToday,
    required this.activeMeds,
    required this.adherence,
  });

  final num dosesToday;
  final num activeMeds;
  final double adherence;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final card = AppTheme.cardColor(context);
    final primary = AppTheme.primaryText(context);
    final muted = AppTheme.mutedText(context);
    final border = Theme.of(context).brightness == Brightness.dark
        ? AppColors.border.withValues(alpha: 0.5)
        : AppColors.borderLight;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          statCell(label: l10n.statDosesToday, value: '$dosesToday', primary: primary, muted: muted),
          divider(border),
          statCell(label: l10n.statActiveMeds, value: '$activeMeds', primary: primary, muted: muted),
          divider(border),
          statCell(label: l10n.statAdherence, value: '${adherence.round()}%', primary: primary, muted: muted),
        ],
      ),
    );
  }

  Widget divider(Color border) => Container(width: 1, height: 32, color: border.withValues(alpha: 0.6));

  Widget statCell({required String label, required String value, required Color primary, required Color muted}) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: primary)),
          const SizedBox(height: 2),
          Text(label, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: muted)),
        ],
      ),
    );
  }
}
