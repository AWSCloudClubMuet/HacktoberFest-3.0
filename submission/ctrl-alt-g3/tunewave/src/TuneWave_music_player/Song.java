package TuneWave_music_player;

/** Immutable metadata. Playlist identity is songId, not record equality. */
public record Song(String songId, String title, String artistId) {
    public Song {
        if (songId == null || songId.isBlank()
                || title == null || title.isBlank()
                || artistId == null || artistId.isBlank()) {
            throw new IllegalArgumentException("Song ID, title and artist ID must be nonblank.");
        }
        requireId(songId);
        requireId(artistId);
        title = title.strip();
    }

    static String requireId(String id) {
        if (id == null || id.isBlank() || !id.equals(id.strip())) {
            throw new IllegalArgumentException("IDs must be nonblank with no surrounding whitespace.");
        }
        return id;
    }

    /** Use the same namespace for local fixtures and external catalog adapters. */
    public static Song fromProvider(String provider, String songId, String title, String artistId) {
        if (provider == null || !provider.matches("[a-z][a-z0-9-]*")) {
            throw new IllegalArgumentException("Provider must be a lowercase namespace, e.g. local.");
        }
        return new Song(provider + ":" + requireId(songId), title,
                provider + ":" + requireId(artistId));
    }
}
