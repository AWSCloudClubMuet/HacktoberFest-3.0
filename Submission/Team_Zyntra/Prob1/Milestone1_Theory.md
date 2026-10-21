# Milestone 1: Playlist Management — Theoretical Foundations & Architecture

## 1. Executive Summary & Problem Formulation
In high-performance music streaming platforms like **TuneWave**, playlist playback is a continuous, stateful, and dynamic operation. Users expect instant, jitter-free navigation between tracks (next, previous) while retaining the ability to add and remove songs in real time, even as a song is actively playing.

### Formal Problem Requirements
1. **Uniqueness Invariant:** A song can appear at most once in an active playlist.
2. **Instant Lookup & Verification:** Determining whether a song exists in the playlist, or locating its node for deletion, must execute in $O(1)$ time without scanning linear memory.
3. **Bidirectional Navigation:** Users must be able to advance to the next song or navigate back to the previous song in $O(1)$ time.
4. **Repeat Semantics:**
   - When `repeat == True`, calling `next()` on the terminal track wraps back to the head of the playlist.
   - When `repeat == False`, calling `next()` on the terminal track retains the playback cursor on the terminal track and returns `"end"`.
5. **Dynamic Concurrent Modification:** Adding a song or removing any arbitrary song (including head, tail, or the currently playing song) must maintain valid pointers, update the playback cursor, and preserve order in $O(1)$ time.

---

## 2. Comparative Analysis of Data Structures

To justify the chosen hybrid architecture, consider the time complexities of alternative approaches:

| Approach | `next()` / `previous()` | `addSong(song)` (at tail) | Duplicate Check | `removeSong(songId)` | Space Overhead |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dynamic Array / Python `list`** | $O(1)$ | $O(1)$ amortized | $O(N)$ linear scan | $O(N)$ shift elements | Low |
| **Singly Linked List** | $O(1)$ next, $O(N)$ prev | $O(1)$ (with tail ptr) | $O(N)$ linear scan | $O(N)$ scan to find prev | Medium |
| **Hash Map only** | N/A (unordered) | $O(1)$ | $O(1)$ | $O(1)$ | Low |
| **Doubly Linked List (DLL) alone** | $O(1)$ | $O(1)$ | $O(N)$ linear scan | $O(N)$ scan to find node | Medium |
| **Hybrid: DLL + Hash Map** | **$O(1)$** | **$O(1)$** | **$O(1)$** | **$O(1)$** | **$O(N)$** |

### Why the Hybrid (DLL + Hash Map) Architecture Wins
- An array allows $O(1)$ indexing, but deleting an item from the middle or beginning requires shifting $N-1$ elements ($O(N)$). Furthermore, duplicate checking without a hash set requires an $O(N)$ linear scan.
- A Doubly Linked List enables $O(1)$ deletion *once the node pointer is known*, and $O(1)$ step-wise bidirectional navigation. However, finding an arbitrary node by song ID in a raw linked list takes $O(N)$.
- By combining a **Doubly Linked List** with a **Hash Map** (`song_id -> Node`), we achieve:
  - $O(1)$ duplicate detection before insertion.
  - $O(1)$ node lookup for deletion.
  - $O(1)$ pointer rewiring for node removal without scanning.
  - $O(1)$ forward and backward playback navigation.

---

## 3. Structural Design & Architecture

