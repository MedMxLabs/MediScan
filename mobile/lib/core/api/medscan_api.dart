import 'package:dio/dio.dart';

import '../config.dart';
import 'api_client.dart';

class MedscanApi {
  MedscanApi(this._client);

  final ApiClient _client;

  Dio get _dio => _client.dio;

  Future<Map<String, dynamic>> exchangeSupabaseSession(String accessToken) async {
    final res = await _dio.post(
      '/api/auth/supabase',
      data: {'access_token': accessToken},
      options: Options(extra: {'skipAuth': true}),
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> getDashboard({bool refresh = false}) async {
    final res = await _dio.get(
      '/api/dashboard',
      queryParameters: refresh ? {'refresh': '1'} : null,
    );
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  Future<Map<String, dynamic>> getAdherence() async {
    final res = await _dio.get('/api/adherence');
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  Future<List<Map<String, dynamic>>> searchMedicine(
    String query, {
    bool refresh = false,
  }) async {
    final res = await _getScraped('/api/search-medicine', {
      'query': query.trim(),
      if (refresh) 'refresh': '1',
    });
    final data = _client.unwrap(res) as Map;
    if (data['failed_all'] == true) {
      throw _scrapeFailure(res, _firstScrapeError(data));
    }
    final prices = (data['prices'] as List?) ?? [];
    final md = data['medicine_display'] ?? query;
    return prices.asMap().entries.map((e) {
      final row = Map<String, dynamic>.from(e.value as Map);
      return {
        'id': '${row['pharmacy_name']}-${e.key}',
        'name': md,
        'packSize': row['pack_size'] ?? '—',
        'price': row['price'],
        'pharmacy': row['pharmacy_name'],
        'availability': row['availability'],
        'url': row['url'],
      };
    }).toList();
  }

  Future<Map<String, dynamic>> compareMedicine(String medicine) async {
    final res = await _getScraped('/api/compare', {'medicine': medicine.trim()});
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  /// GET a scrape-backed endpoint. On 202 (cache miss) polls the background
  /// job until done, then re-issues the request without `refresh`.
  Future<Response<dynamic>> _getScraped(
    String path,
    Map<String, dynamic> query,
  ) async {
    final deadline = DateTime.now().add(AppConfig.scrapeTimeout);
    var params = query;
    while (true) {
      final res = await _dio.get(
        path,
        queryParameters: params,
        options: Options(receiveTimeout: AppConfig.scrapeTimeout),
      );
      if (res.statusCode != 202) return res;

      final job = _client.unwrap(res) as Map;
      final pollEvery = Duration(
        milliseconds: (job['poll_after_ms'] as num?)?.toInt() ?? 2000,
      );
      while (true) {
        if (DateTime.now().add(pollEvery).isAfter(deadline)) {
          throw DioException(
            requestOptions: res.requestOptions,
            type: DioExceptionType.receiveTimeout,
            message: 'Price lookup timed out',
          );
        }
        await Future<void>.delayed(pollEvery);
        final poll = await _dio.get('/api/scrape-jobs/${job['job_id']}');
        final status = _client.unwrap(poll) as Map;
        if (status['state'] == 'done') break;
        if (status['state'] == 'failed') {
          throw _scrapeFailure(
            poll,
            status['error']?.toString() ?? _firstScrapeError(status),
          );
        }
      }
      params = Map.of(query)..remove('refresh');
    }
  }

  String? _firstScrapeError(Map data) {
    final errors = data['scrape_errors'] as List?;
    return errors != null && errors.isNotEmpty
        ? (errors.first as Map)['error']?.toString()
        : null;
  }

  DioException _scrapeFailure(Response<dynamic> res, String? message) =>
      DioException(
        requestOptions: res.requestOptions,
        response: res,
        message: message ?? 'All pharmacy sources failed',
      );

  Future<Map<String, dynamic>> uploadPrescription(FormData formData) async {
    final res = await _dio.post(
      '/api/upload-prescription',
      data: formData,
      options: Options(
        receiveTimeout: AppConfig.scrapeTimeout,
        contentType: 'multipart/form-data',
      ),
    );
    final body = res.data;
    if (body is Map && body['status'] == 'success' && body['data'] != null) {
      return Map<String, dynamic>.from(body['data'] as Map);
    }
    return Map<String, dynamic>.from(body as Map);
  }

  Future<Map<String, dynamic>> getHistory({int page = 1}) async {
    final res = await _dio.get('/api/history', queryParameters: {'page': page});
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  List<Map<String, dynamic>> _normalizeReminders(List rows) {
    return rows.map((e) {
      final r = Map<String, dynamic>.from(e as Map);
      final sch = r['schedule'];
      if (r['times'] == null && sch is Map && sch['times'] is List) {
        r['times'] = sch['times'];
      }
      return r;
    }).toList();
  }

  Future<List<Map<String, dynamic>>> getReminders() async {
    final res = await _dio.get('/api/reminders');
    final data = _client.unwrap(res) as Map;
    return _normalizeReminders((data['reminders'] as List?) ?? []);
  }

  Future<Map<String, dynamic>> createReminder(Map<String, dynamic> payload) async {
    final res = await _dio.post('/api/reminders/create', data: payload);
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  Future<Map<String, dynamic>> updateReminder(Map<String, dynamic> payload) async {
    final body = Map<String, dynamic>.from(payload);
    if (body.containsKey('enabled') && !body.containsKey('status')) {
      body['status'] = body['enabled'] == true ? 'active' : 'paused';
      body.remove('enabled');
    }
    final res = await _dio.patch('/api/reminders/update', data: body);
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  Future<void> deleteReminder(int id) async {
    await _dio.delete('/api/reminders/delete', queryParameters: {'id': id});
  }

  Future<void> markDose(int reminderId, {String status = 'taken'}) async {
    await _dio.post('/api/adherence/mark-dose', data: {
      'reminder_id': reminderId,
      'status': status,
    });
  }

  Future<Map<String, dynamic>> analyzeReport(FormData formData) async {
    final res = await _dio.post(
      '/api/report-analysis',
      data: formData,
      options: Options(
        receiveTimeout: const Duration(seconds: 120),
        contentType: 'multipart/form-data',
      ),
    );
    final body = res.data;
    if (body is Map && body['status'] == 'success' && body['data'] != null) {
      return Map<String, dynamic>.from(body['data'] as Map);
    }
    return Map<String, dynamic>.from(body as Map);
  }

  Future<Map<String, dynamic>> askAssistant(String message) async {
    final res = await _dio.post('/api/chatbot', data: {'message': message});
    final body = res.data;
    if (body is Map && body['status'] == 'success' && body['data'] != null) {
      final data = body['data'] as Map;
      return {'text': data['reply'], 'fromLlm': data['from_llm'] ?? false};
    }
    if (body is Map && body['reply'] != null) {
      return {'text': body['reply'], 'fromLlm': body['from_llm'] ?? false};
    }
    return {'text': body.toString(), 'fromLlm': false};
  }

  Future<Map<String, dynamic>> getProfile() async {
    final res = await _dio.get('/api/profile');
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> partial) async {
    final res = await _dio.patch('/api/profile/update', data: partial);
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  Future<Map<String, dynamic>> getNearbyPharmacies({
    required double lat,
    required double lng,
    int radius = 2000,
  }) async {
    final res = await _dio.get(
      '/api/pharmacies/nearby',
      queryParameters: {'lat': lat, 'lng': lng, 'radius': radius},
    );
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  Future<Map<String, dynamic>> getRefillAlerts() async {
    final res = await _dio.get('/api/refill/alerts');
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  Future<Map<String, dynamic>> getAlternatives(String name) async {
    final res = await _dio.get('/api/alternatives', queryParameters: {'name': name.trim()});
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  Future<Map<String, dynamic>> getLabReports() async {
    final res = await _dio.get('/api/reports');
    return Map<String, dynamic>.from(_client.unwrap(res) as Map);
  }

  Future<void> resetUserActivity() async {
    await _dio.post('/api/profile/reset-data');
  }
}
