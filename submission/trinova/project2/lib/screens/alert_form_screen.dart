import 'package:flutter/material.dart';

import '../app_state.dart';
import '../models.dart';
import '../utils.dart';

class AlertFormScreen extends StatefulWidget {
  final AlertRule? existing;
  const AlertFormScreen({super.key, this.existing});

  @override
  State<AlertFormScreen> createState() => _AlertFormScreenState();
}

class _AlertFormScreenState extends State<AlertFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _target;
  String? _cropId;
  String? _marketId;
  String _condition = 'Above';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _target = TextEditingController(text: e == null ? '' : numText(e.targetPrice));
    _cropId = e?.cropId;
    _marketId = e?.marketId ?? appState.selectedMarketId;
    _condition = e?.condition ?? 'Above';
  }

  @override
  void dispose() {
    _target.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await appState.saveAlert(
        id: widget.existing?.id,
        cropId: _cropId!,
        marketId: _marketId!,
        condition: _condition,
        targetPrice: double.parse(_target.text.trim()),
      );
      if (!mounted) return;
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      showSnack(context, '$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: Text(widget.existing == null ? 'New alert' : 'Edit alert')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    DropdownButtonFormField<String>(
                      initialValue: _cropId,
                      decoration: const InputDecoration(
                          labelText: 'Crop', border: OutlineInputBorder()),
                      items: [
                        for (final c in appState.crops)
                          DropdownMenuItem(value: c.id, child: Text(c.name)),
                      ],
                      onChanged: (v) => setState(() => _cropId = v),
                      validator: (v) => v == null ? 'Select a crop' : null,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      initialValue: _marketId,
                      isExpanded: true,
                      decoration: const InputDecoration(
                          labelText: 'Market', border: OutlineInputBorder()),
                      items: [
                        for (final m in appState.markets)
                          DropdownMenuItem(
                              value: m.id,
                              child: Text('${m.name} (${m.district})')),
                      ],
                      onChanged: (v) => setState(() => _marketId = v),
                      validator: (v) => v == null ? 'Select a market' : null,
                    ),
                    const SizedBox(height: 16),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(
                            value: 'Above',
                            label: Text('Above'),
                            icon: Icon(Icons.trending_up)),
                        ButtonSegment(
                            value: 'Below',
                            label: Text('Below'),
                            icon: Icon(Icons.trending_down)),
                      ],
                      selected: {_condition},
                      onSelectionChanged: (s) =>
                          setState(() => _condition = s.first),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _target,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Target price (Rs per 40 kg)',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) {
                        final n = double.tryParse((v ?? '').trim());
                        return (n == null || n <= 0)
                            ? 'Enter a target price greater than 0'
                            : null;
                      },
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _saving ? null : _save,
                      style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(52)),
                      child: _saving
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text('Save alert'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}