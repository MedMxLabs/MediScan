import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const navy = Color(0xFF0A192F);
  static const navyLight = Color(0xFF132F4C);
  static const darkBg = Color(0xFF050C16);
  static const cardDark = Color(0xFF16212A);
  static const cardDarkAlt = Color(0xFF1A2332);
  static const inputDark = Color(0xFF1E293B);
  static const lightBg = Color(0xFFF1F5F9);
  static const lightCard = Color(0xFFFFFFFF);
  static const lightInput = Color(0xFFE2E8F0);
  static const lightText = Color(0xFF0F172A);
  static const lightMuted = Color(0xFF64748B);
  static const teal = Color(0xFF00A896);
  static const lime = Color(0xFF84CC16);
  static const limeBright = Color(0xFFA3E635);
  static const textMuted = Color(0xFF94A3B8);
  static const red = Color(0xFFEF4444);
  static const amber = Color(0xFFFBBF24);
  static const border = Color(0xFF2D3748);
  static const borderLight = Color(0xFFE2E8F0);
}

class AppTheme {
  static LinearGradient brandGradient = const LinearGradient(
    colors: [AppColors.teal, AppColors.lime],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static LinearGradient headerGradient = const LinearGradient(
    colors: [AppColors.limeBright, AppColors.teal, AppColors.navyLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static BoxDecoration darkBgDecoration = const BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [AppColors.darkBg, AppColors.navy, Color(0xFF0A192F)],
    ),
  );

  static BoxDecoration lightBgDecoration = const BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [Color(0xFFF8FAFC), AppColors.lightBg, Color(0xFFE2E8F0)],
    ),
  );

  static BoxDecoration scaffoldDecoration(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? darkBgDecoration
        : lightBgDecoration;
  }

  static Color cardColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? AppColors.cardDark
        : AppColors.lightCard;
  }

  static Color primaryText(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? Colors.white
        : AppColors.lightText;
  }

  static Color mutedText(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? AppColors.textMuted
        : AppColors.lightMuted;
  }

  static ThemeData dark() => _build(Brightness.dark);

  static ThemeData light() => _build(Brightness.light);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: isDark
          ? const ColorScheme.dark(
              primary: AppColors.teal,
              secondary: AppColors.lime,
              surface: AppColors.cardDark,
              onSurface: Colors.white,
            )
          : ColorScheme.light(
              primary: AppColors.teal,
              secondary: AppColors.lime,
              surface: AppColors.lightCard,
              onSurface: AppColors.lightText,
            ),
      scaffoldBackgroundColor: isDark ? AppColors.darkBg : AppColors.lightBg,
    );

    return base.copyWith(
      textTheme: GoogleFonts.plusJakartaSansTextTheme(base.textTheme).apply(
        bodyColor: isDark ? Colors.white : AppColors.lightText,
        displayColor: isDark ? Colors.white : AppColors.lightText,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: isDark ? Colors.white : AppColors.lightText,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: isDark ? Colors.white : AppColors.lightText,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? AppColors.inputDark : AppColors.lightInput,
        hintStyle: TextStyle(
          color: isDark ? AppColors.textMuted : AppColors.lightMuted,
        ),
        labelStyle: TextStyle(
          color: isDark ? AppColors.textMuted : AppColors.lightMuted,
        ),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: isDark ? AppColors.border : AppColors.borderLight,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.teal, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.teal,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(28),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: isDark ? 0 : 1,
        color: isDark ? AppColors.cardDark : AppColors.lightCard,
        shadowColor: isDark ? Colors.transparent : Colors.black12,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isDark ? AppColors.border : AppColors.borderLight,
            width: 0.5,
          ),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: isDark ? AppColors.border : AppColors.borderLight,
        thickness: 0.5,
      ),
      drawerTheme: DrawerThemeData(
        backgroundColor: isDark ? AppColors.darkBg : AppColors.lightCard,
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: isDark ? AppColors.cardDark : AppColors.lightCard,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: isDark ? AppColors.cardDarkAlt : AppColors.lightText,
        contentTextStyle: TextStyle(
          color: isDark ? Colors.white : Colors.white,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
