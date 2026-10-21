package tunewave;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link Song}.
 */
class SongTest {

    @Test
    void constructorSetsFields() {
        Song s = new Song("S1", "My Song", "Artist X");
        assertEquals("S1",       s.getSongId());
        assertEquals("My Song",  s.getTitle());
        assertEquals("Artist X", s.getArtist());
    }

    @Test
    void constructorTrimsWhitespace() {
        Song s = new Song("  S1  ", "  Title  ", "  Artist  ");
        assertEquals("S1",     s.getSongId());
        assertEquals("Title",  s.getTitle());
        assertEquals("Artist", s.getArtist());
    }

    @Test
    void nullSongIdThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> new Song(null, "T", "A"));
    }

    @Test
    void blankSongIdThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> new Song("  ", "T", "A"));
    }

    @Test
    void nullTitleThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> new Song("S1", null, "A"));
    }

    @Test
    void nullArtistThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> new Song("S1", "T", null));
    }

    @Test
    void equalityByIdOnly() {
        Song a = new Song("S1", "Title A", "Artist A");
        Song b = new Song("S1", "Title B", "Artist B"); // same ID, different content
        assertEquals(a, b, "Songs with same ID must be equal");
    }

    @Test
    void differentIdsAreNotEqual() {
        Song a = new Song("S1", "Title", "Artist");
        Song b = new Song("S2", "Title", "Artist");
        assertNotEquals(a, b);
    }

    @Test
    void hashCodeConsistentWithEquals() {
        Song a = new Song("S1", "T", "A");
        Song b = new Song("S1", "T", "A");
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void toStringContainsSongId() {
        Song s = new Song("S99", "Epic", "Composer");
        assertTrue(s.toString().contains("S99"));
    }
}

