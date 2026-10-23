from playlist import SongNode, Playlist
from playback import PlayerController
from search import SongSearch, ArtistGraph


class MusicPlayerApp:
    def __init__(self):
        self.playlist = Playlist()
        self.controller = PlayerController(self.playlist)
        self.search = SongSearch()
        self.graph = ArtistGraph()


        self.catalog = {}
        self.next_id = 1

        self._load_sample_data()

    def _load_sample_data(self):
        samples = [
            ("Shape of You", "Ed Sheeran"),
            ("Shivers", "Ed Sheeran"),
            ("Perfect", "Ed Sheeran"),
            ("Starboy", "The Weeknd"),
            ("Blinding Lights", "The Weeknd"),
            ("Despacito", "Luis Fonsi"),
            ("Get Lucky", "Daft Punk"),
            ("Happy", "Pharrell Williams"),
        ]
        for title, artist in samples:
            self._add_song(title, artist)

        for a, b in [
            ("Ed Sheeran", "Justin Bieber"),
            ("Justin Bieber", "Luis Fonsi"),
            ("Ed Sheeran", "The Weeknd"),
            ("The Weeknd", "Daft Punk"),
            ("Daft Punk", "Pharrell Williams"),
        ]:
            self.graph.addRelation(a, b)

        # Mark the first song as "playing" and put it into history.
        first = self.playlist.current
        if first:
            self.controller.currently_playing = first.song_id
            self.controller._record_history(first.song_id)

    def _add_song(self, title, artist):
        """Add a song to the catalog, search tree and playlist."""
        if self.search.findSong(title) is not None:
            return None  # duplicate title
        song_id = str(self.next_id)
        self.next_id += 1
        self.catalog[song_id] = (title, artist)
        self.search.addSong(title, song_id)
        self.playlist.addSong(SongNode(song_id, title, artist))
        return song_id

    # ---------------------------------------------------------------- helpers
    def _label(self, song_id):
        if song_id in self.catalog:
            title, artist = self.catalog[song_id]
            return f"{title} - {artist} (id {song_id})"
        return f"Unknown song (id {song_id})"

    def _sync_pointer(self, song_id):
        """Keep the playlist's cursor on the song that is actually playing."""
        node = self.playlist.node_map.get(song_id)
        if node:
            self.playlist.current = node

    # ---------------------------------------------------------------- actions
    def show_playlist(self):
        print("\nPlaylist:")
        node = self.playlist.head
        if not node:
            print("(empty)")
        n = 1
        while node:
            marker = ">" if node.song_id == self.controller.currently_playing else " "
            print(f" {marker} {n}. {node.title} - {node.artist} (id {node.song_id})")
            node = node.next
            n += 1
        print(f"\nRepeat: {'ON' if self.playlist.repeat else 'OFF'}")
        playing = self.controller.currently_playing
        print(f"Now playing: {self._label(playing) if playing else 'nothing'}")

    def add_song(self):
        title = input("Title: ").strip()
        artist = input("Artist: ").strip()
        if not title or not artist:
            print("Title and artist cannot be empty.")
            return
        song_id = self._add_song(title, artist)
        if song_id is None:
            print(f"'{title}' already exists.")
        else:
            print(f"Added: {self._label(song_id)}")

    def remove_song(self):
        song_id = input("Song ID to remove from playlist: ").strip()
        if self.playlist.removeSong(song_id):
            print(f"Removed song {song_id} from the playlist.")
        else:
            print("No song with that ID in the playlist.")

    def play_next(self):
        res = self.controller.playNext()
        if res == "end":
            print("End of playlist. Turn Repeat on to loop.")
        else:
            self._sync_pointer(res)
            print(f"Now playing: {self._label(res)}")

    def play_previous(self):
        res = self.playlist.previous()
        if res == "start":
            print("Already at the start of the playlist.")
            return
        self.controller.currently_playing = res
        self.controller._record_history(res)
        print(f"Now playing: {self._label(res)}")

    def go_back(self):
        # The top of the history stack is the song that is playing right now,
        # so we need at least two entries to have a real "previous" song.
        if len(self.controller.history_stack) < 2:
            print("No earlier song in history.")
            return
        self.controller.back()                # discard the current song
        prev = self.controller.back()         # the song before it
        self.controller._record_history(prev)  # it is the current song again
        self._sync_pointer(prev)
        print(f"Back to: {self._label(prev)}")

    def queue_song(self):
        song_id = input("Song ID to add to Up Next: ").strip()
        if song_id not in self.catalog:
            print("That song ID doesn't exist.")
            return
        self.controller.addToUpNext(song_id)
        print(f"Queued: {self._label(song_id)}")

    def show_queue_and_history(self):
        print("\nUp Next:")
        if not self.controller.up_next_queue:
            print("(empty)")
        for i, sid in enumerate(self.controller.up_next_queue, 1):
            print(f"  {i}. {self._label(sid)}")

        print("\nHistory (latest first):")
        if not self.controller.history_stack:
            print("(empty)")
        for i, sid in enumerate(reversed(self.controller.history_stack), 1):
            print(f"  {i}. {self._label(sid)}")

    def toggle_repeat(self):
        state = self.playlist.toggleRepeat()
        print(f"Repeat is now {'ON' if state else 'OFF'}.")

    def find_song(self):
        title = input("Exact title: ").strip()
        song_id = self.search.findSong(title)
        if song_id is None:
            print("Not found. (Search is case-sensitive.)")
        else:
            print(f"Found: {self._label(song_id)}")

    def autocomplete(self):
        prefix = input("Type a title prefix: ").strip()
        if not prefix:
            print("Enter at least one character.")
            return
        results = self.search.prefixSearch(prefix)
        if not results:
            print("No matches. (Search is case-sensitive.)")
            return
        print(f"Matches for '{prefix}':")
        for title in results:
            print(f"  - {self._label(self.search.findSong(title))}")

    def add_relation(self):
        a = input("Artist A: ").strip()
        b = input("Artist B: ").strip()
        if not a or not b or a == b:
            print("Enter two different artist names.")
            return
        self.graph.addRelation(a, b)
        print(f"Linked '{a}' <-> '{b}'.")

    def recommend(self):
        artist = input("Artist name: ").strip()
        recs = self.graph.recommendArtists(artist)
        if artist not in self.graph.adj_list:
            print("Artist not in the graph yet. Add a relation first.")
        elif not recs:
            print("No recommendations (no artists exactly 2 connections away).")
        else:
            print(f"Because you like {artist}, try: {', '.join(recs)}")

    # -------------------------------------------------------------------- UI
    MENU = """
Menu
 1. Show playlist
 2. Add new song
 3. Remove song
 4. Next song
 5. Previous song
 6. Back (history)
 7. Add song to Up Next
 8. Show Up Next & History
 9. Toggle repeat
10. Find song by title
11. Autocomplete
12. Add artist relation
13. Recommend artists
 0. Exit"""

    def run(self):
        actions = {
            "1": self.show_playlist,
            "2": self.add_song,
            "3": self.remove_song,
            "4": self.play_next,
            "5": self.play_previous,
            "6": self.go_back,
            "7": self.queue_song,
            "8": self.show_queue_and_history,
            "9": self.toggle_repeat,
            "10": self.find_song,
            "11": self.autocomplete,
            "12": self.add_relation,
            "13": self.recommend,
        }

        print("Welcome to TuneWave!")
        print(self.MENU)
        while True:
            try:
                choice = input("\nOption (m = menu): ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print("\nGoodbye!")
                break

            if choice == "0":
                print("Goodbye!")
                break
            if choice == "m":
                print(self.MENU)
                continue
            action = actions.get(choice)
            if action:
                action()
            else:
                print("Invalid option, try again.")


if __name__ == "__main__":
    MusicPlayerApp().run()
