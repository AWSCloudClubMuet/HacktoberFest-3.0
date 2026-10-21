package tunewave;

import static org.junit.jupiter.api.Assertions.*;

import java.io.File;
import org.junit.jupiter.api.Test;

/**
 * End-to-end automated verification for TuneWave integrations,
 * cache files, and data structures.
 */
class TuneWaveGUITest {

    @Test
    void testSampleDataInitialization() {
        TuneWaveService service = Main.buildSampleData();
        assertEquals(12, service.playlistSize(), "Initial playlist should contain 12 songs");
        assertNotNull(service.getSong("S01"));
        assertEquals("Blinding Lights", service.getSong("S01").getTitle());
    }

    @Test
    void testAudioCacheFilesExistAndAreValid() {
        File cacheDir = new File("audio_cache");
        assertTrue(cacheDir.exists() && cacheDir.isDirectory(), "audio_cache directory should exist");

        File s01Wav = new File(cacheDir, "S01_Blinding_Lights.wav");
        assertTrue(s01Wav.exists(), "S01 WAV preview file should exist");
        assertTrue(s01Wav.length() > 100_000, "WAV preview file should contain valid PCM data");
    }

    @Test
    void testServiceMilestoneIntegrationsWithGUI() {
        TuneWaveService service = Main.buildSampleData();

        // 1. Double-linked list cursor
        assertEquals("S01", service.currentSong().getSongId());
        service.playlistNext();
        assertEquals("S02", service.currentSong().getSongId());
        service.playlistPrevious();
        assertEquals("S01", service.currentSong().getSongId());

        // 2. Initial playback start
        Song initial = service.play();
        assertEquals("S01", initial.getSongId());
        assertEquals("S01", service.currentlyPlaying().getSongId());

        // 3. Up Next queue priority over playlist continuation
        service.addToUpNext("S09");
        service.addToUpNext("S10");
        assertEquals(2, service.getUpNextIds().size());

        Object next1 = service.playNext();
        assertTrue(next1 instanceof Song);
        assertEquals("S09", ((Song) next1).getSongId());
        // Doubly-linked cursor remains unchanged at S01
        assertEquals("S01", service.currentSong().getSongId());

        // 4. History stack (now contains previous song S01)
        assertEquals(1, service.getHistoryIds().size());
        Song backSong = service.back();
        assertEquals("S01", backSong.getSongId());

        // 5. Repeat toggle
        assertFalse(service.isRepeatEnabled());
        assertTrue(service.toggleRepeat());
        assertTrue(service.isRepeatEnabled());
        assertFalse(service.toggleRepeat());
    }
}

