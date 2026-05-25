import 'package:flutter/material.dart';
import '../../core/theme.dart';

/// Glowing shield hero matching the MedMx landing mockup.
class LandingHero extends StatelessWidget {
  const LandingHero({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size(280, 220),
            painter: _MoleculePainter(),
          ),
          Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.teal.withValues(alpha: 0.35),
                  blurRadius: 60,
                  spreadRadius: 10,
                ),
              ],
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.teal.withValues(alpha: 0.9),
                      AppColors.lime.withValues(alpha: 0.85),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.teal.withValues(alpha: 0.5),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.health_and_safety_rounded,
                  color: Colors.white,
                  size: 48,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: 72,
                height: 14,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.teal.withValues(alpha: 0.6),
                      AppColors.lime.withValues(alpha: 0.4),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(4),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.teal.withValues(alpha: 0.4),
                      blurRadius: 12,
                    ),
                  ],
                ),
              ),
              Container(
                margin: const EdgeInsets.only(top: 4),
                width: 56,
                height: 8,
                decoration: BoxDecoration(
                  color: AppColors.teal.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MoleculePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.teal.withValues(alpha: 0.12)
      ..strokeWidth = 1.2
      ..style = PaintingStyle.stroke;

    final nodes = <Offset>[
      Offset(size.width * 0.15, size.height * 0.35),
      Offset(size.width * 0.28, size.height * 0.22),
      Offset(size.width * 0.72, size.height * 0.25),
      Offset(size.width * 0.85, size.height * 0.4),
      Offset(size.width * 0.2, size.height * 0.65),
      Offset(size.width * 0.8, size.height * 0.7),
    ];

    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        if ((nodes[i] - nodes[j]).distance < size.width * 0.45) {
          canvas.drawLine(nodes[i], nodes[j], paint);
        }
      }
    }

    final dotPaint = Paint()
      ..color = AppColors.lime.withValues(alpha: 0.25)
      ..style = PaintingStyle.fill;
    for (final n in nodes) {
      canvas.drawCircle(n, 4, dotPaint);
    }

    final ringPaint = Paint()
      ..color = AppColors.teal.withValues(alpha: 0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    canvas.drawCircle(
      Offset(size.width / 2, size.height * 0.48),
      size.width * 0.38,
      ringPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class GradientText extends StatelessWidget {
  const GradientText(this.text, {super.key, required this.style, this.gradient});

  final String text;
  final TextStyle style;
  final Gradient? gradient;

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      shaderCallback: (bounds) =>
          (gradient ?? AppTheme.brandGradient).createShader(bounds),
      child: Text(text, style: style.copyWith(color: Colors.white)),
    );
  }
}
