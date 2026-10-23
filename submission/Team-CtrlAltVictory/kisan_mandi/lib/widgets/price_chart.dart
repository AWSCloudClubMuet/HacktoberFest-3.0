import 'package:flutter/material.dart';

import '../models/models.dart';
import '../utils/format.dart';
import '../utils/theme.dart';

class PriceChart extends StatelessWidget {
  const PriceChart({super.key, required this.points, this.height = 200});
  final List<PricePoint> points;
  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: CustomPaint(
        painter: _ChartPainter(
          points: points,
          line: AppColors.green,
          grid: AppColors.line,
          text: AppColors.muted,
          accentMax: AppColors.up,
          accentMin: AppColors.down,
        ),
      ),
    );
  }
}

class _ChartPainter extends CustomPainter {
  _ChartPainter({
    required this.points,
    required this.line,
    required this.grid,
    required this.text,
    required this.accentMax,
    required this.accentMin,
  });
  final List<PricePoint> points;
  final Color line, grid, text, accentMax, accentMin;

  void _label(Canvas canvas, String s, Offset anchor, {bool rightAlign = false, bool center = false, double maxX = 1e9}) {
    final tp = TextPainter(
      text: TextSpan(text: s, style: TextStyle(color: text, fontSize: 10)),
      textDirection: TextDirection.ltr,
    )..layout();
    double dx = anchor.dx;
    if (rightAlign) dx -= tp.width;
    if (center) dx -= tp.width / 2;
    final upper = maxX - tp.width;
    if (upper >= 0) dx = dx.clamp(0.0, upper).toDouble();
    tp.paint(canvas, Offset(dx, anchor.dy - tp.height / 2));
  }

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length < 2) {
      _label(canvas, 'Not enough data', Offset(size.width / 2, size.height / 2),
          center: true, maxX: size.width);
      return;
    }
    const left = 46.0, right = 12.0, top = 12.0, bottom = 22.0;
    final w = size.width - left - right;
    final h = size.height - top - bottom;

    final values = points.map((p) => p.price).toList();
    final minV = values.reduce((a, b) => a < b ? a : b);
    final maxV = values.reduce((a, b) => a > b ? a : b);
    final range = (maxV - minV) < 1 ? 1.0 : (maxV - minV);
    final lo = minV - range * 0.1;
    final hi = maxV + range * 0.1;

    double x(int i) => left + w * i / (points.length - 1);
    double y(double v) => top + h * (1 - (v - lo) / (hi - lo));

    final gridPaint = Paint()
      ..color = grid.withValues(alpha: 0.4)
      ..strokeWidth = 0.8;
    for (var k = 0; k < 4; k++) {
      final v = lo + (hi - lo) * k / 3;
      final yy = y(v);
      canvas.drawLine(Offset(left, yy), Offset(size.width - right, yy), gridPaint);
      _label(canvas, fmtNum(v), Offset(left - 4, yy), rightAlign: true, maxX: size.width);
    }

    final path = Path()..moveTo(x(0), y(points.first.price));
    for (var i = 1; i < points.length; i++) {
      path.lineTo(x(i), y(points[i].price));
    }

    final fillPath = Path.from(path)
      ..lineTo(x(points.length - 1), top + h)
      ..lineTo(x(0), top + h)
      ..close();
    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          line.withValues(alpha: 0.15),
          line.withValues(alpha: 0.01),
        ],
      ).createShader(Rect.fromLTWH(left, top, w, h))
      ..style = PaintingStyle.fill;
    canvas.drawPath(fillPath, fillPaint);

    canvas.drawPath(
      path,
      Paint()
        ..color = line
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );

    final dot = Paint()..color = line;
    for (var i = 0; i < points.length; i++) {
      canvas.drawCircle(Offset(x(i), y(points[i].price)), 2.5, dot);
    }
    final iMax = values.indexOf(maxV);
    final iMin = values.indexOf(minV);
    canvas.drawCircle(Offset(x(iMax), y(maxV)), 5.5, Paint()..color = accentMax);
    canvas.drawCircle(Offset(x(iMax), y(maxV)), 2.5, Paint()..color = Colors.white);
    canvas.drawCircle(Offset(x(iMin), y(minV)), 5.5, Paint()..color = accentMin);
    canvas.drawCircle(Offset(x(iMin), y(minV)), 2.5, Paint()..color = Colors.white);

    final ly = size.height - bottom / 2;
    _label(canvas, fmtDate(points.first.date), Offset(x(0), ly), center: true, maxX: size.width);
    final mid = points.length ~/ 2;
    _label(canvas, fmtDate(points[mid].date), Offset(x(mid), ly), center: true, maxX: size.width);
    _label(canvas, fmtDate(points.last.date), Offset(x(points.length - 1), ly),
        center: true, maxX: size.width);
  }

  @override
  bool shouldRepaint(covariant _ChartPainter old) => true;
}

/// Tiny trend line used inside list tiles.
class MiniSpark extends StatelessWidget {
  const MiniSpark({super.key, required this.points, required this.color});
  final List<PricePoint> points;
  final Color color;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: 64,
        height: 22,
        child: CustomPaint(painter: _SparkPainter(points, color)),
      );
}

class _SparkPainter extends CustomPainter {
  _SparkPainter(this.points, this.color);
  final List<PricePoint> points;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length < 2) return;
    var lo = points.first.price, hi = points.first.price;
    for (final p in points) {
      if (p.price < lo) lo = p.price;
      if (p.price > hi) hi = p.price;
    }
    final range = (hi - lo) < 1 ? 1.0 : (hi - lo);
    final path = Path();
    for (var i = 0; i < points.length; i++) {
      final x = size.width * i / (points.length - 1);
      final y = size.height - 3 - (size.height - 6) * (points[i].price - lo) / range;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(covariant _SparkPainter old) =>
      old.points != points || old.color != color;
}
