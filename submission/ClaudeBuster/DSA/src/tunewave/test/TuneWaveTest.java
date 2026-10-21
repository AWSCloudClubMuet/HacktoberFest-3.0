package tunewave.test;

import tunewave.model.Song;
import tunewave.player.TuneWavePlayer;

import java.util.List;

/**
 * Comprehensive Automated Test Suite for TuneWave Music Player.
 * Validates all three milestones against all specified rules and edge cases.
 */
public class TuneWaveTest {

    private static int testsPassed = 0;
    private static int testsFailed = 0;

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("     TUNEWAVE CORE VERIFICATION TEST SUITE   ");
        System.out.println("=================================================");

        // Milestone 1 Tests
        runTest("M1: Add song and prevent duplicates via Hash Map", TuneWaveTest::testAddSongDuplicateCheck);
        runTest("M1: Rejected duplicate ID does not leak into search", TuneWaveTest::testRejectedDuplicateNotSearchable);
        runTest("M1: Playlist forward navigation via next()", TuneWaveTest::testPlaylistForwardTraversal);
        runTest("M1: next() with repeat OFF stays on last song and returns 'end'", TuneWaveTest::testNextRepeatOff);
        runTest("M1: next() with repeat ON wraps to first song", TuneWaveTest::testNextRepeatOn);
        runTest("M1: previous() navigation through doubly linked list", TuneWaveTest::testPreviousNavigation);
        runTest("M1: removeSong removes node in O(1) and updates pointers", TuneWaveTest::testRemoveSongMiddle);
        runTest("M1: removeSong adjusts current pointer when playing song removed", TuneWaveTest::testRemoveCurrentSong);
        runTest("M1: toggleRepeat toggles state correctly", TuneWaveTest::testToggleRepeat);

        // Milestone 2 Tests
        runTest("M2: Up Next queue plays BEFORE playlist continues", TuneWaveTest::testUpNextPriority);
        runTest("M2: addToUpNext rejects unknown song IDs", TuneWaveTest::testUpNextRejectsUnknownId);
        runTest("M2: Playing from Up Next does NOT move playlist position", TuneWaveTest::testUpNextDoesNotMovePlaylistPosition);
        runTest("M2: History keeps last 10 songs played and drops oldest", TuneWaveTest::testHistoryKeepsLast10AndDropsOldest);
        runTest("M2: back() replays top song and removes from history", TuneWaveTest::testBackReplaysAndRemovesFromHistory);
        runTest("M2: back() does NOT move playlist position", TuneWaveTest::testBackDoesNotMovePlaylistPosition);

        // Milestone 3 Tests
        runTest("M3: BST insert and findSong by title", TuneWaveTest::testBstInsertAndFindSong);
        runTest("M3: prefixSearch returns matches in alphabetical order with subtree pruning", TuneWaveTest::testPrefixSearch);
        runTest("M3: Undirected artist graph relation addition", TuneWaveTest::testArtistGraphRelations);
        runTest("M3: recommendArtists returns artists exactly 2 links away", TuneWaveTest::testRecommendArtistsTwoLinksAway);
        runTest("M3: recommendArtists excludes direct relations and self", TuneWaveTest::testRecommendArtistsExcludesDirectRelations);
        runTest("M3: recommendArtists returns in alphabetical order", TuneWaveTest::testRecommendArtistsAlphabeticalOrder);

        System.out.println("=================================================");
        System.out.printf("TOTAL TESTS: %d | PASSED: %d | FAILED: %d\n",
                (testsPassed + testsFailed), testsPassed, testsFailed);
        System.out.println("=================================================");

