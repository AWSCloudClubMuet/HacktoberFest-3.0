import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/utils.dart';
import '../data/mock_api.dart';
import '../data/models/application_model.dart';
import '../data/models/gig_model.dart';
import '../data/models/review_model.dart';
import '../providers/app_state.dart';
import '../widgets/common.dart';
import 'profile_screen.dart';

class _Data {
  final Gig gig;
  final List<GigApplication> apps;
  final List<Review> reviews;
  _Data(this.gig, this.apps, this.reviews);
}

class GigDetailScreen extends StatefulWidget {
  final String gigId;
  const GigDetailScreen({super.key, required this.gigId});

  @override
  State<GigDetailScreen> createState() => _GigDetailScreenState();
}

class _GigDetailScreenState extends State<GigDetailScreen> {
  late Future<_Data> _future;
  int _tick = -1;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final t = Provider.of<AppState>(context).tick;
    if (t != _tick) {
      _tick = t;
      _future = _fetch();
    }
  }

  Future<_Data> _fetch() async {
    final api = context.read<AppState>().api;
    final gig = await api.getGig(widget.gigId);
    return _Data(gig, await api.getApplications(gigId: gig.id), await api.getReviews(gigId: gig.id));
  }

  Future<void> _run(Future<dynamic> Function() action, String ok) async {
    final app = context.read<AppState>();
    try {
      await action();
      app.refresh();
      if (mounted) snack(context, ok);
    } on ApiException catch (e) {
      if (mounted) snack(context, e.message);
    }
  }

  Future<void> _apply(Gig gig) async {
    final c = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Apply'),
        content: TextField(
          controller: c,
          maxLines: 3,
          maxLength: 200,
          decoration: const InputDecoration(hintText: 'Short message'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Send')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final app = context.read<AppState>();
    await _run(
          () => app.api.postApplication(gigId: gig.id, applicantId: app.currentUserId, message: c.text),
      'Application sent',
    );
  }

  Future<void> _review(Gig gig) async {
    int rating = 5;
    final c = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, set) => AlertDialog(
          title: const Text('Rate this gig'),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              for (var i = 1; i <= 5; i++)
                GestureDetector(
                  onTap: () => set(() => rating = i),
                  child: Icon(i <= rating ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: Colors.amber, size: 34),
                ),
            ]),
            const SizedBox(height: 12),
            TextField(controller: c, decoration: const InputDecoration(hintText: 'Comment')),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Submit')),
          ],
        ),
      ),
    );
    if (ok != true || !mounted) return;
    final app = context.read<AppState>();
    await _run(
          () => app.api.postReview(gigId: gig.id, reviewerId: app.currentUserId, rating: rating, comment: c.text),
      'Review submitted',
    );
  }

  Widget _info(IconData i, String t) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(children: [Icon(i, size: 18, color: Colors.grey), const SizedBox(width: 8), Text(t)]),
  );

  Widget _card(Widget child) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
    child: child,
  );

  @override
  Widget build(BuildContext context) {
    final app = Provider.of<AppState>(context);
    final me = app.currentUserId;
    return Scaffold(
      appBar: AppBar(title: const Text('Gig details')),
      body: SafeArea(
        top: false,
        child: FutureBuilder<_Data>(
          future: _future,
          builder: (_, s) {
            if (s.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (s.hasError) return Center(child: Text('${s.error}'));
            final d = s.data!;
            final gig = d.gig;
            final isOwner = gig.userId == me;
            final isParticipant = isOwner || gig.acceptedApplicantId == me;
            final myApps = d.apps.where((a) => a.applicantId == me).toList();
            final visible = isOwner ? d.apps : myApps;
            final reviewed = d.reviews.any((r) => r.reviewerId == me);

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 40),
              children: [
                FadeSlide(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Pill(gig.type, gig.type == GigType.offering ? Colors.teal : Colors.deepPurple),
                      const SizedBox(width: 8),
                      Pill(gig.status, statusColor(gig.status)),
                    ]),
                    const SizedBox(height: 12),
                    Text(gig.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    Text(gig.description, style: TextStyle(color: Colors.grey.shade800, height: 1.4)),
                    const SizedBox(height: 16),
                    _info(Icons.payments_outlined, gig.priceLabel),
                    _info(Icons.category_outlined, gig.category),
                    _info(Icons.event_outlined, 'Deadline: ${fmtDate(gig.deadline)}'),
                    InkWell(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => ProfileScreen(userId: gig.userId)),
                      ),
                      child: _info(Icons.person_outline, 'Posted by ${app.nameOf(gig.userId)}'),
                    ),
                  ]),
                ),
                const SizedBox(height: 12),
                if (!isOwner && gig.status == Status.open && myApps.isEmpty)
                  FilledButton.icon(
                      onPressed: () => _apply(gig), icon: const Icon(Icons.send), label: const Text('Apply')),
                if (isOwner && gig.status == Status.progress)
                  FilledButton.icon(
                    onPressed: () => _run(
                          () => app.api.patchGig(gig.id, status: Status.completed, actorId: me),
                      'Gig completed',
                    ),
                    icon: const Icon(Icons.check_circle),
                    label: const Text('Mark as completed'),
                  ),
                if (isOwner && (gig.status == Status.open || gig.status == Status.progress))
                  TextButton(
                    onPressed: () => _run(
                          () => app.api.patchGig(gig.id, status: Status.cancelled, actorId: me),
                      'Gig cancelled',
                    ),
                    child: const Text('Cancel gig', style: TextStyle(color: Colors.red)),
                  ),
                if (gig.status == Status.completed && isParticipant && !reviewed)
                  FilledButton.icon(
                    onPressed: () => _review(gig),
                    icon: const Icon(Icons.star),
                    label: const Text('Leave a review'),
                  ),
                if (visible.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Text(isOwner ? 'Applications (${visible.length})' : 'Your application',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  for (var i = 0; i < visible.length; i++)
                    FadeSlide(
                      index: i,
                      child: _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Text(app.nameOf(visible[i].applicantId),
                              style: const TextStyle(fontWeight: FontWeight.w700)),
                          const Spacer(),
                          Pill(visible[i].status, statusColor(visible[i].status)),
                        ]),
                        const SizedBox(height: 6),
                        Text(visible[i].message),
                        if (isOwner && visible[i].status == AppStatus.pending && gig.status == Status.open)
                          Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                            TextButton(
                              onPressed: () => _run(
                                    () => app.api
                                    .patchApplication(visible[i].id, status: AppStatus.rejected, actorId: me),
                                'Application rejected',
                              ),
                              child: const Text('Reject'),
                            ),
                            FilledButton(
                              onPressed: () => _run(
                                    () => app.api
                                    .patchApplication(visible[i].id, status: AppStatus.accepted, actorId: me),
                                'Applicant accepted',
                              ),
                              child: const Text('Accept'),
                            ),
                          ]),
                      ])),
                    ),
                ],
                if (d.reviews.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  const Text('Reviews', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  for (final r in d.reviews)
                    _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Text(app.nameOf(r.reviewerId), style: const TextStyle(fontWeight: FontWeight.w700)),
                        const Spacer(),
                        Stars(r.rating.toDouble()),
                      ]),
                      if (r.comment.isNotEmpty)
                        Padding(padding: const EdgeInsets.only(top: 4), child: Text(r.comment)),
                    ])),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}