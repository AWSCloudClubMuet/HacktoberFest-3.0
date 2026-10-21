# TuneWave

A Java music-player core with a Swing desktop interface, submitted by **CTRL + ALT + G3** for [HacktoberFest issue #13](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/13).

## Run

Requires **JDK 17 or newer**. There are no third-party Java dependencies. Keep all 13 Java files together in `src/TuneWave_music_player`; the entry point uses the other classes in that package.

From `submission/ctrl-alt-g3/tunewave` on Windows:

```powershell
.\run.bat
```

On Linux or macOS:

```bash
./run.sh
```

For the console demonstration, including on a computer without a graphical desktop:

```powershell
.\run.bat --demo
```

Or run `./run.sh --demo` on Linux/macOS. The scripts compile the sources into the ignored `out` directory, then start `TuneWave_music_player.Main`.

Manual commands, after creating an `out` directory:

```bash
javac --release 17 -encoding UTF-8 -d out src/TuneWave_music_player/*.java
java -cp out TuneWave_music_player.Main
java -cp out TuneWave_music_player.Main --demo
```

## Core operations

| Area | Implementation |
|---|---|
| Playlist | Doubly linked song nodes and a hash map keyed by song ID; add/remove, previous/next and repeat boundaries |
| Up Next | FIFO queue that plays before playlist navigation continues |
| History | Stack capped at 10 entries; Back pops and replays the top without moving the playlist position |
| Search | Title BST with exact and prefix lookup, including traversal information |
| Artists | Undirected graph; recommendations exactly two links away, excluding the source and direct neighbours |
| Desktop interface | Catalog, playlist, queue/history, search and artist exploration |

The player can demonstrate its operations silently. Attach a local supported audio file from a track's menu for sound; PCM WAV is the simplest choice. Java's audio support and a working audio device are required. Audio files are not included.

## Verification

All 13 uploaded Java sources compiled for Java 17, and `Main --demo` completed successfully on OpenJDK 17.0.20. Its output exercises duplicate handling, queue priority, playlist boundaries and removal, the 10-entry history cap, title searches and two-link artist recommendations. The Swing window and device audio were not exercised in this environment.
