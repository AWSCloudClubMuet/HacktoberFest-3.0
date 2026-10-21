import 'package:flutter/material.dart';
import 'anim.dart';
import 'api.dart';

/// true = Relief Coordinator (Admin), false = Field Volunteer
final isAdmin = ValueNotifier<bool>(true);

const kSkills = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];
const kCategories = ['Food', 'Water', 'Medicine', 'Shelter', 'Hygiene'];

void toast(BuildContext c, String m) => ScaffoldMessenger.of(c)
  ..hideCurrentSnackBar()
  ..showSnackBar(SnackBar(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      content: Text(m)));

Future<bool> confirm(BuildContext c, String msg) async =>
    (await showDialog<bool>(
      context: c,
      builder: (_) => AlertDialog(
        title: const Text('Confirm'),
        content: Text(msg),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('No')),
          FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('Yes')),
        ],
      ),
    )) ??
        false;

Color priorityColor(String p) =>
    p == 'High' ? Colors.red : (p == 'Medium' ? Colors.orange : Colors.green);

Color statusColor(String s) => switch (s) {
  'Active' || 'Delivered' => Colors.green,
  'Full' || 'In Transit' => Colors.orange,
  'Closed' || 'Cancelled' => Colors.grey,
  _ => Colors.blue,
};

double pct(M n) {
  final r = nn(n['required_quantity']);
  if (r == 0) return 0;
  return (nn(n['fulfilled_quantity']) / r).clamp(0, 1).toDouble();
}

String nameOf(List<M> l, dynamic id) => l.firstWhere((e) => same(e['id'], id),
    orElse: () => <String, dynamic>{'name': '?'})['name'];

Widget chip(String t, Color c) => Container(
  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
  decoration: BoxDecoration(color: c.withOpacity(.15), borderRadius: BorderRadius.circular(14)),
  child: Text(t, style: TextStyle(color: c, fontSize: 12, fontWeight: FontWeight.w700)),
);

/// Loads data, keeps showing old data while reloading (no spinner flash),
/// and fades the screen in the first time.
class AsyncView<T> extends StatefulWidget {
  final Future<T> Function() load;
  final Widget Function(BuildContext, T, VoidCallback reload) builder;
  const AsyncView({super.key, required this.load, required this.builder});
  @override
  State<AsyncView<T>> createState() => _AsyncViewState<T>();
}

class _AsyncViewState<T> extends State<AsyncView<T>> {
  late Future<T> f = widget.load();
  T? last;
  void reload() => setState(() => f = widget.load());

  @override
  Widget build(BuildContext context) => FutureBuilder<T>(
    future: f,
    builder: (c, s) {
      if (s.connectionState == ConnectionState.done && s.hasData) last = s.data;
      if (s.hasError) {
        return Center(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('Cannot reach mock API.\n${s.error}', textAlign: TextAlign.center)),
              FilledButton(onPressed: reload, child: const Text('Retry')),
            ]));
      }
      if (last == null) return const Center(child: CircularProgressIndicator());
      return FadeSlide(child: widget.builder(c, last as T, reload));
    },
  );
}