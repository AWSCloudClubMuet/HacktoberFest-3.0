package tunewave;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link Playlist} — doubly-linked list + HashMap.
 *
 * Covers: empty/single-song playlists, duplicates, head/middle/tail deletion,
 * bidirectional pointer integrity, repeat behavior, and navigation edge cases.
 */
class PlaylistTest {

    private Playlist playlist;
    private Song s1, s2, s3, s4;

    @BeforeEach
    void setUp() {
        playlist = new Playlist();
        s1 = new Song("S1", "Alpha", "Art1");
        s2 = new Song("S2", "Beta",  "Art2");
        s3 = new Song("S3", "Gamma", "Art3");
        s4 = new Song("S4", "Delta", "Art4");
    }

    // ───────────────────────── empty playlist ─────────────────────────────────

    @Test
    void emptyPlaylistSize() {
        assertEquals(0, playlist.size());
    }

    @Test
    void emptyPlaylistIsEmpty() {
        assertTrue(playlist.isEmpty());
    }

    @Test
    void emptyPlaylistCurrentSongIsNull() {
        assertNull(playlist.getCurrentSong());
    }

    @Test
    void emptyPlaylistNextReturnsNull() {
        assertNull(playlist.next());
    }

    @Test
    void emptyPlaylistPreviousReturnsNull() {
        assertNull(playlist.previous());
    }

    // ───────────────────────── single-song playlist ───────────────────────────

    @Test
    void singleSongCurrentIsHead() {
        playlist.addSong(s1);
        assertEquals(s1, playlist.getCurrentSong());
    }

    @Test
    void singleSongNextAtTailNoRepeat() {
        playlist.addSong(s1);
        Object result = playlist.next();
        assertEquals("end", result, "next() at last song (repeat off) must return 'end'");
        // Cursor must still be at s1.
        assertEquals(s1, playlist.getCurrentSong());
    }

    @Test
    void singleSongNextAtTailRepeatOn() {
        playlist.addSong(s1);
        playlist.toggleRepeat();
        Object result = playlist.next();
        assertEquals(s1, result, "next() with repeat on single song must wrap to itself");
        assertEquals(s1, playlist.getCurrentSong());
    }

    @Test
    void singleSongPreviousAtHeadReturnsStart() {
        playlist.addSong(s1);
        Object result = playlist.previous();
        assertEquals("start", result, "previous() at head must return 'start'");
        assertEquals(s1, playlist.getCurrentSong());
    }

    @Test
    void singleSongAfterRemoveIsEmpty() {
        playlist.addSong(s1);
        playlist.removeSong("S1");
        assertTrue(playlist.isEmpty());
        assertNull(playlist.getCurrentSong());
    }

    // ───────────────────────── duplicate IDs ─────────────────────────────────

    @Test
    void duplicateIdIgnored() {
        playlist.addSong(s1);
        playlist.addSong(new Song("S1", "Different Title", "Other Artist")); // same ID
        assertEquals(1, playlist.size(), "Duplicate song ID must be rejected");
    }

