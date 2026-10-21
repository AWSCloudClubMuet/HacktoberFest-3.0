package tunewave;

import java.awt.BorderLayout;
import java.awt.CardLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Cursor;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.GridLayout;
import java.awt.Insets;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.io.File;
import java.util.List;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.DefaultListCellRenderer;
import javax.swing.DefaultListModel;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JList;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSlider;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.ListSelectionModel;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;
import javax.swing.Timer;
import javax.swing.border.EmptyBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.filechooser.FileNameExtensionFilter;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;

/**
 * Production-grade desktop music player application for TuneWave (Team 404 MERCY).
 *
 * <p>Inspired by the user experience and visual architecture of Spotify and Apple Music,
 * featuring real local audio playback (WAV, MP3, AIFF), interactive seeking, generative
 * album artwork, and deep integration with the underlying DSA service (doubly-linked playlist,
 * FIFO queue, LIFO history stack, BST search, and artist similarity graph).</p>
 */
public class TuneWaveGUI extends JFrame {

    private final TuneWaveService service;
    private final AudioEngine audioEngine;

    // ── Layout & View Management ─────────────────────────────────────────────
    private CardLayout stageCardLayout;
    private JPanel stageContainer;
    private String currentView = "HOME";
    private JPanel rightDrawer;
    private boolean drawerVisible = true;

    // ── Left Navigation Buttons ──────────────────────────────────────────────
    private NavButton navHomeBtn;
    private NavButton navDiscoverBtn;
    private NavButton navLibraryBtn;

    // ── Home View Components ─────────────────────────────────────────────────
    private AlbumArtwork heroArtwork;
    private JLabel heroTitle;
    private JLabel heroArtist;
    private JLabel heroIdBadge;
    private JLabel heroAudioBadge;
    private JButton heroPlayBtn;
    private ModernSeekBar heroSeekBar;
    private JLabel heroTimeCurrent;
    private JLabel heroTimeTotal;
    private JPanel quickPlayGrid;

    // ── Discover & Search View Components ────────────────────────────────────
    private JTextField searchInputField;
    private DefaultTableModel searchTableModel;
    private JTable searchTable;
    private JTextField artistInputField;
    private JPanel artistChipsPanel;

    // ── Library / Playlist View Components ───────────────────────────────────
    private DefaultTableModel playlistTableModel;
    private JTable playlistTable;
    private JLabel playlistCountLabel;
    private JTextField playlistFilterField;

    // ── Right Drawer (Queue & History) Components ────────────────────────────
    private final DefaultListModel<String> upNextModel = new DefaultListModel<>();
    private final DefaultListModel<String> historyModel = new DefaultListModel<>();
    private JList<String> upNextList;
    private JList<String> historyList;
    private JTextField quickQueueInput;
    private JLabel queueCountBadge;
    private JLabel historyCountBadge;

    // ── Persistent Bottom Player Components ──────────────────────────────────
    private AlbumArtwork bottomThumb;
    private JLabel bottomTitle;
    private JLabel bottomArtist;
    private JLabel bottomAudioTag;
    private JButton bottomPlayBtn;
    private JButton bottomRepeatBtn;
    private ModernSeekBar bottomSeekBar;
    private JLabel bottomTimeCurrent;
    private JLabel bottomTimeTotal;
    private JSlider volumeSlider;
    private JLabel bottomStatusBadge;

    // ── Timeline Sync Timer ──────────────────────────────────────────────────
    private Timer timelineTimer;

    /**
     * Constructs and initializes the TuneWave desktop music player.
     *
     * @param service underlying business and DSA facade
     */
    public TuneWaveGUI(TuneWaveService service) {
        super("TuneWave — Modern Music Player");
        this.service = service;
        this.audioEngine = new AudioEngine();

        // Initialize built-in preview audio for initial songs
        File audioCacheDir = new File("audio_cache");
        audioEngine.initSampleAudioCache(audioCacheDir, service.getAllSongs());

        // Wire natural track-end progression to service.playNext()
        audioEngine.setOnTrackFinished(() -> handlePlayNext());

        initWindow();
        initComponents();
        setupTimelineTimer();
        refreshAllViews("Ready. Press Play or choose a song to start.");
    }

    /**
     * Launches the GUI application on the Swing Event Dispatch Thread.
     */
    public static void launch(TuneWaveService service) {
        SwingUtilities.invokeLater(() -> {
            TuneWaveGUI gui = new TuneWaveGUI(service);
            gui.setVisible(true);
        });
    }

    // =========================================================================
    // Window & Top-Level Architecture
    // =========================================================================

