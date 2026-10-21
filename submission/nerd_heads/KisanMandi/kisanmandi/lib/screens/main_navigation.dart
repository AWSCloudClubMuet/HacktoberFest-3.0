import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import 'alerts_screen.dart';
import 'marketplace_screen.dart';
import 'my_listings_screen.dart';
import 'prices_screen.dart';
import 'profit_calculator_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final isFarmer = state.user?.isFarmer ?? true;
    final triggered = state.triggeredCount;

    final tabs = isFarmer
        ? const [
            PricesScreen(),
            MarketplaceScreen(),
            AlertsScreen(),
            MyListingsScreen(),
            ProfitCalculatorScreen(),
          ]
        : const [
            PricesScreen(),
            MarketplaceScreen(),
          ];

    final safeIndex = _index.clamp(0, tabs.length - 1);

    final destinations = isFarmer
        ? [
            const NavigationDestination(
                icon: Icon(Icons.show_chart), label: 'Prices'),
            const NavigationDestination(
                icon: Icon(Icons.storefront), label: 'Market'),
            NavigationDestination(
              icon: triggered > 0
                  ? Badge(
                      label: Text('$triggered'),
                      child: const Icon(Icons.notifications_active),
                    )
                  : const Icon(Icons.notifications_none),
              label: 'Alerts',
            ),
            const NavigationDestination(
                icon: Icon(Icons.inventory_2_outlined),
                label: 'My Listings'),
            const NavigationDestination(
                icon: Icon(Icons.calculate_outlined), label: 'Calculator'),
          ]
        : const [
            NavigationDestination(
                icon: Icon(Icons.show_chart), label: 'Prices'),
            NavigationDestination(
                icon: Icon(Icons.storefront), label: 'Market'),
          ];

    return Scaffold(
      body: IndexedStack(index: safeIndex, children: tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: safeIndex,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: destinations,
      ),
    );
  }
}
