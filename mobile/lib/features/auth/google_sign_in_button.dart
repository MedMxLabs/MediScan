import 'package:flutter/material.dart';

import '../../core/theme.dart';

class GoogleSignInButton extends StatelessWidget {
  const GoogleSignInButton({
    super.key,
    required this.onPressed,
    this.loading = false,
  });

  final VoidCallback onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: loading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.white,
        backgroundColor: Colors.white.withValues(alpha: 0.06),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.25)),
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      child: loading
          ? const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.lime),
            )
          : const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _GoogleIcon(),
                SizedBox(width: 10),
                Text('Continue with Google', style: TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
    );
  }
}

class _GoogleIcon extends StatelessWidget {
  const _GoogleIcon();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _GoogleIconPainter()),
    );
  }
}

class _GoogleIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final paint = Paint()..style = PaintingStyle.fill;

    paint.color = const Color(0xFF4285F4);
    canvas.drawPath(
      Path()
        ..moveTo(w * 0.94, h * 0.51)
        ..cubicTo(w * 0.94, h * 0.47, w * 0.93, h * 0.44, w * 0.93, h * 0.41)
        ..lineTo(w * 0.5, h * 0.41)
        ..lineTo(w * 0.5, h * 0.59)
        ..lineTo(w * 0.75, h * 0.59)
        ..cubicTo(w * 0.74, h * 0.65, w * 0.7, h * 0.71, w * 0.64, h * 0.75)
        ..lineTo(w * 0.79, h * 0.87)
        ..cubicTo(w * 0.88, h * 0.79, w * 0.94, h * 0.66, w * 0.94, h * 0.51)
        ..close(),
      paint,
    );

    paint.color = const Color(0xFF34A853);
    canvas.drawPath(
      Path()
        ..moveTo(w * 0.5, h * 0.96)
        ..cubicTo(w * 0.62, h * 0.96, w * 0.73, h * 0.92, w * 0.8, h * 0.85)
        ..lineTo(w * 0.64, h * 0.75)
        ..cubicTo(w * 0.6, h * 0.78, w * 0.55, h * 0.8, w * 0.5, h * 0.8)
        ..cubicTo(w * 0.39, h * 0.8, w * 0.29, h * 0.73, w * 0.26, h * 0.62)
        ..lineTo(w * 0.09, h * 0.73)
        ..cubicTo(w * 0.17, h * 0.86, w * 0.32, h * 0.96, w * 0.5, h * 0.96)
        ..close(),
      paint,
    );

    paint.color = const Color(0xFFFBBC05);
    canvas.drawPath(
      Path()
        ..moveTo(w * 0.24, h * 0.59)
        ..cubicTo(w * 0.23, h * 0.56, w * 0.22, h * 0.53, w * 0.22, h * 0.5)
        ..cubicTo(w * 0.22, h * 0.47, w * 0.23, h * 0.44, w * 0.24, h * 0.41)
        ..lineTo(w * 0.09, h * 0.29)
        ..cubicTo(w * 0.06, h * 0.36, w * 0.04, h * 0.43, w * 0.04, h * 0.5)
        ..cubicTo(w * 0.04, h * 0.57, w * 0.06, h * 0.64, w * 0.09, h * 0.71)
        ..lineTo(w * 0.24, h * 0.59)
        ..close(),
      paint,
    );

    paint.color = const Color(0xFFEA4335);
    canvas.drawPath(
      Path()
        ..moveTo(w * 0.5, h * 0.22)
        ..cubicTo(w * 0.57, h * 0.22, w * 0.63, h * 0.25, w * 0.68, h * 0.3)
        ..lineTo(w * 0.81, h * 0.17)
        ..cubicTo(w * 0.73, h * 0.09, w * 0.62, h * 0.04, w * 0.5, h * 0.04)
        ..cubicTo(w * 0.32, h * 0.04, w * 0.17, h * 0.14, w * 0.09, h * 0.29)
        ..lineTo(w * 0.24, h * 0.41)
        ..cubicTo(w * 0.29, h * 0.31, w * 0.39, h * 0.22, w * 0.5, h * 0.22)
        ..close(),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
