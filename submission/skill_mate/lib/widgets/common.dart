import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Fade + slide up animation. `index` staggers list items.
class FadeSlide extends StatelessWidget {
  final Widget child;
  final int index;
  const FadeSlide({super.key, required this.child, this.index = 0});

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: 1),
    duration: Duration(milliseconds: 400 + index.clamp(0, 8) * 80),
    curve: Curves.easeOutCubic,
    builder: (_, v, w) => Opacity(
      opacity: v,
      child: Transform.translate(offset: Offset(0, 24 * (1 - v)), child: w),
    ),
    child: child,
  );
}

class Pill extends StatelessWidget {
  final String text;
  final Color color;
  const Pill(this.text, this.color, {super.key});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: color.withAlpha(30),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(text, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
  );
}

class Stars extends StatelessWidget {
  final double rating;
  final double size;
  const Stars(this.rating, {super.key, this.size = 18});

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      for (var i = 1; i <= 5; i++)
        Icon(i <= rating.round() ? Icons.star_rounded : Icons.star_outline_rounded,
            size: size, color: Colors.amber),
    ],
  );
}

/// Shrinks slightly while pressed.
class Bounce extends StatefulWidget {
  final Widget child;
  final VoidCallback onTap;
  const Bounce({super.key, required this.child, required this.onTap});

  @override
  State<Bounce> createState() => _BounceState();
}

class _BounceState extends State<Bounce> {
  bool _down = false;

  @override
  Widget build(BuildContext context) => GestureDetector(
    behavior: HitTestBehavior.opaque,
    onTapDown: (_) => setState(() => _down = true),
    onTapUp: (_) => setState(() => _down = false),
    onTapCancel: () => setState(() => _down = false),
    onTap: widget.onTap,
    child: AnimatedScale(
      scale: _down ? 0.95 : 1,
      duration: const Duration(milliseconds: 120),
      child: widget.child,
    ),
  );
}

/// Soft colored circles drifting around. Put inside Positioned.fill.
class FloatingBlobs extends StatefulWidget {
  final bool big;
  const FloatingBlobs({super.key, this.big = false});

  @override
  State<FloatingBlobs> createState() => _FloatingBlobsState();
}

class _FloatingBlobsState extends State<FloatingBlobs> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
  AnimationController(vsync: this, duration: const Duration(seconds: 10))..repeat();

  // x fraction, y fraction, size, color, phase
  static const _blobs = <(double, double, double, Color, double)>[
    (0.10, 0.10, 130, Color(0x30FFFFFF), 0),
    (0.90, 0.30, 100, Color(0x80FF9F43), 1.5),
    (0.50, 0.95, 110, Color(0x80FF4D8D), 3),
    (0.85, 0.85, 90, Color(0x30FFFFFF), 4.5),
    (0.20, 0.60, 80, Color(0x6600C9A7), 2),
  ];

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => IgnorePointer(
    child: LayoutBuilder(
      builder: (_, box) => AnimatedBuilder(
        animation: _c,
        builder: (_, __) {
          final t = _c.value * 2 * math.pi;
          final k = widget.big ? 1.8 : 1.0;
          return Stack(children: [
            for (final b in _blobs)
              Positioned(
                left: box.maxWidth * b.$1 - b.$3 * k / 2 + 28 * math.sin(t + b.$5),
                top: box.maxHeight * b.$2 - b.$3 * k / 2 + 22 * math.cos(t + b.$5),
                child: Container(
                  width: b.$3 * k,
                  height: b.$3 * k,
                  decoration: BoxDecoration(shape: BoxShape.circle, color: b.$4),
                ),
              ),
          ]);
        },
      ),
    ),
  );
}

/// Bobs up and down forever.
class Float extends StatefulWidget {
  final Widget child;
  const Float({super.key, required this.child});

  @override
  State<Float> createState() => _FloatState();
}

class _FloatState extends State<Float> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
  AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _c,
    builder: (_, child) => Transform.translate(
      offset: Offset(0, -12 * Curves.easeInOut.transform(_c.value)),
      child: child,
    ),
    child: widget.child,
  );
}

/// Gently grows and shrinks forever.
class Pulse extends StatefulWidget {
  final Widget child;
  const Pulse({super.key, required this.child});

  @override
  State<Pulse> createState() => _PulseState();
}

class _PulseState extends State<Pulse> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
  AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ScaleTransition(
    scale: Tween(begin: 1.0, end: 1.07).animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut)),
    child: widget.child,
  );
}

/// Loading placeholder cards that blink.
class SkeletonList extends StatefulWidget {
  const SkeletonList({super.key});

  @override
  State<SkeletonList> createState() => _SkeletonListState();
}

class _SkeletonListState extends State<SkeletonList> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
  AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: Tween(begin: 0.35, end: 1.0).animate(_c),
    child: ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
      itemCount: 4,
      itemBuilder: (_, __) => Container(
        height: 130,
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(22)),
      ),
    ),
  );
}