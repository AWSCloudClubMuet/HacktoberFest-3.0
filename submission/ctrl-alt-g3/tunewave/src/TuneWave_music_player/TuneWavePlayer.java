package TuneWave_music_player;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/** Coordinates all six structures under one lock; never performs network or audio I/O. */
public final class TuneWavePlayer {
    public enum Source { NONE, PLAYLIST, UP_NEXT, HISTORY }
    public record Playback(String status, Song song, Source source) { }

    private final Playlist playlist = new Playlist();
    private final Map<String, Song> catalog = new LinkedHashMap<>();
    private final UpNextQueue upNext = new UpNextQueue();
    private final HistoryStack history = new HistoryStack();
    private final SongSearch search = new SongSearch();
    private final ArtistGraph artists = new ArtistGraph();
    private Song nowPlaying;
    private Source source = Source.NONE;
    // Adding the first song establishes a position but does not skip it on first play.
    private boolean positionNeedsPlay = true;

    /** Catalog registration is independent of playlist membership. IDs are never regenerated. */
    public synchronized boolean registerSong(Song song) {
        Objects.requireNonNull(song, "song");
        if (catalog.containsKey(song.songId())) return false;
        search.addSong(song.title(), song.songId());
        catalog.put(song.songId(), song);
        artists.addArtist(song.artistId(), artists.artistName(song.artistId()));
        return true;
    }

    /** Milestone 1: register metadata if new, then append to the playlist once. */
    public synchronized boolean addSong(Song song) {
        registerSong(song);
        return addToPlaylist(song.songId());
    }

    public synchronized boolean addToPlaylist(String songId) {
        Song song = requireSong(songId);
        boolean wasEmpty = playlist.size() == 0;
        boolean added = playlist.addSong(song);
        if (added && wasEmpty) positionNeedsPlay = true;
        return added;
    }

    /** Removal does not delete catalog, queued entries, history, or the playing song. */
    public synchronized boolean removeSong(String songId) {
        Song.requireId(songId);
        boolean wasCurrent = playlist.currentSong().map(s -> s.songId().equals(songId)).orElse(false);
        boolean removed = playlist.removeSong(songId);
        if (removed && wasCurrent) positionNeedsPlay = true;
        return removed;
    }

    /** Queue duplicates are allowed, but every ID must already be in the catalog. */
    public synchronized void addToUpNext(String songId) {
        requireSong(songId);
        upNext.enqueue(songId);
    }

    public synchronized Playback playNext() {
        String queued = upNext.dequeue();
        if (queued != null) return recordPlay(catalog.get(queued), Source.UP_NEXT);
        Song position = playlist.currentSong().orElse(null);
        if (position == null) return unchanged("empty");
        if (positionNeedsPlay) {
            positionNeedsPlay = false;
            return recordPlay(position, Source.PLAYLIST);
        }
        Playlist.Navigation navigation = playlist.next();
        if (!navigation.status().equals("ok")) return unchanged(navigation.status());
        return recordPlay(navigation.song(), Source.PLAYLIST);
    }

    /** Literal task rule: replay and REMOVE the top. Never push a back replay again. */
    public synchronized Playback back() {
        Song song = history.pop();
        if (song == null) return unchanged("empty");
        nowPlaying = song;
        source = Source.HISTORY;
        return new Playback("ok", nowPlaying, source);
    }

    /** Explicit user selection; queue priority still applies on the next playNext(). */
    public synchronized Playback playSong(String songId) {
        requireSong(songId);
        if (!playlist.selectSong(songId)) return unchanged("missing");
        positionNeedsPlay = false;
        return recordPlay(playlist.currentSong().orElseThrow(), Source.PLAYLIST);
    }

    /** Playlist previous is intentionally separate from history back. */
    public synchronized Playback previous() {
        Playlist.Navigation navigation = playlist.previous();
        if (!navigation.status().equals("ok")) return unchanged(navigation.status());
        positionNeedsPlay = false;
        return recordPlay(navigation.song(), Source.PLAYLIST);
    }

    public synchronized boolean toggleRepeat() { return playlist.toggleRepeat(); }
    public synchronized boolean isRepeatEnabled() { return playlist.isRepeatEnabled(); }
    public synchronized Optional<Song> nowPlaying() { return Optional.ofNullable(nowPlaying); }
    public synchronized Source playbackSource() { return source; }
    public synchronized Optional<Song> playlistPosition() { return playlist.currentSong(); }
    public synchronized List<Song> playlistSongs() { return playlist.songs(); }
    public synchronized List<Song> catalogSongs() { return List.copyOf(catalog.values()); }
    public synchronized List<Song> upNextSongs() {
        return upNext.songIds().stream().map(catalog::get).toList();
    }
    public synchronized List<Song> historySongs() { return history.songs(); }
    public synchronized List<Song> findSong(String title) {
        return search.findSong(title).stream().map(e -> catalog.get(e.songId())).toList();
    }
    public synchronized List<Song> prefixSearch(String prefix) {
        return search.prefixSearch(prefix).stream().map(e -> catalog.get(e.songId())).toList();
    }

    public synchronized void registerArtist(String artistId, String name) { artists.addArtist(artistId, name); }
    public synchronized boolean addRelation(String a, String b) { return artists.addRelation(a, b); }
    public synchronized List<String> recommendArtists(String artist) { return artists.recommendArtists(artist); }
    public synchronized List<String> relatedArtists(String artist) { return artists.relatedArtists(artist); }
    public synchronized List<String> artistIds() { return artists.artists(); }
    public synchronized String artistName(String artist) { return artists.artistName(artist); }
    public synchronized List<ArtistGraph.Relation> relations() { return artists.relations(); }
    public synchronized List<Playlist.NodeView> playlistNodes() { return playlist.nodeViews(); }
    public synchronized List<Playlist.MapEntry> playlistIndex() { return playlist.indexEntries(); }
    public synchronized List<SongSearch.TreeNode> searchTree() { return search.treeNodes(); }
    public synchronized SongSearch.Trace searchTrace() { return search.lastTrace(); }

    private Song requireSong(String songId) {
        Song.requireId(songId);
        Song song = catalog.get(songId);
        if (song == null) throw new IllegalArgumentException("Unknown song ID: " + songId);
        return song;
    }

    private Playback recordPlay(Song song, Source from) {
        nowPlaying = song;
        source = from;
        history.push(song);
        return new Playback("ok", song, from);
    }

    private Playback unchanged(String status) { return new Playback(status, nowPlaying, source); }
}
