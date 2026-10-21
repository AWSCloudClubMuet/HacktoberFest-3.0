package tunewave.milestone3;

import java.util.ArrayList;
import java.util.List;

/**
 * Milestone 3 — Song Search (Binary Search Tree: BST)
 *
 * <p>Stores songs keyed by their {@code title} for fast exact lookup and prefix searches.
 *
 * <p>Rules:
 * <ul>
 *   <li>Store songs in a BST keyed by title.</li>
 *   <li>{@code prefixSearch} returns matching titles in alphabetical order and
 *       skips (prunes) subtrees that cannot match.</li>
 * </ul>
 */
public class SongSearchBST {

    /**
     * Node in the Binary Search Tree.
     */
    public static class BSTNode {
        private final String title;
        private String songId;
        private BSTNode left;
        private BSTNode right;

        public BSTNode(String title, String songId) {
            this.title = title;
            this.songId = songId;
            this.left = null;
            this.right = null;
        }

        public String getTitle() {
            return title;
        }

        public String getSongId() {
            return songId;
        }

        public void setSongId(String songId) {
            this.songId = songId;
        }

        public BSTNode getLeft() {
            return left;
        }

        public void setLeft(BSTNode left) {
            this.left = left;
        }

        public BSTNode getRight() {
            return right;
        }

        public void setRight(BSTNode right) {
            this.right = right;
        }
    }

    private BSTNode root;

    /**
     * Initializes an empty BST catalog.
     */
    public SongSearchBST() {
        this.root = null;
    }

    /**
     * Adds a song to the BST keyed by title.
     * If the title already exists, updates the associated songId.
     *
     * @param title  Song title (BST key).
     * @param songId Song identifier.
     */
    public void addSong(String title, String songId) {
        if (title == null || songId == null) {
            return;
        }
        String titleStr = title.trim();
        String idStr = songId.trim();

        if (this.root == null) {
            this.root = new BSTNode(titleStr, idStr);
            return;
        }

        BSTNode current = this.root;
        while (true) {
            int cmp = titleStr.compareTo(current.getTitle());
            if (cmp < 0) {
                if (current.getLeft() == null) {
                    current.setLeft(new BSTNode(titleStr, idStr));
                    return;
                }
                current = current.getLeft();
            } else if (cmp > 0) {
                if (current.getRight() == null) {
                    current.setRight(new BSTNode(titleStr, idStr));
                    return;
                }
                current = current.getRight();
            } else {
                // Exact title match: update songId
                current.setSongId(idStr);
                return;
            }
        }
    }

    /**
     * Finds a song by exact title in the BST.
     *
     * @param title Title of the song to search for.
     * @return Associated songId if found, or {@code null} if not found.
     */
    public String findSong(String title) {
        if (title == null) {
            return null;
        }
        String titleStr = title.trim();

        BSTNode current = this.root;
        while (current != null) {
            int cmp = titleStr.compareTo(current.getTitle());
            if (cmp == 0) {
                return current.getSongId();
            } else if (cmp < 0) {
                current = current.getLeft();
            } else {
                current = current.getRight();
            }
        }

        return null;
    }

    /**
     * Performs a prefix search on song titles.
     *
     * <p>Subtree Pruning Strategy:
     * <ul>
     *   <li>Only visit the left subtree if {@code node.title > prefix}: if the current title
     *       is less than or equal to prefix, no node in the left subtree can possibly start with prefix.</li>
     *   <li>If {@code node.title} starts with {@code prefix}, collect it.</li>
     *   <li>Only visit the right subtree if {@code node.title.substring(0, prefixLen) <= prefix}:
     *       if the current title's prefix is strictly greater than prefix, all nodes in the right
     *       subtree are strictly greater and cannot match.</li>
     * </ul>
     *
     * <p>Because an in-order traversal (left, current, right) is performed, matching titles
     * are naturally collected in strictly alphabetical order.
     *
     * @param prefix String prefix to match against titles.
     * @return List of matching titles in alphabetical order.
     */
    public List<String> prefixSearch(String prefix) {
        List<String> matches = new ArrayList<>();
        if (prefix == null || prefix.isEmpty()) {
            collectAllInOrder(this.root, matches);
            return matches;
        }

        String prefixStr = prefix.trim();
        searchSubtree(this.root, prefixStr, matches);
        return matches;
    }

    private void searchSubtree(BSTNode node, String prefix, List<String> matches) {
        if (node == null) {
            return;
        }

        // Pruning Rule 1: Explore left subtree only if current title > prefix
        if (node.getTitle().compareTo(prefix) > 0) {
            searchSubtree(node.getLeft(), prefix, matches);
        }

        // Check if current node matches prefix
        if (node.getTitle().startsWith(prefix)) {
            matches.add(node.getTitle());
        }

        // Pruning Rule 2: Explore right subtree only if node.title[:prefixLen] <= prefix
        int prefixLen = Math.min(node.getTitle().length(), prefix.length());
        String nodePrefix = node.getTitle().substring(0, prefixLen);
        if (nodePrefix.compareTo(prefix) <= 0) {
            searchSubtree(node.getRight(), prefix, matches);
        }
    }

    private void collectAllInOrder(BSTNode node, List<String> matches) {
        if (node == null) return;
        collectAllInOrder(node.getLeft(), matches);
        matches.add(node.getTitle());
        collectAllInOrder(node.getRight(), matches);
    }

    public BSTNode getRoot() {
        return root;
    }
}
