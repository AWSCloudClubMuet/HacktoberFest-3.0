import java.util.*;

public class TuneWave {

    // ---------- Milestone 1: Playlist (Doubly Linked List + Hash Map) ----------
    static class Node {
        String id;
        Node prev, next;
        Node(String id) { this.id = id; }
    }

    static class Playlist {
        Node head, tail, current;
        Map<String, Node> map = new HashMap<>();
        boolean repeat = false;

        boolean addSong(String id) {
            if (map.containsKey(id)) return false;   // no duplicates
            Node n = new Node(id);
            if (tail == null) head = n;
            else { tail.next = n; n.prev = tail; }
            tail = n;
            map.put(id, n);
            return true;
        }

        boolean removeSong(String id) {
            Node n = map.remove(id);
            if (n == null) return false;
            if (n.prev != null) n.prev.next = n.next; else head = n.next;
            if (n.next != null) n.next.prev = n.prev; else tail = n.prev;
            if (current == n) current = (n.next != null) ? n.next : n.prev;
            return true;
        }

        boolean toggleRepeat() {
            repeat = !repeat;
            return repeat;
        }

        String next() {
            if (head == null) return "end";
            if (current == null) current = head;
            else if (current.next != null) current = current.next;
            else if (repeat) current = head;
            else return "end";                        // stays on last song
            return current.id;
        }

        String previous() {
            if (head == null) return "start";
            if (current == null) current = head;
            else if (current.prev != null) current = current.prev;
            else if (repeat) current = tail;
            else return "start";
            return current.id;
        }
    }

    // ---------- Milestone 2: Up Next (Queue) + History (Stack) ----------
    static class Player {
        Playlist playlist;
        Deque<String> upNext = new ArrayDeque<>();
        Deque<String> history = new ArrayDeque<>();   // used as a stack
        String now = null;
        static final int MAX_HISTORY = 10;

        Player(Playlist p) { this.playlist = p; }

        void addToUpNext(String id) { upNext.addLast(id); }

        private String play(String id) {
            if (now != null) {
                history.addLast(now);
                if (history.size() > MAX_HISTORY) history.removeFirst(); // drop oldest
            }
            now = id;
            return id;
        }

        String playNext() {
            if (!upNext.isEmpty()) return play(upNext.pollFirst()); // playlist untouched
            String s = playlist.next();
            return s.equals("end") ? s : play(s);
        }

        String back() {
            if (history.isEmpty()) return null;
            now = history.removeLast();               // replay top and remove it
            return now;
        }
    }

    // ---------- Milestone 3: BST search + Artist Graph ----------
    static class BNode {
        String title, key, id;
        BNode left, right;
        BNode(String title, String id) {
            this.title = title;
            this.key = title.toLowerCase();
            this.id = id;
        }
    }

    static class SongIndex {
        BNode root;

        void addSong(String title, String id) {
            BNode n = new BNode(title, id);
            if (root == null) { root = n; return; }
            BNode cur = root;
            while (true) {
                int c = n.key.compareTo(cur.key);
                if (c == 0) { cur.id = id; return; }
                if (c < 0) {
                    if (cur.left == null) { cur.left = n; return; }
                    cur = cur.left;
                } else {
                    if (cur.right == null) { cur.right = n; return; }
                    cur = cur.right;
                }
            }
        }

        String findSong(String title) {
            BNode cur = root;
            String k = title.toLowerCase();
            while (cur != null) {
                int c = k.compareTo(cur.key);
                if (c == 0) return cur.id;
                cur = (c < 0) ? cur.left : cur.right;
            }
            return null;
        }

        List<String> prefixSearch(String prefix) {
            List<String> out = new ArrayList<>();
            String p = prefix.toLowerCase();
            walk(root, p, p + '\uffff', out);
            return out;
        }

        private void walk(BNode n, String p, String hi, List<String> out) {
            if (n == null) return;
            if (p.compareTo(n.key) < 0) walk(n.left, p, hi, out);   // skip left if too small
            if (n.key.startsWith(p)) out.add(n.title);
            if (n.key.compareTo(hi) < 0) walk(n.right, p, hi, out); // skip right if too big
        }
    }

    static class ArtistGraph {
        Map<String, Set<String>> g = new HashMap<>();

        void addRelation(String a, String b) {
            if (a.equals(b)) return;
            g.computeIfAbsent(a, k -> new HashSet<>()).add(b);
            g.computeIfAbsent(b, k -> new HashSet<>()).add(a);
        }

        List<String> recommendArtists(String artist) {
            Set<String> direct = g.getOrDefault(artist, new HashSet<>());
            Set<String> two = new TreeSet<>();        // sorted alphabetically
            for (String f : direct) two.addAll(g.get(f));
            two.removeAll(direct);
            two.remove(artist);
            return new ArrayList<>(two);
        }
    }

    // ---------------------------- Demo + Tests ----------------------------
    static void check(boolean cond, String msg) {
        if (!cond) throw new AssertionError("FAILED: " + msg);
    }

    public static void main(String[] args) {
        // Milestone 1
        Playlist pl = new Playlist();
        pl.addSong("1"); pl.addSong("2"); pl.addSong("3");
        check(!pl.addSong("2"), "duplicate rejected");
        check(pl.next().equals("1") && pl.next().equals("2") && pl.next().equals("3"), "forward");
        check(pl.next().equals("end") && pl.current.id.equals("3"), "end without repeat");
        pl.toggleRepeat();
        check(pl.next().equals("1"), "repeat wraps");
        check(pl.previous().equals("3"), "previous wraps");
        pl.toggleRepeat();
        check(pl.removeSong("3") && pl.current.id.equals("2"), "remove current");

        // Milestone 2
        Playlist pl2 = new Playlist();
        pl2.addSong("1"); pl2.addSong("2"); pl2.addSong("3");
        Player p = new Player(pl2);
        check(p.playNext().equals("1"), "play 1");
        p.addToUpNext("99");
        check(p.playNext().equals("99"), "queue first");
        check(pl2.current.id.equals("1"), "playlist position unchanged");
        check(p.playNext().equals("2"), "playlist continues");
        check(p.back().equals("99") && p.back().equals("1"), "back order");

        Player p2 = new Player(new Playlist());
        for (int i = 0; i < 15; i++) p2.addToUpNext("s" + i);
        for (int i = 0; i < 15; i++) p2.playNext();
        check(p2.history.size() == 10 && p2.history.peekFirst().equals("s4"), "history cap");

        // Milestone 3
        SongIndex idx = new SongIndex();
        idx.addSong("Shape of You", "1");
        idx.addSong("Shake It Off", "2");
        idx.addSong("Sunflower", "3");
        idx.addSong("Blinding Lights", "4");
        idx.addSong("shadow", "5");
        check("3".equals(idx.findSong("sunflower")), "findSong");
        check(idx.prefixSearch("sha").equals(
                Arrays.asList("Shake It Off", "shadow", "Shape of You")), "prefix sorted");
        check(idx.prefixSearch("zzz").isEmpty(), "prefix none");

        ArtistGraph g = new ArtistGraph();
        String[][] rel = {{"A","B"},{"B","C"},{"A","D"},{"D","E"},{"A","C"},{"C","F"}};
        for (String[] r : rel) g.addRelation(r[0], r[1]);
        check(g.recommendArtists("A").equals(Arrays.asList("E", "F")), "recommend");

        System.out.println("All TuneWave tests passed");
    }
}