package TuneWave_music_player;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.plaf.basic.BasicScrollBarUI;
import java.awt.*;
import java.awt.geom.Path2D;
import java.awt.geom.RoundRectangle2D;

/** Small Java2D design system. No external themes, web views, or downloaded artwork. */
@SuppressWarnings("serial")
final class Theme {
    static final Color BG = new Color(10, 13, 11), SIDE = new Color(9, 12, 10),
            SURFACE = new Color(19, 24, 20), FIELD = new Color(30, 38, 32),
            LINE = new Color(43, 58, 47), TEXT = new Color(243, 245, 236),
            MUTED = new Color(153, 170, 158), GREEN = new Color(194, 242, 104),
            SELECT = new Color(40, 60, 43), ORANGE = new Color(250, 133, 70);
    private Theme() { }
    static Font font(int size, boolean bold) { return new Font(Font.SANS_SERIF, bold ? Font.BOLD : Font.PLAIN, size); }
    static JLabel label(String text, int size, Color color) {
        JLabel label = new JLabel(text); label.setFont(font(size, size >= 21)); label.setForeground(color); return label;
    }
    static JPanel panel(LayoutManager layout) { JPanel p = new JPanel(layout); p.setOpaque(false); return p; }
    static JPanel row(int gap) { return panel(new FlowLayout(FlowLayout.LEFT, gap, 0)); }
    static JPanel column(int gap, Component... items) {
        JPanel p = panel(new GridLayout(0, 1, 0, gap)); for (Component c : items) p.add(c); return p;
    }
    static JPanel inset(JComponent component, int top, int left, int bottom, int right) {
        JPanel p = panel(new BorderLayout()); p.setBorder(new EmptyBorder(top, left, bottom, right)); p.add(component); return p;
    }
    static JPanel card(Color color, int radius) {
        return new JPanel() {
            { setOpaque(false); }
            @Override protected void paintComponent(Graphics graphics) {
                Graphics2D g = smooth(graphics); g.setColor(color);
                g.fillRoundRect(0, 0, getWidth(), getHeight(), radius, radius); g.dispose(); super.paintComponent(graphics);
            }
        };
    }
    static Graphics2D smooth(Graphics g) {
        Graphics2D copy = (Graphics2D) g.create();
        copy.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        copy.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON); return copy;
    }
    static JButton button(String text, String name, String icon, boolean primary) {
        JButton b = new JButton(text) {
            @Override protected void paintComponent(Graphics graphics) {
                Graphics2D g = smooth(graphics);
                Color base = Boolean.TRUE.equals(getClientProperty("active")) ? SELECT : primary ? GREEN : Boolean.TRUE.equals(getClientProperty("quiet")) ? SIDE : FIELD;
                if (getModel().isRollover() && isEnabled()) base = base.brighter();
                g.setColor(base); g.fillRoundRect(0, 0, getWidth(), getHeight(), 18, 18);
                if (hasFocus()) { g.setColor(TEXT); g.setStroke(new BasicStroke(1.5f)); g.drawRoundRect(2, 2, getWidth() - 5, getHeight() - 5, 16, 16); } g.dispose();
                super.paintComponent(graphics);
            }
        };
        b.setName(name); b.setFont(font(12, true)); b.setForeground(primary ? BG : TEXT);
        b.setContentAreaFilled(false); b.setBorder(new EmptyBorder(11, 16, 11, 16));
        b.setFocusPainted(false); b.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        if (icon != null) b.setIcon(new Glyph(icon, 16, primary ? BG : TEXT));
        b.setIconTextGap(9); b.getAccessibleContext().setAccessibleName(text.isBlank() ? name : text);
        return b;
    }
    static JTextField field(String name) {
        JTextField f = new JTextField() {
            @Override protected void paintComponent(Graphics graphics) {
                super.paintComponent(graphics);
                if (getText().isEmpty() && getClientProperty("placeholder") instanceof String placeholder) {
                    Graphics2D g = smooth(graphics); g.setFont(getFont()); g.setColor(MUTED);
                    g.drawString(fit(g, placeholder, getWidth() - 26), 12, (getHeight() + g.getFontMetrics().getAscent() - g.getFontMetrics().getDescent()) / 2); g.dispose();
                }
            }
        }; f.setName(name); f.setBackground(FIELD); f.setForeground(TEXT);
        f.setCaretColor(GREEN); f.setFont(font(13, false)); f.setBorder(new EmptyBorder(11, 12, 11, 12)); return f;
    }
    static JScrollPane scroll(Component component) {
        JScrollPane s = new JScrollPane(component); s.setBorder(BorderFactory.createEmptyBorder());
        s.setOpaque(false); s.getViewport().setOpaque(false); s.getViewport().setBackground(SURFACE);
        s.getVerticalScrollBar().setUnitIncrement(24); s.getHorizontalScrollBar().setUnitIncrement(24);
        for (JScrollBar b : new JScrollBar[]{s.getVerticalScrollBar(), s.getHorizontalScrollBar()}) {
            b.setPreferredSize(new Dimension(7, 7)); b.setUI(new BasicScrollBarUI() {
                @Override protected void configureScrollBarColors() { thumbColor = LINE; trackColor = SURFACE; }
                @Override protected JButton createDecreaseButton(int orientation) { return empty(); }
                @Override protected JButton createIncreaseButton(int orientation) { return empty(); }
                private JButton empty() { JButton b = new JButton(); b.setPreferredSize(new Dimension(0, 0)); return b; }
            });
        }
        return s;
    }
    static void combo(JComboBox<?> box) {
        box.setUI(new javax.swing.plaf.basic.BasicComboBoxUI() {
            @Override protected JButton createArrowButton() {
                return new javax.swing.plaf.basic.BasicArrowButton(SwingConstants.SOUTH, FIELD, FIELD, MUTED, FIELD);
            }
            @Override public void paintCurrentValueBackground(Graphics graphics, Rectangle bounds, boolean hasFocus) {
                graphics.setColor(FIELD); graphics.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
            }
            @Override public void paintCurrentValue(Graphics graphics, Rectangle bounds, boolean hasFocus) {
                Graphics2D g = smooth(graphics); g.setFont(comboBox.getFont()); g.setColor(TEXT);
                String text = comboBox.getSelectedItem() == null ? "" : comboBox.getSelectedItem().toString();
                int baseline = bounds.y + (bounds.height + g.getFontMetrics().getAscent() - g.getFontMetrics().getDescent()) / 2;
                g.drawString(fit(g, text, bounds.width - 16), bounds.x + 8, baseline); g.dispose();
            }
        });
        box.setBackground(FIELD); box.setForeground(TEXT); box.setFont(font(13, false));
        box.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
        box.setRenderer(new DefaultListCellRenderer() {
            @Override public Component getListCellRendererComponent(JList<?> list, Object value, int index, boolean selected, boolean focus) {
                JLabel l = (JLabel) super.getListCellRendererComponent(list, value, index, selected, focus);
                l.setBackground(selected ? SELECT : FIELD); l.setForeground(TEXT); l.setBorder(new EmptyBorder(8, 9, 8, 9)); return l;
            }
        });
    }
    static String fit(Graphics2D g, String text, int width) {
        if (g.getFontMetrics().stringWidth(text) <= width) return text;
        while (!text.isEmpty() && g.getFontMetrics().stringWidth(text + "…") > width) text = text.substring(0, text.length() - 1);
        return text + "…";
    }
    static final class Glyph implements Icon {
        private final String name; private final int size; private final Color color;
        Glyph(String name, int size, Color color) { this.name = name; this.size = size; this.color = color; }
        @Override public int getIconWidth() { return size; }
        @Override public int getIconHeight() { return size; }
        @Override public void paintIcon(Component c, Graphics graphics, int x, int y) {
            Graphics2D g = smooth(graphics); g.translate(x, y); g.scale(size / 24.0, size / 24.0);
            g.setColor(color); g.setStroke(new BasicStroke(1.8f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            switch (name) {
                case "play" -> { Path2D p = new Path2D.Double(); p.moveTo(7, 4); p.lineTo(20, 12); p.lineTo(7, 20); p.closePath(); g.fill(p); }
                case "pause" -> { g.fillRoundRect(6, 4, 4, 16, 2, 2); g.fillRoundRect(14, 4, 4, 16, 2, 2); }
                case "next", "previous" -> {
                    if (name.equals("previous")) { g.translate(24, 0); g.scale(-1, 1); }
                    Path2D p = new Path2D.Double(); p.moveTo(5, 5); p.lineTo(16, 12); p.lineTo(5, 19); p.closePath(); g.fill(p); g.fillRoundRect(18, 5, 2, 14, 1, 1);
                }
                case "plus" -> { g.drawLine(12, 5, 12, 19); g.drawLine(5, 12, 19, 12); }
                case "search" -> { g.drawOval(3, 3, 12, 12); g.drawLine(14, 14, 21, 21); }
                case "repeat" -> { g.drawLine(4, 7, 20, 7); g.drawLine(20, 7, 16, 3); g.drawLine(20, 7, 16, 11); g.drawLine(20, 17, 4, 17); g.drawLine(4, 17, 8, 13); g.drawLine(4, 17, 8, 21); }
                case "home" -> { g.drawLine(3, 10, 12, 3); g.drawLine(12, 3, 21, 10); g.drawRect(6, 10, 12, 11); }
                case "discover" -> { g.drawOval(2, 2, 20, 20); g.drawLine(9, 15, 15, 9); g.drawLine(9, 15, 11, 9); g.drawLine(11, 9, 15, 9); }
                case "code" -> { g.drawLine(8, 6, 2, 12); g.drawLine(2, 12, 8, 18); g.drawLine(16, 6, 22, 12); g.drawLine(22, 12, 16, 18); }
                case "queue" -> { g.drawLine(3, 5, 19, 5); g.drawLine(3, 11, 19, 11); g.drawLine(3, 17, 11, 17); g.drawLine(17, 16, 17, 22); g.drawLine(14, 19, 20, 19); }
                case "back" -> { g.drawArc(5, 5, 16, 15, -70, 280); g.drawLine(5, 5, 5, 11); g.drawLine(5, 11, 11, 11); }
                case "close" -> { g.drawLine(6, 6, 18, 18); g.drawLine(18, 6, 6, 18); }
                case "more" -> { for (int i = 0; i < 3; i++) g.fillOval(3 + i * 8, 10, 3, 3); }
                default -> { g.drawLine(4, 6, 4, 18); g.drawLine(9, 3, 9, 21); g.drawLine(14, 7, 14, 17); g.drawLine(19, 4, 19, 20); }
            }
            g.dispose();
        }
    }
    static final class Cover implements Icon {
        private final int size, seed; private final boolean hero;
        Cover(int size, String key) { this.size = size; seed = key.hashCode(); hero = key.equals("hero"); }
        @Override public int getIconWidth() { return size; }
        @Override public int getIconHeight() { return size; }
        @Override public void paintIcon(Component c, Graphics graphics, int x, int y) {
            Graphics2D g = smooth(graphics); g.translate(x, y); g.scale(size / 200.0, size / 200.0);
            g.clip(new RoundRectangle2D.Double(0, 0, 200, 200, 12, 12));
            Color[] colors = {new Color(228, 130, 83), new Color(87, 138, 171), new Color(193, 97, 133),
                    new Color(177, 173, 80), new Color(149, 116, 186), new Color(68, 151, 136)};
            Color base = hero ? new Color(248, 160, 75) : colors[Math.floorMod(seed, colors.length)];
            g.setPaint(new GradientPaint(0, 0, base.brighter(), 190, 200, base.darker())); g.fillRect(0, 0, 200, 200);
            if (hero) {
                g.setColor(new Color(36, 49, 29)); g.setFont(font(12, true)); g.drawString("TUNEWAVE / MIX 01", 17, 25);
                g.setFont(font(32, true)); g.drawString("CHAT", 15, 61); g.drawString("PATA", 15, 92);
                g.setColor(new Color(248, 237, 197)); g.fillRoundRect(19, 106, 164, 73, 10, 10);
                g.setColor(new Color(34, 47, 29)); g.fillRoundRect(38, 121, 126, 32, 17, 17);
                for (int x0 : new int[]{57, 143}) {
                    g.setColor(new Color(248, 237, 197)); g.fillOval(x0 - 12, 125, 24, 24);
                    g.setColor(new Color(34, 47, 29)); g.fillOval(x0 - 5, 132, 10, 10);
                }
                g.setStroke(new BasicStroke(1.5f)); g.drawLine(70, 166, 132, 166);
                g.setFont(font(8, true)); g.drawString("SIDE A / DESI POP & THROWBACKS", 20, 194);
            } else if (Math.floorMod(seed, 3) == 0) {
                g.setColor(new Color(24, 37, 29)); g.fillOval(32, 32, 170, 170);
                g.setColor(new Color(240, 234, 192)); g.fillOval(85, 85, 64, 64);
                g.setColor(new Color(24, 37, 29)); g.fillOval(110, 110, 14, 14);
                g.setStroke(new BasicStroke(2)); g.setColor(new Color(255, 255, 255, 45));
                for (int i = 0; i < 4; i++) g.drawOval(43 + i * 9, 43 + i * 9, 148 - i * 18, 148 - i * 18);
            } else if (Math.floorMod(seed, 3) == 1) {
                g.setColor(new Color(249, 237, 197)); g.fillRoundRect(20, 60, 160, 92, 12, 12);
                g.setColor(new Color(30, 49, 43)); g.fillRoundRect(35, 75, 130, 43, 24, 24);
                g.setColor(base); g.fillOval(42, 81, 30, 30); g.fillOval(128, 81, 30, 30);
                g.setStroke(new BasicStroke(5)); g.drawLine(57, 134, 142, 134);
            } else {
                g.setColor(new Color(246, 235, 201)); g.setStroke(new BasicStroke(12, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
                for (int i = 0; i < 6; i++) { int h = 35 + Math.floorMod(seed + i * 31, 90); g.drawLine(30 + i * 28, 100 - h / 2, 30 + i * 28, 100 + h / 2); }
            }
            g.dispose();
        }
    }
}
