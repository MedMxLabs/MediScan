/// API base URL — override at build time:
/// flutter run --dart-define=API_BASE_URL=https://medscan-api.azurewebsites.net
class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000',
  );

  /// Supabase OAuth return URL — add to Supabase Auth redirect URLs.
  static const oauthRedirectUrl = String.fromEnvironment(
    'SUPABASE_OAUTH_REDIRECT',
    defaultValue: 'com.medmxlabs.medscan://login-callback',
  );

  /// Matches backend MEDSCAN_CLIENT_API_KEYS — sent as X-Medscan-Api-Key on every request.
  /// flutter run --dart-define=MEDSCAN_API_KEY=your-key
  static const medscanApiKey = String.fromEnvironment(
    'MEDSCAN_API_KEY',
    defaultValue: '',
  );

  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );

  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  static bool get supabaseAuthEnabled =>
      supabaseUrl.trim().isNotEmpty && supabaseAnonKey.trim().isNotEmpty;

  static const scrapeTimeout = Duration(seconds: 180);
  static const defaultTimeout = Duration(seconds: 30);
}
