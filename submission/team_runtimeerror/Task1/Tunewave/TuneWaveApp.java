import javax.swing.BorderFactory;
import javax.swing.DefaultListModel;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JList;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridLayout;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class TuneWaveApp {

    // =========================================================================
    // BACKEND (Milestones 1, 2 and 3 in one class)
    // =========================================================================
    public static class Song {
        public String id;
        public String title;
        public String artist;

        public Song(String id, String title, String artist) {
            this.id = id;
            this.title = title;
            this.artist = artist;
        }
    }

    public static class SongNode {
        public String songId;
        public String title;
        public String artist;
        public SongNode prev;
        public SongNode next;

        public SongNode(String songId, String title, String artist) {
            this.songId = songId;
            this.title = title;
            this.artist = artist;
        }

        @Override
        public String toString() {
            return title + " by " + artist + " (" + songId + ")";
        }
    }

    public static class BSTNode {
        public String title;
        public String songId;
        public BSTNode left;
        public BSTNode right;

        public BSTNode(String title, String songId) {
            this.title = title;
            this.songId = songId;
        }
    }

    // Playlist state
    private SongNode head = null;
    private SongNode tail = null;
    private SongNode playlistCurrent = null;      // position in the main playlist
    private boolean playlistCurrentPlayed = false; // has that song already played?
    private SongNode activeTrack = null;          // what is playing right now
    private final Map<String, SongNode> songMap = new HashMap<>();
    private boolean isRepeatOn = false;

    // Up Next queue and history (last 10 songs)
    private static final int MAX_HISTORY = 10;
    private String[] upNextQueue = new String[10];
    private int queueSize = 0;
    private final SongNode[] historyStack = new SongNode[MAX_HISTORY];
    private int historyTail = 0;
    private int historySize = 0;

    // Search tree and artist graph
    private BSTNode bstRoot = null;
    private final Map<String, Set<String>> artistGraph = new HashMap<>();

    public boolean addSongToPlaylist(Song song) {
        if (song == null || song.id == null || song.title == null || songMap.containsKey(song.id)) {
            return false;
        }
        SongNode newNode = new SongNode(song.id, song.title, song.artist);
        songMap.put(song.id, newNode);
        insertIntoBST(song.title, song.id);

        if (head == null) {
            head = newNode;
            tail = newNode;
            playlistCurrent = newNode;
            if (activeTrack == null) {
                activeTrack = newNode;
                playlistCurrentPlayed = true;
            }
        } else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
        return true;
    }

    public boolean removeSongFromPlaylist(String songId) {
        SongNode target = songMap.get(songId);
        if (target == null) {
            return false;
        }

        if (playlistCurrent == target) {
            if (target.next != null) {
                playlistCurrent = target.next;
                playlistCurrentPlayed = false;
            } else if (isRepeatOn && head != target) {
                playlistCurrent = head;
                playlistCurrentPlayed = false;
            } else {
                playlistCurrent = target.prev;
                playlistCurrentPlayed = true;
            }
        }
        if (activeTrack == target) {
            activeTrack = null;
        }

        if (target.prev != null) {
            target.prev.next = target.next;
        } else {
            head = target.next;
        }
        if (target.next != null) {
            target.next.prev = target.prev;
        } else {
            tail = target.prev;
        }
        songMap.remove(songId);

        for (int i = 0; i < MAX_HISTORY; i++) {
            if (historyStack[i] == target) {
                historyStack[i] = null;
            }
        }
        rebuildSearchTree(); // so removed songs disappear from search
        return true;
    }

    public boolean toggleRepeat() {
        isRepeatOn = !isRepeatOn;
        return isRepeatOn;
    }

    public boolean addToUpNext(String songId) {
        if (!songMap.containsKey(songId)) {
            return false;
        }
        if (queueSize == upNextQueue.length) {
            upNextQueue = Arrays.copyOf(upNextQueue, upNextQueue.length * 2);
        }
        upNextQueue[queueSize++] = songId;
        return true;
    }

    /** Skip forward. Up Next songs play first, then the playlist continues. */
    public Object playNext() {
        if (activeTrack != null) {
            historyStack[historyTail] = activeTrack;
            historyTail = (historyTail + 1) % MAX_HISTORY;
            if (historySize < MAX_HISTORY) {
                historySize++;
            }
        }

        while (queueSize > 0) {
            String nextId = upNextQueue[0];
            System.arraycopy(upNextQueue, 1, upNextQueue, 0, queueSize - 1);
            queueSize--;
            upNextQueue[queueSize] = null;
            SongNode queued = songMap.get(nextId);
            if (queued != null) {
                activeTrack = queued;
                return activeTrack;
            }
        }

        if (playlistCurrent == null) {
            activeTrack = null;
            return "end";
        }

        if (!playlistCurrentPlayed) {
            activeTrack = playlistCurrent;
            playlistCurrentPlayed = true;
        } else if (playlistCurrent.next != null) {
            playlistCurrent = playlistCurrent.next;
            activeTrack = playlistCurrent;
        } else if (isRepeatOn && head != null) {
            playlistCurrent = head;
            activeTrack = playlistCurrent;
        } else {
            activeTrack = null;
            return "end";
        }
        return activeTrack;
    }

    /** Go back to the previously played song. */
    public Object back() {
        while (historySize > 0) {
            historyTail = (historyTail - 1 + MAX_HISTORY) % MAX_HISTORY;
            SongNode node = historyStack[historyTail];
            historyStack[historyTail] = null;
            historySize--;
            if (node != null) {
                activeTrack = node;
                return activeTrack;
            }
        }
        return "end";
    }

    private void insertIntoBST(String title, String songId) {
        BSTNode newNode = new BSTNode(title, songId);
        if (bstRoot == null) {
            bstRoot = newNode;
            return;
        }
        BSTNode curr = bstRoot;
        while (true) {
            if (title.compareTo(curr.title) < 0) {
                if (curr.left == null) {
                    curr.left = newNode;
                    break;
                }
                curr = curr.left;
            } else {
                if (curr.right == null) {
                    curr.right = newNode;
                    break;
                }
                curr = curr.right;
            }
        }
    }

    private void rebuildSearchTree() {
        bstRoot = null;
        for (SongNode n = head; n != null; n = n.next) {
            insertIntoBST(n.title, n.songId);
        }
    }

    public String findSong(String title) {
        BSTNode curr = bstRoot;
        while (curr != null && title != null) {
            if (curr.title.equals(title)) {
                return curr.songId;
            }
            curr = (title.compareTo(curr.title) < 0) ? curr.left : curr.right;
        }
        return null;
    }

    public List<String> prefixSearch(String prefix) {
        List<String> res = new ArrayList<>();
        if (prefix == null || prefix.isEmpty()) {
            return res;
        }
        collectPrefix(bstRoot, prefix, res);
        Collections.sort(res);
        return res;
    }

    private void collectPrefix(BSTNode node, String prefix, List<String> res) {
        if (node == null) {
            return;
        }
        if (node.title.startsWith(prefix)) {
            res.add(node.title);
            collectPrefix(node.left, prefix, res);
            collectPrefix(node.right, prefix, res);
        } else if (prefix.compareTo(node.title) < 0) {
            collectPrefix(node.left, prefix, res);
        } else {
            collectPrefix(node.right, prefix, res);
        }
    }

    public void addRelation(String artistA, String artistB) {
        if (artistA == null || artistB == null || artistA.equals(artistB)) {
            return;
        }
        artistGraph.putIfAbsent(artistA, new HashSet<>());
        artistGraph.putIfAbsent(artistB, new HashSet<>());
        artistGraph.get(artistA).add(artistB);
        artistGraph.get(artistB).add(artistA);
    }

    public List<String> recommendArtists(String artist) {
        if (artist == null || !artistGraph.containsKey(artist)) {
            return new ArrayList<>();
        }
        Set<String> direct = artistGraph.get(artist);
        Set<String> recs = new HashSet<>();
        for (String neighbor : direct) {
            Set<String> distant = artistGraph.get(neighbor);
            if (distant == null) {
                continue;
            }
            for (String p : distant) {
                if (!p.equals(artist) && !direct.contains(p)) {
                    recs.add(p);
                }
            }
        }
        List<String> sorted = new ArrayList<>(recs);
        Collections.sort(sorted);
        return sorted;
    }

    // =========================================================================
    // WINDOW (frontend)
    // =========================================================================
    private JFrame frame;
    private JLabel lblActivePlaying;
    private JLabel lblLoopText;
    private JLabel lblStatus;

    private DefaultListModel<String> modelPlaylist;
    private DefaultListModel<String> modelQueue;
    private DefaultListModel<String> modelHistory;
    private DefaultListModel<String> modelDiscovery;
    private JList<String> listPlaylist;
    private final List<String> playlistIds = new ArrayList<>(); // song id for each playlist row

    private JTextField txtInId, txtInTitle, txtInArtist;
    private JTextField txtSearchIn, txtArtistRecIn;

    public TuneWaveApp() {
        seedSampleData();
        setupLayoutWindows();
        refreshInterfaceDataDisplay();
    }

    private void seedSampleData() {
        addSongToPlaylist(new Song("T1", "Blinding Lights", "The Weeknd"));
        addSongToPlaylist(new Song("T2", "Stay", "Kid LAROI"));
        addSongToPlaylist(new Song("T3", "Circles", "Post Malone"));
        addSongToPlaylist(new Song("T4", "Bad Habits", "Ed Sheeran"));

        addRelation("The Weeknd", "Ed Sheeran");
        addRelation("Ed Sheeran", "Taylor Swift");
        addRelation("Ed Sheeran", "Justin Bieber");
    }

    private JComponent titled(JComponent c, String title) {
        c.setBorder(BorderFactory.createTitledBorder(title));
        return c;
    }

    private void setupLayoutWindows() {
        frame = new JFrame("TuneWave - Music Player Console");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setLayout(new BorderLayout(8, 8));

        // ----- Top: now playing and repeat state -----
        lblActivePlaying = new JLabel("Now playing: nothing");
        lblActivePlaying.setFont(new Font("SansSerif", Font.BOLD, 18));
        lblLoopText = new JLabel("Repeat: OFF");
        JPanel top = new JPanel(new GridLayout(2, 1));
        top.setBorder(BorderFactory.createEmptyBorder(8, 12, 0, 12));
        top.add(lblActivePlaying);
        top.add(lblLoopText);
        frame.add(top, BorderLayout.NORTH);

        // ----- Center: playlist, Up Next, history -----
        modelPlaylist = new DefaultListModel<>();
        modelQueue = new DefaultListModel<>();
        modelHistory = new DefaultListModel<>();
        modelDiscovery = new DefaultListModel<>();
        listPlaylist = new JList<>(modelPlaylist);

        JPanel lists = new JPanel(new GridLayout(1, 3, 8, 8));
        lists.add(titled(new JScrollPane(listPlaylist), "Playlist (> = playing)"));
        lists.add(titled(new JScrollPane(new JList<>(modelQueue)), "Up Next"));
        lists.add(titled(new JScrollPane(new JList<>(modelHistory)), "History (last 10)"));
        frame.add(lists, BorderLayout.CENTER);

        // ----- Right: search and recommendations -----
        txtSearchIn = new JTextField();
        txtArtistRecIn = new JTextField();
        JButton btnSearch = new JButton("Search song titles");
        JButton btnRecommend = new JButton("Recommend artists");

        JPanel inputs = new JPanel(new GridLayout(0, 1, 4, 4));
        inputs.add(new JLabel("Song title starts with:"));
        inputs.add(txtSearchIn);
        inputs.add(btnSearch);
        inputs.add(new JLabel("Artist name:"));
        inputs.add(txtArtistRecIn);
        inputs.add(btnRecommend);

        JPanel discovery = new JPanel(new BorderLayout(4, 4));
        discovery.setPreferredSize(new Dimension(280, 0));
        discovery.setBorder(BorderFactory.createEmptyBorder(0, 0, 0, 8));
        discovery.add(inputs, BorderLayout.NORTH);
        discovery.add(titled(new JScrollPane(new JList<>(modelDiscovery)), "Results"), BorderLayout.CENTER);
        frame.add(discovery, BorderLayout.EAST);

        // ----- Bottom: add song form, controls, status -----
        txtInId = new JTextField(5);
        txtInTitle = new JTextField(14);
        txtInArtist = new JTextField(12);
        JButton btnAdd = new JButton("Add song");

        JPanel addRow = new JPanel(new FlowLayout(FlowLayout.LEFT));
        addRow.add(new JLabel("ID:"));
        addRow.add(txtInId);
        addRow.add(new JLabel("Title:"));
        addRow.add(txtInTitle);
        addRow.add(new JLabel("Artist:"));
        addRow.add(txtInArtist);
        addRow.add(btnAdd);

        JButton btnBack = new JButton("Back");
        JButton btnNext = new JButton("Next");
        JButton btnRepeat = new JButton("Toggle repeat");
        JButton btnQueue = new JButton("Add selected to Up Next");
        JButton btnRemove = new JButton("Remove selected");

        JPanel controlRow = new JPanel(new FlowLayout(FlowLayout.LEFT));
        controlRow.add(btnBack);
        controlRow.add(btnNext);
        controlRow.add(btnRepeat);
        controlRow.add(btnQueue);
        controlRow.add(btnRemove);

        lblStatus = new JLabel("Welcome to TuneWave.");
        lblStatus.setBorder(BorderFactory.createEmptyBorder(0, 12, 6, 12));

        JPanel bottom = new JPanel(new GridLayout(3, 1));
        bottom.add(addRow);
        bottom.add(controlRow);
        bottom.add(lblStatus);
        frame.add(bottom, BorderLayout.SOUTH);

        // ----- Button actions -----
        btnAdd.addActionListener(e -> {
            String id = txtInId.getText().trim();
            String title = txtInTitle.getText().trim();
            String artist = txtInArtist.getText().trim();
            if (id.isEmpty() || title.isEmpty() || artist.isEmpty()) {
                lblStatus.setText("Please fill in ID, title and artist.");
            } else if (addSongToPlaylist(new Song(id, title, artist))) {
                lblStatus.setText("Added: " + title);
                txtInId.setText("");
                txtInTitle.setText("");
                txtInArtist.setText("");
            } else {
                lblStatus.setText("A song with ID " + id + " is already in the playlist.");
            }
            refreshInterfaceDataDisplay();
        });

        btnRemove.addActionListener(e -> {
            int row = listPlaylist.getSelectedIndex();
            if (row < 0 || row >= playlistIds.size()) {
                lblStatus.setText("Click a song in the playlist first.");
            } else {
                removeSongFromPlaylist(playlistIds.get(row));
                lblStatus.setText("Song removed.");
            }
            refreshInterfaceDataDisplay();
        });

        btnQueue.addActionListener(e -> {
            int row = listPlaylist.getSelectedIndex();
            if (row < 0 || row >= playlistIds.size()) {
                lblStatus.setText("Click a song in the playlist first.");
            } else {
                addToUpNext(playlistIds.get(row));
                lblStatus.setText("Added to Up Next.");
            }
            refreshInterfaceDataDisplay();
        });

        btnNext.addActionListener(e -> {
            Object result = playNext();
            lblStatus.setText(result instanceof String
                    ? "End of playlist. Turn on repeat to loop."
                    : "Playing: " + result);
            refreshInterfaceDataDisplay();
        });

        btnBack.addActionListener(e -> {
            Object result = back();
            lblStatus.setText(result instanceof String
                    ? "No earlier song in history."
                    : "Back to: " + result);
            refreshInterfaceDataDisplay();
        });

        btnRepeat.addActionListener(e -> {
            toggleRepeat();
            lblStatus.setText("Repeat is now " + (isRepeatOn ? "ON" : "OFF") + ".");
            refreshInterfaceDataDisplay();
        });

        btnSearch.addActionListener(e -> {
            List<String> found = prefixSearch(txtSearchIn.getText().trim());
            modelDiscovery.clear();
            if (found.isEmpty()) {
                modelDiscovery.addElement("No songs found.");
            }
            for (String title : found) {
                modelDiscovery.addElement(title + "  [" + findSong(title) + "]");
            }
        });

        btnRecommend.addActionListener(e -> {
            String artist = txtArtistRecIn.getText().trim();
            List<String> recs = recommendArtists(artist);
            modelDiscovery.clear();
            if (recs.isEmpty()) {
                modelDiscovery.addElement("No recommendations for \"" + artist + "\".");
            }
            for (String r : recs) {
                modelDiscovery.addElement(r);
            }
        });

        frame.setSize(1050, 520);
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }

    /** Redraws every label and list from the current backend state. */
    private void refreshInterfaceDataDisplay() {
        lblActivePlaying.setText("Now playing: " + (activeTrack == null ? "nothing" : activeTrack.toString()));
        lblLoopText.setText("Repeat: " + (isRepeatOn ? "ON" : "OFF"));

        modelPlaylist.clear();
        playlistIds.clear();
        for (SongNode n = head; n != null; n = n.next) {
            modelPlaylist.addElement((n == activeTrack ? "> " : "   ") + n);
            playlistIds.add(n.songId);
        }

        modelQueue.clear();
        for (int i = 0; i < queueSize; i++) {
            SongNode n = songMap.get(upNextQueue[i]);
            if (n != null) {
                modelQueue.addElement(n.toString());
            }
        }

        modelHistory.clear(); // newest first
        for (int i = 1; i <= historySize; i++) {
            SongNode n = historyStack[(historyTail - i + MAX_HISTORY) % MAX_HISTORY];
            if (n != null) {
                modelHistory.addElement(n.toString());
            }
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(TuneWaveApp::new);
    }
}