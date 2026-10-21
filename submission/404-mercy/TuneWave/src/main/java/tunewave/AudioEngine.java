package tunewave;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.Clip;
import javax.sound.sampled.FloatControl;
import javax.sound.sampled.LineEvent;
import javax.sound.sampled.LineUnavailableException;
import javax.sound.sampled.UnsupportedAudioFileException;
import javax.swing.SwingUtilities;

/**
 * High-fidelity Audio Engine for the TuneWave Music Player desktop application.
 *
 * <p>Supports playback of real audio files (WAV, MP3, AIFF, AU) via the Java Sound API
 * and registered SPI decoders (such as Tritonus/MP3SPI). Decodes streams into buffered
 * 16-bit signed PCM memory lines to enable sample-accurate microsecond seeking, instant
 * play/pause toggling, and real-time position reporting without audio drift.</p>
 *
 * <p>Maintains explicit songId-to-file associations, decoupling physical media from
 * underlying DSA playlist nodes and catalog metadata.</p>
 */
public class AudioEngine {

    /**
     * Discrete playback states for the audio engine.
     */
    public enum PlaybackState {
        STOPPED,
        PLAYING,
        PAUSED
    }

    private final Map<String, File> songAudioMap = new HashMap<>();
    private Clip currentClip;
    private String activeSongId;
    private PlaybackState state = PlaybackState.STOPPED;
    private Runnable onTrackFinished;
    private volatile boolean userInitiatedStop = false;

    public AudioEngine() {
        // default constructor
    }

    // =========================================================================
    // File Association Management
    // =========================================================================

    /**
     * Associates a local audio file with a song ID.
     *
     * @param songId unique song identifier (e.g. "S01")
     * @param file   valid audio file (e.g. .wav, .mp3)
     */
    public synchronized void linkAudio(String songId, File file) {
        if (songId != null && file != null && file.exists()) {
            songAudioMap.put(songId, file);
        }
    }

    /**
     * Unlinks any audio file assigned to the given song ID.
     *
     * @param songId unique song identifier
     */
    public synchronized void unlinkAudio(String songId) {
        if (songId != null) {
            songAudioMap.remove(songId);
        }
    }

    /**
     * Checks if a song has an existing audio file mapped.
     *
     * @param songId unique song identifier
     * @return true if an existing file is mapped
     */
    public synchronized boolean hasAudio(String songId) {
        if (songId == null) return false;
        File f = songAudioMap.get(songId);
        return f != null && f.exists();
    }

    /**
     * Retrieves the audio file mapped to a song.
     *
     * @param songId unique song identifier
     * @return the associated file or null
     */
    public synchronized File getAudioFile(String songId) {
        return songAudioMap.get(songId);
    }

    /**
     * Retrieves the display name of the audio file mapped to a song.
     *
     * @param songId unique song identifier
     * @return filename or "None"
     */
    public synchronized String getAudioFileName(String songId) {
        File f = songAudioMap.get(songId);
        return (f != null && f.exists()) ? f.getName() : "None";
    }

    /**
     * Returns an unmodifiable view of all linked audio files.
     */
    public synchronized Map<String, File> getLinkedAudioMap() {
        return Collections.unmodifiableMap(new HashMap<>(songAudioMap));
    }

    // =========================================================================
    // Playback Controls
    // =========================================================================

    /**
     * Plays or resumes audio for the specified song.
     *
     * @param songId song identifier to play
     * @return true if playback was started or resumed; false if no audio file is mapped or error occurred
     */
    public synchronized boolean play(String songId) {
        if (songId == null) {
            stop();
            return false;
        }

        // 1. Resume if already paused on the same song
        if (songId.equals(activeSongId) && currentClip != null) {
            if (state == PlaybackState.PAUSED) {
                userInitiatedStop = false;
                currentClip.start();
                state = PlaybackState.PLAYING;
                return true;
            } else if (state == PlaybackState.PLAYING) {
                return true; // Already playing
            }
        }

        // 2. Different track or freshly playing: clean up prior clip
        stopCurrentClipSilently();

        File audioFile = songAudioMap.get(songId);
        if (audioFile == null || !audioFile.exists()) {
            activeSongId = null;
            state = PlaybackState.STOPPED;
            return false;
        }

        try {
            loadAndOpenClip(audioFile);
            activeSongId = songId;
            userInitiatedStop = false;
            currentClip.start();
            state = PlaybackState.PLAYING;
            return true;
        } catch (Exception e) {
            System.err.println("[TuneWave AudioEngine] Failed to load audio file: " + audioFile + " - " + e.getMessage());
            stopCurrentClipSilently();
            activeSongId = null;
            state = PlaybackState.STOPPED;
            return false;
        }
    }

