import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../domain/models.dart';
import 'theme.dart';

class Wordmark extends StatelessWidget {
  const Wordmark({super.key});
  @override
  Widget build(BuildContext context) => const Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      SizedBox(width: 30, height: 30, child: TextileMark()),
      SizedBox(width: 10),
      Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: 'kisan',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
            TextSpan(
              text: 'mandi',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
          ],
        ),
        style: TextStyle(
          fontFamily: 'Manrope',
          fontSize: 21,
          letterSpacing: -1.1,
          color: midnight,
        ),
      ),
    ],
  );
}

class Eyebrow extends StatelessWidget {
  final String text;
  final Color color;
  const Eyebrow(this.text, {super.key, this.color = muted});
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: TextStyle(
      fontSize: 9,
      fontWeight: FontWeight.w800,
      letterSpacing: 1.7,
      color: color,
    ),
  );
}

class PageIntro extends StatelessWidget {
  final String label, title;
  final String? description;
  final Widget? action;
  const PageIntro({
    super.key,
    required this.label,
    required this.title,
    this.description,
    this.action,
  });
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Eyebrow(label, color: rust),
      const SizedBox(height: 10),
      Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.headlineLarge,
            ),
          ),
          if (action != null) ...[const SizedBox(width: 12), action!],
        ],
      ),
      if (description != null) ...[
        const SizedBox(height: 12),
        Text(description!, style: const TextStyle(color: muted)),
      ],
    ],
  );
}

// An eight-point rosette, drawn as vectors so the mark stays crisp at any size.
class TextileMark extends StatelessWidget {
  final Color color;
  const TextileMark({super.key, this.color = rust});
  @override
  Widget build(BuildContext context) =>
      CustomPaint(painter: _TextilePainter(color));
}

class _TextilePainter extends CustomPainter {
  final Color color;
  const _TextilePainter(this.color);
  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.translate(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) * .45;
    final star = Path();
    for (var i = 0; i < 16; i++) {
      final angle = i * math.pi / 8;
      final r = radius * (i.isEven ? 1 : .59);
      final x = math.cos(angle) * r, y = math.sin(angle) * r;
      if (i == 0) {
        star.moveTo(x, y);
      } else {
        star.lineTo(x, y);
      }
    }
    star.close();
    star.addOval(Rect.fromCircle(center: Offset.zero, radius: radius * .29));
    star.fillType = PathFillType.evenOdd;
    canvas.drawPath(star, Paint()..color = color);
    canvas.drawCircle(Offset.zero, radius * .11, Paint()..color = color);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _TextilePainter oldDelegate) =>
      oldDelegate.color != color;
}

class Paper extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;
  const Paper({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.color = paper,
  });
  @override
  Widget build(BuildContext context) => Container(
    padding: padding,
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: color == midnight ? midnight : line),
    ),
    child: child,
  );
}

class SectionTitle extends StatelessWidget {
  final String title;
  final String? note;
  const SectionTitle(this.title, {super.key, this.note});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 24, bottom: 14),
    child: Row(
      children: [
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleLarge),
        ),
        if (note != null) ...[
          const SizedBox(width: 12),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 100),
            child: Text(
              note!,
              textAlign: TextAlign.end,
              style: const TextStyle(fontSize: 10, color: muted),
            ),
          ),
        ],
      ],
    ),
  );
}

class Tag extends StatelessWidget {
  final String text;
  final Color color;
  const Tag(this.text, {super.key, this.color = positive});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .09),
      borderRadius: BorderRadius.circular(5),
    ),
    child: Text(
      text,
      style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
    ),
  );
}

class EmptyState extends StatelessWidget {
  final String title, message;
  final IconData icon;
  final Widget? action;
  const EmptyState({
    super.key,
    required this.title,
    required this.message,
    this.icon = Icons.spa_outlined,
    this.action,
  });
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 52, horizontal: 16),
    child: Column(
      children: [
        Icon(icon, size: 42, color: positive),
        const SizedBox(height: 16),
        Text(
          title,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: muted),
        ),
        if (action != null)
          Padding(padding: const EdgeInsets.only(top: 20), child: action!),
      ],
    ),
  );
}

