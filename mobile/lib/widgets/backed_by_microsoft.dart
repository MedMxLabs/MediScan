import 'package:flutter/material.dart';

/// Pill badge matching web landing — "Backed by Microsoft".
class BackedByMicrosoftPill extends StatelessWidget {
  const BackedByMicrosoftPill({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFF0078D4).withValues(alpha: 0.35)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const _MicrosoftMark(size: 14),
          const SizedBox(width: 8),
          Text(
            'BACKED BY MICROSOFT',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
              color: const Color(0xFF0078D4),
            ),
          ),
        ],
      ),
    );
  }
}

class _MicrosoftMark extends StatelessWidget {
  const _MicrosoftMark({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    final u = size / 23;
    return SizedBox(
      width: size,
      height: size,
      child: Column(
        children: [
          Row(
            children: [
              _sq(const Color(0xFFF25022), u),
              SizedBox(width: u),
              _sq(const Color(0xFF7FBA00), u),
            ],
          ),
          SizedBox(height: u),
          Row(
            children: [
              _sq(const Color(0xFF00A4EF), u),
              SizedBox(width: u),
              _sq(const Color(0xFFFFB900), u),
            ],
          ),
        ],
      ),
    );
  }

  Widget _sq(Color c, double u) => Container(
        width: 10 * u,
        height: 10 * u,
        color: c,
      );
}
