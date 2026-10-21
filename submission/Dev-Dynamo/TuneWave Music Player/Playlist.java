import java.util.*;

// ================================
// SONG CLASS
// ================================
class Song {
    private final String id;
    private final String title;
    private final String artist;

    public Song(String id, String title, String artist) {
        this.id = id;
        this.title = title;
        this.artist = artist;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getArtist() {
        return artist;
    }

    @Override
    public String toString() {
        return title + " - " + artist;
    }
}

// ==========================================
// MILESTONE 3: SONG SEARCH BST
// ==========================================
class SongSearchBST {

    private static class TreeNode {
        String title;
        String songId;
        TreeNode left;
        TreeNode right;

        TreeNode(String title, String songId) {
            this.title = title;
            this.songId = songId;
        }
    }

    private TreeNode root;

    // FIX: Clear the BST before rebuilding it
    public void clear() {
        root = null;
    }

    public void addSong(String title, String songId) {
        if (title == null || title.trim().isEmpty()
                || songId == null || songId.trim().isEmpty()) {
            return;
        }

        root = insert(root, title.trim(), songId);
    }

    private TreeNode insert(TreeNode node, String title, String songId) {
        if (node == null) {
            return new TreeNode(title, songId);
        }

        int comparison = title.compareToIgnoreCase(node.title);

        if (comparison < 0) {
            node.left = insert(node.left, title, songId);
        } else if (comparison > 0) {
            node.right = insert(node.right, title, songId);
        } else {
            node.songId = songId;
        }

        return node;
    }

    public String findSong(String title) {
        if (title == null) {
            return null;
        }

        TreeNode node = root;

        while (node != null) {
            int comparison = title.compareToIgnoreCase(node.title);

            if (comparison == 0) {
                return node.songId;
            }

            node = comparison < 0 ? node.left : node.right;
        }

        return null;
    }

    public List<String> prefixSearch(String prefix) {
        List<String> results = new ArrayList<>();

        if (prefix == null) {
            return results;
        }

        collectPrefix(root, prefix.toLowerCase(Locale.ROOT), results);
        return results;
    }

    private void collectPrefix(
            TreeNode node, String prefix, List<String> results) {

        if (node == null) {
            return;
        }

        String title = node.title.toLowerCase(Locale.ROOT);

        // In-order traversal gives alphabetical results
        collectPrefix(node.left, prefix, results);

        if (title.startsWith(prefix)) {
            results.add(node.title + " [ID: " + node.songId + "]");
        }

        collectPrefix(node.right, prefix, results);
    }
}

// ==========================================
// MILESTONE 3: UNDIRECTED ARTIST GRAPH
// ==========================================
class ArtistGraph {

    private final Map<String, Set<String>> graph = new HashMap<>();

    public void addRelation(String artistA, String artistB) {
        if (artistA == null || artistB == null
                || artistA.trim().isEmpty()
                || artistB.trim().isEmpty()
                || artistA.equalsIgnoreCase(artistB)) {
            return;
        }

        artistA = artistA.trim();
        artistB = artistB.trim();

        graph.computeIfAbsent(artistA, k -> new TreeSet<>()).add(artistB);
        graph.computeIfAbsent(artistB, k -> new TreeSet<>()).add(artistA);
    }

    public List<String> recommendArtists(String artist) {
        Set<String> recommendations = new TreeSet<>();

        if (artist == null || !graph.containsKey(artist)) {
            return new ArrayList<>();
        }

        Set<String> directConnections = graph.get(artist);

        for (String directArtist : directConnections) {
            for (String secondArtist : graph.get(directArtist)) {
                if (!secondArtist.equals(artist)
                        && !directConnections.contains(secondArtist)) {
                    recommendations.add(secondArtist);
                }
            }
        }

        return new ArrayList<>(recommendations);
    }
}

// ==========================================
// MAIN PLAYLIST CLASS
// ==========================================
public class Playlist {

    // Doubly linked list node
    private static class Node {
        Song song;
        Node previous;
        Node next;

        Node(Song song) {
            this.song = song;
        }
    }

    private Node head;
    private Node tail;
    private Node current;

    private final Map<String, Node> songMap = new HashMap<>();
    private final Map<String, Song> allSongs = new HashMap<>();

