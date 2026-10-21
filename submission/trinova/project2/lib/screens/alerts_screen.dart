import 'package:flutter/material.dart';

import '../app_state.dart';
import '../models.dart';
import '../utils.dart';
import 'alert_form_screen.dart';

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, _) {
        final alerts = appState.myAlerts;
        return Scaffold(
          appBar: AppBar(title: const Text('Price alerts')),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AlertFormScreen())),
            icon: const Icon(Icons.add),
            label: const Text('New alert'),
          ),
          body: RefreshIndicator(
            onRefresh: appState.refresh,
            child: alerts.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: const [
                      SizedBox(height: 120),
                      Center(child: Text('No alerts yet. Tap "New alert".')),
                    ],
                  )
                : ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
                    itemCount: alerts.length,
                    itemBuilder: (_, i) => _AlertCard(alert: alerts[i]),
                  ),
          ),
        );
      },
    );
  }
}

class _AlertCard extends StatelessWidget {
  final AlertRule alert;
  const _AlertCard({required this.alert});

  Future<void> _toggle(BuildContext context, bool value) async {
    try {
      await appState.setAlertActive(alert, value);
    } catch (e) {
      if (context.mounted) showSnack(context, '$e');
    }
  }

  Future<void> _delete(BuildContext context) async {
    final ok = await confirm(
        context, 'Delete alert?', 'This alert will be removed permanently.');
    if (!ok) return;
    try {
      await appState.deleteAlert(alert);
    } catch (e) {
      if (context.mounted) showSnack(context, '$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final latest = appState.latestPrice(alert.cropId, alert.marketId);
    final triggered = alert.active && appState.isTriggered(alert);
    final scheme = Theme.of(context).colorScheme;
    return Card(
      color: triggered ? scheme.tertiaryContainer : null,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 12, 6, 6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${appState.cropName(alert.cropId)} · ${appState.marketName(alert.marketId)}',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                if (triggered)
                  const Padding(
                    padding: EdgeInsets.only(right: 8),
                    child: Chip(
                      avatar: Icon(Icons.notifications_active, size: 18),
                      label: Text('Triggered'),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
                '${alert.condition} ${money(alert.targetPrice)}   ·   Latest: ${latest == null ? '—' : money(latest)}'),
            Row(
              children: [
                Switch(
                    value: alert.active,
                    onChanged: (v) => _toggle(context, v)),
                Text(alert.active ? 'Active' : 'Paused'),
                const Spacer(),
                IconButton(
                  tooltip: 'Edit alert',
                  icon: const Icon(Icons.edit_outlined),
                  onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => AlertFormScreen(existing: alert))),
                ),
                IconButton(
                  tooltip: 'Delete alert',
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () => _delete(context),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}