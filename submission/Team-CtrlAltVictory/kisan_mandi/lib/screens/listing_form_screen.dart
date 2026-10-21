import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_service.dart';
import '../services/app_state.dart';
import '../utils/constants.dart';
import '../utils/format.dart';
import '../widgets/common.dart';

class ListingFormScreen extends StatefulWidget {
  const ListingFormScreen({super.key, this.existing});

  final Listing? existing;

  @override
  State<ListingFormScreen> createState() => _ListingFormScreenState();
}

class _ListingFormScreenState extends State<ListingFormScreen> {
  final formKey = GlobalKey<FormState>();

  final quantityController = TextEditingController();
  final priceController = TextEditingController();
  final contactController = TextEditingController();
  final dateController = TextEditingController();

  int selectedCropId = 0;
  String selectedGrade = 'A';
  String selectedDistrict = kDistricts.first;
  bool isSaving = false;

  bool get isEditing => widget.existing != null;

  @override
  void initState() {
    super.initState();

    final app = AppScope.read(context);
    final existing = widget.existing;

    if (existing != null) {
      selectedCropId = existing.cropId;
      selectedGrade = existing.grade;
      selectedDistrict = existing.district;
      quantityController.text = fmtQty(existing.quantity);
      priceController.text = fmtQty(existing.pricePerMaund);
      contactController.text = existing.contact;
      dateController.text = existing.availableFrom;
    } else {
      selectedCropId = app.crops.first.id;
      selectedDistrict = app.user!.district;
      contactController.text = app.user!.phone;
      dateController.text = isoDate(DateTime.now());
    }
  }

  @override
  void dispose() {
    quantityController.dispose();
    priceController.dispose();
    contactController.dispose();
    dateController.dispose();
    super.dispose();
  }

