import 'package:flutter/material.dart';

import 'app.dart';
import 'app_state.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  appState.init();
  runApp(const KisanMandiApp());
}