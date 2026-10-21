# TuneWave

TuneWave is a small, console-based music player demonstration written in Java. It includes in-memory user registration and login, playlist navigation, song search using a binary search tree (BST), and artist recommendations using an undirected graph.

## Requirements

- Java Development Kit (JDK) installed and available on your `PATH`

## Run the application

Open a terminal in the `TuneWave` folder and compile the Java files:

```powershell
javac *.java
java Main
```

The program first loads sample songs, users, and artist relationships, then displays the login/register menu.

## Using the application

At the main menu:

1. **Login** with an existing account.
2. **Register** an account for the current run.
3. **Exit** the application.

After login, the dashboard provides:

1. **Current Song** — displays the current playlist song.
2. **Next Song** — moves to the next song in the playlist.
3. **Previous Song** — moves to the previous song.
4. **Search Exact Song** — looks up a song title and displays its ID.
5. **Prefix Search** — lists song titles beginning with the entered prefix.
6. **Artist Recommendations** — lists artists two relationship links away.
7. **Logout** — returns to the login/register menu.

The menu is interactive: enter the displayed number and press Enter.

## Classes and methods

### `Main`

Runs the console application and connects user input to the playlist, song search tree, and artist graph.

- `main(String[] args)` initializes sample data, prints a basic feature-test message, and starts the menus.
- `readInput(String prompt)` displays a prompt and reads a line from the console.
- `startInteractiveSystem()` displays the login/register/exit menu and routes the selected action.
- `handleRegister()` reads a username and password, rejects empty fields, and stores the account.
- `handleLogin()` checks the entered username and password.
- `runUserDashboard()` creates a sample playlist and handles dashboard choices.
- `initializeSystemData()` adds the sample accounts, song titles/IDs, and artist relationships.
- `runSystemFeatureTests()` prints a simple login-test status message. This is not a full automated test suite.

### `Song`

Represents one song, with an ID, title, and artist.

- `Song(String id, String title, String artist)` creates a song.
- `toString()` formats the song as `title - artist`.

### `Node`

Represents one entry in the doubly linked playlist. It stores a `Song` and references to the previous and next nodes. `Playlist` uses these links to navigate the playlist.

- `Node(Song song)` creates a node for a song.

### `Playlist`

Manages the doubly linked list of songs, the current playlist position, an Up Next queue, and playback history. The Up Next and history operations are available in the class but are not currently exposed as dashboard menu options.

- `addSong(Song song)` adds a non-null song with a unique ID and returns a status message.
- `next()` moves to the next playlist song, wraps to the beginning when repeat is enabled, or returns an end/empty status.
- `previous()` moves to the previous playlist song, wraps to the end when repeat is enabled, or returns a start/empty status.
- `addToUpNext(String songId)` queues a song from the playlist by ID; returns `false` if the ID is not found.
- `playNext()` plays the next queued song, or advances the playlist if the queue is empty.
- `back()` replays and removes the most recent history entry.
- `toggleRepeat()` turns playlist repeat on or off.
- `removeSong(String songId)` removes a song by ID, including any queued copies, and returns whether it was found.
- `getCurrent()` returns the song at the current playlist position, or `null` if the playlist is empty.
- `play(Song song)` is an internal helper that records the currently playing song in history and updates playback.

### `SongSearchTree`

Stores song titles and IDs in a binary search tree ordered alphabetically by title, without regard to letter case. Titles and song IDs must be unique.

- `addSong(String title, String songId)` inserts a valid title/ID pair and returns whether it was added.
- `findSong(String title)` finds an exact title and returns its song ID, or `null` if it is not found.
- `prefixSearch(String prefix)` returns matching titles in alphabetical order.
- `collectPrefixMatches(...)` is the recursive helper that searches relevant BST subtrees and gathers prefix matches in order.

### `ArtistGraph`

Stores related-artist links as an undirected graph: adding a relation between two artists links each artist to the other. Artist names are compared without regard to letter case.

- `addRelation(String artistA, String artistB)` adds a valid relationship and returns whether it was new. Empty names, self-links, and duplicate links are rejected.
- `recommendArtists(String artist)` returns artists exactly two links away, excluding the artist and their direct neighbors. Results are alphabetically ordered.

## Notes and limitations

- Accounts and sample data are stored in memory; they are reset when the program exits.
- The sample `admin` and `rahul` accounts are for demonstration only. Do not use real passwords.
- The playlist's navigation position and the song search tree are separate data sets in the current demo.
- `Playlist` supports Up Next and history operations, but the dashboard currently exposes only current/next/previous playlist navigation.
