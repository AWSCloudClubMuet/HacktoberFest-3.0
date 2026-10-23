import 'package:flutter/material.dart';

import '../services/app_state.dart';
import '../utils/theme.dart';
import '../widgets/brand.dart';
import '../widgets/common.dart';
import 'alerts_screen.dart';
import 'marketplace_screen.dart';
import 'my_listings_screen.dart';
import 'prices_screen.dart';
import 'trends_screen.dart';

class TabItem {
  final String label;
  final String title;
  final String tagline;
  final IconData icon;
  final IconData activeIcon;
  final Widget screen;
  final int badge;

  const TabItem(
    this.label,
    this.title,
    this.tagline,
    this.icon,
    this.activeIcon,
    this.screen, {
    this.badge = 0,
  });
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

    tabs.add(const TabItem(
      'Prices',
      'Mandi Rates',
      'Live crop prices across Sindh markets',
      Icons.show_chart_rounded,
      Icons.show_chart_rounded,
      PricesScreen(),
    ));
    tabs.add(const TabItem(
      'Market',
      'Marketplace',
      'Buy fresh produce straight from farmers',
      Icons.storefront_outlined,
      Icons.storefront_rounded,
      MarketplaceScreen(),
    ));

    if (app.user!.isFarmer) {
      tabs.add(const TabItem(
        'Listings',
        'My Listings',
        'Manage the produce you are selling',
        Icons.inventory_2_outlined,
        Icons.inventory_2_rounded,
        MyListingsScreen(),
      ));
    }

    tabs.add(const TabItem(
      'Trends',
      'Trends & Profit',
      'Price history, best market and profit calculator',
      Icons.trending_up_rounded,
      Icons.trending_up_rounded,
      TrendsScreen(),
    ));

    tabs.add(
      TabItem(
        'Alerts',
        'Price Alerts',
        'Get notified when your target price is hit',
        Icons.notifications_none_rounded,
        Icons.notifications_rounded,
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
      body: Column(
        children: [
          buildHeader(app, tabs),
          Expanded(child: buildBody(app, tabs)),
        ],
      ),
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

  Widget buildHeader(AppState app, List<TabItem> tabs) {
    final user = app.user!;
    final tab = tabs[selectedIndex];
    final roleName = user.isFarmer ? 'Farmer' : 'Buyer';
    final firstName = user.name.trim().split(' ').first;

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
      ),
      child: Stack(
        children: [
          // decorative gold ring
          Positioned(
            right: -38,
            top: -44,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.22), width: 22),
              ),
            ),
          ),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 10, 12, 22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const LogoBadge(size: 42),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hello, $firstName',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Icon(Icons.place_rounded,
                                    size: 13,
                                    color: Colors.white.withValues(alpha: 0.75)),
                                const SizedBox(width: 3),
                                Flexible(
                                  child: Text(
                                    '${user.district} • $roleName',
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.78),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: 'Refresh',
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white.withValues(alpha: 0.14),
                        ),
                        icon: app.loading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.refresh_rounded,
                                color: Colors.white),
                        onPressed:
                            app.loading ? null : () => refreshData(context),
                      ),
                      const SizedBox(width: 4),
                      buildProfileMenu(app, roleName),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text(
                    tab.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 25,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.4,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    tab.tagline,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.82),
                      fontSize: 13,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildProfileMenu(AppState app, String roleName) {
    final user = app.user!;
    final initial = user.name.trim().isEmpty
        ? '?'
        : user.name.trim().substring(0, 1).toUpperCase();

    return PopupMenuButton<String>(
      tooltip: 'Account',
      offset: const Offset(0, 48),
      child: Container(
        width: 42,
        height: 42,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: AppColors.goldGradient,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
        ),
        child: Text(
          initial,
          style: const TextStyle(
            color: AppColors.greenDeep,
            fontWeight: FontWeight.w900,
            fontSize: 17,
          ),
        ),
      ),
      itemBuilder: (context) {
        return [
          PopupMenuItem(
            enabled: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${user.phone} • $roleName (${user.district})',
                  style: const TextStyle(fontSize: 12, color: AppColors.muted),
                ),
              ],
            ),
          ),
          const PopupMenuDivider(),
          const PopupMenuItem(
            value: 'out',
            child: Row(
              children: [
                Icon(Icons.logout_rounded, size: 18, color: AppColors.down),
                SizedBox(width: 10),
                Text(
                  'Sign out',
                  style: TextStyle(
                    color: AppColors.down,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ];
      },
      onSelected: (value) {
        if (value == 'out') {
          app.signOut();
        }
      },
    );
  }

  Widget buildBottomBar(List<TabItem> tabs) {
    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 6, 16, 12),
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: AppColors.greenDeep,
          borderRadius: BorderRadius.circular(30),
          boxShadow: AppShadows.lift,
        ),
        child: Row(
          children: [
            for (var i = 0; i < tabs.length; i++)
              Expanded(child: buildNavItem(tabs[i], i)),
          ],
        ),
      ),
    );
  }

  Widget buildNavItem(TabItem tab, int index) {
    final selected = index == selectedIndex;

    Widget icon = Icon(
      selected ? tab.activeIcon : tab.icon,
      size: 24,
      color: selected ? AppColors.greenDeep : Colors.white70,
    );
    if (tab.badge > 0) {
      icon = Badge(
        backgroundColor: AppColors.down,
        label: Text('${tab.badge}'),
        child: icon,
      );
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => setState(() => selectedIndex = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.gold : Colors.transparent,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            icon,
            const SizedBox(height: 3),
            Text(
              tab.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                color: selected ? AppColors.greenDeep : Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
