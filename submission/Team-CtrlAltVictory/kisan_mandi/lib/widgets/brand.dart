import 'package:flutter/material.dart';

import '../utils/crop_images.dart';
import '../utils/logo_data.dart';
import '../utils/theme.dart';

/// Full KisanMandi logo (butterfly-wheat mark + wordmark).
class KisanLogo extends StatelessWidget {
  const KisanLogo({super.key, this.width = 240});
  final double width;

  @override
  Widget build(BuildContext context) {
    return Image.memory(
      kLogoFullBytes,
      width: width,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
      gaplessPlayback: true,
    );
  }
}

/// Only the butterfly-wheat mark of the logo.
class KisanMark extends StatelessWidget {
  const KisanMark({super.key, this.height = 48});
  final double height;

  @override
  Widget build(BuildContext context) {
    return Image.memory(
      kLogoMarkBytes,
      height: height,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
      gaplessPlayback: true,
    );
  }
}

/// Round white badge that holds the logo mark (used on dark green headers).
class LogoBadge extends StatelessWidget {
  const LogoBadge({super.key, this.size = 46});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      padding: EdgeInsets.all(size * 0.16),
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: AppShadows.soft,
      ),
      child: KisanMark(height: size),
    );
  }
}

/// Splash / welcome screen: full-bleed tractor photo, logo, headline and a
/// "Get Started" pill. While the app is still starting it shows "Loading...".
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, this.onStart});

  /// null = still loading (button disabled). Non-null = ready, tap to continue.
  final VoidCallback? onStart;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..forward();

  late final Animation<double> _fade =
      CurvedAnimation(parent: _c, curve: Curves.easeOut);
  late final Animation<Offset> _slide = Tween<Offset>(
    begin: const Offset(0, 0.08),
    end: Offset.zero,
  ).animate(CurvedAnimation(parent: _c, curve: Curves.easeOutCubic));

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final ready = widget.onStart != null;

    return Scaffold(
      backgroundColor: AppColors.greenDeep,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // tractor photo
          Image.network(
            tractorPhotoUrl(width: 1100),
            fit: BoxFit.cover,
            alignment: Alignment.bottomCenter,
            loadingBuilder: (context, child, progress) =>
                progress == null ? child : const _PhotoPlaceholder(),
            errorBuilder: (context, error, stack) => const _PhotoPlaceholder(),
          ),
          // white fade at the top (for the logo + headline) and dark at bottom
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: [0.0, 0.34, 0.55, 1.0],
                colors: [
                  Color(0xF2FFFFFF),
                  Color(0xCCFFFFFF),
                  Color(0x00FFFFFF),
                  Color(0x99053D1D),
                ],
              ),
            ),
          ),
          SafeArea(
            child: FadeTransition(
              opacity: _fade,
              child: SlideTransition(
                position: _slide,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 18, 24, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const KisanLogo(width: 150),
                      const SizedBox(height: 18),
                      const Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(
                              text: 'Smart',
                              style: TextStyle(
                                  color: AppColors.green,
                                  fontWeight: FontWeight.w900),
                            ),
                            TextSpan(
                              text: ' Solutions\n',
                              style: TextStyle(
                                  color: AppColors.ink,
                                  fontWeight: FontWeight.w500),
                            ),
                            TextSpan(
                              text: 'Modern ',
                              style: TextStyle(
                                  color: AppColors.ink,
                                  fontWeight: FontWeight.w500),
                            ),
                            TextSpan(
                              text: 'Farmers',
                              style: TextStyle(
                                  color: AppColors.green,
                                  fontWeight: FontWeight.w900),
                            ),
                          ],
                        ),
                        style: TextStyle(
                          fontSize: 34,
                          height: 1.12,
                          letterSpacing: -0.6,
                        ),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Live crop prices, a produce marketplace and smart tools\nfor better yields and decisions.',
                        style: TextStyle(
                          fontSize: 13.5,
                          height: 1.4,
                          color: AppColors.body,
                        ),
                      ),
                      const Spacer(),
                      _StartPill(onStart: widget.onStart, ready: ready),
                      SizedBox(height: media.padding.bottom > 0 ? 4 : 10),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PhotoPlaceholder extends StatelessWidget {
  const _PhotoPlaceholder();

  @override
  Widget build(BuildContext context) => const DecoratedBox(
        decoration: BoxDecoration(gradient: AppColors.heroGradient),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: EdgeInsets.only(bottom: 160),
            child: Icon(Icons.agriculture_rounded,
                size: 110, color: Color(0x33FFFFFF)),
          ),
        ),
      );
}

class _StartPill extends StatelessWidget {
  const _StartPill({required this.onStart, required this.ready});
  final VoidCallback? onStart;
  final bool ready;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onStart,
      child: Container(
        height: 68,
        padding: const EdgeInsets.all(7),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.42),
          borderRadius: BorderRadius.circular(40),
          border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: ready
                  ? const Icon(Icons.arrow_forward_rounded,
                      color: AppColors.green, size: 26)
                  : const Padding(
                      padding: EdgeInsets.all(15),
                      child: CircularProgressIndicator(
                          strokeWidth: 2.6, color: AppColors.green),
                    ),
            ),
            Expanded(
              child: Center(
                child: Text(
                  ready ? 'Get Started' : 'Loading...',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Text(
                ready ? '>>>' : '',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Network photo of a crop with a graceful icon fallback.
class CropPhoto extends StatelessWidget {
  const CropPhoto({
    super.key,
    required this.cropName,
    this.size = 56,
    this.radius = 18,
    this.circle = false,
    this.icon = Icons.eco_rounded,
  });

  final String cropName;
  final double size;
  final double radius;
  final bool circle;
  final IconData icon;

  Widget _fallback() => Container(
        width: size,
        height: size,
        color: AppColors.greenSoft,
        child: Icon(icon, color: AppColors.green, size: size * 0.5),
      );

  @override
  Widget build(BuildContext context) {
    final url = cropPhotoUrl(cropName, width: (size * 4).round().clamp(200, 800).toInt());

    final Widget child = url == null
        ? _fallback()
        : Image.network(
            url,
            width: size,
            height: size,
            fit: BoxFit.cover,
            loadingBuilder: (context, child, progress) =>
                progress == null ? child : _fallback(),
            errorBuilder: (context, error, stack) => _fallback(),
          );

    return SizedBox(
      width: size,
      height: size,
      child: circle
          ? ClipOval(child: child)
          : ClipRRect(borderRadius: BorderRadius.circular(radius), child: child),
    );
  }
}
