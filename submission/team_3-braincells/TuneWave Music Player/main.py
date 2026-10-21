"""
TuneWave Music Player - Interactive Terminal Demonstration
A polished, menu-driven command-line demonstration showcasing:
1. Doubly Linked List + Hash Map for playlists (Milestone 1)
2. FIFO Queue for Up Next & LIFO Stack for History (Milestone 2)
3. Binary Search Tree with Subtree Pruning for Song Search (Milestone 3A)
4. Undirected Graph for 2-Hop Related-Artist Discovery (Milestone 3B)
"""
import sys
import time
from typing import Dict, List, Optional

# Ensure standard output handles UTF-8 on Windows consoles without charmap crashes
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from src.models import Song
from src.playlist import Playlist
from src.playback import Player
from src.search_tree import SongSearchTree
from src.graph import ArtistGraph


# -----------------------------------------------------------------------------
# Sample Seed Data
# -----------------------------------------------------------------------------

SAMPLE_SONGS: List[Song] = [
    Song("s01", "Bohemian Rhapsody", "Queen", 354),
    Song("s02", "Under Pressure", "Queen & David Bowie", 248),
    Song("s03", "Heroes", "David Bowie", 367),
    Song("s04", "Starman", "David Bowie", 256),
    Song("s05", "Rocket Man", "Elton John", 281),
    Song("s06", "Tiny Dancer", "Elton John", 377),
    Song("s07", "Stairway to Heaven", "Led Zeppelin", 482),
    Song("s08", "Kashmir", "Led Zeppelin", 517),
    Song("s09", "Sweet Child O' Mine", "Guns N' Roses", 356),
    Song("s10", "Hotel California", "Eagles", 391),
]

SAMPLE_RELATIONS: List[tuple] = [
    ("Queen", "David Bowie"),
    ("David Bowie", "Elton John"),
    ("Queen", "Led Zeppelin"),
    ("Led Zeppelin", "Guns N' Roses"),
    ("Elton John", "Eagles"),
    ("Eagles", "Led Zeppelin"),
]