    private boolean repeat = false;

    // Milestone 2: Queue and Stack
    private final Queue<String> upNext = new LinkedList<>();
    private final Deque<Song> history = new ArrayDeque<>();
    private static final int HISTORY_LIMIT = 10;

    // Milestone 3
    private final SongSearchBST searchTree = new SongSearchBST();
    private final ArtistGraph artistGraph = new ArtistGraph();

    // ==========================================
    // ADD SONG
    // ==========================================
    public boolean addSong(Song song) {
        if (song == null || song.getId() == null
                || song.getTitle() == null
                || song.getArtist() == null
                || songMap.containsKey(song.getId())) {
            return false;
        }

        Node newNode = new Node(song);

        if (head == null) {
            head = tail = current = newNode;
        } else {
            tail.next = newNode;
            newNode.previous = tail;
            tail = newNode;
        }

        songMap.put(song.getId(), newNode);
        allSongs.put(song.getId(), song);
        searchTree.addSong(song.getTitle(), song.getId());

        return true;
    }

    // ==========================================
    // REMOVE SONG
    // ==========================================
    public boolean removeSong(String songId) {
        Node node = songMap.get(songId);

        if (node == null) {
            return false;
        }

        if (node.previous != null) {
            node.previous.next = node.next;
        } else {
            head = node.next;
        }

        if (node.next != null) {
            node.next.previous = node.previous;
        } else {
            tail = node.previous;
        }

        if (current == node) {
            current = node.next != null ? node.next : node.previous;
        }

        songMap.remove(songId);
        allSongs.remove(songId);
        upNext.removeIf(id -> id.equals(songId));

        rebuildSearchTree();

        if (head == null) {
            tail = current = null;
        }

        return true;
    }

    private void rebuildSearchTree() {
        searchTree.clear();

        Node node = head;
        while (node != null) {
            searchTree.addSong(node.song.getTitle(), node.song.getId());
            node = node.next;
        }
    }

    // ==========================================
    // NEXT / PREVIOUS
    // ==========================================
    public String next() {
        if (current == null) {
            return "Playlist is empty";
        }

        if (current.next != null) {
            current = current.next;
            return current.song.getTitle();
        }

        if (repeat) {
            current = head;
            return current.song.getTitle();
        }

        return "end";
    }

    public String previous() {
        if (current == null) {
            return "Playlist is empty";
        }

        if (current.previous != null) {
            current = current.previous;
            return current.song.getTitle();
        }

        if (repeat) {
            current = tail;
            return current.song.getTitle();
        }

        return "start";
    }

    public boolean toggleRepeat() {
        repeat = !repeat;
        return repeat;
    }

    public int size() {
        return songMap.size();
    }

    public void displayPlaylist() {
        Node node = head;

        while (node != null) {
            System.out.println(node.song);
            node = node.next;
        }
    }

    // ==========================================
    // MILESTONE 2: UP NEXT QUEUE
    // ==========================================
    public boolean addToUpNext(String songId) {
        if (!allSongs.containsKey(songId)) {
            return false;
        }

        upNext.offer(songId);
        return true;
    }

    public void displayUpNext() {
        if (upNext.isEmpty()) {
            System.out.println("Up Next is empty");
            return;
        }

        for (String id : upNext) {
            System.out.println(allSongs.get(id));
        }
    }

    public String playNext() {
        Song song;

        if (!upNext.isEmpty()) {
            song = allSongs.get(upNext.poll());
        } else {
            String result = next();

            if (result.equals("end")
                    || result.equals("start")
                    || result.equals("Playlist is empty")) {
                return result;
            }

            song = current.song;
        }

        if (song == null) {
            return "Song not found";
        }

        addToHistory(song);
        return "Playing: " + song.getTitle();
    }

    public String playSong(String songId) {
        Song song = allSongs.get(songId);

        if (song == null) {
            return "Song not found";
        }

        addToHistory(song);
        return "Playing: " + song.getTitle();
    }

    // ==========================================
    // MILESTONE 2: PLAYBACK HISTORY
    // ==========================================
    private void addToHistory(Song song) {
        history.push(song);

        if (history.size() > HISTORY_LIMIT) {
            history.removeLast();
        }
    }

