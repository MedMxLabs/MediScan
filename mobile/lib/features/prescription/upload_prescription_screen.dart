import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/api/api_client.dart';
import '../../core/api/medscan_api.dart';
import '../../core/app_navigation.dart';
import '../../core/back_navigation.dart';
import '../../core/theme.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/ui_components.dart';

class UploadPrescriptionScreen extends StatefulWidget {
  const UploadPrescriptionScreen({super.key});

  @override
  State<UploadPrescriptionScreen> createState() => _UploadPrescriptionScreenState();
}

class _UploadPrescriptionScreenState extends State<UploadPrescriptionScreen> {
  bool _loading = false;
  Map<String, dynamic>? _result;
  String? _error;
  final _picker = ImagePicker();

  Future<void> _upload(FormData form) async {
    setState(() {
      _loading = true;
      _error = null;
      _result = null;
    });
    try {
      final data = await context.read<MedscanApi>().uploadPrescription(form);
      if (!mounted) return;
      setState(() {
        _result = data;
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

  Future<void> _pickFile() async {
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
      withData: true,
    );
    if (picked == null || picked.files.isEmpty || picked.files.first.bytes == null) return;
    final file = picked.files.first;
    await _upload(FormData.fromMap({
      'file': MultipartFile.fromBytes(file.bytes!, filename: file.name),
    }));
  }

  Future<void> _scanCamera() async {
    final photo = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
    if (photo == null) return;
    final bytes = await photo.readAsBytes();
    await _upload(FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: photo.name),
    }));
  }

  List<Map<String, dynamic>> _medicineItems() {
    if (_result == null) return [];
    final raw = _result!['medicines'];
    if (raw is List && raw.isNotEmpty) {
      return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    final names = _result!['medicine_names'];
    if (names is List) {
      return names
          .map((n) => {'name': n.toString(), 'kind': 'single'})
          .toList();
    }
    return [];
  }

  String _extractionLabel() {
    final engine = _result?['extraction_engine']?.toString() ?? '';
    const labels = {
      'smart_nlp': 'Smart filter',
      'smart_nlp+catalog_compact': 'Smart filter + OCR recovery',
      'azure_openai': 'Azure OpenAI filter',
      'azure_openai+smart_nlp': 'Azure OpenAI + smart filter',
      'catalog_compact+combination': 'Catalog + combination merge',
      'combination_formulation': 'Combination detection',
    };
    return labels[engine] ?? (engine.isNotEmpty ? engine : 'Extraction complete');
  }

  @override
  Widget build(BuildContext context) {
    final items = _medicineItems();
    final extractedText = _result?['extracted_text']?.toString() ?? '';
    final ocrEngine = _result?['ocr_engine']?.toString();

    return DarkScaffold(
      appBar: DarkAppBar(
        title: 'Upload Prescription',
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => navigateBack(context),
        ),
      ),
      body: _loading
          ? const LoadingOverlay(message: 'OCR + medicine extraction…')
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                FadeSlideIn(
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border, width: 1.5),
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.teal.withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.cloud_upload_outlined, color: AppColors.teal, size: 36),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Upload Prescription',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: Colors.white),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'JPG, PNG or PDF (Max 10MB)',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                        ),
                        const SizedBox(height: 20),
                        GradientButton(label: 'Choose File', onPressed: _pickFile, icon: Icons.folder_open),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const OrDivider(label: 'or try'),
                const SizedBox(height: 20),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 100),
                  child: GhostButton(label: 'Scan with Camera', onPressed: _scanCamera),
                ),
                const SizedBox(height: 24),
                const AiBanner(
                  text: 'Same backend as web — Azure OpenAI filters medicines and finds combination formulations.',
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Text(_error!, style: const TextStyle(color: AppColors.red)),
                ],
                if (_result != null) ...[
                  const SizedBox(height: 24),
                  DarkCard(
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: AppColors.teal, size: 22),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Found ${items.length} medicine${items.length == 1 ? '' : 's'}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${_extractionLabel()}${ocrEngine != null ? ' · OCR: $ocrEngine' : ''}',
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (extractedText.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    SectionHeader(title: 'Raw OCR text'),
                    const SizedBox(height: 8),
                    DarkCard(
                      child: Text(
                        extractedText.length > 600 ? '${extractedText.substring(0, 600)}…' : extractedText,
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12, height: 1.4),
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  ...items.asMap().entries.map((entry) {
                    final row = entry.value;
                    final name = row['name']?.toString() ?? '';
                    final isCombo = row['kind'] == 'combination';
                    final ingredients = (row['ingredients'] as List?)?.map((e) => e.toString()).toList() ?? [];
                    final brands = (row['brand_equivalents'] as List?)?.map((e) => e.toString()).toList() ?? [];

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: DarkCard(
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
                                      '${entry.key + 1}',
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
                      ),
                    );
                  }),
                ],
              ],
            ),
    );
  }
}
