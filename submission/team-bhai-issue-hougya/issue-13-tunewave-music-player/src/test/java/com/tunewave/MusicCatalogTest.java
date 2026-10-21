package com.tunewave;

import java.util.List;
import static com.tunewave.TestAssertions.*;

/**
 * Dependency-free tests for Milestone 3: SongBST and ArtistGraph.
 */
public class MusicCatalogTest {

    // =========================================================================
    // BST Tests
    // =========================================================================

    public void testInsertAndFind() {
        SongBST bst = new SongBST();
        bst.addSong("Yesterday", "S1");
        bst.addSong("Hey Jude", "S2");
        bst.addSong("Let It Be", "S3");

        List<String> results = bst.findSong("Hey Jude");
        assertEquals(1, results.size(), "Should find 1 song");
        assertEquals("S2", results.get(0), "ID should be S2");

        // Case-insensitive lookup
        List<String> lowerResults = bst.findSong("hey jude");
        assertEquals(1, lowerResults.size(), "Case-insensitive lookup should succeed");
        assertEquals("S2", lowerResults.get(0));
    }

    public void testSearchMissingTitle() {
        SongBST bst = new SongBST();
        bst.addSong("Yesterday", "S1");
        List<String> results = bst.findSong("Nonexistent");
        assertNotNull(results);
        assertTrue(results.isEmpty(), "Missing title search must return empty list");
    }

    public void testDuplicateTitles() {
        SongBST bst = new SongBST();
        bst.addSong("Hello", "ADELE_1");
        bst.addSong("Hello", "LIONEL_1");
        bst.addSong("hello", "MARTIN_1"); // Case-insensitive duplicate

        List<String> results = bst.findSong("Hello");
        assertEquals(3, results.size(), "Should contain 3 song IDs for duplicate title 'Hello'");
        assertTrue(results.contains("ADELE_1"));
        assertTrue(results.contains("LIONEL_1"));
        assertTrue(results.contains("MARTIN_1"));
    }

    public void testRepeatedInsertion() {
        SongBST bst = new SongBST();
        bst.addSong("Imagine", "J1");
        bst.addSong("Imagine", "J1");
        List<String> results = bst.findSong("Imagine");
        assertEquals(1, results.size(), "Identical song ID should be deduplicated");
        assertEquals("J1", results.get(0));
    }

    public void testPrefixSearchAlphabetical() {
        SongBST bst = new SongBST();
        bst.addSong("Bohemian Rhapsody", "1");
        bst.addSong("Boulevard of Broken Dreams", "2");
        bst.addSong("Borderline", "3");
        bst.addSong("Born to Run", "4");
        bst.addSong("Stairway to Heaven", "5");

        List<String> matches = bst.prefixSearch("bo");
        assertEquals(4, matches.size(), "Prefix 'bo' should match 4 songs");
        assertEquals("Bohemian Rhapsody", matches.get(0));
        assertEquals("Borderline", matches.get(1));
        assertEquals("Born to Run", matches.get(2));
        assertEquals("Boulevard of Broken Dreams", matches.get(3));
    }

    public void testPrefixSearchNoMatches() {
        SongBST bst = new SongBST();
        bst.addSong("Song A", "1");
        bst.addSong("Song B", "2");

        List<String> matches = bst.prefixSearch("Z");
        assertNotNull(matches);
        assertTrue(matches.isEmpty(), "Prefix with no matches must return empty list");
    }

    public void testPrefixSearchEmptyTree() {
        SongBST bst = new SongBST();
        List<String> matches = bst.prefixSearch("A");
        assertNotNull(matches);
        assertTrue(matches.isEmpty(), "Prefix search on empty tree must return empty list");
    }

    public void testEmptyPrefixReturnsAllAlphabetical() {
        SongBST bst = new SongBST();
        bst.addSong("Delta", "4");
        bst.addSong("Alpha", "1");
        bst.addSong("Charlie", "3");
        bst.addSong("Bravo", "2");

        List<String> matches = bst.prefixSearch("");
        assertEquals(4, matches.size(), "Empty prefix should return all titles");
        assertEquals("Alpha", matches.get(0));
        assertEquals("Bravo", matches.get(1));
        assertEquals("Charlie", matches.get(2));
        assertEquals("Delta", matches.get(3));

        List<String> nullPrefixMatches = bst.prefixSearch(null);
        assertEquals(4, nullPrefixMatches.size(), "Null prefix should return all titles");
    }

