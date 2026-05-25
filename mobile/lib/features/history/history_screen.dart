import 'package:flutter/material.dart';
import '../../core/app_navigation.dart';
import 'package:provider/provider.dart';

import '../../core/api/medscan_api.dart';
import '../../core/app_helpers.dart';
import '../../core/theme.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/ui_components.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String _filter = 'All';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<MedscanApi>().getHistory();
      if (!mounted) return;
      setState(() {
        _data = data;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _allItems {
    final searches = (_data?['searches'] as List?) ?? [];
    final prescriptions = (_data?['prescriptions'] as List?) ?? [];
    return [
      ...prescriptions.map((p) => {'type': 'rx', ...Map<String, dynamic>.from(p as Map)}),
      ...searches.map((s) => {'type': 'search', ...Map<String, dynamic>.from(s as Map)}),
    ];
  }

  List<Map<String, dynamic>> get _filteredItems {
    final items = _allItems;
    if (_filter == 'Searches') return items.where((r) => r['type'] == 'search').toList();
    if (_filter == 'Prescriptions') return items.where((r) => r['type'] == 'rx').toList();
    return items;
  }

  void _openItem(Map<String, dynamic> row) {
    if (row['type'] == 'search') {
      final query = row['query']?.toString() ?? '';
      if (query.isNotEmpty) context.openPage('/compare?q=${Uri.encodeComponent(query)}');
    } else {
      context.openPage('/upload');
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = _filteredItems;

    return PageShell(
      title: 'Medicine History',
      showBack: true,
      child: _loading
          ? const LoadingOverlay()
          : RefreshIndicator(
              color: AppColors.teal,
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, AppSpacing.bottomNavClearance),
                children: [
                  FilterTabs(
                    tabs: const ['All', 'Searches', 'Prescriptions'],
                    selected: _filter,
                    onSelected: (f) => setState(() => _filter = f),
                  ),
                  const SizedBox(height: 16),
                  if (items.isEmpty)
                    const EmptyState(title: 'No medicine history yet')
                  else
                    ...items.asMap().entries.map((e) {
                      final row = e.value;
                      final isRx = row['type'] == 'rx';
                      final name = isRx
                          ? '${(row['medicine_list'] as List?)?.length ?? 0} medicines extracted'
                          : row['query']?.toString() ?? 'Search';
                      final date = isRx ? row['uploaded_at'] : row['created_at'];
                      return FadeSlideIn(
                        delay: Duration(milliseconds: e.key * 60),
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: DarkCard(
                            onTap: () => _openItem(row),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: AppColors.teal.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    isRx ? Icons.medication : Icons.search,
                                    color: AppColors.teal,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(formatIsoDate(date?.toString()), style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                      Text(name, style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
                                      Text(
                                        isRx ? 'Prescription upload' : 'Price search',
                                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.4)),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
