package tunewave;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link PlaybackManager} — Queue (FIFO) + History Stack (LIFO).
 *
 * Covers: queue FIFO priority, queue playback preserving the playlist cursor,
 * history ordering, max-size 10 cap, back() behavior, history replay without
 * changing the playlist cursor, and empty-state edge cases.
 */
class PlaybackManagerTest {

    private Playlist        playlist;
    private PlaybackManager manager;
    private java.util.Map<String, Song> catalog;

    private Song s1, s2, s3, s4, s5;

    @BeforeEach
    void setUp() {
        catalog = new java.util.HashMap<>();
        playlist = new Playlist();
        manager  = new PlaybackManager(catalog, playlist);

        s1 = new Song("S1", "Alpha",   "A1");
        s2 = new Song("S2", "Beta",    "A2");
        s3 = new Song("S3", "Gamma",   "A3");
        s4 = new Song("S4", "Delta",   "A4");
        s5 = new Song("S5", "Epsilon", "A5");

        // Populate catalog and playlist
        for (Song s : new Song[]{s1, s2, s3, s4, s5}) {
            catalog.put(s.getSongId(), s);
            playlist.addSong(s);
        }
        // Set initial playing song
        manager.setCurrentlyPlayingId("S1");
    }

    // ──────────────────────── queue FIFO ordering ─────────────────────────────

    @Test
    void queueIsFIFO() {
        manager.addToUpNext("S2");
        manager.addToUpNext("S3");

        List<String> ids = manager.getUpNextIds();
        assertEquals(List.of("S2", "S3"), ids, "Queue must be FIFO: S2 first, S3 second");
    }

    @Test
    void queueDequeuesInFIFOOrder() {
        manager.addToUpNext("S2");
        manager.addToUpNext("S3");

        Object first  = manager.playNext();
        Object second = manager.playNext();

        assertEquals(s2, first,  "First playNext() must return S2 (front of queue)");
        assertEquals(s3, second, "Second playNext() must return S3");
    }

    // ──────────────────────── queue does not move cursor ──────────────────────

    @Test
    void queuedPlaybackPreservesPlaylistCursor() {
        // Playlist cursor starts at S1 (head).
        assertEquals(s1, playlist.getCurrentSong());

        manager.addToUpNext("S3");
        manager.playNext(); // plays queued S3

        // Cursor must remain at S1, not advance.
        assertEquals(s1, playlist.getCurrentSong(),
                "Queue playback must NOT move the playlist cursor");
    }

    @Test
    void multipleQueuedSongsPreservePlaylistCursor() {
        manager.addToUpNext("S2");
        manager.addToUpNext("S4");
        manager.playNext(); // S2
        manager.playNext(); // S4

        assertEquals(s1, playlist.getCurrentSong(),
                "Playlist cursor must stay at S1 after two queued plays");
    }

    // ──────────────────────── queue then playlist ──────────────────────────────

    @Test
    void afterQueueExhaustedPlaylistAdvances() {
        manager.addToUpNext("S3");
        manager.playNext();  // S3 (queued)
        Object next = manager.playNext(); // now playlist advances from S1

        assertEquals(s2, next, "After queue exhausted, playlist should advance to S2");
    }

    // ──────────────────────── duplicate IDs in queue ──────────────────────────

    @Test
    void duplicateIdsPermittedInQueue() {
        manager.addToUpNext("S2");
        manager.addToUpNext("S2"); // same song twice
        assertEquals(2, manager.upNextSize(), "Duplicate song IDs are allowed in the queue");
    }

    // ──────────────────────── unknown ID silently ignored ─────────────────────

    @Test
    void addToUpNextUnknownIdIgnored() {
        manager.addToUpNext("GHOST");
        assertEquals(0, manager.upNextSize());
    }

    // ──────────────────────── history ordering ────────────────────────────────

    @Test
    void historyIsLIFO() {
        // S1 is playing; play to S2 → S1 pushed to history
        manager.playNext(); // → S2, pushes S1
        manager.playNext(); // → S3, pushes S2

        List<String> history = manager.getHistoryIds();
        // Most recent first: S2, then S1
        assertEquals("S2", history.get(0), "Most recent pushed song must be on top");
        assertEquals("S1", history.get(1));
    }

