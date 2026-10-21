package TuneWave_music_player;

import java.util.LinkedHashMap;
import java.util.Map;

/** Real song metadata; original artwork and illustrative related-artist links. No recordings. */
final class PakistaniCatalog {
    record Details(String credits, String mood, String art, String collection) { }
    private final Map<String, Details> details = new LinkedHashMap<>();

    void populate(TuneWavePlayer player) {
        add(player, "mahiya", "Mahiya", "Annie Khalid", "Annie Khalid", "Pop", "Pakistani pop", true);
        add(player, "billo", "Billo De Ghar", "Abrar Ul Haq", "Abrar Ul Haq", "Full tarka", "Punjabi favourites", true);
        add(player, "channo", "Channo", "Ali Zafar", "Ali Zafar", "Pop", "Huqa Pani", true);
        add(player, "boohey-barian", "Boohey Barian", "Hadiqa Kiani", "Hadiqa Kiani", "Throwback", "Roshni", true);
        add(player, "babia", "Babia", "Sajjad Ali", "Sajjad Ali", "Throwback", "Babia 93", true);
        add(player, "mahbooba", "Mahbooba", "Haroon", "Haroon", "Pop", "Lagan", true);
        add(player, "sajania", "Sajania", "Ali Zafar", "Ali Zafar", "Pop", "Masty", true);
        add(player, "nach-punjaban", "Nach Punjaban", "Abrar Ul Haq", "Abrar Ul Haq", "Full tarka", "Punjabi favourites", true);
        add(player, "disco", "Disco Deewane", "Nazia Hassan", "Nazia Hassan", "Throwback", "Pakistani disco", true);
        add(player, "preeto", "Preeto", "Abrar Ul Haq", "Abrar Ul Haq", "Full tarka", "Nach Punjaban", true);
        add(player, "huqa-pani", "Huqa Pani", "Ali Zafar", "Ali Zafar", "Pop", "Huqa Pani", true);
        add(player, "sayonee", "Sayonee", "Junoon", "Junoon", "Rock", "Azadi", true);
        // Searchable extras demonstrate catalogue membership independent of the playlist.
        add(player, "bebo", "Bebo", "Alisha Chinai", "Anu Malik, Alisha Chinai", "Guest pick", "Bollywood guest", false);
        add(player, "pasoori", "Pasoori", "Ali Sethi", "Ali Sethi, Shae Gill", "Full tarka", "Coke Studio 14", false);
        add(player, "blockbuster", "Blockbuster", "Faris Shafi", "Faris Shafi, Umair Butt, Gharwi Group", "Full tarka", "Coke Studio 15", false);
        add(player, "tu-jhoom", "Tu Jhoom", "Abida Parveen", "Naseebo Lal, Abida Parveen", "Soul", "Coke Studio 14", false);
        // Curated demo similarity edges; these are not claims about real collaborations.
        link(player, "Annie Khalid", "Ali Zafar"); link(player, "Annie Khalid", "Hadiqa Kiani");
        link(player, "Ali Zafar", "Haroon"); link(player, "Ali Zafar", "Sajjad Ali");
        link(player, "Hadiqa Kiani", "Sajjad Ali"); link(player, "Hadiqa Kiani", "Nazia Hassan");
        link(player, "Hadiqa Kiani", "Abrar Ul Haq"); link(player, "Haroon", "Junoon");
        link(player, "Ali Sethi", "Faris Shafi"); link(player, "Faris Shafi", "Abida Parveen");
    }
    private void add(TuneWavePlayer player, String slug, String title, String artist,
                     String credits, String mood, String collection, boolean inPlaylist) {
        Song song = new Song("demo:" + slug, title, artistId(artist));
        player.registerSong(song); player.registerArtist(song.artistId(), artist);
        if (inPlaylist) player.addToPlaylist(song.songId());
        details.put(song.songId(), new Details(credits, mood, slug, collection));
    }
    private static void link(TuneWavePlayer p, String a, String b) { p.addRelation(artistId(a), artistId(b)); }
    static String artistId(String name) { return "artist:" + name.toLowerCase(java.util.Locale.ROOT).replace(' ', '-'); }
    Details details(Song song, TuneWavePlayer player) {
        return details.getOrDefault(song.songId(), new Details(player.artistName(song.artistId()), "Your pick", "custom", "Your library"));
    }
}
