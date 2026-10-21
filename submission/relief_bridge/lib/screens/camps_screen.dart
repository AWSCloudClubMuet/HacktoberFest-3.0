import 'package:flutter/material.dart';
import '../anim.dart';
import '../api.dart';
import '../common.dart';
import 'camp_detail_screen.dart';

class CampsScreen extends StatefulWidget {
  const CampsScreen({super.key});
  @override
  State<CampsScreen> createState() => _CampsScreenState();
}

class _CampsScreenState extends State<CampsScreen> {
  String q = '';
  String status = 'All';

  @override
  Widget build(BuildContext context) => AsyncView<List<M>>(
    load: () => Api.list('camps'),
    builder: (ctx, camps, reload) {
      final t = q.toLowerCase();
      final shown = camps.where((c) {
        final m = '${c['name']}'.toLowerCase().contains(t) ||
            '${c['district']}'.toLowerCase().contains(t);
        return m && (status == 'All' || c['status'] == status);
      }).toList();
      return Scaffold(
        backgroundColor: Colors.transparent,
        floatingActionButton: isAdmin.value
            ? FloatingActionButton(
            onPressed: () => campForm(ctx, null, reload),
            child: const Icon(Icons.add))
            : null,
        body: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 6),
            child: TextField(
              onChanged: (v) => setState(() => q = v),
              decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search),
                  hintText: 'Search by name or district',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none)),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
                children: ['All', 'Active', 'Full', 'Closed']
                    .map((s) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                      label: Text(s),
                      selected: status == s,
                      onSelected: (_) => setState(() => status = s)),
                ))
                    .toList()),
          ),
          Expanded(
            child: shown.isEmpty
                ? const Center(child: Text('No camps found'))
                : ListView(
                padding: const EdgeInsets.only(top: 6, bottom: 90),
                children: shown.asMap().entries.map((en) {
                  final c = en.value;
                  return FadeSlide(
                    index: en.key,
                    child: Card(
                      child: ListTile(
                        onTap: () => Navigator.push(
                            ctx,
                            MaterialPageRoute(
                                builder: (_) => CampDetailScreen(campId: c['id']))),
                        leading: CircleAvatar(
                            backgroundColor: statusColor(c['status']).withOpacity(.2),
                            child: Icon(Icons.home_work_rounded,
                                color: statusColor(c['status']))),
                        title: Text(c['name'],
                            style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(
                            '${c['district']} • ${c['current_families']}/${c['capacity']} families'),
                        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                          chip(c['status'], statusColor(c['status'])),
                          PopupMenuButton<String>(
                            onSelected: (v) => v == 'edit'
                                ? campForm(ctx, c, reload)
                                : deleteCamp(ctx, c, reload),
                            itemBuilder: (_) => [
                              const PopupMenuItem(value: 'edit', child: Text('Edit')),
                              if (isAdmin.value)
                                const PopupMenuItem(value: 'del', child: Text('Delete')),
                            ],
                          ),
                        ]),
                      ),
                    ),
                  );
                }).toList()),
          ),
        ]),
      );
    },
  );
}

Future<void> deleteCamp(BuildContext c, M camp, VoidCallback reload) async {
  if (!await confirm(c, 'Delete ${camp['name']}, its needs and dispatch history?')) return;
  try {
    final ds = (await Api.list('dispatches'))
        .where((d) => same(d['camp_id'], camp['id']))
        .toList();
    if (ds.any((d) => d['status'] == 'Pending' || d['status'] == 'In Transit')) {
      throw 'Cancel active dispatches for this camp first';
    }
    for (final d in ds) {
      await Api.remove('dispatches', d['id']);
    }
    for (final n in (await Api.list('needs')).where((n) => same(n['camp_id'], camp['id']))) {
      await Api.remove('needs', n['id']);
    }
    for (final v in (await Api.list('volunteers')).where((v) => same(v['camp_id'], camp['id']))) {
      await Api.update('volunteers', v['id'], {'camp_id': null});
    }
    await Api.remove('camps', camp['id']);
    reload();
  } catch (e) {
    if (c.mounted) toast(c, '$e');
  }
}

Future<void> campForm(BuildContext context, M? camp, VoidCallback done) async {
  final key = GlobalKey<FormState>();
  final name = TextEditingController(text: camp?['name']);
  final district = TextEditingController(text: camp?['district']);
  final cap = TextEditingController(text: camp == null ? '' : '${camp['capacity']}');
  final fam = TextEditingController(text: camp == null ? '0' : '${camp['current_families']}');
  String status = camp?['status'] ?? 'Active';

  await showDialog(
    context: context,
    builder: (_) => StatefulBuilder(
      builder: (ctx, set) => AlertDialog(
        title: Text(camp == null ? 'Add camp' : 'Edit camp'),
        content: Form(
          key: key,
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextFormField(
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Name'),
                  validator: (v) => v!.trim().isEmpty ? 'Required' : null),
              TextFormField(
                  controller: district,
                  decoration: const InputDecoration(labelText: 'District'),
                  validator: (v) => v!.trim().isEmpty ? 'Required' : null),
              TextFormField(
                  controller: cap,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Capacity (families)'),
                  validator: (v) {
                    final n = int.tryParse(v ?? '');
                    return (n == null || n <= 0) ? 'Enter a number > 0' : null;
                  }),
              TextFormField(
                  controller: fam,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Current families'),
                  validator: (v) {
                    final n = int.tryParse(v ?? '');
                    final c = int.tryParse(cap.text);
                    if (n == null || n < 0) return 'Enter a number >= 0';
                    if (c != null && n > c) return 'Cannot exceed capacity';
                    return null;
                  }),
              DropdownButtonFormField<String>(
                value: status,
                decoration: const InputDecoration(labelText: 'Status'),
                items: ['Active', 'Full', 'Closed']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (v) => set(() => status = v!),
              ),
            ]),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (!key.currentState!.validate()) return;
              final c = int.parse(cap.text), f = int.parse(fam.text);
              final body = <String, dynamic>{
                'name': name.text.trim(),
                'district': district.text.trim(),
                'capacity': c,
                'current_families': f,
                'status': statusFor(status, f, c),
              };
              try {
                camp == null
                    ? await Api.create('camps', body)
                    : await Api.update('camps', camp['id'], body);
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