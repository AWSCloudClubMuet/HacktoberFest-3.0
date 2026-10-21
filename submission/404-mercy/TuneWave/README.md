# TuneWave Music Player

**Team: 404 MERCY** | University Hackathon DSA Project & Desktop Music Player

> **TuneWave** is a production-grade Java desktop music player inspired by Spotify and Apple Music, built using **JavaFX + CSS** with crisp vector SVG icons, driven by custom Computer Science Data Structures & Algorithms (doubly-linked playlist, FIFO queue, LIFO stack, Binary Search Tree, and Graph similarity network).
> It supports **real local audio playback (WAV, MP3, AIFF, AU)**, sample-accurate timeline seeking, volume control, and dynamic generative album artwork.

---

## Key Features

1. **JavaFX + CSS Desktop Interface (Spotify-Inspired Design):**
   - **Styling Architecture:** Complete UI rendered in JavaFX with a dedicated CSS stylesheet (`src/main/resources/tunewave/styles.css`).
   - **Vector Iconography:** Clean SVG vector icons for all actions (Play, Pause, Next, Previous, History Back, Repeat, Volume, Search, Library, Queue, Trash), eliminating emojis and unicode characters.
   - **Three-Column Layout:**
     - **Left Navigation Rail (Sidebar):** Minimalist vector soundmark, TuneWave branding, navigation to Home, Discover & Search, and Your Library.
     - **Central Content Stage:**
       - **Home View:** Large Now Playing featured hero card with generative vinyl artwork, dynamic badges, seekable timeline, and quick-play catalog highlights.
       - **Discover & Search View:** Real-time dual search powered by a custom Binary Search Tree (exact title search and instant substring/prefix pruning) and an interactive Artist Similarity Network (distance-2 graph recommendations).
       - **Your Library / Playlist View:** Modern track table with active playing row highlighted in emerald, song IDs, linked audio files, and durations.
     - **Right Queue Drawer:** Collapsible drawer providing visual management of the **Up Next FIFO Queue** and **Playback History LIFO Stack** (capped at 10 items).
   - **Persistent Bottom Player Bar:** Spanning the window with 54×54 generative artwork, track metadata, previous / circular play-pause / next / repeat transport controls, interactive timeline scrubber, and volume slider.
2. **Real Audio Playback Engine:**
   - Real local audio playback supporting **WAV, MP3, AIFF, and AU** formats via Java Sound and SPI decoders.
   - Decodes compressed audio into 16-bit PCM memory lines for instant, latency-free microsecond seeking and accurate position reporting.
   - **File Chooser Integration:** Easily link any local MP3 or WAV file on your machine to any catalog song without modifying underlying DSA metadata.
   - **Out-of-the-Box Audio Synthesis:** Built-in harmonic audio synthesizer generates CD-quality preview tracks for sample songs in `./audio_cache/`, ensuring audible playback and seeking immediately without needing external audio files.
   - **Graceful Error Handling:** If an unlinked track is played, TuneWave displays a clear message and offers a dialog to link a local file instead of pretending to play.
3. **Core Data Structures & Algorithms (Zero External Frameworks for DSA):**
   - **Doubly-Linked List + HashMap:** O(1) cursor navigation (`next()`, `previous()`), O(1) ID lookup, and head/middle/tail deletions.
   - **ArrayDeque FIFO Queue:** "Up Next" with priority over normal playlist continuation.
   - **ArrayDeque LIFO Stack:** Playback history capped at 10 items; `back()` replays without moving the playlist cursor.
   - **Binary Search Tree (BST):** Fast exact and prefix title queries with subtree pruning.
   - **Adjacency-List Graph:** Breadth-first search for distance-2 artist recommendations.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Java (JDK) | 17 or newer (tested on Java 17 & Java 25) |
| Apache Maven | 3.6+ (tested on 3.9.16) |

Verify with:
```bash
java -version
mvn -version
```

---

## Quick Start

```bash
# 1. Navigate to the project directory
cd 404-mercy/submission/404-mercy/TuneWave

# 2. Compile and run all 128 automated tests
mvn clean test

# 3. Build the standalone executable shaded JAR
mvn package -DskipTests

# 4. Launch the Modern Desktop GUI
java -jar target/TuneWave-1.0.0.jar --gui

# 5. Or launch the Classic Console Simulation Demo
java -jar target/TuneWave-1.0.0.jar
```

---

## Running Automated Tests

```bash
mvn test
```

