package tunewave;

import java.util.ArrayList;
import java.util.ArrayDeque;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Undirected graph of artist relationships, backed by an adjacency list.
 *
 * <h2>Data structure</h2>
 * {@code Map<String, Set<String>>} — each artist maps to the set of artists
 * directly connected to them.  Relations are stored in both directions to
 * make the graph undirected.
 *
 * <h2>Recommendation algorithm</h2>
 * {@link #recommendArtists} returns artists at <em>exact shortest-path
 * distance 2</em> from the requested artist:
 * <ol>
 *   <li>Collect all <em>direct neighbors</em> of the requested artist (distance 1).</li>
 *   <li>For each direct neighbor, collect <em>their</em> neighbors.</li>
 *   <li>Keep only those that are not the requested artist, not a direct
 *       neighbor, and not already in the results set.</li>
 *   <li>Return the deduplicated results in alphabetical order.</li>
 * </ol>
 *
 * <p>This is a single-hop BFS from distance-1 nodes, which is correct and
 * efficient for finding exactly distance-2 nodes.
 */
public class ArtistGraph {

    /** Adjacency list: artist name → set of directly connected artists. */
    private final Map<String, Set<String>> adjacencyList = new HashMap<>();

    // ---------------------------------------------------------- mutation methods

    /**
     * Adds an undirected relation between two artists.
     *
     * <p>Edge cases handled safely:
     * <ul>
     *   <li>Duplicate relations are silently ignored (sets are idempotent).</li>
     *   <li>Self-relations ({@code artistA.equals(artistB)}) are silently ignored.</li>
     *   <li>{@code null} artist names are rejected with an exception.</li>
     * </ul>
     *
     * @param artistA first artist
     * @param artistB second artist
     */
    public void addRelation(String artistA, String artistB) {
        if (artistA == null || artistB == null) {
            throw new IllegalArgumentException("Artist names must not be null");
        }
        if (artistA.equals(artistB)) return; // self-relation – ignore

        // Ensure both artists exist in the map even if they have no other edges.
        adjacencyList.computeIfAbsent(artistA, k -> new HashSet<>()).add(artistB);
        adjacencyList.computeIfAbsent(artistB, k -> new HashSet<>()).add(artistA);
    }

    // ---------------------------------------------------------- query methods

    /**
     * Returns artists at shortest-path distance exactly 2 from the given artist.
     *
     * <p>The result excludes:
     * <ul>
     *   <li>The requested artist itself.</li>
     *   <li>All direct neighbors (distance 1).</li>
     * </ul>
     * Results are deduplicated and returned in alphabetical order.
     *
     * <p>If the artist is unknown or has no connections, an empty list is returned.
     *
     * @param artist the artist to find recommendations for
     * @return sorted, deduplicated list of recommended artist names
     */
    public List<String> recommendArtists(String artist) {
        if (artist == null || !adjacencyList.containsKey(artist)) {
            return Collections.emptyList();
        }

        Set<String> directNeighbors = adjacencyList.getOrDefault(artist, Set.of());
        Set<String> recommendations = new HashSet<>();

        for (String neighbor : directNeighbors) {
            Set<String> secondHop = adjacencyList.getOrDefault(neighbor, Set.of());
            for (String candidate : secondHop) {
                // Exclude self, direct neighbors, and duplicates (handled by Set).
                if (!candidate.equals(artist) && !directNeighbors.contains(candidate)) {
                    recommendations.add(candidate);
                }
            }
        }

        List<String> sorted = new ArrayList<>(recommendations);
        Collections.sort(sorted); // natural alphabetical order
        return sorted;
    }

    /**
     * Returns all artists currently known to the graph (those who appear in
     * at least one relation).
     *
     * @return set of artist names
     */
    public Set<String> getAllArtists() {
        return Collections.unmodifiableSet(adjacencyList.keySet());
    }

    /**
     * Returns the direct neighbors of the given artist.
     *
     * @param artist the artist to query
     * @return unmodifiable set of neighbors, or empty set if unknown
     */
    public Set<String> getNeighbors(String artist) {
        return Collections.unmodifiableSet(
                adjacencyList.getOrDefault(artist, Set.of()));
    }

    /**
     * @return {@code true} if the graph contains no artists
     */
    public boolean isEmpty() {
        return adjacencyList.isEmpty();
    }
}

