import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_service.dart';
import '../services/app_state.dart';
import '../utils/constants.dart';
import '../utils/format.dart';
import '../utils/theme.dart';
import '../widgets/brand.dart';
import '../widgets/common.dart';
import '../widgets/price_chart.dart';
import 'trends_screen.dart';

class PricesScreen extends StatefulWidget {
  const PricesScreen({super.key});

  @override
  State<PricesScreen> createState() => _PricesScreenState();
}

class _PricesScreenState extends State<PricesScreen> {
  final TextEditingController searchController = TextEditingController();
  String searchText = '';
  String selectedCategory = kAll;
  int selectedMarketId = 0;

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

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
      final local = getCropLocalName(crop.name).toLowerCase();
      final nameMatches =
          crop.name.toLowerCase().contains(search) || local.contains(search);

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
      color: AppColors.green,
      onRefresh: () => refreshData(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 20),
        children: [
          buildSearchBox(),
          const SizedBox(height: 16),
          buildQuickPick(app),
          const SizedBox(height: 16),
          buildCategoryChips(app),
          const SizedBox(height: 10),
          buildMarketChips(app),
          const SizedBox(height: 16),
          InfoStrip(
            icon: Icons.calendar_today_rounded,
            text: 'Rates as of ${fmtDate(app.latestDate)}',
            trailing: 'Rs per maund (40 kg)',
          ),
          const SizedBox(height: 14),
          SectionTitle(
            'My Crops',
            trailing: Text(
              '${crops.length} crops',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.muted,
              ),
            ),
          ),
          const SizedBox(height: 10),
          if (crops.isEmpty)
            const EmptyView('No crops match your search.',
                icon: Icons.search_off_rounded),
          ...cropTiles,
          const SizedBox(height: 8),
          Center(
            child: TextButton.icon(
              onPressed: simulatePrices,
              icon: const Icon(Icons.autorenew_rounded, size: 17),
              label: const Text('Simulate price update'),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.muted,
                textStyle: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildSearchBox() {
    return AppSearchField(
      controller: searchController,
      hint: 'Search crop (e.g. Wheat, گندم)',
      hasText: searchText.isNotEmpty,
      onClear: () {
        searchController.clear();
        setState(() {
          searchText = '';
        });
      },
      onChanged: (value) {
        setState(() {
          searchText = value;
        });
      },
    );
  }

  Widget buildQuickPick(AppState app) {
    if (app.crops.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 98,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        itemCount: app.crops.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (context, i) {
          final crop = app.crops[i];
          final name = crop.name.split(' ').first;
          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => TrendsScreen(
                    initialCropId: crop.id,
                    initialMarketId: selectedMarketId == 0 ? null : selectedMarketId,
                    showAppBar: true,
                  ),
                ),
              );
            },
            child: SizedBox(
              width: 68,
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(2.5),
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.goldGradient,
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                          color: Colors.white, shape: BoxShape.circle),
                      child: CropPhoto(
                          cropName: crop.name, size: 56, circle: true),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget buildCategoryChips(AppState app) {
    return HScroll(
      children: [
        for (final category in getCategories(app))
          PillChip(
            label: category,
            selected: selectedCategory == category,
            onTap: () {
              setState(() {
                selectedCategory = category;
              });
            },
          ),
      ],
    );
  }

  Widget buildMarketChips(AppState app) {
    return HScroll(
      children: [
        PillChip(
          icon: Icons.public_rounded,
          label: 'All markets (avg)',
          selected: selectedMarketId == 0,
          onTap: () {
            setState(() {
              selectedMarketId = 0;
            });
          },
        ),
        for (final market in app.markets)
          PillChip(
            icon: Icons.place_outlined,
            label: market.name,
            selected: selectedMarketId == market.id,
            onTap: () {
              setState(() {
                selectedMarketId = market.id;
              });
            },
          ),
      ],
    );
  }
}

class CropTile extends StatelessWidget {
  const CropTile({super.key, required this.crop, required this.marketId});

  final Crop crop;
  final int? marketId;

  IconData getCategoryIcon() {
    if (crop.category == 'Grain') return Icons.grass_rounded;
    if (crop.category == 'Cash Crop') return Icons.spa_rounded;
    if (crop.category == 'Vegetable') return Icons.eco_rounded;
    if (crop.category == 'Fruit') return Icons.local_florist_rounded;
    return Icons.eco_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);

    final price = app.todayPrice(crop.id, marketId);
    final change = app.dailyChange(crop.id, marketId);
    final series = app.series(crop.id, marketId);
    final spark = series.length > 8 ? series.sublist(series.length - 8) : series;

    Color pillBg = const Color(0xFFF0F2EF);
    Color pillFg = AppColors.muted;
    IconData? arrow;
    Color sparkColor = AppColors.muted;
    if (change != null && change.abs > 0) {
      pillBg = AppColors.upSoft;
      pillFg = AppColors.up;
      arrow = Icons.arrow_drop_up_rounded;
      sparkColor = AppColors.up;
    } else if (change != null && change.abs < 0) {
      pillBg = AppColors.downSoft;
      pillFg = AppColors.down;
      arrow = Icons.arrow_drop_down_rounded;
      sparkColor = AppColors.down;
    }

    String priceText = 'N/A';
    if (price != null) {
      priceText = fmtRs(price);
    }

    final local = getCropLocalName(crop.name);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        elevation: 0,
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
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
          child: Ink(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
              boxShadow: AppShadows.soft,
            ),
            child: Row(
              children: [
                CropPhoto(
                  cropName: crop.name,
                  size: 62,
                  radius: 20,
                  icon: getCategoryIcon(),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        crop.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        local.isNotEmpty ? local : crop.category,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 12.5, color: AppColors.muted),
                      ),
                      const SizedBox(height: 6),
                      Tag(crop.category,
                          bg: AppColors.goldSoft, fg: AppColors.goldDark),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      priceText,
                      style: const TextStyle(
                        fontSize: 16.5,
                        fontWeight: FontWeight.w900,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 4),
                    if (spark.length > 1)
                      MiniSpark(points: spark, color: sparkColor),
                    const SizedBox(height: 4),
                    if (change != null)
                      Container(
                        padding: const EdgeInsets.fromLTRB(2, 2, 8, 2),
                        decoration: BoxDecoration(
                          color: pillBg,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (arrow != null)
                              Icon(arrow, size: 18, color: pillFg)
                            else
                              const SizedBox(width: 6),
                            Text(
                              fmtPct(change.pct),
                              style: TextStyle(
                                color: pillFg,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      const Text(
                        'per maund',
                        style:
                            TextStyle(color: AppColors.muted, fontSize: 11),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
