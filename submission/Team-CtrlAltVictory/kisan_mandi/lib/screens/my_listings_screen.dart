import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_service.dart';
import '../services/app_state.dart';
import '../utils/theme.dart';
import '../widgets/common.dart';
import '../widgets/listing_card.dart';
import 'listing_form_screen.dart';

class MyListingsScreen extends StatelessWidget {
  const MyListingsScreen({super.key});

  Future<void> openForm(BuildContext context, {Listing? existing}) async {
    final saved = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => ListingFormScreen(existing: existing),
      ),
    );

    if (saved == true && context.mounted) {
      if (existing == null) {
        showSnack(context, 'Listing posted');
      } else {
        showSnack(context, 'Listing updated');
      }
    }
  }

  Future<void> runAction(
    BuildContext context,
    Future<void> Function() action,
    String successMessage,
  ) async {
    try {
      await action();
      if (context.mounted) {
        showSnack(context, successMessage);
      }
    } on ApiException catch (e) {
      if (context.mounted) {
        showSnack(context, e.message);
      }
    }
  }

  Future<void> deleteListing(
    BuildContext context,
    AppState app,
    Listing listing,
  ) async {
    final confirmed = await confirmDialog(
      context,
      'Delete listing?',
      'This cannot be undone.',
    );

    if (confirmed && context.mounted) {
      await runAction(
        context,
        () => app.deleteListing(listing),
        'Listing deleted',
      );
    }
  }

  List<Widget> buildActionButtons(
    BuildContext context,
    AppState app,
    Listing listing,
  ) {
    final List<Widget> buttons = [];

    if (listing.isActive) {
      buttons.add(
        TextButton.icon(
          onPressed: () => openForm(context, existing: listing),
          icon: const Icon(Icons.edit_rounded, size: 18),
          label: const Text('Edit'),
        ),
      );

      buttons.add(
        TextButton.icon(
          onPressed: () {
            runAction(
              context,
              () => app.markSold(listing),
              'Marked as sold',
            );
          },
          icon: const Icon(Icons.check_circle_rounded, size: 18),
          label: const Text('Sold'),
        ),
      );
    }

    buttons.add(
      TextButton.icon(
        onPressed: () => deleteListing(context, app, listing),
        icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.down),
        label: const Text(
          'Delete',
          style: TextStyle(color: AppColors.down),
        ),
      ),
    );

    return buttons;
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);

    final myListings = app.myListings;
    myListings.sort((a, b) => (b.id ?? 0).compareTo(a.id ?? 0));

    final List<Widget> cards = [];
    for (final listing in myListings) {
      cards.add(
        ListingCard(
          listing: listing,
          actions: buildActionButtons(context, app, listing),
        ),
      );
    }

    final activeCount = myListings.where((l) => l.isActive).length;
    final soldCount = myListings.length - activeCount;

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => openForm(context),
        icon: const Icon(Icons.add_rounded),
        label: const Text('New listing'),
      ),
      body: RefreshIndicator(
        color: AppColors.green,
        onRefresh: () => refreshData(context),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 96),
          children: [
            if (myListings.isNotEmpty) ...[
              Row(
                children: [
                  Expanded(
                    child: _summary('Active', '$activeCount',
                        Icons.inventory_2_rounded, AppColors.green, AppColors.greenSoft),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _summary('Sold', '$soldCount',
                        Icons.check_circle_rounded, AppColors.goldDark, AppColors.goldSoft),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
            if (myListings.isEmpty)
              const EmptyView(
                'You have no listings yet.\nTap "New listing" to sell your produce.',
                icon: Icons.inventory_2_outlined,
              ),
            ...cards,
          ],
        ),
      ),
    );
  }

  Widget _summary(String label, String value, IconData icon, Color fg, Color bg) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.line),
        boxShadow: AppShadows.soft,
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
            child: Icon(icon, color: fg, size: 22),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value,
                  style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: AppColors.ink)),
              Text(label,
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.muted)),
            ],
          ),
        ],
      ),
    );
  }
}
