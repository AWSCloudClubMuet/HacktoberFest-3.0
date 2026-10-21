import 'package:flutter/material.dart';
import 'common.dart';
import 'screens/dashboard_screen.dart';
import 'screens/camps_screen.dart';
import 'screens/inventory_screen.dart';
import 'screens/dispatches_screen.dart';
import 'screens/donations_screen.dart';
import 'screens/volunteers_screen.dart';

void main() => runApp(const App());

class App extends StatelessWidget {
  const App({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Flood Relief Sindh',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      colorSchemeSeed: const Color(0xFF00796B),
      useMaterial3: true,
      scaffoldBackgroundColor: const Color(0xFFF1F7F6),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
      dialogTheme: DialogThemeData(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24))),
    ),
    home: const Home(),
  );
}

class Home extends StatefulWidget {
  const Home({super.key});
  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  int i = 0;
  static const titles = ['Dashboard', 'Camps', 'Inventory', 'Dispatches', 'Donations', 'Volunteers'];
  static const icons = [
    Icons.dashboard_rounded, Icons.home_work_rounded, Icons.inventory_2_rounded,
    Icons.local_shipping_rounded, Icons.volunteer_activism_rounded, Icons.groups_rounded
  ];

  Widget page() => switch (i) {
    0 => const DashboardScreen(),
    1 => const CampsScreen(),
    2 => const InventoryScreen(),
    3 => const DispatchesScreen(),
    4 => const DonationsScreen(),
    _ => const VolunteersScreen(),
  };

  static const grad = LinearGradient(
      colors: [Color(0xFF004D40), Color(0xFF26A69A)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight);

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<bool>(
    valueListenable: isAdmin,
    builder: (_, admin, __) => Scaffold(
      appBar: AppBar(
        foregroundColor: Colors.white,
        backgroundColor: const Color(0xFF00695C),
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
        title: Text(titles[i], style: const TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          Text(admin ? 'Coordinator' : 'Volunteer',
              style: const TextStyle(fontSize: 12, color: Colors.white)),
          Switch(
              value: admin,
              activeColor: Colors.white,
              onChanged: (v) => isAdmin.value = v),
          const SizedBox(width: 4),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          top: false,
          child: Column(children: [
            Container(
              width: double.infinity,
              padding: EdgeInsets.fromLTRB(
                  20, MediaQuery.of(context).padding.top + 28, 20, 24),
              decoration: const BoxDecoration(gradient: grad),
              child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Icon(Icons.water_drop_rounded, color: Colors.white, size: 40),
                SizedBox(height: 10),
                Text('Sindh Flood Relief',
                    style: TextStyle(
                        color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                Text('One shared view for every camp',
                    style: TextStyle(color: Colors.white70)),
              ]),
            ),
            Expanded(
              child: ListView(padding: const EdgeInsets.all(8), children: [
                for (var k = 0; k < titles.length; k++)
                  ListTile(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    leading: Icon(icons[k]),
                    title: Text(titles[k]),
                    selected: k == i,
                    selectedTileColor: Colors.teal.withOpacity(.12),
                    onTap: () {
                      setState(() => i = k);
                      Navigator.pop(context);
                    },
                  ),
              ]),
            ),
          ]),
        ),
      ),
      // SafeArea keeps content above Android's navigation buttons
      body: SafeArea(
        top: false,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 350),
          transitionBuilder: (child, anim) => FadeTransition(
            opacity: anim,
            child: SlideTransition(
              position: Tween<Offset>(begin: const Offset(.06, 0), end: Offset.zero)
                  .animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic)),
              child: child,
            ),
          ),
          child: KeyedSubtree(key: ValueKey('$i$admin'), child: page()),
        ),
      ),
    ),
  );
}