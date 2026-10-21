package tunewave;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Cursor;
import java.awt.Dimension;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.function.Consumer;
import javax.swing.JPanel;

/**
 * Spotify/Apple Music-grade interactive seek & scrubber bar.
 * <p>Supports hover thumb expansion, mouse dragging, click-to-seek,
 * and responsive progress rendering with a glowing gradient fill.</p>
 */
public class ModernSeekBar extends JPanel {

    private double progress = 0.0; // 0.0 to 1.0
    private boolean isHovered = false;
    private boolean isDragging = false;
    private Consumer<Double> onSeekListener;

    public ModernSeekBar() {
        setPreferredSize(new Dimension(100, 16));
        setMinimumSize(new Dimension(80, 16));
        setOpaque(false);
        setCursor(new Cursor(Cursor.HAND_CURSOR));

        MouseAdapter mouseHandler = new MouseAdapter() {
            @Override
            public void mouseEntered(MouseEvent e) {
                isHovered = true;
                repaint();
            }

            @Override
            public void mouseExited(MouseEvent e) {
                isHovered = false;
                repaint();
            }

            @Override
            public void mousePressed(MouseEvent e) {
                isDragging = true;
                updateFromMouse(e);
            }

            @Override
            public void mouseDragged(MouseEvent e) {
                if (isDragging) {
                    updateFromMouse(e);
                }
            }

            @Override
            public void mouseReleased(MouseEvent e) {
                if (isDragging) {
                    isDragging = false;
                    updateFromMouse(e);
                }
            }
        };

        addMouseListener(mouseHandler);
        addMouseMotionListener(mouseHandler);
    }

    private void updateFromMouse(MouseEvent e) {
        int w = getWidth();
        if (w <= 0) return;
        double frac = Math.max(0.0, Math.min(1.0, (double) e.getX() / w));
        this.progress = frac;
        repaint();
        if (onSeekListener != null) {
            onSeekListener.accept(frac);
        }
    }

    /**
     * Sets current progress fraction [0.0, 1.0].
     * Ignored if user is actively dragging to prevent jitter.
     */
    public void setProgress(double fraction) {
        if (!isDragging) {
            this.progress = Math.max(0.0, Math.min(1.0, fraction));
            repaint();
        }
    }

    public double getProgress() {
        return progress;
    }

    public boolean isDragging() {
        return isDragging;
    }

    public void setOnSeek(Consumer<Double> listener) {
        this.onSeekListener = listener;
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g.create();
        TuneWaveTheme.applyQualityHints(g2);

        int w = getWidth();
        int h = getHeight();
        int trackHeight = (isHovered || isDragging) ? 6 : 4;
        int trackY = (h - trackHeight) / 2;
        int fillW = (int) (w * progress);

        // 1. Background Trough
        g2.setColor(new Color(60, 60, 60));
        g2.fillRoundRect(0, trackY, w, trackHeight, trackHeight, trackHeight);

        // 2. Active Progress Fill (Spotify Green or Cyan on hover)
        Color fillStart = TuneWaveTheme.ACCENT_CYAN;
        Color fillEnd = (isHovered || isDragging) ? TuneWaveTheme.ACCENT_GREEN : new Color(30, 215, 96, 210);
        GradientPaint gp = new GradientPaint(0, 0, fillStart, Math.max(1, fillW), 0, fillEnd);
        g2.setPaint(gp);
        g2.fillRoundRect(0, trackY, fillW, trackHeight, trackHeight, trackHeight);

        // 3. Thumb Circle (Visible on hover or drag)
        if (isHovered || isDragging) {
            int thumbRadius = 6;
            int thumbX = Math.max(0, Math.min(w - thumbRadius * 2, fillW - thumbRadius));
            int thumbY = (h / 2) - thumbRadius;

            // Outer subtle glow
            g2.setColor(new Color(255, 255, 255, 60));
            g2.fillOval(thumbX - 2, thumbY - 2, (thumbRadius * 2) + 4, (thumbRadius * 2) + 4);

            // White thumb
            g2.setColor(Color.WHITE);
            g2.fillOval(thumbX, thumbY, thumbRadius * 2, thumbRadius * 2);

            // Stroke
            g2.setColor(new Color(20, 20, 20, 100));
            g2.setStroke(new BasicStroke(1.0f));
            g2.drawOval(thumbX, thumbY, thumbRadius * 2, thumbRadius * 2);
        }

        g2.dispose();
    }
}

