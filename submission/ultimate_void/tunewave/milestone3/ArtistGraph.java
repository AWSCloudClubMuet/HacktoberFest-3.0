package tunewave.milestone3;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/**
 * Milestone 3 — Related Artists (Undirected Graph)
 *
 * <p>Represents artist similarities as an undirected graph.
 *
 * <p>Rules:
 * <ul>
 *   <li>Artists form an undirected graph of "related" links.</li>
 *   <li>{@code recommendArtists(artist)} returns artists exactly two links away
 *       who are not already directly related (and not the target artist themselves),
 *       in alphabetical order.</li>
 * </ul>
 */
public class ArtistGraph {

    private final Map<String, Set<String>> adj;

    /**
     * Initializes an empty artist relationship graph.
     */
    public ArtistGraph() {
        this.adj = new HashMap<>();
    }

    /**
     * Adds an undirected "related" relationship between two artists.
     *
     * @param artistA First artist name.
     * @param artistB Second artist name.
     */
    public void addRelation(String artistA, String artistB) {
        if (artistA == null || artistB == null) {
            return;
        }

        String a = artistA.trim();
        String b = artistB.trim();

        if (a.isEmpty() || b.isEmpty() || a.equalsIgnoreCase(b)) {
            return; // Ignore empty names or self-relations
        }

        this.adj.computeIfAbsent(a, k -> new HashSet<>()).add(b);
        this.adj.computeIfAbsent(b, k -> new HashSet<>()).add(a);
    }

    /**
     * Recommends artists exactly two links away who are not already directly related.
     *
     * <p>Algorithm:
     * <ol>
     *   <li>Find all direct neighbors of the target artist (distance 1).</li>
     *   <li>For each direct neighbor, inspect its neighbors (distance 2 candidates).</li>
     *   <li>Exclude:
     *     <ul>
     *       <li>The target artist themselves (distance 0).</li>
     *       <li>Any artist already directly related to the target artist (distance 1).</li>
     *     </ul>
     *   </li>
     *   <li>Return the resulting unique set sorted in alphabetical order.</li>
     * </ol>
     *
     * @param artist The target artist to generate recommendations for.
     * @return List of recommended artist names in alphabetical order.
     */
    public List<String> recommendArtists(String artist) {
        if (artist == null) {
            return Collections.emptyList();
        }

        String target = artist.trim();
        if (!this.adj.containsKey(target)) {
            return Collections.emptyList();
        }

        Set<String> directRelations = this.adj.get(target);
        // TreeSet guarantees alphabetical order and uniqueness
        Set<String> recommendations = new TreeSet<>();

        for (String neighbor : directRelations) {
            Set<String> neighborRelations = this.adj.getOrDefault(neighbor, Collections.emptySet());
            for (String candidate : neighborRelations) {
                // Rule: exactly two links away, not self, not directly related
                if (!candidate.equalsIgnoreCase(target) && !directRelations.contains(candidate)) {
                    recommendations.add(candidate);
                }
            }
        }

        return new ArrayList<>(recommendations);
    }

    /**
     * Returns the set of directly related artists for an artist.
     *
     * @param artist Artist name.
     * @return Set of direct neighbor names, or empty set if none.
     */
    public Set<String> getDirectRelations(String artist) {
        if (artist == null) return Collections.emptySet();
        return Collections.unmodifiableSet(this.adj.getOrDefault(artist.trim(), Collections.emptySet()));
    }

    /**
     * Returns the adjacency map representation.
     *
     * @return Adjacency map.
     */
    public Map<String, Set<String>> getAdjacencyMap() {
        return Collections.unmodifiableMap(this.adj);
    }

    /**
     * Checks if an artist is in the graph.
     *
     * @param artist Artist name.
     * @return true if present, false otherwise.
     */
    public boolean containsArtist(String artist) {
        return artist != null && this.adj.containsKey(artist.trim());
    }

    /**
     * Returns total number of artists in the graph.
     *
     * @return Artist count.
     */
    public int size() {
        return this.adj.size();
    }
}