    /**
     * Pauses the currently playing audio stream.
     */
    public synchronized void pause() {
        if (currentClip != null && currentClip.isRunning()) {
            userInitiatedStop = true;
            currentClip.stop();
            state = PlaybackState.PAUSED;
        }
    }

    /**
     * Resumes playback if currently paused.
     */
    public synchronized void resume() {
        if (currentClip != null && state == PlaybackState.PAUSED) {
            userInitiatedStop = false;
            currentClip.start();
            state = PlaybackState.PLAYING;
        }
    }

    /**
     * Stops playback and resets the timeline position to the beginning.
     */
    public synchronized void stop() {
        userInitiatedStop = true;
        if (currentClip != null) {
            currentClip.stop();
            currentClip.setFramePosition(0);
            currentClip.setMicrosecondPosition(0);
        }
        state = PlaybackState.STOPPED;
    }

    /**
     * Closes the active clip and releases audio device hardware resources.
     */
    public synchronized void close() {
        stopCurrentClipSilently();
        activeSongId = null;
        state = PlaybackState.STOPPED;
    }

    private void stopCurrentClipSilently() {
        userInitiatedStop = true;
        if (currentClip != null) {
            try {
                if (currentClip.isRunning()) {
                    currentClip.stop();
                }
                currentClip.close();
            } catch (Exception ignored) {
            }
            currentClip = null;
        }
    }

    /**
     * Loads an audio file, decodes any compressed format (e.g. MP3) into 16-bit
     * PCM audio bytes, and opens a seekable Java Sound {@link Clip}.
     */
    private void loadAndOpenClip(File file)
            throws UnsupportedAudioFileException, IOException, LineUnavailableException {

        try (AudioInputStream sourceStream = AudioSystem.getAudioInputStream(file)) {
            AudioFormat baseFormat = sourceStream.getFormat();

            AudioInputStream decodedStream;
            AudioFormat decodedFormat;

            if (baseFormat.getEncoding() == AudioFormat.Encoding.PCM_SIGNED && baseFormat.getSampleSizeInBits() == 16) {
                decodedStream = sourceStream;
                decodedFormat = baseFormat;
            } else {
                decodedFormat = new AudioFormat(
                        AudioFormat.Encoding.PCM_SIGNED,
                        baseFormat.getSampleRate(),
                        16,
                        baseFormat.getChannels() > 0 ? baseFormat.getChannels() : 2,
                        (baseFormat.getChannels() > 0 ? baseFormat.getChannels() : 2) * 2,
                        baseFormat.getSampleRate(),
                        false
                );
                decodedStream = AudioSystem.getAudioInputStream(decodedFormat, sourceStream);
            }

            // Buffer entire decoded PCM into memory for instant, zero-latency seeking
            byte[] pcmData = decodedStream.readAllBytes();
            long totalFrames = pcmData.length / decodedFormat.getFrameSize();

            AudioInputStream memoryStream = new AudioInputStream(
                    new ByteArrayInputStream(pcmData),
                    decodedFormat,
                    totalFrames
            );

            currentClip = AudioSystem.getClip();
            currentClip.open(memoryStream);
            applyVolumeToClip();

            // Listener to detect natural track end
            currentClip.addLineListener(event -> {
                if (event.getType() == LineEvent.Type.STOP) {
                    if (!userInitiatedStop && isNearEnd()) {
                        synchronized (AudioEngine.this) {
                            state = PlaybackState.STOPPED;
                        }
                        if (onTrackFinished != null) {
                            SwingUtilities.invokeLater(onTrackFinished);
                        }
                    }
                }
            });
        }
    }

    private synchronized boolean isNearEnd() {
        if (currentClip == null) return false;
        long pos = currentClip.getMicrosecondPosition();
        long len = currentClip.getMicrosecondLength();
        return len > 0 && (len - pos) < 300_000; // Within 300ms of end
    }

