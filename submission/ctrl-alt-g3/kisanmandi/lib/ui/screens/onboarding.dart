import 'package:flutter/material.dart';
import '../../data/store.dart';
import '../../domain/models.dart';
import '../theme.dart';
import '../widgets.dart';

Future<void> showConnectionSettings(
  BuildContext context,
  AppStore store,
) async {
  final controller = TextEditingController(text: store.api.baseUrl);
  await showDialog<void>(
    context: context,
    builder: (context) => _ConnectionDialog(store, controller),
  );
  controller.dispose();
}

class _ConnectionDialog extends StatefulWidget {
  final AppStore store;
  final TextEditingController controller;
  const _ConnectionDialog(this.store, this.controller);
  @override
  State<_ConnectionDialog> createState() => _ConnectionDialogState();
}

class _ConnectionDialogState extends State<_ConnectionDialog> {
  bool saving = false;
  String? error;
  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Connect to your API'),
    content: SizedBox(
      width: 400,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Android emulator: 10.0.2.2:8080\nPhone: your computer’s local IP, port 8080.',
          ),
          const SizedBox(height: 16),
          TextField(
            controller: widget.controller,
            decoration: const InputDecoration(labelText: 'API address'),
            keyboardType: TextInputType.url,
          ),
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(error!, style: const TextStyle(color: Colors.red)),
            ),
        ],
      ),
    ),
    actions: [
      TextButton(
        onPressed: saving ? null : () => Navigator.pop(context),
        child: const Text('Cancel'),
      ),
      FilledButton(
        onPressed: saving
            ? null
            : () async {
                setState(() {
                  saving = true;
                  error = null;
                });
                try {
                  await widget.store.saveApiUrl(widget.controller.text);
                  if (context.mounted) Navigator.pop(context);
                } catch (e) {
                  if (mounted) setState(() => error = e.toString());
                } finally {
                  if (mounted) setState(() => saving = false);
                }
              },
        child: Text(saving ? 'Checking…' : 'Save & check'),
      ),
    ],
  );
}

class OnboardingScreen extends StatefulWidget {
  final AppStore store;
  const OnboardingScreen({super.key, required this.store});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final form = GlobalKey<FormState>();
  final name = TextEditingController(), phone = TextEditingController();
  String district = 'Hyderabad', role = 'Farmer';
  bool busy = false;
  Future<void> submit({bool demo = false}) async {
    if (!demo && !form.currentState!.validate()) return;
    setState(() => busy = true);
    try {
      if (demo) {
        final profiles = await widget.store.api.all('users');
        if (!mounted) return;
        final selected = await showModalBottomSheet<String>(
          context: context,
          useSafeArea: true,
          builder: (context) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Choose a demo ${role.toLowerCase()}',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                for (final profile in profiles.where((u) => u['role'] == role))
                  ListTile(
                    leading: const CircleAvatar(
                      child: Icon(Icons.person_outline),
                    ),
                    title: Text(profile['name']),
                    subtitle: Text(
                      '${profile['district']} · Fictional profile',
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () =>
                        Navigator.pop(context, profile['id'] as String),
                  ),
              ],
            ),
          ),
        );
        if (selected != null) await widget.store.demo(selected);
      } else {
        await widget.store.onboard({
          'name': name.text.trim(),
          'phone': phone.text.trim(),
          'district': district,
          'role': role,
        });
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  void dispose() {
    name.dispose();
    phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 500),
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Row(
                children: [
                  const Icon(Icons.spa, color: forest),
                  const SizedBox(width: 8),
                  const Text(
                    'kisanmandi',
                    style: TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -.8,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'API connection',
                    onPressed: () =>
                        showConnectionSettings(context, widget.store),
                    icon: const Icon(Icons.tune),
                  ),
                ],
              ),
              const SizedBox(height: 25),
              Container(
                height: 145,
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(
                  color: const Color(0xFFE8EDD9),
                  borderRadius: BorderRadius.circular(25),
                ),
                child: const FieldLandscape(),
              ),
              const SizedBox(height: 28),
              const Tag('MADE FOR SINDH'),
              const SizedBox(height: 14),
              Text(
                'Better prices.\nStronger harvests.',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 12),
              const Text(
                'Know your mandi. Find your buyer.\nA little clarity before your next sale.',
                style: TextStyle(color: muted, height: 1.5),
              ),
              const SizedBox(height: 24),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                    value: 'Farmer',
                    icon: Icon(Icons.grass),
                    label: Text('I’m a farmer'),
                  ),
                  ButtonSegment(
                    value: 'Buyer',
                    icon: Icon(Icons.shopping_bag_outlined),
                    label: Text('I’m a buyer'),
                  ),
                ],
                selected: {role},
                onSelectionChanged: busy
                    ? null
                    : (s) => setState(() => role = s.first),
              ),
              const SizedBox(height: 22),
              Form(
                key: form,
                child: Column(
                  children: [
                    TextFormField(
                      controller: name,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Your name'),
                      validator: (v) =>
                          (v?.trim().length ?? 0) < 2 || v!.trim().length > 60
                          ? 'Enter 2–60 characters'
                          : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: phone,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Phone number',
                        hintText: '+92…',
                      ),
                      validator: (v) =>
                          RegExp(r'^\+?[0-9]{10,15}$').hasMatch(v?.trim() ?? '')
                          ? null
                          : 'Enter 10–15 digits',
                    ),
                    const SizedBox(height: 14),
                    DropField(
                      label: 'Your district',
                      value: district,
                      options: {for (final d in districts) d: d},
                      onChanged: (v) => setState(() => district = v),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),
              FilledButton(
                onPressed: busy ? null : () => submit(),
                child: Text(busy ? 'Connecting…' : 'Let’s get growing  →'),
              ),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: busy ? null : () => submit(demo: true),
                child: Text('Explore as a demo ${role.toLowerCase()}'),
              ),
              const SizedBox(height: 16),
              const Text(
                'Hackathon demo · All prices, profiles and contact numbers are fictional.',
                textAlign: TextAlign.center,
                style: TextStyle(color: muted, fontSize: 11),
              ),
              if (widget.store.error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(
                    widget.store.error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
            ],
          ),
        ),
      ),
    ),
  );
}
