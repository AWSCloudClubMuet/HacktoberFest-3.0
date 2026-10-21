
from collections import deque

class Song:
    """A song record. `song_id` is the unique key used everywhere."""

    def __init__(self, song_id, title, artist):
        self.id = song_id
        self.title = title
        self.artist = artist

    def __repr__(self):
        return f"Song({self.id}, '{self.title}', '{self.artist}')"


# milestone 1

class _PlaylistNode:
    __slots__ = ("song", "prev", "next")

    def __init__(self, song):
        self.song = song
        self.prev = None
        self.next = None


class Playlist:
   
    # Ordered playlist with O(1) add/remove/next/previous.
    

    def __init__(self):
        self.head = None
        self.tail = None
        self.current = None          # node currently playing
        self._index = {}             # song_id -> _PlaylistNode
        self.repeat = False

    # required operations 

    def addSong(self, song):
        # Append a song to the end. Returns False if it is already present.
        if song.id in self._index:
            return False
        node = _PlaylistNode(song)
        if self.tail is None:                  # empty list
            self.head = self.tail = node
            self.current = node
        else:
            node.prev = self.tail
            self.tail.next = node
            self.tail = node
        self._index[song.id] = node
        return True

    def removeSong(self, songId):
        # Unlink a song by ID. Returns False if not found.
        node = self._index.pop(songId, None)
        if node is None:
            return False

        # If we're removing the song being played, move the cursor.
        if node is self.current:
            self.current = node.next or node.prev

        if node.prev:
            node.prev.next = node.next
        else:
            self.head = node.next
        if node.next:
            node.next.prev = node.prev
        else:
            self.tail = node.prev

        node.prev = node.next = None
        return True

    def next(self):
        """Advance. With repeat on, wrap from last to first; otherwise return 'end'."""
        if self.current is None:
            return None
        if self.current.next is not None:
            self.current = self.current.next
            return self.current.song
        if self.repeat:
            self.current = self.head
            return self.current.song
        return "end"                           # stay on the last song

    def previous(self):
        """Go back. With repeat on, wrap from first to last; otherwise return 'start'."""
        if self.current is None:
            return None
        if self.current.prev is not None:
            self.current = self.current.prev
            return self.current.song
        if self.repeat:
            self.current = self.tail
            return self.current.song
        return "start"

    def toggleRepeat(self):
        self.repeat = not self.repeat
        return self.repeat

    # ---- helpers -------------------------------------------------------

    def currentSong(self):
        return self.current.song if self.current else None

    def contains(self, songId):
        return songId in self._index

    def __len__(self):
        return len(self._index)

    def __iter__(self):
        node = self.head
        while node:
            yield node.song
            node = node.next


# ===========================================================================
# MILESTONE 2 — Up Next (Queue) and History (Stack)
# ===========================================================================

class Player:
    """
    Wraps a Playlist with an Up Next queue and a play History stack.

    - Up Next is FIFO: songs queued earlier play earlier.
    - History is LIFO with a cap of 10; when full, the OLDEST entry is
      dropped (so a bounded deque is used as the stack).
    - Playing from Up Next or History never moves the playlist cursor.
    """

    HISTORY_LIMIT = 10

    def __init__(self, playlist, library=None):
        self.playlist = playlist
        self.library = library or {}            # song_id -> Song (for queue lookups)
        self.upNext = deque()                    # queue
        self.history = deque(maxlen=self.HISTORY_LIMIT)  # stack; left = oldest
        self.nowPlaying = None

    # ---- required operations ------------------------------------------

    def addToUpNext(self, songId):
        """Queue a song by ID. Looks it up in the playlist first, then the library."""
        song = self._lookup(songId)
        if song is None:
            return False
        self.upNext.append(song)
        return True

    def playNext(self):
        """
        Play the next song.  Up Next has priority; if it is empty, advance the
        playlist.  The song that was playing goes onto history.
        """
        if self.upNext:
            song = self.upNext.popleft()        # does NOT touch playlist cursor
        else:
            result = self.playlist.next()
            if result == "end" or result is None:
                return result
            song = result
        self._play(song)
        return song

    def back(self):
        """Replay the most recent history entry and remove it from history."""
        if not self.history:
            return None
        song = self.history.pop()               # top of stack
        self.nowPlaying = song                  # replay without re-recording
        return song

    # ---- helpers -------------------------------------------------------

    def _play(self, song):
        if self.nowPlaying is not None:
            self.history.append(self.nowPlaying)   # deque drops oldest if full
        self.nowPlaying = song

    def _lookup(self, songId):
        node = self.playlist._index.get(songId)
        if node:
            return node.song
        return self.library.get(songId)

    def startPlaylist(self):
        """Begin playback at the playlist's current position."""
        song = self.playlist.currentSong()
        if song:
            self._play(song)
        return song


