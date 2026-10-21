package tunewave;

import java.util.ArrayList;
import java.util.List;

/**
 * Custom Binary Search Tree for searching songs by title.
 *
 * <h2>Data structure</h2>
 * A hand-rolled BST whose nodes hold a {@code (title → songId)} mapping.
 * No Java built-in tree collections ({@code TreeMap}, {@code TreeSet}, …)
 * are used.
 *
 * <h2>Ordering</h2>
 * Titles are compared <em>case-insensitively</em> using
 * {@link String#compareToIgnoreCase}.
 *
 * <h2>Uniqueness</h2>
 * Duplicate titles (under the same case-insensitive comparison) are rejected:
 * the second {@link #addSong} call with the same title is silently ignored.
 *
 * <h2>Prefix search pruning</h2>
 * {@link #prefixSearch} uses the BST ordering to prune entire subtrees:
 * when the current node's title sorts <em>before</em> the prefix (ignoring
 * case), the matching region can only be in the right subtree; when it sorts
 * <em>after</em> the prefix's potential last character, only the left subtree
 * can match.  This avoids scanning every node.
 *
 * <p>This implementation is intentionally straightforward so that a
 * third-semester Software Engineering student can follow it.
 */
public class SongBST {

    // ---------------------------------------------------------- inner node class

    /**
     * A single node in the BST.  Package-private for test introspection.
     */
    static class BSTNode {
        final String title;  // stored exactly as provided (but compared case-insensitively)
        final String songId;
        BSTNode left;
        BSTNode right;

        BSTNode(String title, String songId) {
            this.title  = title;
            this.songId = songId;
        }
    }

    // ------------------------------------------------------------------ fields

    /** Root of the BST, or {@code null} when the tree is empty. */
    private BSTNode root;

    // ------------------------------------------------------- mutation methods

    /**
     * Inserts a title → songId mapping into the BST.
     *
     * <p>If a mapping with the same title (case-insensitive) already exists,
     * the call is silently ignored.
     *
     * @param title  the song title used as the BST key (non-null)
     * @param songId the associated song ID (non-null)
     */
    public void addSong(String title, String songId) {
        if (title == null || songId == null) {
            throw new IllegalArgumentException("title and songId must not be null");
        }
        root = insert(root, title, songId);
    }

    /**
     * Recursive insert helper.
     *
     * @param node  current subtree root (may be {@code null})
     * @param title title to insert
     * @param id    song ID to store
     * @return the (possibly new) subtree root
     */
    private BSTNode insert(BSTNode node, String title, String id) {
        if (node == null) return new BSTNode(title, id);

        int cmp = title.compareToIgnoreCase(node.title);
        if (cmp < 0) {
            node.left  = insert(node.left,  title, id);
        } else if (cmp > 0) {
            node.right = insert(node.right, title, id);
        }
        // cmp == 0 → duplicate title; silently ignore
        return node;
    }

    // --------------------------------------------------------- search methods

    /**
     * Looks up the song ID for an exact title match (case-insensitive).
     *
     * @param title the title to search for
     * @return the matching song ID, or {@code null} if not found
     */
    public String findSong(String title) {
        if (title == null) return null;
        BSTNode node = search(root, title);
        return node == null ? null : node.songId;
    }

    /**
     * Recursive exact-search helper.
     */
    private BSTNode search(BSTNode node, String title) {
        if (node == null) return null;

        int cmp = title.compareToIgnoreCase(node.title);
        if (cmp == 0) return node;
        if (cmp < 0)  return search(node.left,  title);
        return             search(node.right, title);
    }

    /**
     * Returns all song titles that start with the given prefix
     * (case-insensitive), sorted alphabetically (also case-insensitive).
     *
     * <h3>Pruning strategy</h3>
     * For a node with title {@code T} and prefix {@code P}:
     * <ul>
     *   <li>If {@code T.toLowerCase()} &lt; {@code P.toLowerCase()}, matches
     *       can only be in the <em>right</em> subtree → skip the left.</li>
     *   <li>If {@code T.toLowerCase()} starts after the last possible title
     *       that could start with {@code P} (i.e., {@code T} is
     *       lexicographically &ge; {@code P} with the last char incremented),
     *       matches can only be in the <em>left</em> subtree → skip the right.</li>
     *   <li>Otherwise visit both subtrees.</li>
     * </ul>
     *
     * <p>An empty prefix matches every title.
     *
     * @param prefix the prefix to match (case-insensitive); may be empty
     * @return alphabetically sorted list of matching titles
     */
    public List<String> prefixSearch(String prefix) {
        List<String> results = new ArrayList<>();
        if (prefix == null) return results;

        prefixCollect(root, prefix.toLowerCase(), results);

        // Sort the collected results alphabetically (case-insensitive).
        results.sort(String.CASE_INSENSITIVE_ORDER);
        return results;
    }

    /**
     * Recursive helper that collects matching titles using BST pruning.
     *
     * @param node    current subtree root
     * @param prefix  lower-cased prefix to match
     * @param results accumulator list
     */
    private void prefixCollect(BSTNode node, String prefix, List<String> results) {
        if (node == null) return;

        String lowerTitle = node.title.toLowerCase();

        // --- Pruning decision ---

        // Upper bound: the "largest" title that can start with prefix.
        // We compute it by incrementing the last character of the prefix.
        // e.g. prefix "bl" → upperBound "bm" (exclusive).
        String upperBound = computeUpperBound(prefix);

        // Does the current title start with the prefix?
        if (lowerTitle.startsWith(prefix)) {
            results.add(node.title);
        }

        // Decide which subtrees to recurse into.
        // Left subtree titles are all < node.title; right subtree titles are all > node.title.

        // Visit left subtree only if it might contain titles >= prefix.
        // A title in the left subtree is < node.title.
        // If node.title (lower) >= prefix, left subtree might still have matches
        // (titles that start with prefix but come before this node).
        if (lowerTitle.compareTo(prefix) >= 0) {
            prefixCollect(node.left, prefix, results);
        }

        // Visit right subtree only if it might contain titles <= upperBound.
        // If node.title (lower) < upperBound, right subtree might have matches.
        if (upperBound == null || lowerTitle.compareTo(upperBound) < 0) {
            prefixCollect(node.right, prefix, results);
        }
    }

    /**
     * Computes the exclusive upper bound for prefix matching.
     *
     * <p>Increments the last character of the prefix by 1.  For example,
     * {@code "bl"} → {@code "bm"}.  If the last character is {@link Character#MAX_VALUE},
     * we drop it and try the previous character (this edge case is rare in
     * typical song titles).  Returns {@code null} if no bound can be computed
     * (meaning: every suffix is a potential match → do not prune right).
     *
     * @param prefix lower-cased prefix
     * @return upper-bound string, or {@code null} if unbounded
     */
    private String computeUpperBound(String prefix) {
        if (prefix.isEmpty()) return null; // empty prefix → no upper bound

        char[] chars = prefix.toCharArray();
        int i = chars.length - 1;
        while (i >= 0 && chars[i] == Character.MAX_VALUE) {
            i--;
        }
        if (i < 0) return null; // all chars at max value → no bound
        chars[i]++;
        return new String(chars, 0, i + 1);
    }

    // --------------------------------------------------------- query methods

    /**
     * @return {@code true} if the BST contains no songs
     */
    public boolean isEmpty() {
        return root == null;
    }

    /**
     * Returns the root node for test introspection.
     */
    BSTNode getRoot() { return root; }
}