### Architectural Diagram
```
                     +---------------------------------------+
                     |         TuneWave Playlist             |
                     |  head: SongNode("S1")                 |
                     |  tail: SongNode("S3")                 |
                     |  current: SongNode("S2")              |
                     |  repeat: False                        |
                     +---------------------------------------+
                                         |
     +-----------------------------------+-----------------------------------+
     |                                                                       |
     v                                                                       v
[ Hash Map (song_map) ]                                           [ Doubly Linked List ]
+-------+--------------------+                 +------------+     +------------+     +------------+
|  Key  |    Node Pointer    |                 | SongNode 1 |     | SongNode 2 |     | SongNode 3 |
+-------+--------------------+                 |  id: "S1"  |     |  id: "S2"  |     |  id: "S3"  |
| "S1"  | ---> &SongNode 1   |      None <---- | prev: None |<--->| prev: S1   |<--->| prev: S2   |----> None
| "S2"  | ---> &SongNode 2   |                 | next: S2   |     | next: S3   |     | next: None |
| "S3"  | ---> &SongNode 3   |                 +------------+     +------------+     +------------+
+-------+--------------------+                       ^                  ^                  ^
                                                     |                  |                  |
                                                   [head]           [current]            [tail]
```

### Component Specifications

#### A. `Song` Entity
- Encapsulates track metadata:
  - `song_id`: Unique alphanumeric identifier (e.g., `"S101"`).
  - `title`: Track title (e.g., `"Blinding Lights"`).
  - `artist`: Primary artist name (e.g., `"The Weeknd"`).
  - `duration`: Track duration in seconds or formatted string.

#### B. `SongNode`
- The atomic unit of the Doubly Linked List:
  - `song`: Reference to the `Song` instance.
  - `prev`: Pointer to the preceding `SongNode` (`None` if head).
  - `next`: Pointer to the succeeding `SongNode` (`None` if tail).

#### C. `Playlist` Manager
- Manages state invariants and navigations:
  - `head`: Pointer to the first `SongNode`.
  - `tail`: Pointer to the terminal `SongNode`.
  - `current`: Pointer to the currently playing `SongNode`.
  - `repeat`: Boolean flag indicating whether terminal playback wraps to head.
  - `song_map`: Hash map mapping `song_id -> SongNode`.
  - `size`: Integer tracking active playlist length.

---

## 4. Operation Invariants & Algorithmic Logic

### 1. `addSong(song)`
- **Preconditions:** `song` must have a valid `song_id`.
- **Steps:**
  1. Inspect `song.song_id in self.song_map`.
  2. If present, reject addition (return `False`) to enforce the uniqueness invariant.
  3. Instantiate `new_node = SongNode(song)`.
  4. If playlist is empty (`head is None`):
     - Set `head = tail = current = new_node`.
  5. Else:
     - Set `tail.next = new_node`.
     - Set `new_node.prev = tail`.
     - Set `tail = new_node`.
  6. Insert `self.song_map[song.song_id] = new_node`.
  7. Increment `size`. Return `True`.
- **Complexity:** $O(1)$ time, $O(1)$ space.

### 2. `removeSong(songId)`
- **Preconditions:** `songId` must be checked against `song_map`.
- **Steps:**
  1. Retrieve `node = self.song_map.get(songId)`.
  2. If `node is None`, return `False` (song not in playlist).
  3. Unlink `node` from Doubly Linked List:
     - **Head adjustment:** If `node == head`, set `head = head.next`. If `head` is not `None`, set `head.prev = None`.
     - **Tail adjustment:** If `node == tail`, set `tail = tail.prev`. If `tail` is not `None`, set `tail.next = None`.
     - **Internal linkage:**
       - If `node.prev` is not `None`, set `node.prev.next = node.next`.
       - If `node.next` is not `None`, set `node.next.prev = node.prev`.
  4. **Active Playback Cursor (`current`) Resolution:**
     - If `node == current`:
       - If `node.next` is not `None`, set `current = node.next` (advance to subsequent track).
       - Else if `node.prev` is not `None`, set `current = node.prev` (fall back to previous track).
       - Else (playlist is now empty), set `current = None`.
  5. Delete `songId` from `self.song_map`.
  6. Disconnect `node.prev = None` and `node.next = None` to facilitate garbage collection.
  7. Decrement `size`. Return `True`.
- **Complexity:** $O(1)$ time, $O(1)$ space.

