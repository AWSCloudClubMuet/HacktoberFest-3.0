package tunewave;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

/**
 * Visual design system for TuneWave, inspired by Spotify and Apple Music desktop interfaces.
 * Provides consistent typography, midnight charcoal palette, and rendering utilities.
 */
public final class TuneWaveTheme {

    private TuneWaveTheme() {}

    // ── Surfaces & Backgrounds ────────────────────────────────────────────────
    public static final Color BG_APP          = new Color(18, 18, 18);
    public static final Color BG_SIDEBAR      = new Color(0, 0, 0);
    public static final Color BG_SURFACE      = new Color(24, 24, 24);
    public static final Color BG_SURFACE_HOV  = new Color(38, 38, 38);
    public static final Color BG_CARD         = new Color(28, 28, 28);
    public static final Color BG_CARD_HOV     = new Color(44, 44, 44);
    public static final Color BG_BOTTOM_BAR   = new Color(15, 15, 15);
    public static final Color BG_INPUT        = new Color(34, 34, 34);

    // ── Accent Colors ─────────────────────────────────────────────────────────
    public static final Color ACCENT_GREEN    = new Color(30, 215, 96);   // Spotify Green #1ed760
    public static final Color ACCENT_CYAN     = new Color(56, 189, 248);  // Electric Sky Cyan
    public static final Color ACCENT_VIOLET   = new Color(168, 85, 247);  // Apple Music Violet
    public static final Color ACCENT_ROSE     = new Color(244, 63, 94);   // Coral Rose
    public static final Color ACCENT_AMBER    = new Color(245, 158, 11);  // Gold Accent

    // ── Typography Colors ─────────────────────────────────────────────────────
    public static final Color TXT_PRIMARY     = new Color(255, 255, 255);
    public static final Color TXT_SECONDARY   = new Color(179, 179, 179);
    public static final Color TXT_MUTED       = new Color(110, 110, 110);
    public static final Color TXT_FAINT       = new Color(75, 75, 75);

    // ── Borders & Dividers ────────────────────────────────────────────────────
    public static final Color BORDER_SUBTLE   = new Color(40, 40, 40);
    public static final Color BORDER_LINE     = new Color(50, 50, 50);

    // ── Typography ────────────────────────────────────────────────────────────
    public static final Font FONT_BRAND       = new Font("Segoe UI", Font.BOLD, 19);
    public static final Font FONT_HEADER      = new Font("Segoe UI", Font.BOLD, 22);
    public static final Font FONT_HERO_TITLE  = new Font("Segoe UI", Font.BOLD, 26);
    public static final Font FONT_SECTION     = new Font("Segoe UI", Font.BOLD, 15);
    public static final Font FONT_REGULAR     = new Font("Segoe UI", Font.PLAIN, 13);
    public static final Font FONT_BOLD        = new Font("Segoe UI", Font.BOLD, 13);
    public static final Font FONT_SMALL       = new Font("Segoe UI", Font.PLAIN, 12);
    public static final Font FONT_CAPTION     = new Font("Segoe UI", Font.PLAIN, 11);
    public static final Font FONT_MONO        = new Font("Consolas", Font.BOLD, 11);

    /**
     * Applies high-quality rendering hints (anti-aliasing, bicubic interpolation)
     * to a Graphics2D context.
     */
    public static void applyQualityHints(Graphics2D g2) {
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
    }
}

