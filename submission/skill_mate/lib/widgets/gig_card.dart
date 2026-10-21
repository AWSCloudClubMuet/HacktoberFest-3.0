import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../core/utils.dart';
import '../data/models/gig_model.dart';
import '../providers/app_state.dart';
import '../screens/gig_detail_screen.dart';
import 'common.dart';

class GigCard extends StatelessWidget {
  final Gig gig;
  final int index;
  const GigCard({super.key, required this.gig, this.index = 0});

  @override
  Widget build(BuildContext context) {
    final owner = context.read<AppState>().nameOf(gig.userId);
    final g = AppTheme.catGradient(gig.category);
    return FadeSlide(
      index: index,
      child: Bounce(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => GigDetailScreen(gigId: gig.id)),
        ),
        child: Container(
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(color: g.colors.first.withAlpha(60), blurRadius: 18, offset: const Offset(0, 8)),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Pill(gig.type, gig.type == GigType.offering ? Colors.teal : Colors.deepPurple),
                  const SizedBox(width: 8),
                  Pill(gig.status, statusColor(gig.status)),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(gradient: g, borderRadius: BorderRadius.circular(20)),
                    child: Text(gig.priceLabel,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ]),
                const SizedBox(height: 12),
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(gradient: g, borderRadius: BorderRadius.circular(14)),
                    child: Icon(AppTheme.catIcon(gig.category), color: Colors.white),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(gig.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(gig.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: Colors.grey.shade700)),
                    ]),
                  ),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  const Icon(Icons.event_outlined, size: 16, color: AppTheme.pink),
                  const SizedBox(width: 4),
                  Text(fmtDate(gig.deadline), style: const TextStyle(fontSize: 12)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(owner,
                        textAlign: TextAlign.end,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}