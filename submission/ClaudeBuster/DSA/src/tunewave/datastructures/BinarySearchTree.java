package tunewave.datastructures;

import tunewave.model.Song;

import java.util.ArrayList;
import java.util.List;

/**
 * Binary Search Tree (BST) for fast song search by title and prefix queries.
 * Keys are song titles, ordered lexicographically (case-insensitive for flexible matching).
 *
 * Implements subtree pruning during prefix search: subtrees that cannot possibly
 * contain titles starting with the prefix are skipped entirely.
 */
public class BinarySearchTree {

    public static class BSTNode {
        public String title;
        public String songId;
        public Song song;
        public BSTNode left;
        public BSTNode right;

        public BSTNode(String title, String songId, Song song) {
            this.title = title;
            this.songId = songId;
            this.song = song;
            this.left = null;
            this.right = null;
        }
    }

    private BSTNode root;
    private int size;

    public BinarySearchTree() {
        this.root = null;
        this.size = 0;
    }

    /**
     * Inserts a song into the BST keyed by title.
     * If a song with the exact title already exists, updates its data.
     *
     * @param title Title of the song
     * @param songId ID of the song
     * @param song Song model instance (can be null if only title and ID provided)
     */
    public void insert(String title, String songId, Song song) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Song title cannot be null or empty");
        }
        root = insertRec(root, title.trim(), songId, song);
    }

    public void insert(String title, String songId) {
        insert(title, songId, new Song(songId, title));
    }

    private BSTNode insertRec(BSTNode current, String title, String songId, Song song) {
        if (current == null) {
            size++;
            return new BSTNode(title, songId, song);
        }

        int cmp = title.compareToIgnoreCase(current.title);
        if (cmp < 0) {
            current.left = insertRec(current.left, title, songId, song);
        } else if (cmp > 0) {
            current.right = insertRec(current.right, title, songId, song);
        } else {
            // Update existing node
            current.title = title;
            current.songId = songId;
            if (song != null) {
                current.song = song;
            }
        }
        return current;
    }

    /**
     * Finds a song by its exact title (case-insensitive).
     * @param title Song title to search
     * @return The BSTNode if found, or null
     */
    public BSTNode findSong(String title) {
        if (title == null) return null;
        return findRec(root, title.trim());
    }

    private BSTNode findRec(BSTNode current, String title) {
        if (current == null) {
            return null;
        }

        int cmp = title.compareToIgnoreCase(current.title);
        if (cmp == 0) {
            return current;
        } else if (cmp < 0) {
            return findRec(current.left, title);
        } else {
            return findRec(current.right, title);
        }
    }

    /**
     * Searches for all song titles matching the given prefix.
     * Returns titles in alphabetical order.
     *
     * CRITICAL RULE: Skips subtrees that cannot match!
     *
     * @param prefix Title prefix to search
     * @return List of matching song titles in alphabetical order
     */
    public List<String> prefixSearch(String prefix) {
        List<String> results = new ArrayList<>();
        if (prefix == null || prefix.trim().isEmpty()) {
            // If empty prefix, in-order traversal of all songs
            inOrderCollect(root, results);
            return results;
        }

        prefixSearchRec(root, prefix.trim(), results);
        return results;
    }

    /**
     * Recursive prefix search with subtree pruning.
     */
    private void prefixSearchRec(BSTNode current, String prefix, List<String> results) {
        if (current == null) {
            return;
        }

        String tLower = current.title.toLowerCase();
        String pLower = prefix.toLowerCase();

        if (tLower.startsWith(pLower)) {
            // Subtrees on both left and right could contain matches starting with prefix.
            // In-order traversal preserves alphabetical order:
            prefixSearchRec(current.left, prefix, results);
            results.add(current.title);
            prefixSearchRec(current.right, prefix, results);
        } else {
            int cmp = tLower.compareTo(pLower);
            if (cmp < 0) {
                // current.title is strictly less than prefix and doesn't start with prefix.
                // All nodes in current.left are strictly < current.title < prefix.
                // Therefore, NO nodes in the left subtree can ever start with prefix.
                // PRUNE / SKIP left subtree!
                prefixSearchRec(current.right, prefix, results);
            } else {
                // current.title is strictly greater than prefix and doesn't start with prefix.
                // All nodes in current.right are strictly > current.title > prefix.
                // Therefore, NO nodes in the right subtree can ever start with prefix.
                // PRUNE / SKIP right subtree!
                prefixSearchRec(current.left, prefix, results);
            }
        }
    }

    private void inOrderCollect(BSTNode current, List<String> results) {
        if (current == null) return;
        inOrderCollect(current.left, results);
        results.add(current.title);
        inOrderCollect(current.right, results);
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return root == null;
    }

    public BSTNode getRoot() {
        return root;
    }
}
