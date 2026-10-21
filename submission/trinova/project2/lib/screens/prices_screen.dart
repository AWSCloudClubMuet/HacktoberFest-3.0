import 'package:flutter/material.dart';

import '../app_state.dart';
import '../models.dart';
import '../utils.dart';
import 'crop_detail_screen.dart';
import 'profit_screen.dart';

class PricesScreen extends StatefulWidget {
  const PricesScreen({super.key});

  @override
  State<PricesScreen> createState() => _PricesScreenState();
}

class _PricesScreenState extends State<PricesScreen> {
  final _searchController = TextEditingController();
  String _query = '';
  String? _category;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _signOut() async {
    final ok = await confirm(context, 'Change profile?',
        'You will go back to the sign-up screen to choose a profile again.',
        action: 'Continue');
    if (ok) await appState.signOut();
  }

  Widget _messageList(Widget child) => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [const SizedBox(height: 100), Center(child: child)],
      );

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, _) {
        final marketId = appState.selectedMarketId;
        final crops = appState.crops.where((c) {
          final nameOk = c.name.toLowerCase().contains(_query.toLowerCase());
          final catOk = _category == null || c.category == _category;
          return nameOk && catOk;
        }).toList();

        Widget body;
        if (appState.crops.isEmpty && appState.loading) {
          body = _messageList(const CircularProgressIndicator());
        } else if (appState.crops.isEmpty) {
          body = _messageList(Column(children: [
            Text(appState.error ?? 'No data yet.', textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton(
                onPressed: appState.refresh, child: const Text('Retry')),
          ]));
        } else if (crops.isEmpty || marketId == null) {
          body = _messageList(const Text('No crops match your search.'));
        } else {
          body = ListView.builder(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
            itemCount: crops.length,
            itemBuilder: (_, i) => _PriceRow(crop: crops[i], marketId: marketId),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: const Text('Prices'),
            actions: [
              IconButton(
                tooltip: 'Profit calculator',
                icon: const Icon(Icons.calculate_outlined),
                onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const ProfitScreen())),
              ),
              IconButton(
                tooltip: 'Change profile',
                icon: const Icon(Icons.logout),
                onPressed: _signOut,
              ),
            ],
          ),
          body: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
                child: DropdownButtonFormField<String>(
                  key: ValueKey(marketId),
                  initialValue: marketId,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Market',
                    prefixIcon: Icon(Icons.store_mall_directory_outlined),
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: [
                    for (final m in appState.markets)
                      DropdownMenuItem(
                          value: m.id, child: Text('${m.name} (${m.district})')),
                  ],
                                    onChanged: appState.selectMarket,
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search crops',
                    prefixIcon: const Icon(Icons.search),
                    border: const OutlineInputBorder(),
                    isDense: true,
                    suffixIcon: _query.isEmpty
                        ? null
                        : IconButton(
                            tooltip: 'Clear',
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _query = '');
                            },
                          ),
                  ),
                  onChanged: (v) => setState(() => _query = v),
                ),
              ),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: const Text('All'),
                        selected: _category == null,
                        onSelected: (_) => setState(() => _category = null),
                      ),
                    ),
                    for (final c in appState.categories)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(c),
                          selected: _category == c,
                          onSelected: (_) => setState(() => _category = c),
                        ),
                      ),
                  ],
                ),
              ),
              if (appState.error != null && appState.crops.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text('Could not refresh: ${appState.error}',
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.error)),
                ),
              if (appState.latestDate.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                        'Prices as of ${fullDate(appState.latestDate)} · Rs per 40 kg',
                        style: Theme.of(context).textTheme.bodySmall),
                  ),
                ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: appState.refresh,
                  child: body,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PriceRow extends StatelessWidget {
  final Crop crop;
  final String marketId;
  const _PriceRow({required this.crop, required this.marketId});

  @override
  Widget build(BuildContext context) {
    final latest = appState.latestPrice(crop.id, marketId);
    final prev = appState.previousPrice(crop.id, marketId);
    final textTheme = Theme.of(context).textTheme;

    Widget trailing;
    if (latest == null) {
      trailing = const Text('No price');
    } else {
      final diff = prev == null ? 0.0 : latest - prev;
      final pct = (prev == null || prev == 0) ? 0.0 : diff / prev * 100;
      final color = diff > 0
          ? Colors.green.shade800
          : (diff < 0 ? Colors.red.shade700 : Colors.grey.shade700);
      final icon = diff > 0
          ? Icons.arrow_drop_up
          : (diff < 0 ? Icons.arrow_drop_down : Icons.remove);
      trailing = Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(money(latest),
              style: textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.bold)),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 22),
              Text(changeText(diff, pct),
                  style: TextStyle(
                      color: color, fontSize: 12, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      );
    }

    return Card(
      child: ListTile(
        title: Text(crop.name,
            style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        subtitle: Text(crop.category),
        trailing: trailing,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
              builder: (_) =>
                  CropDetailScreen(cropId: crop.id, marketId: marketId)),
        ),
      ),
    );
  }
}