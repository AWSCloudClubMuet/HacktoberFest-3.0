import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../core/utils.dart';
import '../data/models/application_model.dart';
import '../data/models/gig_model.dart';
import '../providers/app_state.dart';
import '../widgets/common.dart';
import '../widgets/gig_card.dart';
import 'gig_detail_screen.dart';

class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key});

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  late Future<List<MapEntry<GigApplication, Gig>>> _apps;
  late Future<List<Gig>> _gigs;
  int _tick = -1;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final app = Provider.of<AppState>(context);
    if (app.tick != _tick) {
      _tick = app.tick;
      _apps = _loadApps(app);
      _gigs = app.api.getGigs(userId: app.currentUserId);
    }
  }

  Future<List<MapEntry<GigApplication, Gig>>> _loadApps(AppState app) async {
    final list = await app.api.getApplications(applicantId: app.currentUserId);
    final gigs = await Future.wait(list.map((a) => app.api.getGig(a.gigId)));
    return [for (var i = 0; i < list.length; i++) MapEntry(list[i], gigs[i])];
  }

  Widget _list<T>(Future<List<T>> f, Widget Function(T, int) b, String empty) => FutureBuilder<List<T>>(
    future: f,
    builder: (_, s) {
      if (s.connectionState != ConnectionState.done) return const SkeletonList();
      if (s.hasError) return Center(child: Text('${s.error}'));
      if (s.data!.isEmpty) return Center(child: Text(empty));
      return ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        itemCount: s.data!.length,
        itemBuilder: (_, i) => b(s.data![i], i),
      );
    },
  );

  @override
  Widget build(BuildContext context) => DefaultTabController(
    length: 2,
    child: Scaffold(
      appBar: AppBar(
        title: const Text('My activity'),
        bottom: const TabBar(
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: [Tab(text: 'My applications'), Tab(text: 'My gigs')],
        ),
      ),
      body: TabBarView(children: [
        _list<MapEntry<GigApplication, Gig>>(
          _apps,
              (e, i) => FadeSlide(
            index: i,
            child: Card(
              color: Colors.white,
              elevation: 3,
              shadowColor: Colors.black26,
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              child: ListTile(
                contentPadding: const EdgeInsets.all(12),
                leading: Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    gradient: AppTheme.catGradient(e.value.category),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(AppTheme.catIcon(e.value.category), color: Colors.white),
                ),
                title: Text(e.value.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                subtitle: Text(e.key.message, maxLines: 1, overflow: TextOverflow.ellipsis),
                trailing: Pill(e.key.status, statusColor(e.key.status)),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => GigDetailScreen(gigId: e.value.id)),
                ),
              ),
            ),
          ),
          'You have not applied yet',
        ),
        _list<Gig>(_gigs, (g, i) => GigCard(gig: g, index: i), 'You have not posted gigs yet'),
      ]),
    ),
  );
}