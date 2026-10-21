import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

String money(double v) {
  final digits = v.round().abs().toString();
  final buf = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) buf.write(',');
    buf.write(digits[i]);
  }
  return '${v.round() < 0 ? '-' : ''}Rs $buf';
}

String numText(double v) => v % 1 == 0 ? v.toInt().toString() : v.toString();

String changeText(double diff, double pct) {
  final sign = diff > 0 ? '+' : (diff < 0 ? '-' : '');
  return '$sign${money(diff.abs())} ($sign${pct.abs().toStringAsFixed(1)}%)';
}

String dateToIso(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

String shortDate(String iso) =>
    iso.length >= 10 ? '${iso.substring(8, 10)}/${iso.substring(5, 7)}' : iso;

String fullDate(String iso) => iso.length >= 10
    ? '${iso.substring(8, 10)}/${iso.substring(5, 7)}/${iso.substring(0, 4)}'
    : iso;

String? validatePhone(String? value) {
  final cleaned = (value ?? '').replaceAll(RegExp(r'[\s-]'), '');
  if (!RegExp(r'^(\+92|92|0)3\d{9}$').hasMatch(cleaned)) {
    return 'Enter a valid mobile number, e.g. 0300 1234567';
  }
  return null;
}

String cleanPhone(String value) => value.replaceAll(RegExp(r'[\s-]'), '');

String waNumber(String phone) {
  var p = phone.replaceAll(RegExp(r'[^0-9]'), '');
  if (p.startsWith('0')) p = '92${p.substring(1)}';
  return p;
}

void showSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

Future<bool> confirm(
  BuildContext context,
  String title,
  String message, {
  String action = 'Delete',
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel')),
        FilledButton(
            onPressed: () => Navigator.pop(ctx, true), child: Text(action)),
      ],
    ),
  );
  return result ?? false;
}

Future<void> _open(BuildContext context, Uri uri) async {
  var ok = false;
  try {
    ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
  } catch (_) {}
  if (!ok && context.mounted) {
    showSnack(context, 'Could not open this on this device.');
  }
}

Future<void> callPhone(BuildContext context, String phone) =>
    _open(context, Uri(scheme: 'tel', path: cleanPhone(phone)));

Future<void> openWhatsApp(BuildContext context, String phone) =>
    _open(context, Uri.parse('https://wa.me/${waNumber(phone)}'));