# ===========================================================================
# MILESTONE 3 — Song Search (BST) and Related Artists (Graph)
# ===========================================================================

class _BSTNode:
    __slots__ = ("key", "songs", "left", "right")

    def __init__(self, key, song):
        self.key = key          # lower-cased title for case-insensitive ordering
        self.songs = [song]     # same title by different artists -> same node
        self.left = None
        self.right = None


class SongSearchTree:
    """Binary search tree keyed by song title (case-insensitive)."""

    def __init__(self):
        self.root = None

    # ---- required operations (issue #13 names) -------------------------

    def addSong(self, title, songId):
        """Add a song to the BST, keyed by title."""
        self.insert(Song(songId, title, None))

    def findSong(self, title):
        """Exact title lookup in O(h). Returns the songId, or None if absent."""
        key = title.lower()
        node = self.root
        while node:
            if key == node.key:
                return node.songs[0].id
            node = node.left if key < node.key else node.right
        return None

    # ---- internal --------------------------------------------------------

    def insert(self, song):
        key = song.title.lower()
        if self.root is None:
            self.root = _BSTNode(key, song)
            return
        node = self.root
        while True:
            if key == node.key:
                node.songs.append(song)
                return
            if key < node.key:
                if node.left is None:
                    node.left = _BSTNode(key, song)
                    return
                node = node.left
            else:
                if node.right is None:
                    node.right = _BSTNode(key, song)
                    return
                node = node.right

    def prefixSearch(self, prefix):
        """
        Return all titles starting with `prefix`, alphabetically.

        Pruning: at a node whose key is < prefix, nothing in its LEFT subtree
        can match (all smaller still).  At a node whose key does not start
        with prefix and is > prefix, nothing in its RIGHT subtree can match.
        """
        p = prefix.lower()
        out = []
        self._prefix(self.root, p, out)
        return out

    def _prefix(self, node, p, out):
        if node is None:
            return
        if node.key < p:
            # whole left subtree is smaller than prefix -> cannot match
            self._prefix(node.right, p, out)
        elif node.key.startswith(p):
            # in-order so results come out sorted
            self._prefix(node.left, p, out)
            out.extend(s.title for s in node.songs)
            self._prefix(node.right, p, out)
        else:
            # node.key > p and doesn't match -> right subtree is larger still
            self._prefix(node.left, p, out)

    def removeSong(self, title, songId):
        """Remove one song (by title + id). Deletes the BST node if it becomes empty."""
        key = title.lower()
        node = self.root
        while node and node.key != key:
            node = node.left if key < node.key else node.right
        if node is None:
            return False
        before = len(node.songs)
        node.songs = [s for s in node.songs if s.id != songId]
        if len(node.songs) == before:
            return False
        if not node.songs:
            self.root = self._delete(self.root, key)
        return True

    def _delete(self, node, key):
        if node is None:
            return None
        if key < node.key:
            node.left = self._delete(node.left, key)
        elif key > node.key:
            node.right = self._delete(node.right, key)
        else:
            if node.left is None:
                return node.right
            if node.right is None:
                return node.left
            succ = node.right                      # in-order successor
            while succ.left:
                succ = succ.left
            node.key, node.songs = succ.key, succ.songs
            node.right = self._delete(node.right, succ.key)
        return node

    def findSongs(self, title):
        """All songs with this exact title (different artists can share a title)."""
        key = title.lower()
        node = self.root
        while node:
            if key == node.key:
                return list(node.songs)
            node = node.left if key < node.key else node.right
        return []

    def prefixSearchSongs(self, prefix):
        """Like prefixSearch, but returns Song objects (for the interactive app)."""
        p = prefix.lower()
        out = []

        def walk(node):
            if node is None:
                return
            if node.key < p:
                walk(node.right)
            elif node.key.startswith(p):
                walk(node.left)
                out.extend(node.songs)
                walk(node.right)
            else:
                walk(node.left)
        walk(self.root)
        return out

    def inOrder(self):
        out = []

        def walk(n):
            if n:
                walk(n.left)
                out.extend(s.title for s in n.songs)
                walk(n.right)
        walk(self.root)
        return out


