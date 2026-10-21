package tunewave;

import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import javafx.scene.paint.CycleMethod;
import javafx.scene.paint.LinearGradient;
import javafx.scene.paint.RadialGradient;
import javafx.scene.paint.Stop;
import javafx.scene.shape.Rectangle;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.scene.text.TextAlignment;

/**
 * High-resolution vector and generative album artwork renderer in JavaFX.
 * Renders atmospheric gradient backdrops, vinyl grooves, typographic monogram stamps,
 * and live rhythmic equalizer soundwave pulses when playback is active.
 */
public class FxAlbumArtwork extends StackPane {

    private final Canvas canvas;
    private final double size;
    private final double cornerRadius;
    private Song currentSong;
    private boolean isPlaying = false;
    private int animTick = 0;

    private static final Color[][] GRADIENTS = {
            { Color.web("#8b5cf6"), Color.web("#3b82f6") }, // Violet -> Blue
            { Color.web("#ec4899"), Color.web("#f97316") }, // Pink -> Orange
            { Color.web("#10b981"), Color.web("#06b6d4") }, // Emerald -> Cyan
            { Color.web("#6366f1"), Color.web("#a855f7") }, // Indigo -> Purple
            { Color.web("#f43f5e"), Color.web("#8b5cf6") }, // Rose -> Violet
            { Color.web("#14b8a6"), Color.web("#3b82f6") }, // Teal -> Blue
            { Color.web("#ea580c"), Color.web("#ef4444") }, // Amber -> Red
            { Color.web("#4f46e5"), Color.web("#0ea5e9") }  // Sapphire -> Cyan
    };

    public FxAlbumArtwork(double size, double cornerRadius) {
        this.size = size;
        this.cornerRadius = cornerRadius;
        this.canvas = new Canvas(size, size);

        setPrefSize(size, size);
        setMinSize(size, size);
        setMaxSize(size, size);

        // Clip to rounded rectangle
        Rectangle clip = new Rectangle(size, size);
        clip.setArcWidth(cornerRadius * 2);
        clip.setArcHeight(cornerRadius * 2);
        setClip(clip);

        getChildren().add(canvas);
        render();
    }

    public void update(Song song, boolean isPlaying) {
        this.currentSong = song;
        this.isPlaying = isPlaying;
        render();
    }

    public void tickAnimation() {
        if (isPlaying) {
            animTick = (animTick + 1) % 100;
            render();
        }
    }

    private void render() {
        GraphicsContext gc = canvas.getGraphicsContext2D();
        gc.clearRect(0, 0, size, size);

        if (currentSong == null) {
            // Idle empty vinyl sleeve
            gc.setFill(Color.web("#1c1c1c"));
            gc.fillRect(0, 0, size, size);

            gc.setStroke(Color.web("#333333"));
            gc.setLineWidth(1.5);
            double r = size / 3;
            gc.strokeOval((size - r * 2) / 2, (size - r * 2) / 2, r * 2, r * 2);
            gc.strokeOval((size - r) / 2, (size - r) / 2, r, r);
            return;
        }

        // Generative gradient based on song hash
        int hash = Math.abs(currentSong.getSongId().hashCode() ^ currentSong.getTitle().hashCode());
        Color[] pair = GRADIENTS[hash % GRADIENTS.length];

        LinearGradient bg = new LinearGradient(
                0, 0, 1, 1, true, CycleMethod.NO_CYCLE,
                new Stop(0, pair[0]),
                new Stop(1, pair[1])
        );
        gc.setFill(bg);
        gc.fillRect(0, 0, size, size);

        // Radial ambient glow
        RadialGradient glow = new RadialGradient(
                0, 0, size * 0.35, size * 0.35, size * 0.8, false, CycleMethod.NO_CYCLE,
                new Stop(0.0, Color.rgb(255, 255, 255, 0.2)),
                new Stop(0.7, Color.rgb(0, 0, 0, 0.1)),
                new Stop(1.0, Color.rgb(0, 0, 0, 0.45))
        );
        gc.setFill(glow);
        gc.fillRect(0, 0, size, size);

        // Geometric vinyl grooves
        gc.setStroke(Color.rgb(255, 255, 255, 0.08));
        gc.setLineWidth(1.2);
        double cx = size / 2;
        double cy = size / 2;
        for (double r = size / 6; r < size; r += Math.max(10, size / 10)) {
            gc.strokeOval(cx - r / 2, cy - r / 2, r, r);
        }

        // Center typography / emblem
        if (size >= 80) {
            double badgeR = size / 4;
            gc.setFill(Color.rgb(0, 0, 0, 0.4));
            gc.fillOval(cx - badgeR, cy - badgeR, badgeR * 2, badgeR * 2);

            gc.setStroke(Color.rgb(255, 255, 255, 0.25));
            gc.setLineWidth(1.5);
            gc.strokeOval(cx - badgeR, cy - badgeR, badgeR * 2, badgeR * 2);

            gc.setFill(Color.WHITE);
            gc.setTextAlign(TextAlignment.CENTER);
            gc.setFont(Font.font("Segoe UI", FontWeight.BOLD, Math.max(14, badgeR * 0.75)));
            String initials = extractInitials(currentSong.getTitle());
            gc.fillText(initials, cx, cy + (badgeR * 0.25));

            gc.setFont(Font.font("Consolas", FontWeight.BOLD, 10));
            gc.setFill(Color.rgb(255, 255, 255, 0.8));
            gc.fillText(currentSong.getSongId(), cx, size - 14);
        } else {
            gc.setFill(Color.WHITE);
            gc.setTextAlign(TextAlignment.CENTER);
            gc.setFont(Font.font("Segoe UI", FontWeight.BOLD, Math.max(11, size / 3)));
            gc.fillText(extractInitials(currentSong.getTitle()), cx, cy + (size / 9));
        }

        // Live Equalizer Soundwave overlay when playing
        if (isPlaying) {
            int barCount = Math.max(4, (int) (size / 16));
            double barW = Math.max(2.5, size / 35);
            double totalW = barCount * (barW + 2);
            double startX = (size - totalW) / 2;
            double baseY = size - 8;

            gc.setFill(Color.web("#1ed760"));
            for (int i = 0; i < barCount; i++) {
                double angle = ((animTick * 6 + i * 25) % 360) * Math.PI / 180.0;
                double barH = 4 + Math.abs(Math.sin(angle)) * (size * 0.2);
                gc.fillRoundRect(startX + i * (barW + 2), baseY - barH, barW, barH, 2, 2);
            }
        }
    }

    private String extractInitials(String title) {
        if (title == null || title.isEmpty()) return "TW";
        String[] parts = title.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
}

