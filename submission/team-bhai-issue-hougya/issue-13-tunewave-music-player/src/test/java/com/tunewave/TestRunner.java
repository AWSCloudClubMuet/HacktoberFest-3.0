package com.tunewave;

import java.util.ArrayList;
import java.util.List;

public class TestRunner {

    @FunctionalInterface
    interface TestCase {
        void run() throws Throwable;
    }

    static class TestEntry {
        final String category;
        final String name;
        final TestCase testCase;

        TestEntry(String category, String name, TestCase testCase) {
            this.category = category;
            this.name = name;
            this.testCase = testCase;
        }
    }

    public static void main(String[] args) {
        System.out.println("Running TuneWave Test Suite...\n");

        List<TestEntry> tests = new ArrayList<>();

        // Playlist Tests
        PlaylistManagerTest plt = new PlaylistManagerTest();
        tests.add(new TestEntry("Playlist", "testAddSong", plt::testAddSong));
        tests.add(new TestEntry("Playlist", "testRejectDuplicateSongId", plt::testRejectDuplicateSongId));
        tests.add(new TestEntry("Playlist", "testRemoveHead", plt::testRemoveHead));
        tests.add(new TestEntry("Playlist", "testRemoveTail", plt::testRemoveTail));
        tests.add(new TestEntry("Playlist", "testRemoveMiddle", plt::testRemoveMiddle));
        tests.add(new TestEntry("Playlist", "testRemoveCurrentSong", plt::testRemoveCurrentSong));
        tests.add(new TestEntry("Playlist", "testSequentialRemovalOfCurrentSong", plt::testSequentialRemovalOfCurrentSong));
        tests.add(new TestEntry("Playlist", "testRemoveNonexistentSong", plt::testRemoveNonexistentSong));
        tests.add(new TestEntry("Playlist", "testForwardAndBackwardNavigation", plt::testForwardAndBackwardNavigation));
        tests.add(new TestEntry("Playlist", "testRepeatEnabledNavigation", plt::testRepeatEnabledNavigation));
        tests.add(new TestEntry("Playlist", "testRepeatDisabledAtEnd", plt::testRepeatDisabledAtEnd));
        tests.add(new TestEntry("Playlist", "testEmptyPlaylist", plt::testEmptyPlaylist));
        tests.add(new TestEntry("Playlist", "testOneSongPlaylist", plt::testOneSongPlaylist));
        tests.add(new TestEntry("Playlist", "testHashMapConsistency", plt::testHashMapConsistency));

        // Playback Tests
        PlaybackManagerTest pbt = new PlaybackManagerTest();
        tests.add(new TestEntry("Playback", "testQueueFifoOrdering", pbt::testQueueFifoOrdering));
        tests.add(new TestEntry("Playback", "testUpNextPriorityOverPlaylist", pbt::testUpNextPriorityOverPlaylist));
        tests.add(new TestEntry("Playback", "testPlaylistCursorUnchangedAfterQueuedSong", pbt::testPlaylistCursorUnchangedAfterQueuedSong));
        tests.add(new TestEntry("Playback", "testPlaylistCursorUnchangedAfterBack", pbt::testPlaylistCursorUnchangedAfterBack));
        tests.add(new TestEntry("Playback", "testEmptyQueueAndEmptyHistory", pbt::testEmptyQueueAndEmptyHistory));
        tests.add(new TestEntry("Playback", "testHistoryBoundedToTenEntries", pbt::testHistoryBoundedToTenEntries));
        tests.add(new TestEntry("Playback", "testHistoryEvictionLimit", pbt::testHistoryEvictionLimit));
        tests.add(new TestEntry("Playback", "testMultipleConsecutiveQueuedSongTransitions", pbt::testMultipleConsecutiveQueuedSongTransitions));
        tests.add(new TestEntry("Playback", "testRepeatedBackCalls", pbt::testRepeatedBackCalls));
        tests.add(new TestEntry("Playback", "testInvalidSongIdHandling", pbt::testInvalidSongIdHandling));
        tests.add(new TestEntry("Playback", "testBackDoesNotReAddReplacedSongToHistory", pbt::testBackDoesNotReAddReplacedSongToHistory));
        tests.add(new TestEntry("Playback", "testQueueAndPlaylistInteractions", pbt::testQueueAndPlaylistInteractions));

        // BST Tests
        MusicCatalogTest mct = new MusicCatalogTest();
        tests.add(new TestEntry("BST", "testInsertAndFind", mct::testInsertAndFind));
        tests.add(new TestEntry("BST", "testSearchMissingTitle", mct::testSearchMissingTitle));
        tests.add(new TestEntry("BST", "testDuplicateTitles", mct::testDuplicateTitles));
        tests.add(new TestEntry("BST", "testRepeatedInsertion", mct::testRepeatedInsertion));
        tests.add(new TestEntry("BST", "testPrefixSearchAlphabetical", mct::testPrefixSearchAlphabetical));
        tests.add(new TestEntry("BST", "testPrefixSearchNoMatches", mct::testPrefixSearchNoMatches));
        tests.add(new TestEntry("BST", "testPrefixSearchEmptyTree", mct::testPrefixSearchEmptyTree));
        tests.add(new TestEntry("BST", "testEmptyPrefixReturnsAllAlphabetical", mct::testEmptyPrefixReturnsAllAlphabetical));
        tests.add(new TestEntry("BST", "testSubtreePruning", mct::testSubtreePruning));
        tests.add(new TestEntry("BST", "testPrefixSearchRightSubtreeBranch", mct::testPrefixSearchRightSubtreeBranch));
        tests.add(new TestEntry("BST", "testPrefixPruningBothLeftAndRightSubtrees", mct::testPrefixPruningBothLeftAndRightSubtrees));
        tests.add(new TestEntry("BST", "testDuplicateTitlesAndCase", mct::testDuplicateTitlesAndCase));

        // Graph Tests
        tests.add(new TestEntry("Graph", "testBidirectionalRelation", mct::testBidirectionalRelation));
        tests.add(new TestEntry("Graph", "testDuplicateRelations", mct::testDuplicateRelations));
        tests.add(new TestEntry("Graph", "testSelfRelationsRejected", mct::testSelfRelationsRejected));
        tests.add(new TestEntry("Graph", "testTwoEdgeRecommendations", mct::testTwoEdgeRecommendations));
        tests.add(new TestEntry("Graph", "testDirectNeighborsExcluded", mct::testDirectNeighborsExcluded));
        tests.add(new TestEntry("Graph", "testOriginalArtistExcluded", mct::testOriginalArtistExcluded));
        tests.add(new TestEntry("Graph", "testDeduplicateRecommendations", mct::testDeduplicateRecommendations));
        tests.add(new TestEntry("Graph", "testDiamondGraphPaths", mct::testDiamondGraphPaths));
        tests.add(new TestEntry("Graph", "testTriangleGraphExclusion", mct::testTriangleGraphExclusion));
        tests.add(new TestEntry("Graph", "testUnknownOrIsolatedArtist", mct::testUnknownOrIsolatedArtist));

        // Integration Tests
        IntegrationTest it = new IntegrationTest();
        tests.add(new TestEntry("Integration", "testFullPlayerWorkflow", it::testFullPlayerWorkflow));

        int passed = 0;
        int failed = 0;
        String currentCategory = "";

        for (TestEntry entry : tests) {
            if (!entry.category.equals(currentCategory)) {
                currentCategory = entry.category;
                System.out.println("\n[" + currentCategory + "]");
            }

            try {
                entry.testCase.run();
                System.out.println("  PASS: " + entry.name);
                passed++;
            } catch (Throwable t) {
                System.out.println("  FAIL: " + entry.name + " (" + t.getMessage() + ")");
                failed++;
            }
        }

        System.out.println("\n-------------------------------------------");
        System.out.printf("Results: %d passed, %d failed (total: %d)\n", passed, failed, tests.size());
        System.out.println("-------------------------------------------");

        if (failed > 0) {
            System.exit(1);
        }
    }
}
