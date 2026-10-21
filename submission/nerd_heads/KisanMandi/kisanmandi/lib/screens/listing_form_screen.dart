import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/listing_model.dart';
import '../providers/app_state.dart';
import '../utils/format.dart';
import 'onboarding_screen.dart' show sindhDistricts;

/// Shared form for creating and editing a produce listing (Milestone 4).
class ListingFormScreen extends StatefulWidget {
  final Listing? existing;
  const ListingFormScreen({super.key, this.existing});

  @override
  State<ListingFormScreen> createState() => _ListingFormScreenState();
}

class _ListingFormScreenState extends State<ListingFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _quantityController;
  late final TextEditingController _priceController;
  late final TextEditingController _phoneController;

  String? _cropId;
  String? _district;
  String _grade = 'A';
  DateTime? _availableFrom;
  bool _saving = false;

  bool get _isEditing => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final state = context.read<AppState>();
    _cropId = widget.existing?.cropId ??
        (state.crops.isNotEmpty ? state.crops.first.id : null);
    _district = widget.existing?.district ?? state.user?.district;
    _grade = widget.existing?.grade ?? 'A';
    _availableFrom = widget.existing == null
        ? DateTime.now()
        : DateTime.tryParse(widget.existing!.availableFrom);
    _quantityController = TextEditingController(
      text: widget.existing == null
          ? ''
          : widget.existing!.quantity.toStringAsFixed(0),
    );
    _priceController = TextEditingController(
      text: widget.existing == null
          ? ''
          : widget.existing!.askingPrice.toStringAsFixed(0),
    );
    _phoneController = TextEditingController(
      text: widget.existing?.contactPhone ?? state.user?.phone ?? '',
    );
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _priceController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final picked = await showDatePicker(
      context: context,
      initialDate: _availableFrom ?? today,
      firstDate: _isEditing ? DateTime(now.year - 1) : today,
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) setState(() => _availableFrom = picked);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_availableFrom == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pick an availability date')),
      );
      return;
    }
    setState(() => _saving = true);
    final state = context.read<AppState>();
    final now = DateTime.now();

    if (_isEditing) {
      final updated = widget.existing!.copyWith(
        cropId: _cropId,
        quantity: double.parse(_quantityController.text.trim()),
        askingPrice: double.parse(_priceController.text.trim()),
        district: _district,
        grade: _grade,
        availableFrom: toDateStr(_availableFrom!),
        contactPhone: _phoneController.text.trim(),
      );
      await state.updateListing(updated);
    } else {
      final listing = Listing(
        id: 'listing_${now.millisecondsSinceEpoch}',
        userId: state.user!.id,
        cropId: _cropId!,
        quantity: double.parse(_quantityController.text.trim()),
        askingPrice: double.parse(_priceController.text.trim()),
        district: _district ?? state.user!.district,
        grade: _grade,
        availableFrom: toDateStr(_availableFrom!),
        status: 'Active',
        contactPhone: _phoneController.text.trim(),
        createdAt: now.toIso8601String(),
      );
      await state.addListing(listing);
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(
                _isEditing ? 'Listing updated' : 'Listing posted')),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(
          title: Text(_isEditing ? 'Edit Listing' : 'Post a Listing')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    DropdownButtonFormField<String>(
                      initialValue: _cropId,
                      decoration: const InputDecoration(labelText: 'Crop'),
                      items: state.crops
                          .map((c) => DropdownMenuItem(
                              value: c.id, child: Text(c.name)))
                          .toList(),
                      onChanged: (v) => setState(() => _cropId = v),
                      validator: (v) =>
                          v == null ? 'Select a crop' : null,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _quantityController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Quantity (× 40 kg)',
                              helperText: 'In maunds of 40 kg',
                            ),
                            validator: (v) {
                              final q =
                                  double.tryParse(v?.trim() ?? '');
                              if (q == null || q <= 0) {
                                return 'Quantity must be > 0';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _priceController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Asking price (Rs/40 kg)',
                            ),
                            validator: (v) {
                              final p =
                                  double.tryParse(v?.trim() ?? '');
                              if (p == null || p <= 0) {
                                return 'Price must be > 0';
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _district,
                            decoration:
                                const InputDecoration(labelText: 'District'),
                            items: sindhDistricts
                                .map((d) => DropdownMenuItem(
                                    value: d, child: Text(d)))
                                .toList(),
                            onChanged: (v) =>
                                setState(() => _district = v),
                            validator: (v) =>
                                v == null ? 'Select district' : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _grade,
                            decoration:
                                const InputDecoration(labelText: 'Grade'),
                            items: const [
                              DropdownMenuItem(
                                  value: 'A', child: Text('Grade A')),
                              DropdownMenuItem(
                                  value: 'B', child: Text('Grade B')),
                              DropdownMenuItem(
                                  value: 'C', child: Text('Grade C')),
                            ],
                            onChanged: (v) =>
                                setState(() => _grade = v ?? 'A'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Contact phone',
                        hintText: '03XX XXXXXXX',
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                      validator: (v) {
                        final digits = (v?.trim() ?? '')
                            .replaceAll(RegExp(r'[^0-9]'), '');
                        if (digits.length < 10 || digits.length > 12) {
                          return 'Enter a valid phone number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    InkWell(
                      onTap: _pickDate,
                      borderRadius: BorderRadius.circular(12),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Available from',
                          prefixIcon: Icon(Icons.calendar_today_outlined),
                        ),
                        child: Text(
                          _availableFrom == null
                              ? 'Pick a date'
                              : formatDateShort(toDateStr(_availableFrom!)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _saving ? null : _save,
                      child: _saving
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : Text(_isEditing
                              ? 'Save Changes'
                              : 'Post Listing'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
