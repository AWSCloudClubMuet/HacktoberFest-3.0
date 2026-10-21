"""Save/load the library as JSON. Only song data, the ID counter and artist
relations are saved; linked-list pointers, BST and the playlist are rebuilt/not saved."""
import json
import os
from typing import List, Tuple
from models.song import Song
from music.library_manager import LibraryManager


class StorageError(Exception):
    """The file exists but cannot be understood. It is NOT overwritten."""


def save_library(library: LibraryManager, path: str, playlist_ids: List[int] = None) -> None:
    """playlist_ids = song ids in playlist order (just ids, never linked-list pointers)."""
    data = {"version": 1, "next_id": library.next_id,
            "songs": [s.to_dict() for s in library.all_songs()],
            "relations": [list(e) for e in library.graph.edges()],
            "playlist": list(playlist_ids or [])}
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:     # write to temp, then swap in
        json.dump(data, f, indent=2)
    os.replace(tmp, path)


def load_library(path: str) -> Tuple[LibraryManager, List[str]]:
    """Return (library, warnings). Missing file -> empty library."""
    library, warnings = LibraryManager(), []
    if not os.path.exists(path):
        return library, warnings
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            raise ValueError("top level must be an object")
    except (OSError, ValueError) as err:
        raise StorageError(f"Cannot read {path}: {err}") from err
    songs, seen = [], set()
    for record in data.get("songs", []):
        try:
            song = Song.from_dict(record)
        except ValueError as err:
            warnings.append(f"Skipped bad song record: {err}")
            continue
        if song.id in seen:
            warnings.append(f"Skipped duplicate song id {song.id}")
            continue
        seen.add(song.id)
        songs.append(song)
    relations = [(r[0], r[1]) for r in data.get("relations", [])
                 if isinstance(r, list) and len(r) == 2]
    next_id = data.get("next_id", 1)
    library.restore(songs, next_id if isinstance(next_id, int) else 1, relations)
    return library, warnings


def read_playlist_ids(path: str) -> List[int]:
    """Saved playlist order (ids only). Returns [] if the file is missing or has no playlist."""
    try:
        with open(path, encoding="utf-8") as f:
            ids = json.load(f).get("playlist", [])
    except (OSError, ValueError, AttributeError):
        return []
    return [i for i in ids if isinstance(i, int)]
