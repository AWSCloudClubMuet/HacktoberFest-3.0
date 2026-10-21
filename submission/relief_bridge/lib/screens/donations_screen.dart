import 'package:flutter/material.dart';
import '../anim.dart';
import '../api.dart';
import '../common.dart';

class DonationsScreen extends StatelessWidget {
  const DonationsScreen({super.key});

  Future<void> _delete(BuildContext ctx, M x, VoidCallback reload) async {
    if (!await confirm(ctx, 'Delete this donation?'
        '${x['type'] == 'In-Kind' ? ' Item stock will be reduced.' : ''}')) {
      return;
    }
    try {
      if (x['type'] == 'In-Kind' && x['item_id'] != null) {
        M? item;
        try {
          item = await Api.one('inventory', x['item_id']);
        } catch (_) {}
        if (item != null) {
          final left = nn(item['stock']) - nn(x['amount_or_quantity']);
          if (left < 0) throw 'Stock already used, cannot reverse this donation';
          await Api.update('inventory', item['id'], {'stock': left});
        }
      }
      await Api.remove('donations', x['id']);
      reload();
    } catch (e) {
      if (ctx.mounted) toast(ctx, '$e');
    }
  }

  @override
  Widget build(BuildContext context) => AsyncView<List<List<M>>>(
    load: () => Future.wait([Api.list('donations'), Api.list('inventory')]),
    builder: (ctx, d, reload) {
      final don = d[0], inv = d[1];
      num cash = 0;
      final cashBy = <String, num>{};
      final kindBy = <String, num>{};
      for (final x in don) {
        final cat = '${x['category']}';
        if (x['type'] == 'Cash') {
          cash += nn(x['amount_or_quantity']);
          cashBy[cat] = (cashBy[cat] ?? 0) + nn(x['amount_or_quantity']);
        } else {
          kindBy[cat] = (kindBy[cat] ?? 0) + nn(x['amount_or_quantity']);
        }
      }
      final cats = {...cashBy.keys, ...kindBy.keys};

      return Scaffold(
        backgroundColor: Colors.transparent,
        floatingActionButton: FloatingActionButton(
            onPressed: () => donationForm(ctx, inv, reload),
            child: const Icon(Icons.add)),
        body: ListView(padding: const EdgeInsets.fromLTRB(8, 8, 8, 90), children: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 6),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  colors: [Color(0xFF00695C), Color(0xFF26A69A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Total cash received', style: TextStyle(color: Colors.white70)),
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: cash.toDouble()),
                duration: const Duration(milliseconds: 1200),
                curve: Curves.easeOutCubic,
                builder: (_, v, __) => Text('PKR ${v.round()}',
                    style: const TextStyle(
                        fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
              const Divider(color: Colors.white38),
              const Text('By category',
                  style: TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
              ...cats.map((c) => Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                    '$c: PKR ${(cashBy[c] ?? 0).toStringAsFixed(0)} cash • ${(kindBy[c] ?? 0).toStringAsFixed(0)} units in-kind',
                    style: const TextStyle(color: Colors.white)),
              )),
            ]),
          ),
          ...don.reversed.toList().asMap().entries.map((en) {
            final x = en.value;
            return FadeSlide(
              index: en.key,
              child: Card(
                child: ListTile(
                  leading: Icon(x['type'] == 'Cash' ? Icons.payments : Icons.inventory,
                      color: Colors.teal),
                  title: Text(x['type'] == 'Cash'
                      ? 'PKR ${x['amount_or_quantity']}'
                      : '${x['amount_or_quantity']} × ${nameOf(inv, x['item_id'])}'),
                  subtitle: Text('${x['category']} • ${x['donor'] ?? 'Anonymous'}'),
                  trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                    chip(x['type'], x['type'] == 'Cash' ? Colors.green : Colors.blue),
                    if (isAdmin.value)
                      PopupMenuButton<String>(
                        onSelected: (v) => v == 'edit'
                            ? donationForm(ctx, inv, reload, edit: x)
                            : _delete(ctx, x, reload),
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'edit', child: Text('Edit')),
                          PopupMenuItem(value: 'del', child: Text('Delete')),
                        ],
                      ),
                  ]),
                ),
              ),
            );
          }),
        ]),
      );
    },
  );
}

