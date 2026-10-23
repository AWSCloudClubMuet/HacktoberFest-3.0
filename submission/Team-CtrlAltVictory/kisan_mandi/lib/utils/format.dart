const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

String fmtNum(num v) {
  final r = v.round().abs();
  final s = r.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');
  return v.round() < 0 ? '-$s' : s;
}

String fmtRs(num v, {bool sign = false}) {
  final rounded = v.round();
  final body = fmtNum(rounded.abs());
  final prefix = rounded < 0 ? '-' : (sign && rounded > 0 ? '+' : '');
  return '${prefix}Rs $body';
}

String fmtQty(num v) => v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(1);

String fmtPct(double v) => '${v > 0 ? '+' : ''}${v.toStringAsFixed(1)}%';

String fmtDate(String iso) {
  final d = DateTime.tryParse(iso);
  if (d == null) return iso;
  return '${d.day} ${_months[d.month - 1]}';
}

String isoDate(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

String normalizePhone(String s) => s.replaceAll(RegExp(r'[\s-]'), '');

bool isValidPkMobile(String s) => RegExp(r'^03\d{9}$').hasMatch(normalizePhone(s));
