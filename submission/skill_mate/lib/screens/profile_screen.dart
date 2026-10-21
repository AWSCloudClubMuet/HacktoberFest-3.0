import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../data/models/review_model.dart';
import '../data/models/user_model.dart';
import '../providers/app_state.dart';
import '../widgets/common.dart';

class _PData {
  final ProfileStats stats;
  final List<Review> reviews;
  _PData(this.stats, this.reviews);
}

class ProfileScreen extends StatefulWidget {
  final String? userId; // null = current user (tab)
  const ProfileScreen({super.key, this.userId});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<_PData> _future;
  int _tick = -1;

  static const _palette = [AppTheme.primary, AppTheme.pink, AppTheme.teal, AppTheme.orange, AppTheme.blue];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final app = Provider.of<AppState>(context);
    if (app.tick != _tick) {
      _tick = app.tick;
      _future = _fetch(app);
    }
  }

  Future<_PData> _fetch(AppState app) async {
    final id = widget.userId ?? app.currentUserId;
    return _PData(await app.api.getProfile(id), await app.api.getReviews(revieweeId: id));
  }

  void _switchUser(AppState app) {
    showModalBottomSheet(
      context: context,
      useSafeArea: true,
      builder: (ctx) => ListView(children: [
        for (final u in app.users.values)
          ListTile(
            leading: CircleAvatar(child: Text(u.name[0])),
            title: Text(u.name),
            subtitle: Text(u.major),
            selected: u.id == app.currentUserId,
            onTap: () {
              app.switchUser(u.id);
              Navigator.pop(ctx);
            },
          ),
      ]),
    );
  }

  Widget _stat(String label, double value, Color color, IconData icon, {bool decimal = false}) => Expanded(
    child: Column(children: [
      Icon(icon, color: color, size: 22),
      const SizedBox(height: 4),
      TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: value),
        duration: const Duration(milliseconds: 1100),
        curve: Curves.easeOut,
        builder: (_, v, __) => Text(
          decimal ? v.toStringAsFixed(1) : v.round().toString(),
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color),
        ),
      ),
      Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
    ]),
  );

  @override
  Widget build(BuildContext context) {
    final app = Provider.of<AppState>(context);
    final own = widget.userId == null;
    return Scaffold(
      appBar: own ? null : AppBar(title: const Text('Profile')),
      body: FutureBuilder<_PData>(
        future: _future,
        builder: (_, s) {
          if (s.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
          if (s.hasError) return Center(child: Text('${s.error}'));
          final st = s.data!.stats;
          final u = st.user;
          final reviews = s.data!.reviews;
          return ListView(
            padding: const EdgeInsets.only(bottom: 100),
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(gradient: AppTheme.gradient),
                  child: Stack(children: [
                    const Positioned.fill(child: FloatingBlobs()),
                    Padding(
                      padding: EdgeInsets.fromLTRB(20, own ? MediaQuery.of(context).padding.top + 20 : 10, 20, 28),
                      child: FadeSlide(
                        child: Column(children: [
                          Float(
                            child: Container(
                              width: 100,
                              height: 100,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 3),
                                gradient: const LinearGradient(
                                  colors: [AppTheme.orange, AppTheme.pink],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                              child: Text(u.name[0],
                                  style: const TextStyle(
                                      color: Colors.white, fontSize: 42, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(u.name,
                              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                          Text('${u.major} · Semester ${u.semester}',
                              style: const TextStyle(color: Colors.white70)),
                          const SizedBox(height: 8),
                          Text(u.bio, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white)),
                        ]),
                      ),
                    ),
                  ]),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  FadeSlide(
                    index: 2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(22),
                        boxShadow: [BoxShadow(color: AppTheme.primary.withAlpha(40), blurRadius: 18, offset: const Offset(0, 8))],
                      ),
                      child: Row(children: [
                        _stat('Posted', st.posted.toDouble(), AppTheme.primary, Icons.edit_note_rounded),
                        _stat('Completed', st.completed.toDouble(), AppTheme.teal, Icons.verified_rounded),
                        _stat('Rating', st.avgRating, AppTheme.orange, Icons.star_rounded, decimal: true),
                        _stat('Reviews', st.reviewCount.toDouble(), AppTheme.pink, Icons.reviews_rounded),
                      ]),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    for (var i = 0; i < u.skills.length; i++)
                      Chip(
                        label: Text(u.skills[i],
                            style: TextStyle(
                                color: _palette[i % _palette.length], fontWeight: FontWeight.w600)),
                        backgroundColor: _palette[i % _palette.length].withAlpha(30),
                        side: BorderSide.none,
                      ),
                  ]),
                  if (own) ...[
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () => _switchUser(app),
                      icon: const Icon(Icons.swap_horiz),
                      label: const Text('Switch demo user'),
                    ),
                  ],
                  const SizedBox(height: 20),
                  const Text('Reviews received', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  if (reviews.isEmpty) const Text('No reviews yet', style: TextStyle(color: Colors.grey)),
                  for (var i = 0; i < reviews.length; i++)
                    FadeSlide(
                      index: i,
                      child: Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Text(app.nameOf(reviews[i].reviewerId),
                                style: const TextStyle(fontWeight: FontWeight.w700)),
                            const Spacer(),
                            Stars(reviews[i].rating.toDouble()),
                          ]),
                          if (reviews[i].comment.isNotEmpty)
                            Padding(padding: const EdgeInsets.only(top: 4), child: Text(reviews[i].comment)),
                        ]),
                      ),
                    ),
                ]),
              ),
            ],
          );
        },
      ),
    );
  }
}