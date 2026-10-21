import 'package:flutter/material.dart';
import '../anim.dart';
import '../api.dart';
import '../common.dart';

class VolunteersScreen extends StatefulWidget {
  const VolunteersScreen({super.key});
  @override
  State<VolunteersScreen> createState() => _VolunteersScreenState();
}

class _VolunteersScreenState extends State<VolunteersScreen> {
  String q = '';
  String skill = 'All';

  @override
  Widget build(BuildContext context) => AsyncView<List<List<M>>>(
    load: () => Future.wait([Api.list('volunteers'), Api.list('camps')]),
    builder: (ctx, d, reload) {
      final vols = d[0], camps = d[1];
      final t = q.toLowerCase();
      final shown = vols
          .where((v) =>
      '${v['name']}'.toLowerCase().contains(t) &&
          (skill == 'All' || v['skill'] == skill))
          .toList();

      return Scaffold(
        backgroundColor: Colors.transparent,
        floatingActionButton: FloatingActionButton(
            onPressed: () => register(ctx, reload), child: const Icon(Icons.person_add)),
        body: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 6),
            child: TextField(
              onChanged: (v) => setState(() => q = v),
              decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search),
                  hintText: 'Search volunteers',
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
                children: ['All', ...kSkills]
                    .map((s) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                      label: Text(s),
                      selected: skill == s,
                      onSelected: (_) => setState(() => skill = s)),
                ))
                    .toList()),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.only(top: 6, bottom: 90),
              children: shown.asMap().entries.map((en) {
                final v = en.value;
                final assigned = v['camp_id'] != null;
                return FadeSlide(
                  index: en.key,
                  child: Card(
                    child: ListTile(
                      leading: CircleAvatar(
                          backgroundColor: Colors.teal.withOpacity(.15),
                          child: const Icon(Icons.person, color: Colors.teal)),
                      title: Text(v['name'],
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(
                          '${v['skill']} • ${assigned ? nameOf(camps, v['camp_id']) : 'Unassigned'}'),
                      trailing: assigned
                          ? TextButton(
                          onPressed: () async {
                            await Api.update('volunteers', v['id'], {'camp_id': null});
                            reload();
                          },
                          child: const Text('Unassign'))
                          : TextButton(
                          onPressed: () async {
                            final open =
                            camps.where((c) => c['status'] != 'Closed').toList();
                            final pick = await showDialog<dynamic>(
                              context: ctx,
                              builder: (dctx) => SimpleDialog(
                                title: const Text('Assign to camp'),
                                children: open
                                    .map((c) => SimpleDialogOption(
                                    onPressed: () => Navigator.pop(dctx, c['id']),
                                    child: Text('${c['name']} (${c['status']})')))
                                    .toList(),
                              ),
                            );
                            if (pick == null) return;
                            try {
                              await Svc.assignVolunteer(v['id'], pick);
                              reload();
                            } catch (e) {
                              if (ctx.mounted) toast(ctx, '$e');
                            }
                          },
                          child: const Text('Assign')),
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

Future<void> register(BuildContext context, VoidCallback done) async {
  final key = GlobalKey<FormState>();
  final name = TextEditingController();
  String skill = kSkills.first;
  await showDialog(
    context: context,
    builder: (_) => StatefulBuilder(
      builder: (ctx, set) => AlertDialog(
        title: const Text('Register volunteer'),
        content: Form(
          key: key,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextFormField(
                controller: name,
                decoration: const InputDecoration(labelText: 'Full name'),
                validator: (v) => v!.trim().isEmpty ? 'Required' : null),
            DropdownButtonFormField<String>(
              value: skill,
              decoration: const InputDecoration(labelText: 'Skill'),
              items: kSkills.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
              onChanged: (v) => set(() => skill = v!),
            ),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (!key.currentState!.validate()) return;
              try {
                await Api.create(
                    'volunteers', {'name': name.text.trim(), 'skill': skill, 'camp_id': null});
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