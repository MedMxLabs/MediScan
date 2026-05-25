/// API base URL — override at build time:
/// flutter run --dart-define=API_BASE_URL=https://medscan-api.azurewebsites.net
class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000',
  );

  static const scrapeTimeout = Duration(seconds: 180);
  static const defaultTimeout = Duration(seconds: 30);
}
