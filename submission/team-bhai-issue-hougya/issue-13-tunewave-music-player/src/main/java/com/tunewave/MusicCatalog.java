package com.tunewave;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MusicCatalog {
    private final Map<String, Song> songRegistry = new HashMap<>();
    private final SongBST songBst = new SongBST();
    private final ArtistGraph artistGraph = new ArtistGraph();

    public void registerSong(Song song) {
        if (song == null) return;
        songRegistry.put(song.getId(), song);
        songBst.addSong(song.getTitle(), song.getId());
    }

    public void addSong(String title, String songId) {
        songBst.addSong(title, songId);
    }

    public List<String> findSong(String title) {
        return songBst.findSong(title);
    }

    public List<String> prefixSearch(String prefix) {
        return songBst.prefixSearch(prefix);
    }

    public boolean addRelation(String artistA, String artistB) {
        return artistGraph.addRelation(artistA, artistB);
    }

    public List<String> recommendArtists(String artist) {
        return artistGraph.recommendArtists(artist);
    }

    public Song getSong(String songId) {
        return songRegistry.get(songId);
    }

    public boolean containsSong(String songId) {
        return songRegistry.containsKey(songId);
    }

    public SongBST getSongBst() {
        return songBst;
    }

    public ArtistGraph getArtistGraph() {
        return artistGraph;
    }

    public int getSongCount() {
        return songRegistry.size();
    }
}