### 3. `next()`
- **Preconditions:** Evaluates active `current` pointer and `repeat` state.
- **Steps:**
  1. If `current is None`: return `"end"` (or `None` if empty).
  2. If `current.next` is not `None`:
     - Advance `current = current.next`.
     - Return `current.song`.
  3. Else (`current` is at `tail`):
     - If `self.repeat is True`:
       - Wrap `current = self.head`.
       - Return `current.song`.
     - Else (`self.repeat is False`):
       - Maintain `current` unchanged at `tail`.
       - Return `"end"`.
- **Complexity:** $O(1)$ time, $O(1)$ space.

### 4. `previous()`
- **Preconditions:** Evaluates active `current` pointer.
- **Steps:**
  1. If `current is None`: return `None`.
  2. If `current.prev` is not `None`:
     - Rewind `current = current.prev`.
     - Return `current.song`.
  3. Else (`current` is at `head`):
     - If `self.repeat is True`:
       - Wrap `current = self.tail`.
       - Return `current.song`.
     - Else:
       - Maintain `current` at `head`.
       - Return `current.song`.
- **Complexity:** $O(1)$ time, $O(1)$ space.

### 5. `toggleRepeat()`
- **Steps:**
  1. Invert `self.repeat = not self.repeat`.
  2. Return `self.repeat`.
- **Complexity:** $O(1)$ time.

---

## 5. Formal Edge-Case Verification Matrix

| Edge Case Scenario | Initial State | Operation | Expected State & Return Value |
| :--- | :--- | :--- | :--- |
| **Empty Playlist** | `head=None`, `current=None` | `next()` | Returns `"end"` or `None`; no error thrown. |
| **Empty Playlist** | `head=None`, `current=None` | `previous()` | Returns `None`; no crash. |
| **Single Song Playlist** | `["S1"]`, `repeat=False` | `next()` | Returns `"end"`, `current` remains `S1`. |
| **Single Song Playlist** | `["S1"]`, `repeat=True` | `next()` | Wraps to `head` (`S1`), returns `S1`. |
| **Duplicate Addition** | `["S1", "S2"]` | `addSong("S1")` | Rejected (`False`), list remains `["S1", "S2"]`. |
| **Delete Head Node** | `["S1", "S2", "S3"]`, `curr=S1` | `removeSong("S1")` | `head` becomes `S2`, `current` advances to `S2`. |
| **Delete Tail Node** | `["S1", "S2", "S3"]`, `curr=S3` | `removeSong("S3")` | `tail` becomes `S2`, `current` moves to `S2`. |
| **Delete Sole Node** | `["S1"]`, `curr=S1` | `removeSong("S1")` | `head=tail=current=None`, `size=0`, `map` empty. |
| **Delete Non-Existent Song** | `["S1", "S2"]` | `removeSong("S99")`| Returns `False`, list state unmodified. |
| **Continuous Repeat Cycle**| `["S1", "S2"]`, `repeat=True` | `next()` $\times 4$ | Cycles: `S1 -> S2 -> S1 -> S2 -> S1`. |

---

## 6. Algorithmic Complexity Summary

$$\begin{array}{|l|c|c|l|}
\hline
\textbf{Operation} & \textbf{Time Complexity} & \textbf{Space Complexity} & \textbf{Justification} \\
\hline
\text{addSong} & O(1) & O(1) & \text{Hash table check } O(1) + \text{DLL tail pointer append } O(1) \\
\text{removeSong} & O(1) & O(1) & \text{Hash table lookup } O(1) + \text{DLL bidirectional unlink } O(1) \\
\text{next} & O(1) & O(1) & \text{Pointer dereference } (\text{next or wrap to head}) \\
\text{previous} & O(1) & O(1) & \text{Pointer dereference } (\text{prev or wrap to tail}) \\
\text{toggleRepeat} & O(1) & O(1) & \text{Atomic boolean negation} \\
\hline
\end{array}$$

This hybrid structure guarantees hard real-time $O(1)$ performance guarantees demanded by modern consumer audio applications.
