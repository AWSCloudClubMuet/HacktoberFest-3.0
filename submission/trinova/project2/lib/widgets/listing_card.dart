import 'package:flutter/material.dart';

import '../app_state.dart';
import '../constants.dart';
import '../models.dart';
import '../utils.dart';

class MarketLabelChip extends StatelessWidget {
  final String label;

  const MarketLabelChip({
    super.key,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Chip(
      label: Text(label),
      backgroundColor: switch (label) {
        'Below market' => colorScheme.tertiaryContainer,
        'At market' => colorScheme.secondaryContainer,
        'Above market' => colorScheme.errorContainer,
        _ => colorScheme.surfaceContainerHighest,
      },
      labelStyle: TextStyle(
        color: switch (label) {
          'Below market' => colorScheme.onTertiaryContainer,
          'At market' => colorScheme.onSecondaryContainer,
          'Above market' => colorScheme.onErrorContainer,
          _ => colorScheme.onSurface,
        },
        fontWeight: FontWeight.w600,
      ),
      visualDensity: VisualDensity.compact,
    );
  }
}

class ListingCard extends StatelessWidget {
  final Listing listing;
  final VoidCallback onTap;

  const ListingCard({
    super.key,
    required this.listing,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cropName = appState.cropName(listing.cropId);
    final label = appState.marketLabel(listing);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      cropName,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${money(listing.askingPrice)} $priceUnit',
                    textAlign: TextAlign.end,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  if (label != null) MarketLabelChip(label: label),
                  if (!listing.isActive)
                    const Chip(
                      label: Text('Sold'),
                      visualDensity: VisualDensity.compact,
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                '${listing.district} · Grade ${listing.grade}',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 4),
              Text(
                '${numText(listing.quantity)} × 40 kg · Available from ${listing.availableFrom}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
