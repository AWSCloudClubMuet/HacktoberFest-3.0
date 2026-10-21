from collections import deque
from dataclasses import dataclass, field

@dataclass(frozen=True)
class Song:
    songId: str
    title: str
    artist: str

    def __post_init__(self):
        if any(not isinstance(value, str) or not value.strip()
               for value in (self.songId, self.title, self.artist)):
            raise ValueError("Song ID, title and artist must be non-empty strings")

@dataclass(eq=False)
class _PlaylistNode:
    song: Song
    previous: "_PlaylistNode | None" = None
    next: "_PlaylistNode | None" = None

class Playlist:

    def __init__(self):
        self.head = None
        self.tail = None
        self.current = None
        self.nodes = {}
        self.repeat = False

    def __len__(self):
        return len(self.nodes)

    def __iter__(self):
        node = self.head
        while node is not None:
            yield node.song
            node = node.next

    def addSong(self, song: Song):
        if song.songId in self.nodes:
            raise ValueError(f"Duplicate playlist ID: {song.songId}")
        node = _PlaylistNode(song, previous=self.tail)
        if self.tail is None:
            self.head = node
        else:
            self.tail.next = node
        self.tail = node
        self.nodes[song.songId] = node

    def removeSong(self, songId: str) -> Song:
        node = self.nodes.pop(songId)
        if node.previous is None:
            self.head = node.next
        else:
            node.previous.next = node.next
        if node.next is None:
            self.tail = node.previous
        else:
            node.next.previous = node.previous
        if self.current is node:

            self.current = node.previous
        node.previous = node.next = None
        return node.song

    def next(self) -> Song | str | None:
        if self.head is None:
            return None
        if self.current is None:
            self.current = self.head
        elif self.current.next is not None:
            self.current = self.current.next
        elif self.repeat:
            self.current = self.head
        else:
            return "end"
        return self.current.song

    def previous(self) -> Song | str | None:
        if self.tail is None:
            return None
        if self.current is None:
            self.current = self.tail
        elif self.current.previous is not None:
            self.current = self.current.previous
        elif self.repeat:
            self.current = self.tail
        else:
            return "start"
        return self.current.song

    def toggleRepeat(self) -> bool:
        self.repeat = not self.repeat
        return self.repeat

@dataclass
class _TitleNode:
    title: str
    songIds: list[str] = field(default_factory=list)
    left: "_TitleNode | None" = None
    right: "_TitleNode | None" = None

class SongSearch:

    def __init__(self):
        self.root = None
        self._ids = {}

    def addSong(self, title: str, songId: str):
        if not isinstance(title, str) or not title.strip():
            raise ValueError("Title must be a non-empty string")
        if not isinstance(songId, str) or not songId.strip():
            raise ValueError("Song ID must be a non-empty string")
        if songId in self._ids:
            raise ValueError(f"Duplicate catalog ID: {songId}")
        if self.root is None:
            self.root = _TitleNode(title, [songId])
        else:
            node = self.root
            while True:
                if title == node.title:
                    node.songIds.append(songId)
                    break
                side = "left" if title < node.title else "right"
                child = getattr(node, side)
                if child is None:
                    setattr(node, side, _TitleNode(title, [songId]))
                    break
                node = child
        self._ids[songId] = title

    def findSong(self, title: str) -> tuple[str, ...] | None:
        node = self.root
        while node is not None:
            if title == node.title:
                return tuple(node.songIds)
            node = node.left if title < node.title else node.right
        return None

    def prefixSearch(self, prefix: str) -> list[str]:
        if not isinstance(prefix, str):
            raise TypeError("Prefix must be a string")

        upper = None
        for index in range(len(prefix) - 1, -1, -1):
            if ord(prefix[index]) < 0x10FFFF:
                upper = prefix[:index] + chr(ord(prefix[index]) + 1)
                break
        result, stack = [], []
        node = self.root
        while node is not None or stack:
            while node is not None:
                if node.title < prefix:
                    node = node.right
                elif upper is not None and node.title >= upper:
                    node = node.left
                else:
                    stack.append(node)
                    node = node.left
            if stack:
                node = stack.pop()
                result.append(node.title)
                node = node.right
        return result

class ArtistGraph:
    def __init__(self):
        self.adjacency = {}

    def addRelation(self, artistA: str, artistB: str):
        if any(not isinstance(artist, str) or not artist.strip()
               for artist in (artistA, artistB)):
            raise ValueError("Artist names must be non-empty strings")
        if artistA == artistB:
            raise ValueError("An artist cannot be related to itself")
        self.adjacency.setdefault(artistA, set()).add(artistB)
        self.adjacency.setdefault(artistB, set()).add(artistA)

    def recommendArtists(self, artist: str) -> list[str]:
        direct = self.adjacency.get(artist, set())
        candidates = set()
        for neighbor in direct:
            candidates.update(self.adjacency[neighbor])
        return sorted(candidates - direct - {artist})

class MusicPlayer:

    def __init__(self):
        self.playlist = Playlist()
        self.search = SongSearch()
        self.artists = ArtistGraph()
        self.songs = {}
        self.upNext = deque()
        self.history = deque(maxlen=10)
        self.nowPlaying = None

    def registerSong(self, song: Song):
        if song.songId in self.songs:
            raise ValueError(f"Duplicate catalog ID: {song.songId}")
        self.search.addSong(song.title, song.songId)
        self.songs[song.songId] = song

    def addSong(self, song: Song):
        if song.songId in self.playlist.nodes:
            raise ValueError(f"Duplicate playlist ID: {song.songId}")
        existing = self.songs.get(song.songId)
        if existing is not None and existing != song:
            raise ValueError(f"Song ID has conflicting metadata: {song.songId}")
        if existing is None:
            self.registerSong(song)
        self.playlist.addSong(song)

    def removeSong(self, songId: str) -> Song:
        return self.playlist.removeSong(songId)

    def addToUpNext(self, songId: str):
        self.upNext.append(self.songs[songId])

    def playNext(self) -> Song | str | None:
        song = self.upNext.popleft() if self.upNext else self.playlist.next()
        if isinstance(song, Song):
            self.nowPlaying = song
            self.history.append(song)
        return song

    def back(self) -> Song | None:
        if not self.history:
            return None
        self.nowPlaying = self.history.pop()
        return self.nowPlaying
