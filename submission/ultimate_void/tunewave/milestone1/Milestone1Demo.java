package tunewave.milestone1;

import tunewave.model.Song;

/**
 * Standalone demo for Milestone 1: Playlist (Doubly Linked List + Hash Map).
 */
public class Milestone1Demo {
    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("🧩 MILESTONE 1: Playlist (Doubly Linked List + Hash Map)");
        System.out.println("================================================================================");

        Playlist playlist = new Playlist();
        Song s1 = new Song("s1", "Bohemian Rhapsody", "Queen", 354);
        Song s2 = new Song("s2", "Hotel California", "Eagles", 391);
        Song s3 = new Song("s3", "Stairway to Heaven", "Led Zeppelin", 482);

        System.out.println("1. Adding songs to playlist...");
        System.out.println("   - Adding s1: " + playlist.addSong(s1));
        System.out.println("   - Adding s2: " + playlist.addSong(s2));
        System.out.println("   - Adding s3: " + playlist.addSong(s3));

        System.out.println("\n2. Duplicate Prevention Rule (O(1) Hash Map check):");
        Song s1Dup = new Song("s1", "Duplicate Bohemian Rhapsody", "Queen", 354);
        boolean duplicateAdded = playlist.addSong(s1Dup);
        System.out.println("   - Attempting to add duplicate 's1': " + duplicateAdded + " (Expected: false)");
        System.out.println("   - Current playlist size: " + playlist.size() + " songs");

        System.out.println("\n3. Navigation (Repeat is OFF by default):");
        System.out.println("   - Current: " + playlist.getCurrent().getTitle());
        System.out.println("   - next() -> " + playlist.next());
        System.out.println("   - next() -> " + playlist.next());
        System.out.println("   - next() at tail (Repeat OFF) -> Result: '" + playlist.next() + "', Current remains: " + playlist.getCurrent().getTitle());

        System.out.println("\n4. Toggling Repeat ON:");
        playlist.toggleRepeat();
        System.out.println("   - Repeat mode: " + playlist.isRepeat());
        System.out.println("   - next() at tail with repeat ON wraps to -> " + playlist.next());
        System.out.println("   - previous() -> " + playlist.previous());

        System.out.println("\n5. O(1) Removal without scanning:");
        System.out.println("   - Removing 's2' (Hotel California): " + playlist.removeSong("s2"));
        System.out.println("   - Playlist now: " + playlist.toList());
    }
}
