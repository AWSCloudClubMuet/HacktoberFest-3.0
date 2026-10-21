import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

public class ArtistGraph {
    private final Map<String, Set<String>> relations =
            new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

    public boolean addRelation(String artistA, String artistB) {
        if (artistA == null || artistA.trim().isEmpty()
                || artistB == null || artistB.trim().isEmpty()
                || artistA.equalsIgnoreCase(artistB)) {
            return false;
        }

        Set<String> artistARelations = relations.get(artistA);
        if (artistARelations != null && artistARelations.contains(artistB)) {
            return false;
        }

        relations.computeIfAbsent(artistA,
                artist -> new TreeSet<>(String.CASE_INSENSITIVE_ORDER)).add(artistB);
        relations.computeIfAbsent(artistB,
                artist -> new TreeSet<>(String.CASE_INSENSITIVE_ORDER)).add(artistA);
        return true;
    }

    public List<String> recommendArtists(String artist) {
        TreeSet<String> recommendations = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        if (artist == null) return new ArrayList<>(recommendations);

        Set<String> directRelations = relations.get(artist);
        if (directRelations == null) return new ArrayList<>(recommendations);

        for (String relatedArtist : directRelations) {
            Set<String> secondDegreeRelations = relations.get(relatedArtist);
            if (secondDegreeRelations == null) continue;

            for (String candidate : secondDegreeRelations) {
                if (!candidate.equalsIgnoreCase(artist)
                        && !directRelations.contains(candidate)) {
                    recommendations.add(candidate);
                }
            }
        }
        return new ArrayList<>(recommendations);
    }
}
