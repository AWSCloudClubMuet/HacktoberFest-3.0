import 'package:flutter/material.dart';

import '../app_state.dart';
import '../utils.dart';

class ProfitScreen extends StatefulWidget {
  const ProfitScreen({super.key});

  @override
  State<ProfitScreen> createState() => _ProfitScreenState();
}

class _ProfitScreenState extends State<ProfitScreen> {
  final _qty = TextEditingController();
  final _cost = TextEditingController();
  String? _cropId;
  String? _marketId;
  double _shift = 0;

  @override
  void initState() {
    super.initState();
    _cropId = appState.crops.firstOrNull?.id;
    _marketId = appState.selectedMarketId ?? appState.markets.firstOrNull?.id;
  }

  @override
  void dispose() {
    _qty.dispose();
    _cost.dispose();
    super.dispose();
  }

  Widget _result(String label, String value, {Color? color}) => Card(
        child: ListTile(
          title: Text(label),
          trailing: Text(value,
              style: TextStyle(
                  fontSize: 18, fontWeight: FontWeight.bold, color: color)),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final basePrice = (_cropId != null && _marketId != null)
        ? appState.latestPrice(_cropId!, _marketId!)
        : null;
    final adjusted = basePrice == null ? null : basePrice * (1 + _shift / 100);
    final qty = double.tryParse(_qty.text.trim());
    final cost = double.tryParse(_cost.text.trim());
    final ready =
        adjusted != null && qty != null && qty > 0 && cost != null && cost >= 0;

    final revenue = ready ? adjusted * qty : 0.0;
    final totalCost = ready ? cost * qty : 0.0;
    final profit = revenue - totalCost;
    final margin = (ready && revenue != 0) ? profit / revenue * 100 : 0.0;
    final profitColor =
        profit >= 0 ? Colors.green.shade800 : Colors.red.shade700;

    return Scaffold(
      appBar: AppBar(title: const Text('Profit calculator')),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: appState.crops.isEmpty
                ? const Center(child: Text('Price data is not loaded yet.'))
                : ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      DropdownButtonFormField<String>(
                        initialValue: _cropId,
                        decoration: const InputDecoration(
                            labelText: 'Crop', border: OutlineInputBorder()),
                        items: [
                          for (final c in appState.crops)
                            DropdownMenuItem(value: c.id, child: Text(c.name)),
                        ],
                        onChanged: (v) => setState(() => _cropId = v),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        initialValue: _marketId,
                        isExpanded: true,
                        decoration: const InputDecoration(
                            labelText: 'Market', border: OutlineInputBorder()),
                        items: [
                          for (final m in appState.markets)
                            DropdownMenuItem(
                                value: m.id,
                                child: Text('${m.name} (${m.district})')),
                        ],
                        onChanged: (v) => setState(() => _marketId = v),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _qty,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: const InputDecoration(
                          labelText: 'Quantity (units of 40 kg)',
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _cost,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: const InputDecoration(
                          labelText: 'Cost of production per unit (Rs per 40 kg)',
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'What-if price change: ${_shift > 0 ? '+' : ''}${_shift.round()}%',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Slider(
                        value: _shift,
                        min: -20,
                        max: 20,
                        divisions: 40,
                        label: '${_shift.round()}%',
                        onChanged: (v) => setState(() => _shift = v),
                      ),
                      if (adjusted != null)
                        Text(
                            'Price used: ${money(adjusted)} per 40 kg (market price today: ${money(basePrice!)})'),
                      if (basePrice == null)
                        const Text('No price available for this crop and market.'),
                      const SizedBox(height: 16),
                      if (!ready)
                        const Text(
                            'Enter a quantity greater than 0 and a cost per unit to see the result.')
                      else ...[
                        _result('Revenue', money(revenue)),
                        _result('Total cost', money(totalCost)),
                        _result('Profit / Loss', money(profit),
                            color: profitColor),
                        _result('Margin', '${margin.toStringAsFixed(1)}%',
                            color: profitColor),
                      ],
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}