import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/api/medscan_api.dart';
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

  @override
  Widget build(BuildContext context) {
    final medicines = (_result?['medicines'] as List?) ?? [];

    return DarkScaffold(
      appBar: DarkAppBar(
        title: 'Upload Prescription',
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => navigateBack(context),
        ),
      ),
      body: _loading
          ? const LoadingOverlay(message: 'Running OCR and price lookup…')
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                FadeSlideIn(
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border, style: BorderStyle.solid, width: 1.5),
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
                        const Text('Upload Prescription', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: Colors.white)),
                        const SizedBox(height: 6),
                        const Text('JPG, PNG or PDF (Max 10MB)', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
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
                  text: 'Our AI will review your prescription and help you get the best prices and alternatives.',
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Text(_error!, style: const TextStyle(color: AppColors.red)),
                ],
                if (_result != null) ...[
                  const SizedBox(height: 24),
                  SectionHeader(title: 'Extracted medicines (${medicines.length})'),
                  const SizedBox(height: 12),
                  ...medicines.map((m) {
                    final row = Map<String, dynamic>.from(m as Map);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: DarkCard(
                        child: ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.medication, color: AppColors.teal),
                          title: Text(row['name']?.toString() ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                          subtitle: Text(row['dosage']?.toString() ?? '', style: const TextStyle(color: AppColors.textMuted)),
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
