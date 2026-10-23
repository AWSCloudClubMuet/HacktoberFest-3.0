import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../services/app_state.dart';
import '../utils/constants.dart';
import '../utils/format.dart';
import '../utils/theme.dart';
import '../widgets/brand.dart';
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
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SingleChildScrollView(
        child: Column(
          children: [
            buildHero(),
            Transform.translate(
              offset: const Offset(0, -30),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: AppShadows.lift,
                  ),
                  child: Form(
                    key: formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Get started',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: AppColors.ink,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Sign in or create your account in seconds.',
                          style: TextStyle(color: AppColors.muted, fontSize: 13),
                        ),
                        const SizedBox(height: 20),
                        buildRoleButtons(),
                        const SizedBox(height: 16),
                        buildNameField(),
                        const SizedBox(height: 14),
                        buildPhoneField(),
                        const SizedBox(height: 14),
                        buildDistrictDropdown(),
                        const SizedBox(height: 22),
                        buildContinueButton(),
                        const SizedBox(height: 18),
                        buildSampleAccounts(),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildHero() {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(40)),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -50,
            top: -50,
            child: Container(
              width: 190,
              height: 190,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.2), width: 28),
              ),
            ),
          ),
          Positioned(
            left: -60,
            bottom: -40,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.05),
              ),
            ),
          ),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 22, 24, 62),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: AppShadows.soft,
                    ),
                    child: const KisanLogo(width: 168),
                  ),
                  const SizedBox(height: 26),
                  const Text(
                    'Smart Solutions',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                      height: 1.05,
                      letterSpacing: -0.6,
                    ),
                  ),
                  const Text(
                    'for Modern Farmers',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                      height: 1.15,
                      letterSpacing: -0.6,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Live crop prices, a produce marketplace and price alerts — made for Sindh.',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.82),
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildSampleAccounts() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.goldSoft,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.bolt_rounded, size: 16, color: AppColors.goldDark),
              SizedBox(width: 6),
              Text(
                'Quick sign in with a sample account',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 12.5,
                  color: AppColors.goldDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              PillChip(
                icon: Icons.agriculture_rounded,
                label: 'Farmer • Ghulam Hussain',
                selected: false,
                onTap: () {
                  nameController.text = 'Ghulam Hussain';
                  phoneController.text = '03001234501';
                  setState(() {
                    selectedRole = 'farmer';
                    selectedDistrict = 'Hyderabad';
                  });
                },
              ),
              PillChip(
                icon: Icons.shopping_basket_rounded,
                label: 'Buyer • Zeeshan Traders',
                selected: false,
                onTap: () {
                  nameController.text = 'Zeeshan Traders';
                  phoneController.text = '03001234504';
                  setState(() {
                    selectedRole = 'buyer';
                    selectedDistrict = 'Karachi';
                  });
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget buildNameField() {
    return TextFormField(
      controller: nameController,
      textCapitalization: TextCapitalization.words,
      decoration: const InputDecoration(
        labelText: 'Full name',
        prefixIcon: Icon(Icons.person_outline_rounded, color: AppColors.green),
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
        helperMaxLines: 2,
        prefixIcon: Icon(Icons.phone_iphone_rounded, color: AppColors.green),
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
    return Row(
      children: [
        Expanded(
          child: roleCard(
            'farmer',
            'I am a Farmer',
            'Sell produce',
            Icons.agriculture_rounded,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: roleCard(
            'buyer',
            'I am a Buyer',
            'Find produce',
            Icons.shopping_basket_rounded,
          ),
        ),
      ],
    );
  }

  Widget roleCard(String role, String title, String sub, IconData icon) {
    final selected = selectedRole == role;
    return GestureDetector(
      onTap: () => setState(() => selectedRole = role),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? AppColors.green : AppColors.bg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.green : AppColors.line,
            width: 1.5,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: selected
                    ? Colors.white.withValues(alpha: 0.18)
                    : AppColors.greenSoft,
                shape: BoxShape.circle,
              ),
              child: Icon(icon,
                  size: 20, color: selected ? Colors.white : AppColors.green),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 14,
                color: selected ? Colors.white : AppColors.ink,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              sub,
              style: TextStyle(
                fontSize: 12,
                color: selected
                    ? Colors.white.withValues(alpha: 0.8)
                    : AppColors.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildContinueButton() {
    return FilledButton(
      onPressed: isLoading ? null : submit,
      child: isLoading
          ? const ButtonSpinner()
          : const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Continue'),
                SizedBox(width: 8),
                Icon(Icons.arrow_forward_rounded, size: 20),
              ],
            ),
    );
  }
}
