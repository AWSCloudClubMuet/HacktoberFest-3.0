import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/format.dart';
import 'crop_detail_screen.dart';

class PricesScreen extends StatefulWidget {
  const PricesScreen({super.key});

  @override
  State<PricesScreen> createState() => _PricesScreenState();
}

class _PricesScreenState extends State<PricesScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final state = context.watch<AppState>();
    final crops = state.filteredCrops;

    return Scaffold(
      appBar: AppBar(
        title: const Text('KisanMandi Prices'),
        actions: [
          if (state.user != null)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Chip(
                avatar: const Icon(Icons.person, size: 16, color: Colors.white),
                label: Text(
                  state.user!.name.split(' ').first,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
                backgroundColor: Colors.white24,
                side: BorderSide.none,
                padding: const EdgeInsets.symmetric(horizontal: 4),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          _MarketSelector(state: state),
          _SearchAndFilters(state: state),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => state.refreshPrices(),
              child: crops.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        Icon(Icons.search_off, size: 48, color: Colors.grey),
                        SizedBox(height: 8),
                        Center(child: Text('No crops match your filters')),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(12, 4, 12, 24),
                      itemCount: crops.length,
                      itemBuilder: (context, i) =>
                          _CropPriceCard(cropId: crops[i].id),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MarketSelector extends StatelessWidget {
  final AppState state;
  const _MarketSelector({required this.state});

  @override
  Widget build(BuildContext context) {
    if (state.markets.isEmpty) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      color: AppTheme.seed,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      child: DropdownButtonFormField<String>(
        initialValue: state.selectedMarketId,
        dropdownColor: AppTheme.seed,
        style: const TextStyle(color: Colors.white, fontSize: 15),
        iconEnabledColor: Colors.white,
        decoration: InputDecoration(
          filled: true,
          fillColor: Colors.white12,
          prefixIcon:
              const Icon(Icons.storefront, color: Colors.white, size: 20),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide.none,
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          labelText: 'Mandi',
          labelStyle: const TextStyle(color: Colors.white70, fontSize: 13),
        ),
        items: state.markets
            .map((m) => DropdownMenuItem(
                  value: m.id,
                  child: Text('${m.name} · ${m.district}'),
                ))
            .toList(),
        onChanged: (v) {
          if (v != null) state.setSelectedMarket(v);
        },
      ),
    );
  }
}

class _SearchAndFilters extends StatelessWidget {
  final AppState state;
  const _SearchAndFilters({required this.state});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      child: Column(
        children: [
          TextField(
            onChanged: state.setSearchQuery,
            decoration: const InputDecoration(
              hintText: 'Search crops…',
              prefixIcon: Icon(Icons.search),
              isDense: true,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: AppState.categories.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final cat = AppState.categories[i];
                final selected = state.categoryFilter == cat;
                return ChoiceChip(
                  label: Text(cat),
                  selected: selected,
                  onSelected: (_) => state.setCategory(cat),
                  selectedColor: AppTheme.seed,
                  labelStyle: TextStyle(
                    color: selected ? Colors.white : Colors.black87,
                    fontSize: 12.5,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CropPriceCard extends StatelessWidget {
  final String cropId;
  const _CropPriceCard({required this.cropId});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final crop = state.cropById(cropId);
    if (crop == null) return const SizedBox.shrink();
    final price = state.todayPriceValue(cropId);
    final change = state.priceChange(cropId);

    final MaterialColor categoryColor = switch (crop.category) {
      'Fibres' => Colors.brown,
      'Grains' => Colors.amber,
      'Vegetables' => Colors.green,
      'Fruits' => Colors.orange,
      _ => Colors.grey,
    };

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 5),
      child: InkWell(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => CropDetailScreen(cropId: cropId),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: categoryColor.shade100,
                child: Icon(
                  crop.category == 'Fruits'
                      ? Icons.apple
                      : crop.category == 'Vegetables'
                          ? Icons.eco
                          : Icons.grass,
                  color: categoryColor.shade700,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      crop.name,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      crop.category,
                      style: TextStyle(
                          fontSize: 11.5, color: categoryColor.shade700),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    price == null
                        ? '—'
                        : formatRupees(price),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const Text(
                    'per 40 kg',
                    style: TextStyle(fontSize: 10.5, color: Colors.grey),
                  ),
                  if (change != null) ...[
                    const SizedBox(height: 2),
                    _ChangeChip(abs: change.a, pct: change.b),
                  ],
                ],
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChangeChip extends StatelessWidget {
  final double abs;
  final double pct;
  const _ChangeChip({required this.abs, required this.pct});

  @override
  Widget build(BuildContext context) {
    final up = abs >= 0;
    final color = up ? Colors.green.shade700 : AppTheme.danger;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(up ? Icons.arrow_upward : Icons.arrow_downward,
              size: 11, color: color),
          const SizedBox(width: 2),
          Text(
            '${formatRupees(abs, showSign: true)} (${pct.abs().toStringAsFixed(1)}%)',
            style: TextStyle(
                fontSize: 11, color: color, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
