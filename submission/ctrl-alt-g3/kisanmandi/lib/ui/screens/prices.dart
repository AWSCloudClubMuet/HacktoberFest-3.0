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
        padding: const EdgeInsets.fromLTRB(22, 18, 22, 28),
        children: [
          PageIntro(
            label: 'SALAAM, ${s.user!.name.split(' ').first.toUpperCase()}',
            title: 'The market,\nin focus.',
            action: IconButton.outlined(
              tooltip: 'Profit calculator',
              style: IconButton.styleFrom(
                padding: const EdgeInsets.all(15),
                side: const BorderSide(color: line),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute<void>(builder: (_) => ProfitScreen(store: s)),
              ),
              icon: const Icon(Icons.calculate_outlined, size: 23),
            ),
          ),
          const SizedBox(height: 24),
          DropField(
            label: 'Your market',
            value: s.marketId,
            options: {for (final m in s.markets) m.id: m.name},
            onChanged: s.selectMarket,
          ),
          const SizedBox(height: 16),
          _MarketPulse(store: s),
          const SizedBox(height: 20),
          TextField(
            onChanged: (v) => setState(() => query = v),
            decoration: const InputDecoration(
              hintText: 'Search a crop',
              prefixIcon: Icon(Icons.search, size: 21),
              suffixIcon: Icon(Icons.north_east, size: 17, color: muted),
            ),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['All', ...s.crops.map((c) => c.category).toSet()]
                  .map(
                    (c) => Padding(
                      padding: const EdgeInsets.only(right: 5),
                      child: ChoiceChip(
                        label: Text(
                          c,
                          style: TextStyle(
                            color: category == c ? paper : muted,
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
          SectionTitle('The price ledger', note: '${visible.length} crops'),
          if (visible.isEmpty)
            const EmptyState(
              title: 'No crops found',
              message: 'Try another name or category.',
            ),
          if (visible.isNotEmpty)
            Paper(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (var i = 0; i < visible.length; i++) ...[
                    _PriceRow(store: s, crop: visible[i]),
                    if (i < visible.length - 1)
                      const Divider(height: 1, indent: 16, endIndent: 16),
                  ],
                ],
              ),
            ),
          const SizedBox(height: 16),
          Text(
            s.refreshedAt == null
                ? 'Pull down to refresh prices.'
                : 'Updated ${TimeOfDay.fromDateTime(s.refreshedAt!).format(context)} · Pull to refresh',
            style: const TextStyle(color: muted, fontSize: 10),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _MarketPulse extends StatelessWidget {
  final AppStore store;
  const _MarketPulse({required this.store});
  @override
  Widget build(BuildContext context) {
    final changes = store.crops
        .map((c) => store.dailyChange(c.id))
        .whereType<double>()
        .toList();
    final rising = changes.where((c) => c > 0).length;
    final falling = changes.where((c) => c < 0).length;
    final steady = changes.where((c) => c == 0).length;
    final tracked = store.crops.where((c) => store.latest(c.id) != null).length;
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: midnight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -40,
            top: -40,
            child: SizedBox(
              width: 180,
              height: 180,
              child: TextileMark(color: saffron.withValues(alpha: .10)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Eyebrow('TODAY’S MARKET PULSE', color: saffron),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      tracked.toString().padLeft(2, '0'),
                      style: const TextStyle(
                        fontFamily: 'Fraunces',
                        fontSize: 53,
                        height: 1,
                        color: paper,
                        letterSpacing: -2,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(bottom: 4),
                        child: Text(
                          'crops on\nyour radar',
                          style: TextStyle(
                            color: paper,
                            fontSize: 12,
                            height: 1.5,
                          ),
                        ),
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.only(bottom: 4),
                      child: Icon(Icons.grain, color: saffron, size: 32),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(height: 1, color: paper.withValues(alpha: .16)),
                const SizedBox(height: 13),
                Wrap(
                  spacing: 18,
                  runSpacing: 8,
                  children: [
                    _count(Icons.north_east, '$rising rising'),
                    _count(Icons.south_east, '$falling falling'),
                    _count(Icons.horizontal_rule, '$steady steady'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _count(IconData icon, String label) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, color: saffron, size: 13),
      const SizedBox(width: 5),
      Text(
        label,
        style: const TextStyle(
          color: paper,
          fontSize: 10,
          fontWeight: FontWeight.w500,
        ),
      ),
    ],
  );
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
    final changeColor = change == null
        ? muted
        : change >= 0
        ? positive
        : rust;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute<void>(
            builder: (_) => CropDetailScreen(store: store, cropId: crop.id),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
          child: LayoutBuilder(
            builder: (context, constraints) => Row(
              children: [
                CropIcon(crop.name, size: 40),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        crop.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        crop.category,
                        style: const TextStyle(color: muted, fontSize: 10),
                      ),
                    ],
                  ),
                ),
                if (constraints.maxWidth >= 310) ...[
                  SizedBox(
                    width: 40,
                    height: 23,
                    child: CustomPaint(
                      painter: _SparkPainter(
                        store.history(crop.id),
                        changeColor,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                ],
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      latest == null ? 'Unavailable' : money(latest.price),
                      style: figures.copyWith(fontSize: 15),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      change == null
                          ? 'No previous day'
                          : '${change >= 0 ? '+' : ''}${money(change, currency: false)}  (${change >= 0 ? '+' : ''}${pct?.toStringAsFixed(1) ?? '—'}%)',
                      style: TextStyle(
                        color: changeColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SparkPainter extends CustomPainter {
  final List<Price> data;
  final Color color;
  _SparkPainter(this.data, this.color);
  @override
  void paint(Canvas canvas, Size size) {
    if (data.length < 2) return;
    final low = data.map((p) => p.price).reduce(math.min);
    final high = data.map((p) => p.price).reduce(math.max);
    final span = high == low ? 1 : high - low;
    final path = Path();
    for (var i = 0; i < data.length; i++) {
      final x = i * size.width / (data.length - 1);
      final y =
          size.height - 3 - (data[i].price - low) / span * (size.height - 6);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..strokeWidth = 1.4
        ..style = PaintingStyle.stroke
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(covariant _SparkPainter old) =>
      old.data != data || old.color != color;
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
                  PageIntro(label: 'THE CROP REPORT', title: crop.name),
                  const SizedBox(height: 22),
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
                              style: figures.copyWith(fontSize: 30),
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
                            ? paleGold
                            : paper,
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: paper,
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
                                          ? positive
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
