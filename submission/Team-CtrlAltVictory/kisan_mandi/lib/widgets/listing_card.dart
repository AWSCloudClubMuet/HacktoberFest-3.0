import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/models.dart';
import '../services/app_state.dart';
import '../utils/format.dart';
import 'common.dart';

class ListingCard extends StatelessWidget {
  const ListingCard({super.key, required this.listing, this.actions});
  final Listing listing;
  final List<Widget>? actions;

  Widget _pill(String text, {required Color bg, required Color fg}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: fg,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final theme = Theme.of(context);
    final crop = app.cropById(listing.cropId);
    final seller = app.userById(listing.userId);
    final isMine = listing.userId == app.user?.id;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    crop?.name ?? 'Crop #${listing.cropId}',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1B241B),
                    ),
                  ),
                ),
                if (!listing.isActive) ...[
                  _pill('SOLD', bg: const Color(0xFFEEEEEE), fg: const Color(0xFF616161)),
                  const SizedBox(width: 6),
                ],
                if (isMine && listing.isActive) ...[
                  _pill('Yours', bg: const Color(0xFFE8F5E9), fg: const Color(0xFF2E7D32)),
                  const SizedBox(width: 6),
                ],
                _pill('Grade ${listing.grade}', bg: const Color(0xFFF1F8E9), fg: const Color(0xFF33691E)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  fmtRs(listing.pricePerMaund),
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1B241B),
                  ),
                ),
                const Text(
                  ' / maund',
                  style: TextStyle(fontSize: 13, color: Color(0xFF6B7A6D)),
                ),
                const Spacer(),
                Text(
                  '${fmtQty(listing.quantity)} maund',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: Color(0xFF1B241B),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              'Est. total: ${fmtRs(listing.quantity * listing.pricePerMaund)}',
              style: const TextStyle(fontSize: 12, color: Color(0xFF6B7A6D)),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.place_outlined, size: 15, color: Color(0xFF6B7A6D)),
                const SizedBox(width: 4),
                Text(
                  listing.district,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF333D34)),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.event_outlined, size: 15, color: Color(0xFF6B7A6D)),
                const SizedBox(width: 4),
                Text(
                  'From ${fmtDate(listing.availableFrom)}',
                  style: const TextStyle(fontSize: 13, color: Color(0xFF333D34)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF7F9F6),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE5E9E4)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.person_outline, size: 15, color: Color(0xFF6B7A6D)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '${seller?.name ?? 'Seller'} (${listing.contact})',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF333D34),
                        fontWeight: FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  InkWell(
                    borderRadius: BorderRadius.circular(4),
                    onTap: () async {
                      await Clipboard.setData(ClipboardData(text: listing.contact));
                      if (context.mounted) showSnack(context, 'Number copied');
                    },
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.copy, size: 13, color: Color(0xFF1E6F3D)),
                          SizedBox(width: 4),
                          Text(
                            'Copy',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1E6F3D),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (actions != null && actions!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(mainAxisAlignment: MainAxisAlignment.end, children: actions!),
            ],
          ],
        ),
      ),
    );
  }
}
