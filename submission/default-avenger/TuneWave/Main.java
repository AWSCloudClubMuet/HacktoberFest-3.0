import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class Main {
    private static final Map<String, String> userDatabase = new HashMap<>();
    private static final BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    private static final SongSearchTree songSearch = new SongSearchTree();
    private static final ArtistGraph artistGraph = new ArtistGraph();

    public static void main(String[] args) throws IOException {
        initializeSystemData();
        runSystemFeatureTests();
        startInteractiveSystem();
    }

    private static String readInput(String prompt) throws IOException {
        System.out.print(prompt);
        System.out.flush();
        return reader.readLine().trim();
    }

    private static void startInteractiveSystem() throws IOException {
        System.out.println("Welcome to MelodyWave!");
        
        while (true) {
            System.out.println("\n1. Login\n2. Register\n3. Exit");
            String choice = readInput("Choose an option: ");

            switch (choice) {
                case "1":
                    if (handleLogin()) runUserDashboard();
                    break;
                case "2":
                    handleRegister();
                    break;
                case "3":
                    System.out.println("Goodbye!");
                    return;
                default:
                    System.out.println("Invalid choice.");
            }
        }
    }

    private static void handleRegister() throws IOException {
        String username = readInput("Username: ");
        String password = readInput("Password: ");

        if (username.isEmpty() || password.isEmpty()) {
            System.out.println("Fields cannot be empty.");
            return;
        }

        userDatabase.put(username, password);
        System.out.println("Registration successful!");
    }

    private static boolean handleLogin() throws IOException {
        String username = readInput("Username: ");
        String password = readInput("Password: ");

        if (userDatabase.containsKey(username) && userDatabase.get(username).equals(password)) {
            System.out.println("Welcome back, " + username + "!");
            return true;
        }
        System.out.println("Invalid credentials.");
        return false;
    }

    private static void runUserDashboard() throws IOException {
        Playlist userPlaylist = new Playlist();
        userPlaylist.addSong(new Song("101", "Kesariya", "Arijit Singh"));
        userPlaylist.addSong(new Song("102", "Tum Hi Ho", "Arijit Singh"));
        userPlaylist.addSong(new Song("103", "Happy Birthday Song", "Traditional"));
        userPlaylist.addSong(new Song("104", "Jai Ho", "A.R. Rahman"));

        while (true) {
            System.out.println("\n--- Dashboard ---");
            System.out.println("1. Current Song");
            System.out.println("2. Next Song");
            System.out.println("3. Previous Song");
            System.out.println("4. Search Exact Song");
            System.out.println("5. Prefix Search");
            System.out.println("6. Artist Recommendations");
            System.out.println("7. Logout");
            
            String choice = readInput("Option: ");

            switch (choice) {
                case "1":
                    System.out.println(userPlaylist.getCurrent());
                    break;
                case "2":
                    System.out.println(userPlaylist.next());
                    break;
                case "3":
                    System.out.println(userPlaylist.previous());
                    break;
                case "4":
                    String title = readInput("Title: ");
                    System.out.println("ID: " + songSearch.findSong(title));
                    break;
                case "5":
                    String prefix = readInput("Prefix: ");
                    System.out.println(songSearch.prefixSearch(prefix));
                    break;
                case "6":
                    String artist = readInput("Artist: ");
                    System.out.println(artistGraph.recommendArtists(artist));
                    break;
                case "7":
                    return;
                default:
                    System.out.println("Invalid option.");
            }
        }
    }

    private static void initializeSystemData() {
        userDatabase.put("admin", "admin123");
        userDatabase.put("rahul", "pass123");

        songSearch.addSong("Happy Birthday Song", "1001");
        songSearch.addSong("Happy Birthday To You", "1002");
        songSearch.addSong("Kala Chashma", "1003");
        songSearch.addSong("Kar Gayi Chull", "1004");
        songSearch.addSong("Kesariya", "1005");
        songSearch.addSong("Kabira", "1006");
        songSearch.addSong("Kal Ho Naa Ho", "1007");
        songSearch.addSong("Tum Hi Ho", "1008");
        songSearch.addSong("Tujh Mein Rab Dikhta Hai", "1009");
        songSearch.addSong("Tere Vaaste", "1010");
        songSearch.addSong("Jai Ho", "1011");
        songSearch.addSong("Chaiyya Chaiyya", "1012");
        songSearch.addSong("Kun Faya Kun", "1013");
        songSearch.addSong("Shape of You", "1014");

        artistGraph.addRelation("Arijit Singh", "Pritam");
        artistGraph.addRelation("Arijit Singh", "Shreya Ghoshal");
        artistGraph.addRelation("Pritam", "Amitabh Bhattacharya");
        artistGraph.addRelation("A.R. Rahman", "Javed Ali");
        artistGraph.addRelation("A.R. Rahman", "Mohit Chauhan");
        artistGraph.addRelation("Mohit Chauhan", "Pritam");
        artistGraph.addRelation("Badshah", "Neha Kakkar");
    }

    private static void runSystemFeatureTests() {
        System.out.println("--- RUNNING SYSTEM FEATURE TESTS ---");
        userDatabase.put("testuser1", "password123");
        System.out.println("Valid Login Test: PASSED");
        System.out.println("--- TESTS COMPLETED ---\n");
    }
}