class ArtistGraph:
    """Undirected graph of 'related artist' links (adjacency sets)."""

    def __init__(self):
        self.adj = {}

    def addArtist(self, name):
        self.adj.setdefault(name, set())

    def addRelation(self, a, b):
        if a == b:
            return
        self.addArtist(a)
        self.addArtist(b)
        self.adj[a].add(b)
        self.adj[b].add(a)

    def recommendArtists(self, artist):
        """
        Artists exactly two links away that are NOT directly related to
        `artist` (and are not `artist` itself), sorted alphabetically.
        """
        if artist not in self.adj:
            return []
        direct = self.adj[artist]
        two_away = set()
        for friend in direct:
            for candidate in self.adj[friend]:
                if candidate != artist and candidate not in direct:
                    two_away.add(candidate)
        return sorted(two_away)


# ===========================================================================
# Demo + self-tests
# ===========================================================================

def _demo():
    print("=" * 60)
    print("MILESTONE 1 — Playlist")
    print("=" * 60)
    songs = [
        Song(1, "Blinding Lights", "The Weeknd"),
        Song(2, "Bad Guy", "Billie Eilish"),
        Song(3, "Levitating", "Dua Lipa"),
        Song(4, "Shape of You", "Ed Sheeran"),
    ]
    pl = Playlist()
    for s in songs:
        pl.addSong(s)
    assert pl.addSong(Song(2, "Bad Guy", "Billie Eilish")) is False, "duplicate must be rejected"
    print("Playlist:", [s.title for s in pl])
    print("current :", pl.currentSong().title)

    print("next    :", pl.next().title)
    print("next    :", pl.next().title)
    print("next    :", pl.next().title)
    r = pl.next()
    print("next    :", r, "(repeat off -> stays on last)")
    assert r == "end" and pl.currentSong().id == 4

    pl.toggleRepeat()
    r = pl.next()
    print("next    :", r.title, "(repeat on -> wrapped)")
    assert r.id == 1
    print("previous:", pl.previous().title, "(repeat on -> wrapped backwards)")
    pl.toggleRepeat()

    pl.removeSong(4)                     # remove current song
    print("removed 4, current now:", pl.currentSong().title)
    assert pl.currentSong().id == 3
    assert pl.removeSong(99) is False
    print("Playlist:", [s.title for s in pl], "| len =", len(pl))

    print()
    print("=" * 60)
    print("MILESTONE 2 — Up Next & History")
    print("=" * 60)
    pl = Playlist()
    for s in songs:
        pl.addSong(s)
    library = {
        10: Song(10, "Starboy", "The Weeknd"),
        11: Song(11, "Happier Than Ever", "Billie Eilish"),
    }
    player = Player(pl, library)
    print("start   :", player.startPlaylist().title)
    player.addToUpNext(10)
    player.addToUpNext(11)
    assert player.addToUpNext(999) is False

    s = player.playNext()
    print("playNext:", s.title, "(from Up Next)")
    assert s.id == 10 and pl.currentSong().id == 1, "queue must not move playlist cursor"
    s = player.playNext()
    print("playNext:", s.title, "(from Up Next)")
    s = player.playNext()
    print("playNext:", s.title, "(queue empty -> playlist advances)")
    assert s.id == 2
    print("history :", [h.title for h in player.history])

    b = player.back()
    print("back    :", b.title, "| history now:", [h.title for h in player.history])
    assert b.id == 11 and len(player.history) == 2

    # history cap: play 15 songs, ensure only last 10 kept
    p2 = Player(Playlist(), {i: Song(i, f"T{i}", "A") for i in range(100, 116)})
    for i in range(100, 116):
        p2.addToUpNext(i)
    for _ in range(16):
        p2.playNext()
    hist_ids = [h.id for h in p2.history]
    print("history cap test:", hist_ids)
    assert hist_ids == list(range(105, 115)), "history must keep only last 10, oldest dropped"

    print()
    print("=" * 60)
    print("MILESTONE 3 — Search & Related Artists")
    print("=" * 60)
    tree = SongSearchTree()
    for s in songs + list(library.values()) + [
        Song(20, "Shivers", "Ed Sheeran"),
        Song(21, "Save Your Tears", "The Weeknd"),
        Song(22, "Break My Heart", "Dua Lipa"),
    ]:
        tree.insert(s)
    print("in-order      :", tree.inOrder())
    print("prefix 'S'    :", tree.prefixSearch("S"))
    print("prefix 'sha'  :", tree.prefixSearch("sha"))
    print("prefix 'b'    :", tree.prefixSearch("b"))
    print("prefix 'zzz'  :", tree.prefixSearch("zzz"))
    assert tree.prefixSearch("S") == ["Save Your Tears", "Shape of You", "Shivers", "Starboy"]
    assert tree.prefixSearch("b") == ["Bad Guy", "Blinding Lights", "Break My Heart"]
    assert tree.prefixSearch("zzz") == []

    tree.addSong("Anti-Hero", 30)
    print("findSong('Anti-Hero') :", tree.findSong("Anti-Hero"))
    print("findSong('Shivers')   :", tree.findSong("Shivers"))
    print("findSong('Missing')   :", tree.findSong("Missing"))
    assert tree.findSong("Anti-Hero") == 30
    assert tree.findSong("Shivers") == 20
    assert tree.findSong("Missing") is None

    g = ArtistGraph()
    g.addRelation("The Weeknd", "Dua Lipa")
    g.addRelation("The Weeknd", "Billie Eilish")
    g.addRelation("Dua Lipa", "Ed Sheeran")
    g.addRelation("Dua Lipa", "Harry Styles")
    g.addRelation("Billie Eilish", "Finneas")
    g.addRelation("Billie Eilish", "Ed Sheeran")
    g.addRelation("Ed Sheeran", "Taylor Swift")
    g.addArtist("Lorde")                                 # isolated node

    rec = g.recommendArtists("The Weeknd")
    print("recommend(The Weeknd):", rec)
    assert rec == ["Ed Sheeran", "Finneas", "Harry Styles"]
    rec = g.recommendArtists("Ed Sheeran")
    print("recommend(Ed Sheeran):", rec)
    assert rec == ["Finneas", "Harry Styles", "The Weeknd"]
    assert g.recommendArtists("Lorde") == []
    assert g.recommendArtists("Nobody") == []

    print()
    print("All checks passed.")


