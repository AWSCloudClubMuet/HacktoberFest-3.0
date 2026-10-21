import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/listing_model.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/format.dart';
import 'listing_form_screen.dart';
import 'marketplace_screen.dart'
    show PriceComparisonBadge, showListingDetailSheet;

class MyListingsScreen extends StatefulWidget {
  const MyListingsScreen({super.key});

  @override
  State<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends State<MyListingsScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final state = context.watch<AppState>();
    final mine = state.myListings;

    return Scaffold(
      appBar: AppBar(title: const Text('My Listings')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const ListingFormScreen()),
        ),
        icon: const Icon(Icons.add),
        label: const Text('New Listing'),
      ),
      body: mine.isEmpty
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.inventory_2_outlined,
                      size: 56, color: Colors.grey),
                  SizedBox(height: 8),
                  Text('You have no listings yet.',
                      style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: () => state.refreshListings(),
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
                itemCount: mine.length,
                itemBuilder: (context, i) =>
                    _MyListingCard(listing: mine[i]),
              ),
            ),
    );
  }
}

class _MyListingCard extends StatelessWidget {
  final Listing listing;
  const _MyListingCard({required this.listing});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final crop = state.cropById(listing.cropId);
    final avg = state.marketAverageFor(listing.cropId);
    final sold = !listing.isActive;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 5),
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
                          fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: sold ? Colors.grey.shade300 : Colors.green.shade100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      sold ? 'Sold' : 'Active',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: sold ? Colors.grey.shade800 : Colors.green.shade800,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                '${listing.grade} grade · ${listing.district} · '
                '${listing.quantity.toStringAsFixed(0)} × 40 kg · '
                'from ${formatDateShort(listing.availableFrom)}',
                style: const TextStyle(fontSize: 11.5, color: Colors.grey),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text(
                    '${formatRupees(listing.askingPrice)} / 40 kg',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 14.5),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: PriceComparisonBadge(
                        askingPrice: listing.askingPrice, marketAvg: avg),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton.icon(
                    icon: const Icon(Icons.edit, size: 17),
                    label: const Text('Edit'),
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ListingFormScreen(existing: listing),
                      ),
                    ),
                  ),
                  TextButton.icon(
                    icon: Icon(
                      sold ? Icons.replay : Icons.check_circle_outline,
                      size: 17,
                    ),
                    label: Text(sold ? 'Reopen' : 'Mark Sold'),
                    onPressed: () => state.toggleListingSold(listing),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline,
                        size: 20, color: AppTheme.danger),
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Delete listing?'),
                          content: const Text(
                              'This permanently removes the listing.'),
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
                        await state.deleteListing(listing.id);
                      }
                    },
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
