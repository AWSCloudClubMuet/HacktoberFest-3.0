import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../core/utils.dart';
import '../data/models/gig_model.dart';
import '../providers/app_state.dart';
import '../widgets/common.dart';
import '../widgets/gig_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<List<Gig>> _future;
  int _tick = -1;
  String? _category, _type, _payment;
  RangeValues _budget = const RangeValues(0, 10000);
  bool _budgetOn = false;
  String _q = '';
  Timer? _timer;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final t = Provider.of<AppState>(context).tick;
    if (t != _tick) {
      _tick = t;
      _load();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _load() {
    _future = context.read<AppState>().api.getGigs(
      category: _category,
      type: _type,
      payment: _payment,
      minBudget: _budgetOn ? _budget.start.round() : null,
      maxBudget: _budgetOn ? _budget.end.round() : null,
      q: _q,
    );
  }

  void _onSearch(String v) {
    _timer?.cancel();
    _timer = Timer(const Duration(milliseconds: 400), () => setState(() {
      _q = v;
      _load();
    }));
  }

  void _openFilters() {
    String? type = _type, pay = _payment;
    RangeValues r = _budget;
    bool on = _budgetOn;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => StatefulBuilder(
        builder: (ctx, set) => SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + MediaQuery.of(ctx).viewInsets.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Type', style: TextStyle(fontWeight: FontWeight.bold)),
              Wrap(spacing: 8, children: [
                for (final t in GigType.all)
                  ChoiceChip(label: Text(t), selected: type == t, onSelected: (s) => set(() => type = s ? t : null)),
              ]),
              const SizedBox(height: 12),
              const Text('Payment', style: TextStyle(fontWeight: FontWeight.bold)),
              Wrap(spacing: 8, children: [
                for (final p in Pay.all)
                  ChoiceChip(label: Text(payLabel(p)), selected: pay == p, onSelected: (s) => set(() => pay = s ? p : null)),
              ]),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Filter by budget'),
                value: on,
                onChanged: (v) => set(() => on = v),
              ),
              if (on)
                RangeSlider(
                  values: r,
                  min: 0,
                  max: 10000,
                  divisions: 20,
                  labels: RangeLabels('Rs ${r.start.round()}', 'Rs ${r.end.round()}'),
                  onChanged: (v) => set(() => r = v),
                ),
              Row(children: [
                TextButton(
                  onPressed: () {
                    setState(() {
                      _type = null;
                      _payment = null;
                      _budgetOn = false;
                      _budget = const RangeValues(0, 10000);
                      _load();
                    });
                    Navigator.pop(ctx);
                  },
                  child: const Text('Reset'),
                ),
                const Spacer(),
                FilledButton(
                  onPressed: () {
                    setState(() {
                      _type = type;
                      _payment = pay;
                      _budget = r;
                      _budgetOn = on;
                      _load();
                    });
                    Navigator.pop(ctx);
                  },
                  child: const Text('Apply'),
                ),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _catChip(String? c) {
    final sel = _category == c;
    final g = c == null ? AppTheme.gradient : AppTheme.catGradient(c);
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: Bounce(
        onTap: () => setState(() {
          _category = c;
          _load();
        }),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            gradient: sel ? g : null,
            color: sel ? null : Colors.white,
            borderRadius: BorderRadius.circular(30),
            boxShadow: sel
                ? [BoxShadow(color: g.colors.first.withAlpha(90), blurRadius: 10, offset: const Offset(0, 4))]
                : [],
          ),
          child: Row(children: [
            Icon(c == null ? Icons.apps_rounded : AppTheme.catIcon(c),
                size: 18, color: sel ? Colors.white : AppTheme.primary),
            const SizedBox(width: 6),
            Text(c ?? 'All',
                style: TextStyle(
                    color: sel ? Colors.white : Colors.black87, fontWeight: FontWeight.w600)),
          ]),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = Provider.of<AppState>(context);
    return Scaffold(
      body: Column(children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(30)),
          child: Container(
            width: double.infinity,
            decoration: const BoxDecoration(gradient: AppTheme.gradient),
            child: Stack(children: [
              const Positioned.fill(child: FloatingBlobs()),
              Padding(
                padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 16, 20, 20),
                child: FadeSlide(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Hi, ${app.me.name.split(' ').first} 👋',
                        style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800)),
                    const Text('Find a gig or offer your skills', style: TextStyle(color: Colors.white70)),
                    const SizedBox(height: 14),
                    Row(children: [
                      Expanded(
                        child: TextField(
                          onChanged: _onSearch,
                          decoration: const InputDecoration(
                              hintText: 'Search title or description', prefixIcon: Icon(Icons.search)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: _openFilters,
                        style: IconButton.styleFrom(
                            backgroundColor: Colors.white, foregroundColor: AppTheme.primary),
                        icon: const Icon(Icons.tune),
                      ),
                    ]),
                  ]),
                ),
              ),
            ]),
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(children: [for (final c in <String?>[null, ...Category.all]) _catChip(c)]),
        ),
        Expanded(
          child: FutureBuilder<List<Gig>>(
            future: _future,
            builder: (_, s) {
              if (s.connectionState != ConnectionState.done) return const SkeletonList();
              if (s.hasError) return Center(child: Text('${s.error}'));
              final list = s.data!;
              if (list.isEmpty) return const Center(child: Text('No gigs found'));
              return ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                itemCount: list.length,
                itemBuilder: (_, i) => GigCard(gig: list[i], index: i),
              );
            },
          ),
        ),
      ]),
    );
  }
}