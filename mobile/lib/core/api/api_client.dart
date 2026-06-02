import 'package:dio/dio.dart';

import '../config.dart';
import '../storage/auth_storage.dart';

class ApiClient {
  ApiClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: AppConfig.defaultTimeout,
        receiveTimeout: AppConfig.defaultTimeout,
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final clientKey = AppConfig.medscanApiKey.trim();
          if (clientKey.isNotEmpty) {
            options.headers['X-Medscan-Api-Key'] = clientKey;
          }
          final skipAuth = options.extra['skipAuth'] == true;
          if (!skipAuth) {
            final token = await _storage.getToken();
            if (token != null && token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final response = error.response;
          final cfg = error.requestOptions;
          final path = cfg.path;
          final isAuthRoute = path.contains('/api/auth/');
          if (response?.statusCode == 401 &&
              !isAuthRoute &&
              cfg.extra['_refreshAttempt'] != true) {
            final refresh = await _storage.getRefreshToken();
            if (refresh != null && refresh.isNotEmpty) {
              cfg.extra['_refreshAttempt'] = true;
              try {
                final refreshRes = await _dio.post(
                  '/api/auth/refresh',
                  options: Options(
                    headers: {'Authorization': 'Bearer $refresh'},
                    extra: {'skipAuth': true},
                  ),
                );
                final newToken = refreshRes.data['access_token'] as String?;
                if (newToken != null && newToken.isNotEmpty) {
                  await _storage.saveSession(
                    accessToken: newToken,
                    refreshToken: refresh,
                    user: await _storage.getUser(),
                  );
                  cfg.headers['Authorization'] = 'Bearer $newToken';
                  final retry = await _dio.fetch(cfg);
                  return handler.resolve(retry);
                }
              } catch (_) {
                /* fall through to clear session */
              }
            }
          }

          if (response?.statusCode == 401 &&
              !isAuthRoute &&
              cfg.extra['_authRetry'] != true &&
              await _storage.getToken() != null) {
            await _storage.clear();
            cfg.extra['_authRetry'] = true;
            cfg.headers.remove('Authorization');
            try {
              final retry = await _dio.fetch(cfg);
              return handler.resolve(retry);
            } catch (e) {
              return handler.next(error);
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  final AuthStorage _storage;
  late final Dio _dio;

  Dio get dio => _dio;

  dynamic unwrap(Response<dynamic> res) {
    final d = res.data;
    if (d is Map && d['status'] == 'success' && d.containsKey('data')) {
      return d['data'];
    }
    return d;
  }

  String errorMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map) {
      return (data['message'] ?? data['error'] ?? e.message)?.toString() ??
          'Request failed';
    }
    return e.message ?? 'Network error';
  }
}
