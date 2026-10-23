import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_service.dart';
import '../services/app_state.dart';
import '../utils/constants.dart';
import '../utils/format.dart';
import '../utils/theme.dart';
import '../widgets/common.dart';

Future<void> runAlertAction(
  BuildContext context,
  Future<void> Function() action, [
  String? successMessage,
]) async {
  try {
    await action();
    if (successMessage != null && context.mounted) {
      showSnack(context, successMessage);
    }
  } on ApiException catch (e) {
    if (context.mounted) {
      showSnack(context, e.message);
    }
  }
}

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  List<PriceAlert> getSortedAlerts(AppState app) {
    final List<PriceAlert> alerts = List.from(app.alerts);

    alerts.sort((a, b) {
      final aTriggered = app.isTriggered(a);
      final bTriggered = app.isTriggered(b);

      if (aTriggered && !bTriggered) {
        return -1;
      }
      if (!aTriggered && bTriggered) {
        return 1;
      }
      return (b.id ?? 0).compareTo(a.id ?? 0);
    });

    return alerts;
  }

  void openNewAlertSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => const NewAlertSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final alerts = getSortedAlerts(app);

    final List<Widget> cards = [];
    for (final alert in alerts) {
      cards.add(AlertCard(alert: alert));
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => openNewAlertSheet(context),
        icon: const Icon(Icons.add_alert_rounded),
        label: const Text('New alert'),
      ),
      body: RefreshIndicator(
        color: AppColors.green,
        onRefresh: () => refreshData(context),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 96),
          children: [
            InfoStrip(
              icon: app.triggeredCount > 0
                  ? Icons.notifications_active_rounded
                  : Icons.notifications_none_rounded,
              bg: app.triggeredCount > 0 ? AppColors.goldSoft : AppColors.greenSoft,
              fg: app.triggeredCount > 0 ? AppColors.goldDark : AppColors.greenDark,
              text:
                  '${app.triggeredCount} triggered at prices of ${fmtDate(app.latestDate)}',
              trailing: 'Re-checked on refresh',
            ),
            const SizedBox(height: 8),
            if (alerts.isEmpty)
              const EmptyView('No alerts yet.\nTap "New alert" to create one.',
                  icon: Icons.notifications_none_rounded),
            ...cards,
          ],
        ),
      ),
    );
  }
}

class AlertCard extends StatelessWidget {
  const AlertCard({super.key, required this.alert});

  final PriceAlert alert;

  Future<void> deleteAlert(
    BuildContext context,
    AppState app,
    String title,
  ) async {
    final confirmed = await confirmDialog(context, 'Delete alert?', title);

    if (confirmed && context.mounted) {
      await runAlertAction(
        context,
        () => app.deleteAlert(alert),
        'Alert deleted',
      );
    }
  }

