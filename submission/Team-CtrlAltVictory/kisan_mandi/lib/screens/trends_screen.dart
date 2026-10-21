import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/app_state.dart';
import '../utils/format.dart';
import '../widgets/common.dart';
import '../widgets/price_chart.dart';
import '../widgets/profit_calculator.dart';

class MarketPrice {
  final Market market;
  final double price;

  MarketPrice(this.market, this.price);
}

class TrendsScreen extends StatefulWidget {
  const TrendsScreen({
    super.key,
    this.initialCropId,
    this.initialMarketId,
    this.showAppBar = false,
  });

  final int? initialCropId;
  final int? initialMarketId;
  final bool showAppBar;

  @override
  State<TrendsScreen> createState() => _TrendsScreenState();
}

class _TrendsScreenState extends State<TrendsScreen> {
  int? selectedCropId;
  int selectedMarketId = 0;

  @override
  void initState() {
    super.initState();
    selectedCropId = widget.initialCropId;
    if (widget.initialMarketId != null) {
      selectedMarketId = widget.initialMarketId!;
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final theme = Theme.of(context);

    AppBar? appBar;
    if (widget.showAppBar) {
      appBar = AppBar(title: const Text('Trends & Profit'));
    }

    if (app.crops.isEmpty) {
      return Scaffold(
        appBar: appBar,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    int cropId = app.crops.first.id;
    if (selectedCropId != null) {
      cropId = selectedCropId!;
    }
    int? marketId;
    if (selectedMarketId != 0) {
      marketId = selectedMarketId;
    }

    final allPoints = app.series(cropId, marketId);
    List<PricePoint> points = allPoints;
    if (allPoints.length > 14) {
      points = allPoints.sublist(allPoints.length - 14);
    }

    PricePoint? minPoint;
    PricePoint? maxPoint;
    double total = 0;
    for (final p in points) {
      if (minPoint == null || p.price < minPoint.price) {
        minPoint = p;
      }
      if (maxPoint == null || p.price > maxPoint.price) {
        maxPoint = p;
      }
      total = total + p.price;
    }
    double average = 0;
    if (points.isNotEmpty) {
      average = total / points.length;
    }

    final todayPrice = app.todayPrice(cropId, marketId);
    final change = app.dailyChange(cropId, marketId);

    String marketName = 'All-market average';
    if (marketId != null) {
      marketName = app.marketById(marketId)?.name ?? '';
    }

    final List<MarketPrice> marketPrices = [];
    for (final m in app.markets) {
      final price = app.todayPrice(cropId, m.id);
      if (price != null) {
        marketPrices.add(MarketPrice(m, price));
      }
    }
    marketPrices.sort((a, b) => b.price.compareTo(a.price));

    return Scaffold(
      appBar: appBar,
      body: RefreshIndicator(
        onRefresh: () => refreshData(context),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            buildDropdowns(app, cropId),
            const SizedBox(height: 16),
            buildChartCard(
              theme: theme,
              points: points,
              marketName: marketName,
              todayPrice: todayPrice,
              change: change,
            ),
            const SizedBox(height: 8),
            if (points.isNotEmpty)
              buildStatsRow(minPoint!, maxPoint!, average, points.length),
            const SizedBox(height: 16),
            Text('Compare markets (today)', style: theme.textTheme.titleMedium),
            const SizedBox(height: 4),
            buildMarketComparison(marketPrices),
            const SizedBox(height: 16),
            ProfitCalculator(
              key: ValueKey('$cropId-$selectedMarketId'),
              basePrice: todayPrice,
              priceLabel: 'Today at $marketName',
            ),
          ],
        ),
      ),
    );
  }

  Widget buildDropdowns(AppState app, int cropId) {
    final List<DropdownMenuItem<int>> cropItems = [];
    for (final c in app.crops) {
      cropItems.add(DropdownMenuItem(value: c.id, child: Text(c.name)));
    }

    final List<DropdownMenuItem<int>> marketItems = [];
    marketItems.add(const DropdownMenuItem(value: 0, child: Text('All (avg)')));
    for (final m in app.markets) {
      marketItems.add(DropdownMenuItem(value: m.id, child: Text(m.district)));
    }

    return Row(
      children: [
        Expanded(
          child: LabeledDropdown<int>(
            label: 'Crop',
            value: cropId,
            items: cropItems,
            onChanged: (value) {
              setState(() {
                selectedCropId = value;
              });
            },
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: LabeledDropdown<int>(
            label: 'Market',
            value: selectedMarketId,
            items: marketItems,
            onChanged: (value) {
              setState(() {
                selectedMarketId = value ?? 0;
              });
            },
          ),
        ),
      ],
    );
  }

  Widget buildChartCard({
    required ThemeData theme,
    required List<PricePoint> points,
    required String marketName,
    required double? todayPrice,
    required dynamic change,
  }) {
    String todayText = '';
    if (todayPrice != null) {
      todayText = 'Today ${fmtRs(todayPrice)}';
      if (change != null) {
        todayText =
            '$todayText  (${fmtRs(change.abs, sign: true)}, ${fmtPct(change.pct)})';
      }
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Last ${points.length} days - $marketName',
              style: theme.textTheme.titleMedium,
            ),
            if (todayPrice != null)
              Text(todayText, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 12),
            PriceChart(points: points),
            const SizedBox(height: 4),
            Text(
              'Green dot = highest, red dot = lowest (Rs per maund)',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }

  Widget buildStatsRow(
    PricePoint minPoint,
    PricePoint maxPoint,
    double average,
    int dayCount,
  ) {
    return Row(
      children: [
        Expanded(
          child: StatBox(
            label: 'Min',
            value: fmtRs(minPoint.price),
            subText: fmtDate(minPoint.date),
            color: Colors.red.shade700,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: StatBox(
            label: 'Average',
            value: fmtRs(average),
            subText: '$dayCount days',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: StatBox(
            label: 'Max',
            value: fmtRs(maxPoint.price),
            subText: fmtDate(maxPoint.date),
            color: Colors.green.shade700,
          ),
        ),
      ],
    );
  }

  Widget buildMarketComparison(List<MarketPrice> marketPrices) {
    if (marketPrices.isEmpty) {
      return const Card(child: EmptyView('No market prices available.'));
    }

    final List<Widget> tiles = [];
    for (int i = 0; i < marketPrices.length; i++) {
      final item = marketPrices[i];
      final isSelected = selectedMarketId == item.market.id;

      Widget? badge;
      if (i == 0) {
        badge = Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: const Color(0xFFE8F5E9),
            borderRadius: BorderRadius.circular(4),
          ),
          child: const Text(
            'Highest • Best for sellers',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF2E7D32)),
          ),
        );
      } else if (i == marketPrices.length - 1) {
        badge = Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF3E0),
            borderRadius: BorderRadius.circular(4),
          ),
          child: const Text(
            'Lowest • Best for buyers',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFFE65100)),
          ),
        );
      }

      if (i > 0) {
        tiles.add(const Divider(height: 1, thickness: 0.8, color: Color(0xFFE5E9E4)));
      }

      tiles.add(
        InkWell(
          onTap: () {
            setState(() {
              selectedMarketId = item.market.id;
            });
          },
          child: Container(
            color: isSelected ? const Color(0xFFF0F7F0) : Colors.transparent,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            item.market.name,
                            style: TextStyle(
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                              fontSize: 14,
                              color: isSelected ? const Color(0xFF1E6F3D) : const Color(0xFF1B241B),
                            ),
                          ),
                          if (isSelected) ...[
                            const SizedBox(width: 6),
                            const Icon(Icons.check_circle, size: 14, color: Color(0xFF1E6F3D)),
                          ],
                        ],
                      ),
                      const SizedBox(height: 3),
                      if (badge != null)
                        badge
                      else
                        Text(
                          item.market.district,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF6B7A6D)),
                        ),
                    ],
                  ),
                ),
                Text(
                  fmtRs(item.price),
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    color: isSelected ? const Color(0xFF1E6F3D) : const Color(0xFF1B241B),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Card(child: Column(children: tiles));
  }
}

class StatBox extends StatelessWidget {
  const StatBox({
    super.key,
    required this.label,
    required this.value,
    required this.subText,
    this.color,
  });

  final String label;
  final String value;
  final String subText;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF6B7A6D),
              ),
            ),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: color ?? const Color(0xFF1B241B),
                ),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subText,
              style: const TextStyle(fontSize: 11, color: Color(0xFF6B7A6D)),
            ),
          ],
        ),
      ),
    );
  }
}
