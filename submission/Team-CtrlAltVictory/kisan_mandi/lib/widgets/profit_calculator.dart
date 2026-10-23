import 'package:flutter/material.dart';

import '../services/profit_calc.dart';
import '../utils/format.dart';
import '../utils/theme.dart';

class ProfitCalculator extends StatefulWidget {
  const ProfitCalculator({super.key, required this.basePrice, required this.priceLabel});

  final double? basePrice;
  final String priceLabel;

  @override
  State<ProfitCalculator> createState() => _ProfitCalculatorState();
}

class _ProfitCalculatorState extends State<ProfitCalculator> {
  late final TextEditingController _qty = TextEditingController(text: '100');
  late final TextEditingController _cost = TextEditingController(
      text: widget.basePrice == null ? '' : (widget.basePrice! * 0.8).round().toString());
  final TextEditingController _other = TextEditingController(text: '0');
  double _adj = 0;

  @override
  void dispose() {
    _qty.dispose();
    _cost.dispose();
    _other.dispose();
    super.dispose();
  }

  double? _num(TextEditingController c) => double.tryParse(c.text.trim());

  Widget _row(String label, String value, {bool bold = false, Color? color}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label),
            Text(value,
                style: TextStyle(fontWeight: bold ? FontWeight.bold : null, color: color)),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final base = widget.basePrice;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                      color: AppColors.goldSoft, shape: BoxShape.circle),
                  child: const Icon(Icons.calculate_rounded,
                      size: 21, color: AppColors.goldDark),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Profit calculator',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            if (base == null)
              const Text('No price available for this selection.')
            else ...[
              Text(
                '${widget.priceLabel}: ${fmtRs(base)} / maund. Sample costs pre-filled.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.muted,
                ),
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: _field(_qty, 'Quantity (maund)')),
                const SizedBox(width: 8),
                Expanded(child: _field(_cost, 'Cost / maund (Rs)')),
              ]),
              const SizedBox(height: 12),
              _field(_other, 'Transport & other costs, total (Rs)'),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: Text('Price adjustment: ${_adj > 0 ? '+' : ''}${_adj.round()}%'),
                ),
                TextButton(onPressed: () => setState(() => _adj = 0), child: const Text('Reset')),
              ]),
              Slider(
                value: _adj,
                min: -20,
                max: 20,
                divisions: 40,
                label: '${_adj.round()}%',
                onChanged: (v) => setState(() => _adj = v),
              ),
              const Divider(),
              ..._results(base),
            ],
          ],
        ),
      ),
    );
  }

  Widget _field(TextEditingController c, String label) => TextField(
        controller: c,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        decoration: InputDecoration(labelText: label),
        onChanged: (_) => setState(() {}),
      );

  List<Widget> _results(double base) {
    final qty = _num(_qty);
    final cost = _num(_cost);
    final other = _num(_other) ?? 0;
    if (qty == null || qty <= 0 || cost == null || cost < 0 || other < 0) {
      return [const Text('Enter a quantity above 0 and a valid cost to see the result.')];
    }
    final r = calculateProfit(
      quantity: qty,
      basePrice: base,
      adjustmentPct: _adj,
      costPerMaund: cost,
      otherCosts: other,
    );
    final good = r.profit >= 0;
    final bgTint = good ? AppColors.greenSoft : AppColors.downSoft;
    final borderTint = good ? AppColors.greenSoft : AppColors.downSoft;
    final titleColor = good ? AppColors.green : AppColors.down;
    final valueColor = good ? AppColors.greenDark : AppColors.down;

    return [
      Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: bgTint,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderTint),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  good ? 'Net Projected Profit' : 'Net Projected Loss',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: titleColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  fmtRs(r.profit),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: valueColor,
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'Margin: ${r.marginPct == null ? 'N/A' : fmtPct(r.marginPct!)}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: titleColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${fmtRs(r.profitPerMaund)} / maund',
                  style: TextStyle(
                    fontSize: 12,
                    color: titleColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      const SizedBox(height: 6),
      _row('Selling price / maund', fmtRs(r.sellingPrice)),
      _row('Revenue', fmtRs(r.revenue)),
      _row('Total cost', fmtRs(r.totalCost)),
      _row('Break-even price / maund', fmtRs(r.breakEvenPrice)),
    ];
  }
}
