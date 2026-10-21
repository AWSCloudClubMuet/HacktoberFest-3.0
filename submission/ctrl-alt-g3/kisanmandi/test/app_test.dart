import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kisanmandi/main.dart';
import 'package:kisanmandi/domain/models.dart';
import 'package:kisanmandi/ui/screens/alerts.dart';
import 'package:kisanmandi/ui/screens/marketplace.dart';
import 'package:kisanmandi/ui/screens/onboarding.dart';
import 'package:kisanmandi/ui/screens/prices.dart';
import 'package:kisanmandi/ui/screens/profit.dart';
import 'package:kisanmandi/ui/theme.dart';
import 'support.dart';

void main() {
  final captureKey = GlobalKey();
  setUpAll(() async {
    for (final family in ['Manrope', 'Fraunces']) {
      final loader = FontLoader(family);
      for (final weight
          in family == 'Manrope'
              ? [400, 500, 600, 700, 800]
              : [400, 500, 600]) {
        loader.addFont(rootBundle.load('assets/fonts/$family-$weight.ttf'));
      }
      await loader.load();
    }
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
    final boundary =
        captureKey.currentContext!.findRenderObject()! as RenderRepaintBoundary;
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
        home: RepaintBoundary(key: captureKey, child: w),
      ),
    );
    await t.pumpAndSettle();
  }

  testWidgets('farmer four tabs, buyer two tabs and refresh badge', (t) async {
    await size(t, 390);
    final s = TestStore();
    await t.pumpWidget(
      RepaintBoundary(
        key: captureKey,
        child: KisanMandiApp(store: s),
      ),
    );
    await t.pumpAndSettle();
    expect(find.byType(NavigationDestination), findsNWidgets(4));
    expect(find.text('The market,\nin focus.'), findsOneWidget);
    await shot(t, 'prices');
    await t.tap(find.text('Marketplace').last);
    await t.pumpAndSettle();
    await shot(t, 'marketplace');
    await t.tap(find.text('Alerts').last);
    await t.pumpAndSettle();
    await shot(t, 'alerts');
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
    expect(t.takeException(), isNull);
    await screen(t, Scaffold(body: AlertsScreen(store: TestStore())));
    expect(t.takeException(), isNull);
  });
  testWidgets('onboarding and narrow layouts do not overflow', (t) async {
    await size(t, 320, height: 740);
    await screen(t, OnboardingScreen(store: TestStore()));
    await shot(t, 'onboarding');
    expect(t.takeException(), isNull);
    await screen(t, Scaffold(body: PricesScreen(store: TestStore())));
    expect(t.takeException(), isNull);
    await screen(t, Scaffold(body: AlertForm(store: TestStore())));
    expect(t.takeException(), isNull);
  });
  testWidgets('all feature screens fit a narrow phone and a wide window', (
    t,
  ) async {
    final s = TestStore();
    for (final width in [320.0, 900.0]) {
      t.view.devicePixelRatio = 1;
      t.view.physicalSize = Size(width, 844);
      for (final page in <Widget>[
        KisanMandiApp(key: UniqueKey(), store: s),
        Scaffold(body: MarketplaceScreen(store: s)),
        Scaffold(body: AlertsScreen(store: s)),
        ProfitScreen(store: s),
        CropDetailScreen(store: s, cropId: 'c1'),
        ListingDetailScreen(store: s, listingId: 'l2'),
      ]) {
        if (page is KisanMandiApp) {
          await t.pumpWidget(page);
          await t.pumpAndSettle();
        } else {
          await screen(t, page);
        }
        expect(
          t.takeException(),
          isNull,
          reason: '${page.runtimeType} at $width px',
        );
      }
    }
    t.view.resetPhysicalSize();
    t.view.resetDevicePixelRatio();
  });

  testWidgets('market pulse follows the selected market and price refresh', (
    t,
  ) async {
    await size(t, 390);
    final s = TestStore();
    final last = s.latest('c1', 'm2')!;
    s.prices = [
      for (final p in s.prices)
        if (p.id == last.id)
          Price.fromJson({
            'id': p.id,
            'crop_id': p.cropId,
            'market_id': p.marketId,
            'date': p.date,
            'price': p.price - 100,
          })
        else
          p,
    ];
    await t.pumpWidget(KisanMandiApp(store: s));
    await t.pumpAndSettle();
    expect(find.text('8 rising'), findsOneWidget);
    await t.tap(find.byType(DropdownButtonFormField<String>));
    await t.pumpAndSettle();
    await t.tap(find.text('Sukkur Mandi').last);
    await t.pumpAndSettle();
    expect(s.marketId, 'm2');
    expect(find.text('7 rising'), findsOneWidget);
    expect(find.text('1 falling'), findsOneWidget);
    await s.refresh();
    await t.pumpAndSettle();
    expect(find.text('8 rising'), findsOneWidget);
    expect(find.text('0 falling'), findsOneWidget);
    expect(t.takeException(), isNull);
  });
  testWidgets('larger system text preserves phone layouts', (t) async {
    await size(t, 390);
    t.platformDispatcher.textScaleFactorTestValue = 1.3;
    addTearDown(t.platformDispatcher.clearTextScaleFactorTestValue);
    final s = TestStore();
    for (final page in <Widget>[
      OnboardingScreen(store: s),
      Scaffold(body: PricesScreen(store: s)),
      Scaffold(body: MarketplaceScreen(store: s)),
      Scaffold(body: AlertsScreen(store: s)),
      ProfitScreen(store: s),
      CropDetailScreen(store: s, cropId: 'c1'),
    ]) {
      await screen(t, page);
      expect(
        t.takeException(),
        isNull,
        reason: '${page.runtimeType} with larger text',
      );
    }
  });
}
