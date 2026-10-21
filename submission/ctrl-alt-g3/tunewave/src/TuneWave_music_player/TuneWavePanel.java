package TuneWave_music_player;

import javax.sound.sampled.*;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.filechooser.FileNameExtensionFilter;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static TuneWave_music_player.Theme.*;

/** Java-only desktop presentation. TuneWavePlayer remains the authority for all six structures. */
@SuppressWarnings("serial")
public final class TuneWavePanel extends JPanel implements AutoCloseable {
    private record ArtistChoice(String id, String name) { @Override public String toString() { return name; } }
    private final TuneWavePlayer player = new TuneWavePlayer();
    private final PakistaniCatalog catalog = new PakistaniCatalog();
    private final MusicLibrary local = new MusicLibrary();
    private final Map<String, File> audioFiles = new HashMap<>();
    private final CardLayout pages = new CardLayout(), sideCards = new CardLayout();
    private final JPanel pageHost = panel(pages), sideHost = panel(sideCards);
    private final JPanel right = card(SURFACE, 20), recommendations = panel(new GridLayout(0, 2, 12, 12));
    private final CardLayout trackPages = new CardLayout();
    private final JPanel trackHost = panel(trackPages), heroHolder = panel(new BorderLayout()), searchTools = panel(new BorderLayout(0, 18));
    private final JButton queueDrawer = button("Up next", "toggleQueue", "queue", false), historyDrawer = button("History", "toggleHistory", "back", false),
            addResult = button("Add to playlist", "addResult", "plus", false);
    private boolean sideOpen, showingHistory;
    private final Map<String, JButton> navigation = new HashMap<>();
    private final JList<Song> playlist = songList("playlist", false), queue = songList("queue", true),
            history = songList("history", true), results = songList("searchResults", false);
    private final JTextField query = field("searchQuery");
    private final JLabel nowTitle = label("Pick your first track", 14, TEXT), nowArtist = label("Chatpata Mix · TuneWave", 11, MUTED),
            position = label("Mahiya", 13, TEXT), source = label("READY", 10, GREEN),
            status = label("Demo mode · Double-click a track to play. Attach audio from its menu.", 11, MUTED),
            count = label("", 12, MUTED), searchCount = label("", 12, MUTED),
            direct = label("", 12, MUTED), recommended = label("", 13, GREEN),
            queueCount = label("0 tracks", 11, MUTED), historyCount = label("0 / 10", 11, MUTED),
            clock = label("DEMO  ·  0:00 / 0:30", 10, MUTED);
    private final JLabel nowCover = new JLabel(new Cover(48, "hero"));
    private final JComboBox<ArtistChoice> artistChoice = new JComboBox<>(), relationA = new JComboBox<>(), relationB = new JComboBox<>();
    private final JButton playPause = button("", "playPause", "play", true), repeat = button("", "repeat", "repeat", false),
            upTab = button("Up next", "upNextTab", null, false), historyTab = button("History", "historyTab", null, false);
    private final JProgressBar progress = new JProgressBar(0, 30);
    private final Timer timer = new Timer(250, e -> tick());
    private boolean exactSearch, refreshingArtists, playing, closed;
    private long startedNanos; private double elapsed; private Clip clip; private int audioGeneration;

    public TuneWavePanel() {
        super(new BorderLayout()); setBackground(BG);
        catalog.populate(player);
        add(sidebar(), BorderLayout.WEST);
        JPanel workspace = panel(new BorderLayout(16, 16)); workspace.setBorder(new EmptyBorder(20, 20, 16, 20));
        workspace.add(topbar(), BorderLayout.NORTH);
        pageHost.add(playlistPage(), "playlist");
        pageHost.add(discoverPage(), "discover");
        workspace.add(pageHost, BorderLayout.CENTER); workspace.add(queuePanel(), BorderLayout.EAST);
        add(workspace, BorderLayout.CENTER); add(playbackBar(), BorderLayout.SOUTH);
        nowTitle.setName("nowPlaying"); position.setName("playlistPosition"); source.setName("source"); status.setName("status");
        direct.setName("directArtists"); recommended.setName("recommendedArtists");
        refresh(); refreshSearch(); refreshArtists(); playlist.setSelectedIndex(0); showPage("playlist");
        getInputMap(WHEN_IN_FOCUSED_WINDOW).put(KeyStroke.getKeyStroke("control K"), "search");
        getInputMap(WHEN_IN_FOCUSED_WINDOW).put(KeyStroke.getKeyStroke("meta K"), "search");
        getActionMap().put("search", new AbstractAction() { @Override public void actionPerformed(java.awt.event.ActionEvent e) { query.requestFocusInWindow(); query.selectAll(); } });
        getInputMap(WHEN_IN_FOCUSED_WINDOW).put(KeyStroke.getKeyStroke("SPACE"), "transport");
        getActionMap().put("transport", new AbstractAction() { @Override public void actionPerformed(java.awt.event.ActionEvent e) {
            if (!(KeyboardFocusManager.getCurrentKeyboardFocusManager().getFocusOwner() instanceof javax.swing.text.JTextComponent)) togglePlay();
        } });
        query.getDocument().addDocumentListener(new DocumentListener() {
            private void changed() { exactSearch = false; refreshSearch(); showPage("playlist"); }
            @Override public void insertUpdate(DocumentEvent e) { changed(); }
            @Override public void removeUpdate(DocumentEvent e) { changed(); }
            @Override public void changedUpdate(DocumentEvent e) { changed(); }
        });
    }

