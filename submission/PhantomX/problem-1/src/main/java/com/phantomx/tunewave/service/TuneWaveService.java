package com.phantomx.tunewave.service;

import com.phantomx.tunewave.dsa.NextResult;
import com.phantomx.tunewave.dsa.PlayResult;
import com.phantomx.tunewave.dsa.Song;
import com.phantomx.tunewave.dsa.TuneWavePlayer;
import com.phantomx.tunewave.model.ActionResponse;
import com.phantomx.tunewave.model.PlayerStateDto;
import com.phantomx.tunewave.model.RecommendResponse;
import com.phantomx.tunewave.model.SearchResponse;
import com.phantomx.tunewave.model.SongDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class TuneWaveService {
    private final TuneWavePlayer player;
    private final AtomicInteger nextId = new AtomicInteger(1000);

    public TuneWaveService(TuneWavePlayer player) {
        this.player = player;
    }

    public PlayerStateDto state() {
        return new PlayerStateDto(
                map(player.songsInOrder()),
                SongDto.from(player.getCurrent()),
                SongDto.from(player.getNowPlaying()),
                player.isRepeatEnabled(),
                map(player.upNextSongs()),
                map(player.historySongs()),
                TuneWavePlayer.HISTORY_LIMIT
        );
    }

    public ActionResponse addSong(String title, String artist) {
        requireTitle(title);
        if (findByTitle(title) != null) {
            throw new PlayerException("\"" + title + "\" is already in the playlist.");
        }
        String id = "s" + nextId.getAndIncrement();
        String name = artist == null || artist.isBlank() ? null : artist.trim();
        if (!player.addSong(new Song(id, title.trim(), name))) {
            throw new PlayerException("Could not add that song.");
        }
        return ActionResponse.ok(SongDto.from(player.getSong(id)));
    }

    public ActionResponse removeSong(String title) {
        Song song = requireExisting(title);
        if (!player.removeSong(song.getId())) {
            throw new PlayerException("Could not remove it.");
        }
        return ActionResponse.ok(SongDto.from(song));
    }

    public ActionResponse next() {
        NextResult result = player.next();
        if (result.isEnd()) {
            return ActionResponse.end(SongDto.from(player.getCurrent()));
        }
        return ActionResponse.ok(SongDto.from(result.getSong()));
    }

    public ActionResponse previous() {
        Song song = player.previous();
        if (song == null) {
            throw new PlayerException("Playlist is empty.");
        }
        return ActionResponse.ok(SongDto.from(song));
    }

    public ActionResponse toggleRepeat() {
        return ActionResponse.repeat(player.toggleRepeat());
    }

    public ActionResponse addToUpNext(String title) {
        Song song = requireExisting(title);
        player.addToUpNext(song.getId());
        return ActionResponse.queued(SongDto.from(song));
    }

    public ActionResponse playNext() {
        PlayResult result = player.playNext();
        if (result.isEnd()) {
            return ActionResponse.end(SongDto.from(player.getNowPlaying()));
        }
        Song song = result.getSong() != null ? result.getSong() : player.getNowPlaying();
        return ActionResponse.play(SongDto.from(song), player.isPlayingOverride() ? "queue" : "playlist");
    }

    public ActionResponse back() {
        PlayResult result = player.back();
        if (result.isEmpty()) {
            throw new PlayerException("History is empty.");
        }
        return ActionResponse.ok(SongDto.from(player.getNowPlaying()));
    }

    public SearchResponse findSong(String title) {
        requireTitle(title);
        List<String> ids = player.findSong(title.trim());
        List<SongDto> songs = new ArrayList<SongDto>();
        for (int i = 0; i < ids.size(); i++) {
            songs.add(SongDto.from(player.getSong(ids.get(i))));
        }
        if (songs.isEmpty()) {
            Song ignoreCase = findByTitle(title);
            if (ignoreCase != null) {
                songs.add(SongDto.from(ignoreCase));
            }
        }
        return SearchResponse.songs(songs);
    }

    public SearchResponse prefixSearch(String prefix) {
        String query = prefix == null ? "" : prefix;
        List<String> titles = player.prefixSearch(query);
        List<SongDto> songs = new ArrayList<SongDto>();
        for (int i = 0; i < titles.size(); i++) {
            List<String> ids = player.findSong(titles.get(i));
            for (int j = 0; j < ids.size(); j++) {
                Song song = player.getSong(ids.get(j));
                if (song != null) {
                    songs.add(SongDto.from(song));
                }
            }
        }
        return SearchResponse.prefix(songs, titles);
    }

    public ActionResponse addRelation(String artistA, String artistB) {
        String left = requireArtist(artistA);
        String right = requireArtist(artistB);
        if (left.equals(right)) {
            throw new PlayerException("Artists must be different.");
        }
        player.addRelation(left, right);
        return ActionResponse.ok(null);
    }

    public RecommendResponse recommend(String artist) {
        String name = requireArtist(artist);
        return new RecommendResponse(true, player.recommendArtists(name));
    }

    private Song requireExisting(String title) {
        requireTitle(title);
        Song song = findByTitle(title);
        if (song == null) {
            throw new PlayerException("No song named \"" + title.trim() + "\".");
        }
        return song;
    }

    private Song findByTitle(String title) {
        if (title == null || title.isBlank()) {
            return null;
        }
        String trimmed = title.trim();
        List<String> exact = player.findSong(trimmed);
        if (!exact.isEmpty()) {
            return player.getSong(exact.get(0));
        }
        List<Song> songs = player.songsInOrder();
        for (int i = 0; i < songs.size(); i++) {
            Song song = songs.get(i);
            if (song.getTitle() != null && song.getTitle().equalsIgnoreCase(trimmed)) {
                return song;
            }
        }
        return null;
    }

    private static void requireTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new PlayerException("Song name is required.");
        }
    }

    private static String requireArtist(String artist) {
        if (artist == null || artist.isBlank()) {
            throw new PlayerException("Artist name is required.");
        }
        return artist.trim();
    }

    private static List<SongDto> map(List<Song> songs) {
        List<SongDto> dtos = new ArrayList<SongDto>();
        for (int i = 0; i < songs.size(); i++) {
            dtos.add(SongDto.from(songs.get(i)));
        }
        return dtos;
    }
}
