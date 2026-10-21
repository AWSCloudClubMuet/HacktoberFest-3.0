package tunewave;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link SongBST} — custom Binary Search Tree.
 *
 * Covers: exact search, case-insensitive comparison, duplicate rejection,
 * prefix ordering, BST pruning logic, empty/no-match edge cases.
 */
class SongBSTTest {

    private SongBST bst;

    @BeforeEach
    void setUp() {
        bst = new SongBST();
    }

    // ──────────────────────── addSong / basic lookup ──────────────────────────

    @Test
    void findSongExactMatch() {
        bst.addSong("Bohemian Rhapsody", "S1");
        assertEquals("S1", bst.findSong("Bohemian Rhapsody"));
    }

    @Test
    void findSongCaseInsensitive() {
        bst.addSong("Blinding Lights", "S2");
        assertEquals("S2", bst.findSong("blinding lights"),
                "findSong must match case-insensitively");
        assertEquals("S2", bst.findSong("BLINDING LIGHTS"));
        assertEquals("S2", bst.findSong("Blinding Lights"));
    }

    @Test
    void findSongNotFoundReturnsNull() {
        bst.addSong("Alpha", "S1");
        assertNull(bst.findSong("Nonexistent"),
                "findSong must return null when title is not in BST");
    }

    @Test
    void findSongEmptyBstReturnsNull() {
        assertNull(bst.findSong("Anything"));
    }

    @Test
    void findSongNullReturnsNull() {
        assertNull(bst.findSong(null));
    }

    // ──────────────────────── duplicate rejection ─────────────────────────────

    @Test
    void duplicateTitleIgnored() {
        bst.addSong("Alpha", "S1");
        bst.addSong("alpha", "S2"); // same title case-insensitively
        // The stored ID must still be S1 (the first one wins).
        assertEquals("S1", bst.findSong("alpha"),
                "Duplicate title (case-insensitive) must be rejected");
    }

    @Test
    void duplicateDifferentCaseDoesNotCorruptTree() {
        bst.addSong("Gamma", "S3");
        bst.addSong("Alpha", "S1");
        bst.addSong("ALPHA", "S999"); // duplicate
        bst.addSong("Zeta",  "S4");

        assertEquals("S1", bst.findSong("Alpha"));
        assertEquals("S3", bst.findSong("Gamma"));
        assertEquals("S4", bst.findSong("Zeta"));
    }

    // ──────────────────────── prefix search — results ─────────────────────────

    @Test
    void prefixSearchReturnsMatchingTitles() {
        bst.addSong("Blinding Lights",     "S1");
        bst.addSong("Blackbird",           "S2");
        bst.addSong("Blue (Da Ba Dee)",    "S3");
        bst.addSong("Bohemian Rhapsody",   "S4");
        bst.addSong("Shape of You",        "S5");

        List<String> results = bst.prefixSearch("bl");
        assertTrue(results.contains("Blinding Lights"), "Should include 'Blinding Lights'");
        assertTrue(results.contains("Blackbird"),        "Should include 'Blackbird'");
        assertTrue(results.contains("Blue (Da Ba Dee)"), "Should include 'Blue (Da Ba Dee)'");
        assertFalse(results.contains("Bohemian Rhapsody"), "Should NOT include 'Bohemian Rhapsody'");
        assertFalse(results.contains("Shape of You"),      "Should NOT include 'Shape of You'");
    }

    @Test
    void prefixSearchResultsAreAlphabeticallySorted() {
        bst.addSong("Blinding Lights",     "S1");
        bst.addSong("Blue (Da Ba Dee)",    "S3");
        bst.addSong("Blackbird",           "S2");

        List<String> results = bst.prefixSearch("bl");
        assertEquals(3, results.size());
        // Alphabetical order (case-insensitive): Blackbird, Blinding Lights, Blue...
        assertEquals("Blackbird",        results.get(0));
        assertEquals("Blinding Lights",  results.get(1));
        assertEquals("Blue (Da Ba Dee)", results.get(2));
    }

    @Test
    void prefixSearchCaseInsensitive() {
        bst.addSong("Alpha Song", "S1");
        bst.addSong("Another Hit", "S2");

        List<String> results = bst.prefixSearch("AL");
        assertEquals(1, results.size());
        assertEquals("Alpha Song", results.get(0));
    }

    @Test
    void prefixSearchEmptyPrefixReturnsAll() {
        bst.addSong("Zeta",  "S1");
        bst.addSong("Alpha", "S2");
        bst.addSong("Mango", "S3");

        List<String> results = bst.prefixSearch("");
        assertEquals(3, results.size(), "Empty prefix must match all titles");
    }

    @Test
    void prefixSearchNoMatchReturnsEmptyList() {
        bst.addSong("Alpha", "S1");
        bst.addSong("Beta",  "S2");

        List<String> results = bst.prefixSearch("xyz");
        assertTrue(results.isEmpty(), "Unmatched prefix must return empty list");
    }

    @Test
    void prefixSearchNullReturnsEmptyList() {
        bst.addSong("Alpha", "S1");
        List<String> results = bst.prefixSearch(null);
        assertTrue(results.isEmpty());
    }

    // ──────────────────────── prefix search — pruning correctness ─────────────

    @Test
    void prefixSearchDoesNotReturnFalsePositives() {
        // Insert titles on both sides of the prefix range.
        bst.addSong("Abracadabra",    "S1"); // < "bl"
        bst.addSong("Blinding Lights","S2"); // matches
        bst.addSong("Blackbird",      "S3"); // matches
        bst.addSong("Computer Love",  "S4"); // > "bl"

        List<String> results = bst.prefixSearch("bl");
        assertEquals(2, results.size());
        assertFalse(results.contains("Abracadabra"),   "Must not include 'Abracadabra'");
        assertFalse(results.contains("Computer Love"), "Must not include 'Computer Love'");
    }

    // ──────────────────────── BST structure ───────────────────────────────────

    @Test
    void addSongNullThrows() {
        assertThrows(IllegalArgumentException.class, () -> bst.addSong(null, "S1"));
        assertThrows(IllegalArgumentException.class, () -> bst.addSong("Title", null));
    }

    @Test
    void isEmptyInitially() {
        assertTrue(bst.isEmpty());
    }

    @Test
    void notEmptyAfterAdd() {
        bst.addSong("Song", "S1");
        assertFalse(bst.isEmpty());
    }

    // ──────────────────────── BST ordering structure ──────────────────────────

    @Test
    void bstRootIsFirstAddedTitle() {
        bst.addSong("Mango", "S1");
        bst.addSong("Apple", "S2");
        bst.addSong("Zebra", "S3");

        SongBST.BSTNode root = bst.getRoot();
        assertEquals("Mango", root.title);
        assertEquals("Apple", root.left.title);
        assertEquals("Zebra", root.right.title);
    }
}