    public void displayHistory() {
        if (history.isEmpty()) {
            System.out.println("History is empty");
            return;
        }

        for (Song song : history) {
            System.out.println(song);
        }
    }

    public String back() {
        if (history.isEmpty()) {
            return "No playback history";
        }

        // Remove the currently most recent item
        history.pop();

        if (history.isEmpty()) {
            return "No previous song";
        }

        return "Playing previous song: " + history.peek().getTitle();
    }

    // ==========================================
    // MILESTONE 3: SONG SEARCH
    // ==========================================
    public String findSong(String title) {
        String id = searchTree.findSong(title);

        if (id == null) {
            return "Song not found";
        }

        Song song = allSongs.get(id);
        return song == null ? "Song not found" : song.toString();
    }

    public List<String> prefixSearch(String prefix) {
        return searchTree.prefixSearch(prefix);
    }

    // ==========================================
    // MILESTONE 3: ARTIST GRAPH
    // ==========================================
    public void addRelation(String artistA, String artistB) {
        artistGraph.addRelation(artistA, artistB);
    }

    public List<String> recommendArtists(String artist) {
        return artistGraph.recommendArtists(artist);
    }

    // ==========================================
    // MAIN METHOD AND TESTS
    // ==========================================
    public static void main(String[] args) {
        Playlist playlist = new Playlist();

        System.out.println("==================================");
        System.out.println("       TUNEWAVE MUSIC PLAYER");
        System.out.println("==================================");

        Song[] songs = {
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

        for (Song song : songs) {
            playlist.addSong(song);
        }

        System.out.println("\nTotal songs: " + playlist.size());

        System.out.println("\n--- FULL PLAYLIST ---");
        playlist.displayPlaylist();

        System.out.println("\n--- NEXT SONG ---");
        System.out.println(playlist.next());

        System.out.println("\n--- PREVIOUS SONG ---");
        System.out.println(playlist.previous());

        System.out.println("\n--- REPEAT MODE ---");
        System.out.println("Repeat enabled: " + playlist.toggleRepeat());

        System.out.println("\n--- DUPLICATE TEST ---");
        System.out.println("Duplicate added: " + playlist.addSong(songs[0]));

        System.out.println("\n==================================");
        System.out.println("       MILESTONE 2 TESTS");
        System.out.println("==================================");

        System.out.println("\n--- ADD TO UP NEXT ---");
        System.out.println("Pasoori added: " + playlist.addToUpNext("S011"));
        System.out.println("Iraaday added: " + playlist.addToUpNext("S015"));

        System.out.println("\n--- DISPLAY UP NEXT ---");
        playlist.displayUpNext();

        System.out.println("\n--- PLAY QUEUED SONGS ---");
        System.out.println(playlist.playNext());
        System.out.println(playlist.playNext());

        System.out.println("\n--- PLAYBACK HISTORY ---");
        playlist.displayHistory();

        System.out.println("\n--- BACK ---");
        System.out.println(playlist.back());

        System.out.println("\n==================================");
        System.out.println("       MILESTONE 3 TESTS");
        System.out.println("==================================");

        System.out.println("\n--- FIND SONG ---");
        System.out.println(playlist.findSong("Pasoori"));

        System.out.println("\n--- PREFIX SEARCH: 'Tu' ---");
        for (String result : playlist.prefixSearch("Tu")) {
            System.out.println(result);
        }

        System.out.println("\n--- ARTIST RELATIONSHIPS ---");

        playlist.addRelation("Arijit Singh", "Jubin Nautiyal");
        playlist.addRelation("Arijit Singh", "Atif Aslam");
        playlist.addRelation("Jubin Nautiyal", "Sonu Nigam");
        playlist.addRelation("Atif Aslam", "Asim Azhar");
        playlist.addRelation("Sonu Nigam", "Shreya Ghoshal");
        playlist.addRelation("Asim Azhar", "Ali Sethi");

        System.out.println("\n--- ARTISTS TWO CONNECTIONS AWAY FROM ARIJIT SINGH ---");
        for (String artist : playlist.recommendArtists("Arijit Singh")) {
            System.out.println(artist);
        }

        System.out.println("\n==================================");
        System.out.println("       ALL TESTS COMPLETED");
        System.out.println("==================================");
    }
}