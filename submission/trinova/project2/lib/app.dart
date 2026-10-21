import 'package:flutter/material.dart';

import 'app_state.dart';
import 'screens/home_shell.dart';
import 'screens/onboarding_screen.dart';

class KisanMandiApp extends StatelessWidget {
  const KisanMandiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KisanMandi',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2E7D32)),
        useMaterial3: true,
      ),
      home: ListenableBuilder(
        listenable: appState,
        builder: (context, _) {
          if (!appState.initialized) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          if (appState.user == null) return const OnboardingScreen();
          return const HomeShell();
        },
      ),
    );
  }
}