import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kisanmandi/main.dart';
import 'package:kisanmandi/ui/screens/alerts.dart';
import 'package:kisanmandi/ui/screens/marketplace.dart';
import 'package:kisanmandi/ui/screens/onboarding.dart';
import 'package:kisanmandi/ui/screens/prices.dart';
import 'package:kisanmandi/ui/screens/profit.dart';
import 'package:kisanmandi/ui/theme.dart';
import 'support.dart';

void main() {
  setUpAll(() async {
    final loader = FontLoader('Roboto');
    for (final name in ['Regular', 'Medium', 'Bold', 'Black']) {
      loader.addFont(rootBundle.load('assets/fonts/Roboto-$name.ttf'));
    }
    await loader.load();
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });
  Future<void> size(WidgetTester t, double width, {double height = 844}) async {
    t.view.devicePixelRatio = 1;
    t.view.physicalSize = Size(width, height);
    addTearDown(() {
      t.view.resetPhysicalSize();
      t.view.resetDevicePixelRatio();
    });
  }

  Future<void> shot(WidgetTester t, String name) async {
    if (!const bool.fromEnvironment('SCREENSHOTS')) return;
    await t.pumpAndSettle();
    final boundary = t.firstRenderObject<RenderRepaintBoundary>(
      find.byType(RepaintBoundary),
    );
    await t.runAsync(() async {
      final image = await boundary.toImage(pixelRatio: 2);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      await Directory('docs/screenshots').create(recursive: true);
      await File(
        'docs/screenshots/$name.png',
      ).writeAsBytes(bytes!.buffer.asUint8List());
      image.dispose();
    });
  }

  Future<void> screen(WidgetTester t, Widget w) async {
    await t.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: RepaintBoundary(child: w),
      ),
    );
    await t.pumpAndSettle();
  }

  testWidgets('farmer four tabs, buyer two tabs and refresh badge', (t) async {
    await size(t, 390);
    final s = TestStore();
    await t.pumpWidget(RepaintBoundary(child: KisanMandiApp(store: s)));
    await t.pumpAndSettle();
    expect(find.byType(NavigationDestination), findsNWidgets(4));
    expect(find.text('Your mandi, today.'), findsOneWidget);
    await shot(t, 'prices');
    await t.tap(find.text('Alerts').last);
    await t.pumpAndSettle();
    expect(find.text('1 target reached'), findsOneWidget);
    await t.tap(find.byType(Switch).first);
    await t.pumpAndSettle();
    expect(find.text('0 targets reached'), findsOneWidget);
    expect(s.calls, contains('PATCH /alerts/a1'));
    expect(
      s.calls.indexOf('GET /prices'),
      lessThan(s.calls.indexOf('GET /alerts')),
    );
    await t.pumpWidget(
      KisanMandiApp(key: UniqueKey(), store: TestStore(farmer: false)),
    );
    await t.pumpAndSettle();
    expect(find.byType(NavigationDestination), findsNWidgets(2));
    expect(find.text('My listings'), findsNothing);
  });
  testWidgets('crop search and category filtering', (t) async {
    await size(t, 390);
    await screen(t, Scaffold(body: PricesScreen(store: TestStore())));
    await t.enterText(find.byType(TextField).first, 'mango');
    await t.pumpAndSettle();
    expect(find.text('1 crops'), findsOneWidget);
    expect(find.text('Mango'), findsOneWidget);
    expect(find.text('Wheat'), findsNothing);
  });
  testWidgets('charts and market comparison sort highest first', (t) async {
    await size(t, 390);
    final s = TestStore();
    expect(s.comparison('c1').first.market.id, 'm3');
    expect(s.history('c1').length, 14);
    expect(s.dailyChange('c1'), 8);
    await screen(t, CropDetailScreen(store: s, cropId: 'c1'));
    expect(find.text('Minimum'), findsOneWidget);
    expect(find.text('Average'), findsOneWidget);
    expect(find.text('Maximum'), findsOneWidget);
    await shot(t, 'crop-detail');
    expect(t.takeException(), isNull);
  });
  testWidgets('calculator updates results and rejects invalid inputs', (
    t,
  ) async {
    await size(t, 390);
    await screen(t, ProfitScreen(store: TestStore()));
    await shot(t, 'profit');
    await t.enterText(find.byType(TextField).first, '0');
    await t.pumpAndSettle();
    expect(find.textContaining('Enter quantity > 0'), findsOneWidget);
    expect(find.text('ESTIMATED PROFIT'), findsNothing);
    await t.enterText(find.byType(TextField).first, '10');
    await t.pumpAndSettle();
    expect(find.text('ESTIMATED PROFIT'), findsOneWidget);
    expect(t.takeException(), isNull);
  });
  testWidgets('listing form validates and ownership hides foreign controls', (
    t,
  ) async {
    await size(t, 390);
    final s = TestStore();
    await screen(t, ListingDetailScreen(store: s, listingId: 'l2'));
    expect(find.text('Edit listing'), findsNothing);
    expect(find.text('Delete listing'), findsNothing);
    await screen(t, Scaffold(body: ListingForm(store: s)));
    await t.ensureVisible(find.text('Publish listing'));
    await t.tap(find.text('Publish listing'));
    await t.pumpAndSettle();
    expect(find.text('Enter a value > 0, up to 10 billion'), findsNWidgets(2));
  });
  testWidgets('marketplace and alerts fit a phone', (t) async {
    await size(t, 390);
    await screen(t, Scaffold(body: MarketplaceScreen(store: TestStore())));
    await shot(t, 'marketplace');
    expect(t.takeException(), isNull);
    await screen(t, Scaffold(body: AlertsScreen(store: TestStore())));
    await shot(t, 'alerts');
    expect(t.takeException(), isNull);
  });
  testWidgets('onboarding and narrow layouts do not overflow', (t) async {
    await size(t, 320, height: 740);
    await screen(t, OnboardingScreen(store: TestStore()));
    expect(t.takeException(), isNull);
    await screen(t, Scaffold(body: PricesScreen(store: TestStore())));
    expect(t.takeException(), isNull);
    await screen(t, Scaffold(body: AlertForm(store: TestStore())));
    expect(t.takeException(), isNull);
  });
}
