import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config.dart';

bool _initialized = false;
bool _available = false;

/// Load Supabase from dart-define or GET /api/auth/supabase/config on the MedScan API.
Future<bool> ensureSupabase() async {
  if (_initialized) return _available;

  String url = AppConfig.supabaseUrl.trim();
  String anon = AppConfig.supabaseAnonKey.trim();

  if (url.isEmpty || anon.isEmpty) {
    try {
      final dio = Dio(
        BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: AppConfig.defaultTimeout,
        ),
      );
      final res = await dio.get('/api/auth/supabase/config');
      final data = res.data;
      if (data is Map && data['enabled'] == true) {
        url = '${data['url'] ?? ''}'.trim();
        anon = '${data['anon_key'] ?? ''}'.trim();
      }
    } catch (_) {
      _initialized = true;
      _available = false;
      return false;
    }
  }

  if (url.isEmpty || anon.isEmpty) {
    _initialized = true;
    _available = false;
    return false;
  }

  await Supabase.initialize(url: url, anonKey: anon);
  _initialized = true;
  _available = true;
  return true;
}

bool get isSupabaseReady => _available;

Future<String> signInWithEmailPassword(String email, String password) async {
  if (!await ensureSupabase()) {
    throw Exception('Supabase is not configured');
  }
  final res = await Supabase.instance.client.auth.signInWithPassword(
    email: email.trim().toLowerCase(),
    password: password,
  );
  final token = res.session?.accessToken;
  if (token == null || token.isEmpty) {
    throw Exception('No Supabase session');
  }
  return token;
}

Future<String> signUpWithEmailPassword(String email, String password) async {
  if (!await ensureSupabase()) {
    throw Exception('Supabase is not configured');
  }
  final res = await Supabase.instance.client.auth.signUp(
    email: email.trim().toLowerCase(),
    password: password,
  );
  final token = res.session?.accessToken;
  if (token == null || token.isEmpty) {
    throw Exception('Check your email to confirm your account, then sign in.');
  }
  return token;
}

Future<void> signOutSupabase() async {
  if (!_available) return;
  await Supabase.instance.client.auth.signOut();
}
