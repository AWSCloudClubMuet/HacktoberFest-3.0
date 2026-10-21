package com.tunewave;

import java.util.List;

public class TuneWavePlayer {
    private final PlaylistManager playlistManager;
    private final PlaybackManager playbackManager;
    private final MusicCatalog musicCatalog;

    public TuneWavePlayer() {
        this.playlistManager = new PlaylistManager();
        this.musicCatalog = new MusicCatalog();
        this.playbackManager = new PlaybackManager(playlistManager, songId -> {
            Song s = musicCatalog.getSong(songId);
            return s != null ? s : playlistManager.getSong(songId);
        });
    }

    public boolean addSong(Song song) {
        if (song != null) {
            musicCatalog.registerSong(song);
        }
        return playlistManager.addSong(song);
    }

    public boolean removeSong(String songId) {
        return playlistManager.removeSong(songId);
    }

    public Object next() {
        return playlistManager.next();
    }

    public Song previous() {
        return playlistManager.previous();
    }

    public boolean toggleRepeat() {
        return playlistManager.toggleRepeat();
    }

    public boolean addToUpNext(String songId) {
        return playbackManager.addToUpNext(songId);
    }

    public Song playNext() {
        return playbackManager.playNext();
    }

    public Song back() {
        return playbackManager.back();
    }

    public void addSong(String title, String songId) {
        musicCatalog.addSong(title, songId);
    }

    public List<String> findSong(String title) {
        return musicCatalog.findSong(title);
    }

    public List<String> prefixSearch(String prefix) {
        return musicCatalog.prefixSearch(prefix);
    }

    public boolean addRelation(String artistA, String artistB) {
        return musicCatalog.addRelation(artistA, artistB);
    }

    public List<String> recommendArtists(String artist) {
        return musicCatalog.recommendArtists(artist);
    }

    public PlaylistManager getPlaylistManager() {
        return playlistManager;
    }

    public PlaybackManager getPlaybackManager() {
        return playbackManager;
    }

    public MusicCatalog getMusicCatalog() {
        return musicCatalog;
    }

    public Song getCurrentlyPlaying() {
        return playbackManager.getCurrentlyPlaying();
    }

    public Song getPlaylistCursor() {
        return playlistManager.getCurrentSong();
    }

    public boolean isRepeat() {
        return playlistManager.isRepeat();
    }
}
