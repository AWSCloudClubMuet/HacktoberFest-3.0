import 'dart:math';
import 'package:flutter/material.dart';
import '../anim.dart';
import '../api.dart';
import '../common.dart';

class DispatchesScreen extends StatefulWidget {
  const DispatchesScreen({super.key});
  @override
  State<DispatchesScreen> createState() => _DispatchesScreenState();
}

class _DispatchesScreenState extends State<DispatchesScreen> {
  String filter = 'All';

  Future<void> act(BuildContext c, M d, String s, VoidCallback reload) async {
    try {
      await Svc.setStatus(d, s);
      reload();
    } catch (e) {
      if (c.mounted) toast(c, '$e');
    }
  }

  @override
  Widget build(BuildContext context) => AsyncView<List<List<M>>>(
    load: () => Future.wait([
      Api.list('dispatches'),
      Api.list('camps'),
      Api.list('needs'),
      Api.list('inventory'),
    ]),
    builder: (ctx, d, reload) {
      final ds = d[0], camps = d[1], needs = d[2], inv = d[3];
      final shown =
      ds.where((x) => filter == 'All' || x['status'] == filter).toList().reversed.toList();
      String itemName(dynamic needId) {
        final n = needs.firstWhere((n) => same(n['id'], needId),
            orElse: () => <String, dynamic>{'inventory_item_id': 0});
        return nameOf(inv, n['inventory_item_id']);
      }

      return Scaffold(
        backgroundColor: Colors.transparent,
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => newDispatch(ctx, camps, needs, inv, ds, reload),
          icon: const Icon(Icons.add),
          label: const Text('Dispatch'),
        ),
        body: Column(children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
                children: ['All', 'Pending', 'In Transit', 'Delivered', 'Cancelled']
                    .map((s) => Padding(
                  padding: const EdgeInsets.all(4),
                  child: ChoiceChip(
                      label: Text(s),
                      selected: filter == s,
                      onSelected: (_) => setState(() => filter = s)),
                ))
                    .toList()),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.only(bottom: 90),
              children: shown.asMap().entries.map((en) {
                final x = en.value;
                final s = x['status'] as String;
                return FadeSlide(
                  index: en.key,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Expanded(
                              child: Text('#${x['id']}  ${nameOf(camps, x['camp_id'])}',
                                  style: const TextStyle(fontWeight: FontWeight.w600))),
                          chip(s, statusColor(s)),
                        ]),
                        const SizedBox(height: 4),
                        Text('${itemName(x['need_id'])} × ${x['quantity']}'),
                        Wrap(children: [
                          if (s == 'Pending')
                            TextButton(
                                onPressed: () => act(ctx, x, 'In Transit', reload),
                                child: const Text('Mark In Transit')),
                          if (s == 'In Transit')
                            TextButton(
                                onPressed: () => act(ctx, x, 'Delivered', reload),
                                child: const Text('Mark Delivered')),
                          if ((s == 'Pending' || s == 'In Transit') && isAdmin.value)
                            TextButton(
                                onPressed: () async {
                                  if (await confirm(ctx, 'Cancel dispatch and restore stock?')) {
                                    act(ctx, x, 'Cancelled', reload);
                                  }
                                },
                                child: const Text('Cancel',
                                    style: TextStyle(color: Colors.red))),
                        ]),
                      ]),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ]),
      );
    },
  );
}

Future<void> newDispatch(BuildContext context, List<M> camps, List<M> needs, List<M> inv,
    List<M> ds, VoidCallback done) async {
  final key = GlobalKey<FormState>();
  final qty = TextEditingController();
  final open = camps.where((c) => c['status'] != 'Closed').toList();
  dynamic campId, needId;

  await showDialog(
    context: context,
    builder: (_) => StatefulBuilder(builder: (ctx, set) {
      final campNeeds = needs
          .where((n) => same(n['camp_id'], campId) && Svc.remaining(n, ds) > 0)
          .toList();
      int maxQ = 0;
      if (needId != null) {
        final n = needs.firstWhere((n) => same(n['id'], needId));
        final it = inv.firstWhere((i) => same(i['id'], n['inventory_item_id']));
        maxQ = max(0, min(Svc.remaining(n, ds), nn(it['stock']).toInt()));
      }
      return AlertDialog(
        title: const Text('New dispatch'),
        content: Form(
          key: key,
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              DropdownButtonFormField<dynamic>(
                value: campId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Camp'),
                items: open
                    .map((c) => DropdownMenuItem<dynamic>(value: c['id'], child: Text(c['name'])))
                    .toList(),
                onChanged: (v) => set(() {
                  campId = v;
                  needId = null;
                }),
                validator: (v) => v == null ? 'Select a camp' : null,
              ),
              DropdownButtonFormField<dynamic>(
                value: needId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Need'),
                items: campNeeds.map((n) {
                  return DropdownMenuItem<dynamic>(
                      value: n['id'],
                      child: Text(
                          '${nameOf(inv, n['inventory_item_id'])} (left ${Svc.remaining(n, ds)})'));
                }).toList(),
                onChanged: (v) => set(() => needId = v),
                validator: (v) => v == null ? 'Select a need' : null,
              ),
              TextFormField(
                controller: qty,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                    labelText: 'Quantity', helperText: needId == null ? null : 'Max allowed: $maxQ'),
                validator: (v) {
                  final n = int.tryParse(v ?? '');
                  if (n == null || n <= 0) return 'Enter a number > 0';
                  if (n > maxQ) return 'Exceeds stock / remaining need ($maxQ)';
                  return null;
                },
              ),
            ]),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (!key.currentState!.validate()) return;
              try {
                await Svc.createDispatch(needId, int.parse(qty.text));
                if (ctx.mounted) Navigator.pop(ctx);
                done();
              } catch (e) {
                if (ctx.mounted) toast(ctx, '$e');
              }
            },
            child: const Text('Create'),
          ),
        ],
      );
    }),
  );
}