import 'package:flutter/material.dart';

import '../app_state.dart';
import '../constants.dart';
import 'alerts_screen.dart';
import 'marketplace_screen.dart';
import 'my_listings_screen.dart';
import 'prices_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, _) {
        final isFarmer = appState.user?.role == roleFarmer;
        final pages = <Widget>[
          const PricesScreen(),
          const MarketplaceScreen(),
          if (isFarmer) const AlertsScreen(),
          if (isFarmer) const MyListingsScreen(),
        ];
        final index = _index < pages.length ? _index : 0;
        final badge = appState.triggeredCount;
        return Scaffold(
          body: IndexedStack(index: index, children: pages),
          bottomNavigationBar: NavigationBar(
            selectedIndex: index,
            onDestinationSelected: (i) => setState(() => _index = i),
            destinations: [
              const NavigationDestination(
                  icon: Icon(Icons.show_chart), label: 'Prices'),
              const NavigationDestination(
                  icon: Icon(Icons.storefront_outlined), label: 'Marketplace'),
              if (isFarmer)
                NavigationDestination(
                  icon: Badge(
                    isLabelVisible: badge > 0,
                    label: Text('$badge'),
                    child: const Icon(Icons.notifications_outlined),
                  ),
                  label: 'Alerts',
                ),
              if (isFarmer)
                const NavigationDestination(
                    icon: Icon(Icons.inventory_2_outlined),
                    label: 'My Listings'),
            ],
          ),
        );
      },
    );
  }
}