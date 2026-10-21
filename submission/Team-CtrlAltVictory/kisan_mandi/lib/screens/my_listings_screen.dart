import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_service.dart';
import '../services/app_state.dart';
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
          icon: const Icon(Icons.edit_outlined),
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
          icon: const Icon(Icons.check_circle_outline),
          label: const Text('Sold'),
        ),
      );
    }

    buttons.add(
      TextButton.icon(
        onPressed: () => deleteListing(context, app, listing),
        icon: Icon(Icons.delete_outline, color: Colors.red.shade700),
        label: Text(
          'Delete',
          style: TextStyle(color: Colors.red.shade700),
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

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => openForm(context),
        backgroundColor: const Color(0xFF1E6F3D),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New listing', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
      body: RefreshIndicator(
        onRefresh: () => refreshData(context),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
          children: [
            if (myListings.isEmpty)
              const EmptyView(
                'You have no listings yet.\nTap "New listing" to sell your produce.',
              ),
            ...cards,
          ],
        ),
      ),
    );
  }
}
