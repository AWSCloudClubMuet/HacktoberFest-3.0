class ProfitResult {
  const ProfitResult({
    required this.sellingPrice,
    required this.revenue,
    required this.totalCost,
    required this.profit,
    required this.profitPerMaund,
    required this.marginPct,
    required this.breakEvenPrice,
  });
  final double sellingPrice;
  final double revenue;
  final double totalCost;
  final double profit;
  final double profitPerMaund;
  final double? marginPct;
  final double breakEvenPrice;
}

ProfitResult calculateProfit({
  required double quantity,
  required double basePrice,
  required double adjustmentPct,
  required double costPerMaund,
  required double otherCosts,
}) {
  final selling = basePrice * (1 + adjustmentPct / 100);
  final revenue = quantity * selling;
  final totalCost = quantity * costPerMaund + otherCosts;
  final profit = revenue - totalCost;
  return ProfitResult(
    sellingPrice: selling,
    revenue: revenue,
    totalCost: totalCost,
    profit: profit,
    profitPerMaund: quantity > 0 ? profit / quantity : 0,
    marginPct: revenue > 0 ? profit / revenue * 100 : null,
    breakEvenPrice: quantity > 0 ? totalCost / quantity : 0,
  );
}
