package com.tunewave;

import java.util.List;
import static com.tunewave.TestAssertions.*;

/**
 * Dependency-free tests for Milestone 1: PlaylistManager.
 */
public class PlaylistManagerTest {

    private PlaylistManager playlist;
    private Song s1;
    private Song s2;
    private Song s3;

    public void setUp() {
        playlist = new PlaylistManager();
        s1 = new Song("S1", "Song One", "Artist A", 180);
        s2 = new Song("S2", "Song Two", "Artist B", 200);
        s3 = new Song("S3", "Song Three", "Artist C", 220);
    }

    public void testAddSong() {
        setUp();
        assertTrue(playlist.addSong(s1), "Adding s1 should succeed");
        assertEquals(1, playlist.size(), "Size should be 1");
        assertEquals(s1, playlist.getHead().getSong(), "Head should be s1");
        assertEquals(s1, playlist.getTail().getSong(), "Tail should be s1");
        assertEquals(s1, playlist.getCurrentSong(), "Current should be s1");
        assertTrue(playlist.containsSong("S1"), "Should contain S1");

        assertTrue(playlist.addSong(s2), "Adding s2 should succeed");
        assertEquals(2, playlist.size(), "Size should be 2");
        assertEquals(s1, playlist.getHead().getSong(), "Head should remain s1");
        assertEquals(s2, playlist.getTail().getSong(), "Tail should be s2");
        assertEquals(s1, playlist.getCurrentSong(), "Initial cursor remains s1");
    }

    public void testRejectDuplicateSongId() {
        setUp();
        assertTrue(playlist.addSong(s1));
        Song duplicate = new Song("S1", "Duplicate Name", "Other Artist", 999);
        assertFalse(playlist.addSong(duplicate), "Adding duplicate ID should return false");
        assertEquals(1, playlist.size(), "Size must remain 1");
        assertEquals("Song One", playlist.getSong("S1").getTitle(), "Original song data must not be corrupted");
        assertNull(playlist.getHead().getNext(), "Head next pointer must remain null");
    }

    public void testRemoveHead() {
        setUp();
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);