    @Test
    void duplicateAddDoesNotCorruptList() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(new Song("S1", "X", "Y")); // duplicate
        assertEquals(2, playlist.size());
        List<Song> songs = playlist.getSongs();
        assertEquals(s1, songs.get(0));
        assertEquals(s2, songs.get(1));
    }

    // ───────────────────────── navigation ─────────────────────────────────────

    @Test
    void nextAdvancesCursor() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        Object result = playlist.next();
        assertEquals(s2, result);
        assertEquals(s2, playlist.getCurrentSong());
    }

    @Test
    void previousGoesBack() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.next(); // move to s2
        Object result = playlist.previous();
        assertEquals(s1, result);
        assertEquals(s1, playlist.getCurrentSong());
    }

    @Test
    void previousAtFirstSongReturnsStart() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        // cursor is at s1 (head after add)
        Object result = playlist.previous();
        assertEquals("start", result);
        assertEquals(s1, playlist.getCurrentSong()); // cursor unchanged
    }

    @Test
    void repeatOffAtEndReturnsEnd() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.next(); // move to s2 (tail)
        assertEquals("end", playlist.next()); // at tail, repeat off
        assertEquals(s2, playlist.getCurrentSong()); // cursor stays at tail
    }

    @Test
    void repeatOnWrapsAtEnd() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.toggleRepeat();
        playlist.next(); // to s2
        Object result = playlist.next(); // should wrap to s1
        assertEquals(s1, result);
        assertEquals(s1, playlist.getCurrentSong());
    }

    @Test
    void toggleRepeatChangesState() {
        assertFalse(playlist.isRepeatEnabled());
        assertTrue(playlist.toggleRepeat());
        assertFalse(playlist.toggleRepeat());
    }

    // ───────────────────────── deletion: head ─────────────────────────────────

    @Test
    void removeHeadUpdatesHead() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);
        playlist.removeSong("S1");

        assertEquals(s2, playlist.getHead().song);
        assertNull(playlist.getHead().prev, "New head must have null prev");
    }

    @Test
    void removeHeadCursorAdvances() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        // cursor = s1 (head)
        playlist.removeSong("S1");
        assertEquals(s2, playlist.getCurrentSong());
    }

    // ───────────────────────── deletion: middle ───────────────────────────────

    @Test
    void removeMiddleStitchesLinks() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);

        playlist.removeSong("S2");

        // s1.next must now be s3, and s3.prev must be s1.
        PlaylistNode head = playlist.getHead();
        assertEquals(s1, head.song);
        assertEquals(s3, head.next.song);
        assertEquals(s1, head.next.prev.song);
        assertNull(head.next.next, "s3 should now be the tail");
    }

    @Test
    void removeMiddleDoesNotMoveCursorIfNotCurrent() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);
        // cursor = s1 (head)
        playlist.removeSong("S2"); // not current
        assertEquals(s1, playlist.getCurrentSong());
    }

    @Test
    void removeMiddleWhenCurrentAdvancesToNext() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);
        playlist.next(); // cursor → s2
        playlist.removeSong("S2");
        assertEquals(s3, playlist.getCurrentSong()); // advance to next
    }

    // ───────────────────────── deletion: tail ─────────────────────────────────

    @Test
    void removeTailUpdatesTail() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);
        playlist.removeSong("S3");

        assertEquals(s2, playlist.getTail().song);
        assertNull(playlist.getTail().next, "New tail must have null next");
    }

    @Test
    void removeTailCursorRetreats() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);
        // Move cursor to tail
        playlist.next();
        playlist.next(); // cursor → s3
        playlist.removeSong("S3");
        assertEquals(s2, playlist.getCurrentSong()); // retreat to prev
    }

    // ───────────────────────── bidirectional integrity ────────────────────────

    @Test
    void bidirectionalLinksForward() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);

        PlaylistNode n = playlist.getHead();
        assertEquals(s1, n.song);
        assertEquals(s2, n.next.song);
        assertEquals(s3, n.next.next.song);
        assertNull(n.next.next.next);
    }

    @Test
    void bidirectionalLinksBackward() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);

        PlaylistNode n = playlist.getTail();
        assertEquals(s3, n.song);
        assertEquals(s2, n.prev.song);
        assertEquals(s1, n.prev.prev.song);
        assertNull(n.prev.prev.prev);
    }

    // ───────────────────────── unknown / null IDs ─────────────────────────────

    @Test
    void removeUnknownIdIsNoOp() {
        playlist.addSong(s1);
        playlist.removeSong("NOPE");
        assertEquals(1, playlist.size());
    }

    @Test
    void removeNullIdIsNoOp() {
        playlist.addSong(s1);
        playlist.removeSong(null);
        assertEquals(1, playlist.size());
    }

    // ───────────────────────── contents / ordering ────────────────────────────

    @Test
    void getSongsInInsertionOrder() {
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);
        List<Song> songs = playlist.getSongs();
        assertEquals(List.of(s1, s2, s3), songs);
    }

    @Test
    void containsReturnsTrueForAddedSong() {
        playlist.addSong(s1);
        assertTrue(playlist.contains("S1"));
    }

    @Test
    void containsReturnsFalseAfterRemoval() {
        playlist.addSong(s1);
        playlist.removeSong("S1");
        assertFalse(playlist.contains("S1"));
    }
}

