import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'data/api.dart';
import 'data/store.dart';
import 'ui/screens/home.dart';
import 'ui/screens/onboarding.dart';
import 'ui/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  const configured = String.fromEnvironment('API_BASE_URL');
  final fallback = !kIsWeb && defaultTargetPlatform == TargetPlatform.android
      ? 'http://10.0.2.2:8080'
      : 'http://127.0.0.1:8080';
  runApp(
    KisanMandiApp(
      store: AppStore(Api(configured.isEmpty ? fallback : configured)),
    ),
  );
}

class KisanMandiApp extends StatefulWidget {
  final AppStore store;
  const KisanMandiApp({super.key, required this.store});
  @override
  State<KisanMandiApp> createState() => _KisanMandiAppState();
}

class _KisanMandiAppState extends State<KisanMandiApp> {
  late final Future<void> initialization = widget.store.initialize();
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'KisanMandi',
    theme: appTheme(),
    home: FutureBuilder<void>(
      future: initialization,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        return ListenableBuilder(
          listenable: widget.store,
          builder: (context, _) => widget.store.user == null
              ? OnboardingScreen(store: widget.store)
              : HomeScreen(
                  key: ValueKey(widget.store.user!.id),
                  store: widget.store,
                ),
        );
      },
    ),
  );
}
