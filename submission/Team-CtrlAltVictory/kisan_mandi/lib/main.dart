import 'package:flutter/material.dart';

import 'screens/home_shell.dart';
import 'screens/onboarding_screen.dart';
import 'services/api_service.dart';
import 'services/app_state.dart';
import 'utils/theme.dart';
import 'widgets/brand.dart';
import 'widgets/common.dart';

void main() {
  runApp(const KisanMandiApp());
}

class KisanMandiApp extends StatefulWidget {
  const KisanMandiApp({super.key});

  @override
  State<KisanMandiApp> createState() => _KisanMandiAppState();
}

class _KisanMandiAppState extends State<KisanMandiApp> {
  final AppState appState = AppState(ApiService());

  @override
  void dispose() {
    appState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: appState,
      child: MaterialApp(
        title: 'KisanMandi',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: Bootstrap(app: appState),
      ),
    );
  }
}

class Bootstrap extends StatefulWidget {
  const Bootstrap({super.key, required this.app});

  final AppState app;

  @override
  State<Bootstrap> createState() => _BootstrapState();
}

class _BootstrapState extends State<Bootstrap> {
  bool isLoading = true;
  bool started = false; // user tapped "Get Started" on the splash
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    checkSavedLogin();
  }

  Future<void> checkSavedLogin() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      // keep the splash visible for a moment, even if the session restores fast
      final minSplash = Future<void>.delayed(const Duration(milliseconds: 2400));
      await widget.app.restoreSession();
      await minSplash;
    } on ApiException catch (e) {
      errorMessage = e.message;
    } catch (e) {
      errorMessage = 'Startup failed: $e';
    }

    if (mounted) {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const SplashScreen();
    }

    if (errorMessage != null) {
      return Scaffold(
        body: ErrorView(
          message: errorMessage!,
          onRetry: checkSavedLogin,
        ),
      );
    }

    return ListenableBuilder(
      listenable: widget.app,
      builder: (context, child) {
        if (widget.app.user == null) {
          if (!started) {
            return SplashScreen(onStart: () => setState(() => started = true));
          }
          return const OnboardingScreen();
        } else {
          return const HomeShell();
        }
      },
    );
  }
}
