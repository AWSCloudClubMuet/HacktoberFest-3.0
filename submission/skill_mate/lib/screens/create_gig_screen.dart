import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/utils.dart';
import '../data/mock_api.dart';
import '../providers/app_state.dart';

class CreateGigScreen extends StatefulWidget {
  const CreateGigScreen({super.key});

  @override
  State<CreateGigScreen> createState() => _CreateGigScreenState();
}

class _CreateGigScreenState extends State<CreateGigScreen> {
  final _form = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _desc = TextEditingController();
  final _budget = TextEditingController();
  String _type = GigType.offering, _category = Category.all.first, _pay = Pay.paid;
  DateTime? _deadline;
  bool _busy = false;

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      firstDate: DateTime.now().add(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDate: DateTime.now().add(const Duration(days: 7)),
    );
    if (d != null) setState(() => _deadline = d);
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    if (_deadline == null) return snack(context, 'Pick a deadline');
    final app = context.read<AppState>();
    setState(() => _busy = true);
    try {
      await app.api.postGig(
        userId: app.currentUserId,
        title: _title.text,
        description: _desc.text,
        type: _type,
        category: _category,
        paymentType: _pay,
        budget: int.tryParse(_budget.text),
        deadline: _deadline!,
      );
      app.refresh();
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      if (mounted) snack(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _chips(List<String> items, String value, void Function(String) on, {String Function(String)? label}) =>
      Wrap(spacing: 8, children: [
        for (final i in items)
          ChoiceChip(label: Text(label?.call(i) ?? i), selected: value == i, onSelected: (_) => setState(() => on(i))),
      ]);

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Post a gig')),
    body: SafeArea(
      top: false,
      child: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _chips(GigType.all, _type, (v) => _type = v),
            const SizedBox(height: 16),
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Title'),
              validator: (v) => (v == null || v.trim().length < 5) ? 'At least 5 characters' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _desc,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Description'),
              validator: (v) => (v == null || v.trim().length < 10) ? 'At least 10 characters' : null,
            ),
            const SizedBox(height: 16),
            const Text('Category', style: TextStyle(fontWeight: FontWeight.bold)),
            _chips(Category.all, _category, (v) => _category = v),
            const SizedBox(height: 16),
            const Text('Payment', style: TextStyle(fontWeight: FontWeight.bold)),
            _chips(Pay.all, _pay, (v) => _pay = v, label: payLabel),
            if (_pay == Pay.paid) ...[
              const SizedBox(height: 12),
              TextFormField(
                controller: _budget,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Budget (Rs)'),
                validator: (v) => (int.tryParse(v ?? '') ?? 0) <= 0 ? 'Enter a budget' : null,
              ),
            ],
            const SizedBox(height: 12),
            ListTile(
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              leading: const Icon(Icons.event),
              title: Text(_deadline == null ? 'Pick deadline' : fmtDate(_deadline!)),
              onTap: _pickDate,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Publish gig'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    ),
  );
}