package TuneWave_music_player;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/** Local display metadata, separate from playlist nodes and navigation. */
final class MusicLibrary {
    private final Map<String, String> artistIds = new HashMap<>();
    private final Map<String, String> artistNames = new HashMap<>();

    Song createSong(String title, String artist) {
        if (title == null || title.isBlank() || artist == null || artist.isBlank()) {
            throw new IllegalArgumentException("Enter a song title and artist name.");
        }
        String name = artist.strip();
        String key = name.toLowerCase(Locale.ROOT);
        String artistId = artistIds.computeIfAbsent(key, ignored -> "local:" + UUID.randomUUID());
        artistNames.putIfAbsent(artistId, name);
        Song song = new Song("local:" + UUID.randomUUID(), title.strip(), artistId);
        return song;
    }

    String artistName(Song song) {
        return artistNames.getOrDefault(song.artistId(), "Unknown artist");
    }

}
