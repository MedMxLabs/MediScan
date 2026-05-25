import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/api_client.dart';
import '../../core/api/medscan_api.dart';
import '../../core/back_navigation.dart';
import '../../core/theme.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/ui_components.dart';

class CompareScreen extends StatefulWidget {
  const CompareScreen({super.key, this.initialQuery});

  final String? initialQuery;

  @override
  State<CompareScreen> createState() => _CompareScreenState();
}

class _CompareScreenState extends State<CompareScreen> {
  final _query = TextEditingController();
  Map<String, dynamic>? _data;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery != null && widget.initialQuery!.isNotEmpty) {
      _query.text = widget.initialQuery!;
      WidgetsBinding.instance.addPostFrameCallback((_) => _compare());
    }
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _compare() async {
    if (_query.text.trim().isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await context.read<MedscanApi>().compareMedicine(_query.text);
      if (!mounted) return;
      setState(() {
        _data = data;
        _loading = false;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = context.read<ApiClient>().errorMessage(e);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final prices = (_data?['prices'] as List?) ?? [];
    final lowest = _data?['lowest_price'];

    return DarkScaffold(
      appBar: DarkAppBar(
        title: 'Compare Prices',
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => navigateBack(context),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: DarkTextField(
                    controller: _query,
                    hint: 'Medicine name',
                    prefixIcon: Icons.search,
                    onSubmitted: (_) => _compare(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _loading ? null : _compare,
                  style: IconButton.styleFrom(backgroundColor: AppColors.teal),
                  icon: _loading
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.compare_arrows),
                ),
              ],
            ),
          ),
          if (_error != null)
            Expanded(child: EmptyState(title: 'Comparison unavailable', subtitle: _error))
          else if (prices.isEmpty && !_loading)
            const Expanded(child: EmptyState(title: 'Enter a medicine to compare'))
          else if (_loading)
            const Expanded(child: LoadingOverlay(message: 'Comparing live prices…'))
          else
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                children: [
                  if (lowest != null)
                    FadeSlideIn(
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: AppTheme.brandGradient,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          'Lowest price: ₹$lowest',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18),
                        ),
                      ),
                    ),
                  const SizedBox(height: 12),
                  ...prices.asMap().entries.map((e) {
                    final row = Map<String, dynamic>.from(e.value as Map);
                    final savings = row['savings_percent_vs_lowest'];
                    return FadeSlideIn(
                      delay: Duration(milliseconds: e.key * 50),
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: DarkCard(
                          onTap: () async {
                            final url = row['url']?.toString();
                            if (url != null) {
                              final uri = Uri.parse(url);
                              if (await canLaunchUrl(uri)) {
                                await launchUrl(uri, mode: LaunchMode.externalApplication);
                              }
                            }
                          },
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      row['pharmacy_name']?.toString() ?? '',
                                      style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
                                    ),
                                    Text(
                                      row['medicine_display']?.toString() ?? '',
                                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '₹${row['price']}',
                                    style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.lime, fontSize: 16),
                                  ),
                                  if (savings != null)
                                    Text('+$savings%', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
