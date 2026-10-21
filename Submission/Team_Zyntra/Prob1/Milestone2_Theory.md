# Milestone 2: Up Next & Play History (Queue + Stack)
**Team Zyntra | TuneWave Music Player**

---

## 1. Problem Overview
In real-world music apps like Spotify or Apple Music, listening isn't strictly linear. You often want to queue up a track to hear next without losing your place in the album or playlist you were playing. You also want to hit a `back` button to replay whatever song you just heard.

For Milestone 2, we had to implement these playback rules:
1. **Up Next priority:** Songs in the *Up Next* queue must play **before** the normal playlist continues.
2. **Playlist position invariant:** Playing from *Up Next* or from *history* **must not move the playlist position**.
3. **Bounded history:** History only holds the last **10 songs** played. When an 11th song is played, the oldest song is dropped ($O(1)$).
4. **Back button:** `back()` replays the most recent song and removes it from history, without changing the playlist position.

---

## 2. Choosing the Right Data Structures

### A. FIFO Queue for "Up Next"
- When a user adds songs to play next, they expect them to play in the exact order they added them (First-In, First-Out).
- We used a queue (`collections.deque` in Python).
  - Enqueue (`append`): $O(1)$
  - Dequeue (`popleft`): $O(1)$

### B. Bounded LIFO Stack (Max 10) for History
- When you click `back()`, you want the song you heard *most recently* (Last-In, First-Out). That's a textbook stack.
- But standard stacks can grow infinitely and eat memory. The requirement states: *"History keeps the last 10 songs played and drops the oldest."*
- Python's `collections.deque(maxlen=10)` fits this perfectly:
  - Pushing (`append`): $O(1)$. When length reaches 10, adding another song automatically drops the oldest item on the other end in $O(1)$.
  - Popping (`pop`): $O(1)$ pops from the top of the stack.

### Visual Architecture:
```
                     [ TuneWave Player ]
                              |
        +---------------------+---------------------+
        |                                           |
        v                                           v
 [ Up Next Queue ]                           [ History Stack ]
   (FIFO, deque)                               (LIFO, maxlen=10)
   
  [In] -> [Song U2] [Song U1] -> [Out]          [ Top: most recent ]
                                                        |
                                                        v
                                                   +---------+
                                                   | Song P2 |  <- popped by back()
                                                   +---------+
                                                   | Song P1 |
                                                   +---------+
                                                [ Bottom: oldest (dropped if >10) ]
```

---

## 3. How the Operations Work

### `addToUpNext(songId)`
- Takes a `songId` (or song object), resolves it from the catalog or playlist, and enqueues it to `self.up_next`.
- Time Complexity: **$O(1)$**.

### `playNext()`
- **Step 1: Check Up Next:** If `self.up_next` has songs, dequeue the front song (`popleft()`).
  - Push the currently playing song into `self.history`.
  - Set `currently_playing = song`.
  - **Important:** `self.playlist.current` does **not** move. It stays frozen on whatever playlist song was playing!
- **Step 2: Resume Playlist:** If Up Next is empty:
  - Advance the playlist using `playlist.next()`.
  - If it returns `"end"`, return `"end"`.
  - Otherwise, push previous song to `history` and play the new song.
- Time Complexity: **$O(1)$**.

### `back()`
- If `self.history` is empty, return `None`.
- Pop the top song from `self.history` (`pop()`).
- Set `currently_playing = song`.
- **Important:** The playlist position does **not** change.
- Time Complexity: **$O(1)$**.

---

## 4. Tricky Edge Cases We Handled
- **Interleaving Up Next and Playlist:** If you are playing track 2 in an album, enqueue 2 bonus tracks, and play them, the album cursor remains locked on track 2. As soon as the bonus tracks finish, `playNext()` cleanly resumes track 3.
- **Multiple `back()` calls in a row:** Each call steps back one track through history until the stack is empty.
- **History limit:** Tested playing 15 tracks in a row; verified that history length never exceeded 10, and the oldest 5 tracks were cleanly dropped.

---

## 5. Complexity Summary

| Method | Data Structure | Time | Space | Notes |
| :--- | :--- | :---: | :---: | :--- |
| `addToUpNext` | FIFO Queue (`deque`) | $O(1)$ | $O(1)$ | Fast queue push |
| `playNext` | Queue / DLL + Stack Push | $O(1)$ | $O(1)$ | Up Next takes priority; playlist cursor frozen |
| `back` | LIFO Stack (`pop`) | $O(1)$ | $O(1)$ | Rewinds last played song; cursor frozen |
| Eviction | Bounded deque (`maxlen=10`) | $O(1)$ | $O(1)$ | Automatic drop of bottom element |