    // =========================================================================
    // Timeline Seeking & Positioning
    // =========================================================================

    /**
     * Seeks to a position specified as a percentage [0.0, 1.0].
     *
     * @param fraction 0.0 for start, 1.0 for end
     */
    public synchronized void seekToPercent(double fraction) {
        if (currentClip == null) return;
        double clamped = Math.max(0.0, Math.min(1.0, fraction));
        long targetUs = (long) (clamped * currentClip.getMicrosecondLength());
        seekToMicroseconds(targetUs);
    }

    /**
     * Seeks to an absolute position in microseconds.
     *
     * @param microsecondPosition target microsecond timestamp
     */
    public synchronized void seekToMicroseconds(long microsecondPosition) {
        if (currentClip == null) return;
        long target = Math.max(0, Math.min(currentClip.getMicrosecondLength(), microsecondPosition));
        currentClip.setMicrosecondPosition(target);
    }

    /**
     * Returns the current playback position in microseconds.
     */
    public synchronized long getPositionMicroseconds() {
        if (state == PlaybackState.STOPPED) {
            return 0L;
        }
        return (currentClip != null) ? currentClip.getMicrosecondPosition() : 0L;
    }

    /**
     * Returns total track length in microseconds.
     */
    public synchronized long getLengthMicroseconds() {
        return (currentClip != null) ? currentClip.getMicrosecondLength() : 0L;
    }

    /**
     * Returns current playback completion fraction [0.0, 1.0].
     */
    public synchronized double getProgressFraction() {
        if (currentClip == null) return 0.0;
        long len = currentClip.getMicrosecondLength();
        if (len <= 0) return 0.0;
        return Math.max(0.0, Math.min(1.0, (double) currentClip.getMicrosecondPosition() / len));
    }

    private float volume = 0.85f; // default volume (85%)

    /**
     * Adjusts the output playback volume (0.0f silent to 1.0f full volume).
     */
    public synchronized void setVolume(float vol) {
        this.volume = Math.max(0.0f, Math.min(1.0f, vol));
        applyVolumeToClip();
    }

    /**
     * Returns the current volume level between 0.0f and 1.0f.
     */
    public synchronized float getVolume() {
        return volume;
    }

    private void applyVolumeToClip() {
        if (currentClip != null && currentClip.isOpen()) {
            try {
                if (currentClip.isControlSupported(FloatControl.Type.MASTER_GAIN)) {
                    FloatControl gain = (FloatControl) currentClip.getControl(FloatControl.Type.MASTER_GAIN);
                    if (volume <= 0.001f) {
                        gain.setValue(gain.getMinimum());
                    } else {
                        float min = gain.getMinimum();
                        float max = Math.min(6.0f, gain.getMaximum());
                        float dB = (float) (Math.log10(volume) * 20.0);
                        gain.setValue(Math.max(min, Math.min(max, dB)));
                    }
                }
            } catch (Exception ignored) {
            }
        }
    }

    /**
     * Initializes default synthesized preview audio files for any unlinked songs,
     * ensuring immediate out-of-the-box audible playback on any workstation.
     */
    public synchronized void initSampleAudioCache(File cacheDir, Iterable<Song> songs) {
        if (cacheDir != null && !cacheDir.exists()) {
            cacheDir.mkdirs();
        }
        double[] freqs = { 440.0, 523.25, 392.0, 349.23, 329.63, 293.66, 493.88, 261.63, 466.16, 415.30, 369.99, 311.13 };
        int idx = 0;
        for (Song song : songs) {
            String sid = song.getSongId();
            if (!hasAudio(sid)) {
                String safeName = sid + "_" + song.getTitle().replaceAll("[^a-zA-Z0-9]", "_") + ".wav";
                File target = new File(cacheDir, safeName);
                if (!target.exists()) {
                    try {
                        double f = freqs[idx % freqs.length];
                        generateSampleWav(target, 45.0, f);
                    } catch (Exception e) {
                        System.err.println("Failed to generate preview WAV for " + sid + ": " + e.getMessage());
                    }
                }
                if (target.exists()) {
                    linkAudio(sid, target);
                }
            }
            idx++;
        }
    }

