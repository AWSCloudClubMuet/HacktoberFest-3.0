import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../widgets/common.dart';
import 'activity_screen.dart';
import 'create_gig_screen.dart';
import 'home_screen.dart';
import 'profile_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _i = 0;

  @override
  Widget build(BuildContext context) => Scaffold(
    body: IndexedStack(
      index: _i,
      children: const [HomeScreen(), ActivityScreen(), ProfileScreen()],
    ),
    floatingActionButton: Pulse(
      child: FloatingActionButton.extended(
        backgroundColor: AppTheme.pink,
        foregroundColor: Colors.white,
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const CreateGigScreen()),
        ),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Post gig'),
      ),
    ),
    bottomNavigationBar: NavigationBar(
      selectedIndex: _i,
      onDestinationSelected: (v) => setState(() => _i = v),
      destinations: const [
        NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore, color: AppTheme.primary),
            label: 'Discover'),
        NavigationDestination(
            icon: Icon(Icons.work_outline),
            selectedIcon: Icon(Icons.work, color: AppTheme.primary),
            label: 'Activity'),
        NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppTheme.primary),
            label: 'Profile'),
      ],
    ),
  );
}