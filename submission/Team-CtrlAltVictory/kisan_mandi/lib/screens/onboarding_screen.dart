import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../services/app_state.dart';
import '../utils/constants.dart';
import '../utils/format.dart';
import '../widgets/common.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final phoneController = TextEditingController();

  String selectedDistrict = kDistricts.first;
  String selectedRole = 'farmer';
  bool isLoading = false;

  @override
  void dispose() {
    nameController.dispose();
    phoneController.dispose();
    super.dispose();
  }

  String? validateName(String? value) {
    if (value == null || value.trim().length < 2) {
      return 'Enter your name';
    }
    return null;
  }

  String? validatePhone(String? value) {
    if (!isValidPkMobile(value ?? '')) {
      return 'Use format 03XXXXXXXXX (11 digits)';
    }
    return null;
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) {
      return;
    }

    final app = AppScope.read(context);

    setState(() {
      isLoading = true;
    });

    try {
      await app.signIn(
        name: nameController.text.trim(),
        phone: normalizePhone(phoneController.text),
        district: selectedDistrict,
        role: selectedRole,
      );
    } on ApiException catch (e) {
      if (mounted) {
        showSnack(context, e.message);
      }
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 16),
                Center(
                  child: Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFC8E6C9), width: 1.5),
                    ),
                    child: const Icon(
                      Icons.agriculture_rounded,
                      size: 38,
                      color: Color(0xFF1E6F3D),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'KisanMandi',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1B241B),
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Crop prices & produce marketplace for Sindh',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF556353),
                  ),
                ),
                const SizedBox(height: 28),
                buildNameField(),
                const SizedBox(height: 16),
                buildPhoneField(),
                const SizedBox(height: 16),
                buildDistrictDropdown(),
                const SizedBox(height: 16),
                buildRoleButtons(),
                const SizedBox(height: 24),
                buildContinueButton(),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F4EF),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE0E7DE)),
                  ),
                  child: Column(
                    children: [
                      const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.info_outline, size: 14, color: Color(0xFF556353)),
                          SizedBox(width: 6),
                          Text(
                            'Sample accounts',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Color(0xFF2A362B)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Farmer: 03001234501   •   Buyer: 03001234504',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget buildNameField() {
    return TextFormField(
      controller: nameController,
      textCapitalization: TextCapitalization.words,
      decoration: const InputDecoration(
        labelText: 'Full name',
        border: OutlineInputBorder(),
      ),
      validator: validateName,
    );
  }

  Widget buildPhoneField() {
    return TextFormField(
      controller: phoneController,
      keyboardType: TextInputType.phone,
      decoration: const InputDecoration(
        labelText: 'Mobile number',
        hintText: '03001234567',
        helperText:
            'If this number is already registered, you are signed in to it.',
        border: OutlineInputBorder(),
      ),
      validator: validatePhone,
    );
  }

  Widget buildDistrictDropdown() {
    final List<DropdownMenuItem<String>> items = [];
    for (final district in kDistricts) {
      items.add(DropdownMenuItem(value: district, child: Text(district)));
    }

    return LabeledDropdown<String>(
      label: 'District',
      value: selectedDistrict,
      items: items,
      onChanged: (value) {
        setState(() {
          selectedDistrict = value ?? selectedDistrict;
        });
      },
    );
  }

  Widget buildRoleButtons() {
    return SegmentedButton<String>(
      segments: const [
        ButtonSegment(
          value: 'farmer',
          label: Text('Farmer'),
          icon: Icon(Icons.agriculture),
        ),
        ButtonSegment(
          value: 'buyer',
          label: Text('Buyer'),
          icon: Icon(Icons.shopping_basket),
        ),
      ],
      selected: {selectedRole},
      onSelectionChanged: (selection) {
        setState(() {
          selectedRole = selection.first;
        });
      },
    );
  }

  Widget buildContinueButton() {
    Widget buttonContent = const Text('Continue');
    if (isLoading) {
      buttonContent = const SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(strokeWidth: 2),
      );
    }

    return FilledButton(
      onPressed: isLoading ? null : submit,
      child: buttonContent,
    );
  }
}
