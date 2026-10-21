import 'package:flutter/material.dart';

import '../app_state.dart';
import '../constants.dart';
import '../models.dart';
import '../utils.dart';

class MarketLabelChip extends StatelessWidget {
  final String label;
  const MarketLabelChip({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    final color = switch (label) {
      'Below market' => Colors.green.shade800,
      'Above market' => Colors.orange.shade900,
      _ => Colors.blueGrey.shade700,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontWeight: FontWeight.w600, fontSize: 12)),
    );
  }
}

class ListingCard extends StatelessWidget {
  final Listing listing;
  final VoidCallback onTap;
  const ListingCard({super.key, required this.listing, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final l = listing;
    final label = appState.marketLabel(l);
    final textTheme = Theme.of(context).textTheme;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(appState.cropName(l.cropId),
                        style: textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold)),
                  ),
                  if (!l.isActive)
                    const Padding(
                      padding: EdgeInsets.only(right: 6),
                      child: Chip(label: Text('Sold')),
                    ),
                  Chip(label: Text('Grade ${l.grade}')),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                  '${numText(l.quantity)} × 40 kg  ·  ${l.district}  ·  from ${fullDate(l.availableFrom)}'),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: Text('${money(l.askingPrice)} $priceUnit',
                        style: textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold)),
                  ),
                  if (label != null) MarketLabelChip(label: label),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}