    public void testSubtreePruning() {
        SongBST bst = new SongBST();
        // Construct a balanced tree of 15 nodes:
        //                 M (root)
        //              /           \
        //          D                   T
        //        /   \               /   \
        //       B     F             P     X
        //      / \   / \           / \   / \
        //     A   C E   G         O   Q W   Z

        bst.addSong("M", "M");
        bst.addSong("D", "D");
        bst.addSong("T", "T");
        bst.addSong("B", "B");
        bst.addSong("F", "F");
        bst.addSong("P", "P");
        bst.addSong("X", "X");
        bst.addSong("A", "A");
        bst.addSong("C", "C");
        bst.addSong("E", "E");
        bst.addSong("G", "G");
        bst.addSong("O", "O");
        bst.addSong("Q", "Q");
        bst.addSong("W", "W");
        bst.addSong("Z", "Z");

        assertEquals(15, bst.size());

        // Search for prefix "B"
        int[] visitedCount = new int[1];
        List<String> results = bst.prefixSearch("B", visitedCount);

        assertEquals(1, results.size());
        assertEquals("B", results.get(0));

        // Subtree pruning must ensure visited nodes are far fewer than total tree size
        assertTrue(visitedCount[0] < 10, "Visited " + visitedCount[0] + " nodes out of 15; pruning verified!");
    }

    public void testPrefixSearchRightSubtreeBranch() {
        SongBST bst = new SongBST();
        bst.addSong("Apple", "1");
        bst.addSong("Banana", "2");
        bst.addSong("Cherry", "3");

        List<String> matches = bst.prefixSearch("Ba");
        assertEquals(1, matches.size());
        assertEquals("Banana", matches.get(0));
    }

    public void testPrefixPruningBothLeftAndRightSubtrees() {
        SongBST bst = new SongBST();
        // Construct tree:
        //        M
        //      /   \
        //     D     T
        //    / \   / \
        //   B   F P   X
        bst.addSong("M", "1");
        bst.addSong("D", "2");
        bst.addSong("T", "3");
        bst.addSong("B", "4");
        bst.addSong("F", "5");
        bst.addSong("P", "6");
        bst.addSong("X", "7");

        // Test 1: Searching for "B"
        // "M" > "B" -> right subtree of M (T, P, X) MUST be pruned!
        int[] countRightPruned = new int[1];
        List<String> bResults = bst.prefixSearch("B", countRightPruned);
        assertEquals(1, bResults.size());
        assertEquals("B", bResults.get(0));
        // Visited should only be M, D, B (3 nodes, pruned T, P, X, F)
        assertTrue(countRightPruned[0] <= 4, "Right subtree of M must be pruned when searching for 'B'");

        // Test 2: Searching for "X"
        // "M" < "X" -> left subtree of M (D, B, F) MUST be pruned!
        int[] countLeftPruned = new int[1];
        List<String> xResults = bst.prefixSearch("X", countLeftPruned);
        assertEquals(1, xResults.size());
        assertEquals("X", xResults.get(0));
        // Visited should only be M, T, X (3 nodes, pruned D, B, F, P)
        assertTrue(countLeftPruned[0] <= 4, "Left subtree of M must be pruned when searching for 'X'");
    }

    public void testDuplicateTitlesAndCase() {
        SongBST bst = new SongBST();
        bst.addSong("Starboy", "ID_1");
        bst.addSong("starboy", "ID_2");
        bst.addSong("STARBOY", "ID_3");
        bst.addSong("sTaRbOy", "ID_4");

        // BST should have 1 unique title node
        assertEquals(1, bst.size());

        // Find by any case variation
        List<String> r1 = bst.findSong("Starboy");
        assertEquals(4, r1.size(), "Must contain all 4 IDs");
        assertTrue(r1.contains("ID_1"));
        assertTrue(r1.contains("ID_2"));
        assertTrue(r1.contains("ID_3"));
        assertTrue(r1.contains("ID_4"));

        List<String> r2 = bst.findSong("STARBOY");
        assertEquals(4, r2.size());

        List<String> r3 = bst.findSong("starboy");
        assertEquals(4, r3.size());

        // Prefix search
        List<String> prefixMatches = bst.prefixSearch("STAR");
        assertEquals(1, prefixMatches.size());
        assertEquals("Starboy", prefixMatches.get(0));
    }

    // =========================================================================
    // Artist Graph Tests
    // =========================================================================

    public void testBidirectionalRelation() {
        ArtistGraph graph = new ArtistGraph();
        assertTrue(graph.addRelation("Queen", "David Bowie"));
        assertTrue(graph.hasRelation("Queen", "David Bowie"), "Queen -> David Bowie must exist");
        assertTrue(graph.hasRelation("David Bowie", "Queen"), "David Bowie -> Queen must exist");
    }

