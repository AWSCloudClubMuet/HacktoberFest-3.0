public class Song {
    String id;
    String title;
    String artist;

    public Song(String id, String title, String artist) {
        this.id = id;
        this.title = title;
        this.artist = artist;
    }

    @Override
    public String toString() {
        return title + " - " + artist;
    }
}
