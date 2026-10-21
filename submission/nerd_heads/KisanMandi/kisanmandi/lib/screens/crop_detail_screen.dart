import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/market_models.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/format.dart';

class CropDetailScreen extends StatefulWidget {
  final String cropId;
  const CropDetailScreen({super.key, required this.cropId});

  @override
  State<CropDetailScreen> createState() => _CropDetailScreenState();
}

class _CropDetailScreenState extends State<CropDetailScreen> {
  List<Price> _history = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final history = await context.read<AppState>().loadHistory(widget.cropId);
    if (mounted) {
      setState(() {
        _history = history;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final crop = state.cropById(widget.cropId);
    final market = state.selectedMarket;

    return Scaffold(
      appBar: AppBar(title: Text(crop?.name ?? 'Crop')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    '${crop?.name ?? ''} · ${market.name}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  _MetricsHeader(history: _history),
                  const SizedBox(height: 20),
                  Text('14-day price trend',
                      style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 8),
                  _PriceChart(history: _history),
                  const SizedBox(height: 24),
                  Text('Market comparison — today',
                      style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 8),
                  _MarketComparisonTable(cropId: widget.cropId),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }
}

class _MetricsHeader extends StatelessWidget {
  final List<Price> history;
  const _MetricsHeader({required this.history});

  @override
  Widget build(BuildContext context) {
    double? min, max, avg;
    if (history.isNotEmpty) {
      final last14 = history.length > 14
          ? history.sublist(history.length - 14)
          : history;
      min = last14.map((p) => p.price).reduce((a, b) => a < b ? a : b);
      max = last14.map((p) => p.price).reduce((a, b) => a > b ? a : b);
      avg = last14.map((p) => p.price).reduce((a, b) => a + b) /
          last14.length;
    }
    return Row(
      children: [
        Expanded(child: _MetricCard(label: 'Min', value: min, color: Colors.blue)),
        const SizedBox(width: 8),
        Expanded(
            child:
                _MetricCard(label: 'Max', value: max, color: Colors.orange)),
        const SizedBox(width: 8),
        Expanded(
            child: _MetricCard(
                label: 'Avg', value: avg, color: AppTheme.seed)),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final double? value;
  final Color color;
  const _MetricCard(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 11.5, color: color, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(
            value == null ? '—' : formatRupees(value!),
            style: TextStyle(
                fontSize: 14.5, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }
}

class _PriceChart extends StatelessWidget {
  final List<Price> history;
  const _PriceChart({required this.history});

  @override
  Widget build(BuildContext context) {
    if (history.length < 2) {
      return Container(
        height: 220,
        alignment: Alignment.center,
        child: const Text('Not enough price history'),
      );
    }
    final last14 = history.length > 14
        ? history.sublist(history.length - 14)
        : history;
    final spots = <FlSpot>[
      for (var i = 0; i < last14.length; i++)
        FlSpot(i.toDouble(), last14[i].price),
    ];
    final prices = last14.map((p) => p.price).toList();
    final minP = prices.reduce((a, b) => a < b ? a : b);
    final maxP = prices.reduce((a, b) => a > b ? a : b);
    final padding = (maxP - minP) * 0.15 == 0
        ? maxP * 0.05 + 1
        : (maxP - minP) * 0.15;

    return Container(
      height: 240,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: LineChart(
        LineChartData(
          minY: minP - padding,
          maxY: maxP + padding,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (v) => FlLine(
              color: Colors.grey.shade300,
              strokeWidth: 0.8,
            ),
          ),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            topTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 54,
                getTitlesWidget: (value, meta) => Text(
                  formatRupees(value),
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
              ),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: (last14.length / 5).ceilToDouble().clamp(1, 7),
                getTitlesWidget: (value, meta) {
                  final i = value.round();
                  if (i < 0 || i >= last14.length) {
                    return const SizedBox.shrink();
                  }
                  return Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      formatDateShort(last14[i].date),
                      style:
                          const TextStyle(fontSize: 9.5, color: Colors.grey),
                    ),
                  );
                },
              ),
            ),
          ),
          lineTouchData: LineTouchData(
            enabled: true,
            touchTooltipData: LineTouchTooltipData(
              getTooltipItems: (touchedSpots) {
                return touchedSpots.map((spot) {
                  final i = spot.x.round();
                  final date = i >= 0 && i < last14.length
                      ? formatDateShort(last14[i].date)
                      : '';
                  return LineTooltipItem(
                    '${formatRupees(spot.y)}\n$date',
                    const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                  );
                }).toList();
              },
            ),
          ),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              preventCurveOverShooting: true,
              barWidth: 3,
              color: AppTheme.seed,
              dotData: FlDotData(
                show: true,
                getDotPainter: (spot, percent, bar, index) =>
                    FlDotCirclePainter(
                  radius: 2.5,
                  color: AppTheme.seed,
                  strokeWidth: 0,
                ),
              ),
              belowBarData: BarAreaData(
                show: true,
                color: AppTheme.seed.withValues(alpha: 0.12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MarketComparisonTable extends StatelessWidget {
  final String cropId;
  const _MarketComparisonTable({required this.cropId});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    if (state.markets.isEmpty) return const SizedBox.shrink();

    double? best;
    for (final m in state.markets) {
      final p = state.todayPriceValue(cropId, marketId: m.id);
      if (p != null && (best == null || p > best)) best = p;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Column(
          children: [
            for (final m in state.markets)
              Builder(builder: (context) {
                final p = state.todayPriceValue(cropId, marketId: m.id);
                final isBest = best != null && p == best && p != null;
                return Container(
                  color: isBest ? Colors.green.shade50 : null,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          m.name,
                          style: TextStyle(
                            fontWeight:
                                isBest ? FontWeight.w700 : FontWeight.w500,
                          ),
                        ),
                      ),
                      Text(
                        p == null ? '—' : formatRupees(p),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isBest ? AppTheme.seed : Colors.black87,
                        ),
                      ),
                      if (isBest) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.seed,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'BEST',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
