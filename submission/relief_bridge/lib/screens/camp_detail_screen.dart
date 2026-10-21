import 'package:flutter/material.dart';
import '../anim.dart';
import '../api.dart';
import '../common.dart';

class CampDetailScreen extends StatelessWidget {
  final dynamic campId;
  const CampDetailScreen({super.key, required this.campId});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      foregroundColor: Colors.white,
      backgroundColor: Colors.transparent,
      flexibleSpace: Container(
          decoration: const BoxDecoration(
              gradient: LinearGradient(
                  colors: [Color(0xFF004D40), Color(0xFF26A69A)]))),
      title: const Text('Camp details'),
    ),
    body: SafeArea(
      top: false,
      child: AsyncView<List<List<M>>>(
        load: () => Future.wait([
          Api.list('camps'),
          Api.list('needs'),
          Api.list('inventory'),
          Api.list('volunteers'),
          Api.list('dispatches'),
        ]),
        builder: (ctx, d, reload) {
          final camp = d[0].firstWhere((c) => same(c['id'], campId));
          final needs = d[1].where((n) => same(n['camp_id'], campId)).toList();
          final inv = d[2];
          final vols = d[3].where((v) => same(v['camp_id'], campId)).toList();
          final ds = d[4];
          M item(dynamic id) => inv.firstWhere((i) => same(i['id'], id));

          return ListView(padding: const EdgeInsets.fromLTRB(12, 12, 12, 28), children: [
            Card(
              margin: EdgeInsets.zero,
              child: ListTile(
                title: Text(camp['name'],
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(
                    '${camp['district']} • ${camp['current_families']}/${camp['capacity']} families'),
                trailing: chip(camp['status'], statusColor(camp['status'])),
              ),
            ),
            const SizedBox(height: 8),
            Row(children: [
              const Expanded(
                  child: Text('Needs',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
              if (isAdmin.value)
                IconButton(
                    icon: const Icon(Icons.add_circle),
                    onPressed: () => needForm(ctx, campId, null, inv, reload)),
            ]),
            if (needs.isEmpty)
              const Padding(padding: EdgeInsets.all(8), child: Text('No needs recorded')),
            ...needs.asMap().entries.map((en) {
              final n = en.value;
              final it = item(n['inventory_item_id']);
              final p = pct(n);
              return FadeSlide(
                index: en.key,
                child: Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(
                            child: Text('${it['name']} (${it['category']})',
                                style: const TextStyle(fontWeight: FontWeight.w600))),
                        chip(n['priority'], priorityColor(n['priority'])),
                        if (isAdmin.value) ...[
                          IconButton(
                              icon: const Icon(Icons.edit, size: 20),
                              onPressed: () => needForm(ctx, campId, n, inv, reload)),
                          IconButton(
                              icon: const Icon(Icons.delete, size: 20),
                              onPressed: () async {
                                if (!await confirm(ctx, 'Remove this need?')) return;
                                if (Svc.reserved(ds, n['id']) > 0) {
                                  if (ctx.mounted) toast(ctx, 'Cancel active dispatches first');
                                  return;
                                }
                                await Api.remove('needs', n['id']);
                                reload();
                              }),
                        ],
                      ]),
                      const SizedBox(height: 6),
                      AnimatedProgress(
                          value: p, height: 10, color: p < .4 ? Colors.red : Colors.teal),
                      const SizedBox(height: 6),
                      Text(
                          '${n['fulfilled_quantity']} / ${n['required_quantity']} ${it['unit']} (${(p * 100).round()}%)'),
                    ]),
                  ),
                ),
              );
            }),
            const SizedBox(height: 12),
            const Text('Assigned volunteers',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            if (vols.isEmpty)
              const Padding(padding: EdgeInsets.all(8), child: Text('None assigned')),
            ...vols.map((v) => ListTile(
                leading: const Icon(Icons.person),
                title: Text(v['name']),
                subtitle: Text(v['skill']))),
          ]);
        },
      ),
    ),
  );
}

Future<void> needForm(
    BuildContext context, dynamic campId, M? need, List<M> inv, VoidCallback done) async {
  final key = GlobalKey<FormState>();
  dynamic itemId = need?['inventory_item_id'] ?? inv.first['id'];
  String priority = need?['priority'] ?? 'Medium';
  final qty = TextEditingController(text: need == null ? '' : '${need['required_quantity']}');

  await showDialog(
    context: context,
    builder: (_) => StatefulBuilder(
      builder: (ctx, set) => AlertDialog(
        title: Text(need == null ? 'Add need' : 'Edit need'),
        content: Form(
          key: key,
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              DropdownButtonFormField<dynamic>(
                value: itemId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Inventory item'),
                items: inv
                    .map((i) => DropdownMenuItem<dynamic>(
                    value: i['id'], child: Text('${i['name']} (${i['unit']})')))
                    .toList(),
                onChanged: need == null ? (v) => set(() => itemId = v) : null,
              ),
              TextFormField(
                controller: qty,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Required quantity'),
                validator: (v) {
                  final n = int.tryParse(v ?? '');
                  if (n == null || n <= 0) return 'Enter a number > 0';
                  if (need != null && n < nn(need['fulfilled_quantity'])) {
                    return 'Less than already fulfilled';
                  }
                  return null;
                },
              ),
              DropdownButtonFormField<String>(
                value: priority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: ['High', 'Medium', 'Low']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (v) => set(() => priority = v!),
              ),
            ]),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (!key.currentState!.validate()) return;
              final body = <String, dynamic>{
                'required_quantity': int.parse(qty.text),
                'priority': priority,
              };
              try {
                if (need == null) {
                  await Api.create('needs', {
                    ...body,
                    'camp_id': campId,
                    'inventory_item_id': itemId,
                    'fulfilled_quantity': 0,
                  });
                } else {
                  await Api.update('needs', need['id'], body);
                }
                if (ctx.mounted) Navigator.pop(ctx);
                done();
              } catch (e) {
                if (ctx.mounted) toast(ctx, '$e');
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    ),
  );
}