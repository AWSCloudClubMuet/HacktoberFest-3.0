package tunewave.milestone2;

import tunewave.model.Song;

/**
 * Standalone demo for Milestone 2: Up Next and History (Queue + Bounded Stack).
 */
public class Milestone2Demo {
    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("🧩 MILESTONE 2: Up Next and History (Queue + Bounded Stack)");
        System.out.println("================================================================================");

        TuneWavePlayer player = new TuneWavePlayer();
        Song p1 = new Song("p1", "Levitating", "Dua Lipa");
        Song p2 = new Song("p2", "Save Your Tears", "The Weeknd");
        Song p3 = new Song("p3", "As It Was", "Harry Styles");

        player.addSong(p1);
        player.addSong(p2);
        player.addSong(p3);

        System.out.println("1. Playing first song from playlist:");
        System.out.println("   - playNext() -> " + player.playNext().getSong().getTitle());
        System.out.println("   - Playlist current pointer: " + player.getPlaylist().getCurrent().getTitle());

        System.out.println("\n2. Queueing songs into Up Next (Priority Queue):");
        Song q1 = new Song("q1", "Priority Track 1", "Guest Artist A");
        Song q2 = new Song("q2", "Priority Track 2", "Guest Artist B");
        player.addToUpNext(q1);
        player.addToUpNext(q2);
        System.out.println("   - Added to Up Next: " + q1.getTitle() + ", " + q2.getTitle());

        System.out.println("\n3. Playback with Up Next active:");
        System.out.println("   - playNext() -> " + player.playNext().getSong().getTitle() + " (From Up Next)");
        System.out.println("   - Playlist position unchanged: " + player.getPlaylist().getCurrent().getTitle() + " (Rule verified!)");

        System.out.println("   - playNext() -> " + player.playNext().getSong().getTitle() + " (From Up Next)");
        System.out.println("   - Playlist position unchanged: " + player.getPlaylist().getCurrent().getTitle());

        System.out.println("\n4. Up Next is empty; playlist resumes:");
        System.out.println("   - playNext() -> " + player.playNext().getSong().getTitle() + " (Playlist resumed to next track!)");
        System.out.println("   - Playlist position now: " + player.getPlaylist().getCurrent().getTitle());

        System.out.println("\n5. Back Navigation via History Stack:");
        System.out.println("   - Current play history count: " + player.getHistory().size());
        System.out.println("   - back() -> Replaying: " + player.back().getTitle());
        System.out.println("   - Playlist pointer remained at: " + player.getPlaylist().getCurrent().getTitle());

        System.out.println("\n6. Bounded History Stack (Max Capacity 10):");
        PlayHistory history = new PlayHistory(10);
        for (int i = 1; i <= 12; i++) {
            history.push(new Song("id_" + i, "Track #" + i));
        }
        System.out.println("   - Pushed 12 songs. Current size: " + history.size() + " (Oldest dropped)");
        System.out.println("   - Oldest surviving song in history: " + history.toList().get(0).getTitle());
        System.out.println("   - Newest song popped: " + history.pop().getTitle());
    }
}