  DateTime getToday() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
  }

  Future<void> pickDate() async {
    final today = getToday();

    DateTime startDate = today;
    final parsed = DateTime.tryParse(dateController.text);
    if (parsed != null) {
      startDate = DateTime(parsed.year, parsed.month, parsed.day);
    }

    DateTime firstDate = today;
    if (startDate.isBefore(today)) {
      firstDate = startDate;
    }

    final lastDate = today.add(const Duration(days: 120));
    if (startDate.isAfter(lastDate)) {
      startDate = lastDate;
    }

    final picked = await showDatePicker(
      context: context,
      initialDate: startDate,
      firstDate: firstDate,
      lastDate: lastDate,
    );

    if (picked != null) {
      setState(() {
        dateController.text = isoDate(picked);
      });
    }
  }

  String? validatePositiveNumber(
      String? value, String fieldName, double maxValue) {
    final number = double.tryParse((value ?? '').trim());

    if (number == null) {
      return 'Enter $fieldName';
    }
    if (number <= 0) {
      return '$fieldName must be more than 0';
    }
    if (number > maxValue) {
      return '$fieldName is too large';
    }
    return null;
  }

  String? validateDate(String? value) {
    final date = DateTime.tryParse(value ?? '');

    if (date == null) {
      return 'Pick a date';
    }
    if (!isEditing && date.isBefore(getToday())) {
      return 'Date cannot be in the past';
    }
    return null;
  }

  String? validateContact(String? value) {
    if (!isValidPkMobile(value ?? '')) {
      return 'Use format 03XXXXXXXXX (11 digits)';
    }
    return null;
  }

  Future<void> saveListing() async {
    if (!formKey.currentState!.validate()) {
      return;
    }

    final app = AppScope.read(context);
    final existing = widget.existing;

    String status = 'active';
    String createdAt = DateTime.now().toIso8601String();
    if (existing != null) {
      status = existing.status;
      createdAt = existing.createdAt;
    }

    final listing = Listing(
      id: existing?.id,
      userId: app.user!.id,
      cropId: selectedCropId,
      quantity: double.parse(quantityController.text.trim()),
      pricePerMaund: double.parse(priceController.text.trim()),
      grade: selectedGrade,
      district: selectedDistrict,
      availableFrom: dateController.text,
      contact: normalizePhone(contactController.text),
      status: status,
      createdAt: createdAt,
    );

    setState(() {
      isSaving = true;
    });

    try {
      await app.saveListing(listing);
      if (mounted) {
        Navigator.pop(context, true);
      }
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          isSaving = false;
        });
        showSnack(context, e.message);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);

    String title = 'New listing';
    if (isEditing) {
      title = 'Edit listing';
    }

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Form(
        key: formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            buildCropDropdown(app),
            const SizedBox(height: 16),
            buildQuantityAndPrice(),
            const SizedBox(height: 16),
            buildGradeAndDistrict(),
            const SizedBox(height: 16),
            buildDateField(),
            const SizedBox(height: 16),
            buildContactField(),
            const SizedBox(height: 24),
            buildSaveButton(),
          ],
        ),
      ),
    );
  }

  Widget buildCropDropdown(AppState app) {
    final List<DropdownMenuItem<int>> items = [];
    for (final crop in app.crops) {
      items.add(DropdownMenuItem(value: crop.id, child: Text(crop.name)));
    }

    return LabeledDropdown<int>(
      label: 'Crop',
      value: selectedCropId,
      items: items,
      onChanged: (value) {
        setState(() {
          selectedCropId = value ?? selectedCropId;
        });
      },
    );
  }

  Widget buildQuantityAndPrice() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: TextFormField(
            controller: quantityController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'Quantity (maund)',
              border: OutlineInputBorder(),
            ),
            validator: (value) =>
                validatePositiveNumber(value, 'Quantity', 100000),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: TextFormField(
            controller: priceController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'Price / maund (Rs)',
              border: OutlineInputBorder(),
            ),
            validator: (value) =>
                validatePositiveNumber(value, 'Price', 1000000),
          ),
        ),
      ],
    );
  }

  Widget buildGradeAndDistrict() {
    final List<DropdownMenuItem<String>> gradeItems = [];
    for (final grade in kGrades) {
      gradeItems
          .add(DropdownMenuItem(value: grade, child: Text('Grade $grade')));
    }

    final List<DropdownMenuItem<String>> districtItems = [];
    for (final district in kDistricts) {
      districtItems
          .add(DropdownMenuItem(value: district, child: Text(district)));
    }

    return Row(
      children: [
        Expanded(
          child: LabeledDropdown<String>(
            label: 'Grade',
            value: selectedGrade,
            items: gradeItems,
            onChanged: (value) {
              setState(() {
                selectedGrade = value ?? selectedGrade;
              });
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: LabeledDropdown<String>(
            label: 'District',
            value: selectedDistrict,
            items: districtItems,
            onChanged: (value) {
              setState(() {
                selectedDistrict = value ?? selectedDistrict;
              });
            },
          ),
        ),
      ],
    );
  }

  Widget buildDateField() {
    return TextFormField(
      controller: dateController,
      readOnly: true,
      onTap: pickDate,
      decoration: const InputDecoration(
        labelText: 'Available from',
        suffixIcon: Icon(Icons.calendar_today),
        border: OutlineInputBorder(),
      ),
      validator: validateDate,
    );
  }

  Widget buildContactField() {
    return TextFormField(
      controller: contactController,
      keyboardType: TextInputType.phone,
      decoration: const InputDecoration(
        labelText: 'Contact number',
        hintText: '03001234567',
        border: OutlineInputBorder(),
      ),
      validator: validateContact,
    );
  }

  Widget buildSaveButton() {
    Widget content;
    if (isSaving) {
      content = const SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(strokeWidth: 2),
      );
    } else if (isEditing) {
      content = const Text('Save changes');
    } else {
      content = const Text('Post listing');
    }

    return FilledButton(
      onPressed: isSaving ? null : saveListing,
      child: content,
    );
  }
}
