import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../data/store.dart';
import '../../domain/models.dart';
import '../theme.dart';
import '../widgets.dart';
import 'alerts.dart';
import 'profit.dart';

class PricesScreen extends StatefulWidget {
  final AppStore store;
  const PricesScreen({super.key, required this.store});
  @override
  State<PricesScreen> createState() => _PricesScreenState();
}

class _PricesScreenState extends State<PricesScreen> {
  String query = '', category = 'All';
  @override
  Widget build(BuildContext context) {
    final s = widget.store;
    final visible = s.crops
        .where(
          (c) =>
              c.name.toLowerCase().contains(query.toLowerCase()) &&
              (category == 'All' || c.category == category),
        )
        .toList();
    return RefreshIndicator(
      onRefresh: s.refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(22, 14, 22, 28),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Salaam, ${s.user!.name.split(' ').first}.',
                      style: const TextStyle(color: muted, fontSize: 13),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Your mandi, today.',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ],
                ),
              ),
              IconButton.filledTonal(
                tooltip: 'Profit calculator',
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => ProfitScreen(store: s),
                  ),
                ),
                icon: const Icon(Icons.calculate_outlined),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              color: forest,
              borderRadius: BorderRadius.circular(24),
            ),
            child: SizedBox(
              height: 164,
              child: Stack(
                children: [
                  const Positioned(
                    right: -5,
                    bottom: 0,
                    width: 165,
                    height: 145,
                    child: FieldLandscape(),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'A FAIR PRICE STARTS HERE',
                          style: TextStyle(
                            color: Color(0xFFCDDBB6),
                            letterSpacing: 1.2,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Know more.\nSell better.',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 27,
                            fontWeight: FontWeight.w700,
                            height: 1.1,
                            letterSpacing: -.8,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '${s.crops.length} crops · ${s.markets.length} Sindh markets',
                          style: const TextStyle(
                            color: Color(0xFFCDDBB6),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 22),
          DropField(
            label: 'Market',
            value: s.marketId,
            options: {
              for (final m in s.markets) m.id: '${m.name} · ${m.district}',
            },
            onChanged: s.selectMarket,
          ),
          const SizedBox(height: 14),
          TextField(
            onChanged: (v) => setState(() => query = v),
            decoration: const InputDecoration(
              hintText: 'Search wheat, cotton, mango…',
              prefixIcon: Icon(Icons.search, size: 21),
            ),
          ),
          const SizedBox(height: 14),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['All', ...s.crops.map((c) => c.category).toSet()]
                  .map(
                    (c) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(
                          c,
                          style: TextStyle(
                            color: category == c ? Colors.white : ink,
                          ),
                        ),
                        selected: category == c,
                        showCheckmark: false,
                        onSelected: (_) => setState(() => category = c),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          SectionTitle('Market rates', note: '${visible.length} crops'),
          if (visible.isEmpty)
            const EmptyState(
              title: 'No crops found',
              message: 'Try another name or category.',
            ),
          for (final c in visible)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _PriceRow(store: s, crop: c),
            ),
          const SizedBox(height: 8),
          Text(
            s.refreshedAt == null
                ? 'Pull down to load the latest mock API data.'
                : 'Refreshed ${TimeOfDay.fromDateTime(s.refreshedAt!).format(context)} · Pull down to refresh',
            style: const TextStyle(color: muted, fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final AppStore store;
  final Crop crop;
  const _PriceRow({required this.store, required this.crop});
  @override
  Widget build(BuildContext context) {
    final latest = store.latest(crop.id), change = store.dailyChange(crop.id);
    final previous = latest == null || change == null
        ? 0
        : latest.price - change;
    final pct = previous > 0 && change != null ? change / previous * 100 : null;
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute<void>(
            builder: (_) => CropDetailScreen(store: store, cropId: crop.id),
          ),
        ),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: line),
          ),
          child: Row(
            children: [
              CropIcon(crop.name),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      crop.name,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      crop.category,
                      style: const TextStyle(color: muted, fontSize: 11),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    latest == null ? 'Unavailable' : money(latest.price),
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    change == null
                        ? 'No previous day'
                        : '${change >= 0 ? '+' : ''}${money(change, currency: false)} (${change >= 0 ? '+' : ''}${pct?.toStringAsFixed(1) ?? '—'}%)',
                    style: TextStyle(
                      color: change == null
                          ? muted
                          : change >= 0
                          ? leaf
                          : amber,
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: muted, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}

class CropDetailScreen extends StatelessWidget {
  final AppStore store;
  final String cropId;
  const CropDetailScreen({
    super.key,
    required this.store,
    required this.cropId,
  });
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) {
      final crop = store.crop(cropId), history = store.history(cropId);
      final values = history.map((p) => p.price).toList();
      final comparison = store.comparison(cropId);
      return Scaffold(
        appBar: AppBar(
          title: Text(crop.name),
          actions: [
            IconButton(
              tooltip: 'Refresh prices & alerts',
              onPressed: store.loading ? null : store.refresh,
              icon: const Icon(Icons.refresh),
            ),
          ],
        ),
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 700),
            child: RefreshIndicator(
              onRefresh: store.refresh,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(22),
                children: [
                  DropField(
                    label: 'Selected market',
                    value: store.marketId,
                    options: {for (final m in store.markets) m.id: m.name},
                    onChanged: store.selectMarket,
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      CropIcon(crop.name, size: 62),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              values.isEmpty ? 'No price' : money(values.last),
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                            Text(
                              'per 40 kg maund · ${history.isEmpty ? '—' : history.last.date}',
                              style: const TextStyle(
                                color: muted,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SectionTitle('The past 14 days', note: 'PKR / maund'),
                  Paper(
                    child: Column(
                      children: [
                        PriceChart(history),
                        const SizedBox(height: 8),
                        if (values.isNotEmpty)
                          Row(
                            children: [
                              _stat('Minimum', values.reduce(math.min)),
                              _stat(
                                'Average',
                                values.reduce((a, b) => a + b) / values.length,
                              ),
                              _stat('Maximum', values.reduce(math.max)),
                            ],
                          ),
                      ],
                    ),
                  ),
                  const SectionTitle(
                    'Where should you sell?',
                    note: 'Best price first',
                  ),
                  for (var i = 0; i < comparison.length; i++)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Paper(
                        color: comparison[i].price == comparison.first.price
                            ? const Color(0xFFEAF0E1)
                            : Colors.white,
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '${i + 1}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    comparison[i].market.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  Text(
                                    comparison[i].price ==
                                            comparison.first.price
                                        ? 'Best place to sell today'
                                        : comparison[i].market.district,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color:
                                          comparison[i].price ==
                                              comparison.first.price
                                          ? leaf
                                          : muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              money(comparison[i].price),
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 10),
                  if (store.user!.isFarmer)
                    FilledButton.icon(
                      onPressed: () =>
                          showAlertForm(context, store, cropId: cropId),
                      icon: const Icon(Icons.notifications_none),
                      label: const Text('Set a price alert'),
                    ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) =>
                            ProfitScreen(store: store, cropId: cropId),
                      ),
                    ),
                    icon: const Icon(Icons.calculate_outlined),
                    label: const Text('Estimate your profit'),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Fictional wholesale prices. Transport, fees and spoilage are not included.',
                    style: TextStyle(color: muted, fontSize: 11),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    },
  );
  Widget _stat(String label, double value) => Expanded(
    child: Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: muted)),
        const SizedBox(height: 4),
        FittedBox(
          child: Text(
            money(value),
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          ),
        ),
      ],
    ),
  );
}