    @Test
    void historyCapAt10() {
        // Play 12 songs to build 12 history transitions; only 10 must be kept.
        // Add more songs to catalog/playlist first.
        for (int i = 6; i <= 15; i++) {
            Song extra = new Song("S" + i, "Title" + i, "Artist");
            catalog.put(extra.getSongId(), extra);
            playlist.addSong(extra);
        }

        // Play 12 transitions (currently on S1, each playNext advances once).
        for (int i = 0; i < 12; i++) {
            manager.playNext();
        }

        assertTrue(manager.historySize() <= PlaybackManager.MAX_HISTORY,
                "History must not exceed " + PlaybackManager.MAX_HISTORY + " entries");
        assertEquals(PlaybackManager.MAX_HISTORY, manager.historySize());
    }

    @Test
    void historyCapDropsOldest() {
        // Force exactly 11 transitions; the 11th should drop the oldest entry.
        for (int i = 6; i <= 11; i++) {
            Song extra = new Song("S" + i, "Title" + i, "Artist");
            catalog.put(extra.getSongId(), extra);
            playlist.addSong(extra);
        }

        // Play 11 transitions: S1→S2→…→S12; history entries are S1..S11.
        for (int i = 0; i < 11; i++) {
            manager.playNext();
        }

        assertEquals(10, manager.historySize());
        // The oldest entry (S1) must have been dropped.
        assertFalse(manager.getHistoryIds().contains("S1"),
                "Oldest history entry (S1) must be discarded when cap exceeded");
    }

    // ──────────────────────── back() behavior ─────────────────────────────────

    @Test
    void backReturnsTopOfHistory() {
        manager.playNext(); // S2, pushes S1 to history
        manager.playNext(); // S3, pushes S2 to history

        Song prev = manager.back(); // should return S2 (top of history)
        assertEquals(s2, prev);
    }

    @Test
    void backPopsHistory() {
        manager.playNext(); // pushes S1
        manager.playNext(); // pushes S2
        int sizeBefore = manager.historySize();
        manager.back();
        assertEquals(sizeBefore - 1, manager.historySize(),
                "back() must pop one entry from history");
    }

    @Test
    void backOnEmptyHistoryReturnsNull() {
        assertNull(manager.back());
    }

    @Test
    void backDoesNotMoveCursor() {
        manager.playNext(); // playlist → S2
        manager.playNext(); // playlist → S3

        Song cursorBefore = playlist.getCurrentSong();
        manager.back();
        assertEquals(cursorBefore, playlist.getCurrentSong(),
                "back() must NOT move the playlist cursor");
    }

    // ──────────────────────── currently playing ───────────────────────────────

    @Test
    void currentlyPlayingUpdatesAfterPlayNext() {
        manager.playNext(); // S1→S2
        assertEquals(s2, manager.getCurrentlyPlaying());
    }

    @Test
    void currentlyPlayingUpdatesAfterQueuedPlay() {
        manager.addToUpNext("S4");
        manager.playNext(); // queued S4
        assertEquals(s4, manager.getCurrentlyPlaying());
    }

    @Test
    void currentlyPlayingUpdatesAfterBack() {
        manager.playNext(); // S2, pushes S1
        manager.back();     // back to S1
        assertEquals(s1, manager.getCurrentlyPlaying());
    }

    // ──────────────────────── empty queue behavior ────────────────────────────

    @Test
    void isQueueEmptyInitially() {
        assertTrue(manager.isQueueEmpty());
    }

    @Test
    void isHistoryEmptyInitially() {
        assertTrue(manager.isHistoryEmpty());
    }

    // ──────────────────────── catalog fallback ────────────────────────────────

    @Test
    void songsRemovedFromPlaylistStillPlayableViaHistory() {
        // Play forward so S1 goes to history.
        manager.playNext(); // history: [S1]

        // Remove S1 from playlist (catalog entry kept).
        playlist.removeSong("S1");

        // back() should still resolve S1 via catalog.
        Song replayed = manager.back();
        assertNotNull(replayed, "Songs in history must be resolvable via catalog even after playlist removal");
        assertEquals(s1, replayed);
    }
}

