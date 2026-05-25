import 'package:flutter_test/flutter_test.dart';
import 'package:medscan_mobile/app.dart';
import 'package:medscan_mobile/providers/auth_provider.dart';

void main() {
  testWidgets('shows landing screen on launch', (WidgetTester tester) async {
    final services = AppServices();
    await tester.pumpWidget(MedscanApp(services: services));
    await tester.pumpAndSettle();

    expect(find.text('Get Started'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
    expect(find.textContaining('Smarter decisions'), findsOneWidget);
  });
}
