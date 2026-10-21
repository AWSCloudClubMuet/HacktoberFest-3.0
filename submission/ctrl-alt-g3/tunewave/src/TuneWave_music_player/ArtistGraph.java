package TuneWave_music_player;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Undirected adjacency-set graph. Artist IDs are stable; labels determine display order. */
public final class ArtistGraph {
    public record Relation(String artistA, String artistB) { }
    private final Map<String, Set<String>> neighbors = new HashMap<>();
    private final Map<String, String> names = new HashMap<>();

    public synchronized void addArtist(String artistId, String name) {
        Song.requireId(artistId);
        if (name == null || name.isBlank())
            throw new IllegalArgumentException("Artist name must not be blank.");
        neighbors.computeIfAbsent(artistId, ignored -> new HashSet<>());
        names.put(artistId, name.strip());
    }

    /** Duplicate/reversed edges are no-ops; a self-link is invalid. */
    public synchronized boolean addRelation(String artistA, String artistB) {
        Song.requireId(artistA);
        Song.requireId(artistB);
        if (artistA.equals(artistB))
            throw new IllegalArgumentException("Choose two different artists.");
        neighbors.computeIfAbsent(artistA, ignored -> new HashSet<>());
        neighbors.computeIfAbsent(artistB, ignored -> new HashSet<>());
        boolean added = neighbors.get(artistA).add(artistB);
        neighbors.get(artistB).add(artistA);
        return added;
    }

    public synchronized List<String> recommendArtists(String artist) {
        Song.requireId(artist);
        Set<String> direct = neighbors.get(artist);
        if (direct == null) return List.of();
        Set<String> recommendations = new HashSet<>();
        for (String friend : direct) {
            for (String candidate : neighbors.get(friend)) {
                if (!candidate.equals(artist) && !direct.contains(candidate))
                    recommendations.add(candidate);
            }
        }
        return alphabetical(recommendations);
    }

    public synchronized List<String> relatedArtists(String artist) {
        Song.requireId(artist);
        return alphabetical(neighbors.getOrDefault(artist, Set.of()));
    }

    public synchronized List<String> artists() { return alphabetical(neighbors.keySet()); }
    public synchronized String artistName(String artist) { return names.getOrDefault(artist, artist); }

    public synchronized List<Relation> relations() {
        List<Relation> result = new ArrayList<>();
        for (String artist : artists()) {
            for (String neighbor : alphabetical(neighbors.get(artist))) {
                if (artist.compareTo(neighbor) < 0) result.add(new Relation(artist, neighbor));
            }
        }
        return List.copyOf(result);
    }

    private List<String> alphabetical(Set<String> artists) {
        List<String> result = new ArrayList<>(artists);
        result.sort(Comparator.comparing(this::artistName, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(this::artistName).thenComparing(Comparator.naturalOrder()));
        return List.copyOf(result);
    }
}
