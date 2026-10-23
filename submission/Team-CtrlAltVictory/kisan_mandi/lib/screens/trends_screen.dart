import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/app_state.dart';
import '../utils/constants.dart';
import '../utils/format.dart';
import '../utils/theme.dart';
import '../widgets/common.dart';
import '../widgets/price_chart.dart';
import '../widgets/profit_calculator.dart';

const Map<String, Map<String, int>> _districtDistances = {
  'Hyderabad': {'Hyderabad': 0, 'Sukkur': 320, 'Mirpurkhas': 75},
  'Sukkur': {'Hyderabad': 320, 'Sukkur': 0, 'Mirpurkhas': 350},
  'Mirpurkhas': {'Hyderabad': 75, 'Sukkur': 350, 'Mirpurkhas': 0},
  'Larkana': {'Hyderabad': 310, 'Sukkur': 85, 'Mirpurkhas': 375},
  'Karachi': {'Hyderabad': 160, 'Sukkur': 470, 'Mirpurkhas': 230},
};

class MarketPrice {
  final Market market;
  final double price;
  final int distance;
  final double freight;
  final double netPrice;

  MarketPrice({
    required this.market,
    required this.price,
    required this.distance,
    required this.freight,
    required this.netPrice,
  });
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
  String? originDistrict;
  bool deductFreight = true;
  double freightPer100Km = 35.0;

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
      appBar = AppBar(
        title: const Text('Trends & Profit'),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppColors.heroGradient),
        ),
        backgroundColor: Colors.transparent,
      );
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

    final String userOrigin =
        originDistrict ?? app.user?.district ?? kDistricts.first;

    final List<MarketPrice> marketPrices = [];
    for (final m in app.markets) {
      final price = app.todayPrice(cropId, m.id);
      if (price != null) {
        final dist = _districtDistances[userOrigin]?[m.district] ?? 0;
        final freight = deductFreight
            ? (dist * freightPer100Km / 100).roundToDouble()
            : 0.0;
        final net = price - freight;
        marketPrices.add(MarketPrice(
          market: m,
          price: price,
          distance: dist,
          freight: freight,
          netPrice: net,
        ));
      }
    }
    marketPrices.sort((a, b) => b.netPrice.compareTo(a.netPrice));

    return Scaffold(
      appBar: appBar,
      body: RefreshIndicator(
        onRefresh: () => refreshData(context),
        color: AppColors.green,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 24),
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
            Row(
              children: [
                Expanded(
                  child: const Text('Compare markets (today)',
                      style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink)),
                ),
                PillChip(
                  icon: Icons.local_shipping_outlined,
                  label: 'Freight',
                  selected: deductFreight,
                  onTap: () {
                    setState(() {
                      deductFreight = !deductFreight;
                    });
                  },
                ),
              ],
            ),
            const SizedBox(height: 6),
            buildMarketComparison(marketPrices, userOrigin),
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
      final local = getCropLocalName(c.name);
      final label = local.isNotEmpty ? '${c.name} ($local)' : c.name;
      cropItems.add(DropdownMenuItem(value: c.id, child: Text(label)));
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
    final bool up = change != null && change.abs > 0;
    final bool down = change != null && change.abs < 0;
    final Color pillFg =
        up ? AppColors.up : (down ? AppColors.down : AppColors.muted);
    final Color pillBg =
        up ? AppColors.upSoft : (down ? AppColors.downSoft : AppColors.bg);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: AppColors.line),
        boxShadow: AppShadows.soft,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Last ${points.length} days • $marketName',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.muted,
            ),
          ),
          const SizedBox(height: 6),
          if (todayPrice != null)
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  fmtRs(todayPrice),
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: AppColors.ink,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(width: 10),
                if (change != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: pillBg,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${fmtRs(change.abs, sign: true)} (${fmtPct(change.pct)})',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: pillFg,
                      ),
                    ),
                  ),
              ],
            )
          else
            const Text('No price today',
                style: TextStyle(color: AppColors.muted)),
          const SizedBox(height: 14),
          PriceChart(points: points),
          const SizedBox(height: 6),
          const Text(
            'Green dot = highest, red dot = lowest (Rs per maund)',
            style: TextStyle(fontSize: 11.5, color: AppColors.muted),
          ),
        ],
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
            color: AppColors.down,
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
            color: AppColors.up,
          ),
        ),
      ],
    );
  }

  Widget buildMarketComparison(
      List<MarketPrice> marketPrices, String userOrigin) {
    if (marketPrices.isEmpty) {
      return const Card(child: EmptyView('No market prices available.'));
    }

    final List<Widget> tiles = [];

    if (deductFreight) {
      tiles.add(
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: const BoxDecoration(
            color: AppColors.bg,
            borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
          ),
          child: Row(
            children: [
              const Icon(Icons.local_shipping_outlined,
                  size: 15, color: AppColors.body),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'From $userOrigin (~Rs ${freightPer100Km.round()}/100km per maund)',
                  style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.body,
                      fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              PopupMenuButton<String>(
                tooltip: 'Change origin district',
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Change',
                        style: TextStyle(
                            fontSize: 12,
                            color: AppColors.green,
                            fontWeight: FontWeight.w600)),
                    Icon(Icons.arrow_drop_down,
                        size: 16, color: AppColors.green),
                  ],
                ),
                onSelected: (dist) {
                  setState(() {
                    originDistrict = dist;
                  });
                },
                itemBuilder: (context) => [
                  for (final dist in kDistricts)
                    PopupMenuItem(value: dist, child: Text(dist)),
                ],
              ),
            ],
          ),
        ),
      );
      tiles.add(
          const Divider(height: 1, thickness: 0.8, color: AppColors.line));
    }

    for (int i = 0; i < marketPrices.length; i++) {
      final item = marketPrices[i];
      final isSelected = selectedMarketId == item.market.id;

      Widget? badge;
      if (i == 0) {
        badge = Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.greenSoft,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            deductFreight
                ? 'Best Net Realization'
                : 'Highest • Best for sellers',
            style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.green),
          ),
        );
      } else if (i == marketPrices.length - 1) {
        badge = Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.goldSoft,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            deductFreight ? 'Lowest Net' : 'Lowest • Best for buyers',
            style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.goldDark),
          ),
        );
      }

      if (i > 0 || deductFreight) {
        tiles.add(
            const Divider(height: 1, thickness: 0.8, color: AppColors.line));
      }

      final subtitleText = deductFreight
          ? (item.distance == 0
              ? '${item.market.district} • Local mandi (Rs 0 freight)'
              : '${item.market.district} • ${item.distance} km (freight: -${fmtRs(item.freight)})')
          : item.market.district;

      tiles.add(
        InkWell(
          onTap: () {
            setState(() {
              selectedMarketId = item.market.id;
            });
          },
          child: Container(
            color: isSelected ? AppColors.greenSoft : Colors.transparent,
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
                              fontWeight:
                                  isSelected ? FontWeight.w700 : FontWeight.w600,
                              fontSize: 14,
                              color: isSelected
                                  ? AppColors.green
                                  : AppColors.ink,
                            ),
                          ),
                          if (isSelected) ...[
                            const SizedBox(width: 6),
                            const Icon(Icons.check_circle,
                                size: 14, color: AppColors.green),
                          ],
                        ],
                      ),
                      const SizedBox(height: 3),
                      if (badge != null) ...[
                        badge,
                        const SizedBox(height: 3),
                      ],
                      Text(
                        subtitleText,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.muted),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      fmtRs(deductFreight ? item.netPrice : item.price),
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: isSelected
                            ? AppColors.green
                            : AppColors.ink,
                      ),
                    ),
                    Text(
                      deductFreight
                          ? 'net / maund'
                          : (item.market.district == userOrigin
                              ? 'local / maund'
                              : 'gross / maund'),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: deductFreight
                            ? AppColors.green
                            : AppColors.muted,
                      ),
                    ),
                  ],
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
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.muted,
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
                  color: color ?? AppColors.ink,
                ),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subText,
              style: const TextStyle(fontSize: 11, color: AppColors.muted),
            ),
          ],
        ),
      ),
    );
  }
}
