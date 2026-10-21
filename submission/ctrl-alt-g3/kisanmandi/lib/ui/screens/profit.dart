import 'package:flutter/material.dart';
import '../../data/store.dart';
import '../../domain/models.dart';
import '../theme.dart';
import '../widgets.dart';

class ProfitScreen extends StatefulWidget {
  final AppStore store;
  final String? cropId;
  const ProfitScreen({super.key, required this.store, this.cropId});
  @override
  State<ProfitScreen> createState() => _ProfitScreenState();
}

class _ProfitScreenState extends State<ProfitScreen> {
  final quantity = TextEditingController(text: '20'),
      cost = TextEditingController(text: '2500');
  late String cropId = widget.cropId ?? widget.store.crops.first.id;
  late String marketId = widget.store.marketId;
  double shift = 0;
  @override
  void dispose() {
    quantity.dispose();
    cost.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.store,
        q = double.tryParse(quantity.text),
        c = double.tryParse(cost.text);
    final valid =
        q != null &&
        c != null &&
        q.isFinite &&
        c.isFinite &&
        q > 0 &&
        c >= 0 &&
        q <= 1e10 &&
        c <= 1e10;
    final price = s.latest(cropId, marketId)?.price;
    final estimate = valid && price != null
        ? ProfitEstimate(
            price: price,
            quantity: q,
            costPerUnit: c,
            adjustment: shift / 100,
          )
        : null;
    return Scaffold(
      appBar: AppBar(title: const Text('Profit calculator')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 650),
          child: ListView(
            padding: const EdgeInsets.all(22),
            children: [
              const PageIntro(
                label: 'BEFORE YOU SELL',
                title: 'A little foresight.\nA better return.',
                description:
                    'Plan with the latest price from your selected market.',
              ),
              const SizedBox(height: 24),
              if (estimate != null)
                Paper(
                  color: midnight,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        estimate.profit >= 0
                            ? 'ESTIMATED PROFIT'
                            : 'ESTIMATED LOSS',
                        style: const TextStyle(
                          color: saffron,
                          fontSize: 10,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        money(estimate.profit),
                        style: const TextStyle(
                          fontSize: 36,
                          color: paper,
                          fontFamily: 'Fraunces',
                          fontWeight: FontWeight.w500,
                          letterSpacing: -1,
                        ),
                      ),
                      const SizedBox(height: 18),
                      _result('Revenue', money(estimate.revenue)),
                      _result('Total cost', money(estimate.cost)),
                      _result(
                        'Profit margin',
                        '${estimate.margin.toStringAsFixed(1)}%',
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 24),
              const Eyebrow('YOUR SALE DETAILS'),
              const SizedBox(height: 16),
              DropField(
                label: 'Crop',
                value: cropId,
                options: {for (final c in s.crops) c.id: c.name},
                onChanged: (v) => setState(() => cropId = v),
              ),
              const SizedBox(height: 14),
              DropField(
                label: 'Market',
                value: marketId,
                options: {for (final m in s.markets) m.id: m.name},
                onChanged: (v) => setState(() => marketId = v),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: quantity,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(
                  labelText: 'Quantity (40 kg maunds)',
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: cost,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(
                  labelText: 'Production cost per maund (PKR)',
                ),
                onChanged: (_) => setState(() {}),
              ),
              if (!valid)
                const Padding(
                  padding: EdgeInsets.only(top: 10),
                  child: Text(
                    'Enter quantity > 0 and cost ≥ 0. Use finite numbers up to 10 billion.',
                    style: TextStyle(color: rust, fontSize: 12),
                  ),
                ),
              const SectionTitle('What if the price changes?'),
              Paper(
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${shift >= 0 ? '+' : ''}${shift.toStringAsFixed(0)}%',
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                        ),
                        TextButton(
                          onPressed: () => setState(() => shift = 0),
                          child: const Text('Reset'),
                        ),
                      ],
                    ),
                    Slider(
                      value: shift,
                      min: -20,
                      max: 20,
                      divisions: 40,
                      label: '${shift.round()}%',
                      onChanged: (v) => setState(() => shift = v),
                    ),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('−20%', style: TextStyle(color: muted)),
                        Text('+20%', style: TextStyle(color: muted)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      price == null
                          ? 'Price unavailable'
                          : '${money(price * (1 + shift / 100))} per maund',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Base price: ${price == null ? '—' : money(price)}',
                      style: const TextStyle(color: muted, fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const SizedBox(height: 16),
              const Text(
                'Margin = profit ÷ revenue × 100. Production cost is per 40 kg maund. Transport, commission and other selling costs are excluded.',
                style: TextStyle(color: muted, fontSize: 11),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _result(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Row(
      children: [
        Expanded(
          child: Text(label, style: const TextStyle(color: saffron)),
        ),
        Text(
          value,
          style: const TextStyle(color: paper, fontWeight: FontWeight.w700),
        ),
      ],
    ),
  );
}
