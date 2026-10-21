import 'package:flutter/material.dart';
import '../anim.dart';
import '../api.dart';
import '../common.dart';
import 'camp_detail_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  Widget kpi(String t, num v, String suffix, IconData i, Color c, int idx) => FadeSlide(
    index: idx,
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: c.withOpacity(.18), blurRadius: 14, offset: const Offset(0, 6))
        ],
      ),
      child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: c.withOpacity(.12), shape: BoxShape.circle),
                child: Icon(i, color: c, size: 18)),
            const SizedBox(height: 6),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: CountUp(v,
                  suffix: suffix,
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: c)),
            ),
            Text(t,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12, color: Colors.black54)),
          ]),
    ),
  );

  Widget heading(String t, int i) => FadeSlide(
    index: i,
    child: Padding(
      padding: const EdgeInsets.fromLTRB(4, 22, 4, 8),
      child: Text(t, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    ),
  );

  @override
  Widget build(BuildContext context) => AsyncView<List<List<M>>>(
    load: () => Future.wait([
      Api.list('camps'),
      Api.list('needs'),
      Api.list('inventory'),
      Api.list('volunteers'),
    ]),
    builder: (ctx, d, reload) {
      final camps = d[0], needs = d[1], inv = d[2], vols = d[3];
      final active = camps.where((c) => c['status'] != 'Closed').toList();
      final families = active.fold<int>(0, (s, c) => s + nn(c['current_families']).toInt());
      num req = 0, ful = 0;
      final catReq = <String, num>{}, catFul = <String, num>{};
      final catOf = {for (final i in inv) '${i['id']}': '${i['category']}'};
      for (final n in needs) {
        final r = nn(n['required_quantity']);
        final f = nn(n['fulfilled_quantity']) > r ? r : nn(n['fulfilled_quantity']);
        req += r;
        ful += f;
        final c = catOf['${n['inventory_item_id']}'] ?? 'Other';
        catReq[c] = (catReq[c] ?? 0) + r;
        catFul[c] = (catFul[c] ?? 0) + f;
      }
      final overall = req == 0 ? 0.0 : (ful / req).toDouble();
      final low = inv.where((i) => nn(i['stock']) <= nn(i['reorder_level'])).length;
      final deployed = vols.where((v) => v['camp_id'] != null).length;

      final gaps = needs.where((n) => n['priority'] == 'High' && pct(n) < .4).toList()
        ..sort((a, b) => pct(a).compareTo(pct(b)));

      M? find(List<M> l, dynamic id) {
        for (final e in l) {
          if (same(e['id'], id)) return e;
        }
        return null;
      }

      return RefreshIndicator(
        onRefresh: () async => reload(),
        child: ListView(padding: const EdgeInsets.fromLTRB(12, 12, 12, 28), children: [
          FadeSlide(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF00695C),
                borderRadius: BorderRadius.circular(26),
              ),
              child: Row(children: [
                TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: overall),
                  duration: const Duration(milliseconds: 1400),
                  curve: Curves.easeOutCubic,
                  builder: (_, v, __) => SizedBox(
                    width: 92,
                    height: 92,
                    child: Stack(alignment: Alignment.center, children: [
                      SizedBox.expand(
                          child: CircularProgressIndicator(
                              value: v,
                              strokeWidth: 9,
                              color: Colors.white,
                              backgroundColor: Colors.white24)),
                      Text('${(v * 100).round()}%',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold)),
                    ]),
                  ),
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Overall fulfilment',
                        style: TextStyle(color: Colors.white70, fontSize: 14)),
                    const SizedBox(height: 4),
                    Text('${needs.length} needs across ${active.length} active camps',
                        style: const TextStyle(
                            color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                  ]),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.15,
            children: [
              kpi('Active camps', active.length, '', Icons.home_work_rounded, Colors.teal, 1),
              kpi('Families sheltered', families, '', Icons.family_restroom_rounded,
                  Colors.indigo, 2),
              kpi('Low-stock items', low, '', Icons.warning_amber_rounded, Colors.red, 3),
              kpi('Volunteers deployed', deployed, '', Icons.groups_rounded, Colors.green, 4),
            ],
          ),
          heading('Fulfilment by category', 5),
          FadeSlide(
            index: 6,
            child: Card(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 20, 12, 14),
                child: SizedBox(
                  height: 190,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: catReq.entries.toList().asMap().entries.map((en) {
                      final e = en.value;
                      final v = e.value == 0 ? 0.0 : (catFul[e.key]! / e.value).toDouble();
                      final col = v < .4 ? Colors.red : Colors.teal;
                      return TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: v),
                        duration: Duration(milliseconds: 900 + en.key * 150),
                        curve: Curves.easeOutBack,
                        builder: (_, val, __) => Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Text('${(val.clamp(0, 1) * 100).round()}%',
                                  style: const TextStyle(
                                      fontSize: 12, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 4),
                              Container(
                                width: 34,
                                height: 120 * val.clamp(0, 1.05) + 3,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                      begin: Alignment.bottomCenter,
                                      end: Alignment.topCenter,
                                      colors: [col.shade700, col.shade300]),
                                  borderRadius: const BorderRadius.vertical(
                                      top: Radius.circular(10)),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(e.key, style: const TextStyle(fontSize: 11)),
                            ]),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),
          ),
          heading('Critical gaps (High priority < 40%)', 7),
          if (gaps.isEmpty)
            const Padding(padding: EdgeInsets.all(8), child: Text('No critical gaps 🎉'))
          else
            FadeSlide(
              index: 8,
              child: Card(
                margin: EdgeInsets.zero,
                clipBehavior: Clip.antiAlias,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: DataTable(
                    showCheckboxColumn: false,
                    columnSpacing: 18,
                    headingRowHeight: 44,
                    dataRowMinHeight: 52,
                    dataRowMaxHeight: 56,
                    headingTextStyle:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    columns: const [
                      DataColumn(label: Text('Camp')),
                      DataColumn(label: Text('Item')),
                      DataColumn(label: Text('Fulfilled')),
                      DataColumn(label: Text('Gap')),
                      DataColumn(label: Text('%')),
                    ],
                    rows: gaps.map((n) {
                      final camp = find(camps, n['camp_id']);
                      final it = find(inv, n['inventory_item_id']);
                      final gap = nn(n['required_quantity']) - nn(n['fulfilled_quantity']);
                      return DataRow(
                        onSelectChanged: camp == null
                            ? null
                            : (_) => Navigator.push(
                            ctx,
                            MaterialPageRoute(
                                builder: (_) => CampDetailScreen(campId: camp['id']))),
                        cells: [
                          DataCell(Text('${camp?['name'] ?? '?'}',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600, color: Colors.teal))),
                          DataCell(Text('${it?['name'] ?? '?'}')),
                          DataCell(Text(
                              '${n['fulfilled_quantity']}/${n['required_quantity']} ${it?['unit'] ?? ''}')),
                          DataCell(Text('$gap',
                              style: const TextStyle(
                                  color: Colors.red, fontWeight: FontWeight.w600))),
                          DataCell(Pulse(
                              child: chip('${(pct(n) * 100).round()}%', Colors.red))),
                        ],
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),
        ]),
      );
    },
  );
}