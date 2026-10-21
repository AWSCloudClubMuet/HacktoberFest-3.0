package com.phantomx.tunewave.dsa;

import java.util.ArrayList;
import java.util.List;

public final class TuneWavePlayer {
    public static final int HISTORY_LIMIT = HistoryStack.MAX;

    private final Playlist playlist = new Playlist();
    private final PlaybackEngine playback = new PlaybackEngine(playlist);
    private final SongSearchTree catalog = new SongSearchTree();
    private final ArtistGraph artists = new ArtistGraph();

    public boolean addSong(Song song) {
        if (!playlist.addSong(song)) {
            return false;
        }
        if (song.getTitle() != null) {
            catalog.addSong(song.getTitle(), song.getId());
        }
        return true;
    }

    public boolean removeSong(String songId) {
        Song song = playlist.getSong(songId);
        if (!playlist.removeSong(songId)) {
            return false;
        }
        if (song != null && song.getTitle() != null) {
            catalog.removeSong(song.getTitle(), songId);
        }
        return true;
    }

    public NextResult next() {
        return playlist.next();
    }

    public Song previous() {
        return playlist.previous();
    }

    public boolean toggleRepeat() {
        return playlist.toggleRepeat();
    }

    public void addToUpNext(String songId) {
        playback.addToUpNext(songId);
    }

    public PlayResult playNext() {
        return playback.playNext();
    }

    public PlayResult back() {
        return playback.back();
    }

    public List<String> findSong(String title) {
        return catalog.findSong(title);
    }

    public List<String> prefixSearch(String prefix) {
        return catalog.prefixSearch(prefix);
    }

    public void addRelation(String artistA, String artistB) {
        artists.addRelation(artistA, artistB);
    }

    public List<String> recommendArtists(String artist) {
        return artists.recommendArtists(artist);
    }

    public Playlist playlist() {
        return playlist;
    }

    public PlaybackEngine playback() {
        return playback;
    }

    public Song getSong(String songId) {
        return playlist.getSong(songId);
    }

    public Song getCurrent() {
        return playlist.getCurrent();
    }

    public Song getNowPlaying() {
        return playback.getNowPlaying();
    }

    public boolean isRepeatEnabled() {
        return playlist.isRepeatEnabled();
    }

    public boolean isPlayingOverride() {
        return playback.isPlayingOverride();
    }

    public List<Song> songsInOrder() {
        return resolve(playlist.idsInOrder());
    }

    public List<Song> upNextSongs() {
        return resolve(playback.upNextIds());
    }

    public List<Song> historySongs() {
        return resolve(playback.historyOldestFirst());
    }

    private List<Song> resolve(List<String> ids) {
        List<Song> songs = new ArrayList<Song>();
        for (int i = 0; i < ids.size(); i++) {
            Song song = playlist.getSong(ids.get(i));
            songs.add(song != null ? song : new Song(ids.get(i), ids.get(i)));
        }
        return songs;
    }
}
