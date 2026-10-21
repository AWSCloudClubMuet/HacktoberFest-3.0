String formatRupees(num value, {bool showSign = false}) {
  final negative = value < 0;
  final s = value.abs().toStringAsFixed(0);
  final buffer = StringBuffer();
  for (int i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) {
      buffer.write(',');
    }
    buffer.write(s[i]);
  }
  final sign = negative ? '-' : (showSign ? '+' : '');
  return sign.isEmpty ? 'Rs $buffer' : '$sign Rs $buffer';
}

String formatDateShort(String dateStr) {
  // dateStr is YYYY-MM-DD
  final parts = dateStr.split('-');
  if (parts.length != 3) return dateStr;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  final monthIndex = int.tryParse(parts[1]);
  if (monthIndex == null || monthIndex < 1 || monthIndex > 12) return dateStr;
  return '${int.parse(parts[2])} ${months[monthIndex - 1]}';
}

String toDateStr(DateTime d) {
  return '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';
}

/// Normalises a Pakistani phone number to international format for wa.me.
/// e.g. 03001234567 -> 923001234567, +92 300 1234567 -> 923001234567
String whatsappNumber(String phone) {
  var digits = phone.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.startsWith('0092')) {
    digits = digits.substring(4);
  } else if (digits.startsWith('92')) {
    // already international
  } else if (digits.startsWith('0')) {
    digits = '92${digits.substring(1)}';
  } else {
    digits = '92$digits';
  }
  return digits;
}

String telNumber(String phone) {
  var digits = phone.replaceAll(RegExp(r'[^0-9+]'), '');
  if (digits.isEmpty) return phone;
  return digits;
}
