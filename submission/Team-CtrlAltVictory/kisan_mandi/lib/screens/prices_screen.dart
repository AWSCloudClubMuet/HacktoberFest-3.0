import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_service.dart';
import '../services/app_state.dart';
import '../utils/constants.dart';
import '../utils/format.dart';
import '../widgets/common.dart';
import 'trends_screen.dart';

class PricesScreen extends StatefulWidget {
  const PricesScreen({super.key});

  @override
  State<PricesScreen> createState() => _PricesScreenState();
}

class _PricesScreenState extends State<PricesScreen> {
  String searchText = '';
  String selectedCategory = kAll;
  int selectedMarketId = 0;

  Future<void> simulatePrices() async {
    final app = AppScope.read(context);
    try {
      await app.simulatePriceMove();
      if (mounted) {
        showSnack(context, 'Market prices updated. Alerts re-evaluated.');
      }
    } on ApiException catch (e) {
      if (mounted) {
        showSnack(context, e.message);
      }
    }
  }

  List<Crop> getFilteredCrops(AppState app) {
    final search = searchText.trim().toLowerCase();
    final List<Crop> result = [];

    for (final crop in app.crops) {
      final categoryMatches =
          selectedCategory == kAll || crop.category == selectedCategory;
      final nameMatches = crop.name.toLowerCase().contains(search);

      if (categoryMatches && nameMatches) {
        result.add(crop);
      }
    }
    return result;
  }

  List<String> getCategories(AppState app) {
    final List<String> categories = [kAll];
    for (final crop in app.crops) {
      if (!categories.contains(crop.category)) {
        categories.add(crop.category);
      }
    }
    return categories;
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final crops = getFilteredCrops(app);

    int? marketId;
    if (selectedMarketId != 0) {
      marketId = selectedMarketId;
    }

    final List<Widget> cropTiles = [];
    for (final crop in crops) {
      cropTiles.add(CropTile(crop: crop, marketId: marketId));
    }

    return RefreshIndicator(
      onRefresh: () => refreshData(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          buildSearchBox(),
          const SizedBox(height: 12),
          buildCategoryChips(app),
          const SizedBox(height: 4),
          buildMarketChips(app),
          const SizedBox(height: 8),
          Text(
            'Prices as of ${fmtDate(app.latestDate)} - Rs per maund (40 kg)',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 8),
          if (crops.isEmpty) const EmptyView('No crops match your search.'),
          ...cropTiles,
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: simulatePrices,
            icon: const Icon(Icons.refresh),
            label: const Text('Simulate price update'),
          ),
        ],
      ),
    );
  }

  Widget buildSearchBox() {
    return TextField(
      decoration: const InputDecoration(
        prefixIcon: Icon(Icons.search),
        hintText: 'Search crop',
        border: OutlineInputBorder(),
      ),
      onChanged: (value) {
        setState(() {
          searchText = value;
        });
      },
    );
  }

  Widget buildCategoryChips(AppState app) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final category in getCategories(app))
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(category),
                selected: selectedCategory == category,
                onSelected: (_) {
                  setState(() {
                    selectedCategory = category;
                  });
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget buildMarketChips(AppState app) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: const Text('All markets (avg)'),
              selected: selectedMarketId == 0,
              onSelected: (_) {
                setState(() {
                  selectedMarketId = 0;
                });
              },
            ),
          ),
          for (final market in app.markets)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(market.name),
                selected: selectedMarketId == market.id,
                onSelected: (_) {
                  setState(() {
                    selectedMarketId = market.id;
                  });
                },
              ),
            ),
        ],
      ),
    );
  }
}

class CropTile extends StatelessWidget {
  const CropTile({super.key, required this.crop, required this.marketId});

  final Crop crop;
  final int? marketId;

  IconData getCategoryIcon() {
    if (crop.category == 'Grain') return Icons.grass;
    if (crop.category == 'Cash Crop') return Icons.spa;
    if (crop.category == 'Vegetable') return Icons.eco;
    if (crop.category == 'Fruit') return Icons.local_florist;
    return Icons.eco;
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final textTheme = Theme.of(context).textTheme;

    final price = app.todayPrice(crop.id, marketId);
    final change = app.dailyChange(crop.id, marketId);

    Color pillBg = const Color(0xFFF0F4EF);
    Color pillFg = const Color(0xFF556353);
    String arrow = '';
    if (change != null && change.abs > 0) {
      pillBg = const Color(0xFFE8F5E9);
      pillFg = const Color(0xFF2E7D32);
      arrow = '▲ ';
    } else if (change != null && change.abs < 0) {
      pillBg = const Color(0xFFFFEBEE);
      pillFg = const Color(0xFFC62828);
      arrow = '▼ ';
    }

    String priceText = 'N/A';
    if (price != null) {
      priceText = fmtRs(price);
    }

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TrendsScreen(
                initialCropId: crop.id,
                initialMarketId: marketId,
                showAppBar: true,
              ),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(getCategoryIcon(), color: const Color(0xFF1E6F3D), size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      crop.name,
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1B241B),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      crop.category,
                      style: const TextStyle(fontSize: 12, color: Color(0xFF6B7A6D)),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    priceText,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1B241B),
                    ),
                  ),
                  const SizedBox(height: 3),
                  if (change != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: pillBg,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '$arrow${fmtRs(change.abs, sign: true)} (${fmtPct(change.pct)})',
                        style: TextStyle(
                          color: pillFg,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    )
                  else
                    const Text(
                      'per maund',
                      style: TextStyle(color: Color(0xFF6B7A6D), fontSize: 11),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