Expected output (**128 tests across 7 test suites, 0 failures, 0 errors**):
```
[INFO] Running tunewave.ArtistGraphTest
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running tunewave.AudioEngineTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running tunewave.PlaybackManagerTest
[INFO] Tests run: 20, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running tunewave.PlaylistTest
[INFO] Tests run: 32, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running tunewave.SongBSTTest
[INFO] Tests run: 18, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running tunewave.SongTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running tunewave.TuneWaveGUITest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running tunewave.TuneWaveServiceTest
[INFO] Tests run: 24, Failures: 0, Errors: 0, Skipped: 0

[INFO] Tests run: 128, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## Project Architecture

```
TuneWave/
├── pom.xml                        # Maven build config (Java 17+, Shade fat-JAR, JavaFX 21, mp3spi)
├── README.md                      # Complete documentation & user guide
├── audio_cache/                   # Synthesized 44.1 kHz preview audio files for demo tracks
└── src/
    ├── main/
    │   ├── resources/tunewave/
    │   │   └── styles.css         # Dedicated CSS stylesheet (Spotify theme)
    │   └── java/tunewave/
    │       ├── Song.java          # Immutable song entity model
    │       ├── PlaylistNode.java  # DLL node (prev & next links)
    │       ├── Playlist.java      # Doubly-linked list + HashMap (Milestone 1)
    │       ├── PlaybackManager.java # FIFO Queue + LIFO Stack (Milestone 2)
    │       ├── SongBST.java       # Custom BST with prefix pruning (Milestone 3)
    │       ├── ArtistGraph.java   # Adjacency-list undirected graph (Milestone 3)
    │       ├── TuneWaveService.java # Facade coordinating all DSA logic
    │       ├── AudioEngine.java   # Java Sound playback, seeking, volume, PCM buffer
    │       ├── Icons.java         # Vector SVG icon paths and factory methods
    │       ├── FxAlbumArtwork.java # Generative vector & canvas album art
    │       ├── TuneWaveApp.java   # Production JavaFX desktop application
    │       └── Main.java          # Entry point: --gui (JavaFX) or console demo
    └── test/java/tunewave/
        ├── SongTest.java
        ├── PlaylistTest.java
        ├── PlaybackManagerTest.java
        ├── SongBSTTest.java
        ├── ArtistGraphTest.java
        ├── TuneWaveServiceTest.java
        ├── AudioEngineTest.java   # Audio playback, seeking, and mapping tests
        └── TuneWaveGUITest.java   # Integration & cache validation tests
```

---

## Implemented Data Structures & Algorithms

### Milestone 1 — Playlist: Doubly-Linked List + HashMap
- **Custom Doubly-Linked List:** Preserves ordered sequence of songs and tracks an independent navigation cursor with O(1) `next()` and `previous()` movement.
- **HashMap Lookup:** Maps `songId` directly to `PlaylistNode` for O(1) lookups, deduplication, and O(1) node removal.
- **Repeat Mode:** When enabled, advancing past the tail wraps to the head; when disabled, returns `"end"`.

### Milestone 2 — Up Next + History: Queue + Stack
- **FIFO Up Next Queue (`ArrayDeque`):** Queued tracks take absolute priority over normal playlist progression. Playing a queued song does **not** move the playlist cursor.
- **LIFO Playback History Stack (`ArrayDeque`):** Tracks previously played songs. Capped at **10 entries** (oldest dropped on overflow). `back()` pops and replays the previous song without moving the playlist cursor.

### Milestone 3 — Search + Related Artists: BST + Graph
- **Binary Search Tree (`SongBST`):** Stores song titles for O(log n) exact lookup. Supports prefix queries with subtree pruning (e.g., pruning nodes that lexicographically cannot match the prefix).
- **Undirected Adjacency Graph (`ArtistGraph`):** Models artist collaborations. Provides breadth-first search (BFS) to compute distance-2 recommendations (artists related to your favorites through common collaborators, excluding direct neighbors).

---

## Audio Formats & Playback Capabilities

| Format | Support | Seeking | Notes |
|--------|---------|---------|-------|
| **WAV** (16-bit PCM) | Native Java Sound | Sample-accurate microsecond seeking | Full fidelity, zero external dependencies |
| **MP3** (MPEG-1/2 Audio Layer 3) | Decoded via Tritonus MP3SPI | Microsecond seeking via decoded PCM buffer | Packaged into standalone fat JAR |
| **AIFF / AU** | Native Java Sound | Full microsecond seeking | Native standard format support |

---

## Authors & Submission

**Team 404 MERCY** — University Hackathon Submission
- Clean separation between DSA backend algorithms and presentation layer.
- Production-grade Swing GUI with zero native platform dependencies.
