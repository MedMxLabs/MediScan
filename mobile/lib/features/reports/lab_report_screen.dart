import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/api/medscan_api.dart';
import '../../core/app_helpers.dart';
import '../../core/local_store.dart';
import '../../core/theme.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/ui_components.dart';

class LabReportScreen extends StatefulWidget {
  const LabReportScreen({super.key});

  @override
  State<LabReportScreen> createState() => _LabReportScreenState();
}

class _LabReportScreenState extends State<LabReportScreen> {
  bool _loading = false;
  Map<String, dynamic>? _selectedResult;
  String? _error;
  String _filter = 'All';
  List<Map<String, dynamic>> _reports = [];

  @override
  void initState() {
    super.initState();
    _loadSaved();
  }

  Future<void> _loadSaved() async {
    List<Map<String, dynamic>> merged = [];
    try {
      final apiData = await context.read<MedscanApi>().getLabReports();
      final remote = (apiData['reports'] as List?) ?? [];
      merged = remote.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      merged = await LocalStore.getLabReports();
    }
    if (!mounted) return;
    setState(() => _reports = merged);
  }

  String _formatFileSize(int? bytes) {
    if (bytes == null) return '';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  Future<void> _upload() async {
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
      withData: true,
    );
    if (picked == null || picked.files.isEmpty || picked.files.first.bytes == null) return;

    final file = picked.files.first;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final form = FormData.fromMap({
        'file': MultipartFile.fromBytes(file.bytes!, filename: file.name),
      });
      if (!mounted) return;
      final data = await context.read<MedscanApi>().analyzeReport(form);
      final report = {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'date': DateFormat('MMM d, yyyy').format(DateTime.now()),
        'title': file.name,
        'size': _formatFileSize(file.size),
        'type': 'Others',
        'result': data,
      };
      await LocalStore.addLabReport(report);
      if (!mounted) return;
      setState(() {
        _selectedResult = data;
        _loading = false;
      });
      await _loadSaved();
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

  List<Map<String, dynamic>> get _filtered {
    if (_filter == 'All') return _reports;
    return _reports.where((r) => r['type'] == _filter).toList();
  }

  void _openReport(Map<String, dynamic> report) {
    final result = report['result'];
    if (result is Map) {
      setState(() => _selectedResult = Map<String, dynamic>.from(result));
    }
  }

  @override
  Widget build(BuildContext context) {
    final rows = (_selectedResult?['extracted_rows'] as List?) ?? [];
    final insights = _selectedResult?['insights']?.toString();

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Lab Reports'),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(Icons.upload_outlined), onPressed: _upload, tooltip: 'Upload report'),
        ],
      ),
      body: _loading
          ? const LoadingOverlay(message: 'Analyzing report…')
          : Column(
              children: [
                if (_reports.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: FilterTabs(
                      tabs: const ['All', 'Blood', 'Urine', 'Others'],
                      selected: _filter,
                      onSelected: (f) => setState(() => _filter = f),
                    ),
                  ),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, AppSpacing.bottomNavClearance),
                    children: [
                      if (_error != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(_error!, style: const TextStyle(color: AppColors.red)),
                        ),
                      if (_reports.isEmpty && _selectedResult == null)
                        Column(
                          children: [
                            const EmptyState(
                              title: 'No lab reports yet',
                              subtitle: 'Upload a PDF or image to analyze results',
                              icon: Icons.biotech_outlined,
                            ),
                            const SizedBox(height: 16),
                            GradientButton(label: 'Upload Report', onPressed: _upload),
                          ],
                        )
                      else ...[
                        if (_reports.isEmpty)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: GradientButton(label: 'Upload Report', onPressed: _upload),
                          ),
                        ..._filtered.asMap().entries.map((e) {
                          final r = e.value;
                          return FadeSlideIn(
                            delay: Duration(milliseconds: e.key * 60),
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: DarkCard(
                                onTap: () => _openReport(r),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppColors.navyLight,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(Icons.description_outlined, color: AppColors.textMuted),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(r['date']?.toString() ?? '', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                          Text(r['title']?.toString() ?? 'Report', style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
                                          Text(r['size']?.toString() ?? '', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                    const Icon(Icons.chevron_right, color: AppColors.textMuted),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }),
                      ],
                      if (insights != null && insights.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const SectionHeader(title: 'Analysis'),
                        const SizedBox(height: 8),
                        DarkCard(
                          child: Text(insights, style: const TextStyle(color: Colors.white70, height: 1.5)),
                        ),
                      ],
                      if (rows.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const SectionHeader(title: 'Extracted values'),
                        const SizedBox(height: 8),
                        ...rows.map((r) {
                          final row = Map<String, dynamic>.from(r as Map);
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: DarkCard(
                              child: ListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text(row['name']?.toString() ?? '', style: const TextStyle(color: Colors.white)),
                                subtitle: Text(row['deviation']?.toString() ?? '', style: const TextStyle(color: AppColors.textMuted)),
                                trailing: Text('${row['value']} ${row['unit'] ?? ''}', style: const TextStyle(color: AppColors.teal)),
                              ),
                            ),
                          );
                        }),
                      ],
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
