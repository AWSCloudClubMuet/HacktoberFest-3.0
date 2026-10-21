import 'package:flutter/material.dart';
import '../../data/store.dart';
import '../theme.dart';
import '../widgets.dart';
import 'alerts.dart';
import 'marketplace.dart';
import 'onboarding.dart';
import 'prices.dart';

class HomeScreen extends StatefulWidget {
  final AppStore store;
  const HomeScreen({super.key, required this.store});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int index = 0;
  @override
  Widget build(BuildContext context) {
    final s = widget.store, user = widget.store.user!;
    final screens = [
      PricesScreen(store: s),
      MarketplaceScreen(store: s),
      if (user.isFarmer) AlertsScreen(store: s),
      if (user.isFarmer) MarketplaceScreen(store: s, ownOnly: true),
    ];
    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 72,
        titleSpacing: 22,
        title: const Wordmark(),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: line),
        ),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Profile & connection',
            icon: CircleAvatar(
              radius: 18,
              backgroundColor: paleGold,
              child: Text(
                user.name.characters.first.toUpperCase(),
                style: const TextStyle(
                  color: midnight,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            onSelected: (value) async {
              if (value == 'connection') {
                await showConnectionSettings(context, s);
              }
              if (value == 'switch') {
                await s.signOut();
              }
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                enabled: false,
                child: Text('${user.name} · ${user.role}'),
              ),
              const PopupMenuItem(
                value: 'connection',
                child: Text('API connection'),
              ),
              const PopupMenuItem(
                value: 'switch',
                child: Text('Change profile'),
              ),
            ],
          ),
          const SizedBox(width: 10),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 900),
          child: Column(
            children: [
              if (s.loading) const LinearProgressIndicator(minHeight: 2),
              if (s.error != null)
                Material(
                  color: const Color(0xFFFFEDD7),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 6,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${s.error}${s.refreshedAt != null ? ' Showing last refreshed data.' : ''}',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                        TextButton(
                          onPressed: s.loading ? null : s.refresh,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              Expanded(
                child: s.crops.isEmpty
                    ? Center(
                        child: s.loading
                            ? const CircularProgressIndicator()
                            : FilledButton(
                                onPressed: s.refresh,
                                child: const Text('Load market data'),
                              ),
                      )
                    : IndexedStack(index: index, children: screens),
              ),
              Container(
                width: double.infinity,
                color: parchment,
                padding: const EdgeInsets.symmetric(vertical: 7),
                child: const Text(
                  'FICTIONAL DEMO DATA · PKR / 40 KG MAUND',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: muted,
                    fontSize: 8,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        minimum: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: Center(
          heightFactor: 1,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: NavigationBar(
                selectedIndex: index,
                onDestinationSelected: (v) => setState(() => index = v),
                destinations: [
                  const NavigationDestination(
                    icon: Icon(Icons.bar_chart_outlined),
                    selectedIcon: Icon(Icons.bar_chart),
                    label: 'Prices',
                  ),
                  const NavigationDestination(
                    icon: Icon(Icons.storefront_outlined),
                    selectedIcon: Icon(Icons.storefront),
                    label: 'Marketplace',
                  ),
                  if (user.isFarmer)
                    NavigationDestination(
                      icon: Badge(
                        isLabelVisible: s.triggeredCount > 0,
                        label: Text('${s.triggeredCount}'),
                        child: const Icon(Icons.notifications_none),
                      ),
                      selectedIcon: Badge(
                        isLabelVisible: s.triggeredCount > 0,
                        label: Text('${s.triggeredCount}'),
                        child: const Icon(Icons.notifications),
                      ),
                      label: 'Alerts',
                    ),
                  if (user.isFarmer)
                    const NavigationDestination(
                      icon: Icon(Icons.inventory_2_outlined),
                      selectedIcon: Icon(Icons.inventory_2),
                      label: 'My listings',
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