  Widget buildTriggeredBox(double currentPrice) {
    final conditionText = alert.isAbove ? 'at or above' : 'at or below';

    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.goldSoft,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gold),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.notifications_active, size: 18, color: AppColors.goldDark),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'TRIGGERED: ${fmtRs(currentPrice)} is $conditionText target ${fmtRs(alert.targetPrice)}',
              style: const TextStyle(
                color: AppColors.goldDark,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final textTheme = Theme.of(context).textTheme;

    String cropName = 'Crop';
    final crop = app.cropById(alert.cropId);
    if (crop != null) {
      final local = getCropLocalName(crop.name);
      cropName = local.isNotEmpty ? '${crop.name} ($local)' : crop.name;
    }

    String marketName = 'Market';
    final market = app.marketById(alert.marketId);
    if (market != null) {
      marketName = market.name;
    }

    final title = '$cropName - $marketName';
    final currentPrice = app.todayPrice(alert.cropId, alert.marketId);
    final isTriggered = app.isTriggered(alert);

    String currentText = 'Current: N/A';
    if (currentPrice != null) {
      currentText = 'Current: ${fmtRs(currentPrice)}';
    }
    if (!alert.active) {
      currentText = '$currentText (off)';
    }

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: isTriggered ? AppColors.goldSoft : AppColors.greenSoft,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isTriggered
                        ? Icons.notifications_active_rounded
                        : Icons.notifications_none_rounded,
                    color: isTriggered ? AppColors.goldDark : AppColors.green,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                ),
                Switch(
                  value: alert.active,
                  onChanged: (value) {
                    runAlertAction(
                      context,
                      () => app.setAlertActive(alert, value),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: alert.isAbove ? AppColors.greenSoft : AppColors.infoSoft,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    alert.isAbove ? 'ABOVE' : 'BELOW',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: alert.isAbove ? AppColors.up : AppColors.info,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Target: ${fmtRs(alert.targetPrice)}',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.ink),
                ),
                const Spacer(),
                Text(currentText, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
              ],
            ),
            if (isTriggered && currentPrice != null)
              buildTriggeredBox(currentPrice),
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => deleteAlert(context, app, title),
                icon: const Icon(Icons.delete_outline_rounded, size: 17, color: AppColors.down),
                label: const Text(
                  'Delete',
                  style: TextStyle(color: AppColors.down, fontSize: 13),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class NewAlertSheet extends StatefulWidget {
  const NewAlertSheet({super.key});

  @override
  State<NewAlertSheet> createState() => _NewAlertSheetState();
}

class _NewAlertSheetState extends State<NewAlertSheet> {
  final formKey = GlobalKey<FormState>();
  final targetController = TextEditingController();

  int selectedCropId = 0;
  int selectedMarketId = 0;
  String selectedCondition = 'above';
  bool isSaving = false;

  @override
  void initState() {
    super.initState();
    final app = AppScope.read(context);
    selectedCropId = app.crops.first.id;
    selectedMarketId = app.markets.first.id;
  }

  @override
  void dispose() {
    targetController.dispose();
    super.dispose();
  }

  String? validateTargetPrice(String? value) {
    final number = double.tryParse((value ?? '').trim());
    if (number == null || number <= 0) {
      return 'Enter a price above 0';
    }
    return null;
  }

  Future<void> saveAlert() async {
    if (!formKey.currentState!.validate()) {
      return;
    }

    final app = AppScope.read(context);

    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    setState(() {
      isSaving = true;
    });

    try {
      await app.createAlert(
        PriceAlert(
          userId: app.user!.id,
          cropId: selectedCropId,
          marketId: selectedMarketId,
          condition: selectedCondition,
          targetPrice: double.parse(targetController.text.trim()),
          active: true,
          createdAt: DateTime.now().toIso8601String(),
        ),
      );

      navigator.pop();
      messenger.showSnackBar(
        const SnackBar(content: Text('Alert created')),
      );
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          isSaving = false;
        });
        showSnack(context, e.message);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);

    final currentPrice = app.todayPrice(selectedCropId, selectedMarketId);
    String? hintText;
    if (currentPrice != null) {
      hintText = 'Current price: ${fmtRs(currentPrice)}';
    }

    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        14,
        20,
        24 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Form(
        key: formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  margin: const EdgeInsets.only(bottom: 18),
                  decoration: BoxDecoration(
                    color: AppColors.line,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                        color: AppColors.goldSoft, shape: BoxShape.circle),
                    child: const Icon(Icons.add_alert_rounded,
                        size: 21, color: AppColors.goldDark),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'New price alert',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              buildCropDropdown(app),
              const SizedBox(height: 12),
              buildMarketDropdown(app),
              const SizedBox(height: 12),
              buildConditionButtons(),
              const SizedBox(height: 12),
              TextFormField(
                controller: targetController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: 'Target price (Rs / maund)',
                  helperText: hintText,
                ),
                validator: validateTargetPrice,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: isSaving ? null : saveAlert,
                child: const Text('Create alert'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildCropDropdown(AppState app) {
    final List<DropdownMenuItem<int>> items = [];
    for (final crop in app.crops) {
      final local = getCropLocalName(crop.name);
      final label = local.isNotEmpty ? '${crop.name} ($local)' : crop.name;
      items.add(DropdownMenuItem(value: crop.id, child: Text(label)));
    }

    return LabeledDropdown<int>(
      label: 'Crop',
      value: selectedCropId,
      items: items,
      onChanged: (value) {
        setState(() {
          selectedCropId = value ?? selectedCropId;
        });
      },
    );
  }

  Widget buildMarketDropdown(AppState app) {
    final List<DropdownMenuItem<int>> items = [];
    for (final market in app.markets) {
      items.add(DropdownMenuItem(value: market.id, child: Text(market.name)));
    }

    return LabeledDropdown<int>(
      label: 'Market',
      value: selectedMarketId,
      items: items,
      onChanged: (value) {
        setState(() {
          selectedMarketId = value ?? selectedMarketId;
        });
      },
    );
  }

  Widget buildConditionButtons() {
    return SegmentedButton<String>(
      segments: const [
        ButtonSegment(
          value: 'above',
          label: Text('Above'),
          icon: Icon(Icons.arrow_upward),
        ),
        ButtonSegment(
          value: 'below',
          label: Text('Below'),
          icon: Icon(Icons.arrow_downward),
        ),
      ],
      selected: {selectedCondition},
      onSelectionChanged: (selection) {
        setState(() {
          selectedCondition = selection.first;
        });
      },
    );
  }
}
