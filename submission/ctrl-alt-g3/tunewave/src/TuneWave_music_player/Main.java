package TuneWave_music_player;

import javax.swing.JFrame;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import java.awt.Dimension;
import java.awt.GraphicsEnvironment;
import java.awt.Toolkit;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

/** Java desktop entry point. Requires JDK 17 or newer. */
public final class Main {
    private Main() { }
    public static void main(String[] args) {
        if (args.length > 0 && (args[0].equals("--demo") || args[0].equals("demo"))) { ConsoleDemo.main(new String[0]); return; }
        if (GraphicsEnvironment.isHeadless()) {
            System.out.println("TuneWave needs a desktop for its Swing UI. Run with --demo for the console demonstration.");
            return;
        }
        SwingUtilities.invokeLater(() -> {
            UIManager.put("Panel.background", Theme.SURFACE); UIManager.put("OptionPane.background", Theme.SURFACE);
            UIManager.put("OptionPane.messageForeground", Theme.TEXT); UIManager.put("Label.foreground", Theme.TEXT);
            UIManager.put("ComboBox.selectionBackground", Theme.SELECT); UIManager.put("ComboBox.selectionForeground", Theme.TEXT);
            TuneWavePanel ui = new TuneWavePanel();
            JFrame frame = new JFrame("TuneWave — Chatpata Mix");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); frame.setContentPane(ui);
            frame.setMinimumSize(new Dimension(1100, 700));
            Dimension screen = Toolkit.getDefaultToolkit().getScreenSize();
            frame.setSize(Math.max(1100, Math.min(1360, screen.width - 60)), Math.max(700, Math.min(880, screen.height - 80)));
            frame.addWindowListener(new WindowAdapter() { @Override public void windowClosing(WindowEvent e) { ui.close(); } });
            frame.setLocationRelativeTo(null); frame.setVisible(true);
        });
    }
}
