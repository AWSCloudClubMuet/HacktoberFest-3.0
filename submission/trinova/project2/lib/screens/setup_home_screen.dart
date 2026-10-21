import 'package:flutter/material.dart';

/// Temporary home screen used only to confirm the Flutter project runs.
/// Feature screens will replace this in later phases.
class SetupHomeScreen extends StatelessWidget {
  const SetupHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('KisanMandi'),
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'KisanMandi',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 12),
              Text(
                'Crop Prices & Produce Marketplace',
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 24),
              Text(
                'Project setup is ready. Business features are not implemented yet.',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
