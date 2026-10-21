package tunewave;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for {@link TuneWaveService}.
 *
 * Verifies that all milestones work correctly together through the service
 * facade: catalog management, playlist navigation, playback queue/history,
 * BST search, and artist graph recommendations.
 */
class TuneWaveServiceTest {

    private TuneWaveService svc;
    private Song s1, s2, s3, s4, s5;

    @BeforeEach
    void setUp() {
        svc = new TuneWaveService();

        s1 = new Song("S1", "Blinding Lights",   "The Weeknd");
        s2 = new Song("S2", "Bohemian Rhapsody",  "Queen");
        s3 = new Song("S3", "Shape of You",       "Ed Sheeran");
        s4 = new Song("S4", "Rolling in the Deep","Adele");
        s5 = new Song("S5", "Blackbird",          "The Beatles");

        svc.addSong(s1);
        svc.addSong(s2);
        svc.addSong(s3);
        svc.addSong(s4);
        svc.addSong(s5);
    }

    // ──────────────────────── catalog & playlist setup ────────────────────────

    @Test
    void addedSongsAppearInPlaylist() {
        List<Song> songs = svc.getPlaylistSongs();
        assertEquals(5, songs.size());
        assertEquals(s1, songs.get(0)); // insertion order
    }

    @Test
    void duplicateSongIdIgnoredByService() {
        svc.addSong(new Song("S1", "Different", "Other"));
        assertEquals(5, svc.playlistSize());
    }

    @Test
    void getSongFromCatalog() {
        assertEquals(s3, svc.getSong("S3"));
    }

    @Test
    void getSongUnknownIdReturnsNull() {
        assertNull(svc.getSong("GHOST"));
    }

    // ──────────────────────── playlist navigation ─────────────────────────────

    @Test
    void playReturnsCurrentCursorSong() {
        Song playing = svc.play();
        assertEquals(s1, playing);
    }

    @Test
    void playlistNextAdvancesCursor() {
        Object result = svc.playlistNext();
        assertEquals(s2, result);
        assertEquals(s2, svc.currentSong());
    }

    @Test
    void playlistPreviousAtHeadReturnsStart() {
        assertEquals("start", svc.playlistPrevious());
    }

    @Test
    void repeatOnWrapsPlaylist() {
        svc.toggleRepeat();
        // Advance to end
        for (int i = 0; i < 4; i++) svc.playlistNext();
        assertEquals(s5, svc.currentSong());
        assertEquals(s1, svc.playlistNext()); // wrap
    }

    // ──────────────────────── remove from playlist ────────────────────────────

    @Test
    void removeSongFromPlaylistReducesSize() {
        svc.removeSongFromPlaylist("S2");
        assertEquals(4, svc.playlistSize());
    }

    @Test
    void removeSongRetainsCatalogEntry() {
        svc.removeSongFromPlaylist("S2");
        // Should still be resolvable from catalog.
        assertNotNull(svc.getSong("S2"));
    }

    // ──────────────────────── queue + playback ────────────────────────────────

    @Test
    void upNextQueuePrioritisedOverPlaylist() {
        svc.play(); // currently playing S1
        svc.addToUpNext("S4");
        Object next = svc.playNext();
        assertEquals(s4, next, "Queued song must play before normal playlist advance");
    }

    @Test
    void queuedSongDoesNotMoveCursor() {
        svc.play();
        Song cursorBefore = svc.currentSong();
        svc.addToUpNext("S3");
        svc.playNext();
        assertEquals(cursorBefore, svc.currentSong());
    }

    // ──────────────────────── history + back ──────────────────────────────────

    @Test
    void backReplaysPreviousSong() {
        svc.play(); // S1 as current
        svc.playNext(); // S2, S1 goes to history
        Song prev = svc.back();
        assertEquals(s1, prev);
    }

    @Test
    void backOnEmptyHistoryReturnsNull() {
        assertNull(svc.back());
    }

    @Test
    void historyDoesNotExceedTenEntries() {
        // Add more songs
        for (int i = 6; i <= 15; i++) {
            svc.addSong(new Song("S" + i, "Title" + i, "Artist"));
        }
        svc.play();
        for (int i = 0; i < 12; i++) svc.playNext();

        assertTrue(svc.getPlaybackManager().historySize() <= PlaybackManager.MAX_HISTORY);
    }

    // ──────────────────────── BST search ──────────────────────────────────────

    @Test
    void searchByExactTitle() {
        Song result = svc.searchByTitle("Shape of You");
        assertEquals(s3, result);
    }

    @Test
    void searchByTitleCaseInsensitive() {
        Song result = svc.searchByTitle("BLINDING LIGHTS");
        assertEquals(s1, result);
    }

    @Test
    void searchByTitleNotFound() {
        assertNull(svc.searchByTitle("Nonexistent Song"));
    }

    @Test
    void prefixSearchReturnsMatchingInOrder() {
        List<Song> results = svc.prefixSearch("bl");
        assertEquals(2, results.size());
        // Alphabetical order: Blackbird before Blinding Lights
        assertEquals(s5, results.get(0), "Blackbird should come before Blinding Lights");
        assertEquals(s1, results.get(1));
    }

    @Test
    void prefixSearchEmptyPrefixReturnsAll() {
        List<Song> results = svc.prefixSearch("");
        assertEquals(5, results.size());
    }

    @Test
    void prefixSearchNoMatch() {
        List<Song> results = svc.prefixSearch("xyz");
        assertTrue(results.isEmpty());
    }

    // ──────────────────────── artist graph ────────────────────────────────────

    @Test
    void artistRecommendationsDistance2() {
        svc.addArtistRelation("The Weeknd", "Drake");
        svc.addArtistRelation("Drake",      "Future");

        List<String> recs = svc.recommendArtists("The Weeknd");
        assertTrue(recs.contains("Future"));
        assertFalse(recs.contains("Drake")); // direct neighbor excluded
    }

    @Test
    void artistRecommendationsUnknownArtist() {
        List<String> recs = svc.recommendArtists("Ghost");
        assertTrue(recs.isEmpty());
    }

    @Test
    void artistRecommendationsSorted() {
        svc.addArtistRelation("Ed Sheeran", "Adele");
        svc.addArtistRelation("Adele",      "Sam Smith");
        svc.addArtistRelation("Adele",      "Amy Winehouse");

        List<String> recs = svc.recommendArtists("Ed Sheeran");
        assertTrue(recs.size() >= 2);
        // Must be sorted alphabetically
        for (int i = 0; i < recs.size() - 1; i++) {
            assertTrue(recs.get(i).compareTo(recs.get(i + 1)) <= 0,
                    "Recommendations must be alphabetically sorted");
        }
    }
}