    private JPanel sidebar() {
        JPanel side = new JPanel(new BorderLayout()); side.setBackground(SIDE); side.setPreferredSize(new Dimension(182, 0));
        side.setBorder(new EmptyBorder(30, 16, 22, 16));
        JPanel top = panel(new BorderLayout(0, 34)), brand = panel(new BorderLayout(8, 0));
        brand.add(new JLabel(new Glyph("wave", 24, GREEN)), BorderLayout.WEST); brand.add(label("tunewave", 19, TEXT)); top.add(brand, BorderLayout.NORTH);
        JPanel nav = panel(new GridLayout(2, 1, 0, 8));
        nav.add(nav("Your music", "playlist", "home")); nav.add(nav("Artists", "discover", "discover"));
        top.add(nav); side.add(top, BorderLayout.NORTH);
        JPanel bottom = panel(new BorderLayout(0, 18));
        JPanel mix = panel(new BorderLayout(10, 0)); mix.add(new JLabel(new Cover(38, "hero")), BorderLayout.WEST);
        mix.add(column(5, label("Chatpata Mix", 12, TEXT), label("Desi pop essentials", 10, MUTED))); bottom.add(mix, BorderLayout.NORTH);
        side.add(bottom, BorderLayout.SOUTH); return side;
    }

    private JButton nav(String title, String key, String icon) {
        JButton b = action(title, "nav-" + key, icon, false, () -> { if (key.equals("playlist") && !query.getText().isEmpty()) query.setText(""); showPage(key); });
        b.putClientProperty("quiet", true); b.setHorizontalAlignment(SwingConstants.LEFT); b.setBorder(new EmptyBorder(12, 11, 12, 7)); navigation.put(key, b); return b;
    }
    private JPanel topbar() {
        JPanel bar = panel(new BorderLayout(18, 0));
        JPanel search = card(FIELD, 24); search.setLayout(new BorderLayout());
        JLabel icon = new JLabel(new Glyph("search", 17, MUTED)); icon.setBorder(new EmptyBorder(0, 15, 0, 0));
        search.add(icon, BorderLayout.WEST); query.setOpaque(false);
        query.setToolTipText("Search all song titles · Ctrl+K"); query.getAccessibleContext().setAccessibleName("Search all song titles");
        query.putClientProperty("placeholder", "What do you want to play?  Try Mahiya, Billo, Bebo…");
        search.add(query); search.setPreferredSize(new Dimension(470, 43)); bar.add(search);
        bar.add(action("Add song", "openAddSong", "plus", false, this::showAddSong), BorderLayout.EAST); return bar;
    }

