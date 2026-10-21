import 'package:flutter/material.dart';
import '../../data/store.dart';
import '../../domain/models.dart';
import '../theme.dart';
import '../widgets.dart';

Future<void> showAlertForm(
  BuildContext context,
  AppStore store, {
  String? cropId,
  PriceAlert? alert,
}) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  backgroundColor: cream,
  builder: (_) => AlertForm(store: store, initialCropId: cropId, alert: alert),
);

class AlertsScreen extends StatefulWidget {
  final AppStore store;
  const AlertsScreen({super.key, required this.store});
  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  final Set<String> pending = {};
  Future<void> mutate(PriceAlert alert, String method, [Json? data]) async {
    setState(() => pending.add(alert.id));
    try {
      await widget.store.mutate(method, 'alerts/${alert.id}', data);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => pending.remove(alert.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.store;
    final ordered = [...s.alerts]
      ..sort((a, b) => (b.triggered ? 1 : 0).compareTo(a.triggered ? 1 : 0));
    return RefreshIndicator(
      onRefresh: s.refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(22),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'A price worth\nwaiting for.',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
              ),
              IconButton.filled(
                tooltip: 'Create price alert',
                onPressed: () => showAlertForm(context, s),
                icon: const Icon(Icons.add),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'We check your targets every time you refresh.',
            style: TextStyle(color: muted),
          ),
          const SizedBox(height: 22),
          Paper(
            color: const Color(0xFFEAF0E1),
            child: Row(
              children: [
                const Icon(Icons.notifications_active_outlined, color: leaf),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${s.triggeredCount} target${s.triggeredCount == 1 ? '' : 's'} reached',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Text(
                        'Active alerts matching the latest prices',
                        style: TextStyle(color: muted, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          if (ordered.isEmpty)
            EmptyState(
              title: 'Let the right price find you',
              message: 'Add a crop, a market and your target price.',
              icon: Icons.notifications_none,
              action: FilledButton(
                onPressed: () => showAlertForm(context, s),
                child: const Text('Create your first alert'),
              ),
            ),
          for (final a in ordered)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Paper(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CropIcon(s.crop(a.cropId).name, size: 42),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                s.crop(a.cropId).name,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              Text(
                                s.market(a.marketId).name,
                                style: const TextStyle(
                                  color: muted,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Switch(
                          value: a.active,
                          onChanged: pending.contains(a.id)
                              ? null
                              : (v) => mutate(a, 'PATCH', {'active_status': v}),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '${a.condition == 'Above' ? 'At or above' : 'At or below'} ${money(a.target)}',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 7),
                    Text(
                      'Latest: ${money(s.latest(a.cropId, a.marketId)?.price ?? 0)} / maund',
                      style: const TextStyle(color: muted, fontSize: 12),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Tag(
                          !a.active
                              ? 'Paused'
                              : a.triggered
                              ? 'Target reached'
                              : 'Watching',
                          color: !a.active
                              ? muted
                              : a.triggered
                              ? leaf
                              : amber,
                        ),
                        const Spacer(),
                        IconButton(
                          tooltip: 'Edit alert',
                          onPressed: pending.contains(a.id)
                              ? null
                              : () => showAlertForm(context, s, alert: a),
                          icon: const Icon(Icons.edit_outlined, size: 20),
                        ),
                        IconButton(
                          tooltip: 'Delete alert',
                          onPressed: pending.contains(a.id)
                              ? null
                              : () async {
                                  if (await confirmDelete(context, 'alert')) {
                                    await mutate(a, 'DELETE');
                                  }
                                },
                          icon: const Icon(
                            Icons.delete_outline,
                            color: muted,
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 12),
          const Text(
            'In-app alerts only. Above and Below both include the target price itself.',
            style: TextStyle(color: muted, fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class AlertForm extends StatefulWidget {
  final AppStore store;
  final String? initialCropId;
  final PriceAlert? alert;
  const AlertForm({
    super.key,
    required this.store,
    this.initialCropId,
    this.alert,
  });
  @override
  State<AlertForm> createState() => _AlertFormState();
}

class _AlertFormState extends State<AlertForm> {
  final form = GlobalKey<FormState>();
  late String cropId =
      widget.alert?.cropId ??
      widget.initialCropId ??
      widget.store.crops.first.id;
  late String marketId = widget.alert?.marketId ?? widget.store.marketId;
  late String condition = widget.alert?.condition ?? 'Above';
  late final target = TextEditingController(
    text:
        (widget.alert?.target ??
                widget.store.latest(cropId, marketId)?.price ??
                0)
            .toStringAsFixed(0),
  );
  late bool active = widget.alert?.active ?? true;
  bool busy = false;
  @override
  void dispose() {
    target.dispose();
    super.dispose();
  }

  Future<void> save() async {
    if (!form.currentState!.validate()) return;
    setState(() => busy = true);
    try {
      await widget.store.mutate(
        widget.alert == null ? 'POST' : 'PATCH',
        widget.alert == null ? 'alerts' : 'alerts/${widget.alert!.id}',
        {
          'crop_id': cropId,
          'market_id': marketId,
          'condition': condition,
          'target_price': double.parse(target.text),
          'active_status': active,
        },
      );
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(
      22,
      24,
      22,
      MediaQuery.viewInsetsOf(context).bottom + 24,
    ),
    child: SingleChildScrollView(
      child: Form(
        key: form,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.alert == null
                  ? 'Your next selling signal.'
                  : 'Edit price alert',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 20),
            DropField(
              label: 'Crop',
              value: cropId,
              options: {for (final c in widget.store.crops) c.id: c.name},
              onChanged: (v) => setState(() => cropId = v),
            ),
            const SizedBox(height: 14),
            DropField(
              label: 'Market',
              value: marketId,
              options: {for (final m in widget.store.markets) m.id: m.name},
              onChanged: (v) => setState(() => marketId = v),
            ),
            const SizedBox(height: 14),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'Above', label: Text('At or above ≥')),
                ButtonSegment(value: 'Below', label: Text('At or below ≤')),
              ],
              selected: {condition},
              onSelectionChanged: (s) => setState(() => condition = s.first),
            ),
            const SizedBox(height: 18),
            TextFormField(
              controller: target,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                labelText: 'Target price (PKR / maund)',
              ),
              validator: (v) {
                final n = double.tryParse(v ?? '');
                return n == null || !n.isFinite || n <= 0 || n > 1e10
                    ? 'Enter a price > 0, up to 10 billion'
                    : null;
              },
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Active alert'),
              value: active,
              onChanged: (v) => setState(() => active = v),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: busy ? null : save,
                child: Text(busy ? 'Saving…' : 'Save alert'),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
