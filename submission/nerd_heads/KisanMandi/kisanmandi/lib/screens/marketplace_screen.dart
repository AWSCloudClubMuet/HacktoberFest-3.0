import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/listing_model.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/format.dart';
import 'listing_form_screen.dart';
import 'package:url_launcher/url_launcher.dart';

enum ListingSort { newest, priceAsc }

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  String _search = '';
  String? _filterCrop;
  String? _filterDistrict;
  String? _filterGrade;
  ListingSort _sort = ListingSort.newest;

  List<Listing> _apply(List<Listing> all, AppState state) {
    final q = _search.trim().toLowerCase();
    var result = all.where((l) {
      if (l.status != 'Active') return false;
      if (_filterCrop != null && l.cropId != _filterCrop) return false;
      if (_filterDistrict != null && l.district != _filterDistrict) {
        return false;
      }
      if (_filterGrade != null && l.grade != _filterGrade) return false;
      if (q.isNotEmpty) {
        final cropName =
            state.cropById(l.cropId)?.name.toLowerCase() ?? '';
        final haystack =
            '$cropName ${l.district.toLowerCase()} ${l.grade.toLowerCase()}';
        if (!haystack.contains(q)) return false;
      }
      return true;
    }).toList();
    if (_sort == ListingSort.priceAsc) {
      result.sort((a, b) => a.askingPrice.compareTo(b.askingPrice));
    } else {
      result.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    }
    return result;
  }

  int get _activeFilterCount => (_filterCrop != null ? 1 : 0) +
      (_filterDistrict != null ? 1 : 0) +
      (_filterGrade != null ? 1 : 0);

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final state = context.watch<AppState>();
    final listings = _apply(state.listings, state);
    final districts = state.listings
        .map((l) => l.district)
        .toSet()
        .toList()
      ..sort();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketplace'),
        actions: [
          IconButton(
            tooltip: 'Filters',
            onPressed: () => _showFilters(districts),
            icon: Badge(
              isLabelVisible: _activeFilterCount > 0,
              label: Text('$_activeFilterCount'),
              child: const Icon(Icons.tune),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: const InputDecoration(
                hintText: 'Search produce, district, grade…',
                prefixIcon: Icon(Icons.search),
                isDense: true,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Row(
              children: [
                Text(
                  '${listings.length} listings',
                  style: const TextStyle(
                      fontSize: 12, color: Colors.grey),
                ),
                const Spacer(),
                DropdownButton<ListingSort>(
                  value: _sort,
                  isDense: true,
                  underline: const SizedBox.shrink(),
                  items: const [
                    DropdownMenuItem(
                        value: ListingSort.newest,
                        child: Text('Newest', style: TextStyle(fontSize: 12.5))),
                    DropdownMenuItem(
                        value: ListingSort.priceAsc,
                        child:
                            Text('Price ↑', style: TextStyle(fontSize: 12.5))),
                  ],
                  onChanged: (v) {
                    if (v != null) setState(() => _sort = v);
                  },
                ),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => state.refreshListings(),
              child: listings.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        Icon(Icons.storefront, size: 48, color: Colors.grey),
                        SizedBox(height: 8),
                        Center(child: Text('No listings match your filters')),
                      ],
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.fromLTRB(12, 4, 12, 24),
                      gridDelegate:
                          const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 320,
                        mainAxisExtent: 218,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: listings.length,
                      itemBuilder: (context, i) => _ListingCard(
                        listing: listings[i],
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showFilters(List<String> districts) async {
    final state = context.read<AppState>();
    var crop = _filterCrop;
    var district = _filterDistrict;
    var grade = _filterGrade;
    var sort = _sort;

    final result = await showModalBottomSheet<Map<String, Object?>>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Filter listings',
                  style: Theme.of(ctx).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String?>(
                initialValue: crop,
                decoration: const InputDecoration(labelText: 'Crop'),
                items: [
                  const DropdownMenuItem(
                      value: null, child: Text('All crops')),
                  ...state.crops.map((c) => DropdownMenuItem(
                      value: c.id, child: Text(c.name))),
                ],
                onChanged: (v) => setSheet(() => crop = v),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                initialValue: district,
                decoration: const InputDecoration(labelText: 'District'),
                items: [
                  const DropdownMenuItem(
                      value: null, child: Text('All districts')),
                  ...districts.map((d) =>
                      DropdownMenuItem(value: d, child: Text(d))),
                ],
                onChanged: (v) => setSheet(() => district = v),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                initialValue: grade,
                decoration: const InputDecoration(labelText: 'Grade'),
                items: const [
                  DropdownMenuItem(value: null, child: Text('All grades')),
                  DropdownMenuItem(value: 'A', child: Text('Grade A')),
                  DropdownMenuItem(value: 'B', child: Text('Grade B')),
                  DropdownMenuItem(value: 'C', child: Text('Grade C')),
                ],
                onChanged: (v) => setSheet(() => grade = v),
              ),
              const SizedBox(height: 12),
              SegmentedButton<ListingSort>(
                segments: const [
                  ButtonSegment(
                      value: ListingSort.newest, label: Text('Newest')),
                  ButtonSegment(
                      value: ListingSort.priceAsc, label: Text('Price ↑')),
                ],
                selected: {sort},
                onSelectionChanged: (s) => setSheet(() => sort = s.first),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setSheet(() {
                        crop = null;
                        district = null;
                        grade = null;
                      }),
                      child: const Text('Clear'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.pop(ctx, {
                        'crop': crop,
                        'district': district,
                        'grade': grade,
                        'sort': sort.index,
                      }),
                      child: const Text('Apply'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
    if (result != null && mounted) {
      setState(() {
        _filterCrop = result['crop'] as String?;
        _filterDistrict = result['district'] as String?;
        _filterGrade = result['grade'] as String?;
        _sort = ListingSort.values[result['sort'] as int];
      });
    }
  }
}

class _ListingCard extends StatelessWidget {
  final Listing listing;
  const _ListingCard({required this.listing});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final crop = state.cropById(listing.cropId);
    final avg = state.marketAverageFor(listing.cropId);
    final isMine = listing.userId == state.user?.id;

    return Card(
      child: InkWell(
        onTap: () => showListingDetailSheet(context, listing),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      crop?.name ?? listing.cropId,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 14.5),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  _GradeChip(grade: listing.grade),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                '${listing.district} · ${listing.quantity.toStringAsFixed(0)} × 40 kg',
                style: const TextStyle(fontSize: 11.5, color: Colors.grey),
              ),
              const Spacer(),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: Text(
                      formatRupees(listing.askingPrice),
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 17),
                    ),
                  ),
                  Text('/ 40 kg',
                      style:
                          TextStyle(fontSize: 10, color: Colors.grey.shade600)),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  if (isMine)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text('Yours',
                          style: TextStyle(
                              fontSize: 9.5,
                              color: Colors.blue.shade800,
                              fontWeight: FontWeight.w600)),
                    ),
                  if (isMine) const SizedBox(width: 6),
                  Expanded(
                    child: PriceComparisonBadge(
                        askingPrice: listing.askingPrice, marketAvg: avg),
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

class _GradeChip extends StatelessWidget {
  final String grade;
  const _GradeChip({required this.grade});

  @override
  Widget build(BuildContext context) {
    final color = switch (grade) {
      'A' => Colors.green,
      'B' => Colors.amber,
      _ => Colors.blueGrey,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.shade100,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        'Grade $grade',
        style: TextStyle(
            fontSize: 10, fontWeight: FontWeight.w700, color: color.shade800),
      ),
    );
  }
}

/// "Below market" / "At market" / "Above market" badge.
class PriceComparisonBadge extends StatelessWidget {
  final double askingPrice;
  final double? marketAvg;
  const PriceComparisonBadge(
      {super.key, required this.askingPrice, required this.marketAvg});

  @override
  Widget build(BuildContext context) {
    if (marketAvg == null || marketAvg == 0) {
      return const Text('No market data',
          style: TextStyle(fontSize: 10, color: Colors.grey));
    }
    final ratio = askingPrice / marketAvg!;
    final Color color;
    final String label;
    if (ratio < 0.95) {
      color = Colors.green.shade700;
      label = 'Below market';
    } else if (ratio > 1.05) {
      color = AppTheme.danger;
      label = 'Above market';
    } else {
      color = Colors.orange.shade800;
      label = 'At market';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        label,
        style:
            TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }
}

Future<void> showListingDetailSheet(BuildContext context, Listing listing) {
  final state = context.read<AppState>();
  final crop = state.cropById(listing.cropId);
  final avg = state.marketAverageFor(listing.cropId);
  final isMine = listing.userId == state.user?.id;

  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      child: StatefulBuilder(
        builder: (ctx, setSheet) {
          final current = state.listings
                  .where((l) => l.id == listing.id)
                  .toList().isNotEmpty
              ? state.listings.firstWhere((l) => l.id == listing.id)
              : listing;
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      crop?.name ?? current.cropId,
                      style: Theme.of(ctx)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ),
                  _GradeChip(grade: current.grade),
                  if (current.status == 'Sold') ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('SOLD',
                          style: TextStyle(
                              fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    _DetailRow(
                        label: 'Asking price',
                        value:
                            '${formatRupees(current.askingPrice)} / 40 kg'),
                    _DetailRow(
                        label: 'Quantity',
                        value:
                            '${current.quantity.toStringAsFixed(0)} × 40 kg'),
                    _DetailRow(
                        label: 'Total value',
                        value: formatRupees(
                            current.quantity * current.askingPrice)),
                    _DetailRow(label: 'District', value: current.district),
                    _DetailRow(
                        label: 'Available from',
                        value: formatDateShort(current.availableFrom)),
                    _DetailRow(label: 'Phone', value: current.contactPhone),
                    if (avg != null)
                      _DetailRow(
                        label: 'Market avg today',
                        value: formatRupees(avg),
                        trailing: PriceComparisonBadge(
                            askingPrice: current.askingPrice, marketAvg: avg),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                          backgroundColor: AppTheme.seed),
                      icon: const Icon(Icons.call, size: 18),
                      label: const Text('Call'),
                      onPressed: () async {
                        final uri = Uri.parse(
                            'tel:${telNumber(current.contactPhone)}');
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF25D366)),
                      icon: const Icon(Icons.chat, size: 18),
                      label: const Text('WhatsApp'),
                      onPressed: () async {
                        final text = Uri.encodeComponent(
                            'Hello, I saw your listing for '
                            '${crop?.name ?? current.cropId} on KisanMandi.');
                        final uri = Uri.parse(
                            'https://wa.me/${whatsappNumber(current.contactPhone)}?text=$text');
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(
                              uri, mode: LaunchMode.externalApplication);
                        }
                      },
                    ),
                  ),
                ],
              ),
              if (isMine) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.edit, size: 18),
                        label: const Text('Edit'),
                        onPressed: () {
                          Navigator.pop(ctx);
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  ListingFormScreen(existing: current),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.check_circle_outline, size: 18),
                        label: Text(current.isActive
                            ? 'Mark Sold'
                            : 'Reopen'),
                        onPressed: () async {
                          await state.toggleListingSold(current);
                          setSheet(() {});
                          if (ctx.mounted) Navigator.pop(ctx);
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    IconButton.outlined(
                      style: IconButton.styleFrom(
                          foregroundColor: AppTheme.danger),
                      icon: const Icon(Icons.delete_outline, size: 20),
                      onPressed: () async {
                        final confirm = await showDialog<bool>(
                          context: ctx,
                          builder: (d) => AlertDialog(
                            title: const Text('Delete listing?'),
                            actions: [
                              TextButton(
                                  onPressed: () =>
                                      Navigator.pop(d, false),
                                  child: const Text('Cancel')),
                              FilledButton(
                                style: FilledButton.styleFrom(
                                    backgroundColor: AppTheme.danger),
                                onPressed: () => Navigator.pop(d, true),
                                child: const Text('Delete'),
                              ),
                            ],
                          ),
                        );
                        if (confirm == true) {
                          await state.deleteListing(current.id);
                          if (ctx.mounted) Navigator.pop(ctx);
                        }
                      },
                    ),
                  ],
                ),
              ],
            ],
          );
        },
      ),
    ),
  );
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Widget? trailing;
  const _DetailRow(
      {required this.label, required this.value, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(label,
                style:
                    const TextStyle(fontSize: 12, color: Colors.grey)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w600)),
          ),
          ?trailing,
        ],
      ),
    );
  }
}