    private JPanel playlistPage() {
        JPanel p = card(SURFACE, 20); p.setLayout(new BorderLayout());
        JPanel top = panel(new BorderLayout());
        JPanel hero = new JPanel(new BorderLayout(26, 0)) {
            { setOpaque(false); }
            @Override protected void paintComponent(Graphics graphics) {
                Graphics2D g = smooth(graphics); g.setPaint(new GradientPaint(0, 0, new Color(66, 80, 43), getWidth(), getHeight(), SURFACE));
                g.fillRoundRect(0, 0, getWidth(), getHeight(), 20, 20); g.dispose(); super.paintComponent(graphics);
            }
        };
        hero.setBorder(new EmptyBorder(20, 26, 20, 26)); hero.add(new JLabel(new Cover(132, "hero")), BorderLayout.WEST);
        JPanel words = panel(new GridBagLayout()); GridBagConstraints c = new GridBagConstraints();
        c.gridx = 0; c.anchor = GridBagConstraints.WEST; c.weightx = 1; c.insets = new Insets(0, 0, 10, 0);
        c.gridy = 0; words.add(label("YOUR PLAYLIST", 10, GREEN), c);
        c.gridy++; words.add(label("Chatpata Mix", 44, TEXT), c);
        c.gridy++; words.add(label("Mahiya se Billo tak. Full volume.", 14, TEXT), c);
        c.gridy++; c.insets = new Insets(5, 0, 0, 0); words.add(count, c); hero.add(words);
        heroHolder.add(hero); top.add(heroHolder, BorderLayout.NORTH);
        JPanel tools = panel(new BorderLayout(0, 18)); tools.setBorder(new EmptyBorder(18, 25, 16, 25));
        searchTools.add(label("Find your next favourite", 28, TEXT), BorderLayout.NORTH);
        JPanel modes = row(8);
        modes.add(action("Starts with", "prefixSearch", null, true, () -> { exactSearch = false; refreshSearch(); }));
        modes.add(action("Exact title", "exactSearch", null, false, () -> {
            if (query.getText().isBlank()) throw new IllegalArgumentException("Type a song title in search first.");
            exactSearch = true; refreshSearch();
        }));
        modes.add(searchCount); searchTools.add(modes); tools.add(searchTools, BorderLayout.NORTH);
        JPanel toolbar = panel(new BorderLayout()), actions = row(8);
        actions.add(action("Play", "playSelected", "play", true, () -> playSelection()));
        actions.add(action("Queue", "queueSelected", "queue", false, () -> enqueue(selected(activeList()))));
        addResult.addActionListener(e -> guarded(() -> {
            boolean added = player.addToPlaylist(selected(results).songId()); refresh();
            message(added ? "Added to Chatpata Mix." : "Already in your playlist. No duplicate added.");
        })); actions.add(addResult);
        JButton more = action("", "playlistMore", "more", false, () -> { }); more.setToolTipText("Track actions: audio and removal");
        more.addActionListener(e -> trackMenu(activeList()).show(more, 0, more.getHeight())); actions.add(more);
        toolbar.add(actions, BorderLayout.WEST); tools.add(toolbar); top.add(tools); p.add(top, BorderLayout.NORTH);
        JPanel tracks = panel(new BorderLayout()); tracks.setBorder(new EmptyBorder(0, 18, 14, 18));
        JPanel heading = panel(new BorderLayout()); heading.setBorder(new EmptyBorder(0, 13, 11, 13));
        heading.add(label("#      TITLE / ARTIST", 10, MUTED)); heading.add(label("COLLECTION", 10, MUTED), BorderLayout.EAST); tracks.add(heading, BorderLayout.NORTH);
        trackHost.add(scroll(playlist), "playlist"); trackHost.add(scroll(results), "results"); tracks.add(trackHost); p.add(tracks); return p;
    }
    private JList<Song> activeList() { return query.getText().isBlank() ? playlist : results; }
    private void playSelection() {
        Song song = selected(activeList()); if (activeList() == results) player.addToPlaylist(song.songId());
        start(player.playSong(song.songId()));
    }
    private void updateMusicView() {
        boolean searching = !query.getText().isBlank(); heroHolder.setVisible(!searching); searchTools.setVisible(searching); addResult.setVisible(searching);
        trackPages.show(trackHost, searching ? "results" : "playlist"); pageHost.revalidate(); pageHost.repaint();
    }

