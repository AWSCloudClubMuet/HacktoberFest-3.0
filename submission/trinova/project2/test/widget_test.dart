import 'package:flutter_test/flutter_test.dart';

import 'package:project2/app.dart';

void main() {
  testWidgets('app launches setup home screen', (WidgetTester tester) async {
    await tester.pumpWidget(const KisanMandiApp());

    expect(find.text('KisanMandi'), findsWidgets);
    expect(
      find.text('Project setup is ready. Business features are not implemented yet.'),
      findsOneWidget,
    );
  });
}
