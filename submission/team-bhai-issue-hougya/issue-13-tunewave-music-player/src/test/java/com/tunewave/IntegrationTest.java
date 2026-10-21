package com.tunewave;

import java.util.List;
import static com.tunewave.TestAssertions.*;

/**
 * Dependency-free end-to-end integration tests.
 */
public class IntegrationTest {

    public void testFullPlayerWorkflow() {
        TuneWavePlayer player = new TuneWavePlayer();

        // 1. Populate Catalog & Playlist
        Song s1 = new Song("S1", "Blinding Lights", "The Weeknd", 200);
        Song s2 = new Song("S2", "Save Your Tears", "The Weeknd", 215);
        Song s3 = new Song("S3", "Starboy", "The Weeknd", 230);
        Song sQueue = new Song("Q1", "One More Time", "Daft Punk", 320);

        assertTrue(player.addSong(s1));
        assertTrue(player.addSong(s2));
        assertTrue(player.addSong(s3));

        // Register queued song in catalog so player can resolve it
        player.getMusicCatalog().registerSong(sQueue);

        // 2. Test Catalog BST & Prefix Search
        List<String> sResults = player.prefixSearch("S");
        assertEquals(2, sResults.size(), "Prefix 'S' should match 2 songs");
        assertEquals("Save Your Tears", sResults.get(0));
        assertEquals("Starboy", sResults.get(1));

        // 3. Test Artist Graph Relations & 2-hop recommendations
        player.addRelation("The Weeknd", "Daft Punk");
        player.addRelation("Daft Punk", "Justice");
        player.addRelation("The Weeknd", "Kendrick Lamar");
        player.addRelation("Kendrick Lamar", "SZA");

        List<String> recs = player.recommendArtists("The Weeknd");
        assertEquals(2, recs.size(), "Should recommend 2 artists");
        assertEquals("Justice", recs.get(0));
        assertEquals("SZA", recs.get(1));

        // 4. Initial Playback State
        assertNull(player.getCurrentlyPlaying());
        assertEquals(s1, player.getPlaylistCursor());

        // First playNext starts playback at current playlist cursor (s1)
        assertEquals(s1, player.playNext());
        assertEquals(s1, player.getCurrentlyPlaying());
        assertEquals(s1, player.getPlaylistCursor());

        // 5. Enqueue Up Next Song
        assertTrue(player.addToUpNext("Q1"));

        // Next playNext must play the queued song (Q1) without moving playlist cursor
        assertEquals(sQueue, player.playNext());
        assertEquals(sQueue, player.getCurrentlyPlaying());
        assertEquals(s1, player.getPlaylistCursor(), "Playlist cursor must NOT advance when playing queued song");

        // 6. Next playNext resumes playlist (cursor advances to s2)
        assertEquals(s2, player.playNext());
        assertEquals(s2, player.getCurrentlyPlaying());
        assertEquals(s2, player.getPlaylistCursor());

        // 7. Test History Stack & Back Navigation
        // History contains: [sQueue, s1] (LIFO)
        assertEquals(2, player.getPlaybackManager().getHistorySize());

        // back() replays sQueue without moving playlist cursor
        Song backed = player.back();
        assertEquals(sQueue, backed);
        assertEquals(sQueue, player.getCurrentlyPlaying());
        assertEquals(s2, player.getPlaylistCursor(), "Playlist cursor must NOT move when replaying via back()");

        // back() again replays s1
        Song backedAgain = player.back();
        assertEquals(s1, backedAgain);
        assertEquals(s1, player.getCurrentlyPlaying());
        assertEquals(s2, player.getPlaylistCursor(), "Playlist cursor remains at s2");

        // 8. Next from playlist continues from cursor (s2 -> s3)
        assertEquals(s3, player.playNext());
        assertEquals(s3, player.getCurrentlyPlaying());
        assertEquals(s3, player.getPlaylistCursor());

        // At end with repeat OFF: returns null and cursor remains at s3
        assertNull(player.playNext());
        assertEquals(s3, player.getPlaylistCursor());

        // Toggle repeat ON and playNext: wraps to s1
        player.toggleRepeat();
        assertTrue(player.isRepeat());
        assertEquals(s1, player.playNext());
        assertEquals(s1, player.getPlaylistCursor());
    }
}