class DropField extends StatelessWidget {
  final String label, value;
  final Map<String, String> options;
  final ValueChanged<String> onChanged;
  const DropField({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
  });
  @override
  Widget build(BuildContext context) => DropdownButtonFormField<String>(
    // Key recreates the field when a parent selection changes.
    key: ValueKey('$label:$value'),
    initialValue: value,
    isExpanded: true,
    decoration: InputDecoration(labelText: label),
    items: options.entries
        .map(
          (e) => DropdownMenuItem(
            value: e.key,
            child: Text(e.value, overflow: TextOverflow.ellipsis),
          ),
        )
        .toList(),
    onChanged: (v) {
      if (v != null) onChanged(v);
    },
  );
}

Color cropPaper(String name) => switch (name) {
  'Wheat' || 'Rice' => const Color(0xFFF4E8CC),
  'Cotton' => const Color(0xFFE5E9F0),
  'Sugarcane' => const Color(0xFFE4EADD),
  'Onion' => const Color(0xFFF0E0E5),
  'Tomato' => const Color(0xFFF8E2D6),
  _ => const Color(0xFFF8ECCB),
};

class CropIcon extends StatelessWidget {
  final String name;
  final double size;
  const CropIcon(this.name, {super.key, this.size = 50});
  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      color: cropPaper(name),
      borderRadius: BorderRadius.circular(12),
    ),
    alignment: Alignment.center,
    child: SizedBox(
      width: size * .67,
      height: size * .67,
      child: CustomPaint(painter: _CropPainter(name)),
    ),
  );
}

