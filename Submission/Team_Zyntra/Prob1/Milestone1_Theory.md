# Milestone 1: Playlist (Doubly Linked List + Hash Map)
**Team Zyntra | TuneWave Music Player**

---

## 1. Problem Overview
For Milestone 1, we needed to build the playlist core for TuneWave. The playlist has to support moving forward (`next`) and backward (`previous`), while letting users add and remove songs whenever they want—even while a song is playing.

The two main rules we had to follow:
1. **No duplicate songs:** A song can only appear once in the playlist. We have to use a hash map from `songId` to node to check this in $O(1)$ without doing a linear scan.
2. **Repeat behavior:** 
   - When repeat is **ON**, calling `next()` on the last song wraps back around to the first song.
   - When repeat is **OFF**, calling `next()` on the last song stays on that last song and returns `"end"`.

---

## 2. Why Doubly Linked List + Hash Map?

When planning this out, we looked at a few different data structures:

- **Regular Python List / Array:** 
  Indexing is fast, but `list.remove()` takes $O(n)$ time because it has to search the list and shift all subsequent items left. Checking if a song exists with `if song in list` also takes $O(n)$ scans.
- **Singly Linked List:**
  Adding to the end is $O(1)$ (with a tail pointer) and `next()` is $O(1)$, but moving backwards with `previous()` is impossible in $O(1)$ because nodes don't point backward. You'd have to scan all the way from `head` each time ($O(n)$).
- **Our Choice: Doubly Linked List (DLL) + Hash Map (`dict`):**
  - The DLL gives us $O(1)$ bidirectional movement (`node.next` and `node.prev`).
  - The hash map (`self.song_map`) maps each `song_id` to its corresponding `SongNode` in memory. This gives us instant $O(1)$ duplicate checks and instant node lookup when someone calls `removeSong(songId)`.
  - Once we have the node reference from the dict, unlinking it from the DLL is just rewiring `prev.next` and `next.prev` in $O(1)$ time.

### Quick Mental Model:
```
           [ song_map: {"S1": Node1, "S2": Node2, "S3": Node3} ]
                                   |
                                   v
  None <--- [SongNode 1] <-------> [SongNode 2] <-------> [SongNode 3] ---> None
                 ^                      ^                      ^
                 |                      |                      |
               head                  current                  tail
```

---

## 3. How the Operations Work

### `addSong(song)`
- First, check `if song.song_id in self.song_map`. If it exists, we return `False` immediately (preventing duplicates in $O(1)$).
- Create a new `SongNode(song)`.
- If the playlist is empty, `head`, `tail`, and `current` all point to the new node.
- Otherwise, link `self.tail.next = new_node`, `new_node.prev = self.tail`, and move `self.tail = new_node`.
- Store `self.song_map[song.song_id] = new_node`.
- Time Complexity: **$O(1)$**.

### `removeSong(songId)`
- Look up `node = self.song_map.get(songId)`. If it's not found, return `False`.
- **Handling currently playing track:** If `node == self.current`, we have to reassign `current` so playback doesn't point to a deleted node. We shift `current` to `node.next` if available; if not, fall back to `node.prev`; if it was the only song, set `current = None`.
- **Unlinking:**
  - If it's the `head`, move `head = head.next` and set its `prev = None`.
  - If it's the `tail`, move `tail = tail.prev` and set its `next = None`.
  - For middle nodes, wire `node.prev.next = node.next` and `node.next.prev = node.prev`.
- Delete `songId` from `self.song_map`.
- Time Complexity: **$O(1)$**.

### `next()`
- If playlist is empty (`current is None`), return `"end"`.
- If `current.next` exists: move `current = current.next` and return that song.
- If we're at the last song (`current.next is None`):
  - If `repeat == True`: wrap around to `current = self.head` and return `current.song`.
  - If `repeat == False`: stay right on the last song and return `"end"`.
- Time Complexity: **$O(1)$**.

### `previous()`
- If playlist is empty, return `None`.
- If `current.prev` exists: move `current = current.prev` and return that song.
- If at `head`:
  - If `repeat == True`: wrap to `current = self.tail`.
  - If `repeat == False`: stay on `head` and return `current.song`.
- Time Complexity: **$O(1)$**.

### `toggleRepeat()`
- Flips `self.repeat = not self.repeat` and returns the new boolean value.
- Time Complexity: **$O(1)$**.

---

## 4. Edge Cases We Handled
1. **Adding duplicate song ID:** Handled via hash map lookup before creating any node. Returns `False`.
2. **Deleting the song currently playing:** If you delete the active song, `current` shifts gracefully to the next song instead of crashing or leaving a dangling pointer.
3. **Empty playlist:** Calling `next()` or `previous()` on an empty playlist returns `"end"` / `None` safely.
4. **Single-song playlist:** With repeat on, `next()` wraps back to itself. With repeat off, `next()` returns `"end"` and stays on that song.
5. **Deleting head or tail:** Head and tail pointers are updated cleanly without breaking list boundaries.

---

## 5. Complexity Summary

| Method | Time | Space | Notes |
| :--- | :---: | :---: | :--- |
| `addSong` | $O(1)$ | $O(1)$ | Dictionary lookup + tail append |
| `removeSong` | $O(1)$ | $O(1)$ | Dictionary lookup + pointer rewiring |
| `next` | $O(1)$ | $O(1)$ | Simple pointer advance or wrap to head |
| `previous` | $O(1)$ | $O(1)$ | Simple pointer rewind or wrap to tail |
| `toggleRepeat` | $O(1)$ | $O(1)$ | Simple boolean toggle |

Overall space used is $O(n)$ where $n$ is the number of songs stored in the playlist.
