
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.util.ArrayList;
import java.util.List;

public class TuneWaveGUI extends JFrame {

    private final Playlist playlist = new Playlist();
    private final List<Song> songs = new ArrayList<>();
    private final List<Song> queue = new ArrayList<>();
    private final List<Song> history = new ArrayList<>();

    private final DefaultListModel<Song> listModel =
            new DefaultListModel<>();
    private final JList<Song> songList = new JList<>(listModel);
    private final JTextField searchField = new JTextField();

    private final JLabel titleLabel = new JLabel("Choose a song");
    private final JLabel artistLabel = new JLabel("Your music, your flow");
    private final JLabel statusLabel = new JLabel("READY");

    private final JButton playButton = new JButton("▶");
    private final JButton repeatButton = new JButton("↻");

    private final Color background = new Color(245, 244, 250);
    private final Color panel = Color.WHITE;
    private final Color accent = new Color(190, 170, 245);
    private final Color muted = new Color(65, 65, 75);
    private final Color textColor = Color.BLACK;

    private Song currentSong;
    private boolean playing = false;
    private boolean repeat = false;
    private String activeView = "Home";

    public TuneWaveGUI() {
        super("TuneWave Music Player");
        loadSongs();
        buildInterface();
        showHome();

        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1100, 720);
        setMinimumSize(new Dimension(850, 600));
        setLocationRelativeTo(null);
    }

    private void loadSongs() {
        Song[] library = {
            new Song("S001", "Tum Hi Ho", "Arijit Singh"),
            new Song("S002", "Kesariya", "Arijit Singh"),
            new Song("S003", "Channa Mereya", "Arijit Singh"),
            new Song("S004", "Agar Tum Saath Ho", "Alka Yagnik, Arijit Singh"),
            new Song("S005", "Heeriye", "Arijit Singh, Jasleen Royal"),
            new Song("S006", "Apna Bana Le", "Arijit Singh"),
            new Song("S007", "Raataan Lambiyan", "Jubin Nautiyal, Asees Kaur"),
            new Song("S008", "Tujh Mein Rab Dikhta Hai", "Roop Kumar Rathod"),
            new Song("S009", "Kal Ho Naa Ho", "Sonu Nigam"),
            new Song("S010", "Kun Faya Kun", "A. R. Rahman, Javed Ali, Mohit Chauhan"),
            new Song("S011", "Pasoori", "Ali Sethi, Shae Gill"),
            new Song("S012", "Afreen Afreen", "Rahat Fateh Ali Khan, Momina Mustehsan"),
            new Song("S013", "Tera Woh Pyar", "Asim Azhar, Momina Mustehsan"),
            new Song("S014", "Kahani Suno 2.0", "Kaifi Khalil"),
            new Song("S015", "Iraaday", "Abdul Hannan, Rovalio"),
            new Song("S016", "Jo Tu Na Mila", "Asim Azhar"),
            new Song("S017", "Tajdar-e-Haram", "Atif Aslam"),
            new Song("S018", "Wohi Khuda Hai", "Atif Aslam"),
            new Song("S019", "Dil Diyan Gallan", "Atif Aslam"),
            new Song("S020", "Mann Mayal", "Quratulain Balouch"),
            new Song("S021", "Mundiya", "Abrar-ul-Haq"),
            new Song("S022", "Nach Punjaban", "Abrar-ul-Haq"),
            new Song("S023", "Billo De Ghar", "Abrar-ul-Haq"),
            new Song("S024", "Larsha Pekhawar", "Ali Zafar, Gul Panra, Fortitude Pukhtoon Core"),
            new Song("S025", "Mahi Aaja", "Faakhir"),
            new Song("S026", "Bheegi Bheegi", "Strings"),
            new Song("S027", "Duur", "Strings"),
            new Song("S028", "Aadat", "Atif Aslam, Jal"),
            new Song("S029", "Woh Lamhe", "Atif Aslam"),
            new Song("S030", "Hona Tha Pyar", "Atif Aslam, Hadiqa Kiani")
        };

        for (Song song : library) {
            songs.add(song);
            playlist.addSong(song);
        }
    }

    private void buildInterface() {
        getContentPane().setBackground(background);
        setLayout(new BorderLayout());

        add(buildSidebar(), BorderLayout.WEST);
        add(buildMainPanel(), BorderLayout.CENTER);
        add(buildPlayerBar(), BorderLayout.SOUTH);
    }

    private JPanel buildSidebar() {
        JPanel sidebar = new JPanel();
        sidebar.setBackground(new Color(235, 230, 248));
        sidebar.setPreferredSize(new Dimension(205, 0));
        sidebar.setLayout(new BoxLayout(sidebar, BoxLayout.Y_AXIS));
        sidebar.setBorder(new EmptyBorder(25, 16, 20, 16));

        JLabel logo = new JLabel("♫ TuneWave");
        logo.setFont(new Font("SansSerif", Font.BOLD, 25));
        logo.setForeground(Color.BLACK);
        logo.setBorder(new EmptyBorder(0, 5, 35, 0));
        sidebar.add(logo);

        addNavButton(sidebar, "⌂   Home", this::showHome);
        addNavButton(sidebar, "⌕   Search", searchField::requestFocusInWindow);
        addNavButton(sidebar, "♫   My Playlist", this::showHome);
        addNavButton(sidebar, "≡   Up Next", this::showQueue);
        addNavButton(sidebar, "◷   History", this::showHistory);

        sidebar.add(Box.createVerticalGlue());

        JLabel note = new JLabel("<html>YOUR MUSIC.<br>YOUR FLOW.</html>");
        note.setForeground(Color.BLACK);
        note.setFont(new Font("SansSerif", Font.BOLD, 12));
        sidebar.add(note);

        return sidebar;
    }

    private void addNavButton(
            JPanel sidebar, String text, Runnable action) {
        JButton button = new JButton(text);
        styleButton(button, new Color(235, 230, 248));
        button.setHorizontalAlignment(SwingConstants.LEFT);
        button.setMaximumSize(new Dimension(Integer.MAX_VALUE, 48));
        button.addActionListener(e -> action.run());
        sidebar.add(button);
        sidebar.add(Box.createVerticalStrut(5));
    }

    private JPanel buildMainPanel() {
        JPanel main = new JPanel(new BorderLayout(0, 18));
        main.setBackground(background);
        main.setBorder(new EmptyBorder(25, 28, 20, 28));

        JPanel header = new JPanel();
        header.setOpaque(false);
        header.setLayout(new BoxLayout(header, BoxLayout.Y_AXIS));

        JLabel welcome = new JLabel("YOUR SOUNDTRACK");
        welcome.setForeground(new Color(115, 75, 190));
        welcome.setFont(new Font("SansSerif", Font.BOLD, 12));

        JLabel headline = new JLabel("Good music, good mood.");
        headline.setForeground(Color.BLACK);
        headline.setFont(new Font("SansSerif", Font.BOLD, 28));

        JLabel subtitle = new JLabel(
                "Discover your favourites and keep the vibe going.");
        subtitle.setForeground(muted);

        header.add(welcome);
        header.add(Box.createVerticalStrut(8));
        header.add(headline);
        header.add(Box.createVerticalStrut(5));
        header.add(subtitle);
        header.add(Box.createVerticalStrut(15));

        searchField.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        searchField.setBackground(Color.WHITE);
        searchField.setForeground(Color.BLACK);
        searchField.setCaretColor(Color.BLACK);
        searchField.setFont(new Font("SansSerif", Font.PLAIN, 14));
        searchField.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(accent),
                new EmptyBorder(8, 10, 8, 10)));
        searchField.setToolTipText("Search songs or artists");

        searchField.getDocument().addDocumentListener(
                new javax.swing.event.DocumentListener() {
                    public void insertUpdate(
                            javax.swing.event.DocumentEvent e) {
                        filterSongs();
                    }
                    public void removeUpdate(
                            javax.swing.event.DocumentEvent e) {
                        filterSongs();
                    }
                    public void changedUpdate(
                            javax.swing.event.DocumentEvent e) {
                        filterSongs();
                    }
                });

        header.add(searchField);

        JPanel libraryPanel = new JPanel(new BorderLayout(0, 12));
        libraryPanel.setBackground(background);

        JLabel section = new JLabel("SONG LIBRARY");
        section.setForeground(Color.BLACK);
        section.setFont(new Font("SansSerif", Font.BOLD, 15));
        libraryPanel.add(section, BorderLayout.NORTH);

        songList.setBackground(Color.WHITE);
        songList.setForeground(Color.BLACK);
        songList.setSelectionBackground(new Color(225, 215, 250));
        songList.setSelectionForeground(Color.BLACK);
        songList.setFont(new Font("SansSerif", Font.PLAIN, 14));
        songList.setFixedCellHeight(42);
        songList.setBorder(new EmptyBorder(5, 8, 5, 8));

        songList.setCellRenderer((list, song, index, selected, focus) -> {
            JPanel row = new JPanel(new BorderLayout(12, 0));
            row.setBackground(selected
                    ? new Color(225, 215, 250) : Color.WHITE);
            row.setBorder(new EmptyBorder(5, 8, 5, 8));

            JLabel number = new JLabel(String.format("%02d", index + 1));
            number.setForeground(new Color(115, 75, 190));
            number.setPreferredSize(new Dimension(28, 25));

            JPanel details = new JPanel();
            details.setOpaque(false);
            details.setLayout(new BoxLayout(details, BoxLayout.Y_AXIS));

            JLabel title = new JLabel(song.getTitle());
            title.setForeground(Color.BLACK);
            title.setFont(new Font("SansSerif", Font.BOLD, 13));

            JLabel artist = new JLabel(song.getArtist());
            artist.setForeground(muted);
            artist.setFont(new Font("SansSerif", Font.PLAIN, 11));

            details.add(title);
            details.add(artist);
            row.add(number, BorderLayout.WEST);
            row.add(details, BorderLayout.CENTER);
            return row;
        });

        songList.addListSelectionListener(e -> {
            if (!e.getValueIsAdjusting()) {
                Song selected = songList.getSelectedValue();
                if (selected != null) {
                    titleLabel.setText(selected.getTitle());
                    artistLabel.setText(selected.getArtist());
                }
            }
        });

        songList.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent e) {
                if (e.getClickCount() == 2) {
                    playSelectedSong();
                }
            }
        });

        JScrollPane scroll = new JScrollPane(songList);
        scroll.setBorder(BorderFactory.createLineBorder(
                new Color(220, 215, 230)));
        scroll.getViewport().setBackground(Color.WHITE);
        libraryPanel.add(scroll, BorderLayout.CENTER);

        JPanel content = new JPanel(new BorderLayout(0, 15));
        content.setOpaque(false);
        content.add(buildFeaturedPanel(), BorderLayout.NORTH);
        content.add(libraryPanel, BorderLayout.CENTER);

        main.add(header, BorderLayout.NORTH);
        main.add(content, BorderLayout.CENTER);
        return main;
    }

    private JPanel buildFeaturedPanel() {
        JPanel featured = new JPanel(new BorderLayout(18, 0));
        featured.setBackground(new Color(231, 223, 250));
        featured.setBorder(new EmptyBorder(16, 18, 16, 18));

        JPanel artwork = new JPanel() {
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
                        RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setPaint(new GradientPaint(
                        0, 0, new Color(170, 135, 235),
                        getWidth(), getHeight(),
                        new Color(100, 75, 165)));
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 16, 16);
                g2.setColor(new Color(255, 255, 255, 45));
                g2.fillOval(8, 8, 72, 72);
                g2.fillOval(28, 28, 72, 72);
                g2.setColor(Color.WHITE);
                g2.setFont(new Font("SansSerif", Font.BOLD, 31));
                g2.drawString("TW", 24, 58);
                g2.dispose();
            }
        };
        artwork.setPreferredSize(new Dimension(110, 110));

        JPanel info = new JPanel();
        info.setOpaque(false);
        info.setLayout(new BoxLayout(info, BoxLayout.Y_AXIS));

        JLabel tag = new JLabel("FEATURED PLAYLIST");
        tag.setForeground(new Color(100, 65, 170));
        tag.setFont(new Font("SansSerif", Font.BOLD, 11));

        JLabel name = new JLabel("Desi Vibes");
        name.setForeground(Color.BLACK);
        name.setFont(new Font("SansSerif", Font.BOLD, 23));

        JLabel desc = new JLabel(
                "Bollywood, Lollywood and songs you love.");
        desc.setForeground(muted);

        JButton browse = new JButton("Browse songs");
        styleButton(browse, accent);
        browse.addActionListener(e -> showHome());

        info.add(tag);
        info.add(Box.createVerticalStrut(6));
        info.add(name);
        info.add(Box.createVerticalStrut(4));
        info.add(desc);
        info.add(Box.createVerticalStrut(10));
        info.add(browse);

        featured.add(artwork, BorderLayout.WEST);
        featured.add(info, BorderLayout.CENTER);
        return featured;
    }

    private JPanel buildPlayerBar() {
        JPanel player = new JPanel(new BorderLayout(20, 5));
        player.setBackground(new Color(235, 230, 248));
        player.setBorder(new EmptyBorder(12, 20, 10, 20));

        JPanel songInfo = new JPanel();
        songInfo.setOpaque(false);
        songInfo.setLayout(new BoxLayout(songInfo, BoxLayout.Y_AXIS));

        titleLabel.setForeground(Color.BLACK);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 14));
        artistLabel.setForeground(muted);
        artistLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));

        songInfo.add(titleLabel);
        songInfo.add(Box.createVerticalStrut(4));
        songInfo.add(artistLabel);

        JPanel controls = new JPanel();
        controls.setOpaque(false);
        controls.setLayout(new BoxLayout(controls, BoxLayout.Y_AXIS));

        JPanel buttons = new JPanel(new FlowLayout(
                FlowLayout.CENTER, 10, 0));
        buttons.setOpaque(false);

        JButton previousButton = new JButton("|◀");
        JButton nextButton = new JButton("▶|");
        JButton queueButton = new JButton("+ Queue");

        styleButton(previousButton, Color.WHITE);
        styleButton(nextButton, Color.WHITE);
        styleButton(playButton, accent);
        styleButton(repeatButton, Color.WHITE);
        styleButton(queueButton, Color.WHITE);

        playButton.setFont(new Font("SansSerif", Font.BOLD, 20));
        playButton.setPreferredSize(new Dimension(48, 38));

        previousButton.addActionListener(e -> moveTrack(-1));
        nextButton.addActionListener(e -> moveTrack(1));
        playButton.addActionListener(e -> togglePlay());
        repeatButton.addActionListener(e -> toggleRepeat());
        queueButton.addActionListener(e -> addSelectedToQueue());

        buttons.add(repeatButton);
        buttons.add(previousButton);
        buttons.add(playButton);
        buttons.add(nextButton);
        buttons.add(queueButton);

        JSlider timeline = new JSlider(0, 100, 0);
        timeline.setOpaque(false);
        timeline.setForeground(new Color(125, 85, 200));
        timeline.setEnabled(false);

        statusLabel.setForeground(muted);
        statusLabel.setFont(new Font("SansSerif", Font.PLAIN, 10));

        controls.add(buttons);
        controls.add(timeline);
        controls.add(statusLabel);

        JPanel volumePanel = new JPanel();
        volumePanel.setOpaque(false);
        volumePanel.setLayout(new BoxLayout(volumePanel, BoxLayout.Y_AXIS));

        JLabel volumeLabel = new JLabel("VOLUME");
        volumeLabel.setForeground(Color.BLACK);
        volumeLabel.setFont(new Font("SansSerif", Font.BOLD, 10));

        JSlider volume = new JSlider(0, 100, 70);
        volume.setOpaque(false);
        volume.setForeground(new Color(125, 85, 200));
        volume.setPreferredSize(new Dimension(105, 30));

        volumePanel.add(volumeLabel);
        volumePanel.add(volume);

        player.add(songInfo, BorderLayout.WEST);
        player.add(controls, BorderLayout.CENTER);
        player.add(volumePanel, BorderLayout.EAST);
        return player;
    }

    private void styleButton(JButton button, Color bg) {
        button.setBackground(bg);
        button.setForeground(Color.BLACK);
        button.setFocusPainted(false);
        button.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(
                        new Color(205, 195, 225)),
                new EmptyBorder(7, 12, 7, 12)));
        button.setCursor(Cursor.getPredefinedCursor(
                Cursor.HAND_CURSOR));
    }

    private void showHome() {
        activeView = "Home";
        fillList(songs);
    }

    private void showQueue() {
        activeView = "Queue";
        fillList(queue);
    }

    private void showHistory() {
        activeView = "History";
        fillList(history);
    }

    private void fillList(List<Song> source) {
        listModel.clear();
        for (Song song : source) {
            listModel.addElement(song);
        }
    }

    private void filterSongs() {
        String query = searchField.getText().trim().toLowerCase();
        List<Song> filtered = new ArrayList<>();

        List<Song> source = activeView.equals("Queue") ? queue
                : activeView.equals("History") ? history : songs;

        for (Song song : source) {
            if (song.getTitle().toLowerCase().contains(query)
                    || song.getArtist().toLowerCase().contains(query)) {
                filtered.add(song);
            }
        }

        fillList(filtered);
    }

    private void playSelectedSong() {
        Song selected = songList.getSelectedValue();

        if (selected == null) {
            JOptionPane.showMessageDialog(this,
                    "Select a song first.");
            return;
        }

        String result = playlist.playSong(selected.getId());
        if (result.startsWith("Song not found")) {
            JOptionPane.showMessageDialog(this, result);
            return;
        }

        setCurrentSong(selected);
        playing = true;
        playButton.setText("Ⅱ");
        statusLabel.setText("SELECTED • AUDIO NOT CONNECTED");
    }

    private void setCurrentSong(Song song) {
        currentSong = song;
        titleLabel.setText(song.getTitle());
        artistLabel.setText(song.getArtist());

        history.remove(song);
        history.add(0, song);
        if (history.size() > 10) {
            history.remove(history.size() - 1);
        }
    }

    private void moveTrack(int direction) {
        if (songs.isEmpty()) {
            return;
        }

        int index = currentSong == null ? 0 : songs.indexOf(currentSong);
        index = (index + direction + songs.size()) % songs.size();

        Song next = songs.get(index);
        playlist.playSong(next.getId());
        setCurrentSong(next);
        playing = true;
        playButton.setText("Ⅱ");
        statusLabel.setText("SELECTED • AUDIO NOT CONNECTED");
    }

    private void togglePlay() {
        if (currentSong == null) {
            if (!songs.isEmpty()) {
                playlist.playSong(songs.get(0).getId());
                setCurrentSong(songs.get(0));
                playing = true;
                playButton.setText("Ⅱ");
            }
            return;
        }

        playing = !playing;
        playButton.setText(playing ? "Ⅱ" : "▶");
        statusLabel.setText(playing
                ? "READY • AUDIO NOT CONNECTED"
                : "PAUSED • AUDIO NOT CONNECTED");
    }

    private void toggleRepeat() {
        repeat = playlist.toggleRepeat();
        repeatButton.setText(repeat ? "↻ ON" : "↻");
        statusLabel.setText(repeat
                ? "REPEAT ENABLED" : "REPEAT DISABLED");
    }

    private void addSelectedToQueue() {
        Song selected = songList.getSelectedValue();

        if (selected == null) {
            JOptionPane.showMessageDialog(this,
                    "Select a song to add to Up Next.");
            return;
        }

        if (playlist.addToUpNext(selected.getId())) {
            queue.add(selected);
            statusLabel.setText("ADDED TO UP NEXT • " + selected.getTitle());
        } else {
            JOptionPane.showMessageDialog(this,
                    "Could not add this song to the queue.");
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            TuneWaveGUI gui = new TuneWaveGUI();
            gui.setVisible(true);
        });
    }
}