        if (testsFailed > 0) {
            System.exit(1);
        }
    }

    private static void runTest(String testName, Runnable test) {
        try {
            test.run();
            testsPassed++;
            System.out.printf(" [PASS] %s\n", testName);
        } catch (AssertionError | Exception e) {
            testsFailed++;
            System.err.printf(" [FAIL] %s -> %s\n", testName, e.getMessage());
        }
    }

    private static void assertTrue(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    private static void assertEquals(Object expected, Object actual, String message) {
        if (expected == null && actual == null) return;
        if (expected != null && expected.equals(actual)) return;
        throw new AssertionError(String.format("%s (Expected: %s, Got: %s)", message, expected, actual));
    }

    // =========================================================================
    // MILESTONE 1 TESTS
    // =========================================================================

    private static void testAddSongDuplicateCheck() {
        TuneWavePlayer player = new TuneWavePlayer();
        Song song1 = new Song("S1", "Bohemian Rhapsody", "Queen");
        Song song2 = new Song("S2", "Shape of You", "Ed Sheeran");
        Song duplicateSong = new Song("S1", "Bohemian Rhapsody (Remastered)", "Queen");

        assertTrue(player.addSong(song1), "First song should be added");
        assertTrue(player.addSong(song2), "Second song should be added");
        assertTrue(!player.addSong(duplicateSong), "Duplicate song ID should be rejected by Hash Map");
        assertEquals(2, player.getPlaylistSize(), "Playlist size must remain 2");
    }

    private static void testRejectedDuplicateNotSearchable() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("S1", "Real Song", "A"));
        assertTrue(!player.addSong(new Song("S1", "Ghost Song", "B")), "Duplicate ID must be rejected");
        assertTrue(player.findSong("Ghost Song") == null, "Rejected song must not be findable");
        assertEquals(0, player.prefixSearch("Ghost").size(), "Rejected song must not appear in prefix search");
    }

    private static void testPlaylistForwardTraversal() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("S1", "Song One"));
        player.addSong(new Song("S2", "Song Two"));
        player.addSong(new Song("S3", "Song Three"));

        Object next1 = player.next();
        assertTrue(next1 instanceof Song, "next() should return Song");
        assertEquals("S2", ((Song) next1).getSongId(), "Should advance to S2");

        Object next2 = player.next();
        assertEquals("S3", ((Song) next2).getSongId(), "Should advance to S3");
    }

    private static void testNextRepeatOff() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("S1", "First Song"));
        player.addSong(new Song("S2", "Last Song"));

        player.next(); // At S2 (last song)
        Object result = player.next(); // Try to move past last song

        assertEquals("end", result, "When repeat is off, next() on last song must return 'end'");
        assertEquals("S2", player.getCurrentPlaylistSong().getSongId(), "Must stay on the last song");
    }

    private static void testNextRepeatOn() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("S1", "First Song"));
        player.addSong(new Song("S2", "Second Song"));

        player.toggleRepeat(); // Repeat is now ON
        assertTrue(player.isRepeat(), "Repeat should be ON");

        player.next(); // At S2 (last song)
        Object wrapped = player.next(); // Should wrap to first

        assertTrue(wrapped instanceof Song, "Wrapped result must be Song");
        assertEquals("S1", ((Song) wrapped).getSongId(), "With repeat on, next() on last song must wrap to first");
    }

    private static void testPreviousNavigation() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("S1", "First Song"));
        player.addSong(new Song("S2", "Second Song"));
        player.addSong(new Song("S3", "Third Song"));

        player.next(); // at S2
        player.next(); // at S3

        Object prev1 = player.previous();
        assertEquals("S2", ((Song) prev1).getSongId(), "previous() should move to S2");

        Object prev2 = player.previous();
        assertEquals("S1", ((Song) prev2).getSongId(), "previous() should move to S1");
    }

    private static void testRemoveSongMiddle() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("S1", "First"));
        player.addSong(new Song("S2", "Second"));
        player.addSong(new Song("S3", "Third"));

        assertTrue(player.removeSong("S2"), "removeSong should return true for existing song");
        assertEquals(2, player.getPlaylistSize(), "Size should be 2 after removal");
        assertTrue(!player.removeSong("S2"), "Second removal attempt should return false (O(1) hash map check)");

        // Traverse to verify pointers linked correctly across removed node
        player.next(); // from S1, next should be S3 now
        assertEquals("S3", player.getCurrentPlaylistSong().getSongId(), "Next node should be S3 after S2 removed");
    }

    private static void testRemoveCurrentSong() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("S1", "Song 1"));
        player.addSong(new Song("S2", "Song 2"));

        player.next(); // Current is S2
        assertEquals("S2", player.getCurrentPlaylistSong().getSongId(), "Current should be S2");

        player.removeSong("S2");
        assertEquals("S1", player.getCurrentPlaylistSong().getSongId(), "Current should shift back to S1");
    }

    private static void testToggleRepeat() {
        TuneWavePlayer player = new TuneWavePlayer();
        assertTrue(!player.isRepeat(), "Initial repeat should be false");
        assertTrue(player.toggleRepeat(), "First toggle should enable repeat");
        assertTrue(player.isRepeat(), "Repeat should be true");
        assertTrue(!player.toggleRepeat(), "Second toggle should disable repeat");
        assertTrue(!player.isRepeat(), "Repeat should be false");
    }

    // =========================================================================
    // MILESTONE 2 TESTS
    // =========================================================================

    private static void testUpNextPriority() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("P1", "Playlist Track 1"));
        player.addSong(new Song("P2", "Playlist Track 2"));

        // Add song to Up Next
        Song upNextSong = new Song("Q1", "Queued Track 1");
        player.addSong(upNextSong); // Register
        player.addToUpNext("Q1");

        // playNext should play Up Next song BEFORE moving playlist
        Object played = player.playNext();
        assertTrue(played instanceof Song, "playNext() must return Song");
        assertEquals("Q1", ((Song) played).getSongId(), "Up Next song must play before playlist continues");
    }

    private static void testUpNextRejectsUnknownId() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("P1", "Playlist 1"));
        assertTrue(!player.addToUpNext("NOPE"), "Unknown ID must not be queued");
        assertEquals(0, player.getUpNextSize(), "Up Next must stay empty");
        assertTrue(player.addToUpNext("P1"), "Known ID can be queued");
    }

    private static void testUpNextDoesNotMovePlaylistPosition() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("P1", "Playlist 1"));
        player.addSong(new Song("P2", "Playlist 2"));

        assertEquals("P1", player.getCurrentPlaylistSong().getSongId(), "Playlist starts at P1");

        // Queue Up Next
        player.addToUpNext("P2");
        player.playNext(); // Plays P2 from Up Next

        assertEquals("P1", player.getCurrentPlaylistSong().getSongId(),
                "Playing from Up Next must NOT move playlist position!");
    }

    private static void testHistoryKeepsLast10AndDropsOldest() {
        TuneWavePlayer player = new TuneWavePlayer();

        // Add and play 15 distinct songs
        for (int i = 1; i <= 15; i++) {
            Song s = new Song("H" + i, "History Song " + i);
            player.addSong(s);
            if (i > 1) {
                player.playNext();
            }
        }

        assertEquals(10, player.getHistorySize(), "History must keep at most 10 songs");

        List<Song> history = player.getHistorySongs();
        // Top of history should be H14 (since H15 is currently playing)
        assertEquals("H14", history.get(0).getSongId(), "Top of history should be most recently played (H14)");
        // Bottom (oldest remaining) should be H5 (H1..H4 dropped)
        assertEquals("H5", history.get(history.size() - 1).getSongId(),
                "Oldest remaining in history should be H5, earlier songs dropped");
    }

    private static void testBackReplaysAndRemovesFromHistory() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("T1", "Track 1"));
        player.addSong(new Song("T2", "Track 2"));

        player.playNext(); // Plays T2; T1 pushed to history
        assertEquals(1, player.getHistorySize(), "History should have 1 song");

        Object replayed = player.back();
        assertTrue(replayed instanceof Song, "back() should return Song");
        assertEquals("T1", ((Song) replayed).getSongId(), "back() must replay T1");
        assertEquals(0, player.getHistorySize(), "back() must remove replayed song from history");
    }

    private static void testBackDoesNotMovePlaylistPosition() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("T1", "Track 1"));
        player.addSong(new Song("T2", "Track 2"));
        player.addSong(new Song("T3", "Track 3"));

        player.playNext(); // currentPlaylist at T2
        player.playNext(); // currentPlaylist at T3
        assertEquals("T3", player.getCurrentPlaylistSong().getSongId(), "Playlist is at T3");

        player.back(); // replays T2 from history
        assertEquals("T3", player.getCurrentPlaylistSong().getSongId(),
                "Playing from history must NOT move playlist position!");
    }

    // =========================================================================
    // MILESTONE 3 TESTS
    // =========================================================================

    private static void testBstInsertAndFindSong() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong("Bohemian Rhapsody", "B1");
        player.addSong("Hotel California", "H1");
        player.addSong("Stairway to Heaven", "S1");

        Song found = player.findSong("Hotel California");
        assertTrue(found != null, "findSong should find existing song");
        assertEquals("H1", found.getSongId(), "Found song ID should match");

        Song notFound = player.findSong("Nonexistent Track");
        assertTrue(notFound == null, "findSong should return null for absent song");
    }

    private static void testPrefixSearch() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong("Blinding Lights", "1");
        player.addSong("Bad Guy", "2");
        player.addSong("Believer", "3");
        player.addSong("Bohemian Rhapsody", "4");
        player.addSong("Despacito", "5");
        player.addSong("Demons", "6");
        player.addSong("Shape of You", "7");

        List<String> bMatches = player.prefixSearch("B");
        assertEquals(4, bMatches.size(), "Should find 4 songs starting with 'B'");
        assertEquals("Bad Guy", bMatches.get(0), "Matches must be in alphabetical order (1st: Bad Guy)");
        assertEquals("Believer", bMatches.get(1), "Matches must be in alphabetical order (2nd: Believer)");
        assertEquals("Blinding Lights", bMatches.get(2), "Matches must be in alphabetical order (3rd: Blinding Lights)");
        assertEquals("Bohemian Rhapsody", bMatches.get(3), "Matches must be in alphabetical order (4th: Bohemian Rhapsody)");

        List<String> deMatches = player.prefixSearch("De");
        assertEquals(2, deMatches.size(), "Should find 2 songs starting with 'De'");
        assertEquals("Demons", deMatches.get(0), "Alphabetical 1st: Demons");
        assertEquals("Despacito", deMatches.get(1), "Alphabetical 2nd: Despacito");
    }

    private static void testArtistGraphRelations() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addRelation("Queen", "David Bowie");
        player.addRelation("Queen", "The Beatles");

        // Verify undirected: Bowie should be connected to Queen
        List<String> recs = player.recommendArtists("David Bowie");
        // Queen is link 1, Beatles is link 2 from Bowie through Queen!
        assertTrue(recs.contains("The Beatles"), "David Bowie should be recommended The Beatles via Queen");
    }

    private static void testRecommendArtistsTwoLinksAway() {
        TuneWavePlayer player = new TuneWavePlayer();
        // A <-> B, A <-> C
        // B <-> D
        // C <-> E
        player.addRelation("ArtistA", "ArtistB");
        player.addRelation("ArtistA", "ArtistC");
        player.addRelation("ArtistB", "ArtistD");
        player.addRelation("ArtistC", "ArtistE");

        List<String> recs = player.recommendArtists("ArtistA");
        assertEquals(2, recs.size(), "Should recommend exactly 2 artists two links away");
        assertTrue(recs.contains("ArtistD"), "Should recommend ArtistD");
        assertTrue(recs.contains("ArtistE"), "Should recommend ArtistE");
    }

    private static void testRecommendArtistsExcludesDirectRelations() {
        TuneWavePlayer player = new TuneWavePlayer();
        // Taylor Swift <-> Ed Sheeran
        // Taylor Swift <-> Selena Gomez
        // Ed Sheeran <-> Shawn Mendes
        // Ed Sheeran <-> Justin Bieber
        // Taylor Swift <-> Justin Bieber (DIRECT link!)
        player.addRelation("Taylor Swift", "Ed Sheeran");
        player.addRelation("Taylor Swift", "Selena Gomez");
        player.addRelation("Ed Sheeran", "Shawn Mendes");
        player.addRelation("Ed Sheeran", "Justin Bieber");
        player.addRelation("Taylor Swift", "Justin Bieber"); // Direct relation!

        List<String> recs = player.recommendArtists("Taylor Swift");
        assertTrue(recs.contains("Shawn Mendes"), "Shawn Mendes is 2 links away and not direct");
        assertTrue(!recs.contains("Justin Bieber"), "Justin Bieber is already directly related, MUST be excluded");
        assertTrue(!recs.contains("Ed Sheeran"), "Ed Sheeran is directly related, MUST be excluded");
        assertTrue(!recs.contains("Taylor Swift"), "Self MUST be excluded");
    }

    private static void testRecommendArtistsAlphabeticalOrder() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addRelation("Center", "Hub");
        player.addRelation("Hub", "Zebra");
        player.addRelation("Hub", "Alpha");
        player.addRelation("Hub", "Middle");

        List<String> recs = player.recommendArtists("Center");
        assertEquals(3, recs.size(), "Should recommend 3 artists");
        assertEquals("Alpha", recs.get(0), "1st in alphabetical order must be Alpha");
        assertEquals("Middle", recs.get(1), "2nd in alphabetical order must be Middle");
        assertEquals("Zebra", recs.get(2), "3rd in alphabetical order must be Zebra");
    }
}
