import 'package:flutter/material.dart';

// Indigo ink, uncoated paper and saffron: a small, consistent print palette.
const midnight = Color(0xFF25334B);
const parchment = Color(0xFFF6F2E9);
const paper = Color(0xFFFFFDF8);
const ink = Color(0xFF272D38);
const muted = Color(0xFF746E67);
const line = Color(0xFFE3DDD2);
const saffron = Color(0xFFF0CB78);
const rust = Color(0xFFA44835);
const positive = Color(0xFF34675A);
const paleGold = Color(0xFFF8EACB);
const paleBlue = Color(0xFFE9EDF2);

const figures = TextStyle(
  fontFamily: 'Manrope',
  fontWeight: FontWeight.w800,
  letterSpacing: -.7,
  fontFeatures: [FontFeature.tabularFigures()],
);

ThemeData appTheme() {
  final scheme = ColorScheme.fromSeed(seedColor: midnight, surface: parchment)
      .copyWith(
        primary: midnight,
        onPrimary: paper,
        secondary: rust,
        onSecondary: paper,
        onSurface: ink,
        surfaceContainerHighest: paleBlue,
        outline: muted,
        outlineVariant: line,
      );
  return ThemeData(
    fontFamily: 'Manrope',
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: parchment,
    appBarTheme: const AppBarTheme(
      backgroundColor: parchment,
      foregroundColor: midnight,
      elevation: 0,
      centerTitle: false,
      scrolledUnderElevation: 0,
      titleTextStyle: TextStyle(
        fontFamily: 'Manrope',
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: midnight,
      ),
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(
        fontFamily: 'Fraunces',
        fontSize: 43,
        fontWeight: FontWeight.w500,
        letterSpacing: -1.5,
        height: 1.04,
      ),
      headlineMedium: TextStyle(
        fontFamily: 'Fraunces',
        fontSize: 34,
        fontWeight: FontWeight.w500,
        letterSpacing: -1,
        height: 1.1,
      ),
      titleLarge: TextStyle(
        fontFamily: 'Fraunces',
        fontSize: 23,
        fontWeight: FontWeight.w500,
        letterSpacing: -.5,
        height: 1.15,
      ),
      titleMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
      bodyLarge: TextStyle(fontSize: 15, height: 1.5),
      bodyMedium: TextStyle(fontSize: 13, height: 1.5),
      bodySmall: TextStyle(fontSize: 11, height: 1.5),
      labelLarge: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
    ).apply(bodyColor: ink, displayColor: midnight),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: paper,
      labelStyle: const TextStyle(color: muted, fontSize: 13),
      hintStyle: const TextStyle(color: muted, fontSize: 13),
      prefixIconColor: midnight,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: midnight, width: 1.5),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: midnight,
        foregroundColor: paper,
        minimumSize: const Size(0, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: midnight,
        minimumSize: const Size(0, 50),
        side: const BorderSide(color: line),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: parchment,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)),
      side: BorderSide.none,
      selectedColor: midnight,
      checkmarkColor: paper,
      labelStyle: const TextStyle(
        fontFamily: 'Manrope',
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: midnight,
      surfaceTintColor: Colors.transparent,
      height: 74,
      elevation: 0,
      indicatorColor: saffron,
      indicatorShape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(
          color: states.contains(WidgetState.selected) ? midnight : paper,
          size: 21,
        ),
      ),
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => TextStyle(
          fontFamily: 'Manrope',
          fontSize: 10,
          color: states.contains(WidgetState.selected) ? saffron : paper,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    sliderTheme: const SliderThemeData(
      activeTrackColor: midnight,
      inactiveTrackColor: line,
      thumbColor: rust,
      overlayColor: Color(0x18A44835),
    ),
    badgeTheme: const BadgeThemeData(backgroundColor: rust, textColor: paper),
    dividerTheme: const DividerThemeData(color: line, space: 24),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: parchment,
      showDragHandle: true,
    ),
    snackBarTheme: const SnackBarThemeData(backgroundColor: midnight),
  );
}
