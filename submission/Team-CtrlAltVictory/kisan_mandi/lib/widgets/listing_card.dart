import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/models.dart';
import '../services/app_state.dart';
import '../utils/constants.dart';
import '../utils/format.dart';
import '../utils/theme.dart';
import 'brand.dart';
import 'common.dart';

class ListingCard extends StatelessWidget {
  const ListingCard({super.key, required this.listing, this.actions});
  final Listing listing;
  final List<Widget>? actions;

  Widget _pill(String text, {required Color bg, required Color fg}) =>
      Tag(text, bg: bg, fg: fg);

  Widget _info(IconData icon, String text) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: AppColors.green),
          const SizedBox(width: 5),
          Text(text,
              style: const TextStyle(
                  fontSize: 12.5,
                  color: AppColors.body,
                  fontWeight: FontWeight.w600)),
        ],
      );

  Future<void> _callNumber(BuildContext context, String phone) async {
    final clean = phone.replaceAll(RegExp(r'\s+'), '');
    final uri = Uri(scheme: 'tel', path: clean);
    try {
      await launchUrl(uri);
    } catch (_) {
      if (context.mounted) {
        showSnack(context, 'Could not open phone dialer');
      }
    }
  }

  Future<void> _openWhatsApp(
    BuildContext context,
    String phone,
    String cropName,
  ) async {
    var digits = phone.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('0')) {
      digits = '92${digits.substring(1)}';
    } else if (!digits.startsWith('92')) {
      digits = '92$digits';
    }

    final message =
        'Salam, I am interested in your $cropName listing on KisanMandi (${fmtQty(listing.quantity)} maund at Rs ${listing.pricePerMaund}/maund in ${listing.district}).';
    final uri =
        Uri.parse('https://wa.me/$digits?text=${Uri.encodeComponent(message)}');

    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (context.mounted) {
        showSnack(context, 'Could not open WhatsApp');
      }
    }
  }

  IconData _cropIcon(String? category) {
    if (category == 'Grain') return Icons.grass_rounded;
    if (category == 'Cash Crop') return Icons.spa_rounded;
    if (category == 'Fruit') return Icons.local_florist_rounded;
    return Icons.eco_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final crop = app.cropById(listing.cropId);
    final seller = app.userById(listing.userId);
    final isMine = listing.userId == app.user?.id;

    final local = crop != null ? getCropLocalName(crop.name) : '';
    final title = crop?.name ?? 'Crop #${listing.cropId}';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: AppColors.line),
        boxShadow: AppShadows.soft,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // top band
          Container(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
            decoration: BoxDecoration(
              color: listing.isActive
                  ? AppColors.greenSoft
                  : const Color(0xFFF0F2EF),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
            ),
            child: Row(
              children: [
                CropPhoto(
                  cropName: crop?.name ?? '',
                  size: 54,
                  radius: 18,
                  icon: _cropIcon(crop?.category),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 16.5,
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink,
                        ),
                      ),
                      if (local.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(local,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 12.5, color: AppColors.muted)),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                Wrap(
                  spacing: 6,
                  children: [
                    if (!listing.isActive)
                      _pill('SOLD',
                          bg: const Color(0xFFDDE2DD), fg: AppColors.body),
                    if (isMine && listing.isActive)
                      _pill('Yours', bg: AppColors.gold, fg: AppColors.greenDeep),
                    _pill('Grade ${listing.grade}',
                        bg: Colors.white, fg: AppColors.greenDark),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                fmtRs(listing.pricePerMaund),
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.greenDark,
                                ),
                              ),
                              const Text(
                                ' / maund',
                                style: TextStyle(
                                    fontSize: 12.5, color: AppColors.muted),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Est. total ${fmtRs(listing.quantity * listing.pricePerMaund)}',
                            style: const TextStyle(
                                fontSize: 12, color: AppColors.muted),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.goldSoft,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Text(
                        '${fmtQty(listing.quantity)} maund',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13.5,
                          color: AppColors.goldDark,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 18,
                  runSpacing: 6,
                  children: [
                    _info(Icons.place_rounded, listing.district),
                    _info(Icons.event_rounded,
                        'From ${fmtDate(listing.availableFrom)}'),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.bg,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const CircleAvatar(
                            radius: 15,
                            backgroundColor: AppColors.greenSoft,
                            child: Icon(Icons.person_rounded,
                                size: 17, color: AppColors.green),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  seller?.name ?? 'Seller',
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.ink,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Text(
                                  listing.contact,
                                  style: const TextStyle(
                                      fontSize: 12, color: AppColors.muted),
                                ),
                              ],
                            ),
                          ),
                          InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () async {
                              await Clipboard.setData(
                                  ClipboardData(text: listing.contact));
                              if (context.mounted) {
                                showSnack(context, 'Number copied');
                              }
                            },
                            child: const Padding(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 6),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.copy_rounded,
                                      size: 14, color: AppColors.green),
                                  SizedBox(width: 4),
                                  Text(
                                    'Copy',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.green,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (!isMine && listing.isActive) ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () =>
                                    _callNumber(context, listing.contact),
                                icon: const Icon(Icons.phone_rounded, size: 17),
                                label: const Text('Call'),
                                style: OutlinedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  minimumSize: const Size(0, 46),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: FilledButton.icon(
                                onPressed: () => _openWhatsApp(context,
                                    listing.contact, crop?.name ?? 'produce'),
                                icon: const Icon(Icons.chat_rounded, size: 17),
                                label: const Text('WhatsApp'),
                                style: FilledButton.styleFrom(
                                  minimumSize: const Size(0, 46),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                if (actions != null && actions!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: actions!),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
