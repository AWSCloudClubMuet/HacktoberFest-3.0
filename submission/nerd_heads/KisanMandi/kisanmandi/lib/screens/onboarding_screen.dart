import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../theme/app_theme.dart';

const List<String> sindhDistricts = [
  'Badin',
  'Dadu',
  'Ghotki',
  'Jacobabad',
  'Jamshoro',
  'Kambar-Shahdadkot',
  'Karachi',
  'Kashmore',
  'Kherpur',
  'Larkana',
  'Matiari',
  'Mirpurkhas',
  'Naushahro Feroze',
  'Shaheed Benazir Abad',
  'Shikarpur',
  'Sujawal',
  'Sukkur',
  'Tando Allahyar',
  'Tando Muhammad Khan',
  'Tharparkar',
  'Thatta',
  'Umerkot',
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  String? _district;
  String _role = 'Farmer';
  bool _saving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_district == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your district')),
      );
      return;
    }
    setState(() => _saving = true);
    await context.read<AppState>().completeOnboarding(
          name: _nameController.text.trim(),
          phone: _phoneController.text.trim(),
          district: _district!,
          role: _role,
        );
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Icon(Icons.agriculture,
                            size: 56, color: AppTheme.seed),
                        const SizedBox(height: 8),
                        Text(
                          'Welcome to KisanMandi',
                          textAlign: TextAlign.center,
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Crop prices & produce marketplace for Sindh',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: 20),
                        TextFormField(
                          controller: _nameController,
                          textCapitalization: TextCapitalization.words,
                          decoration: const InputDecoration(
                            labelText: 'Full name',
                            prefixIcon: Icon(Icons.person_outline),
                          ),
                          validator: (v) {
                            if (v == null || v.trim().length < 2) {
                              return 'Enter your name';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            labelText: 'Phone number',
                            hintText: '03XX XXXXXXX',
                            prefixIcon: Icon(Icons.phone_outlined),
                          ),
                          validator: (v) {
                            final value = v?.trim() ?? '';
                            final digits =
                                value.replaceAll(RegExp(r'[^0-9]'), '');
                            if (digits.length < 10 || digits.length > 12) {
                              return 'Enter a valid phone number';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          initialValue: _district,
                          decoration: const InputDecoration(
                            labelText: 'District',
                            prefixIcon: Icon(Icons.location_on_outlined),
                          ),
                          items: sindhDistricts
                              .map((d) =>
                                  DropdownMenuItem(value: d, child: Text(d)))
                              .toList(),
                          onChanged: (v) => setState(() => _district = v),
                          validator: (v) =>
                              v == null ? 'Select your district' : null,
                        ),
                        const SizedBox(height: 16),
                        Text('I am a...',
                            style: Theme.of(context).textTheme.titleSmall),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: _RoleCard(
                                icon: Icons.agriculture,
                                label: 'Farmer',
                                selected: _role == 'Farmer',
                                onTap: () =>
                                    setState(() => _role = 'Farmer'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _RoleCard(
                                icon: Icons.storefront,
                                label: 'Buyer',
                                selected: _role == 'Buyer',
                                onTap: () =>
                                    setState(() => _role = 'Buyer'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        FilledButton(
                          onPressed: _saving ? null : _submit,
                          child: _saving
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Get Started'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppTheme.seed : Colors.grey.shade100,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppTheme.seed : Colors.grey.shade400,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon,
                  size: 32, color: selected ? Colors.white : Colors.grey),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  color: selected ? Colors.white : Colors.black87,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
