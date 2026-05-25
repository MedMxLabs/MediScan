import 'package:dio/dio.dart';

import 'config.dart';

/// User-facing message for API failures (avoids raw Dio stack traces).
String friendlyApiError(Object error) {
  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Cannot reach the server at ${AppConfig.apiBaseUrl}.\n\n'
            '• Start the backend: cd medscan/backend && python run.py\n'
            '• Phone and PC must be on the same Wi‑Fi\n'
            '• Use your PC\'s current LAN IP (run ipconfig → IPv4), not an old VPN/Tailscale IP\n'
            '• Re-run: flutter run --dart-define=API_BASE_URL=http://YOUR_PC_IP:5000';
      case DioExceptionType.connectionError:
        return 'No connection to ${AppConfig.apiBaseUrl}. Check Wi‑Fi and that the backend is running.';
      case DioExceptionType.badResponse:
        final code = error.response?.statusCode;
        if (code == 401) return 'Session expired. Please log in again.';
        return error.response?.data?.toString() ?? 'Server error ($code).';
      default:
        break;
    }
  }
  final text = error.toString();
  if (text.contains('connection timeout') || text.contains('Connection timed out')) {
    return friendlyApiError(
      DioException(
        requestOptions: RequestOptions(path: '/'),
        type: DioExceptionType.connectionTimeout,
      ),
    );
  }
  return text.length > 200 ? '${text.substring(0, 200)}…' : text;
}
