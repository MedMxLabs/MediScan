import 'package:flutter/material.dart';

import '../../core/theme.dart';

/// MedMx LABS wordmark for dark backgrounds (matches web landing mockup).
class MedMxLogo extends StatelessWidget {
  const MedMxLogo({super.key, this.height = 56});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'MedM',
              style: TextStyle(
                color: Colors.white,
                fontSize: height * 0.55,
                fontWeight: FontWeight.w700,
                height: 1,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 18,
                  height: 1,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text(
                    'LABS',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.85),
                      fontSize: height * 0.22,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 2.5,
                    ),
                  ),
                ),
                Container(
                  width: 18,
                  height: 1,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
              ],
            ),
          ],
        ),
        SizedBox(width: height * 0.2),
        SizedBox(
          width: height * 0.75,
          height: height * 0.75,
          child: CustomPaint(painter: _BrandMarkPainter()),
        ),
      ],
    );
  }
}

class _BrandMarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..shader = const SweepGradient(
          colors: [AppColors.teal, Color(0xFF3B82F6), AppColors.lime, AppColors.teal],
        ).createShader(Rect.fromCircle(center: center, radius: radius)),
    );

    canvas.drawCircle(
      center,
      radius * 0.72,
      Paint()..color = const Color(0xFF050C16),
    );

    final arcPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = radius * 0.18
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius * 0.52),
      -0.6,
      2.4,
      false,
      arcPaint..color = AppColors.teal,
    );
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius * 0.52),
      2.0,
      2.4,
      false,
      arcPaint..color = const Color(0xFF3B82F6),
    );
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius * 0.34),
      0.8,
      2.0,
      false,
      arcPaint
        ..color = AppColors.lime
        ..strokeWidth = radius * 0.14,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