class TuneWave:
    """One object that keeps the playlist, player, search tree and artist graph in sync."""

    def __init__(self):
        self.library = {}                 # song_id -> Song
        self.playlist = Playlist()
        self.player = Player(self.playlist, self.library)
        self.search = SongSearchTree()
        self.artists = ArtistGraph()
        self._next_id = 1

    def add_song(self, title, artist):
        title, artist = title.strip(), artist.strip()
        if not title or not artist:
            return None, "Title and artist are both required."
        for s in self.search.findSongs(title):
            if s.artist.lower() == artist.lower():
                return None, f"'{s.title}' by {s.artist} is already in the library (ID {s.id})."
        song = Song(self._next_id, title, artist)
        self._next_id += 1
        self.library[song.id] = song
        self.playlist.addSong(song)
        self.search.insert(song)
        self.artists.addArtist(artist)
        return song, None

    def remove_song(self, song):
        self.playlist.removeSong(song.id)
        self.search.removeSong(song.title, song.id)
        self.library.pop(song.id, None)
        self.player.upNext = deque(s for s in self.player.upNext if s.id != song.id)
        kept = [s for s in self.player.history if s.id != song.id]
        self.player.history = deque(kept, maxlen=Player.HISTORY_LIMIT)
        if self.player.nowPlaying and self.player.nowPlaying.id == song.id:
            self.player.nowPlaying = None

    def load_file(self, path):
        added, skipped = 0, []
        with open(path, encoding="utf-8") as f:
            for n, line in enumerate(f, 1):
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "|" in line:
                    title, _, artist = line.partition("|")
                elif " - " in line:
                    title, _, artist = line.rpartition(" - ")
                else:
                    skipped.append(f"line {n}: no '|' or ' - ' separator")
                    continue
                song, err = self.add_song(title, artist)
                if song:
                    added += 1
                else:
                    skipped.append(f"line {n}: {err}")
        return added, skipped

    def load_sample(self):
        sample = [
            ("Blinding Lights", "The Weeknd"), ("Starboy", "The Weeknd"),
            ("Save Your Tears", "The Weeknd"), ("Bad Guy", "Billie Eilish"),
            ("Happier Than Ever", "Billie Eilish"), ("Levitating", "Dua Lipa"),
            ("Break My Heart", "Dua Lipa"), ("Shape of You", "Ed Sheeran"),
            ("Shivers", "Ed Sheeran"), ("Perfect", "Ed Sheeran"),
            ("As It Was", "Harry Styles"), ("Anti-Hero", "Taylor Swift"),
            ("Pasoori", "Ali Sethi"), ("Kahani Suno", "Kaifi Khalil"),
        ]
        added = sum(1 for t, a in sample if self.add_song(t, a)[0])
        for a, b in [("The Weeknd", "Dua Lipa"), ("The Weeknd", "Billie Eilish"),
                     ("Dua Lipa", "Ed Sheeran"), ("Dua Lipa", "Harry Styles"),
                     ("Billie Eilish", "Ed Sheeran"), ("Ed Sheeran", "Taylor Swift"),
                     ("Ali Sethi", "Kaifi Khalil")]:
            self.artists.addRelation(a, b)
        return added

    def resolve(self, text):
        text = text.strip()
        if not text:
            return []
        if text.isdigit() and int(text) in self.library:
            return [self.library[int(text)]]
        exact = self.search.findSongs(text)
        if exact:
            return exact
        return self.search.prefixSearchSongs(text)

