package TuneWave_music_player;

/** Repeatable demonstration for judges or computers without a graphical desktop. */
public final class ConsoleDemo {
    private ConsoleDemo() { }
    public static void main(String[] args) {
        TuneWavePlayer player = new TuneWavePlayer();
        Song a = new Song("S01", "Mahiya", "Annie Khalid");
        Song b = new Song("S02", "Billo De Ghar", "Abrar Ul Haq");
        Song c = new Song("S03", "Channo", "Ali Zafar");
        Song extra = new Song("S04", "Boohey Barian", "Hadiqa Kiani");
        player.addSong(a); player.addSong(b); player.addSong(c); player.registerSong(extra);
        player.registerSong(new Song("S05", "Babia", "Sajjad Ali"));
        System.out.println("MILESTONE 1 / linked playlist + hash map");
        System.out.println("Duplicate added? " + player.addSong(a));
        System.out.println("First play: " + player.playNext());
        System.out.println("\nMILESTONE 2 / queue + bounded stack");
        player.addToUpNext(extra.songId()); player.addToUpNext(c.songId());
        System.out.println("Queue: " + player.upNextSongs());
        System.out.println("Queued play: " + player.playNext());
        System.out.println("Queued play: " + player.playNext());
        System.out.println("Playlist still at: " + player.playlistPosition().orElseThrow().title());
        System.out.println("Back (pop top): " + player.back());
        System.out.println("Resume playlist: " + player.playNext());
        System.out.println("History (top first): " + player.historySongs());
        System.out.println("\nMILESTONE 1 / boundary rules and removal");
        player.playSong(c.songId());
        System.out.println("Next at tail, repeat off: " + player.playNext());
        player.toggleRepeat();
        System.out.println("Next at tail, repeat on: " + player.playNext());
        System.out.println("Previous at head, repeat on: " + player.previous());
        System.out.println("Remove middle Billo De Ghar: " + player.removeSong(b.songId()));
        System.out.println("Repaired nodes: " + player.playlistNodes());
        player.addToPlaylist(b.songId());
        for (int i = 0; i < 12; i++) player.playNext();
        System.out.println("History after 12 more plays: " + player.historySongs().size() + " entries (capacity 10)");
        System.out.println("\nMILESTONE 3 / title BST + undirected artist graph");
        System.out.println("Find Billo De Ghar: " + player.findSong("Billo De Ghar"));
        System.out.println("Prefix B: " + player.prefixSearch("B"));
        player.addRelation("Annie Khalid", "Abrar Ul Haq"); player.addRelation("Annie Khalid", "Ali Zafar");
        player.addRelation("Abrar Ul Haq", "Hadiqa Kiani"); player.addRelation("Ali Zafar", "Hadiqa Kiani");
        player.addRelation("Ali Zafar", "Sajjad Ali");
        System.out.println("Two-link recommendations for Annie Khalid: " + player.recommendArtists("Annie Khalid"));
    }
}
