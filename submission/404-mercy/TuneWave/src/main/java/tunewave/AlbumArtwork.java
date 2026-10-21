package tunewave;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RadialGradientPaint;
import java.awt.geom.Point2D;
import java.awt.geom.RoundRectangle2D;
import javax.swing.JPanel;

/**
 * High-resolution custom Java2D generative album artwork renderer.
 * <p>Avoids emojis and instead generates authentic album art aesthetics:
 * atmospheric chromatic gradients, vinyl groove micro-textures, geometric soundwaves,
 * and typographic monogram stamps.</p>
 */
public class AlbumArtwork extends JPanel {

    private Song song;
    private boolean isPlaying = false;
    private int animTick = 0;
    private final int cornerRadius;

    // Palette pairs for generative themes
    private static final Color[][] GRADIENTS = {
            { new Color(139, 92, 246), new Color(59, 130, 246) },   // Violet to Electric Blue
            { new Color(236, 72, 153), new Color(249, 115, 22) },   // Sunset Pink to Orange
            { new Color(16, 185, 129), new Color(6, 182, 212) },    // Emerald to Cyan
            { new Color(99, 102, 241), new Color(168, 85, 247) },   // Indigo to Purple
            { new Color(244, 63, 94),  new Color(139, 92, 246) },   // Rose to Violet
            { new Color(20, 184, 166), new Color(59, 130, 246) },   // Teal to Royal Blue
            { new Color(234, 88, 12),  new Color(239, 68, 68) },    // Deep Amber to Red
            { new Color(79, 70, 229),  new Color(14, 165, 233) },   // Midnight Sapphire
    };

    public AlbumArtwork(int size, int cornerRadius) {
        this.cornerRadius = cornerRadius;
        setPreferredSize(new Dimension(size, size));
        setMinimumSize(new Dimension(size, size));
        setOpaque(false);
    }

    public void setSong(Song song, boolean isPlaying) {
        this.song = song;
        this.isPlaying = isPlaying;
        repaint();
    }

    public void tickAnimation() {
        if (isPlaying) {
            animTick = (animTick + 1) % 100;
            repaint();
        }
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g.create();
        TuneWaveTheme.applyQualityHints(g2);

        int w = getWidth();
        int h = getHeight();

        // 1. Clip to rounded rectangle
        RoundRectangle2D clipRect = new RoundRectangle2D.Float(0, 0, w, h, cornerRadius, cornerRadius);
        g2.clip(clipRect);

        if (song == null) {
            // Idle empty state: Dark textured surface with vinyl silhouette
            paintEmptyState(g2, w, h);
            g2.dispose();
            return;
        }

        // 2. Select generative gradient based on songId hash
        int hash = Math.abs(song.getSongId().hashCode() ^ song.getTitle().hashCode());
        Color[] colors = GRADIENTS[hash % GRADIENTS.length];

        // 3. Background Atmospheric Gradient
        GradientPaint bgPaint = new GradientPaint(0, 0, colors[0], w, h, colors[1]);
        g2.setPaint(bgPaint);
        g2.fillRect(0, 0, w, h);

        // 4. Ambient Radial Glow
        Point2D center = new Point2D.Float(w * 0.35f, h * 0.35f);
        float radius = Math.max(w, h) * 0.8f;
        RadialGradientPaint glow = new RadialGradientPaint(
                center, radius,
                new float[] { 0.0f, 0.7f, 1.0f },
                new Color[] { new Color(255, 255, 255, 50), new Color(0, 0, 0, 20), new Color(0, 0, 0, 110) }
        );
        g2.setPaint(glow);
        g2.fillRect(0, 0, w, h);

        // 5. Stylized Vinyl Grooves (Geometric arcs)
        g2.setColor(new Color(255, 255, 255, 18));
        g2.setStroke(new BasicStroke(1.2f));
        int cx = w / 2;
        int cy = h / 2;
        int maxR = Math.min(w, h);
        for (int r = maxR / 5; r < maxR; r += Math.max(8, maxR / 12)) {
            g2.drawOval(cx - r / 2, cy - r / 2, r, r);
        }

        // 6. Center Artwork Emblem or Typography
        if (w >= 100) {
            paintLargeArtwork(g2, w, h);
        } else {
            paintSmallThumbnail(g2, w, h);
        }

        // 7. Live Equalizer / Soundwave Overlay if actively playing
        if (isPlaying) {
            paintSoundWaveOverlay(g2, w, h);
        }

        // 8. Subtle inner gloss highlight border
        g2.setStroke(new BasicStroke(1.0f));
        g2.setColor(new Color(255, 255, 255, 45));
        g2.drawRoundRect(0, 0, w - 1, h - 1, cornerRadius, cornerRadius);

        g2.dispose();
    }

