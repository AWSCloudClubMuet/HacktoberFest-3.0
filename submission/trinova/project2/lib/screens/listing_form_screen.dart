import 'package:flutter/material.dart';

import '../app_state.dart';
import '../constants.dart';
import '../models.dart';
import '../utils.dart';

class ListingFormScreen extends StatefulWidget {
  final Listing? existing;
  const ListingFormScreen({super.key, this.existing});

  @override
  State<ListingFormScreen> createState() => _ListingFormScreenState();
}

class _ListingFormScreenState extends State<ListingFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _qty;
  late final TextEditingController _price;
  late final TextEditingController _phone;
  late final TextEditingController _dateText;
  String? _cropId;
  String? _district;
  String _grade = 'A';
  DateTime? _date;
  bool _saving = false;

  DateTime get _today {
    final n = DateTime.now();
    return DateTime(n.year, n.month, n.day);
  }

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _qty = TextEditingController(text: e == null ? '' : numText(e.quantity));
    _price =
        TextEditingController(text: e == null ? '' : numText(e.askingPrice));
    _phone = TextEditingController(
        text: e?.contactPhone.isNotEmpty == true
            ? e!.contactPhone
            : (appState.user?.phone ?? ''));
    _cropId = e?.cropId;
    final d = e?.district ?? appState.user?.district;
    _district = sindhDistricts.contains(d) ? d : null;
    _grade = e?.grade ?? 'A';
    _date = e == null ? null : DateTime.tryParse(e.availableFrom);
    _dateText = TextEditingController(
        text: _date == null ? '' : fullDate(dateToIso(_date!)));
  }

  @override
  void dispose() {
    _qty.dispose();
    _price.dispose();
    _phone.dispose();
    _dateText.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final today = _today;
    final initial =
        (_date != null && !_date!.isBefore(today)) ? _date! : today;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: today,
      lastDate: today.add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _date = picked;
        _dateText.text = fullDate(dateToIso(picked));
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await appState.saveListing(
        id: widget.existing?.id,
        cropId: _cropId!,
        quantity: double.parse(_qty.text.trim()),
        askingPrice: double.parse(_price.text.trim()),
        district: _district!,
        grade: _grade,
        availableFrom: dateToIso(_date!),
        contactPhone: cleanPhone(_phone.text),
      );
      if (!mounted) return;
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      showSnack(context, '$e');
    }
  }

  String? _positive(String? v, String message) {
    final n = double.tryParse((v ?? '').trim());
    return (n == null || n <= 0) ? message : null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title:
              Text(widget.existing == null ? 'New listing' : 'Edit listing')),
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
                    TextFormField(
                      controller: _qty,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Quantity (units of 40 kg)',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) =>
                          _positive(v, 'Enter a quantity greater than 0'),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _price,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Asking price (Rs per 40 kg)',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) =>
                          _positive(v, 'Enter an asking price greater than 0'),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      initialValue: _district,
                      decoration: const InputDecoration(
                          labelText: 'District', border: OutlineInputBorder()),
                      items: [
                        for (final d in sindhDistricts)
                          DropdownMenuItem(value: d, child: Text(d)),
                      ],
                      onChanged: (v) => setState(() => _district = v),
                      validator: (v) => v == null ? 'Select a district' : null,
                    ),
                    const SizedBox(height: 16),
                    const Text('Grade'),
                    const SizedBox(height: 8),
                    SegmentedButton<String>(
                      segments: [
                        for (final g in grades)
                          ButtonSegment(value: g, label: Text('Grade $g')),
                      ],
                      selected: {_grade},
                      onSelectionChanged: (s) =>
                          setState(() => _grade = s.first),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _dateText,
                      readOnly: true,
                      onTap: _pickDate,
                      decoration: const InputDecoration(
                        labelText: 'Available from',
                        suffixIcon: Icon(Icons.calendar_today_outlined),
                        border: OutlineInputBorder(),
                      ),
                      validator: (_) {
                        if (_date == null) return 'Select a date';
                        if (_date!.isBefore(_today)) {
                          return 'Date cannot be in the past';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Contact phone',
                        border: OutlineInputBorder(),
                      ),
                      validator: validatePhone,
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
                          : Text(widget.existing == null
                              ? 'Post listing'
                              : 'Save changes'),
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