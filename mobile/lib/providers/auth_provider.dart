import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/api/api_client.dart';
import '../core/api/medscan_api.dart';
import '../core/supabase_auth.dart' as sb;
import '../core/notifications/reminder_notification_service.dart';
import '../core/storage/auth_storage.dart';
import 'settings_provider.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider(this._storage, this._api, this._client) {
    _bootstrap();
  }

  final AuthStorage _storage;
  final MedscanApi _api;
  final ApiClient _client;

  Map<String, dynamic>? _user;
  bool _loading = false;
  String? _error;
  bool _initialized = false;
  bool _supabaseActive = false;

  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get loading => _loading;
  String? get error => _error;
  bool get initialized => _initialized;
  bool get supabaseActive => _supabaseActive;

  String _formatError(Object e) {
    if (e is DioException) return _client.errorMessage(e);
    return e.toString();
  }

  Future<void> _saveFromAuthResponse(Map<String, dynamic> data) async {
    await _storage.saveSession(
      accessToken: data['access_token'] as String,
      refreshToken: data['refresh_token'] as String?,
      user: Map<String, dynamic>.from(data['user'] as Map),
    );
    _user = Map<String, dynamic>.from(data['user'] as Map);
  }

  Future<bool> _loginViaSupabase(Future<String> Function() getSupabaseToken) async {
    final sbToken = await getSupabaseToken();
    final data = await _api.exchangeSupabaseSession(sbToken);
    await _saveFromAuthResponse(data);
    return true;
  }

  Future<void> _bootstrap() async {
    _supabaseActive = await sb.ensureSupabase();
    final user = await _storage.getUser();
    final token = await _storage.getToken();
    if (user != null && token != null && token.isNotEmpty) {
      _user = user;
    } else if (_supabaseActive) {
      try {
        final session = Supabase.instance.client.auth.currentSession;
        final access = session?.accessToken;
        if (access != null && access.isNotEmpty) {
          final data = await _api.exchangeSupabaseSession(access);
          await _saveFromAuthResponse(data);
        } else {
          await _storage.clear();
          _user = null;
        }
      } catch (_) {
        await _storage.clear();
        _user = null;
      }
    } else {
      await _storage.clear();
      _user = null;
    }
    _initialized = true;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _storage.clear();
      if (await sb.ensureSupabase()) {
        _supabaseActive = true;
        await _loginViaSupabase(
          () => sb.signInWithEmailPassword(email, password),
        );
      } else {
        final data = await _api.login(email, password);
        await _saveFromAuthResponse(data);
      }
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _formatError(e);
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> loginWithGoogle(String idToken) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _storage.clear();
      if (_supabaseActive || await sb.ensureSupabase()) {
        _error = 'Use email/password or configure Google in Supabase OAuth for mobile.';
        _loading = false;
        notifyListeners();
        return false;
      }
      final res = await _client.dio.post(
        '/api/auth/google-login',
        data: {'credential': idToken},
        options: Options(extra: {'skipAuth': true}),
      );
      final data = Map<String, dynamic>.from(res.data as Map);
      await _saveFromAuthResponse(data);
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _formatError(e);
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _storage.clear();
      if (await sb.ensureSupabase()) {
        _supabaseActive = true;
        await _loginViaSupabase(
          () => sb.signUpWithEmailPassword(email, password),
        );
      } else {
        await _api.register(email, password);
        final data = await _api.login(email, password);
        await _saveFromAuthResponse(data);
      }
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _formatError(e);
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await ReminderNotificationService.instance.cancelAll();
    await sb.signOutSupabase();
    await _storage.clear();
    _user = null;
    notifyListeners();
  }

  void updateUser(Map<String, dynamic> partial) {
    if (_user == null) return;
    _user = {..._user!, ...partial};
    notifyListeners();
  }
}

class AppServices {
  AppServices() {
    storage = AuthStorage();
    client = ApiClient(storage);
    api = MedscanApi(client);
    auth = AuthProvider(storage, api, client);
    settings = SettingsProvider();
  }

  late final AuthStorage storage;
  late final ApiClient client;
  late final MedscanApi api;
  late final AuthProvider auth;
  late final SettingsProvider settings;
}