class _CropPainter extends CustomPainter {
  final String name;
  _CropPainter(this.name);
  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 40, size.height / 40);
    final green = Paint()..color = positive;
    final stalk = Paint()
      ..color = positive
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    if (name == 'Wheat') {
      canvas.drawLine(const Offset(14, 36), const Offset(23, 6), stalk);
      for (var i = 0; i < 5; i++) {
        final x = 17 + i * 1.3, y = 28 - i * 4.5;
        canvas.save();
        canvas.translate(x, y);
        canvas.rotate(.65);
        canvas.drawOval(
          const Rect.fromLTWH(-7, -3, 8, 5),
          Paint()..color = const Color(0xFFCFAB54),
        );
        canvas.drawOval(
          const Rect.fromLTWH(1, -5, 8, 5),
          Paint()..color = const Color(0xFFDEBE6B),
        );
        canvas.restore();
      }
    } else if (name == 'Rice') {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          const Rect.fromLTWH(5, 18, 30, 15),
          const Radius.circular(10),
        ),
        Paint()..color = const Color(0xFF6E9188),
      );
      canvas.drawOval(
        const Rect.fromLTWH(5, 13, 30, 12),
        Paint()..color = const Color(0xFFDBE2C9),
      );
      for (var i = 0; i < 8; i++) {
        canvas.drawOval(
          Rect.fromLTWH(9 + (i % 4) * 6, 15 + (i ~/ 4) * 4, 4, 2),
          Paint()..color = Colors.white,
        );
      }
      canvas.drawLine(const Offset(9, 7), const Offset(30, 13), stalk);
    } else if (name == 'Cotton') {
      canvas.drawLine(const Offset(20, 34), const Offset(20, 20), stalk);
      canvas.drawOval(const Rect.fromLTWH(19, 26, 12, 5), green);
      final p = Paint()..color = const Color(0xFFCED9CB);
      for (final o in [
        const Offset(12, 19),
        const Offset(20, 12),
        const Offset(28, 19),
      ]) {
        canvas.drawCircle(o, 8, p);
      }
      p.color = Colors.white;
      for (final o in [
        const Offset(13, 17),
        const Offset(20, 11),
        const Offset(27, 17),
      ]) {
        canvas.drawCircle(o, 6, p);
      }
    } else if (name == 'Sugarcane') {
      for (var i = 0; i < 3; i++) {
        canvas.save();
        canvas.translate(10 + i * 9, 20);
        canvas.rotate((i - 1) * .15);
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            const Rect.fromLTWH(-2, -12, 5, 28),
            const Radius.circular(2),
          ),
          green,
        );
        for (var j = 0; j < 4; j++) {
          canvas.drawLine(
            Offset(-2, -7 + j * 6),
            Offset(3, -7 + j * 6),
            Paint()
              ..color = const Color(0xFFBDCE99)
              ..strokeWidth = 1.5,
          );
        }
        canvas.restore();
      }
      canvas.drawOval(const Rect.fromLTWH(17, 3, 16, 5), green);
    } else if (name == 'Onion') {
      final p = Path()
        ..moveTo(20, 10)
        ..cubicTo(17, 18, 6, 18, 7, 28)
        ..cubicTo(8, 39, 33, 38, 33, 27)
        ..cubicTo(34, 19, 23, 17, 20, 10);
      canvas.drawPath(p, Paint()..color = const Color(0xFFBE8C94));
      canvas.drawPath(
        Path()
          ..moveTo(20, 13)
          ..quadraticBezierTo(8, 29, 18, 34),
        Paint()
          ..color = const Color(0xFFE3B9B5)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2,
      );
      canvas.drawLine(const Offset(20, 13), const Offset(15, 5), stalk);
      canvas.drawLine(const Offset(20, 12), const Offset(24, 4), stalk);
    } else if (name == 'Tomato') {
      canvas.drawOval(
        const Rect.fromLTWH(5, 11, 31, 26),
        Paint()..color = const Color(0xFFD97657),
      );
      canvas.drawOval(
        const Rect.fromLTWH(10, 17, 5, 10),
        Paint()..color = const Color(0xFFEB9A78),
      );
      final star = Path();
      for (var i = 0; i < 10; i++) {
        final radius = i.isEven ? 10.0 : 4.0,
            angle = i * math.pi / 5 - math.pi / 2;
        final x = 20 + radius * math.cos(angle),
            y = 13 + radius * .6 * math.sin(angle);
        if (i == 0) {
          star.moveTo(x, y);
        } else {
          star.lineTo(x, y);
        }
      }
      canvas.drawPath(star..close(), green);
      canvas.drawLine(const Offset(20, 12), const Offset(23, 5), stalk);
    } else if (name == 'Mango') {
      canvas.save();
      canvas.translate(20, 23);
      canvas.rotate(.4);
      canvas.drawOval(
        const Rect.fromLTWH(-12, -14, 24, 29),
        Paint()..color = const Color(0xFFE1B45D),
      );
      canvas.drawOval(
        const Rect.fromLTWH(-8, -8, 5, 17),
        Paint()..color = const Color(0xFFF0D089),
      );
      canvas.restore();
      canvas.drawOval(const Rect.fromLTWH(19, 3, 15, 6), green);
    } else {
      final p = Path()
        ..moveTo(8, 10)
        ..quadraticBezierTo(4, 35, 28, 34)
        ..quadraticBezierTo(37, 31, 34, 24)
        ..quadraticBezierTo(19, 31, 8, 10);
      canvas.drawPath(p, Paint()..color = const Color(0xFFE1BE60));
      canvas.drawPath(
        Path()
          ..moveTo(11, 15)
          ..quadraticBezierTo(14, 33, 31, 29),
        Paint()
          ..color = const Color(0xFFF4D77E)
          ..strokeWidth = 2
          ..style = PaintingStyle.stroke,
      );
      canvas.drawLine(const Offset(8, 10), const Offset(8, 6), stalk);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _CropPainter oldDelegate) =>
      oldDelegate.name != name;
}

class PriceChart extends StatelessWidget {
  final List<Price> data;
  const PriceChart(this.data, {super.key});
  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const SizedBox(
        height: 220,
        child: Center(child: Text('No price history available')),
      );
    }
    final values = data.map((p) => p.price).toList();
    final low = values.reduce(math.min), high = values.reduce(math.max);
    return Semantics(
      label:
          '14-day price chart. Minimum ${money(low)}, maximum ${money(high)}.',
      child: SizedBox(
        width: double.infinity,
        height: 230,
        child: CustomPaint(painter: _ChartPainter(data)),
      ),
    );
  }
}

