import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/alert_model.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/format.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final state = context.watch<AppState>();
    final alerts = state.userAlerts;

    return Scaffold(
      appBar: AppBar(title: const Text('Price Alerts')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAlertForm(context),
        icon: const Icon(Icons.add),
        label: const Text('Add Alert'),
      ),
      body: alerts.isEmpty
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.notifications_none,
                      size: 56, color: Colors.grey),
                  SizedBox(height: 8),
                  Text('No alerts yet.\nTap "Add Alert" to create one.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: () => state.refreshPrices(),
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
                itemCount: alerts.length,
                itemBuilder: (context, i) =>
                    _AlertCard(alert: alerts[i]),
              ),
            ),
    );
  }

  Future<void> _showAlertForm(BuildContext context,
      [PriceAlert? existing]) async {
    final state = context.read<AppState>();
    await showDialog(
      context: context,
      builder: (_) => ChangeNotifierProvider.value(
        value: state,
        child: _AlertDialogForm(existing: existing),
      ),
    );
  }
}

class _AlertCard extends StatelessWidget {
  final PriceAlert alert;
  const _AlertCard({required this.alert});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final crop = state.cropById(alert.cropId);
    final market = state.marketById(alert.marketId);
    final current = state.todayPriceValue(alert.cropId,
        marketId: alert.marketId);
    final triggered = alert.activeStatus && alert.isTriggered(current);
    final inactive = !alert.activeStatus;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 5),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          crop?.name ?? alert.cropId,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 14.5),
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (triggered)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.accent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'TRIGGERED',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 9.5,
                                fontWeight: FontWeight.bold),
                          ),
                        )
                      else if (inactive)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.grey,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'PAUSED',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 9.5,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${market?.name ?? ''} · ${alert.condition} ${formatRupees(alert.targetPrice)}',
                    style: const TextStyle(
                        fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    current == null
                        ? 'Today: —'
                        : 'Today: ${formatRupees(current)}',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: triggered ? AppTheme.accent : Colors.black54,
                    ),
                  ),
                ],
              ),
            ),
            Switch(
              value: alert.activeStatus,
              onChanged: (_) => state.toggleAlertActive(alert),
            ),
            IconButton(
              icon: const Icon(Icons.edit_outlined, size: 20),
              onPressed: () => showDialog(
                context: context,
                builder: (_) => ChangeNotifierProvider.value(
                  value: state,
                  child: _AlertDialogForm(existing: alert),
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline,
                  size: 20, color: AppTheme.danger),
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Delete alert?'),
                    content: Text(
                        'Remove alert for ${crop?.name ?? ''} at ${market?.name ?? ''}?'),
                    actions: [
                      TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('Cancel')),
                      FilledButton(
                        style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.danger),
                        onPressed: () => Navigator.pop(ctx, true),
                        child: const Text('Delete'),
                      ),
                    ],
                  ),
                );
                if (confirm == true) {
                  await state.deleteAlert(alert.id);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _AlertDialogForm extends StatefulWidget {
  final PriceAlert? existing;
  const _AlertDialogForm({this.existing});

  @override
  State<_AlertDialogForm> createState() => _AlertDialogFormState();
}

class _AlertDialogFormState extends State<_AlertDialogForm> {
  final _formKey = GlobalKey<FormState>();
  late String _cropId;
  late String _marketId;
  late String _condition;
  late final TextEditingController _targetController;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final state = context.read<AppState>();
    _cropId = widget.existing?.cropId ??
        (state.crops.isNotEmpty ? state.crops.first.id : '');
    _marketId = widget.existing?.marketId ?? state.selectedMarketId;
    _condition = widget.existing?.condition ?? 'Above';
    _targetController = TextEditingController(
      text: widget.existing == null
          ? ''
          : widget.existing!.targetPrice.toStringAsFixed(0),
    );
  }

  @override
  void dispose() {
    _targetController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final state = context.read<AppState>();
    final target = double.parse(_targetController.text.trim());
    if (widget.existing == null) {
      final alert = PriceAlert(
        id: 'alert_${DateTime.now().millisecondsSinceEpoch}',
        userId: state.user!.id,
        cropId: _cropId,
        marketId: _marketId,
        condition: _condition,
        targetPrice: target,
        activeStatus: true,
      );
      await state.addAlert(alert);
    } else {
      final updated = widget.existing!.copyWith(
        cropId: _cropId,
        marketId: _marketId,
        condition: _condition,
        targetPrice: target,
      );
      await state.updateAlert(updated);
    }
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return AlertDialog(
      title: Text(widget.existing == null ? 'New Price Alert' : 'Edit Alert'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: _cropId.isEmpty ? null : _cropId,
                decoration: const InputDecoration(labelText: 'Crop'),
                items: state.crops
                    .map((c) => DropdownMenuItem(
                        value: c.id, child: Text(c.name)))
                    .toList(),
                onChanged: (v) => setState(() => _cropId = v ?? _cropId),
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Select a crop' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: state.markets.any((m) => m.id == _marketId)
                    ? _marketId
                    : null,
                decoration: const InputDecoration(labelText: 'Market'),
                items: state.markets
                    .map((m) => DropdownMenuItem(
                        value: m.id, child: Text(m.name)))
                    .toList(),
                onChanged: (v) => setState(() => _marketId = v ?? _marketId),
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Select a market' : null,
              ),
              const SizedBox(height: 12),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'Above', label: Text('Above')),
                  ButtonSegment(value: 'Below', label: Text('Below')),
                ],
                selected: {_condition},
                onSelectionChanged: (s) =>
                    setState(() => _condition = s.first),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _targetController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Target price (PKR / 40 kg)',
                  prefixIcon: Icon(Icons.currency_rupee),
                ),
                validator: (v) {
                  final parsed = double.tryParse(v?.trim() ?? '');
                  if (parsed == null || parsed <= 0) {
                    return 'Enter a valid price';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(
                  height: 16,
                  width: 16,
                  child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Save'),
        ),
      ],
    );
  }
}