        assertTrue(playlist.removeSong("S1"), "Removing head should succeed");
        assertEquals(2, playlist.size(), "Size should be 2");
        assertFalse(playlist.containsSong("S1"), "Map should no longer contain S1");
        assertEquals(s2, playlist.getHead().getSong(), "Head should advance to s2");
        assertNull(playlist.getHead().getPrev(), "New head prev must be null");
        assertEquals(s2, playlist.getCurrentSong(), "Cursor was at s1, should advance to s2");
    }

    public void testRemoveTail() {
        setUp();
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);

        assertTrue(playlist.removeSong("S3"), "Removing tail should succeed");
        assertEquals(2, playlist.size(), "Size should be 2");
        assertFalse(playlist.containsSong("S3"), "Map should no longer contain S3");
        assertEquals(s2, playlist.getTail().getSong(), "Tail should retreat to s2");
        assertNull(playlist.getTail().getNext(), "New tail next must be null");
    }

    public void testRemoveMiddle() {
        setUp();
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);

        assertTrue(playlist.removeSong("S2"), "Removing middle node should succeed");
        assertEquals(2, playlist.size(), "Size should be 2");
        assertFalse(playlist.containsSong("S2"), "Map should no longer contain S2");

        assertEquals(s1, playlist.getHead().getSong(), "Head is s1");
        assertEquals(s3, playlist.getTail().getSong(), "Tail is s3");
        assertEquals(s3, playlist.getHead().getNext().getSong(), "Head next connects to s3");
        assertEquals(s1, playlist.getTail().getPrev().getSong(), "Tail prev connects to s1");
    }

    public void testRemoveCurrentSong() {
        setUp();
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);

        // Advance cursor to s2
        assertEquals(s2, playlist.next());
        assertEquals(s2, playlist.getCurrentSong());

        // Remove s2 (middle & current) -> advances to s3
        assertTrue(playlist.removeSong("S2"));
        assertEquals(s3, playlist.getCurrentSong(), "Cursor should advance to s3");

        // Remove s3 (tail & current) -> retreats to s1
        assertTrue(playlist.removeSong("S3"));
        assertEquals(s1, playlist.getCurrentSong(), "Cursor should fall back to s1");

        // Remove s1 (last remaining & current) -> becomes null
        assertTrue(playlist.removeSong("S1"));
        assertNull(playlist.getCurrentSong(), "Cursor should be null when list is empty");
        assertTrue(playlist.isEmpty(), "Playlist should be empty");
    }

    public void testSequentialRemovalOfCurrentSong() {
        setUp();
        Song s4 = new Song("S4", "Song Four", "Artist D");
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);
        playlist.addSong(s4);

        // Move to S2
        playlist.next();
        assertEquals(s2, playlist.getCurrentSong());

        // Remove head (S1) while cursor is at S2 -> cursor must remain at S2
        assertTrue(playlist.removeSong("S1"));
        assertEquals(s2, playlist.getCurrentSong(), "Cursor must remain at S2 when S1 is removed");
        assertEquals(s2, playlist.getHead().getSong(), "New head is S2");

        // Remove S2 (which is now head AND current) -> cursor advances to S3
        assertTrue(playlist.removeSong("S2"));
        assertEquals(s3, playlist.getCurrentSong(), "Cursor must advance to S3 when head current is removed");
        assertEquals(s3, playlist.getHead().getSong(), "New head is S3");

        // Advance to S4 (tail)
        playlist.next();
        assertEquals(s4, playlist.getCurrentSong());

        // Remove S4 (tail & current) -> cursor retreats to S3
        assertTrue(playlist.removeSong("S4"));
        assertEquals(s3, playlist.getCurrentSong(), "Cursor must retreat to S3 when tail current is removed");
        assertEquals(s3, playlist.getTail().getSong(), "Tail is now S3");
        assertEquals(1, playlist.size());
    }

    public void testRemoveNonexistentSong() {
        setUp();
        playlist.addSong(s1);
        assertFalse(playlist.removeSong("NONEXISTENT"), "Removing unknown ID should return false");
        assertFalse(playlist.removeSong(null), "Removing null ID should return false");
        assertEquals(1, playlist.size(), "Size should remain 1");
    }

    public void testForwardAndBackwardNavigation() {
        setUp();
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.addSong(s3);

        assertEquals(s1, playlist.getCurrentSong());
        assertEquals(s2, playlist.next());
        assertEquals(s3, playlist.next());

        assertEquals(s2, playlist.previous());
        assertEquals(s1, playlist.previous());
        // At head, previous stays at head when repeat is off
        assertEquals(s1, playlist.previous());
    }

    public void testRepeatEnabledNavigation() {
        setUp();
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.setRepeat(true);

        assertEquals(s2, playlist.next());
        // At tail with repeat ON, wraps to head
        assertEquals(s1, playlist.next());
        assertEquals(s1, playlist.getCurrentSong());

        // At head with repeat ON, previous wraps to tail
        assertEquals(s2, playlist.previous());
        assertEquals(s2, playlist.getCurrentSong());
    }

    public void testRepeatDisabledAtEnd() {
        setUp();
        playlist.addSong(s1);
        playlist.addSong(s2);
        playlist.setRepeat(false);

        assertEquals(s2, playlist.next());
        assertEquals(s2, playlist.getCurrentSong());

        // At tail with repeat OFF: returns "end" and leaves cursor unchanged
        Object result = playlist.next();
        assertEquals("end", result);
        assertEquals(s2, playlist.getCurrentSong(), "Cursor must remain unchanged at final song");
    }

    public void testEmptyPlaylist() {
        setUp();
        assertTrue(playlist.isEmpty());
        assertNull(playlist.getCurrentSong());
        assertNull(playlist.next());
        assertNull(playlist.previous());
        assertFalse(playlist.removeSong("ANY"));
    }

    public void testOneSongPlaylist() {
        setUp();
        playlist.addSong(s1);
        assertEquals(s1, playlist.getCurrentSong());

        // With repeat OFF: next returns "end" and stays at s1
        assertEquals("end", playlist.next());
        assertEquals(s1, playlist.getCurrentSong());

        // With repeat ON: next wraps to s1
        playlist.toggleRepeat();
        assertTrue(playlist.isRepeat());
        assertEquals(s1, playlist.next());
        assertEquals(s1, playlist.previous());

        // Remove only song
        assertTrue(playlist.removeSong("S1"));
        assertTrue(playlist.isEmpty());
        assertNull(playlist.getCurrentSong());
    }

    public void testHashMapConsistency() {
        setUp();
        for (int i = 1; i <= 5; i++) {
            playlist.addSong(new Song("ID_" + i, "Title " + i, "Artist " + i));
        }
        assertEquals(5, playlist.size());

        playlist.removeSong("ID_2");
        playlist.removeSong("ID_4");
        assertEquals(3, playlist.size());

        assertNotNull(playlist.getSong("ID_1"));
        assertNull(playlist.getSong("ID_2"));
        assertNotNull(playlist.getSong("ID_3"));
        assertNull(playlist.getSong("ID_4"));
        assertNotNull(playlist.getSong("ID_5"));

        List<Song> ordered = playlist.getSongsInOrder();
        assertEquals(3, ordered.size());
        assertEquals("ID_1", ordered.get(0).getId());
        assertEquals("ID_3", ordered.get(1).getId());
        assertEquals("ID_5", ordered.get(2).getId());
    }
}
