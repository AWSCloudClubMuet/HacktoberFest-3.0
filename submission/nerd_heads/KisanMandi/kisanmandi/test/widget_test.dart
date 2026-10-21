import 'package:flutter_test/flutter_test.dart';
import 'package:kisanmandi/utils/format.dart';

void main() {
  test('formatRupees adds thousands separators', () {
    expect(formatRupees(9500), 'Rs 9,500');
    expect(formatRupees(1234567), 'Rs 1,234,567');
    expect(formatRupees(400), 'Rs 400');
  });

  test('formatRupees supports signed output', () {
    expect(formatRupees(120, showSign: true), '+ Rs 120');
    expect(formatRupees(-250, showSign: true), '- Rs 250');
  });

  test('whatsappNumber normalises Pakistani numbers', () {
    expect(whatsappNumber('03001234567'), '923001234567');
    expect(whatsappNumber('+92 300 1234567'), '923001234567');
    expect(whatsappNumber('923001234567'), '923001234567');
  });

  test('toDateStr pads correctly', () {
    expect(toDateStr(DateTime(2026, 1, 5)), '2026-01-05');
    expect(toDateStr(DateTime(2026, 10, 21)), '2026-10-21');
  });
}