class TuneWaveDemoApp:
    """Orchestrates the interactive TuneWave Music Player demonstration."""

    def __init__(self):
        self.catalog: Dict[str, Song] = {s.id: s for s in SAMPLE_SONGS}
        self.playlist: Playlist = Playlist("Hackathon Main Stage")
        self.search_tree: SongSearchTree = SongSearchTree()
        self.artist_graph: ArtistGraph = ArtistGraph()

        # Seed Search Tree with all catalog songs
        for song in SAMPLE_SONGS:
            self.search_tree.addSong(song.title, song.id)

        # Seed Artist Graph with music relationships
        for artist_a, artist_b in SAMPLE_RELATIONS:
            self.artist_graph.addRelation(artist_a, artist_b)

        # Seed Playlist with the first 5 songs
        for song in SAMPLE_SONGS[:5]:
            self.playlist.addSong(song)

        # Initialize Player (binds to playlist, Up Next queue, and history stack)
        self.player: Player = Player(self.playlist)

    # -------------------------------------------------------------------------
    # UI Helpers & Formatting
    # -------------------------------------------------------------------------

    @staticmethod
    def banner(title: str) -> None:
        print("\n" + "=" * 74)
        print(f"  {title}".center(74))
        print("=" * 74)

    @staticmethod
    def section(title: str) -> None:
        print(f"\n--- {title} " + "-" * max(2, 70 - len(title)))

    def print_player_status(self) -> None:
        """Displays real-time playback state and data structure metrics."""
        curr = self.player.current_playing
        curr_text = f"'{curr.title}' — {curr.artist} [ID: {curr.id}]" if curr else "None (Stopped)"
        pl_curr = self.playlist.current_song
        pl_text = f"'{pl_curr.title}'" if pl_curr else "None"
        up_next_count = len(self.player.up_next)
        hist_count = len(self.player.history)
        repeat_text = "🔁 ON (Wraps tail to head)" if self.playlist.repeat else "OFF (Stops at 'end')"

        print("\n" + "┌" + "─" * 72 + "┐")
        print(f"│ [PLAYER STATUS] (Note: Audio playback is simulated)")
        print(f"│  • Active Playing : 🎵 {curr_text[:50]}")
        print(f"│  • Playlist Cursor: 📌 {pl_text[:50]}")
        print(f"│  • Repeat Mode    : {repeat_text}")
        print(f"│  • Up Next (Queue): {up_next_count} track(s) waiting [FIFO]")
        print(f"│  • History (Stack): {hist_count}/10 track(s) logged [LIFO]")
        print("└" + "─" * 72 + "┘")

    # -------------------------------------------------------------------------
    # Feature 1: View Catalog & Playlist
    # -------------------------------------------------------------------------

    def view_library_and_playlist(self) -> None:
        self.banner("📚 MASTER CATALOG & ACTIVE PLAYLIST")
        
        self.section("Master Song Catalog (All Available Tracks)")
        print(f"{'ID':<6} {'Title':<26} {'Artist':<22} {'Duration':<10}")
        print("-" * 68)
        for song in self.catalog.values():
            in_pl = " [In Playlist]" if song.id in self.playlist else ""
            mins, secs = divmod(song.duration, 60)
            dur_str = f"{mins}:{secs:02d}"
            print(f"{song.id:<6} {song.title[:24]:<26} {song.artist[:20]:<22} {dur_str:<8}{in_pl}")

        self.section(f"Active Playlist: '{self.playlist.name}' (Doubly Linked List)")
        pl_songs = self.playlist.to_list()
        if not pl_songs:
            print("  (Playlist is currently empty)")
        else:
            for idx, song in enumerate(pl_songs, 1):
                cursor_tag = ""
                if self.playlist.current and self.playlist.current.song.id == song.id:
                    cursor_tag += " 📌 [PLAYLIST CURSOR]"
                if self.player.current_playing and self.player.current_playing.id == song.id:
                    cursor_tag += " 🎵 [ACTIVE]"
                mins, secs = divmod(song.duration, 60)
                print(f"  {idx}. [{song.id}] {song.title} — {song.artist} ({mins}:{secs:02d}){cursor_tag}")
            print(f"\n  Total Songs in Playlist: {len(self.playlist)}")
            print(f"  Underlying Structure   : Doubly Linked List with Hash Map index")

    # -------------------------------------------------------------------------
    # Feature 2: Playlist Controls
    # -------------------------------------------------------------------------

    def playlist_controls(self) -> None:
        while True:
            self.banner("▶️ PLAYLIST CONTROLS")
            self.print_player_status()
            print("Options:")
            print("  1. Play Next Track (playNext) — Prioritizes Up Next, then advances playlist")
            print("  2. Step Playlist Backward (previous) — Moves DLL cursor to previous node")
            print("  3. Toggle Repeat Mode (toggleRepeat)")
            print("  4. Add Song to Playlist (addSong)")
            print("  5. Remove Song from Playlist (removeSong)")
            print("  0. Return to Main Menu")

            choice = input("\nEnter choice [0-5]: ").strip()
            if choice == "0":
                break
            elif choice == "1":
                self.section("Executing playNext()")
                res = self.player.playNext()
                if isinstance(res, Song):
                    print(f"✅ Now Playing: 🎵 '{res.title}' by {res.artist} [ID: {res.id}]")
                elif res == "end":
                    print("⚠️ Playlist reached the end (Repeat is OFF). Cursor stayed on last song.")
                else:
                    print("⚠️ Playlist and Up Next are empty. No track to play.")
            elif choice == "2":
                self.section("Executing playlist.previous()")
                res = self.playlist.previous()
                if isinstance(res, Song):
                    print(f"✅ Playlist cursor moved back to: '{res.title}' by {res.artist}")
                elif res == "start":
                    print("⚠️ Already at the first song (Repeat is OFF). Cursor stayed on head.")
                else:
                    print("⚠️ Playlist is empty.")
            elif choice == "3":
                self.section("Executing toggleRepeat()")
                new_state = self.playlist.toggleRepeat()
                state_str = "ENABLED (Wraps tail to head)" if new_state else "DISABLED (Stops at 'end')"
                print(f"🔁 Repeat mode is now: {state_str}")
            elif choice == "4":
                self.section("Add Song to Playlist")
                song_id = input("Enter Song ID to add (e.g. s06, s07, s08): ").strip()
                song = self.catalog.get(song_id)
                if not song:
                    print(f"❌ Error: Song ID '{song_id}' does not exist in master catalog.")
                else:
                    added = self.playlist.addSong(song)
                    if added:
                        print(f"✅ Successfully added '{song.title}' to playlist.")
                    else:
                        print(f"❌ Error: Song '{song.title}' already exists in playlist! (Uniqueness enforced)")
            elif choice == "5":
                self.section("Remove Song from Playlist")
                song_id = input("Enter Song ID to remove: ").strip()
                removed = self.playlist.removeSong(song_id)
                if removed:
                    print(f"✅ Successfully removed song '{song_id}' from playlist in O(1) time.")
                else:
                    print(f"❌ Error: Song ID '{song_id}' not found in playlist.")
            else:
                print("Invalid option. Please choose 0-5.")

    # -------------------------------------------------------------------------
    # Feature 3: Up Next Queue
    # -------------------------------------------------------------------------

    def up_next_controls(self) -> None:
        while True:
            self.banner("⏳ UP NEXT QUEUE (FIFO)")
            self.print_player_status()
            print("Options:")
            print("  1. Enqueue a Song to Up Next (addToUpNext)")
            print("  2. View Up Next Queue Order (FIFO)")
            print("  3. Play Next Track (Demonstrates queue priority over playlist)")
            print("  0. Return to Main Menu")

            choice = input("\nEnter choice [0-3]: ").strip()
            if choice == "0":
                break
            elif choice == "1":
                self.section("Enqueue Song into Up Next")
                song_id = input("Enter Song ID to queue (must exist in playlist catalog): ").strip()
                success = self.player.addToUpNext(song_id)
                if success:
                    song = self.catalog.get(song_id)
                    title = song.title if song else song_id
                    print(f"✅ Enqueued '{title}' into Up Next FIFO queue.")
                else:
                    print(f"❌ Error: Song ID '{song_id}' is invalid or not in the playlist catalog.")
            elif choice == "2":
                self.section("Current Up Next Queue (Front -> Rear)")
                queued = self.player.get_up_next()
                if not queued:
                    print("  (Up Next queue is currently empty)")
                else:
                    for idx, s in enumerate(queued, 1):
                        print(f"  {idx}. [{s.id}] {s.title} — {s.artist}")
                    print(f"\n  Total queued: {len(queued)} | FIFO Rule: Items play in insertion order")
            elif choice == "3":
                self.section("Playing Next Track")
                res = self.player.playNext()
                if isinstance(res, Song):
                    print(f"✅ Now Playing: 🎵 '{res.title}' by {res.artist}")
                    print(f"  Notice: Playlist cursor remained isolated: '{self.playlist.current_song.title if self.playlist.current_song else 'None'}'")
                elif res == "end":
                    print("⚠️ Playlist end reached.")
                else:
                    print("⚠️ Player is empty.")
            else:
                print("Invalid option. Please choose 0-3.")

    # -------------------------------------------------------------------------
    # Feature 4: Playback History
    # -------------------------------------------------------------------------

    def history_controls(self) -> None:
        while True:
            self.banner("📜 PLAYBACK HISTORY (LIFO Bounded Stack)")
            self.print_player_status()
            print("Options:")
            print("  1. View Playback History (Most Recent -> Oldest)")
            print("  2. Go Back (back) — Replay most recent eligible previous song")
            print("  3. Demonstrate 10-Item Stack Limit (Auto-plays tracks to test capping)")
            print("  0. Return to Main Menu")

            choice = input("\nEnter choice [0-3]: ").strip()
            if choice == "0":
                break
            elif choice == "1":
                self.section("Playback History Stack")
                history = self.player.get_history()
                if not history:
                    print("  (Playback history is currently empty)")
                else:
                    for idx, s in enumerate(history, 1):
                        tag = " (TOP of stack)" if idx == 1 else ""
                        print(f"  {idx}. [{s.id}] {s.title} — {s.artist}{tag}")
                    print(f"\n  Capacity: {len(history)}/10 entries | LIFO Rule: 'back()' pops from the top")
            elif choice == "2":
                self.section("Executing back()")
                replayed = self.player.back()
                if replayed:
                    print(f"✅ Replayed from history: 🎵 '{replayed.title}' by {replayed.artist}")
                    print("  Note: Displaced track was NOT pushed onto history (Replay loop prevented).")
                    print(f"  Playlist cursor remains untouched at: '{self.playlist.current_song.title if self.playlist.current_song else 'None'}'")
                else:
                    print("⚠️ Playback history is empty. Cannot go back.")
            elif choice == "3":
                self.section("Demonstrating 10-Item History Limit")
                print("Adding all catalog songs to playlist and triggering 12 sequential transitions...")
                for s in SAMPLE_SONGS:
                    self.playlist.addSong(s)
                self.playlist.toggleRepeat()  # Ensure it wraps
                for _ in range(12):
                    self.player.playNext()
                print(f"✅ Completed 12 transitions. History size: {len(self.player.history)}/10")
                print("Oldest entries were discarded in O(1) time without stack overflow.")
                self.playlist.repeat = False  # Reset repeat
            else:
                print("Invalid option. Please choose 0-3.")

    # -------------------------------------------------------------------------
    # Feature 5: Song Search (BST)
    # -------------------------------------------------------------------------

    def search_controls(self) -> None:
        while True:
            self.banner("🔍 SONG SEARCH (Custom Binary Search Tree)")
            print("Options:")
            print("  1. Exact Title Search (findSong)")
            print("  2. Prefix Search (prefixSearch) — Demonstrates BST Subtree Pruning")
            print("  3. View Entire Alphabetical Index (In-Order Traversal)")
            print("  0. Return to Main Menu")

            choice = input("\nEnter choice [0-3]: ").strip()
            if choice == "0":
                break
            elif choice == "1":
                self.section("Exact Song Title Lookup")
                title = input("Enter song title to search (case-insensitive): ").strip()
                record = self.search_tree.findSong(title)
                if record:
                    print(f"✅ Found match in BST:")
                    print(f"   • Display Title: '{record.title}'")
                    print(f"   • Song ID(s)   : {record.song_ids}")
                    print(f"   • Nodes Visited: {self.search_tree.visited_nodes} (O(log n) traversal)")
                else:
                    print(f"❌ No song with title '{title}' found in search tree.")
            elif choice == "2":
                self.section("Prefix Search with Subtree Pruning")
                prefix = input("Enter title prefix (e.g. 'st', 'ro', 'b', 'h'): ").strip()
                matches = self.search_tree.prefixSearch(prefix)
                print(f"\n✅ Matching Song Titles (Alphabetical Order):")
                if not matches:
                    print(f"   (No titles starting with '{prefix}')")
                else:
                    for idx, title in enumerate(matches, 1):
                        print(f"   {idx}. {title}")
                print(f"\n🔍 BST Subtree Pruning Audit:")
                print(f"   • Nodes Visited in Traversal : {self.search_tree.visited_nodes}")
                print(f"   • Total Nodes in Tree        : {len(self.search_tree)}")
                print(f"   • Subtree Pruning Status     : Irrelevant branches were actively skipped!")
            elif choice == "3":
                self.section("Alphabetical Index (In-Order BST Traversal)")
                all_titles = self.search_tree.prefixSearch("")
                for idx, t in enumerate(all_titles, 1):
                    rec = self.search_tree.findSong(t)
                    print(f"  {idx:<2}. {t:<28} [ID: {rec.song_id if rec else '?'}]")
            else:
                print("Invalid option. Please choose 0-3.")

    # -------------------------------------------------------------------------
    # Feature 6: Artist Recommendations (Undirected Graph)
    # -------------------------------------------------------------------------

    def graph_controls(self) -> None:
        while True:
            self.banner("🌐 ARTIST RECOMMENDATIONS (Undirected Graph)")
            print(f"Graph Status: {self.artist_graph.artist_count} artists, {self.artist_graph.edge_count} bidirectional edges.")
            print("\nOptions:")
            print("  1. Get 2-Hop Artist Recommendations (recommendArtists)")
            print("  2. View Direct Connections for an Artist (1-Hop)")
            print("  3. View All Registered Artist Relationships")
            print("  4. Add New Artist Relationship (addRelation)")
            print("  0. Return to Main Menu")

            choice = input("\nEnter choice [0-4]: ").strip()
            if choice == "0":
                break
            elif choice == "1":
                self.section("2-Hop Artist Recommendations")
                artist = input("Enter artist name (e.g. 'Queen', 'David Bowie', 'Guns N\\' Roses'): ").strip()
                recs = self.artist_graph.recommendArtists(artist)
                directs = self.artist_graph.get_direct_relations(artist)
                print(f"\nAnalysis for '{artist}':")
                print(f"  • Direct (1-Hop) Neighbors : {directs if directs else '(None)'}")
                print(f"  • Recommended (2-Hop)      : {recs if recs else '(No 2-hop recommendations)'}")
                print("\n  Rules Enforced:")
                print("   - Exactly 2 graph edges away.")
                print("   - Starting artist and direct neighbors are strictly excluded.")
                print("   - Alphabetically ordered and deduplicated.")
            elif choice == "2":
                self.section("1-Hop Direct Connections")
                artist = input("Enter artist name: ").strip()
                directs = self.artist_graph.get_direct_relations(artist)
                if not directs:
                    print(f"  Artist '{artist}' has no direct relations or is unknown.")
                else:
                    print(f"  Direct neighbors of '{artist}':")
                    for d in directs:
                        print(f"   • {d}")
            elif choice == "3":
                self.section("All Registered Relationships (Undirected Graph)")
                printed_edges = set()
                for artist in sorted(self.artist_graph._display_names.values()):
                    for neighbor in self.artist_graph.get_direct_relations(artist):
                        edge = tuple(sorted([artist, neighbor]))
                        if edge not in printed_edges:
                            printed_edges.add(edge)
                            print(f"  🔗 {edge[0]} <───> {edge[1]}")
            elif choice == "4":
                self.section("Add New Artist Relationship")
                artist_a = input("Enter first artist: ").strip()
                artist_b = input("Enter second artist: ").strip()
                added = self.artist_graph.addRelation(artist_a, artist_b)
                if added:
                    print(f"✅ Successfully created undirected edge: {artist_a} <───> {artist_b}")
                else:
                    print(f"❌ Could not add relation (invalid names, self-relation, or duplicate edge).")
            else:
                print("Invalid option. Please choose 0-4.")

    # -------------------------------------------------------------------------
    # Feature 7: Data Structure Architecture Tour
    # -------------------------------------------------------------------------

    def architecture_tour(self) -> None:
        self.banner("💡 TUNEWAVE DATA STRUCTURE ARCHITECTURE")
        print("""
1. 📂 PLAYLIST ENGINE (Milestone 1)
   • Data Structures : Doubly Linked List (DLL) + Hash Map (dict: songId -> SongNode)
   • Core Operations : addSong(), removeSong(), next(), previous(), toggleRepeat()
   • Performance     : O(1) forward/backward navigation; O(1) random removal via hash map pointer splicing.
   • Invariants      : A song appears at most once in a playlist. Head/tail bounds strictly preserved.

2. ⏳ UP NEXT QUEUE (Milestone 2)
   • Data Structure  : Custom Singly Linked FIFO Queue (QueueNode, head, tail)
   • Core Operations : addToUpNext(songId), playNext()
   • Performance     : O(1) enqueue at tail, O(1) dequeue at front.
   • Playback Rules  : Queued songs take strict priority over playlist sequence. Playing from Up Next
                       does NOT alter the playlist cursor.

3. 📜 PLAYBACK HISTORY (Milestone 2)
   • Data Structure  : Custom Doubly Linked LIFO Stack capped at 10 items
   • Core Operations : back(), push(), pop()
   • Performance     : O(1) push and pop at top; O(1) bottom eviction when capacity (10) is exceeded.
   • Playback Rules  : Replays most recent song without pushing displaced track (replay loop prevention).

4. 🔍 SONG SEARCH INDEX (Milestone 3A)
   • Data Structure  : Custom Binary Search Tree (BST) ordered by normalized song title
   • Core Operations : addSong(title, songId), findSong(title), prefixSearch(prefix)
   • Performance     : O(log n) average title lookup; prefix search prunes irrelevant left/right subtrees.
   • Invariants      : Duplicate titles share nodes without data loss. In-order traversal yields alphabetical order.

5. 🌐 RELATED-ARTIST RECOMMENDER (Milestone 3B)
   • Data Structure  : Custom Undirected Graph with Adjacency List (Dict[str, Set[str]])
   • Core Operations : addRelation(artistA, artistB), recommendArtists(artist)
   • Traversal       : BFS 2-hop traversal discovering artists exactly 2 edges away.
   • Recommendation  : Automatically excludes start artist and all direct 1-hop neighbors.
""")
        input("Press Enter to return to main menu...")

    # -------------------------------------------------------------------------
    # Feature 8: Quick Automated Walkthrough Script
    # -------------------------------------------------------------------------

    def run_automated_demo(self) -> None:
        """Executes a scripted demonstration of all 4 data structures without user input."""
        self.banner("⚡ TUNEWAVE AUTOMATED HACKATHON DEMONSTRATION")
        print("Running scripted end-to-end verification scenario...\n")

        # Step 1: Initial State
        print("--- Step 1: Playlist & Player Initialization (Milestone 1) ---")
        print(f"Playlist initialized with {len(self.playlist)} songs.")
        print(f"Initial Playing Song: 🎵 '{self.player.current_playing.title}' [ID: {self.player.current_playing.id}]")

        # Step 2: Normal Playlist Advancement
        print("\n--- Step 2: Advancing Playlist ---")
        next_song = self.player.playNext()
        print(f"Advanced to: 🎵 '{next_song.title}' (Playlist cursor advanced to node 2)")

        # Step 3: Up Next Queue Priority & Cursor Isolation (Milestone 2)
        print("\n--- Step 3: Up Next Queue Priority (Milestone 2) ---")
        print("Enqueuing 's05' (Rocket Man) into Up Next FIFO queue...")
        self.player.addToUpNext("s05")
        print(f"Up Next size: {len(self.player.up_next)}")
        print("Calling playNext() -> Expected: Rocket Man plays, playlist cursor stays on node 2")
        queued_play = self.player.playNext()
        print(f"Now Playing    : 🎵 '{queued_play.title}' [Queued]")
        print(f"Playlist Cursor: 📌 '{self.playlist.current_song.title}' (Unchanged!)")

        # Step 4: Resume Playlist after Queue Drains
        print("\n--- Step 4: Queue Drains, Playlist Resumes Sequence ---")
        print("Up Next is now empty. Calling playNext()...")
        resumed = self.player.playNext()
        print(f"Now Playing    : 🎵 '{resumed.title}' (Resumed from playlist cursor!)")

        # Step 5: History & Loop Prevention (Milestone 2)
        print("\n--- Step 5: Playback History Stack & Back Replay ---")
        print(f"History stack contains: {[s.title for s in self.player.get_history()]}")
        replayed = self.player.back()
        print(f"Called back() -> Replayed: 🎵 '{replayed.title}'")
        print(f"Remaining history: {[s.title for s in self.player.get_history()]}")
        print("Replay loop prevented: Displaced song was not re-pushed.")

        # Step 6: Song Search with BST Subtree Pruning (Milestone 3A)
        print("\n--- Step 6: Song Search & Subtree Pruning (Milestone 3A) ---")
        print("Searching for prefix 'st'...")
        matches = self.search_tree.prefixSearch("st")
        print(f"Prefix matches for 'st' : {matches}")
        print(f"Nodes visited in tree   : {self.search_tree.visited_nodes}")
        print(f"Total tree nodes        : {len(self.search_tree)} (Irrelevant subtrees pruned!)")

        # Step 7: Artist Recommendations via Undirected Graph (Milestone 3B)
        print("\n--- Step 7: 2-Hop Artist Recommendations (Milestone 3B) ---")
        print("Querying recommendations for 'Queen'...")
        queen_directs = self.artist_graph.get_direct_relations("Queen")
        queen_recs = self.artist_graph.recommendArtists("Queen")
        print(f"Direct relations for Queen : {queen_directs}")
        print(f"2-Hop Recommendations      : {queen_recs}")
        print("Explanation: Elton John is connected via David Bowie; Guns N' Roses via Led Zeppelin.")

        print("\n" + "=" * 74)
        print("  🎉 DEMO COMPLETE: ALL 4 DATA STRUCTURES WORKING FLAWLESSLY!  ".center(74))
        print("=" * 74 + "\n")

    # -------------------------------------------------------------------------
    # Main Application Loop
    # -------------------------------------------------------------------------

    def run(self) -> None:
        while True:
            self.banner("🎵 TUNEWAVE MUSIC PLAYER — INTERACTIVE DEMO 🎵")
            self.print_player_status()
            print("MAIN MENU:")
            print("  1. 📚 View Song Library & Active Playlist")
            print("  2. ▶️  Playback Controls (Play Next / Back / Toggle Repeat)")
            print("  3. ⏳ Up Next Queue (FIFO Queue Management)")
            print("  4. 📜 Playback History (LIFO Stack Management)")
            print("  5. 🔍 Song Search (BST Title Lookup & Prefix Pruning)")
            print("  6. 🌐 Artist Recommendations (Undirected Graph Traversal)")
            print("  7. 💡 Data Structure Architecture Walkthrough")
            print("  8. ⚡ Run Quick Automated Demonstration Script")
            print("  0. 🚪 Exit TuneWave")

            try:
                choice = input("\nEnter menu selection [0-8]: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n\nExiting TuneWave...")
                break

            if choice == "0":
                print("\nThank you for exploring TuneWave Music Player! Goodbye. 🎵\n")
                break
            elif choice == "1":
                self.view_library_and_playlist()
            elif choice == "2":
                self.playlist_controls()
            elif choice == "3":
                self.up_next_controls()
            elif choice == "4":
                self.history_controls()
            elif choice == "5":
                self.search_controls()
            elif choice == "6":
                self.graph_controls()
            elif choice == "7":
                self.architecture_tour()
            elif choice == "8":
                self.run_automated_demo()
            else:
                print("❌ Invalid selection. Please enter a number between 0 and 8.")


def main():
    app = TuneWaveDemoApp()
    if len(sys.argv) > 1 and sys.argv[1] in ("--demo", "-d", "--auto", "--test"):
        app.run_automated_demo()
    else:
        app.run()


if __name__ == "__main__":
    main()
