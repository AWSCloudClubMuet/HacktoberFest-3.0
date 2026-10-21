public class Main {

    public static void main(String[] args) {
        Playlist playlist = new Playlist();
        // Add some songs to the playlist
        playlist.addSong(new Song("1", "Alpha", "Ali"));
        playlist.addSong(new Song("2", "Beta", "Khan"));
        playlist.addSong(new Song("3", "Gamma", "Neha"));

        // Test the functionality
        System.out.println("Current song: " + playlist.getCurrent());
        System.out.println("Next song: " + playlist.next());
        System.out.println("Previous song: " + playlist.previous());

        SongSearchTree songSearch = new SongSearchTree();
        songSearch.addSong("Blue Sky", "4");
        songSearch.addSong("Blue Moon", "5");
        songSearch.addSong("Sunrise", "6");
        System.out.println("Song ID for Blue Sky: " + songSearch.findSong("blue sky"));
        System.out.println("Songs starting with Blue: " + songSearch.prefixSearch("Blue"));

        ArtistGraph artistGraph = new ArtistGraph();
        artistGraph.addRelation("Ali", "Khan");
        artistGraph.addRelation("Ali", "Neha");
        artistGraph.addRelation("Khan", "Neha");
        artistGraph.addRelation("Khan", "Omar");
        System.out.println("Artists related through two links from Ali: "
                + artistGraph.recommendArtists("Ali"));
    }
}
