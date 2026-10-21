"""LibraryManager: the single place that creates songs and keeps indexes in sync.

IDs: a counter that only goes up (1, 2, 3...). Deleting a song never lowers it,
so an ID is never reused. The counter is saved to JSON so this also holds after restart.
"""
from typing import Dict, List, Optional, Tuple
from data_structures.artist_graph import ArtistGraph
from data_structures.binary_search_tree import SongBST
from models.song import Song


class LibraryManager:
    def __init__(self):
        self.songs: Dict[int, Song] = {}
        self.bst = SongBST()
        self.graph = ArtistGraph()
        self._next_id = 1

    @property
    def next_id(self) -> int:
        return self._next_id

    def add_song(self, title: str, artist: str, audio_path: str = "") -> Song:
        title, artist = title.strip(), artist.strip()
        if not title:
            raise ValueError("Song title cannot be empty.")
        if not artist:
            raise ValueError("Artist cannot be empty.")
        song = Song(self._next_id, title, artist, audio_path)
        self._next_id += 1
        self._register(song)
        return song

    def _register(self, song: Song) -> None:
        self.songs[song.id] = song
        self.bst.add_song(song.title, song.id)
        self.graph.add_artist(song.artist)

    def remove_song(self, song_id: int) -> bool:
        song = self.songs.pop(song_id, None)
        if song is None:
            return False
        self.bst.remove_song(song.title, song_id)
        return True

    def get_song(self, song_id: int) -> Optional[Song]:
        return self.songs.get(song_id)

    def all_songs(self) -> List[Song]:
        return [self.songs[i] for i in sorted(self.songs)]

    def find_song(self, title: str) -> List[Song]:
        return [self.songs[i] for i in self.bst.find_song(title) if i in self.songs]

    def prefix_search(self, prefix: str) -> List[Song]:
        return [self.songs[i] for _, i in self.bst.prefix_search(prefix) if i in self.songs]

    def add_relation(self, artist_a: str, artist_b: str) -> bool:
        return self.graph.add_relation(artist_a, artist_b)

    def recommend_artists(self, artist: str) -> List[str]:
        return self.graph.recommend_artists(artist)

    def restore(self, songs: List[Song], next_id: int, relations: List[Tuple[str, str]]) -> None:
        """Rebuild all indexes from saved data (used by storage)."""
        for song in songs:
            self._register(song)
        highest = max(self.songs, default=0)
        self._next_id = max(next_id, highest + 1)
        for a, b in relations:
            self.graph.add_relation(a, b)
