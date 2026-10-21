import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppTheme {
  static const primary = Color(0xFF6C4DFF);
  static const pink = Color(0xFFFF4D8D);
  static const orange = Color(0xFFFF9F43);
  static const teal = Color(0xFF00C9A7);
  static const blue = Color(0xFF3FA9F5);

  static const gradient = LinearGradient(
    colors: [Color(0xFF6C4DFF), Color(0xFFFF4D8D)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const splashGradient = LinearGradient(
    colors: [Color(0xFF6C4DFF), Color(0xFFFF4D8D), Color(0xFFFF9F43)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient _g(Color a, Color b) =>
      LinearGradient(colors: [a, b], begin: Alignment.topLeft, end: Alignment.bottomRight);

  static LinearGradient catGradient(String c) {
    switch (c) {
      case 'Programming':
        return _g(blue, primary);
      case 'Design':
        return _g(pink, orange);
      case 'Writing':
        return _g(teal, blue);
      default:
        return _g(orange, const Color(0xFFFFC93C));
    }
  }

  static IconData catIcon(String c) {
    switch (c) {
      case 'Programming':
        return Icons.code_rounded;
      case 'Design':
        return Icons.palette_rounded;
      case 'Writing':
        return Icons.edit_note_rounded;
      default:
        return Icons.school_rounded;
    }
  }

  static ThemeData get light => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: primary),
    scaffoldBackgroundColor: const Color(0xFFF3F0FF),
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: ZoomPageTransitionsBuilder(),
      TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
    }),
    appBarTheme: const AppBarTheme(
      backgroundColor: primary,
      foregroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      systemOverlayStyle: SystemUiOverlayStyle.light,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: primary.withAlpha(40),
      elevation: 8,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: primary,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
    ),
  );
}