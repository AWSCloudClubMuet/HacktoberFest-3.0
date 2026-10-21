package com.tunewave;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import static com.tunewave.TestAssertions.*;

/**
 * Dependency-free tests for Milestone 2: PlaybackManager.
 */
public class PlaybackManagerTest {

    private PlaylistManager playlist;
    private PlaybackManager playback;
    private Map<String, Song> catalog;

    private Song s1, s2, s3, q1, q2, q3;

    public void setUp() {
        playlist = new PlaylistManager();
        catalog = new HashMap<>();

        s1 = new Song("S1", "Song One", "Artist A");
        s2 = new Song("S2", "Song Two", "Artist B");
        s3 = new Song("S3", "Song Three", "Artist C");
        q1 = new Song("Q1", "Queued One", "Artist Q1");
        q2 = new Song("Q2", "Queued Two", "Artist Q2");
        q3 = new Song("Q3", "Queued Three", "Artist Q3");

        catalog.put(s1.getId(), s1);
        catalog.put(s2.getId(), s2);
        catalog.put(s3.getId(), s3);
        catalog.put(q1.getId(), q1);
        catalog.put(q2.getId(), q2);
        catalog.put(q3.getId(), q3);

        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);

        playback = new PlaybackManager(playlist, catalog::get);
    }

    public void testQueueFifoOrdering() {
        setUp();
        assertTrue(playback.addToUpNext("Q1"), "Adding Q1 should succeed");
        assertTrue(playback.addToUpNext("Q2"), "Adding Q2 should succeed");
        assertTrue(playback.addToUpNext("Q3"), "Adding Q3 should succeed");

        assertEquals(3, playback.getUpNextSize(), "Queue size should be 3");

        // Play next should pop in FIFO order: Q1, then Q2, then Q3
        assertEquals(q1, playback.playNext(), "First queued song should be Q1");
        assertEquals(q2, playback.playNext(), "Second queued song should be Q2");
        assertEquals(q3, playback.playNext(), "Third queued song should be Q3");
        assertEquals(0, playback.getUpNextSize(), "Queue should be empty");
    }

    public void testUpNextPriorityOverPlaylist() {
        setUp();
        playback.addToUpNext("Q1");

        // First playNext plays Q1 rather than advancing playlist
        Song played = playback.playNext();
        assertEquals(q1, played, "Queued song Q1 must play first");

        // Next playNext (queue now empty) plays playlist's current song s1
        Song nextPlaylistSong = playback.playNext();
        assertEquals(s1, nextPlaylistSong, "Playlist current track s1 should play after queue empties");
    }

    public void testPlaylistCursorUnchangedAfterQueuedSong() {
        setUp();
        assertEquals(s1, playlist.getCurrentSong(), "Initial playlist cursor is s1");

        playback.addToUpNext("Q1");
        playback.addToUpNext("Q2");

        playback.playNext(); // plays Q1
        assertEquals(q1, playback.getCurrentlyPlaying());
        assertEquals(s1, playlist.getCurrentSong(), "Playlist cursor MUST remain at s1 after playing Q1");

        playback.playNext(); // plays Q2
        assertEquals(q2, playback.getCurrentlyPlaying());
        assertEquals(s1, playlist.getCurrentSong(), "Playlist cursor MUST still remain at s1 after playing Q2");
    }

    public void testPlaylistCursorUnchangedAfterBack() {
        setUp();
        assertEquals(s1, playback.playNext()); // playing s1, cursor s1
        assertEquals(s2, playback.playNext()); // playing s2, cursor s2

        assertEquals(s2, playlist.getCurrentSong());

        // Replay via back()
        Song backed = playback.back();
        assertEquals(s1, backed, "back() should replay s1");
        assertEquals(s1, playback.getCurrentlyPlaying());

        // Playlist cursor remains on s2
        assertEquals(s2, playlist.getCurrentSong(), "Playlist cursor MUST remain on s2 after back()");
    }

    public void testEmptyQueueAndEmptyHistory() {
        setUp();
        assertEquals(0, playback.getUpNextSize());
        assertEquals(0, playback.getHistorySize());

        // Back with empty history returns null without exception
        assertNull(playback.back(), "back() on empty history should return null");
    }

    public void testHistoryBoundedToTenEntries() {
        setUp();
        // Populate and play 15 distinct songs
        for (int i = 1; i <= 15; i++) {
            Song s = new Song("SONG_" + i, "Title " + i, "Artist");
            catalog.put(s.getId(), s);
            playback.addToUpNext(s.getId());
            playback.playNext();
        }

        // Currently playing is SONG_15
        assertEquals("SONG_15", playback.getCurrentlyPlaying().getId());

        // History capacity must be capped at 10
        assertEquals(10, playback.getHistorySize(), "History stack size must be capped at 10");

        // The 10 most recent played songs in history (LIFO: from SONG_14 down to SONG_5)
        List<Song> history = playback.getHistoryStack();
        assertEquals("SONG_14", history.get(0).getId(), "Top of stack should be SONG_14");
        assertEquals("SONG_5", history.get(9).getId(), "Bottom of stack should be SONG_5");

        // Oldest entries (SONG_1, SONG_2, SONG_3, SONG_4) were discarded
        for (Song h : history) {
            assertNotEquals("SONG_1", h.getId(), "SONG_1 must be discarded");
            assertNotEquals("SONG_2", h.getId(), "SONG_2 must be discarded");
            assertNotEquals("SONG_3", h.getId(), "SONG_3 must be discarded");
            assertNotEquals("SONG_4", h.getId(), "SONG_4 must be discarded");
        }
    }

    public void testHistoryEvictionLimit() {
        setUp();
        for (int i = 1; i <= 15; i++) {
            Song s = new Song("SONG_" + i, "Title " + i, "Artist");
            catalog.put(s.getId(), s);
            playback.addToUpNext(s.getId());
            playback.playNext();
        }

        // Currently playing is SONG_15, history has exactly 10 songs (14 down to 5)
        assertEquals(10, playback.getHistorySize());
        for (int expected = 14; expected >= 5; expected--) {
            Song replayed = playback.back();
            assertNotNull(replayed);
            assertEquals("SONG_" + expected, replayed.getId(), "Must replay in reverse chronological order");
        }

        // Now history is exhausted
        assertEquals(0, playback.getHistorySize());
        assertNull(playback.back(), "11th back must return null");
        assertNull(playback.back(), "Subsequent back must safely return null");
    }

    public void testMultipleConsecutiveQueuedSongTransitions() {
        setUp();
        Song q4 = new Song("Q4", "Queued Four", "Artist Q4");
        catalog.put(q4.getId(), q4);

        // Start playlist at s1
        assertEquals(s1, playback.playNext());
        assertEquals(s1, playlist.getCurrentSong());

        // Queue 4 consecutive songs
        playback.addToUpNext("Q1");
        playback.addToUpNext("Q2");
        playback.addToUpNext("Q3");
        playback.addToUpNext("Q4");

        // Play all 4 queued songs
        assertEquals(q1, playback.playNext());
        assertEquals(s1, playlist.getCurrentSong(), "Cursor remains at s1 after Q1");

        assertEquals(q2, playback.playNext());
        assertEquals(s1, playlist.getCurrentSong(), "Cursor remains at s1 after Q2");

        assertEquals(q3, playback.playNext());
        assertEquals(s1, playlist.getCurrentSong(), "Cursor remains at s1 after Q3");

        assertEquals(q4, playback.playNext());
        assertEquals(s1, playlist.getCurrentSong(), "Cursor remains at s1 after Q4");

        // Queue is now empty, next play resumes playlist at s2
        assertEquals(s2, playback.playNext());
        assertEquals(s2, playlist.getCurrentSong(), "Cursor advances to s2");

        // Verify history contains exact chronological reverse: [Q4, Q3, Q2, Q1, s1]
        List<Song> history = playback.getHistoryStack();
        assertEquals(5, history.size());
        assertEquals("Q4", history.get(0).getId());
        assertEquals("Q3", history.get(1).getId());
        assertEquals("Q2", history.get(2).getId());
        assertEquals("Q1", history.get(3).getId());
        assertEquals("S1", history.get(4).getId());
    }

    public void testRepeatedBackCalls() {
        setUp();
        playback.playNext(); // s1
        playback.playNext(); // s2 (s1 in history)
        playback.playNext(); // s3 (s2, s1 in history)

        assertEquals(2, playback.getHistorySize());

        // First back: returns s2
        assertEquals(s2, playback.back());
        assertEquals(1, playback.getHistorySize());
        assertEquals(s2, playback.getCurrentlyPlaying());

        // Second back: returns s1
        assertEquals(s1, playback.back());
        assertEquals(0, playback.getHistorySize());
        assertEquals(s1, playback.getCurrentlyPlaying());

        // Third back: history is empty, returns null
        assertNull(playback.back());
        assertEquals(s1, playback.getCurrentlyPlaying());
    }

    public void testInvalidSongIdHandling() {
        setUp();
        assertFalse(playback.addToUpNext(null), "Null ID must be rejected");
        assertFalse(playback.addToUpNext(""), "Empty ID must be rejected");
        assertFalse(playback.addToUpNext("NON_EXISTENT_ID"), "Unknown ID must be rejected");

        assertEquals(0, playback.getUpNextSize(), "Queue must remain empty after invalid IDs");
    }

    public void testBackDoesNotReAddReplacedSongToHistory() {
        setUp();
        playback.playNext(); // s1
        playback.playNext(); // s2 (history: [s1])

        assertEquals(1, playback.getHistorySize());

        Song backed = playback.back(); // returns s1, history is now empty
        assertEquals(s1, backed);
        assertEquals(0, playback.getHistorySize(), "History must be 0 after popping only element");

        // Next back should return null, not oscillate to s2
        assertNull(playback.back(), "Repeated back on empty history should return null");
    }

    public void testQueueAndPlaylistInteractions() {
        setUp();
        // Start playing playlist
        assertEquals(s1, playback.playNext()); // playing s1, cursor s1

        // Queue a song mid-playback
        playback.addToUpNext("Q1");

        // Next play must be Q1, cursor remains at s1
        assertEquals(q1, playback.playNext());
        assertEquals(s1, playlist.getCurrentSong(), "Cursor remains at s1 while queued song plays");

        // Next play advances playlist to s2
        assertEquals(s2, playback.playNext());
        assertEquals(s2, playlist.getCurrentSong(), "Cursor advances to s2");

        // History contains: [q1, s1] (LIFO)
        List<Song> history = playback.getHistoryStack();
        assertEquals(2, history.size());
        assertEquals(q1, history.get(0));
        assertEquals(s1, history.get(1));
    }
}
