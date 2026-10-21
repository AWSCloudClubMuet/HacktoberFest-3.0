import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../app_state.dart';
import '../utils.dart';

class CropDetailScreen extends StatefulWidget {
  final String cropId;
  final String marketId;
  const CropDetailScreen(
      {super.key, required this.cropId, required this.marketId});

  @override
  State<CropDetailScreen> createState() => _CropDetailScreenState();
}

class _CropDetailScreenState extends State<CropDetailScreen> {
  late String _marketId;

  @override
  void initState() {
    super.initState();
    _marketId = widget.marketId;
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, _) {
        final scheme = Theme.of(context).colorScheme;
        final textTheme = Theme.of(context).textTheme;
        final series = appState.last14(widget.cropId, _marketId);
        final ranked = appState.rankedMarkets(widget.cropId);

        Widget chartSection;
        if (series.length < 2) {
          chartSection = const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: Text('Not enough price history to draw a chart.')),
          );
        } else {
          final values = series.map((p) => p.price).toList();
          final minP = values.reduce(math.min);
          final maxP = values.reduce(math.max);
          final avgP = values.reduce((a, b) => a + b) / values.length;
          final pad = math.max((maxP - minP) * 0.15, 1.0);
          final spots = [
            for (var i = 0; i < series.length; i++)
              FlSpot(i.toDouble(), series[i].price),
          ];
          final last = series.length - 1;

          chartSection = Column(
            children: [
              SizedBox(
                height: 240,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(4, 16, 20, 4),
                  child: LineChart(
                    LineChartData(
                      minX: 0,
                      maxX: last.toDouble(),
                      minY: minP - pad,
                      maxY: maxP + pad,
                      gridData: const FlGridData(
                          show: true, drawVerticalLine: false),
                      borderData: FlBorderData(show: false),
                      titlesData: FlTitlesData(
                        topTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false)),
                        leftTitles: const AxisTitles(
                            sideTitles:
                                SideTitles(showTitles: true, reservedSize: 52)),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 28,
                            interval: 1,
                            getTitlesWidget: (value, meta) {
                              final i = value.toInt();
                              if (i != 0 && i != last && i != last ~/ 2) {
                                return const SizedBox.shrink();
                              }
                              return Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(shortDate(series[i].date),
                                    style: const TextStyle(fontSize: 11)),
                              );
                            },
                          ),
                        ),
                      ),
                      lineBarsData: [
                        LineChartBarData(
                          spots: spots,
                          isCurved: false,
                          barWidth: 3,
                          color: scheme.primary,
                          dotData: const FlDotData(show: true),
                          belowBarData: BarAreaData(
                            show: true,
                            color: scheme.primary.withValues(alpha: 0.1),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    _StatCard(label: 'Minimum', value: money(minP)),
                    _StatCard(label: 'Maximum', value: money(maxP)),
                    _StatCard(label: 'Average', value: money(avgP)),
                  ],
                ),
              ),
            ],
          );
        }

        return Scaffold(
          appBar: AppBar(title: Text(appState.cropName(widget.cropId))),
          body: ListView(
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Text(
                    '14-day price · ${appState.marketName(_marketId)} (Rs per 40 kg)',
                    style: textTheme.titleMedium),
              ),
              chartSection,
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                child: Text('Compare markets (best price first)',
                    style: textTheme.titleMedium),
              ),
              for (var i = 0; i < ranked.length; i++)
                _marketTile(context, i, ranked[i].$1.id, ranked[i].$1.name,
                    ranked[i].$1.district, ranked[i].$2),
            ],
          ),
        );
      },
    );
  }

  Widget _marketTile(BuildContext context, int rank, String id, String name,
      String district, double price) {
    final scheme = Theme.of(context).colorScheme;
    final best = rank == 0;
    return Card(
      color: best ? scheme.primaryContainer : null,
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: ListTile(
        leading: best
            ? Icon(Icons.star, color: scheme.primary)
            : CircleAvatar(radius: 14, child: Text('${rank + 1}')),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(best
            ? '$district · Best place to sell today'
            : (id == _marketId ? '$district · shown in chart' : district)),
        trailing: Text(money(price),
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.bold)),
        onTap: () => setState(() => _marketId = id),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
          child: Column(
            children: [
              Text(label, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 4),
              Text(value,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }
}