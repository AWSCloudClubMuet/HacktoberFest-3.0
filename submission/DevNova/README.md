# TuneWave Music Player

TuneWave is a JavaScript music-player data structures project implementing playlist navigation, playback queues, song search, and artist recommendations.

## Features

### Milestone 1: Playlist
- Doubly linked list for playlist navigation.
- Hash map for song lookup by ID.
- Add and remove songs.
- Next and previous navigation.
- Repeat mode.

### Milestone 2: Playback Management
- Up Next queue.
- History stack.
- Replay the previous song.
- Keep a maximum of 10 history entries.

### Milestone 3: Search and Recommendations
- Binary Search Tree (BST) for song-title lookup.
- Prefix-based song search in alphabetical order.
- Undirected graph for artist relationships.
- Recommendations based on two-link connections.

## Requirements

- Node.js 24 or a compatible modern Node.js version.

## Run the Tests

From the project directory, run:

```bash
node test.js
```

Or use:

```bash
npm test
```

## Project Structure

- `playlist.js` — playlist and navigation
- `musicPlayer.js` — Up Next and playback history
- `songSearch.js` — BST song search
- `artistGraph.js` — artist relationship graph
- `test.js` — automated tests
- `index.js` — application entry point
- `package.json` — project configuration
