import 'package:flutter_test/flutter_test.dart';
import 'package:kisan_mandi/services/profit_calc.dart';

void main() {
  test('profit at +10% price adjustment', () {
    final r = calculateProfit(
      quantity: 100,
      basePrice: 4000,
      adjustmentPct: 10,
      costPerMaund: 3200,
      otherCosts: 5000,
    );
    expect(r.sellingPrice, closeTo(4400, 0.001));
    expect(r.revenue, closeTo(440000, 0.001));
    expect(r.totalCost, closeTo(325000, 0.001));
    expect(r.profit, closeTo(115000, 0.001));
    expect(r.profitPerMaund, closeTo(1150, 0.001));
    expect(r.marginPct!, closeTo(26.136, 0.001));
    expect(r.breakEvenPrice, closeTo(3250, 0.001));
  });

  test('loss at -20% price adjustment', () {
    final r = calculateProfit(
      quantity: 50,
      basePrice: 3000,
      adjustmentPct: -20,
      costPerMaund: 2600,
      otherCosts: 0,
    );
    expect(r.sellingPrice, closeTo(2400, 0.001));
    expect(r.profit, closeTo(-10000, 0.001));
    expect(r.marginPct!, closeTo(-8.333, 0.001));
  });

  test('zero quantity does not divide by zero', () {
    final r = calculateProfit(
      quantity: 0,
      basePrice: 3000,
      adjustmentPct: 0,
      costPerMaund: 2000,
      otherCosts: 100,
    );
    expect(r.marginPct, isNull);
    expect(r.profitPerMaund, 0);
    expect(r.breakEvenPrice, 0);
  });
}
