import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'data/mock_api.dart';
import 'data/seed.dart';
import 'providers/app_state.dart';
import 'screens/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  for (final b in ['users', 'gigs', 'applications', 'reviews', 'settings']) {
    await Hive.openBox(b);
  }
  await Seed.run();
  final app = AppState(MockApi());
  await app.init();
  runApp(ChangeNotifierProvider.value(value: app, child: const CampusGigApp()));
}

class CampusGigApp extends StatelessWidget {
  const CampusGigApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Campus Gig',
    debugShowCheckedModeBanner: false,
    theme: AppTheme.light,
    home: const SplashScreen(),
  );
}