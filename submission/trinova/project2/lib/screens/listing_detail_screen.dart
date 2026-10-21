import 'package:flutter/material.dart';

import '../app_state.dart';
import '../constants.dart';
import '../utils.dart';
import '../widgets/listing_card.dart';
import 'listing_form_screen.dart';

class ListingDetailScreen extends StatelessWidget {
  final String listingId;
  const ListingDetailScreen({super.key, required this.listingId});

  Widget _row(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
                width: 130,
                child: Text(label,
                    style: const TextStyle(fontWeight: FontWeight.w600))),
            Expanded(child: Text(value)),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, _) {
        final l = appState.listingById(listingId);
        if (l == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Listing')),
            body: const Center(child: Text('This listing is no longer available.')),
          );
        }
        final seller = appState.userById(l.userId);
        final phone = l.contactPhone.isNotEmpty
            ? l.contactPhone
            : (seller?.phone ?? '');
        final label = appState.marketLabel(l);
        final avg = appState.averageMarketPrice(l.cropId);
        final owner = appState.isOwner(l);

        return Scaffold(
          appBar: AppBar(title: Text(appState.cropName(l.cropId))),
          body: SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    Text('${money(l.askingPrice)} $priceUnit',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (label != null) MarketLabelChip(label: label),
                        if (!l.isActive)
                          const Padding(
                            padding: EdgeInsets.only(left: 8),
                            child: Chip(label: Text('Sold')),
                          ),
                      ],
                    ),
                    if (avg != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                            'Average market price today: ${money(avg)} $priceUnit'),
                      ),
                    const Divider(height: 28),
                    _row('Quantity', '${numText(l.quantity)} × 40 kg'),
                    _row('Grade', l.grade),
                    _row('District', l.district),
                    _row('Available from', fullDate(l.availableFrom)),
                    _row('Seller', seller?.name ?? 'Unknown seller'),
                    _row('Contact phone', phone),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: FilledButton.icon(
                            onPressed: phone.isEmpty
                                ? null
                                : () => callPhone(context, phone),
                            icon: const Icon(Icons.call),
                            label: const Text('Call'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FilledButton.tonalIcon(
                            onPressed: phone.isEmpty
                                ? null
                                : () => openWhatsApp(context, phone),
                            icon: const Icon(Icons.chat),
                            label: const Text('WhatsApp'),
                          ),
                        ),
                      ],
                    ),
                    if (owner) ...[
                      const Divider(height: 36),
                      Text('Manage your listing',
                          style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      ListingFormScreen(existing: l)),
                            ),
                            icon: const Icon(Icons.edit_outlined),
                            label: const Text('Edit'),
                          ),
                          if (l.isActive)
                            OutlinedButton.icon(
                              onPressed: () async {
                                final ok = await confirm(
                                    context,
                                    'Mark as sold?',
                                    'It will no longer appear in the marketplace.',
                                    action: 'Mark Sold');
                                if (!ok) return;
                                try {
                                  await appState.markSold(l);
                                } catch (e) {
                                  if (context.mounted) showSnack(context, '$e');
                                }
                              },
                              icon: const Icon(Icons.check_circle_outline),
                              label: const Text('Mark Sold'),
                            ),
                          OutlinedButton.icon(
                            onPressed: () async {
                              final ok = await confirm(context, 'Delete listing?',
                                  'This listing will be removed permanently.');
                              if (!ok) return;
                              try {
                                await appState.deleteListing(l);
                                if (context.mounted) Navigator.pop(context);
                              } catch (e) {
                                if (context.mounted) showSnack(context, '$e');
                              }
                            },
                            icon: const Icon(Icons.delete_outline),
                            label: const Text('Delete'),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}