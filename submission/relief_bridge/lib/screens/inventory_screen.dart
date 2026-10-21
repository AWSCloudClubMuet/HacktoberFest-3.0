import 'package:flutter/material.dart';
import '../anim.dart';
import '../api.dart';
import '../common.dart';

class InventoryScreen extends StatelessWidget {
  const InventoryScreen({super.key});

  @override
  Widget build(BuildContext context) => AsyncView<List<M>>(
    load: () => Api.list('inventory'),
    builder: (ctx, items, reload) => Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: isAdmin.value
          ? FloatingActionButton(
          onPressed: () => itemForm(ctx, null, reload), child: const Icon(Icons.add))
          : null,
      body: ListView(
        padding: const EdgeInsets.only(top: 8, bottom: 90),
        children: items.asMap().entries.map((en) {
          final i = en.value;
          final low = nn(i['stock']) <= nn(i['reorder_level']);
          return FadeSlide(
            index: en.key,
            child: Card(
              child: ListTile(
                leading: CircleAvatar(
                    backgroundColor: (low ? Colors.red : Colors.teal).withOpacity(.15),
                    child: Icon(Icons.inventory_2_rounded,
                        color: low ? Colors.red : Colors.teal)),
                title: Text(i['name'], style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(
                    '${i['category']} • Stock: ${i['stock']} ${i['unit']} • Reorder at ${i['reorder_level']}'),
                trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                  if (low) Pulse(child: chip('Low Stock', Colors.red)),
                  if (isAdmin.value)
                    PopupMenuButton<String>(
                      onSelected: (v) async {
                        if (v == 'edit') {
                          itemForm(ctx, i, reload);
                        } else {
                          if (!await confirm(ctx, 'Delete ${i['name']}?')) return;
                          final needs = await Api.list('needs');
                          if (needs.any((n) => same(n['inventory_item_id'], i['id']))) {
                            if (ctx.mounted) toast(ctx, 'Item is used by camp needs');
                            return;
                          }
                          await Api.remove('inventory', i['id']);
                          reload();
                        }
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'edit', child: Text('Edit')),
                        PopupMenuItem(value: 'del', child: Text('Delete')),
                      ],
                    ),
                ]),
              ),
            ),
          );
        }).toList(),
      ),
    ),
  );
}

Future<void> itemForm(BuildContext context, M? it, VoidCallback done) async {
  final key = GlobalKey<FormState>();
  final name = TextEditingController(text: it?['name']);
  final unit = TextEditingController(text: it?['unit']);
  final stock = TextEditingController(text: it == null ? '' : '${it['stock']}');
  final reorder = TextEditingController(text: it == null ? '' : '${it['reorder_level']}');
  String cat = it?['category'] ?? kCategories.first;
  String? nonNeg(String? v) {
    final n = int.tryParse(v ?? '');
    return (n == null || n < 0) ? 'Enter a number >= 0' : null;
  }

  await showDialog(
    context: context,
    builder: (_) => StatefulBuilder(
      builder: (ctx, set) => AlertDialog(
        title: Text(it == null ? 'Add item' : 'Edit item'),
        content: Form(
          key: key,
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextFormField(
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Name'),
                  validator: (v) => v!.trim().isEmpty ? 'Required' : null),
              DropdownButtonFormField<String>(
                value: cat,
                decoration: const InputDecoration(labelText: 'Category'),
                items: kCategories.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (v) => set(() => cat = v!),
              ),
              TextFormField(
                  controller: unit,
                  decoration: const InputDecoration(labelText: 'Unit (kg, box...)'),
                  validator: (v) => v!.trim().isEmpty ? 'Required' : null),
              TextFormField(
                  controller: stock,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Stock'),
                  validator: nonNeg),
              TextFormField(
                  controller: reorder,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Reorder level'),
                  validator: nonNeg),
            ]),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (!key.currentState!.validate()) return;
              final body = <String, dynamic>{
                'name': name.text.trim(),
                'category': cat,
                'unit': unit.text.trim(),
                'stock': int.parse(stock.text),
                'reorder_level': int.parse(reorder.text),
              };
              try {
                it == null
                    ? await Api.create('inventory', body)
                    : await Api.update('inventory', it['id'], body);
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