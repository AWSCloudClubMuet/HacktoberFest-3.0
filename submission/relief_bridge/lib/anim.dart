import 'package:flutter/material.dart';

/// Fade + slide-up entrance. Use `index` for staggered lists.
class FadeSlide extends StatefulWidget {
  final Widget child;
  final int index;
  const FadeSlide({super.key, required this.child, this.index = 0});
  @override
  State<FadeSlide> createState() => _FadeSlideState();
}

class _FadeSlideState extends State<FadeSlide> with SingleTickerProviderStateMixin {
  late final AnimationController c =
  AnimationController(vsync: this, duration: const Duration(milliseconds: 550));
  late final Animation<double> a = CurvedAnimation(parent: c, curve: Curves.easeOutCubic);

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: 70 * widget.index.clamp(0, 12).toInt()), () {
      if (mounted) c.forward();
    });
  }

  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: a,
    child: SlideTransition(
      position: Tween<Offset>(begin: const Offset(0, .12), end: Offset.zero).animate(a),
      child: widget.child,
    ),
  );
}

/// Number that counts up from 0.
class CountUp extends StatelessWidget {
  final num value;
  final String suffix;
  final TextStyle? style;
  const CountUp(this.value, {super.key, this.suffix = '', this.style});

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: value.toDouble()),
    duration: const Duration(milliseconds: 1200),
    curve: Curves.easeOutCubic,
    builder: (_, v, __) => Text('${v.round()}$suffix', style: style),
  );
}

/// Rounded progress bar that animates to its value.
class AnimatedProgress extends StatelessWidget {
  final double value;
  final Color color;
  final double height;
  const AnimatedProgress(
      {super.key, required this.value, required this.color, this.height = 10});

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: value),
    duration: const Duration(milliseconds: 900),
    curve: Curves.easeOutCubic,
    builder: (_, v, __) => ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: LinearProgressIndicator(
          value: v,
          minHeight: height,
          color: color,
          backgroundColor: color.withValues(alpha: .15)),
    ),
  );
}

/// Gentle heartbeat for warnings (Low Stock, critical gaps).
class Pulse extends StatefulWidget {
  final Widget child;
  const Pulse({super.key, required this.child});
  @override
  State<Pulse> createState() => _PulseState();
}

class _PulseState extends State<Pulse> with SingleTickerProviderStateMixin {
  late final AnimationController c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 900))
    ..repeat(reverse: true);

  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ScaleTransition(
    scale: Tween<double>(begin: 1, end: 1.1)
        .animate(CurvedAnimation(parent: c, curve: Curves.easeInOut)),
    child: widget.child,
  );
}