class _ChartPainter extends CustomPainter {
  final List<Price> data;
  _ChartPainter(this.data);
  void label(Canvas canvas, String text, Offset offset, {Color color = muted}) {
    final tp = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(color: color, fontSize: 10, fontFamily: 'Manrope'),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, offset);
  }

  @override
  void paint(Canvas canvas, Size size) {
    final values = data.map((p) => p.price).toList();
    final lowest = values.reduce(math.min), highest = values.reduce(math.max);
    final padding = math.max((highest - lowest) * .25, highest * .01);
    final low = lowest - padding, high = highest + padding;
    const left = 48.0, top = 16.0;
    final width = size.width - left - 8, height = size.height - 48;
    for (var i = 0; i < 4; i++) {
      final y = top + height * i / 3;
      canvas.drawLine(
        Offset(left, y),
        Offset(left + width, y),
        Paint()..color = line,
      );
      label(
        canvas,
        money(high - (high - low) * i / 3, currency: false),
        Offset(0, y - 6),
      );
    }
    Offset point(int i) => Offset(
      left + width * i / math.max(1, data.length - 1),
      top + height * (high - values[i]) / (high - low),
    );
    final path = Path()..moveTo(point(0).dx, point(0).dy);
    for (var i = 1; i < data.length; i++) {
      path.lineTo(point(i).dx, point(i).dy);
    }
    final fill = Path.from(path)
      ..lineTo(point(data.length - 1).dx, top + height)
      ..lineTo(left, top + height)
      ..close();
    canvas.drawPath(
      fill,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            saffron.withValues(alpha: .35),
            saffron.withValues(alpha: .02),
          ],
        ).createShader(Rect.fromLTWH(left, top, width, height)),
    );
    canvas.drawPath(
      path,
      Paint()
        ..color = midnight
        ..strokeWidth = 2.5
        ..style = PaintingStyle.stroke
        ..strokeJoin = StrokeJoin.round,
    );
    canvas.drawCircle(point(data.length - 1), 5, Paint()..color = rust);
    for (final i in {0, data.length ~/ 2, data.length - 1}) {
      final d = data[i].date.substring(5);
      label(
        canvas,
        d,
        Offset(
          (point(i).dx - 15).clamp(left - 12, size.width - 35),
          top + height + 14,
        ),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ChartPainter oldDelegate) =>
      oldDelegate.data != data;
}

class FieldLandscape extends StatelessWidget {
  const FieldLandscape({super.key});
  @override
  Widget build(BuildContext context) => CustomPaint(painter: _FieldPainter());
}

class _FieldPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(Offset.zero & size, Paint()..color = midnight);
    canvas.drawCircle(
      Offset(w * .76, h * .34),
      h * .23,
      Paint()..color = saffron,
    );
    final back = Path()
      ..moveTo(0, h * .78)
      ..quadraticBezierTo(w * .45, h * .2, w, h * .64)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(back, Paint()..color = const Color(0xFFA65F45));
    final front = Path()
      ..moveTo(0, h * .65)
      ..quadraticBezierTo(w * .55, h * .62, w, h * .9)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(front, Paint()..color = const Color(0xFFD4A676));
    for (var i = 0; i < 9; i++) {
      final p = Path()
        ..moveTo(w * (.18 + i * .05), h * .68)
        ..quadraticBezierTo(
          w * (i / 7),
          h * .82,
          w * (i / 6) - w * .15,
          h * 1.1,
        );
      canvas.drawPath(
        p,
        Paint()
          ..color = midnight.withValues(alpha: .5)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.3,
      );
    }
    final stroke = Paint()
      ..color = saffron
      ..strokeWidth = 1.4
      ..style = PaintingStyle.stroke;
    for (var i = 0; i < 3; i++) {
      final x = w * .08 + i * 15;
      final y = h * .55 - i * 9;
      canvas.drawLine(Offset(x, h), Offset(x + 8, y), stroke);
      for (var j = 0; j < 4; j++) {
        canvas.drawLine(
          Offset(x + 6 - j, y + 7 + j * 8),
          Offset(x - 2, y + j * 8),
          stroke,
        );
        canvas.drawLine(
          Offset(x + 6 - j, y + 7 + j * 8),
          Offset(x + 15, y + 1 + j * 8),
          stroke,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

Future<bool> confirmDelete(BuildContext context, String noun) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete $noun?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    ) ??
    false;

void showError(BuildContext context, Object error) =>
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(error.toString()),
        behavior: SnackBarBehavior.floating,
      ),
    );
