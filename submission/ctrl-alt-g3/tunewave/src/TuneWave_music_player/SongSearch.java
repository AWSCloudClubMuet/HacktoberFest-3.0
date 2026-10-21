package TuneWave_music_player;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** An explicit, unbalanced BST keyed by normalized title; no TreeMap or list filtering. */
public final class SongSearch {
    public record Entry(String title, String songId) { }
    public record TreeNode(String key, List<Entry> entries, String left, String right) { }
    public record Trace(String query, String mode, List<String> visited, List<String> skippedRoots) { }
    private Trace trace = new Trace("", "none", List.of(), List.of());

    private static final class Node {
        final String key;
        // Different song IDs may have the same title. Keep them in one title node.
        final List<Entry> entries = new ArrayList<>();
        Node left;
        Node right;
        Node(String key, Entry entry) {
            this.key = key;
            entries.add(entry);
        }
    }

    private Node root;
    private final Set<String> indexedIds = new HashSet<>();
    private int lastPrefixVisitedNodes;

    public synchronized boolean addSong(String title, String songId) {
        String key = titleKey(title);
        Song.requireId(songId);
        if (indexedIds.contains(songId)) return false;
        Entry entry = new Entry(title.strip(), songId);
        if (root == null) root = new Node(key, entry);
        else {
            Node node = root;
            while (true) {
                int comparison = key.compareTo(node.key);
                if (comparison == 0) {
                    node.entries.add(entry);
                    break;
                }
                if (comparison < 0) {
                    if (node.left == null) { node.left = new Node(key, entry); break; }
                    node = node.left;
                } else {
                    if (node.right == null) { node.right = new Node(key, entry); break; }
                    node = node.right;
                }
            }
        }
        indexedIds.add(songId);
        return true;
    }

    /** Returns every song ID with this title, in insertion order for title ties. */
    public synchronized List<Entry> findSong(String title) {
        String key = titleKey(title);
        List<String> visited = new ArrayList<>();
        Node node = root;
        while (node != null) {
            visited.add(node.key);
            int comparison = key.compareTo(node.key);
            if (comparison == 0) {
                trace = new Trace(title, "exact", List.copyOf(visited), List.of());
                return List.copyOf(node.entries);
            }
            node = comparison < 0 ? node.left : node.right;
        }
        trace = new Trace(title, "exact", List.copyOf(visited), List.of());
        return List.of();
    }

    /** In-order range traversal of [prefix, exclusiveUpperBound), pruning both sides. */
    public synchronized List<Entry> prefixSearch(String prefix) {
        if (prefix == null) throw new IllegalArgumentException("Prefix must not be null.");
        String lower = prefix.strip().toLowerCase(Locale.ROOT);
        String upper = prefixUpperBound(lower);
        List<Entry> result = new ArrayList<>();
        List<String> visited = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        ArrayDeque<Node> ancestors = new ArrayDeque<>();
        Node node = root;
        lastPrefixVisitedNodes = 0;
        while (node != null || !ancestors.isEmpty()) {
            while (node != null) {
                lastPrefixVisitedNodes++;
                visited.add(node.key);
                if (node.key.compareTo(lower) < 0) {
                    if (node.left != null) skipped.add(node.left.key);
                    node = node.right; // This node AND its entire left subtree are too small.
                } else if (upper != null && node.key.compareTo(upper) >= 0) {
                    if (node.right != null) skipped.add(node.right.key);
                    node = node.left; // This node AND its entire right subtree are too large.
                } else {
                    ancestors.push(node);
                    node = node.left;
                }
            }
            if (!ancestors.isEmpty()) {
                node = ancestors.pop();
                result.addAll(node.entries);
                node = node.right;
            }
        }
        trace = new Trace(prefix, "prefix", List.copyOf(visited), List.copyOf(skipped));
        return List.copyOf(result);
    }

    public synchronized Trace lastTrace() { return trace; }
    public synchronized List<TreeNode> treeNodes() {
        List<TreeNode> result = new ArrayList<>();
        ArrayDeque<Node> pending = new ArrayDeque<>();
        if (root != null) pending.add(root);
        while (!pending.isEmpty()) {
            Node node = pending.removeFirst();
            result.add(new TreeNode(node.key, List.copyOf(node.entries),
                    node.left == null ? null : node.left.key, node.right == null ? null : node.right.key));
            if (node.left != null) pending.addLast(node.left);
            if (node.right != null) pending.addLast(node.right);
        }
        return List.copyOf(result);
    }

    private static String titleKey(String title) {
        if (title == null || title.isBlank())
            throw new IllegalArgumentException("Title must not be blank.");
        return title.strip().toLowerCase(Locale.ROOT);
    }

    // Unlike prefix + '\uffff', this bound includes ALL possible suffixes.
    private static String prefixUpperBound(String prefix) {
        char[] characters = prefix.toCharArray();
        for (int i = characters.length - 1; i >= 0; i--) {
            if (characters[i] != Character.MAX_VALUE) {
                characters[i]++;
                return new String(characters, 0, i + 1);
            }
        }
        return null; // Empty prefix or all-max-code-unit prefix has no finite upper bound.
    }

    // Diagnostic for the pruning test; not required by clients.
    synchronized int lastPrefixVisitedNodes() { return lastPrefixVisitedNodes; }
}