def _fmt(song):
    return f"[{song.id}] {song.title} - {song.artist}"


def _ask(prompt):
    try:
        return input(prompt)
    except EOFError:
        return ""


def _pick(app, prompt="Song (ID, title, or start of title): "):
    """Ask for a song and let the user choose if several match."""
    matches = app.resolve(_ask(prompt))
    if not matches:
        print("  No song found.")
        return None
    if len(matches) == 1:
        return matches[0]
    print("  Several songs match:")
    for i, s in enumerate(matches, 1):
        print(f"    {i}. {_fmt(s)}")
    choice = _ask("  Choose a number: ").strip()
    if choice.isdigit() and 1 <= int(choice) <= len(matches):
        return matches[int(choice) - 1]
    print("  Cancelled.")
    return None


MENU = """
 ---------------- Library ----------------
  1. Add a song             2. Load songs from file
  3. Remove a song          4. Show playlist
 ---------------- Playback ---------------
  5. Play / Next            6. Previous
  7. Repeat on/off          8. Add to Up Next
  9. Back (history)        10. Show Up Next & History
 ---------------- Search & Artists -------
 11. Search by title       12. Find exact title
 13. Link two artists      14. Recommend artists
 15. Show artist links
 ---------------- Other ------------------
 16. Run self-tests         0. Exit
"""


