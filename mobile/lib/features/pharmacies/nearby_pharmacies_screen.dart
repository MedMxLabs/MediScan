import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/medscan_api.dart';
import '../../core/app_helpers.dart';
import '../../core/theme.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/ui_components.dart';

class NearbyPharmaciesScreen extends StatefulWidget {
  const NearbyPharmaciesScreen({super.key});

  @override
  State<NearbyPharmaciesScreen> createState() => _NearbyPharmaciesScreenState();
}

class _NearbyPharmaciesScreenState extends State<NearbyPharmaciesScreen> {
  List<Map<String, dynamic>> _results = [];
  bool _loading = false;
  String? _error;
  String _location = 'Getting location…';

  Future<void> _locate() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        throw Exception('Location permission denied. Enable location in settings.');
      }

      final pos = await Geolocator.getCurrentPosition();
      if (!mounted) return;
      final data = await context.read<MedscanApi>().getNearbyPharmacies(lat: pos.latitude, lng: pos.longitude);
      if (!mounted) return;
      setState(() {
        _results = ((data['results'] as List?) ?? []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _location = formatCoordsLabel(pos.latitude, pos.longitude);
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
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _locate());
  }

  Future<void> _openDirections(Map<String, dynamic> r) async {
    final url = r['directions_url']?.toString();
    if (url == null || url.isEmpty) return;
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _callPharmacy(Map<String, dynamic> r) async {
    final phone = r['phone']?.toString().trim();
    if (phone == null || phone.isEmpty) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  String _statusLine(Map<String, dynamic> r) {
    final dist = formatDistance(r['distance_m'] as num?);
    final hours = r['opening_hours']?.toString().trim();
    if (hours != null && hours.isNotEmpty) return '$dist · $hours';
    return dist;
  }

  @override
  Widget build(BuildContext context) {
    return PageShell(
      title: 'Nearby Pharmacies',
      showBack: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: Row(
              children: [
                const Icon(Icons.location_on, color: AppColors.lime, size: 18),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(_location, style: const TextStyle(color: AppColors.lime, fontWeight: FontWeight.w600)),
                ),
                IconButton(
                  icon: const Icon(Icons.refresh, color: AppColors.lime, size: 20),
                  onPressed: _loading ? null : _locate,
                  tooltip: 'Refresh',
                ),
              ],
            ),
          ),
          if (_loading)
            const Expanded(child: LoadingOverlay(message: 'Finding pharmacies…'))
          else if (_error != null)
            Expanded(
              child: Column(
                children: [
                  Expanded(child: EmptyState(title: 'Location lookup failed', subtitle: _error)),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: GradientButton(label: 'Retry', onPressed: _locate),
                  ),
                ],
              ),
            )
          else if (_results.isEmpty)
            Expanded(
              child: Column(
                children: [
                  const Expanded(child: EmptyState(title: 'No pharmacies found', icon: Icons.map_outlined)),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: GradientButton(label: 'Search again', onPressed: _locate),
                  ),
                ],
              ),
            )
          else
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, AppSpacing.bottomNavClearance),
                itemCount: _results.length,
                itemBuilder: (_, i) {
                  final r = _results[i];
                  final phone = r['phone']?.toString().trim() ?? '';
                  final address = r['address']?.toString().trim() ?? '';
                  return FadeSlideIn(
                    delay: Duration(milliseconds: i * 60),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: DarkCard(
                        onTap: () => _openDirections(r),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppColors.navyLight,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.local_pharmacy, color: AppColors.teal),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    r['name']?.toString() ?? 'Pharmacy',
                                    style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _statusLine(r),
                                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                  ),
                                  if (address.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(address, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                  ],
                                ],
                              ),
                            ),
                            Column(
                              children: [
                                GestureDetector(
                                  onTap: () => _openDirections(r),
                                  child: Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppColors.teal.withValues(alpha: 0.15),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.directions, color: AppColors.teal, size: 20),
                                  ),
                                ),
                                if (phone.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  GestureDetector(
                                    onTap: () => _callPharmacy(r),
                                    child: Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppColors.lime.withValues(alpha: 0.15),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.phone, color: AppColors.lime, size: 18),
                                    ),
                                  ),
                                ],
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
        ],
      ),
    );
  }
}