    private void initWindow() {
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1320, 840);
        setMinimumSize(new Dimension(1080, 680));
        setLocationRelativeTo(null);
        getContentPane().setBackground(TuneWaveTheme.BG_APP);
        setLayout(new BorderLayout(0, 0));
    }

    private void initComponents() {
        // 1. Left Sidebar Navigation
        JPanel sidebar = createSidebar();
        add(sidebar, BorderLayout.WEST);

        // 2. Central Content Stage (CardLayout for Home, Discover, Library)
        stageCardLayout = new CardLayout();
        stageContainer = new JPanel(stageCardLayout);
        stageContainer.setBackground(TuneWaveTheme.BG_APP);

        stageContainer.add(createHomeView(), "HOME");
        stageContainer.add(createDiscoverView(), "DISCOVER");
        stageContainer.add(createLibraryView(), "LIBRARY");

        // 3. Right Queue Drawer
        rightDrawer = createRightDrawer();

        // Center split: Stage on Left, Right Drawer on Right
        JPanel centerContainer = new JPanel(new BorderLayout(0, 0));
        centerContainer.setBackground(TuneWaveTheme.BG_APP);
        centerContainer.add(stageContainer, BorderLayout.CENTER);
        centerContainer.add(rightDrawer, BorderLayout.EAST);
        add(centerContainer, BorderLayout.CENTER);

        // 4. Persistent Bottom Player Bar
        JPanel bottomPlayer = createBottomPlayer();
        add(bottomPlayer, BorderLayout.SOUTH);
    }

    // =========================================================================
    // 1. Left Sidebar
    // =========================================================================

    private JPanel createSidebar() {
        JPanel sidebar = new JPanel(new BorderLayout());
        sidebar.setPreferredSize(new Dimension(220, 0));
        sidebar.setBackground(TuneWaveTheme.BG_SIDEBAR);
        sidebar.setBorder(BorderFactory.createMatteBorder(0, 0, 0, 1, TuneWaveTheme.BORDER_SUBTLE));

        // Brand Header
        JPanel brandPanel = new JPanel();
        brandPanel.setLayout(new BoxLayout(brandPanel, BoxLayout.Y_AXIS));
        brandPanel.setOpaque(false);
        brandPanel.setBorder(new EmptyBorder(24, 20, 20, 20));

        JPanel logoRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        logoRow.setOpaque(false);
        JLabel logoIcon = new JLabel("●~") {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                TuneWaveTheme.applyQualityHints(g2);
                g2.setColor(TuneWaveTheme.ACCENT_GREEN);
                g2.fillOval(2, 4, 10, 10);
                g2.setColor(TuneWaveTheme.ACCENT_CYAN);
                g2.fillOval(14, 2, 8, 8);
                g2.setColor(TuneWaveTheme.ACCENT_VIOLET);
                g2.fillOval(24, 5, 6, 6);
                g2.dispose();
            }
        };
        logoIcon.setPreferredSize(new Dimension(32, 18));

        JLabel brandTitle = new JLabel("TuneWave");
        brandTitle.setFont(TuneWaveTheme.FONT_BRAND);
        brandTitle.setForeground(TuneWaveTheme.TXT_PRIMARY);
        logoRow.add(logoIcon);
        logoRow.add(brandTitle);

        JLabel subTitle = new JLabel("TEAM 404 MERCY");
        subTitle.setFont(TuneWaveTheme.FONT_CAPTION);
        subTitle.setForeground(TuneWaveTheme.TXT_MUTED);
        subTitle.setBorder(new EmptyBorder(4, 38, 0, 0));

        brandPanel.add(logoRow);
        brandPanel.add(subTitle);
        sidebar.add(brandPanel, BorderLayout.NORTH);

        // Main Navigation Section
        JPanel navBody = new JPanel();
        navBody.setLayout(new BoxLayout(navBody, BoxLayout.Y_AXIS));
        navBody.setOpaque(false);
        navBody.setBorder(new EmptyBorder(10, 12, 10, 12));

        navHomeBtn = new NavButton("Home", "🏠", true, () -> switchStage("HOME"));
        navDiscoverBtn = new NavButton("Discover & Search", "🔍", false, () -> switchStage("DISCOVER"));
        navLibraryBtn = new NavButton("Your Library", "📚", false, () -> switchStage("LIBRARY"));

        navBody.add(navHomeBtn);
        navBody.add(Box.createVerticalStrut(4));
        navBody.add(navDiscoverBtn);
        navBody.add(Box.createVerticalStrut(4));
        navBody.add(navLibraryBtn);

        navBody.add(Box.createVerticalStrut(24));

        // Quick Collections Header
        JLabel collHeader = new JLabel("PLAYLIST & QUEUE");
        collHeader.setFont(new Font("Segoe UI", Font.BOLD, 10));
        collHeader.setForeground(TuneWaveTheme.TXT_MUTED);
        collHeader.setBorder(new EmptyBorder(0, 12, 8, 0));
        navBody.add(collHeader);

        // Quick Action: Link Audio File
        SidebarActionLink linkAudioLink = new SidebarActionLink("🎵 Link Audio File...", () -> {
            Song curr = service.currentlyPlaying();
            if (curr == null) curr = service.currentSong();
            chooseAndLinkAudio(curr != null ? curr.getSongId() : null);
        });
        navBody.add(linkAudioLink);

        // Quick Action: Toggle Repeat
        SidebarActionLink repeatToggleLink = new SidebarActionLink("🔁 Toggle Repeat", () -> handleToggleRepeat());
        navBody.add(repeatToggleLink);

        // Quick Action: Show/Hide Queue Drawer
        SidebarActionLink toggleDrawerLink = new SidebarActionLink("📑 Toggle Queue Drawer", () -> toggleRightDrawer());
        navBody.add(toggleDrawerLink);

        sidebar.add(navBody, BorderLayout.CENTER);

        // Bottom Footer: DSA Spec note
        JPanel footer = new JPanel();
        footer.setLayout(new BoxLayout(footer, BoxLayout.Y_AXIS));
        footer.setOpaque(false);
        footer.setBorder(new EmptyBorder(12, 16, 20, 16));

        JLabel dsaLabel = new JLabel("DSA Architecture");
        dsaLabel.setFont(TuneWaveTheme.FONT_CAPTION);
        dsaLabel.setForeground(TuneWaveTheme.TXT_MUTED);

        JLabel dsaInfo = new JLabel("DLL • BST • Graph • Stack");
        dsaInfo.setFont(TuneWaveTheme.FONT_CAPTION);
        dsaInfo.setForeground(TuneWaveTheme.TXT_FAINT);

        footer.add(dsaLabel);
        footer.add(dsaInfo);
        sidebar.add(footer, BorderLayout.SOUTH);

        return sidebar;
    }

    private void switchStage(String viewName) {
        currentView = viewName;
        stageCardLayout.show(stageContainer, viewName);
        navHomeBtn.setActive("HOME".equals(viewName));
        navDiscoverBtn.setActive("DISCOVER".equals(viewName));
        navLibraryBtn.setActive("LIBRARY".equals(viewName));
    }

    private void toggleRightDrawer() {
        drawerVisible = !drawerVisible;
        rightDrawer.setVisible(drawerVisible);
        revalidate();
        repaint();
    }

    // =========================================================================
    // 2. Central Stage — View 1: Home
    // =========================================================================

    private JPanel createHomeView() {
        JPanel home = new JPanel();
        home.setLayout(new BoxLayout(home, BoxLayout.Y_AXIS));
        home.setBackground(TuneWaveTheme.BG_APP);
        home.setBorder(new EmptyBorder(24, 32, 24, 32));

        // 1. Featured Now Playing Hero Card
        JPanel heroCard = new JPanel(new BorderLayout(24, 0)) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                TuneWaveTheme.applyQualityHints(g2);
                // Subtle gradient background for hero card
                GradientPaint gp = new GradientPaint(0, 0, new Color(32, 38, 48), getWidth(), getHeight(), new Color(22, 24, 30));
                g2.setPaint(gp);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 16, 16);
                g2.setColor(TuneWaveTheme.BORDER_SUBTLE);
                g2.drawRoundRect(0, 0, getWidth() - 1, getHeight() - 1, 16, 16);
                g2.dispose();
            }
        };
        heroCard.setOpaque(false);
        heroCard.setBorder(new EmptyBorder(24, 24, 24, 24));
        heroCard.setMaximumSize(new Dimension(1600, 240));

        // Hero Left: Artwork
        heroArtwork = new AlbumArtwork(160, 12);
        heroCard.add(heroArtwork, BorderLayout.WEST);

        // Hero Center: Metadata & Controls
        JPanel heroMeta = new JPanel();
        heroMeta.setLayout(new BoxLayout(heroMeta, BoxLayout.Y_AXIS));
        heroMeta.setOpaque(false);

        // Badges Row
        JPanel badgesRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        badgesRow.setOpaque(false);

        heroIdBadge = createBadge("ID: S01", TuneWaveTheme.ACCENT_CYAN);
        heroAudioBadge = createBadge("AUDIO LINKED", TuneWaveTheme.ACCENT_GREEN);
        badgesRow.add(heroIdBadge);
        badgesRow.add(heroAudioBadge);
        heroMeta.add(badgesRow);
        heroMeta.add(Box.createVerticalStrut(8));

        // Song Title & Artist
        heroTitle = new JLabel("Select a Song to Begin");
        heroTitle.setFont(TuneWaveTheme.FONT_HERO_TITLE);
        heroTitle.setForeground(TuneWaveTheme.TXT_PRIMARY);
        heroMeta.add(heroTitle);

        heroArtist = new JLabel("TuneWave Player");
        heroArtist.setFont(TuneWaveTheme.FONT_SECTION);
        heroArtist.setForeground(TuneWaveTheme.TXT_SECONDARY);
        heroMeta.add(heroArtist);

        heroMeta.add(Box.createVerticalStrut(14));

        // Interactive Hero Timeline
        JPanel heroTimeRow = new JPanel(new BorderLayout(10, 0));
        heroTimeRow.setOpaque(false);
        heroTimeCurrent = new JLabel("0:00");
        heroTimeCurrent.setFont(TuneWaveTheme.FONT_MONO);
        heroTimeCurrent.setForeground(TuneWaveTheme.TXT_MUTED);

        heroTimeTotal = new JLabel("0:00");
        heroTimeTotal.setFont(TuneWaveTheme.FONT_MONO);
        heroTimeTotal.setForeground(TuneWaveTheme.TXT_MUTED);

        heroSeekBar = new ModernSeekBar();
        heroSeekBar.setOnSeek(fraction -> handleSeek(fraction));

        heroTimeRow.add(heroTimeCurrent, BorderLayout.WEST);
        heroTimeRow.add(heroSeekBar, BorderLayout.CENTER);
        heroTimeRow.add(heroTimeTotal, BorderLayout.EAST);
        heroMeta.add(heroTimeRow);

        heroMeta.add(Box.createVerticalStrut(14));

        // Hero Control Buttons Row
        JPanel heroControls = new JPanel(new FlowLayout(FlowLayout.LEFT, 12, 0));
        heroControls.setOpaque(false);

        JButton heroPrevBtn = createCircleButton("⏮", 36, () -> handlePlaylistPrev());
        heroPlayBtn = createAccentButton("▶ Play", () -> handleTogglePlayPause());
        JButton heroNextBtn = createCircleButton("⏭", 36, () -> handlePlayNext());
        JButton heroLinkBtn = createSecondaryButton("🎵 Link Audio...", () -> {
            Song s = service.currentlyPlaying();
            if (s == null) s = service.currentSong();
            chooseAndLinkAudio(s != null ? s.getSongId() : null);
        });

        heroControls.add(heroPrevBtn);
        heroControls.add(heroPlayBtn);
        heroControls.add(heroNextBtn);
        heroControls.add(heroLinkBtn);
        heroMeta.add(heroControls);

        heroCard.add(heroMeta, BorderLayout.CENTER);
        home.add(heroCard);

        home.add(Box.createVerticalStrut(28));

        // 2. Catalog Quick-Play Grid Section
        JLabel gridHeader = new JLabel("Quick Play Catalog");
        gridHeader.setFont(TuneWaveTheme.FONT_HEADER);
        gridHeader.setForeground(TuneWaveTheme.TXT_PRIMARY);
        home.add(gridHeader);

        home.add(Box.createVerticalStrut(14));

        quickPlayGrid = new JPanel(new GridLayout(2, 3, 14, 14));
        quickPlayGrid.setOpaque(false);
        quickPlayGrid.setMaximumSize(new Dimension(1600, 180));
        populateQuickPlayGrid();
        home.add(quickPlayGrid);

        home.add(Box.createVerticalGlue());

        JScrollPane scroll = new JScrollPane(home);
        scroll.setBorder(null);
        scroll.getViewport().setBackground(TuneWaveTheme.BG_APP);
        scroll.getVerticalScrollBar().setUnitIncrement(16);

        JPanel wrapper = new JPanel(new BorderLayout());
        wrapper.setBackground(TuneWaveTheme.BG_APP);
        wrapper.add(scroll, BorderLayout.CENTER);
        return wrapper;
    }

    private void populateQuickPlayGrid() {
        quickPlayGrid.removeAll();
        List<Song> songs = service.getPlaylistSongs();
        int count = 0;
        for (Song s : songs) {
            if (count++ >= 6) break;
            JPanel card = createQuickPlayCard(s);
            quickPlayGrid.add(card);
        }
    }

    private JPanel createQuickPlayCard(Song song) {
        JPanel card = new JPanel(new BorderLayout(12, 0)) {
            private boolean hovered = false;
            {
                addMouseListener(new MouseAdapter() {
                    @Override
                    public void mouseEntered(MouseEvent e) { hovered = true; repaint(); }
                    @Override
                    public void mouseExited(MouseEvent e) { hovered = false; repaint(); }
                    @Override
                    public void mouseClicked(MouseEvent e) { playSongDirectly(song); }
                });
            }
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                TuneWaveTheme.applyQualityHints(g2);
                g2.setColor(hovered ? TuneWaveTheme.BG_CARD_HOV : TuneWaveTheme.BG_CARD);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 8, 8);
                g2.setColor(hovered ? TuneWaveTheme.BORDER_LINE : TuneWaveTheme.BORDER_SUBTLE);
                g2.drawRoundRect(0, 0, getWidth() - 1, getHeight() - 1, 8, 8);
                g2.dispose();
            }
        };
        card.setOpaque(false);
        card.setCursor(new Cursor(Cursor.HAND_CURSOR));
        card.setBorder(new EmptyBorder(8, 8, 8, 12));

        AlbumArtwork art = new AlbumArtwork(54, 6);
        art.setSong(song, false);
        card.add(art, BorderLayout.WEST);

        JPanel textPanel = new JPanel();
        textPanel.setLayout(new BoxLayout(textPanel, BoxLayout.Y_AXIS));
        textPanel.setOpaque(false);

        JLabel title = new JLabel(song.getTitle());
        title.setFont(TuneWaveTheme.FONT_BOLD);
        title.setForeground(TuneWaveTheme.TXT_PRIMARY);

        JLabel artist = new JLabel(song.getArtist() + " • " + song.getSongId());
        artist.setFont(TuneWaveTheme.FONT_CAPTION);
        artist.setForeground(TuneWaveTheme.TXT_MUTED);

        textPanel.add(Box.createVerticalGlue());
        textPanel.add(title);
        textPanel.add(Box.createVerticalStrut(2));
        textPanel.add(artist);
        textPanel.add(Box.createVerticalGlue());
        card.add(textPanel, BorderLayout.CENTER);

        JButton playIco = createCircleButton("▶", 28, () -> playSongDirectly(song));
        card.add(playIco, BorderLayout.EAST);

        return card;
    }

    // =========================================================================
    // 2. Central Stage — View 2: Discover & Search
    // =========================================================================

    private JPanel createDiscoverView() {
        JPanel discover = new JPanel(new BorderLayout(0, 20));
        discover.setBackground(TuneWaveTheme.BG_APP);
        discover.setBorder(new EmptyBorder(24, 32, 24, 32));

        // Header & Search Inputs Row
        JPanel topSection = new JPanel();
        topSection.setLayout(new BoxLayout(topSection, BoxLayout.Y_AXIS));
        topSection.setOpaque(false);

        JLabel header = new JLabel("Discover & Search");
        header.setFont(TuneWaveTheme.FONT_HEADER);
        header.setForeground(TuneWaveTheme.TXT_PRIMARY);
        topSection.add(header);

        JLabel sub = new JLabel("Fast Binary Search Tree lookup (exact & prefix) and Artist Similarity Graph");
        sub.setFont(TuneWaveTheme.FONT_CAPTION);
        sub.setForeground(TuneWaveTheme.TXT_MUTED);
        topSection.add(sub);

        topSection.add(Box.createVerticalStrut(16));

        // Search Input Bar
        JPanel searchBarRow = new JPanel(new BorderLayout(10, 0));
        searchBarRow.setOpaque(false);

        searchInputField = createSearchField("Search songs by title or prefix (e.g. 'Bl', 'Shape', 'Bohemian')...");
        searchInputField.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) { runLiveSearch(); }
            @Override
            public void removeUpdate(DocumentEvent e) { runLiveSearch(); }
            @Override
            public void changedUpdate(DocumentEvent e) { runLiveSearch(); }
        });

        JButton exactBtn = createSecondaryButton("Find Exact Title", () -> runExactSearch());
        searchBarRow.add(searchInputField, BorderLayout.CENTER);
        searchBarRow.add(exactBtn, BorderLayout.EAST);
        topSection.add(searchBarRow);

        discover.add(topSection, BorderLayout.NORTH);

        // Center: Search Results Table
        String[] cols = { "#", "Song ID", "Title", "Artist", "Audio File", "Action" };
        searchTableModel = new DefaultTableModel(cols, 0) {
            @Override
            public boolean isCellEditable(int r, int c) { return false; }
        };

        searchTable = new JTable(searchTableModel);
        styleDarkTable(searchTable);
        searchTable.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() == 2) {
                    playSelectedFromSearchTable();
                }
            }
        });

        JScrollPane tableScroll = new JScrollPane(searchTable);
        tableScroll.setBorder(BorderFactory.createLineBorder(TuneWaveTheme.BORDER_SUBTLE));
        tableScroll.getViewport().setBackground(TuneWaveTheme.BG_SURFACE);
        discover.add(tableScroll, BorderLayout.CENTER);

        // Bottom Section: Artist Similarity Network
        JPanel graphSection = new JPanel(new BorderLayout(0, 10));
        graphSection.setOpaque(false);
        graphSection.setPreferredSize(new Dimension(0, 160));
        graphSection.setBorder(BorderFactory.createTitledBorder(
                BorderFactory.createLineBorder(TuneWaveTheme.BORDER_SUBTLE),
                "Artist Similarity Network (Distance-2 Graph)",
                0, 0, TuneWaveTheme.FONT_BOLD, TuneWaveTheme.TXT_PRIMARY
        ));

        JPanel artistInputRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 8));
        artistInputRow.setOpaque(false);
        JLabel artistLbl = new JLabel("Explore Related Artists:");
        artistLbl.setFont(TuneWaveTheme.FONT_REGULAR);
        artistLbl.setForeground(TuneWaveTheme.TXT_SECONDARY);

        artistInputField = createSearchField("Type artist name (e.g. The Weeknd, Drake, Adele)...");
        artistInputField.setPreferredSize(new Dimension(320, 34));
        artistInputField.addActionListener(e -> exploreArtistRelations());

        JButton exploreBtn = createAccentButton("Find Similar Artists", () -> exploreArtistRelations());

        artistInputRow.add(artistLbl);
        artistInputRow.add(artistInputField);
        artistInputRow.add(exploreBtn);
        graphSection.add(artistInputRow, BorderLayout.NORTH);

        artistChipsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 8));
        artistChipsPanel.setOpaque(false);
        graphSection.add(artistChipsPanel, BorderLayout.CENTER);

        discover.add(graphSection, BorderLayout.SOUTH);

        // Initial search load
        runLiveSearch();
        return discover;
    }

    private void runLiveSearch() {
        String query = searchInputField.getText().trim();
        searchTableModel.setRowCount(0);

        List<Song> matches;
        if (query.isEmpty()) {
            matches = service.getPlaylistSongs();
        } else {
            matches = service.prefixSearch(query);
            // Also check exact
            Song exact = service.searchByTitle(query);
            if (exact != null && !matches.contains(exact)) {
                searchTableModel.addRow(new Object[] {
                        "★ Match", exact.getSongId(), exact.getTitle(), exact.getArtist(),
                        audioEngine.getAudioFileName(exact.getSongId()), "Double-click to Play"
                });
            }
        }

        int idx = 1;
        for (Song s : matches) {
            searchTableModel.addRow(new Object[] {
                    idx++, s.getSongId(), s.getTitle(), s.getArtist(),
                    audioEngine.getAudioFileName(s.getSongId()), "Double-click to Play"
            });
        }
    }

    private void runExactSearch() {
        String query = searchInputField.getText().trim();
        if (query.isEmpty()) return;
        Song exact = service.searchByTitle(query);
        searchTableModel.setRowCount(0);
        if (exact != null) {
            searchTableModel.addRow(new Object[] {
                    "Exact", exact.getSongId(), exact.getTitle(), exact.getArtist(),
                    audioEngine.getAudioFileName(exact.getSongId()), "Double-click to Play"
            });
        } else {
            JOptionPane.showMessageDialog(this,
                    "No song found with exact title: \"" + query + "\"",
                    "Song BST Lookup", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private void exploreArtistRelations() {
        String artist = artistInputField.getText().trim();
        artistChipsPanel.removeAll();
        if (artist.isEmpty()) {
            artistChipsPanel.revalidate();
            artistChipsPanel.repaint();
            return;
        }

        List<String> recs = service.recommendArtists(artist);
        if (recs.isEmpty()) {
            JLabel empty = new JLabel("No distance-2 recommendations in artist graph for \"" + artist + "\"");
            empty.setFont(TuneWaveTheme.FONT_CAPTION);
            empty.setForeground(TuneWaveTheme.TXT_MUTED);
            artistChipsPanel.add(empty);
        } else {
            for (String rec : recs) {
                JPanel chip = createArtistChip(rec);
                artistChipsPanel.add(chip);
            }
        }
        artistChipsPanel.revalidate();
        artistChipsPanel.repaint();
    }

    private JPanel createArtistChip(String artistName) {
        JPanel chip = new JPanel(new FlowLayout(FlowLayout.CENTER, 8, 4)) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                TuneWaveTheme.applyQualityHints(g2);
                g2.setColor(TuneWaveTheme.BG_SURFACE_HOV);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 16, 16);
                g2.setColor(TuneWaveTheme.ACCENT_CYAN);
                g2.drawRoundRect(0, 0, getWidth() - 1, getHeight() - 1, 16, 16);
                g2.dispose();
            }
        };
        chip.setOpaque(false);
        chip.setCursor(new Cursor(Cursor.HAND_CURSOR));

        JLabel lbl = new JLabel("✨ " + artistName);
        lbl.setFont(TuneWaveTheme.FONT_SMALL);
        lbl.setForeground(TuneWaveTheme.TXT_PRIMARY);
        chip.add(lbl);

        chip.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                searchInputField.setText(artistName);
                runLiveSearch();
            }
        });
        return chip;
    }

    private void playSelectedFromSearchTable() {
        int r = searchTable.getSelectedRow();
        if (r < 0) return;
        String songId = String.valueOf(searchTableModel.getValueAt(r, 1));
        Song song = service.getSong(songId);
        if (song != null) {
            playSongDirectly(song);
        }
    }

    // =========================================================================
    // 2. Central Stage — View 3: Library / Playlist
    // =========================================================================

    private JPanel createLibraryView() {
        JPanel lib = new JPanel(new BorderLayout(0, 16));
        lib.setBackground(TuneWaveTheme.BG_APP);
        lib.setBorder(new EmptyBorder(24, 32, 24, 32));

        // Top Toolbar
        JPanel top = new JPanel(new BorderLayout(16, 0));
        top.setOpaque(false);

        JPanel headerBox = new JPanel();
        headerBox.setLayout(new BoxLayout(headerBox, BoxLayout.Y_AXIS));
        headerBox.setOpaque(false);

        JLabel title = new JLabel("Your Library — Playlist");
        title.setFont(TuneWaveTheme.FONT_HEADER);
        title.setForeground(TuneWaveTheme.TXT_PRIMARY);

        playlistCountLabel = new JLabel("12 tracks • Custom Doubly-Linked List with O(1) Cursor Movement");
        playlistCountLabel.setFont(TuneWaveTheme.FONT_CAPTION);
        playlistCountLabel.setForeground(TuneWaveTheme.TXT_MUTED);

        headerBox.add(title);
        headerBox.add(playlistCountLabel);
        top.add(headerBox, BorderLayout.WEST);

        // Actions Row
        JPanel actions = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        actions.setOpaque(false);

        JButton playSelectedBtn = createAccentButton("▶ Play Track", () -> handlePlaySelectedFromPlaylist());
        JButton queueSelectedBtn = createSecondaryButton("+ Add to Up Next", () -> handleQueueSelectedFromPlaylist());
        JButton linkAudioBtn = createSecondaryButton("🎵 Link Audio...", () -> handleLinkAudioSelectedFromPlaylist());
        JButton removeBtn = createSecondaryButton("🗑 Remove", () -> handleRemoveSelectedFromPlaylist());

        actions.add(playSelectedBtn);
        actions.add(queueSelectedBtn);
        actions.add(linkAudioBtn);
        actions.add(removeBtn);
        top.add(actions, BorderLayout.EAST);

        lib.add(top, BorderLayout.NORTH);

        // Playlist Table
        String[] cols = { "#", "Status", "Title & Artist", "ID", "Audio Source", "Duration" };
        playlistTableModel = new DefaultTableModel(cols, 0) {
            @Override
            public boolean isCellEditable(int r, int c) { return false; }
        };

        playlistTable = new JTable(playlistTableModel);
        styleDarkTable(playlistTable);

        // Custom Renderer highlighting currently playing song
        playlistTable.setDefaultRenderer(Object.class, new DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(JTable table, Object value,
                                                           boolean isSelected, boolean hasFocus, int row, int col) {
                Component c = super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, col);
                String id = (String) table.getValueAt(row, 3);
                Song playing = service.currentlyPlaying();
                boolean isCurrentPlaying = (playing != null && playing.getSongId().equals(id));

                if (isCurrentPlaying) {
                    c.setBackground(new Color(24, 48, 36));
                    c.setForeground(TuneWaveTheme.ACCENT_GREEN);
                    if (col == 1) {
                        setText(audioEngine.isPlaying() ? "▶ PLAYING" : "⏸ PAUSED");
                    }
                } else if (isSelected) {
                    c.setBackground(TuneWaveTheme.BG_CARD_HOV);
                    c.setForeground(TuneWaveTheme.TXT_PRIMARY);
                } else {
                    c.setBackground(TuneWaveTheme.BG_SURFACE);
                    c.setForeground(TuneWaveTheme.TXT_SECONDARY);
                }

                if (col == 0) setHorizontalAlignment(SwingConstants.CENTER);
                else setHorizontalAlignment(SwingConstants.LEFT);
                setBorder(new EmptyBorder(0, 8, 0, 8));
                return c;
            }
        });

        playlistTable.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() == 2) {
                    handlePlaySelectedFromPlaylist();
                }
            }
        });

        JScrollPane scroll = new JScrollPane(playlistTable);
        scroll.setBorder(BorderFactory.createLineBorder(TuneWaveTheme.BORDER_SUBTLE));
        scroll.getViewport().setBackground(TuneWaveTheme.BG_SURFACE);
        lib.add(scroll, BorderLayout.CENTER);

        return lib;
    }

    private void populatePlaylistTable() {
        playlistTableModel.setRowCount(0);
        List<Song> songs = service.getPlaylistSongs();
        Song playing = service.currentlyPlaying();
        int idx = 1;
        for (Song s : songs) {
            boolean isPlayingThis = (playing != null && playing.getSongId().equals(s.getSongId()));
            String status = isPlayingThis ? (audioEngine.isPlaying() ? "▶ PLAYING" : "⏸ PAUSED") : "";
            playlistTableModel.addRow(new Object[] {
                    idx++,
                    status,
                    s.getTitle() + " — " + s.getArtist(),
                    s.getSongId(),
                    audioEngine.getAudioFileName(s.getSongId()),
                    estimateDurationString(s.getTitle())
            });
        }
        playlistCountLabel.setText(songs.size() + " tracks • Custom Doubly-Linked List with O(1) Cursor Movement");
    }

    // =========================================================================
    // 3. Right Queue Drawer (Up Next FIFO + Playback History LIFO)
    // =========================================================================

    private JPanel createRightDrawer() {
        JPanel drawer = new JPanel(new BorderLayout(0, 0));
        drawer.setPreferredSize(new Dimension(270, 0));
        drawer.setBackground(TuneWaveTheme.BG_SIDEBAR);
        drawer.setBorder(BorderFactory.createMatteBorder(0, 1, 0, 0, TuneWaveTheme.BORDER_SUBTLE));

        // Drawer Header with Close Button
        JPanel header = new JPanel(new BorderLayout());
        header.setOpaque(false);
        header.setBorder(new EmptyBorder(16, 16, 12, 16));

        JLabel title = new JLabel("Up Next & History");
        title.setFont(TuneWaveTheme.FONT_SECTION);
        title.setForeground(TuneWaveTheme.TXT_PRIMARY);

        JButton closeBtn = createCircleButton("✕", 24, () -> toggleRightDrawer());
        header.add(title, BorderLayout.WEST);
        header.add(closeBtn, BorderLayout.EAST);
        drawer.add(header, BorderLayout.NORTH);

        // Body: Top half is FIFO Queue, Bottom half is LIFO History
        JPanel body = new JPanel(new GridLayout(2, 1, 0, 12));
        body.setOpaque(false);
        body.setBorder(new EmptyBorder(0, 12, 16, 12));

        // 1. Up Next Section
        JPanel queueSection = new JPanel(new BorderLayout(0, 8));
        queueSection.setOpaque(false);

        JPanel queueHeaderRow = new JPanel(new BorderLayout());
        queueHeaderRow.setOpaque(false);
        JLabel queueLbl = new JLabel("Up Next (FIFO Queue)");
        queueLbl.setFont(TuneWaveTheme.FONT_BOLD);
        queueLbl.setForeground(TuneWaveTheme.TXT_PRIMARY);
        queueCountBadge = createBadge("0", TuneWaveTheme.ACCENT_CYAN);
        queueHeaderRow.add(queueLbl, BorderLayout.WEST);
        queueHeaderRow.add(queueCountBadge, BorderLayout.EAST);
        queueSection.add(queueHeaderRow, BorderLayout.NORTH);

        upNextList = new JList<>(upNextModel);
        styleDrawerList(upNextList);
        JScrollPane queueScroll = new JScrollPane(upNextList);
        queueScroll.setBorder(BorderFactory.createLineBorder(TuneWaveTheme.BORDER_SUBTLE));
        queueSection.add(queueScroll, BorderLayout.CENTER);

        // Input to enqueue by ID
        JPanel enqueueRow = new JPanel(new BorderLayout(6, 0));
        enqueueRow.setOpaque(false);
        quickQueueInput = createSearchField("Song ID (e.g. S03)...");
        quickQueueInput.setPreferredSize(new Dimension(100, 30));
        quickQueueInput.addActionListener(e -> handleEnqueueById());
        JButton addQueueBtn = createSecondaryButton("+ Add", () -> handleEnqueueById());
        enqueueRow.add(quickQueueInput, BorderLayout.CENTER);
        enqueueRow.add(addQueueBtn, BorderLayout.EAST);
        queueSection.add(enqueueRow, BorderLayout.SOUTH);

        body.add(queueSection);

        // 2. Playback History Section
        JPanel historySection = new JPanel(new BorderLayout(0, 8));
        historySection.setOpaque(false);

        JPanel histHeaderRow = new JPanel(new BorderLayout());
        histHeaderRow.setOpaque(false);
        JLabel histLbl = new JLabel("History (LIFO Stack, max 10)");
        histLbl.setFont(TuneWaveTheme.FONT_BOLD);
        histLbl.setForeground(TuneWaveTheme.TXT_PRIMARY);
        historyCountBadge = createBadge("0", TuneWaveTheme.ACCENT_VIOLET);
        histHeaderRow.add(histLbl, BorderLayout.WEST);
        histHeaderRow.add(historyCountBadge, BorderLayout.EAST);
        historySection.add(histHeaderRow, BorderLayout.NORTH);

        historyList = new JList<>(historyModel);
        styleDrawerList(historyList);
        JScrollPane histScroll = new JScrollPane(historyList);
        histScroll.setBorder(BorderFactory.createLineBorder(TuneWaveTheme.BORDER_SUBTLE));
        historySection.add(histScroll, BorderLayout.CENTER);

        JButton backBtn = createSecondaryButton("↩ Replay Last (History Back)", () -> handleBack());
        historySection.add(backBtn, BorderLayout.SOUTH);

        body.add(historySection);

        drawer.add(body, BorderLayout.CENTER);
        return drawer;
    }

    private void styleDrawerList(JList<String> list) {
        list.setBackground(TuneWaveTheme.BG_SURFACE);
        list.setForeground(TuneWaveTheme.TXT_SECONDARY);
        list.setFont(TuneWaveTheme.FONT_REGULAR);
        list.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        list.setFixedCellHeight(30);
        list.setCellRenderer(new DefaultListCellRenderer() {
            @Override
            public Component getListCellRendererComponent(JList<?> l, Object val, int idx, boolean isSel, boolean foc) {
                JLabel lbl = (JLabel) super.getListCellRendererComponent(l, val, idx, isSel, foc);
                lbl.setBorder(new EmptyBorder(0, 8, 0, 8));
                if (isSel) {
                    lbl.setBackground(TuneWaveTheme.BG_CARD_HOV);
                    lbl.setForeground(TuneWaveTheme.ACCENT_CYAN);
                } else {
                    lbl.setBackground(TuneWaveTheme.BG_SURFACE);
                    lbl.setForeground(TuneWaveTheme.TXT_SECONDARY);
                }
                return lbl;
            }
        });
    }

    // =========================================================================
    // 4. Persistent Bottom Player Bar
    // =========================================================================

    private JPanel createBottomPlayer() {
        JPanel bar = new JPanel(new BorderLayout(20, 0));
        bar.setPreferredSize(new Dimension(0, 84));
        bar.setBackground(TuneWaveTheme.BG_BOTTOM_BAR);
        bar.setBorder(BorderFactory.createMatteBorder(1, 0, 0, 0, TuneWaveTheme.BORDER_SUBTLE));

        // Left Section: Album Art Thumbnail & Song Title/Artist
        JPanel left = new JPanel(new FlowLayout(FlowLayout.LEFT, 14, 16));
        left.setOpaque(false);
        left.setPreferredSize(new Dimension(320, 0));

        bottomThumb = new AlbumArtwork(52, 6);
        left.add(bottomThumb);

        JPanel titles = new JPanel();
        titles.setLayout(new BoxLayout(titles, BoxLayout.Y_AXIS));
        titles.setOpaque(false);

        bottomTitle = new JLabel("TuneWave Player");
        bottomTitle.setFont(TuneWaveTheme.FONT_BOLD);
        bottomTitle.setForeground(TuneWaveTheme.TXT_PRIMARY);

        bottomArtist = new JLabel("Ready to Play");
        bottomArtist.setFont(TuneWaveTheme.FONT_CAPTION);
        bottomArtist.setForeground(TuneWaveTheme.TXT_MUTED);

        bottomAudioTag = new JLabel("Built-in Audio Ready");
        bottomAudioTag.setFont(new Font("Segoe UI", Font.PLAIN, 10));
        bottomAudioTag.setForeground(TuneWaveTheme.ACCENT_CYAN);

        titles.add(bottomTitle);
        titles.add(Box.createVerticalStrut(2));
        titles.add(bottomArtist);
        titles.add(Box.createVerticalStrut(2));
        titles.add(bottomAudioTag);
        left.add(titles);
        bar.add(left, BorderLayout.WEST);

        // Center Section: Transport Controls & Seekbar
        JPanel center = new JPanel();
        center.setLayout(new BoxLayout(center, BoxLayout.Y_AXIS));
        center.setOpaque(false);
        center.setBorder(new EmptyBorder(10, 0, 10, 0));

        // Transport Controls Row
        JPanel controls = new JPanel(new FlowLayout(FlowLayout.CENTER, 16, 0));
        controls.setOpaque(false);

        JButton btnPrevCursor = createIconButton("⏮", "Previous cursor track in doubly-linked list", () -> handlePlaylistPrev());
        JButton btnHistoryBack = createIconButton("↩", "Replay from LIFO history stack", () -> handleBack());
        bottomPlayBtn = createCircleButton("▶", 36, () -> handleTogglePlayPause());
        JButton btnPlayNext = createIconButton("⏭", "Play next (queue priority then playlist advance)", () -> handlePlayNext());
        bottomRepeatBtn = createIconButton("🔁", "Toggle repeat mode (wraps tail to head)", () -> handleToggleRepeat());

        controls.add(btnHistoryBack);
        controls.add(btnPrevCursor);
        controls.add(bottomPlayBtn);
        controls.add(btnPlayNext);
        controls.add(bottomRepeatBtn);
        center.add(controls);

        center.add(Box.createVerticalStrut(6));

        // Timeline Scrubber Row
        JPanel timeRow = new JPanel(new BorderLayout(10, 0));
        timeRow.setOpaque(false);

        bottomTimeCurrent = new JLabel("0:00");
        bottomTimeCurrent.setFont(TuneWaveTheme.FONT_MONO);
        bottomTimeCurrent.setForeground(TuneWaveTheme.TXT_MUTED);

        bottomTimeTotal = new JLabel("0:00");
        bottomTimeTotal.setFont(TuneWaveTheme.FONT_MONO);
        bottomTimeTotal.setForeground(TuneWaveTheme.TXT_MUTED);

        bottomSeekBar = new ModernSeekBar();
        bottomSeekBar.setOnSeek(fraction -> handleSeek(fraction));

        timeRow.add(bottomTimeCurrent, BorderLayout.WEST);
        timeRow.add(bottomSeekBar, BorderLayout.CENTER);
        timeRow.add(bottomTimeTotal, BorderLayout.EAST);
        center.add(timeRow);

        bar.add(center, BorderLayout.CENTER);

        // Right Section: Playback Status Badge & Volume Slider
        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 14, 24));
        right.setOpaque(false);
        right.setPreferredSize(new Dimension(320, 0));

        bottomStatusBadge = createBadge("READY", TuneWaveTheme.TXT_MUTED);
        right.add(bottomStatusBadge);

        JLabel volIcon = new JLabel("🔊");
        volIcon.setForeground(TuneWaveTheme.TXT_MUTED);
        right.add(volIcon);

        volumeSlider = new JSlider(0, 100, 85);
        volumeSlider.setPreferredSize(new Dimension(90, 20));
        volumeSlider.setOpaque(false);
        volumeSlider.setCursor(new Cursor(Cursor.HAND_CURSOR));
        volumeSlider.addChangeListener(e -> {
            float vol = volumeSlider.getValue() / 100.0f;
            audioEngine.setVolume(vol);
        });
        right.add(volumeSlider);

        JButton drawerBtn = createIconButton("📑", "Toggle queue drawer", () -> toggleRightDrawer());
        right.add(drawerBtn);

        bar.add(right, BorderLayout.EAST);
        return bar;
    }

    // =========================================================================
    // Playback & Interaction Handlers
    // =========================================================================

    private void handleTogglePlayPause() {
        Song current = service.currentlyPlaying();
        if (current == null) {
            // First play: start playback at playlist cursor
            current = service.play();
        }

        if (current == null) {
            refreshAllViews("Playlist is empty. Add songs to play.");
            return;
        }

        if (audioEngine.isPlaying()) {
            audioEngine.pause();
            refreshAllViews("⏸ Paused: \"" + current.getTitle() + "\"");
        } else if (audioEngine.isPaused() && current.getSongId().equals(audioEngine.getActiveSongId())) {
            audioEngine.resume();
            refreshAllViews("▶ Resumed: \"" + current.getTitle() + "\"");
        } else {
            // Start audio for this song
            if (audioEngine.hasAudio(current.getSongId())) {
                audioEngine.play(current.getSongId());
                refreshAllViews("▶ Playing: \"" + current.getTitle() + "\" (" + audioEngine.getAudioFileName(current.getSongId()) + ")");
            } else {
                audioEngine.stop();
                refreshAllViews("⚠ No audio file linked to [" + current.getSongId() + "]. Please click 'Link Audio File'.");
                promptLinkAudio(current);
            }
        }
    }

    private void handlePlayNext() {
        Object res = service.playNext();
        if (res instanceof Song s) {
            playSongAudioOrPrompt(s, "⏭ Now playing: \"" + s.getTitle() + "\" by " + s.getArtist());
        } else if ("end".equals(res)) {
            audioEngine.stop();
            refreshAllViews("End of playlist reached. Repeat mode is OFF.");
        } else {
            audioEngine.stop();
            refreshAllViews("Playlist and Up Next queue are both empty.");
        }
    }

    private void handleBack() {
        Song s = service.back();
        if (s != null) {
            playSongAudioOrPrompt(s, "↩ Replaying from LIFO history stack: \"" + s.getTitle() + "\"");
        } else {
            refreshAllViews("History stack is empty.");
        }
    }

    private void handlePlaylistNext() {
        Object res = service.playlistNext();
        if (res instanceof Song s) {
            refreshAllViews("Cursor advanced to: \"" + s.getTitle() + "\" (doubly-linked list)");
        } else if ("end".equals(res)) {
            refreshAllViews("At tail of playlist. Repeat mode is OFF.");
        } else {
            refreshAllViews("Playlist is empty.");
        }
    }

    private void handlePlaylistPrev() {
        Object res = service.playlistPrevious();
        if (res instanceof Song s) {
            refreshAllViews("Cursor retreated to: \"" + s.getTitle() + "\" (doubly-linked list)");
        } else if ("start".equals(res)) {
            refreshAllViews("At head of playlist. Cannot retreat further.");
        } else {
            refreshAllViews("Playlist is empty.");
        }
    }

    private void handleToggleRepeat() {
        boolean on = service.toggleRepeat();
        refreshAllViews("Repeat mode set to " + (on ? "ON (Wraps tail to head)" : "OFF"));
    }

    private void handleEnqueueById() {
        String id = quickQueueInput.getText().trim();
        if (id.isEmpty()) return;
        Song s = service.getSong(id);
        if (s == null) {
            JOptionPane.showMessageDialog(this,
                    "Song ID \"" + id + "\" does not exist in catalog.",
                    "Unknown Song ID", JOptionPane.WARNING_MESSAGE);
            return;
        }
        service.addToUpNext(id);
        quickQueueInput.setText("");
        refreshAllViews("Enqueued to Up Next: \"" + s.getTitle() + "\"");
    }

    private void handlePlaySelectedFromPlaylist() {
        int r = playlistTable.getSelectedRow();
        if (r < 0) return;
        String id = String.valueOf(playlistTableModel.getValueAt(r, 3));
        Song s = service.getSong(id);
        if (s != null) {
            playSongDirectly(s);
        }
    }

    private void handleQueueSelectedFromPlaylist() {
        int r = playlistTable.getSelectedRow();
        if (r < 0) return;
        String id = String.valueOf(playlistTableModel.getValueAt(r, 3));
        service.addToUpNext(id);
        refreshAllViews("Added [" + id + "] to Up Next queue.");
    }

    private void handleLinkAudioSelectedFromPlaylist() {
        int r = playlistTable.getSelectedRow();
        if (r < 0) {
            chooseAndLinkAudio(null);
            return;
        }
        String id = String.valueOf(playlistTableModel.getValueAt(r, 3));
        chooseAndLinkAudio(id);
    }

    private void handleRemoveSelectedFromPlaylist() {
        int r = playlistTable.getSelectedRow();
        if (r < 0) return;
        String id = String.valueOf(playlistTableModel.getValueAt(r, 3));
        service.removeSongFromPlaylist(id);
        refreshAllViews("Removed track [" + id + "] from playlist.");
    }

    private void playSongDirectly(Song song) {
        // Enqueue to Up Next and immediately play next
        service.addToUpNext(song.getSongId());
        service.playNext();
        playSongAudioOrPrompt(song, "▶ Playing: \"" + song.getTitle() + "\"");
    }

    private void playSongAudioOrPrompt(Song s, String message) {
        if (audioEngine.hasAudio(s.getSongId())) {
            audioEngine.play(s.getSongId());
            refreshAllViews(message);
        } else {
            audioEngine.stop();
            refreshAllViews("⚠ No audio file assigned to [" + s.getSongId() + "] \"" + s.getTitle() + "\".");
            promptLinkAudio(s);
        }
    }

    private void promptLinkAudio(Song song) {
        int choice = JOptionPane.showConfirmDialog(this,
                "No audio file is currently linked to:\n\"" + song.getTitle() + "\" [" + song.getSongId() + "]\n\n"
                        + "Would you like to select a local MP3 or WAV file now?",
                "Link Audio File", JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE);
        if (choice == JOptionPane.YES_OPTION) {
            chooseAndLinkAudio(song.getSongId());
        }
    }

    public void chooseAndLinkAudio(String songId) {
        if (songId == null) {
            // Ask user to pick from catalog
            List<Song> songs = service.getPlaylistSongs();
            if (songs.isEmpty()) return;
            String[] ids = songs.stream().map(s -> s.getSongId() + " - " + s.getTitle()).toArray(String[]::new);
            String selected = (String) JOptionPane.showInputDialog(this,
                    "Select a song to link audio file to:",
                    "Choose Song", JOptionPane.PLAIN_MESSAGE, null, ids, ids[0]);
            if (selected == null) return;
            songId = selected.split(" - ")[0].trim();
        }

        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Select Audio File for [" + songId + "]");
        FileNameExtensionFilter filter = new FileNameExtensionFilter(
                "Audio Files (*.wav, *.mp3, *.aiff, *.au)", "wav", "mp3", "aiff", "au");
        chooser.setFileFilter(filter);

        int res = chooser.showOpenDialog(this);
        if (res == JFileChooser.APPROVE_OPTION) {
            File file = chooser.getSelectedFile();
            audioEngine.linkAudio(songId, file);
            Song playing = service.currentlyPlaying();
            if (playing != null && playing.getSongId().equals(songId)) {
                audioEngine.play(songId);
            }
            refreshAllViews("Successfully linked '" + file.getName() + "' to [" + songId + "]");
        }
    }

    private void handleSeek(double fraction) {
        Song current = service.currentlyPlaying();
        if (current != null && audioEngine.hasAudio(current.getSongId())) {
            audioEngine.seekToPercent(fraction);
            long posUs = audioEngine.getPositionMicroseconds();
            long lenUs = audioEngine.getLengthMicroseconds();
            String timeStr = AudioEngine.formatMicroseconds(posUs);
            heroTimeCurrent.setText(timeStr);
            bottomTimeCurrent.setText(timeStr);
        }
    }

    // =========================================================================
    // UI Refresh & Synchronization
    // =========================================================================

    private void setupTimelineTimer() {
        // 25 FPS UI refresh timer on the EDT
        timelineTimer = new Timer(40, e -> {
            if (audioEngine.isPlaying()) {
                long posUs = audioEngine.getPositionMicroseconds();
                long lenUs = audioEngine.getLengthMicroseconds();
                double frac = (lenUs > 0) ? (double) posUs / lenUs : 0.0;

                heroSeekBar.setProgress(frac);
                bottomSeekBar.setProgress(frac);

                String curStr = AudioEngine.formatMicroseconds(posUs);
                heroTimeCurrent.setText(curStr);
                bottomTimeCurrent.setText(curStr);

                if (lenUs > 0) {
                    String totalStr = AudioEngine.formatMicroseconds(lenUs);
                    heroTimeTotal.setText(totalStr);
                    bottomTimeTotal.setText(totalStr);
                }

                heroArtwork.tickAnimation();
                bottomThumb.tickAnimation();
            }
        });
        timelineTimer.start();
    }

    public void refreshAllViews(String statusMessage) {
        Song playing = service.currentlyPlaying();
        boolean isAudioPlaying = audioEngine.isPlaying();

        // 1. Hero Card Updates
        if (playing != null) {
            heroArtwork.setSong(playing, isAudioPlaying);
            heroTitle.setText(playing.getTitle());
            heroArtist.setText(playing.getArtist());
            heroIdBadge.setText("ID: " + playing.getSongId());
            boolean hasAudio = audioEngine.hasAudio(playing.getSongId());
            heroAudioBadge.setText(hasAudio ? "AUDIO: " + audioEngine.getAudioFileName(playing.getSongId()) : "NO AUDIO LINKED");
            heroAudioBadge.setForeground(hasAudio ? TuneWaveTheme.ACCENT_GREEN : TuneWaveTheme.ACCENT_ROSE);
            heroPlayBtn.setText(isAudioPlaying ? "⏸ Pause" : "▶ Play");

            bottomThumb.setSong(playing, isAudioPlaying);
            bottomTitle.setText(playing.getTitle());
            bottomArtist.setText(playing.getArtist() + " • [" + playing.getSongId() + "]");
            bottomAudioTag.setText(hasAudio ? "Source: " + audioEngine.getAudioFileName(playing.getSongId()) : "No Audio Source");
            bottomPlayBtn.setText(isAudioPlaying ? "⏸" : "▶");
            bottomStatusBadge.setText(isAudioPlaying ? "PLAYING" : "PAUSED");
            bottomStatusBadge.setForeground(isAudioPlaying ? TuneWaveTheme.ACCENT_GREEN : TuneWaveTheme.ACCENT_AMBER);
        } else {
            heroArtwork.setSong(null, false);
            heroTitle.setText("Select a Song to Begin");
            heroArtist.setText("TuneWave Music Player");
            heroIdBadge.setText("IDLE");
            heroAudioBadge.setText("NO AUDIO ACTIVE");
            heroAudioBadge.setForeground(TuneWaveTheme.TXT_MUTED);
            heroPlayBtn.setText("▶ Play");

            bottomThumb.setSong(null, false);
            bottomTitle.setText("TuneWave Music Player");
            bottomArtist.setText("Simulation Ready");
            bottomAudioTag.setText("No track loaded");
            bottomPlayBtn.setText("▶");
            bottomStatusBadge.setText("IDLE");
            bottomStatusBadge.setForeground(TuneWaveTheme.TXT_MUTED);
        }

        // Repeat button styling
        boolean rep = service.isRepeatEnabled();
        bottomRepeatBtn.setForeground(rep ? TuneWaveTheme.ACCENT_CYAN : TuneWaveTheme.TXT_MUTED);

        // 2. Up Next Queue List
        upNextModel.clear();
        List<String> upNextIds = service.getUpNextIds();
        queueCountBadge.setText(String.valueOf(upNextIds.size()));
        int qIdx = 1;
        for (String id : upNextIds) {
            Song s = service.getSong(id);
            upNextModel.addElement("#" + (qIdx++) + "  [" + id + "]  " + (s != null ? s.getTitle() : "Unknown"));
        }

        // 3. History Stack List
        historyModel.clear();
        List<String> histIds = service.getHistoryIds();
        historyCountBadge.setText(String.valueOf(histIds.size()));
        int hIdx = 1;
        for (String id : histIds) {
            Song s = service.getSong(id);
            historyModel.addElement((hIdx++) + ".  [" + id + "]  " + (s != null ? s.getTitle() : "Unknown"));
        }

        // 4. Update Tables & Grids
        populatePlaylistTable();
        populateQuickPlayGrid();

        if (statusMessage != null && !statusMessage.isEmpty()) {
            setTitle("TuneWave — " + statusMessage);
        }
    }

    // =========================================================================
    // UI Helpers & Styling
    // =========================================================================

    private void styleDarkTable(JTable table) {
        table.setBackground(TuneWaveTheme.BG_SURFACE);
        table.setForeground(TuneWaveTheme.TXT_SECONDARY);
        table.setFont(TuneWaveTheme.FONT_REGULAR);
        table.setRowHeight(38);
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        table.setShowGrid(false);
        table.setIntercellSpacing(new Dimension(0, 0));

        JTableHeader th = table.getTableHeader();
        th.setBackground(TuneWaveTheme.BG_APP);
        th.setForeground(TuneWaveTheme.TXT_MUTED);
        th.setFont(TuneWaveTheme.FONT_CAPTION);
        th.setPreferredSize(new Dimension(0, 32));
        th.setBorder(BorderFactory.createMatteBorder(0, 0, 1, 0, TuneWaveTheme.BORDER_SUBTLE));
    }

    private JTextField createSearchField(String placeholder) {
        JTextField tf = new JTextField(placeholder) {
            private boolean isPlaceholder = true;
            {
                setForeground(TuneWaveTheme.TXT_MUTED);
                addFocusListener(new java.awt.event.FocusAdapter() {
                    @Override
                    public void focusGained(java.awt.event.FocusEvent e) {
                        if (isPlaceholder) {
                            setText("");
                            setForeground(TuneWaveTheme.TXT_PRIMARY);
                            isPlaceholder = false;
                        }
                    }
                    @Override
                    public void focusLost(java.awt.event.FocusEvent e) {
                        if (getText().trim().isEmpty()) {
                            setText(placeholder);
                            setForeground(TuneWaveTheme.TXT_MUTED);
                            isPlaceholder = true;
                        }
                    }
                });
            }
        };
        tf.setBackground(TuneWaveTheme.BG_INPUT);
        tf.setFont(TuneWaveTheme.FONT_REGULAR);
        tf.setCaretColor(Color.WHITE);
        tf.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(TuneWaveTheme.BORDER_SUBTLE, 1),
                new EmptyBorder(6, 12, 6, 12)
        ));
        return tf;
    }

    private JLabel createBadge(String text, Color accent) {
        JLabel badge = new JLabel(text);
        badge.setFont(TuneWaveTheme.FONT_MONO);
        badge.setForeground(accent);
        badge.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 80), 1),
                new EmptyBorder(2, 6, 2, 6)
        ));
        return badge;
    }

    private JButton createAccentButton(String text, Runnable action) {
        JButton btn = new JButton(text) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                TuneWaveTheme.applyQualityHints(g2);
                g2.setColor(getModel().isRollover() ? new Color(34, 230, 105) : TuneWaveTheme.ACCENT_GREEN);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), getHeight(), getHeight());
                super.paintComponent(g);
                g2.dispose();
            }
        };
        btn.setFont(TuneWaveTheme.FONT_BOLD);
        btn.setForeground(Color.BLACK);
        btn.setContentAreaFilled(false);
        btn.setBorderPainted(false);
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setBorder(new EmptyBorder(8, 18, 8, 18));
        btn.addActionListener(e -> action.run());
        return btn;
    }

    private JButton createSecondaryButton(String text, Runnable action) {
        JButton btn = new JButton(text) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                TuneWaveTheme.applyQualityHints(g2);
                g2.setColor(getModel().isRollover() ? TuneWaveTheme.BG_SURFACE_HOV : TuneWaveTheme.BG_CARD);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), getHeight(), getHeight());
                g2.setColor(TuneWaveTheme.BORDER_LINE);
                g2.drawRoundRect(0, 0, getWidth() - 1, getHeight() - 1, getHeight(), getHeight());
                super.paintComponent(g);
                g2.dispose();
            }
        };
        btn.setFont(TuneWaveTheme.FONT_REGULAR);
        btn.setForeground(TuneWaveTheme.TXT_PRIMARY);
        btn.setContentAreaFilled(false);
        btn.setBorderPainted(false);
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setBorder(new EmptyBorder(6, 14, 6, 14));
        btn.addActionListener(e -> action.run());
        return btn;
    }

    private JButton createCircleButton(String text, int size, Runnable action) {
        JButton btn = new JButton(text) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                TuneWaveTheme.applyQualityHints(g2);
                boolean isPlay = "▶".equals(text) || "⏸".equals(text);
                if (isPlay) {
                    g2.setColor(getModel().isRollover() ? new Color(34, 230, 105) : TuneWaveTheme.ACCENT_GREEN);
                } else {
                    g2.setColor(getModel().isRollover() ? TuneWaveTheme.BG_CARD_HOV : TuneWaveTheme.BG_SURFACE);
                }
                g2.fillOval(0, 0, getWidth(), getHeight());
                super.paintComponent(g);
                g2.dispose();
            }
        };
        boolean isPlay = "▶".equals(text) || "⏸".equals(text);
        btn.setPreferredSize(new Dimension(size, size));
        btn.setFont(new Font("Segoe UI", Font.BOLD, isPlay ? 14 : 12));
        btn.setForeground(isPlay ? Color.BLACK : TuneWaveTheme.TXT_PRIMARY);
        btn.setContentAreaFilled(false);
        btn.setBorderPainted(false);
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.addActionListener(e -> action.run());
        return btn;
    }

    private JButton createIconButton(String icon, String tooltip, Runnable action) {
        JButton btn = new JButton(icon);
        btn.setFont(new Font("Segoe UI", Font.PLAIN, 15));
        btn.setForeground(TuneWaveTheme.TXT_SECONDARY);
        btn.setToolTipText(tooltip);
        btn.setContentAreaFilled(false);
        btn.setBorderPainted(false);
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseEntered(MouseEvent e) { btn.setForeground(TuneWaveTheme.TXT_PRIMARY); }
            @Override
            public void mouseExited(MouseEvent e) { btn.setForeground(TuneWaveTheme.TXT_SECONDARY); }
        });
        btn.addActionListener(e -> action.run());
        return btn;
    }

    private String estimateDurationString(String title) {
        int hash = Math.abs(title.hashCode());
        int sec = 160 + (hash % 120);
        return String.format("%d:%02d", sec / 60, sec % 60);
    }

    // =========================================================================
    // Sidebar Custom Widgets
    // =========================================================================

    private static class NavButton extends JButton {
        private boolean active;
        private final String glyph;
        private final String text;

        NavButton(String text, String glyph, boolean active, Runnable onClick) {
            super(glyph + "   " + text);
            this.text = text;
            this.glyph = glyph;
            this.active = active;
            setFont(TuneWaveTheme.FONT_BOLD);
            setHorizontalAlignment(SwingConstants.LEFT);
            setPreferredSize(new Dimension(196, 40));
            setMaximumSize(new Dimension(196, 40));
            setContentAreaFilled(false);
            setBorderPainted(false);
            setFocusPainted(false);
            setCursor(new Cursor(Cursor.HAND_CURSOR));
            setBorder(new EmptyBorder(0, 16, 0, 0));
            addActionListener(e -> onClick.run());
        }

        void setActive(boolean act) {
            this.active = act;
            repaint();
        }

        @Override
        protected void paintComponent(Graphics g) {
            Graphics2D g2 = (Graphics2D) g.create();
            TuneWaveTheme.applyQualityHints(g2);
            if (active) {
                g2.setColor(TuneWaveTheme.BG_SURFACE_HOV);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 8, 8);
                // Active green bar on left edge
                g2.setColor(TuneWaveTheme.ACCENT_GREEN);
                g2.fillRoundRect(0, 6, 4, getHeight() - 12, 2, 2);
                setForeground(TuneWaveTheme.TXT_PRIMARY);
            } else if (getModel().isRollover()) {
                g2.setColor(new Color(25, 25, 25));
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 8, 8);
                setForeground(TuneWaveTheme.TXT_PRIMARY);
            } else {
                setForeground(TuneWaveTheme.TXT_SECONDARY);
            }
            super.paintComponent(g);
            g2.dispose();
        }
    }

    private static class SidebarActionLink extends JButton {
        SidebarActionLink(String text, Runnable onClick) {
            super(text);
            setFont(TuneWaveTheme.FONT_REGULAR);
            setForeground(TuneWaveTheme.TXT_SECONDARY);
            setHorizontalAlignment(SwingConstants.LEFT);
            setPreferredSize(new Dimension(196, 30));
            setMaximumSize(new Dimension(196, 30));
            setContentAreaFilled(false);
            setBorderPainted(false);
            setFocusPainted(false);
            setCursor(new Cursor(Cursor.HAND_CURSOR));
            setBorder(new EmptyBorder(0, 16, 0, 0));
            addMouseListener(new MouseAdapter() {
                @Override
                public void mouseEntered(MouseEvent e) { setForeground(TuneWaveTheme.ACCENT_CYAN); }
                @Override
                public void mouseExited(MouseEvent e) { setForeground(TuneWaveTheme.TXT_SECONDARY); }
            });
            addActionListener(e -> onClick.run());
        }
    }
}