    public synchronized PlaybackState getState() {
        return state;
    }

    public synchronized boolean isPlaying() {
        return state == PlaybackState.PLAYING && currentClip != null && currentClip.isRunning();
    }

    public synchronized boolean isPaused() {
        return state == PlaybackState.PAUSED;
    }

    public synchronized String getActiveSongId() {
        return activeSongId;
    }

    public void setOnTrackFinished(Runnable onTrackFinished) {
        this.onTrackFinished = onTrackFinished;
    }

    // =========================================================================
    // Time Formatting Utility
    // =========================================================================

    /**
     * Formats microseconds into MM:SS display format.
     */
    public static String formatMicroseconds(long us) {
        long totalSeconds = Math.max(0, us / 1_000_000L);
        long minutes = totalSeconds / 60;
        long seconds = totalSeconds % 60;
        return String.format("%d:%02d", minutes, seconds);
    }

    // =========================================================================
    // Built-in Pure Java WAV Audio Generator
    // =========================================================================

    /**
     * Generates a pleasant CD-quality stereo WAV audio file (44.1 kHz, 16-bit PCM).
     * Used to provide immediate out-of-the-box audible demonstration tracks.
     *
     * @param targetFile      destination file
     * @param durationSeconds length in seconds
     * @param baseFreqHz      fundamental pitch frequency
     * @return the generated file
     * @throws IOException on I/O error
     */
    public static File generateSampleWav(File targetFile, double durationSeconds, double baseFreqHz) throws IOException {
        File parent = targetFile.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }

        int sampleRate = 44100;
        short channels = 2;
        short bitsPerSample = 16;
        int totalFrames = (int) (sampleRate * durationSeconds);
        int bytesPerFrame = channels * (bitsPerSample / 8);
        int dataSize = totalFrames * bytesPerFrame;
        int chunkSize = 36 + dataSize;

        ByteBuffer buffer = ByteBuffer.allocate(44 + dataSize);
        buffer.order(ByteOrder.LITTLE_ENDIAN);

        // 1. RIFF Chunk Descriptor
        buffer.put((byte) 'R').put((byte) 'I').put((byte) 'F').put((byte) 'F');
        buffer.putInt(chunkSize);
        buffer.put((byte) 'W').put((byte) 'A').put((byte) 'V').put((byte) 'E');

        // 2. "fmt " Sub-chunk
        buffer.put((byte) 'f').put((byte) 'm').put((byte) 't').put((byte) ' ');
        buffer.putInt(16); // Subchunk1Size for PCM
        buffer.putShort((short) 1); // AudioFormat (1 = PCM)
        buffer.putShort(channels);
        buffer.putInt(sampleRate);
        buffer.putInt(sampleRate * bytesPerFrame); // ByteRate
        buffer.putShort((short) bytesPerFrame); // BlockAlign
        buffer.putShort(bitsPerSample);

        // 3. "data" Sub-chunk
        buffer.put((byte) 'd').put((byte) 'a').put((byte) 't').put((byte) 'a');
        buffer.putInt(dataSize);

        // 4. Synthesize warm musical chords with smooth decay
        for (int i = 0; i < totalFrames; i++) {
            double t = (double) i / sampleRate;
            // Envelope: gentle attack, pleasant sustained chord, subtle decay
            double envelope = Math.min(1.0, t * 10.0) * Math.max(0.0, 1.0 - (t / durationSeconds) * 0.4);

            // Left channel: Fundamental + 3rd harmonic
            double valL = (Math.sin(2 * Math.PI * baseFreqHz * t) * 0.7
                    + Math.sin(2 * Math.PI * (baseFreqHz * 1.5) * t) * 0.3) * envelope;

            // Right channel: Perfect 5th + octave
            double valR = (Math.sin(2 * Math.PI * (baseFreqHz * 1.25) * t) * 0.6
                    + Math.sin(2 * Math.PI * (baseFreqHz * 2.0) * t) * 0.4) * envelope;

            short sampleL = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, valL * 16000));
            short sampleR = (short) Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, valR * 16000));

            buffer.putShort(sampleL);
            buffer.putShort(sampleR);
        }

        try (FileOutputStream fos = new FileOutputStream(targetFile)) {
            fos.write(buffer.array());
        }

        return targetFile;
    }
}

