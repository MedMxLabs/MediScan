part of 'upload_prescription_screen.dart';

class _MedicineCard extends StatelessWidget {
  const _MedicineCard({required this.index, required this.row});

  final int index;
  final Map<String, dynamic> row;

  @override
  Widget build(BuildContext context) {
    final name = row['name']?.toString() ?? '';
    final isCombo = row['kind'] == 'combination';
    final ingredients = (row['ingredients'] as List?)?.map((e) => e.toString()).toList() ?? [];
    final brands = (row['brand_equivalents'] as List?)?.map((e) => e.toString()).toList() ?? [];

    return DarkCard(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: AppColors.teal.withValues(alpha: 0.2),
                  child: Text(
                    '${index + 1}',
                    style: const TextStyle(
                      color: AppColors.teal,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                      if (isCombo)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            'Combination formulation',
                            style: TextStyle(
                              color: AppColors.teal.withValues(alpha: 0.9),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            if (ingredients.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                'Ingredients: ${ingredients.join(', ')}',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (name.isNotEmpty)
                  OutlinedButton(
                    onPressed: () => context.openPage(
                      '/compare?q=${Uri.encodeComponent(name)}',
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.teal,
                      side: const BorderSide(color: AppColors.teal),
                    ),
                    child: const Text('Compare prices'),
                  ),
                ...brands.map(
                  (brand) => OutlinedButton(
                    onPressed: () => context.openPage(
                      '/compare?q=${Uri.encodeComponent(brand)}',
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
                    ),
                    child: Text(brand, style: const TextStyle(fontSize: 12)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