Future<void> donationForm(BuildContext context, List<M> inv, VoidCallback done,
    {M? edit}) async {
  final key = GlobalKey<FormState>();
  final isEdit = edit != null;
  final amount = TextEditingController(text: isEdit ? '${edit['amount_or_quantity']}' : '');
  final donor = TextEditingController(
      text: isEdit && edit['donor'] != 'Anonymous' ? '${edit['donor'] ?? ''}' : '');
  String type = isEdit ? edit['type'] : 'Cash';
  String cat = isEdit && type == 'Cash' ? '${edit['category']}' : 'General';
  if (!['General', ...kCategories].contains(cat)) cat = 'General';
  dynamic itemId = isEdit ? edit['item_id'] : inv.first['id'];

  await showDialog(
    context: context,
    builder: (_) => StatefulBuilder(
      builder: (ctx, set) => AlertDialog(
        title: Text(isEdit ? 'Edit donation' : 'Record donation'),
        content: Form(
          key: key,
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              if (!isEdit)
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'Cash', label: Text('Cash')),
                    ButtonSegment(value: 'In-Kind', label: Text('In-Kind')),
                  ],
                  selected: {type},
                  onSelectionChanged: (s) => set(() => type = s.first),
                ),
              TextFormField(
                  controller: donor,
                  decoration: const InputDecoration(labelText: 'Donor (optional)')),
              if (type == 'Cash')
                DropdownButtonFormField<String>(
                  value: cat,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: ['General', ...kCategories]
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (v) => set(() => cat = v!),
                )
              else
                DropdownButtonFormField<dynamic>(
                  value: itemId,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Item'),
                  items: inv
                      .map((i) => DropdownMenuItem<dynamic>(
                      value: i['id'], child: Text('${i['name']} (${i['unit']})')))
                      .toList(),
                  onChanged: isEdit ? null : (v) => set(() => itemId = v),
                ),
              TextFormField(
                controller: amount,
                keyboardType: TextInputType.number,
                decoration:
                InputDecoration(labelText: type == 'Cash' ? 'Amount (PKR)' : 'Quantity'),
                validator: (v) {
                  final n = num.tryParse(v ?? '');
                  return (n == null || n <= 0) ? 'Enter a number > 0' : null;
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
              final amt = num.parse(amount.text);
              final who = donor.text.trim().isEmpty ? 'Anonymous' : donor.text.trim();
              try {
                if (type == 'Cash') {
                  final body = <String, dynamic>{
                    'type': 'Cash',
                    'amount_or_quantity': amt,
                    'item_id': null,
                    'category': cat,
                    'donor': who,
                  };
                  isEdit
                      ? await Api.update('donations', edit['id'], body)
                      : await Api.create('donations', body);
                } else if (isEdit) {
                  final item = await Api.one('inventory', itemId);
                  final newStock =
                      nn(item['stock']) + amt - nn(edit['amount_or_quantity']);
                  if (newStock < 0) throw 'Stock already used, quantity too low';
                  await Api.update('donations', edit['id'],
                      {'amount_or_quantity': amt, 'donor': who});
                  await Api.update('inventory', itemId, {'stock': newStock});
                } else {
                  final item = await Api.one('inventory', itemId);
                  await Api.create('donations', {
                    'type': 'In-Kind',
                    'amount_or_quantity': amt,
                    'item_id': itemId,
                    'category': item['category'],
                    'donor': who,
                  });
                  await Api.update('inventory', itemId, {'stock': nn(item['stock']) + amt});
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