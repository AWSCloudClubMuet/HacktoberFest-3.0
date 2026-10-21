import 'package:flutter_test/flutter_test.dart';
import 'package:kisanmandi/domain/models.dart';

void main() {
  test('market labels include both five percent boundaries', () {
    expect(marketLabel(94.99, 100), 'Below market');
    expect(marketLabel(95, 100), 'At market');
    expect(marketLabel(100, 100), 'At market');
    expect(marketLabel(105, 100), 'At market');
    expect(marketLabel(105.01, 100), 'Above market');
  });
  test('both alert conditions trigger at equality', () {
    expect(targetReached(100, 100, 'Above'), isTrue);
    expect(targetReached(100, 100, 'Below'), isTrue);
    expect(targetReached(99, 100, 'Above'), isFalse);
    expect(targetReached(101, 100, 'Below'), isFalse);
  });
  test(
    'profit and revenue-based margin including loss at minus 20 percent',
    () {
      final base = ProfitEstimate(price: 4000, quantity: 10, costPerUnit: 3500);
      expect(base.revenue, 40000);
      expect(base.cost, 35000);
      expect(base.profit, 5000);
      expect(base.margin, 12.5);
      final low = ProfitEstimate(
        price: 4000,
        quantity: 10,
        costPerUnit: 3500,
        adjustment: -.2,
      );
      expect(low.revenue, 32000);
      expect(low.profit, -3000);
      expect(low.margin, closeTo(-9.375, 1e-10));
      expect(
        ProfitEstimate(
          price: 4000,
          quantity: 10,
          costPerUnit: 3500,
          adjustment: .2,
        ).revenue,
        48000,
      );
      expect(ProfitEstimate(price: 0, quantity: 10, costPerUnit: 0).margin, 0);
    },
  );
}
