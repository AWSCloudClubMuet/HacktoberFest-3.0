import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/format.dart';

class ProfitCalculatorScreen extends StatefulWidget {
  const ProfitCalculatorScreen({super.key});

  @override
  State<ProfitCalculatorScreen> createState() =>
      _ProfitCalculatorScreenState();
}

class _ProfitCalculatorScreenState extends State<ProfitCalculatorScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  String? _cropId;
  String? _marketId;
  final _quantityController = TextEditingController(text: '100');
  final _costController = TextEditingController(text: '3500');

  /// What-if adjustment applied to the live market price, in percent.
  double _priceAdjustment = 0;

  @override
  void initState() {
    super.initState();
    final state = context.read<AppState>();
    _cropId = state.crops.isNotEmpty ? state.crops.first.id : null;
    _marketId = state.selectedMarketId;
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _costController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final state = context.watch<AppState>();

    if (_marketId == null && state.markets.isNotEmpty) {
      _marketId = state.selectedMarketId;
    }

    final basePrice = _cropId == null
        ? null
        : state.todayPriceValue(_cropId!, marketId: _marketId);
    final adjustedPrice =
        basePrice == null ? null : basePrice * (1 + _priceAdjustment / 100);
    final quantity =
        double.tryParse(_quantityController.text.trim()) ?? 0;
    final costPerUnit =
        double.tryParse(_costController.text.trim()) ?? 0;

    final revenue = (adjustedPrice ?? 0) * quantity;
    final totalCost = costPerUnit * quantity;
    final net = revenue - totalCost;
    final margin = revenue == 0 ? 0.0 : (net / revenue) * 100;
    final profit = net >= 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Profit Calculator')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _cropId,
                      decoration: const InputDecoration(labelText: 'Crop'),
                      items: state.crops
                          .map((c) => DropdownMenuItem(
                              value: c.id, child: Text(c.name)))
                          .toList(),
                      onChanged: (v) => setState(() => _cropId = v),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue:
                          state.markets.any((m) => m.id == _marketId)
                          ? _marketId
                          : null,
                      decoration:
                          const InputDecoration(labelText: 'Market'),
                      items: state.markets
                          .map((m) => DropdownMenuItem(
                              value: m.id, child: Text(m.name)))
                          .toList(),
                      onChanged: (v) => setState(() => _marketId = v),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _quantityController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Quantity (× 40 kg)',
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _costController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Production cost (Rs/unit)',
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Expanded(
                              child: Text('Market price today',
                                  style: TextStyle(fontSize: 13))),
                          Text(
                            basePrice == null
                                ? '—'
                                : formatRupees(basePrice),
                            style:
                                const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'What-if price: '
                        '${adjustedPrice == null ? "—" : formatRupees(adjustedPrice)} '
                        '(${_priceAdjustment >= 0 ? "+" : ""}${_priceAdjustment.toStringAsFixed(0)}%)',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: _priceAdjustment >= 0
                              ? Colors.green.shade800
                              : AppTheme.danger,
                        ),
                      ),
                      Slider(
                        value: _priceAdjustment,
                        min: -20,
                        max: 20,
                        divisions: 40,
                        label:
                            '${_priceAdjustment >= 0 ? "+" : ""}${_priceAdjustment.toStringAsFixed(0)}%',
                        onChanged: (v) =>
                            setState(() => _priceAdjustment = v),
                      ),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('-20%',
                              style: TextStyle(
                                  fontSize: 11, color: Colors.grey)),
                          Text('Market price',
                              style: TextStyle(
                                  fontSize: 11, color: Colors.grey)),
                          Text('+20%',
                              style: TextStyle(
                                  fontSize: 11, color: Colors.grey)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              _ResultCard(
                label: 'Revenue',
                value: formatRupees(revenue),
                color: Colors.blue.shade800,
                icon: Icons.payments_outlined,
              ),
              _ResultCard(
                label: 'Total cost',
                value: formatRupees(totalCost),
                color: Colors.orange.shade900,
                icon: Icons.money_off_csred_outlined,
              ),
              _ResultCard(
                label: profit ? 'Net profit' : 'Net loss',
                value: formatRupees(net, showSign: !profit ? false : true),
                color: profit ? AppTheme.seed : AppTheme.danger,
                icon: profit
                    ? Icons.trending_up
                    : Icons.trending_down,
                emphasise: true,
              ),
              _ResultCard(
                label: 'Profit margin',
                value: '${margin.toStringAsFixed(1)}%',
                color: profit ? AppTheme.seed : AppTheme.danger,
                icon: Icons.percent,
              ),
              const SizedBox(height: 8),
              Text(
                'Assumes 1 unit = 40 kg maund. Adjust the slider to test '
                'what happens if mandi prices move by up to ±20%.',
                style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;
  final bool emphasise;

  const _ResultCard({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
    this.emphasise = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: EdgeInsets.symmetric(
          horizontal: 16, vertical: emphasise ? 18 : 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: emphasise ? 0.12 : 0.06),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: emphasise ? 26 : 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: emphasise ? 15 : 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: emphasise ? 20 : 15,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