    public void testDuplicateRelations() {
        ArtistGraph graph = new ArtistGraph();
        assertTrue(graph.addRelation("Artist1", "Artist2"));
        // Adding again in either direction returns true but does not duplicate edge
        graph.addRelation("Artist1", "Artist2");
        graph.addRelation("Artist2", "Artist1");

        assertEquals(1, graph.getNeighbors("Artist1").size(), "Duplicate relations must not increase neighbor count");
        assertEquals(1, graph.getNeighbors("Artist2").size());
    }

    public void testSelfRelationsRejected() {
        ArtistGraph graph = new ArtistGraph();
        assertFalse(graph.addRelation("SoloArtist", "SoloArtist"), "Self-relation must be rejected");
        assertFalse(graph.addRelation("SoloArtist", "soloartist"), "Case-insensitive self-relation must be rejected");
        assertEquals(0, graph.getNeighbors("SoloArtist").size());
    }

    public void testTwoEdgeRecommendations() {
        ArtistGraph graph = new ArtistGraph();
        // A - B - C
        // A - D - E
        graph.addRelation("ArtistA", "ArtistB");
        graph.addRelation("ArtistB", "ArtistC");
        graph.addRelation("ArtistA", "ArtistD");
        graph.addRelation("ArtistD", "ArtistE");

        List<String> recs = graph.recommendArtists("ArtistA");
        // Distance 0: ArtistA (excluded)
        // Distance 1: ArtistB, ArtistD (excluded)
        // Distance 2: ArtistC, ArtistE (included, sorted)
        assertEquals(2, recs.size());
        assertEquals("ArtistC", recs.get(0));
        assertEquals("ArtistE", recs.get(1));
    }

    public void testDirectNeighborsExcluded() {
        ArtistGraph graph = new ArtistGraph();
        // Triangle: A - B, B - C, A - C
        // Path from A to C via B has length 2, but C is also a direct neighbor of A (distance 1)
        graph.addRelation("A", "B");
        graph.addRelation("B", "C");
        graph.addRelation("A", "C");

        List<String> recs = graph.recommendArtists("A");
        assertTrue(recs.isEmpty(), "Direct neighbor C must be excluded even if reachable in 2 hops");
    }

    public void testOriginalArtistExcluded() {
        ArtistGraph graph = new ArtistGraph();
        // A - B - A
        graph.addRelation("A", "B");
        List<String> recs = graph.recommendArtists("A");
        assertFalse(recs.contains("A"), "Original artist must not be recommended to themselves");
    }

    public void testDeduplicateRecommendations() {
        ArtistGraph graph = new ArtistGraph();
        graph.addRelation("A", "B");
        graph.addRelation("A", "C");
        graph.addRelation("B", "Candidate");
        graph.addRelation("C", "Candidate");

        List<String> recs = graph.recommendArtists("A");
        assertEquals(1, recs.size());
        assertEquals("Candidate", recs.get(0));
    }

    public void testDiamondGraphPaths() {
        ArtistGraph graph = new ArtistGraph();
        graph.addRelation("A", "N1");
        graph.addRelation("A", "N2");
        graph.addRelation("A", "N3");
        graph.addRelation("N1", "Target");
        graph.addRelation("N2", "Target");
        graph.addRelation("N3", "Target");

        List<String> recs = graph.recommendArtists("A");
        assertEquals(1, recs.size());
        assertEquals("Target", recs.get(0));
    }

    public void testTriangleGraphExclusion() {
        ArtistGraph graph = new ArtistGraph();
        // A is connected to B and C
        // B is connected to C (triangle between A, B, C)
        // C is connected to D (D is 2 hops from A via C)
        // B is connected to E (E is 2 hops from A via B)
        graph.addRelation("A", "B");
        graph.addRelation("A", "C");
        graph.addRelation("B", "C");
        graph.addRelation("C", "D");
        graph.addRelation("B", "E");

        List<String> recs = graph.recommendArtists("A");
        // Distance 0: A
        // Distance 1: B, C
        // Distance 2: D (via C), E (via B). Notice: B via C is distance 1, so excluded!
        assertEquals(2, recs.size());
        assertEquals("D", recs.get(0));
        assertEquals("E", recs.get(1));
    }

    public void testUnknownOrIsolatedArtist() {
        ArtistGraph graph = new ArtistGraph();
        assertTrue(graph.recommendArtists("UnknownArtist").isEmpty());
        assertTrue(graph.recommendArtists(null).isEmpty());
        assertTrue(graph.recommendArtists("").isEmpty());
    }
}
