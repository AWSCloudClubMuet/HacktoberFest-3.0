
from models import Song
from playlist import Playlist
from playback import PlaybackManager
from search_recommendations import SongSearchBST, ArtistGraph


class TuneWave:
    def __init__(self):
        self.playlist = Playlist()
        self.playback = PlaybackManager(self.playlist)
        self.search = SongSearchBST()
        self.artist_graph = ArtistGraph()
        self.catalog = {}

    def add_song(self, song_id, title, artist):
        """Add a song to the playlist and search catalog."""
        if song_id in self.catalog:
            print("A song with this ID already exists.")
            return

        song = Song(song_id, title, artist)

        if not self.playlist.add_song(song):
            print("Could not add song to playlist.")
            return

        if not self.search.add_song(title, song_id, artist):
            # Keep the playlist and catalog consistent if insertion fails.
            self.playlist.remove_song(song_id)
            print("Could not add song to search catalog.")
            return

        self.catalog[song_id] = song
        self.artist_graph.adjacency.setdefault(artist, set())
        print(f"Added: {title} - {artist}")

    def show_playlist(self):
        songs = self.playlist.get_songs()

        if not songs:
            print("Your playlist is empty.")
            return

        print("\n--- Playlist ---")
        for index, song in enumerate(songs, start=1):
            marker = "  <-- playlist position" if (
                song == self.playlist.get_current_song()
            ) else ""
            print(f"{index}. [{song.song_id}] {song.title} - {song.artist}{marker}")

    def play_next(self):
        song = self.playback.play_next()

        if song is None:
            print("End of playlist.")
        else:
            print(f"Now playing: {song.title} - {song.artist}")

    def play_previous(self):
        song = self.playlist.previous_song()

        if song is None:
            print("No previous song available.")
            return

        self.playback.currently_playing = song
        print(f"Now playing: {song.title} - {song.artist}")

    def queue_song(self, song_id):
        if self.playback.add_to_up_next(song_id):
            print(f"Queued: {self.catalog[song_id].title}")
        else:
            print("Song ID not found in the playlist.")

    def go_back(self):
        song = self.playback.back()

        if song is None:
            print("No playback history available.")
        else:
            print(f"Back to: {song.title} - {song.artist}")

    def search_title(self, title):
        results = self.search.find_song(title)

        if not results:
            print("No matching song found.")
            return

        for song in results:
            print(f"[{song.song_id}] {song.title} - {song.artist}")

    def search_prefix(self, prefix):
        results = self.search.prefix_search(prefix)

        if not results:
            print("No songs match that prefix.")
            return

        print("\n--- Search Results ---")
        for song in results:
            print(f"[{song.song_id}] {song.title} - {song.artist}")

    def add_artist_relation(self, artist_a, artist_b):
        self.artist_graph.add_relation(artist_a, artist_b)
        print(f"Relationship added: {artist_a} <-> {artist_b}")

    def recommend_artists(self, artist):
        recommendations = self.artist_graph.recommend_artists(artist)

        if not recommendations:
            print("No recommendations found.")
            return

        print(f"\nArtists related to {artist} through two links:")
        for name in recommendations:
            print(f"- {name}")

    def run(self):
        actions = {
            "1": ("Add song", self.menu_add_song),
            "2": ("Show playlist", self.show_playlist),
            "3": ("Play next", self.play_next),
            "4": ("Play previous", self.play_previous),
            "5": ("Add song to Up Next", self.menu_queue_song),
            "6": ("Back (play history)", self.go_back),
            "7": ("Find exact title", self.menu_search_title),
            "8": ("Search title prefix", self.menu_search_prefix),
            "9": ("Add artist relationship", self.menu_add_relation),
            "10": ("Recommend artists", self.menu_recommend),
        }

        while True:
            print("\n====== TuneWave Music Player ======")
            for key, (label, _) in actions.items():
                print(f"{key}. {label}")
            print("0. Exit")

            choice = input("Choose an option: ").strip()

            if choice == "0":
                print("Thanks for using TuneWave!")
                break

            action = actions.get(choice)
            if action is None:
                print("Invalid option. Try again.")
                continue

            try:
                action[1]()
            except (ValueError, KeyError) as error:
                print(f"Could not complete operation: {error}")

    def menu_add_song(self):
        song_id = input("Song ID: ").strip()
        title = input("Song title: ").strip()
        artist = input("Artist: ").strip()

        if not song_id or not title or not artist:
            print("All fields are required.")
            return

        self.add_song(song_id, title, artist)

    def menu_queue_song(self):
        song_id = input("Song ID to queue: ").strip()
        self.queue_song(song_id)

    def menu_search_title(self):
        title = input("Exact song title: ").strip()
        self.search_title(title)

    def menu_search_prefix(self):
        prefix = input("Title prefix: ").strip()
        self.search_prefix(prefix)

    def menu_add_relation(self):
        artist_a = input("First artist: ").strip()
        artist_b = input("Second artist: ").strip()

        if not artist_a or not artist_b:
            print("Both artist names are required.")
            return

        self.add_artist_relation(artist_a, artist_b)

    def menu_recommend(self):
        artist = input("Artist to get recommendations for: ").strip()
        self.recommend_artists(artist)


if __name__ == "__main__":
    app = TuneWave()

    # Sample songs so the player is immediately usable.
    app.add_song("S001", "Midnight City", "M83")
    app.add_song("S002", "Another Love", "Tom Odell")
    app.add_song("S003", "Midnight Rain", "Taylor Swift")
    app.add_song("S004", "Anti-Hero", "Taylor Swift")

    # Sample artist relationships for demonstrating recommendations.
    app.add_artist_relation("M83", "CHVRCHES")
    app.add_artist_relation("CHVRCHES", "Purity Ring")

    app.run()