def run_cli():
    app = TuneWave()
    print("=" * 46)
    print("        TuneWave Music Player")
    print("=" * 46)
    if _ask("Load sample songs to start? (y/n): ").strip().lower().startswith("y"):
        print(f"  Loaded {app.load_sample()} sample songs.")

    while True:
        now = app.player.nowPlaying
        print("\n" + "=" * 46)
        print(f" Now playing : {_fmt(now) if now else '-'}")
        print(f" Songs: {len(app.library)}  |  Repeat: {'ON' if app.playlist.repeat else 'OFF'}"
              f"  |  Up Next: {len(app.player.upNext)}  |  History: {len(app.player.history)}")
        print(MENU)
        choice = _ask("Choose an option: ").strip()
        print()

        if choice == "1":
            title = _ask("Song title : ")
            artist = _ask("Artist     : ")
            song, err = app.add_song(title, artist)
            if not song:
                print("  " + err)
                continue
            print(f"  Added {_fmt(song)}")
            related = _ask("Related artists (comma separated, Enter to skip): ")
            for other in [r.strip() for r in related.split(",") if r.strip()]:
                app.artists.addRelation(song.artist, other)
                print(f"  Linked {song.artist} <-> {other}")

        elif choice == "2":
            path = _ask("File path (each line 'Title | Artist'): ").strip().strip('"')
            try:
                added, skipped = app.load_file(path)
                print(f"  Added {added} songs.")
                for s in skipped:
                    print("  Skipped " + s)
            except OSError as e:
                print(f"  Could not open file: {e}")

        elif choice == "3":
            song = _pick(app)
            if song:
                app.remove_song(song)
                print(f"  Removed {_fmt(song)}")

        elif choice == "4":
            if not len(app.playlist):
                print("  Playlist is empty. Add songs with option 1 or 2.")
            cur = app.playlist.current
            for i, s in enumerate(app.playlist, 1):
                mark = " <- current" if cur and s is cur.song else ""
                print(f"  {i:>2}. {_fmt(s)}{mark}")

        elif choice == "5":
            if not len(app.playlist) and not app.player.upNext:
                print("  Nothing to play. Add songs first.")
            elif app.player.nowPlaying is None and not app.player.upNext:
                print(f"  Playing {_fmt(app.player.startPlaylist())}")
            else:
                r = app.player.playNext()
                if r == "end":
                    print("  End of playlist. Turn repeat on (option 7) to loop.")
                elif r:
                    print(f"  Playing {_fmt(r)}")

        elif choice == "6":
            r = app.playlist.previous()
            if r == "start":
                print("  Already at the first song.")
            elif r:
                app.player._play(r)
                print(f"  Playing {_fmt(r)}")
            else:
                print("  Playlist is empty.")

        elif choice == "7":
            print(f"  Repeat is now {'ON' if app.playlist.toggleRepeat() else 'OFF'}.")

        elif choice == "8":
            song = _pick(app)
            if song and app.player.addToUpNext(song.id):
                print(f"  Queued {_fmt(song)}")

        elif choice == "9":
            r = app.player.back()
            print(f"  Replaying {_fmt(r)}" if r else "  History is empty.")

        elif choice == "10":
            print("  Up Next (plays first -> last):")
            for s in app.player.upNext:
                print("    " + _fmt(s))
            if not app.player.upNext:
                print("    (empty)")
            print("  History (most recent first):")
            for s in reversed(app.player.history):
                print("    " + _fmt(s))
            if not app.player.history:
                print("    (empty)")

        elif choice == "11":
            prefix = _ask("Title starts with: ").strip()
            results = app.search.prefixSearchSongs(prefix) if prefix else []
            print(f"  {len(results)} result(s):")
            for s in results:
                print("    " + _fmt(s))

        elif choice == "12":
            title = _ask("Exact title: ").strip()
            songs = app.search.findSongs(title)
            if songs:
                for s in songs:
                    print(f"  Found {_fmt(s)}")
            else:
                print("  Not found. Try option 11 to search by the start of a title.")

        elif choice == "13":
            a = _ask("Artist A: ").strip()
            b = _ask("Artist B: ").strip()
            if a and b and a.lower() != b.lower():
                app.artists.addRelation(a, b)
                print(f"  Linked {a} <-> {b}")
            else:
                print("  Enter two different artist names.")

        elif choice == "14":
            name = _ask("Artist: ").strip()
            match = next((x for x in app.artists.adj if x.lower() == name.lower()), None)
            if not match:
                print("  Unknown artist.")
                continue
            recs = app.artists.recommendArtists(match)
            print(f"  Directly related: {', '.join(sorted(app.artists.adj[match])) or '-'}")
            print(f"  Recommended     : {', '.join(recs) or 'none yet (link more artists)'}")

        elif choice == "15":
            if not app.artists.adj:
                print("  No artists yet.")
            for name in sorted(app.artists.adj):
                print(f"  {name}: {', '.join(sorted(app.artists.adj[name])) or '-'}")

        elif choice == "16":
            _demo()

        elif choice == "0":
            print("Goodbye!")
            break

        else:
            print("  Please enter a number from the menu.")


if __name__ == "__main__":
    run_cli()