import 'package:flutter/material.dart';

import '../app_state.dart';
import '../widgets/listing_card.dart';
import 'listing_detail_screen.dart';
import 'listing_form_screen.dart';

class MyListingsScreen extends StatelessWidget {
  const MyListingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, _) {
        final mine = appState.myListings
          ..sort((a, b) =>
              (int.tryParse(b.id) ?? 0).compareTo(int.tryParse(a.id) ?? 0));
        return Scaffold(
          appBar: AppBar(title: const Text('My listings')),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const ListingFormScreen())),
            icon: const Icon(Icons.add),
            label: const Text('New listing'),
          ),
          body: RefreshIndicator(
            onRefresh: appState.refresh,
            child: mine.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: const [
                      SizedBox(height: 120),
                      Center(child: Text('You have no listings yet.')),
                    ],
                  )
                : ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.only(bottom: 88),
                    itemCount: mine.length,
                    itemBuilder: (_, i) => ListingCard(
                      listing: mine[i],
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) =>
                                ListingDetailScreen(listingId: mine[i].id)),
                      ),
                    ),
                  ),
          ),
        );
      },
    );
  }
}