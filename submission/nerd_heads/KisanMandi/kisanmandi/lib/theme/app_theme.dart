import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color seed = Color(0xFF2E7D32);
  static const Color accent = Color(0xFFF9A825);
  static const Color danger = Color(0xFFC62828);
  static const Color surfaceTint = Color(0xFFF1F8E9);

  /// Applies Poppins to every slot of [base].
  ///
  /// (`GoogleFonts.poppinsTextTheme` cannot be used directly because
  /// google_fonts 9 targets the `material_ui` package's TextTheme, which is
  /// a different type from Flutter material's TextTheme on this SDK.)
  static TextTheme _poppins(TextTheme base) {
    TextStyle? p(TextStyle? s) =>
        s == null ? null : GoogleFonts.poppins(textStyle: s);
    return TextTheme(
      displayLarge: p(base.displayLarge),
      displayMedium: p(base.displayMedium),
      displaySmall: p(base.displaySmall),
      headlineLarge: p(base.headlineLarge),
      headlineMedium: p(base.headlineMedium),
      headlineSmall: p(base.headlineSmall),
      titleLarge: p(base.titleLarge),
      titleMedium: p(base.titleMedium),
      titleSmall: p(base.titleSmall),
      bodyLarge: p(base.bodyLarge),
      bodyMedium: p(base.bodyMedium),
      bodySmall: p(base.bodySmall),
      labelLarge: p(base.labelLarge),
      labelMedium: p(base.labelMedium),
      labelSmall: p(base.labelSmall),
    );
  }

  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: seed),
    );
    return base.copyWith(
      textTheme: _poppins(base.textTheme),
      appBarTheme: AppBarTheme(
        backgroundColor: seed,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
        clipBehavior: Clip.antiAlias,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.grey.shade100,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }
}