    private JPanel discoverPage() {
        JPanel p = card(SURFACE, 20); p.setLayout(new BorderLayout(0, 24)); p.setBorder(new EmptyBorder(28, 24, 22, 24));
        JPanel top = panel(new BorderLayout(0, 18));
        top.add(column(12, label("Find your next favourite artist.", 29, TEXT), label("A little familiar. A little unexpected.", 13, MUTED)), BorderLayout.NORTH);
        artistChoice.setName("artistChoice"); combo(artistChoice); top.add(artistChoice);
        artistChoice.addActionListener(e -> { if (!refreshingArtists) refreshRecommendations(); });
        p.add(top, BorderLayout.NORTH);
        JPanel cards = panel(new BorderLayout(0, 14)); cards.add(recommended, BorderLayout.NORTH);
        
        JPanel cardWrap = panel(new BorderLayout()); cardWrap.add(recommendations, BorderLayout.NORTH); cards.add(scroll(cardWrap)); p.add(cards);
        JPanel footer = panel(new BorderLayout(0, 14));
        footer.add(action("Connect artists", "openRelations", "plus", false, this::showRelations), BorderLayout.NORTH);
        footer.add(label("Demo connections · two links away · alphabetical recommendations", 10, MUTED), BorderLayout.SOUTH); p.add(footer, BorderLayout.SOUTH); return p;
    }
    private JPanel queuePanel() {
        right.setName("listeningDrawer"); right.setLayout(new BorderLayout(0, 16)); right.setPreferredSize(new Dimension(262, 0)); right.setBorder(new EmptyBorder(20, 16, 18, 16));
        JPanel tabs = panel(new GridLayout(1, 2, 6, 0));
        upTab.setBorder(new EmptyBorder(10, 7, 10, 7)); historyTab.setBorder(new EmptyBorder(10, 7, 10, 7));
        upTab.addActionListener(e -> showSide(false)); historyTab.addActionListener(e -> showSide(true)); tabs.add(upTab); tabs.add(historyTab); JPanel heading = panel(new BorderLayout(0, 14)), title = panel(new BorderLayout());
        title.add(label("Your listening", 16, TEXT));
        title.add(action("", "closeQueue", "close", false, () -> { sideOpen = false; updateDrawer(); }), BorderLayout.EAST);
        heading.add(title, BorderLayout.NORTH); heading.add(tabs); right.add(heading, BorderLayout.NORTH);
        JPanel q = panel(new BorderLayout(0, 13)); q.add(queueCount, BorderLayout.NORTH); q.add(listWithEmpty(queue, "Your next favourites go here.", "Use Queue on any track."));
        JPanel h = panel(new BorderLayout(0, 13)); h.add(historyCount, BorderLayout.NORTH); h.add(listWithEmpty(history, "A little history in the making.", "Played tracks appear here."));
        h.add(action("Replay top", "back", "back", false, () -> start(player.back())), BorderLayout.SOUTH);
        sideHost.add(q, "queue"); sideHost.add(h, "history"); right.add(sideHost);
        JPanel cursor = card(FIELD, 14); cursor.setLayout(new BorderLayout(0, 10)); cursor.setBorder(new EmptyBorder(16, 14, 16, 14));
        cursor.add(label("PLAYLIST POSITION", 9, MUTED), BorderLayout.NORTH); cursor.add(position);
        cursor.add(label("Up next keeps your place.", 10, MUTED), BorderLayout.SOUTH); right.add(cursor, BorderLayout.SOUTH); showSide(false); return right;
    }
    private JPanel listWithEmpty(JList<Song> list, String a, String b) {
        JPanel p = panel(new BorderLayout());
        JPanel hint = column(8, label(a, 10, MUTED), label(b, 10, MUTED)); hint.setBorder(new EmptyBorder(24, 0, 18, 0));
        p.add(hint, BorderLayout.NORTH); p.add(scroll(list));
        list.addPropertyChangeListener("model", e -> hint.setVisible(list.getModel().getSize() == 0)); return p;
    }
    private JPanel playbackBar() {
        JPanel outer = new JPanel(new BorderLayout()); outer.setBackground(SIDE); outer.setBorder(BorderFactory.createMatteBorder(1, 0, 0, 0, LINE));
        JPanel bar = panel(new BorderLayout(22, 0)); bar.setBorder(new EmptyBorder(15, 23, 11, 23));
        JPanel metadata = panel(new BorderLayout(12, 0)); metadata.setPreferredSize(new Dimension(285, 56)); metadata.add(nowCover, BorderLayout.WEST);
        metadata.add(column(5, nowTitle, nowArtist, source)); bar.add(metadata, BorderLayout.WEST);
        JPanel controls = panel(new BorderLayout(0, 10)), buttons = panel(new FlowLayout(FlowLayout.CENTER, 10, 0));
        JButton previous = action("", "previous", "previous", false, () -> start(player.previous())); previous.setToolTipText("Previous playlist track"); buttons.add(previous);
        playPause.setToolTipText("Play / pause"); playPause.addActionListener(e -> togglePlay()); buttons.add(playPause);
        JButton next = action("", "playNext", "next", false, () -> start(player.playNext())); next.setToolTipText("Play next · queue first"); buttons.add(next);
        repeat.setToolTipText("Repeat: off"); repeat.addActionListener(e -> { player.toggleRepeat(); refresh(); message(player.isRepeatEnabled() ? "Repeat on." : "Repeat off."); }); buttons.add(repeat);
        controls.add(buttons, BorderLayout.NORTH);
        progress.setBorderPainted(false); progress.setForeground(GREEN); progress.setBackground(LINE); progress.setPreferredSize(new Dimension(260, 3)); controls.add(progress, BorderLayout.SOUTH); bar.add(controls);
        JPanel rightControls = panel(new BorderLayout(0, 8)); rightControls.setPreferredSize(new Dimension(245, 54));
        clock.setHorizontalAlignment(SwingConstants.RIGHT); rightControls.add(clock, BorderLayout.NORTH);
        JPanel drawers = panel(new GridLayout(1, 2, 7, 0));
        queueDrawer.setBorder(new EmptyBorder(10, 9, 10, 9)); historyDrawer.setBorder(new EmptyBorder(10, 9, 10, 9));
        queueDrawer.addActionListener(e -> toggleDrawer(false)); historyDrawer.addActionListener(e -> toggleDrawer(true));
        drawers.add(queueDrawer); drawers.add(historyDrawer); rightControls.add(drawers); bar.add(rightControls, BorderLayout.EAST);
        outer.add(bar); outer.add(inset(status, 0, 23, 9, 23), BorderLayout.SOUTH); return outer;
    }

