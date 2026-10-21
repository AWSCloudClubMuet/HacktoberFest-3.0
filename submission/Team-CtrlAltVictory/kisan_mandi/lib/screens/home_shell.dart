import 'package:flutter/material.dart';

import '../services/app_state.dart';
import '../widgets/common.dart';
import 'alerts_screen.dart';
import 'marketplace_screen.dart';
import 'my_listings_screen.dart';
import 'prices_screen.dart';
import 'trends_screen.dart';

class TabItem {
  final String label;
  final IconData icon;
  final Widget screen;
  final int badge;

  const TabItem(this.label, this.icon, this.screen, {this.badge = 0});
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int selectedIndex = 0;

  List<TabItem> buildTabs(AppState app) {
    final List<TabItem> tabs = [];

    tabs.add(const TabItem('Prices', Icons.show_chart, PricesScreen()));
    tabs.add(const TabItem(
        'Market', Icons.storefront_outlined, MarketplaceScreen()));

    if (app.user!.isFarmer) {
      tabs.add(const TabItem(
          'My Listings', Icons.inventory_2_outlined, MyListingsScreen()));
    }

    tabs.add(const TabItem('Trends', Icons.trending_up, TrendsScreen()));

    tabs.add(
      TabItem(
        'Alerts',
        Icons.notifications_outlined,
        const AlertsScreen(),
        badge: app.triggeredCount,
      ),
    );

    return tabs;
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);

    if (app.user == null) {
      return const SizedBox.shrink();
    }

    final tabs = buildTabs(app);

    if (selectedIndex >= tabs.length) {
      selectedIndex = 0;
    }

    return Scaffold(
      appBar: buildAppBar(app, tabs),
      body: buildBody(app, tabs),
      bottomNavigationBar: buildBottomBar(tabs),
    );
  }

  Widget buildBody(AppState app, List<TabItem> tabs) {
    if (app.crops.isEmpty && app.loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (app.crops.isEmpty && app.error != null) {
      return ErrorView(message: app.error!, onRetry: app.loadAll);
    }

    final List<Widget> screens = [];
    for (final tab in tabs) {
      screens.add(tab.screen);
    }
    return IndexedStack(index: selectedIndex, children: screens);
  }

  AppBar buildAppBar(AppState app, List<TabItem> tabs) {
    final user = app.user!;

    Widget refreshIcon = const Icon(Icons.refresh);
    if (app.loading) {
      refreshIcon = const SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(strokeWidth: 2),
      );
    }

    String roleName = 'Buyer';
    if (user.isFarmer) {
      roleName = 'Farmer';
    }

    return AppBar(
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            tabs[selectedIndex].label,
            style: const TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1B241B),
            ),
          ),
          Text(
            '${user.district} • $roleName',
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: Color(0xFF6B7A6D),
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          tooltip: 'Refresh',
          icon: refreshIcon,
          onPressed: app.loading ? null : () => refreshData(context),
        ),
        PopupMenuButton<String>(
          icon: const Icon(Icons.account_circle_outlined),
          itemBuilder: (context) {
            return [
              PopupMenuItem(
                enabled: false,
                child: Text('${user.name}\n$roleName - ${user.district}'),
              ),
              const PopupMenuItem(value: 'out', child: Text('Sign out')),
            ];
          },
          onSelected: (value) {
            if (value == 'out') {
              app.signOut();
            }
          },
        ),
      ],
    );
  }

  Widget buildBottomBar(List<TabItem> tabs) {
    final List<NavigationDestination> destinations = [];

    for (final tab in tabs) {
      destinations.add(
        NavigationDestination(
          label: tab.label,
          icon: Badge(
            isLabelVisible: tab.badge > 0,
            label: Text('${tab.badge}'),
            child: Icon(tab.icon),
          ),
        ),
      );
    }

    return NavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) {
        setState(() {
          selectedIndex = index;
        });
      },
      destinations: destinations,
    );
  }
}