    private void paintEmptyState(Graphics2D g2, int w, int h) {
        g2.setColor(TuneWaveTheme.BG_CARD);
        g2.fillRect(0, 0, w, h);

        g2.setColor(TuneWaveTheme.BORDER_SUBTLE);
        g2.setStroke(new BasicStroke(1.5f));
        int cx = w / 2;
        int cy = h / 2;
        int r = Math.min(w, h) / 3;
        g2.drawOval(cx - r, cy - r, r * 2, r * 2);
        g2.drawOval(cx - r / 3, cy - r / 3, (r * 2) / 3, (r * 2) / 3);

        g2.setColor(TuneWaveTheme.TXT_MUTED);
        g2.setFont(new Font("Segoe UI", Font.BOLD, Math.max(10, w / 10)));
        FontMetrics fm = g2.getFontMetrics();
        String txt = "TuneWave";
        g2.drawString(txt, cx - fm.stringWidth(txt) / 2, cy + fm.getAscent() / 3);
    }

    private void paintLargeArtwork(Graphics2D g2, int w, int h) {
        // Monogram Badge in center
        int badgeR = w / 4;
        int cx = w / 2;
        int cy = h / 2;

        g2.setColor(new Color(0, 0, 0, 90));
        g2.fillOval(cx - badgeR, cy - badgeR, badgeR * 2, badgeR * 2);
        g2.setColor(new Color(255, 255, 255, 60));
        g2.setStroke(new BasicStroke(1.5f));
        g2.drawOval(cx - badgeR, cy - badgeR, badgeR * 2, badgeR * 2);

        // Song Initials
        String initials = extractInitials(song.getTitle());
        g2.setColor(Color.WHITE);
        g2.setFont(new Font("Segoe UI", Font.BOLD, Math.max(14, badgeR * 3 / 4)));
        FontMetrics fm = g2.getFontMetrics();
        g2.drawString(initials, cx - fm.stringWidth(initials) / 2, cy + fm.getAscent() / 2 - 2);

        // Lower Badge: Song ID
        g2.setFont(TuneWaveTheme.FONT_MONO);
        g2.setColor(new Color(255, 255, 255, 190));
        String idBadge = song.getSongId();
        FontMetrics fmId = g2.getFontMetrics();
        g2.drawString(idBadge, cx - fmId.stringWidth(idBadge) / 2, h - 16);
    }

    private void paintSmallThumbnail(Graphics2D g2, int w, int h) {
        String initials = extractInitials(song.getTitle());
        g2.setColor(Color.WHITE);
        g2.setFont(new Font("Segoe UI", Font.BOLD, Math.max(11, w / 3)));
        FontMetrics fm = g2.getFontMetrics();
        int cx = w / 2;
        int cy = h / 2;
        g2.drawString(initials, cx - fm.stringWidth(initials) / 2, cy + fm.getAscent() / 2 - 2);
    }

    private void paintSoundWaveOverlay(Graphics2D g2, int w, int h) {
        // Equalizer wave bars in lower section
        int barCount = Math.max(4, w / 16);
        int barW = Math.max(2, w / 35);
        int totalBarsW = barCount * (barW + 2);
        int startX = (w - totalBarsW) / 2;
        int baseY = h - 8;

        g2.setColor(TuneWaveTheme.ACCENT_GREEN);
        for (int i = 0; i < barCount; i++) {
            // Dynamic sine bounce
            double angle = ((animTick * 6 + i * 25) % 360) * Math.PI / 180.0;
            int barH = (int) (4 + Math.abs(Math.sin(angle)) * (h * 0.18));
            g2.fillRoundRect(startX + i * (barW + 2), baseY - barH, barW, barH, 2, 2);
        }
    }

    private String extractInitials(String title) {
        if (title == null || title.isEmpty()) return "TW";
        String[] words = title.trim().split("\\s+");
        if (words.length == 1) {
            return words[0].substring(0, Math.min(2, words[0].length())).toUpperCase();
        }
        return ("" + words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
}