    private JList<Song> songList(String name, boolean compact) {
        JList<Song> list = new JList<>(); list.setName(name); list.setOpaque(false); list.setBackground(SURFACE);
        list.setSelectionMode(ListSelectionModel.SINGLE_SELECTION); list.setFixedCellHeight(compact ? 65 : 58);
        list.setCellRenderer((target, song, index, selected, focus) -> new TrackCell(song, index, selected, compact));
        list.addMouseListener(new MouseAdapter() {
            @Override public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() == 2 && !compact && list.getSelectedValue() != null) {
                    Song s = list.getSelectedValue();
                    if (name.equals("searchResults")) player.addToPlaylist(s.songId());
                    start(player.playSong(s.songId()));
                }
            }
            @Override public void mousePressed(MouseEvent e) { popup(e); }
            @Override public void mouseReleased(MouseEvent e) { popup(e); }
            private void popup(MouseEvent e) {
                if (!compact && e.isPopupTrigger()) {
                    int i = list.locationToIndex(e.getPoint());
                    if (i >= 0 && list.getCellBounds(i, i).contains(e.getPoint())) { list.setSelectedIndex(i); trackMenu(list).show(list, e.getX(), e.getY()); }
                }
            }
        }); return list;
    }
    private final class TrackCell extends JComponent {
        private final Song song; private final int index; private final boolean selected, compact;
        TrackCell(Song song, int index, boolean selected, boolean compact) { this.song = song; this.index = index; this.selected = selected; this.compact = compact; }
        @Override protected void paintComponent(Graphics graphics) {
            Graphics2D g = smooth(graphics); int w = getWidth();
            if (selected) { g.setColor(SELECT); g.fillRoundRect(0, 1, w, getHeight() - 2, 12, 12); }
            boolean current = player.nowPlaying().map(s -> s.songId().equals(song.songId())).orElse(false);
            int artX = compact ? 1 : 36, textX = compact ? 50 : 92;
            if (!compact) { g.setFont(font(11, false)); g.setColor(current ? GREEN : MUTED); g.drawString(current ? "▶" : String.format("%02d", index + 1), 11, 35); }
            new Cover(compact ? 38 : 42, song.songId()).paintIcon(this, g, artX, 11);
            int rightSpace = !compact && w > 470 ? 160 : 12;
            g.setFont(font(compact ? 12 : 13, true)); g.setColor(current ? GREEN : TEXT); g.drawString(fit(g, song.title(), w - textX - rightSpace), textX, 27);
            g.setFont(font(compact ? 10 : 11, false)); g.setColor(MUTED); g.drawString(fit(g, catalog.details(song, player).credits(), w - textX - rightSpace), textX, 44);
            if (!compact && w > 470) {
                String mood = catalog.details(song, player).collection(); g.setColor(current ? GREEN : MUTED); g.setFont(font(10, false)); g.drawString(fit(g, mood, 130), w - 145, 34);
            }
            g.dispose();
        }
    }
    JPopupMenu trackMenu(JList<Song> list) {
        JPopupMenu menu = new JPopupMenu(); menu.setBackground(FIELD);
        menuItem(menu, "Add to Up next", "queueMenu", () -> enqueue(selected(list)));
        menuItem(menu, "Attach WAV audio…", "attachAudio", () -> chooseAudio(selected(list)));
        if (list == playlist) menuItem(menu, "Remove from playlist", "removeSong", this::removeSelected);
        else menuItem(menu, "Add to playlist", "addMenu", () -> { player.addToPlaylist(selected(list).songId()); refresh(); });
        return menu;
    }
    private void menuItem(JPopupMenu menu, String title, String name, Runnable run) {
        JMenuItem item = new JMenuItem(title); item.setName(name); item.setBackground(FIELD); item.setForeground(TEXT); item.setFont(font(12, false));
        item.setBorder(new EmptyBorder(10, 14, 10, 14)); item.addActionListener(e -> guarded(run)); menu.add(item);
    }
    void removeSelected() { Song song = selected(playlist); player.removeSong(song.songId()); refresh(); message("Removed " + song.title() + " from the playlist. It is still in your library."); }
    JPanel createSongForm(Runnable done) {
        JPanel form = new JPanel(new BorderLayout(0, 18)); form.setBackground(SURFACE); form.setBorder(new EmptyBorder(24, 24, 24, 24));
        JTextField title = field("songTitle"), artist = field("songArtist");
        form.add(column(12, label("A little more tarka?", 25, TEXT), label("Add a title and artist. TuneWave handles the ID.", 12, MUTED)), BorderLayout.NORTH);
        JPanel inputs = panel(new GridLayout(4, 1, 0, 8)); inputs.add(label("Song title", 12, TEXT)); inputs.add(title); inputs.add(label("Artist", 12, TEXT)); inputs.add(artist); form.add(inputs);
        JLabel error = label(" ", 11, ORANGE); JPanel bottom = panel(new BorderLayout(0, 10)); bottom.add(error, BorderLayout.NORTH);
        JButton add = button("Add to playlist", "addSong", "plus", true); add.addActionListener(e -> {
            try { addLocalSong(title.getText(), artist.getText()); done.run(); }
            catch (IllegalArgumentException ex) { error.setText(ex.getMessage()); }
        }); bottom.add(add); form.add(bottom, BorderLayout.SOUTH); form.setPreferredSize(new Dimension(430, 345)); return form;
    }
    private void showAddSong() {
        JDialog dialog = dialog("Add a song"); dialog.setContentPane(createSongForm(dialog::dispose)); showDialog(dialog);
    }
    void addLocalSong(String title, String artist) {
        Song song = local.createSong(title, artist);
        String id = player.artistIds().stream().filter(a -> player.artistName(a).equalsIgnoreCase(artist.strip())).findFirst().orElse(song.artistId());
        song = new Song(song.songId(), song.title(), id); player.addSong(song); player.registerArtist(id, artist.strip());
        refresh(); refreshArtists(); query.setText(""); refreshSearch(); showPage("playlist"); playlist.setSelectedValue(song, true); message("Added " + song.title() + ". Song ID assigned automatically.");
    }
    JPanel createRelationForm() {
        JPanel form = new JPanel(new BorderLayout(0, 16)); form.setBackground(SURFACE); form.setBorder(new EmptyBorder(24, 24, 24, 24));
        relationA.setName("relationA"); relationB.setName("relationB"); combo(relationA); combo(relationB); refreshArtists();
        form.add(column(10, label("Connect the dots.", 25, TEXT), label("Create a related-artist link in both directions.", 12, MUTED)), BorderLayout.NORTH);
        form.add(column(8, label("Artist", 12, MUTED), relationA, label("Related to", 12, MUTED), relationB));
        JLabel feedback = label(" ", 11, MUTED); JPanel bottom = panel(new BorderLayout(0, 10));
        bottom.add(action("Add relation", "addRelation", "plus", true, () -> {
            ArtistChoice a = (ArtistChoice) relationA.getSelectedItem(), b = (ArtistChoice) relationB.getSelectedItem();
            if (a == null || b == null) { feedback.setText("Choose two artists."); return; }
            try {
                boolean added = player.addRelation(a.id(), b.id()); refreshRecommendations();
                feedback.setText(added ? "Connected. Recommendations updated." : "Already connected.");
            } catch (IllegalArgumentException error) { feedback.setText(error.getMessage()); }
        })); bottom.add(feedback, BorderLayout.SOUTH); form.add(bottom, BorderLayout.SOUTH); form.setPreferredSize(new Dimension(450, 360)); return form;
    }
    private void showRelations() { JDialog d = dialog("Related artists"); d.setContentPane(createRelationForm()); showDialog(d); }
    private JDialog dialog(String title) { return new JDialog(SwingUtilities.getWindowAncestor(this), title, Dialog.ModalityType.APPLICATION_MODAL); }
    private void showDialog(JDialog d) {
        d.getRootPane().registerKeyboardAction(e -> d.dispose(), KeyStroke.getKeyStroke("ESCAPE"), JComponent.WHEN_IN_FOCUSED_WINDOW);
        d.pack(); d.setResizable(false); d.setLocationRelativeTo(this); d.setVisible(true); }
    private void showPage(String key) {
        pages.show(pageHost, key); updateDrawer();
        navigation.forEach((k, b) -> { b.putClientProperty("active", k.equals(key)); b.setForeground(k.equals(key) ? GREEN : TEXT); b.repaint(); });
        query.setToolTipText("Search all songs · try Ma, Billo, or Bebo"); revalidate(); repaint();
    }
    private void showSide(boolean past) {
        showingHistory = past; sideCards.show(sideHost, past ? "history" : "queue"); upTab.putClientProperty("active", !past); historyTab.putClientProperty("active", past);
        upTab.setForeground(past ? MUTED : GREEN); historyTab.setForeground(past ? GREEN : MUTED); upTab.repaint(); historyTab.repaint();
    }
    private void toggleDrawer(boolean history) {
        if (sideOpen && showingHistory == history) sideOpen = false;
        else { sideOpen = true; showSide(history); }
        updateDrawer();
    }
    private void updateDrawer() {
        right.setVisible(sideOpen);
        ((GridLayout) recommendations.getLayout()).setColumns(sideOpen ? 1 : 2);
        queueDrawer.putClientProperty("active", sideOpen && !showingHistory);
        historyDrawer.putClientProperty("active", sideOpen && showingHistory);
        revalidate(); repaint();
    }
    private JButton action(String title, String name, String icon, boolean primary, Runnable task) {
        JButton b = button(title, name, icon, primary); b.addActionListener(e -> guarded(task)); return b;
    }
    private void guarded(Runnable action) { try { action.run(); } catch (IllegalArgumentException e) { message(e.getMessage()); } }
    private void message(String text) { status.setText(text); status.setToolTipText(text); }
    private static Song selected(JList<Song> list) {
        Song s = list.getSelectedValue(); if (s == null) throw new IllegalArgumentException("Select a track first."); return s;
    }
    private static void fill(JList<Song> list, List<Song> songs) {
        Song selection = list.getSelectedValue(); list.setListData(songs.toArray(Song[]::new));
        if (selection != null) list.setSelectedValue(selection, false);
    }
    private void refresh() {
        fill(playlist, player.playlistSongs()); fill(queue, player.upNextSongs()); fill(history, player.historySongs());
        count.setText("TuneWave   ·   " + player.playlistSongs().size() + " songs   ·   Pakistani pop & throwbacks");
        queueDrawer.setText("Up next · " + player.upNextSongs().size());
        queueCount.setText(queue.getModel().getSize() + " tracks · first in, first played");
        historyCount.setText(history.getModel().getSize() + " / 10 recent plays · newest first");
        position.setText(player.playlistPosition().map(Song::title).orElse("No playlist tracks"));
        player.nowPlaying().ifPresent(s -> {
            nowTitle.setText(s.title()); nowArtist.setText(catalog.details(s, player).credits()); nowArtist.setToolTipText(nowArtist.getText()); nowCover.setIcon(new Cover(48, s.songId()));
        });
        source.setText(switch (player.playbackSource()) { case NONE -> "READY"; case PLAYLIST -> "FROM YOUR PLAYLIST"; case UP_NEXT -> "FROM UP NEXT"; case HISTORY -> "FROM HISTORY"; });
        repeat.putClientProperty("active", player.isRepeatEnabled()); repeat.setIcon(new Glyph("repeat", 16, player.isRepeatEnabled() ? GREEN : TEXT));
        repeat.setToolTipText("Repeat playlist: " + (player.isRepeatEnabled() ? "on" : "off")); repeat.getAccessibleContext().setAccessibleName("Repeat " + (player.isRepeatEnabled() ? "on" : "off")); repeat.repaint(); playlist.repaint();
    }
    private void refreshSearch() {
        List<Song> found = exactSearch ? player.findSong(query.getText()) : player.prefixSearch(query.getText()); fill(results, found); updateMusicView();
        searchCount.setText(found.size() + " tracks · " + (exactSearch ? "exact" : "A–Z"));
    }
    private void refreshArtists() {
        refreshingArtists = true;
        for (JComboBox<ArtistChoice> box : List.of(artistChoice, relationA, relationB)) {
            ArtistChoice old = (ArtistChoice) box.getSelectedItem(); box.removeAllItems();
            for (String id : player.artistIds()) { ArtistChoice choice = new ArtistChoice(id, player.artistName(id)); box.addItem(choice); if (old != null && old.id().equals(id)) box.setSelectedItem(choice); }
        }
        if (artistChoice.getSelectedItem() != null && !Boolean.TRUE.equals(artistChoice.getClientProperty("initialized"))) {
            for (int i = 0; i < artistChoice.getItemCount(); i++) if (artistChoice.getItemAt(i).name().equals("Annie Khalid")) artistChoice.setSelectedIndex(i);
            artistChoice.putClientProperty("initialized", true);
        }
        refreshingArtists = false; refreshRecommendations();
    }
    private void refreshRecommendations() {
        ArtistChoice a = (ArtistChoice) artistChoice.getSelectedItem(); if (a == null) return;
        List<String> ids = player.recommendArtists(a.id()); direct.setText("Already connected: " + names(player.relatedArtists(a.id()))); direct.setToolTipText(direct.getText()); artistChoice.setToolTipText(direct.getText());
        recommended.setText("YOU MIGHT LIKE  ·  " + ids.size() + " ARTISTS"); recommendations.removeAll();
        if (ids.isEmpty()) recommendations.add(label("No new two-link connections yet. Add a relation below.", 12, MUTED));
        for (String id : ids) {
            JPanel card = card(FIELD, 16); card.setLayout(new BorderLayout(16, 0)); card.setBorder(new EmptyBorder(17, 17, 17, 17));
            card.add(new JLabel(new Cover(54, id)), BorderLayout.WEST);
            String via = names(player.relatedArtists(a.id()).stream().filter(mid -> player.relatedArtists(mid).contains(id)).toList());
            JLabel name = label(player.artistName(id), 17, TEXT); name.setName("recommended-" + id);
            JLabel path = label("Through " + via, 11, MUTED); path.setToolTipText(path.getText());
            card.add(column(8, name, path));
            card.add(label("02 LINKS", 9, GREEN), BorderLayout.EAST); recommendations.add(card);
        }
        // Accessible text summary supplements the visual artist cards.
        recommendations.getAccessibleContext().setAccessibleDescription(names(ids));
        recommendations.revalidate(); recommendations.repaint();
    }
    private String names(List<String> ids) { return ids.isEmpty() ? "None yet" : String.join(", ", ids.stream().map(player::artistName).toList()); }
    private void enqueue(Song s) { player.addToUpNext(s.songId()); refresh(); message("Queued " + s.title() + ". Playlist position stays on " + player.playlistPosition().map(Song::title).orElse("none") + "."); }

    private void start(TuneWavePlayer.Playback result) {
        if (!result.status().equals("ok")) {
            message(switch (result.status()) { case "end" -> "End of playlist. Turn repeat on to wrap to the first track."; case "start" -> "You are at the first playlist track."; case "missing" -> "Add this track to the playlist first."; default -> "There is no track to play here yet."; });
            if (result.status().equals("end") || result.status().equals("empty")) pause(); refresh(); return;
        }
        stopAudio(); elapsed = 0; playing = true; startedNanos = System.nanoTime(); timer.start();
        refresh(); updateTransport(); progress.setValue(0); clock.setText("DEMO  ·  0:00 / 0:30"); File file = audioFiles.get(result.song().songId());
        if (file != null) loadAudio(file); else message("Playing " + result.song().title() + " · Silent demo. Attach a local WAV from the track menu for audio.");
    }
    private void togglePlay() {
        if (player.nowPlaying().isEmpty()) { start(player.playNext()); return; }
        if (playing) pause(); else {
            if (clip == null && elapsed >= 30) elapsed = 0;
            playing = true; startedNanos = System.nanoTime(); if (clip != null) {
                if (clip.getMicrosecondPosition() >= clip.getMicrosecondLength()) { clip.setMicrosecondPosition(0); elapsed = 0; }
                clip.start();
            }
            timer.start(); updateTransport();
        }
    }
    private void pause() {
        if (playing) elapsed += (System.nanoTime() - startedNanos) / 1_000_000_000.0;
        playing = false; timer.stop(); if (clip != null) clip.stop(); updateTransport();
    }
    private void updateTransport() { playPause.setIcon(new Glyph(playing ? "pause" : "play", 16, BG)); playPause.setToolTipText(playing ? "Pause" : "Play"); playPause.getAccessibleContext().setAccessibleName(playing ? "Pause" : "Play"); }
    private void tick() {
        double seconds = clip == null ? elapsed + (System.nanoTime() - startedNanos) / 1_000_000_000.0 : clip.getMicrosecondPosition() / 1_000_000.0;
        double length = clip == null ? 30 : clip.getMicrosecondLength() / 1_000_000.0;
        progress.setMaximum((int) Math.max(1, length * 100)); progress.setValue((int) Math.min(length * 100, seconds * 100));
        clock.setText((clip == null ? "DEMO" : "LOCAL AUDIO") + "  ·  " + time(seconds) + " / " + time(length));
        if (seconds >= length && length > 0) { start(player.playNext()); }
    }
    private static String time(double seconds) { int s = Math.max(0, (int) seconds); return s / 60 + ":" + String.format("%02d", s % 60); }
    private void chooseAudio(Song song) {
        JFileChooser chooser = new JFileChooser(); chooser.setDialogTitle("Attach audio to " + song.title());
        chooser.setFileFilter(new FileNameExtensionFilter("Java Sound audio (*.wav, *.aiff, *.au)", "wav", "aiff", "aif", "au"));
        if (chooser.showOpenDialog(this) != JFileChooser.APPROVE_OPTION) return;
        File file = chooser.getSelectedFile(); audioFiles.put(song.songId(), file);
        message("Attached " + file.getName() + " to " + song.title() + ".");
        if (player.nowPlaying().map(s -> s.songId().equals(song.songId())).orElse(false)) { stopAudio(); elapsed = 0; startedNanos = System.nanoTime(); loadAudio(file); }
    }
    private void loadAudio(File file) {
        int generation = audioGeneration; timer.stop(); message("Loading local audio…");
        new SwingWorker<Clip, Void>() {
            @Override protected Clip doInBackground() throws Exception {
                Clip loaded = AudioSystem.getClip();
                try (AudioInputStream input = AudioSystem.getAudioInputStream(file)) { loaded.open(input); return loaded; }
                catch (Exception e) { loaded.close(); throw e; }
            }
            @Override protected void done() {
                try {
                    Clip loaded = get();
                    if (closed || generation != audioGeneration) { loaded.close(); return; }
                    clip = loaded; elapsed = 0; startedNanos = System.nanoTime(); if (playing) { clip.start(); timer.start(); }
                    message("Local audio · " + file.getName());
                } catch (Exception e) {
                    if (closed || generation != audioGeneration) return;
                    elapsed = 0; startedNanos = System.nanoTime(); if (playing) timer.start();
                    message("Audio could not open. Use PCM WAV, AIFF, or AU and check your audio device. Silent demo remains available.");
                }
            }
        }.execute();
    }
    private void stopAudio() { audioGeneration++; if (clip != null) { clip.stop(); clip.close(); clip = null; } }
    @Override public void close() { closed = true; timer.stop(); stopAudio(); }
    TuneWavePlayer core() { return player; }
}
