package tunewave;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link ArtistGraph} — undirected adjacency-list graph.
 *
 * Covers: distance-2 recommendations, direct-neighbor exclusion, self/self-
 * relation handling, unknown artists, duplicate relations, sorting,
 * deduplication.
 */
class ArtistGraphTest {

    private ArtistGraph graph;

    @BeforeEach
    void setUp() {
        graph = new ArtistGraph();
    }

    // ──────────────────────── undirected relations ────────────────────────────

    @Test
    void relationIsUndirected() {
        graph.addRelation("A", "B");
        assertTrue(graph.getNeighbors("A").contains("B"));
        assertTrue(graph.getNeighbors("B").contains("A"));
    }

    @Test
    void duplicateRelationIgnored() {
        graph.addRelation("A", "B");
        graph.addRelation("A", "B"); // duplicate
        graph.addRelation("B", "A"); // reverse duplicate

        // Neighbor set should still contain exactly one "B".
        assertEquals(1, graph.getNeighbors("A").size());
    }

    @Test
    void selfRelationIgnored() {
        graph.addRelation("A", "A");
        // "A" should not appear in its own neighbor set.
        assertFalse(graph.getNeighbors("A").contains("A"));
    }

    @Test
    void nullArtistThrows() {
        assertThrows(IllegalArgumentException.class, () -> graph.addRelation(null, "B"));
        assertThrows(IllegalArgumentException.class, () -> graph.addRelation("A", null));
    }

    // ──────────────────────── distance-2 recommendations ─────────────────────

    @Test
    void basicDistance2Recommendation() {
        // A — B — C  → C is distance 2 from A
        graph.addRelation("A", "B");
        graph.addRelation("B", "C");

        List<String> recs = graph.recommendArtists("A");
        assertEquals(List.of("C"), recs);
    }

    @Test
    void directNeighborExcluded() {
        // A — B — C, A — C (direct link)
        graph.addRelation("A", "B");
        graph.addRelation("B", "C");
        graph.addRelation("A", "C"); // direct → must NOT appear in recommendations for A

        List<String> recs = graph.recommendArtists("A");
        assertFalse(recs.contains("C"), "Direct neighbor must be excluded from recommendations");
    }

    @Test
    void selfExcludedFromRecommendations() {
        // A — B — A  (cycle back to self)
        graph.addRelation("A", "B");
        graph.addRelation("B", "A"); // same edge (ignored), but let's test with a triangle
        graph.addRelation("B", "C");

        List<String> recs = graph.recommendArtists("A");
        assertFalse(recs.contains("A"), "Requested artist must not appear in its own recommendations");
    }

    @Test
    void deduplicationOfRecommendations() {
        // A — B — D
        // A — C — D  → D reachable via two paths; must appear only once
        graph.addRelation("A", "B");
        graph.addRelation("A", "C");
        graph.addRelation("B", "D");
        graph.addRelation("C", "D");

        List<String> recs = graph.recommendArtists("A");
        assertEquals(1, recs.stream().filter("D"::equals).count(),
                "D must appear exactly once even though reachable via two paths");
    }

    @Test
    void recommendationsAreSortedAlphabetically() {
        graph.addRelation("A", "B");
        graph.addRelation("B", "Zara");
        graph.addRelation("B", "Mike");
        graph.addRelation("B", "Anna");

        List<String> recs = graph.recommendArtists("A");
        assertEquals(List.of("Anna", "Mike", "Zara"), recs,
                "Recommendations must be in alphabetical order");
    }

    @Test
    void unknownArtistReturnsEmptyList() {
        List<String> recs = graph.recommendArtists("Ghost");
        assertTrue(recs.isEmpty());
    }

    @Test
    void nullArtistReturnsEmptyList() {
        List<String> recs = graph.recommendArtists(null);
        assertTrue(recs.isEmpty());
    }

    @Test
    void artistWithNoConnectionsReturnsEmptyList() {
        graph.addRelation("A", "B");
        // Query C who has no edges at all
        List<String> recs = graph.recommendArtists("C");
        assertTrue(recs.isEmpty());
    }

    @Test
    void noDistance2ArtistsWhenNeighborsHaveNoFurtherLinks() {
        // A — B (B has no other neighbors)
        graph.addRelation("A", "B");
        List<String> recs = graph.recommendArtists("A");
        assertTrue(recs.isEmpty(),
                "No recommendations if neighbors have no further connections");
    }

    // ──────────────────────── larger graph ───────────────────────────────────

    @Test
    void largerGraphDistance2() {
        // Weeknd — Drake — Nicki, Future
        // Weeknd — Daft Punk (no further links in this test)
        graph.addRelation("The Weeknd", "Drake");
        graph.addRelation("The Weeknd", "Daft Punk");
        graph.addRelation("Drake",      "Nicki Minaj");
        graph.addRelation("Drake",      "Future");

        List<String> recs = graph.recommendArtists("The Weeknd");
        assertTrue(recs.contains("Nicki Minaj"), "Nicki Minaj should be recommended");
        assertTrue(recs.contains("Future"),       "Future should be recommended");
        assertFalse(recs.contains("Drake"),       "Drake is a direct neighbor — exclude");
        assertFalse(recs.contains("Daft Punk"),   "Daft Punk is a direct neighbor — exclude");
        assertFalse(recs.contains("The Weeknd"),  "Self must be excluded");
    }

    @Test
    void getAllArtistsIncludesAllNodes() {
        graph.addRelation("A", "B");
        graph.addRelation("C", "D");
        assertTrue(graph.getAllArtists().containsAll(List.of("A", "B", "C", "D")));
    }

    @Test
    void isEmptyWhenNoRelations() {
        assertTrue(graph.isEmpty());
    }
}

