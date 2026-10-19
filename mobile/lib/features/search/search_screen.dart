import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../core/app_navigation.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/api_client.dart';
import '../../core/api/medscan_api.dart';
import '../../core/app_helpers.dart';
import '../../core/theme.dart';
import '../../widgets/async_body.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/ui_components.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> with AsyncLoadState {
  final _query = TextEditingController();
  List<Map<String, dynamic>> _results = [];
  String _filter = 'All';
  static const _filters = ['All', 'Tablet', 'Syrup', 'Drops', 'Capsule'];

  @override
  void initState() {
    super.initState();
    loading = false;
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _search({bool refresh = false}) async {
    if (_query.text.trim().isEmpty) return;
    final api = context.read<MedscanApi>();
    final client = context.read<ApiClient>();
    await runLoad(
      () async {
        final rows = await api.searchMedicine(_query.text, refresh: refresh);
        if (mounted) setState(() => _results = rows);
      },
      describeError: (e) => e is DioException ? client.errorMessage(e) : e.toString(),
    );
  }

  List<Map<String, dynamic>> get _filtered {
    if (_filter == 'All') return _results;
    return _results.where((r) {
      final name = (r['name'] ?? '').toString().toLowerCase();
      final pack = (r['packSize'] ?? '').toString().toLowerCase();
      final needle = _filter.toLowerCase();
      return name.contains(needle) || pack.contains(needle);
    }).toList();
  }

  double? get _lowestPrice {
    if (_filtered.isEmpty) return null;
    return _filtered.map((r) => (r['price'] as num?)?.toDouble() ?? double.infinity).reduce((a, b) => a < b ? a : b);
  }

  @override
  Widget build(BuildContext context) {
    final lowest = _lowestPrice;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Search Medicine'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _query,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Crocin 650',
                      hintStyle: const TextStyle(color: AppColors.textMuted),
                      prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
                      filled: true,
                      fillColor: AppColors.cardDark,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onSubmitted: (_) => _search(),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.cardDark,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.tune, color: Colors.white),
                    onPressed: () => _search(),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: FilterTabs(
              tabs: _filters,
              selected: _filter,
              onSelected: (f) => setState(() => _filter = f),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: AsyncBody(
              loading: loading,
              error: loadError,
              loadingMessage: 'Fetching live prices…',
              errorTitle: 'Search failed',
              onRetry: _search,
              builder: (context) => _results.isEmpty
                  ? const EmptyState(
                      title: 'Search for a medicine',
                      subtitle: 'Live prices from 6 Indian pharmacies',
                      icon: Icons.local_pharmacy_outlined,
                    )
                  : ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, AppSpacing.bottomNavClearance),
                itemCount: _filtered.length,
                itemBuilder: (_, i) {
                  final r = _filtered[i];
                  final price = (r['price'] as num?)?.toDouble();
                  final isLowest = price != null && price == lowest;
                  return FadeSlideIn(
                    delay: Duration(milliseconds: i * 50),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: DarkCard(
                        onTap: () async {
                          final url = r['url']?.toString();
                          if (url != null && url.isNotEmpty) {
                            final uri = Uri.parse(url);
                            if (await canLaunchUrl(uri)) {
                              await launchUrl(uri, mode: LaunchMode.externalApplication);
                            }
                          }
                        },
                        child: Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppColors.navyLight,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.medication_liquid, color: AppColors.teal),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    r['name']?.toString() ?? r['pharmacy']?.toString() ?? '',
                                    style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
                                  ),
                                  Text(
                                    '${r['pharmacy'] ?? ''} · ${r['packSize'] ?? ''}',
                                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '₹${r['price']}',
                                  style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white, fontSize: 16),
                                ),
                                if (isLowest)
                                  const Text('Lowest price', style: TextStyle(color: AppColors.lime, fontSize: 11, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          if (_filtered.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: GradientButton(
                label: 'Compare Prices (${_filtered.length})',
                onPressed: () => context.openPage('/compare?q=${Uri.encodeComponent(_query.text)}'),
              ),
            ),
        ],
      ),
    );
  }
}
