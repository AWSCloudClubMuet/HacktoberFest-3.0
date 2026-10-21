package tunewave;

import static org.junit.jupiter.api.Assertions.*;

import java.io.File;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Automated tests for AudioEngine verifying playback, seeking, and mapping.
 */
class AudioEngineTest {

    private AudioEngine engine;
    private File sampleWav;

    @BeforeEach
    void setUp(@TempDir File tempDir) throws Exception {
        engine = new AudioEngine();
        sampleWav = new File(tempDir, "test_track.wav");
        AudioEngine.generateSampleWav(sampleWav, 2.0, 440.0);
    }

    @AfterEach
    void tearDown() {
        if (engine != null) {
            engine.close();
        }
    }

    @Test
    void testSampleWavGeneration() {
        assertTrue(sampleWav.exists(), "Sample WAV file must be created");
        assertTrue(sampleWav.length() > 1000, "WAV file should contain header and PCM data");
    }

    @Test
    void testAudioFileMapping() {
        assertFalse(engine.hasAudio("S01"));
        assertEquals("None", engine.getAudioFileName("S01"));

        engine.linkAudio("S01", sampleWav);
        assertTrue(engine.hasAudio("S01"));
        assertEquals(sampleWav.getName(), engine.getAudioFileName("S01"));
        assertEquals(sampleWav, engine.getAudioFile("S01"));

        engine.unlinkAudio("S01");
        assertFalse(engine.hasAudio("S01"));
    }

    @Test
    void testPlayWithoutAudioFileReturnsFalse() {
        boolean played = engine.play("NONEXISTENT_SONG");
        assertFalse(played, "Playing an unlinked song should return false without crashing");
        assertFalse(engine.isPlaying());
        assertEquals(AudioEngine.PlaybackState.STOPPED, engine.getState());
    }

    @Test
    void testPlayPauseResumeAndSeek() throws InterruptedException {
        engine.linkAudio("S01", sampleWav);

        boolean played = engine.play("S01");
        assertTrue(played, "AudioEngine should start playback for linked audio");
        assertEquals(AudioEngine.PlaybackState.PLAYING, engine.getState());
        assertEquals("S01", engine.getActiveSongId());
        assertTrue(engine.getLengthMicroseconds() > 0, "Length in microseconds should be positive");

        // Let it play briefly
        Thread.sleep(100);

        // Test seeking
        engine.pause();
        engine.seekToPercent(0.5);
        long pos = engine.getPositionMicroseconds();
        long len = engine.getLengthMicroseconds();
        assertTrue(pos >= (len / 2) - 200_000 && pos <= (len / 2) + 200_000,
                "Position (" + pos + ") should be around 50% (" + (len / 2) + ") after seek");

        // Test resume
        assertEquals(AudioEngine.PlaybackState.PAUSED, engine.getState());
        assertFalse(engine.isPlaying());

        // Test resume
        engine.resume();
        assertEquals(AudioEngine.PlaybackState.PLAYING, engine.getState());

        // Test stop
        engine.stop();
        assertEquals(AudioEngine.PlaybackState.STOPPED, engine.getState());
        assertEquals(0, engine.getPositionMicroseconds());
    }

    @Test
    void testTimeFormatting() {
        assertEquals("0:00", AudioEngine.formatMicroseconds(0));
        assertEquals("1:15", AudioEngine.formatMicroseconds(75_000_000L));
        assertEquals("3:42", AudioEngine.formatMicroseconds(222_000_000L));
    }

    @Test
    void testVolumeControl() {
        engine.setVolume(0.25f);
        assertEquals(0.25f, engine.getVolume(), 0.001f);

        engine.setVolume(1.0f);
        assertEquals(1.0f, engine.getVolume(), 0.001f);

        // Clamping check
        engine.setVolume(1.5f);
        assertEquals(1.0f, engine.getVolume(), 0.001f);

        engine.setVolume(-0.5f);
        assertEquals(0.0f, engine.getVolume(), 0.001f);
    }

    @Test
    void testSeekingForwardAndBackward() throws InterruptedException {
        engine.linkAudio("S01", sampleWav);
        engine.play("S01");
        Thread.sleep(100); // Let clip start so pause() can actually stop it
        engine.pause();

        long len = engine.getLengthMicroseconds();

        // Seek forward to 80%
        engine.seekToPercent(0.8);
        long pos1 = engine.getPositionMicroseconds();
        assertTrue(pos1 >= (long)(len * 0.7) && pos1 <= (long)(len * 0.9), "Seek forward should reach ~80%");

        // Seek backward to 20%
        engine.seekToPercent(0.2);
        long pos2 = engine.getPositionMicroseconds();
        assertTrue(pos2 >= (long)(len * 0.1) && pos2 <= (long)(len * 0.3), "Seek backward should reach ~20%");
    }

    @Test
    void testMp3SpiRegisteredOnClasspath() {
        // Verify Tritonus / MP3SPI AudioFileReader is registered and loadable
        assertDoesNotThrow(() -> {
            Class<?> mp3Reader = Class.forName("javazoom.spi.mpeg.sampled.file.MpegAudioFileReader");
            assertNotNull(mp3Reader, "MpegAudioFileReader must be present on classpath");
        });
    }
}
