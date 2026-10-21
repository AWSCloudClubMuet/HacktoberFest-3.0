
class TuneWave {
  constructor() {
    this.head = null;
    this.tail = null;
    this.current = null;
    this.songsById = new Map();
    this.repeat = false;
    this.upNext = [];
    this.history = [];
    this.searchRoot = null;
    this.artistGraph = new Map();
  }

  // MILESTONE 1: Playlist using a doubly linked list
  addSong(song) {
    if (!song?.id || !song?.title || !song?.artist) {
      throw new Error("Song needs id, title and artist.");
    }
    if (this.songsById.has(song.id)) {
      throw new Error("Song ID already exists: " + song.id);
    }

    const node = { song: { ...song }, prev: this.tail, next: null };

    if (this.tail) this.tail.next = node;
    else this.head = node;

    this.tail = node;
    this.songsById.set(song.id, node);
    this._insertTitle(song.title, song.id);
    this._addArtist(song.artist);

    if (!this.current) this.current = node;
    return node.song;
  }

  removeSong(songId) {
    const node = this.songsById.get(songId);
    if (!node) return false;

    if (node.prev) node.prev.next = node.next;
    else this.head = node.next;

    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev;

    if (this.current === node) {
      this.current = node.next || node.prev || null;
    }

    this.songsById.delete(songId);
    this._removeTitle(node.song.title, songId);
    this.upNext = this.upNext.filter(id => id !== songId);
    return true;
  }

  next() {
  if (!this.current) return "empty";

  if (this.current.next) {
    this.current = this.current.next;
    return this.current.song;
  }

  if (this.repeat && this.head) {
    this.current = this.head;
    return this.current.song;
  }

  return "end";
}
  
playNext() {
  let song;

  if (this.upNext.length > 0) {
    const id = this.upNext.shift();
    const node = this.songsById.get(id);

    if (!node) return this.playNext();

    song = node.song;
    // Queued songs do not move the playlist position.
  } else {
    const result = this.next();

    if (result === "end" || result === "empty") {
      return result;
    }

    song = result;
  }

  this._recordHistory(song);
  return song;
}


  previous() {
    if (!this.current) return "empty";

    if (this.current.prev) {
      this.current = this.current.prev;
      return this.current.song;
    }

    if (this.repeat && this.tail) {
      this.current = this.tail;
      return this.current.song;
    }

    return "start";
  }

  toggleRepeat() {
    this.repeat = !this.repeat;
    return this.repeat;
  }

  // MILESTONE 2: Up Next queue and history stack
  
addToUpNext(songId) {
  if (!this.songsById.has(songId)) return false;

  this.upNext.push(songId);
  return true;
}


  back() {
    if (this.history.length === 0) return "history-empty";

    // Replay the most recently played song and remove it from history.
    return this.history.pop();
  }

  _recordHistory(song) {
    this.history.push({ ...song });
    if (this.history.length > 10) this.history.shift();
  }

  // MILESTONE 3: Binary search tree for song titles
  _insertTitle(title, songId) {
    const key = title.toLowerCase();

    const insert = node => {
      if (!node) {
        return {
          key,
          titles: [title],
          ids: [songId],
          left: null,
          right: null
        };
      }

      if (key < node.key) node.left = insert(node.left);
      else if (key > node.key) node.right = insert(node.right);
      else {
        node.titles.push(title);
        node.ids.push(songId);
      }

      return node;
    };

    this.searchRoot = insert(this.searchRoot);
  }

  _removeTitle(title, songId) {
    const key = title.toLowerCase();

    const remove = node => {
      if (!node) return null;

      if (key < node.key) {
        node.left = remove(node.left);
      } else if (key > node.key) {
        node.right = remove(node.right);
      } else {
        const index = node.ids.indexOf(songId);

        if (index !== -1) {
          node.ids.splice(index, 1);
          node.titles.splice(index, 1);
        }

        if (node.ids.length === 0) {
          if (!node.left) return node.right;
          if (!node.right) return node.left;

          let successor = node.right;
          while (successor.left) successor = successor.left;

          node.key = successor.key;
          node.titles = [...successor.titles];
          node.ids = [...successor.ids];

          node.right = removeWholeKey(node.right, successor.key);
        }
      }

      return node;
    };

    const removeWholeKey = (node, targetKey) => {
      if (!node) return null;

      if (targetKey < node.key) {
        node.left = removeWholeKey(node.left, targetKey);
      } else if (targetKey > node.key) {
        node.right = removeWholeKey(node.right, targetKey);
      } else {
        if (!node.left) return node.right;
        if (!node.right) return node.left;

        let successor = node.right;
        while (successor.left) successor = successor.left;

        node.key = successor.key;
        node.titles = [...successor.titles];
        node.ids = [...successor.ids];
        node.right = removeWholeKey(node.right, successor.key);
      }

      return node;
    };

    this.searchRoot = remove(this.searchRoot);
  }

  findSong(title) {
    let node = this.searchRoot;
    const key = title.toLowerCase();

    while (node) {
      if (key === node.key) {
        return node.ids
          .map(id => this.songsById.get(id)?.song)
          .filter(Boolean);
      }

      node = key < node.key ? node.left : node.right;
    }

    return [];
  }

  prefixSearch(prefix) {
    const wanted = prefix.toLowerCase();
    const matches = [];

    const visit = node => {
      if (!node) return;

      // Skip left subtree if its keys cannot match the prefix range.
      if (wanted <= node.key) visit(node.left);

      if (node.key.startsWith(wanted)) {
        node.ids.forEach(id => {
          const song = this.songsById.get(id)?.song;
          if (song) matches.push(song);
        });
      }

      if (wanted >= node.key || node.key.startsWith(wanted)) {
        visit(node.right);
      }
    };

    visit(this.searchRoot);

    return matches.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, {
        sensitivity: "base"
      })
    );
  }

  // Undirected artist relationship graph
  _addArtist(artist) {
    if (!this.artistGraph.has(artist)) {
      this.artistGraph.set(artist, new Set());
    }
  }

  connectArtists(artistA, artistB) {
    this._addArtist(artistA);
    this._addArtist(artistB);

    this.artistGraph.get(artistA).add(artistB);
    this.artistGraph.get(artistB).add(artistA);
  }

  addRelation(artistA, artistB) {
  return this.connectArtists(artistA, artistB);
}

  recommendArtists(artist) {
    const direct = this.artistGraph.get(artist);
    if (!direct) return [];

    const recommendations = new Set();

    for (const friend of direct) {
      for (const candidate of this.artistGraph.get(friend) || []) {
        // Exactly two edges away; exclude self and direct connections.
        if (candidate !== artist && !direct.has(candidate)) {
          recommendations.add(candidate);
        }
      }
    }

    return [...recommendations].sort((a, b) => a.localeCompare(b));
  }

  getPlaylist() {
    const songs = [];
    let node = this.head;

    while (node) {
      songs.push(node.song);
      node = node.next;
    }

    return songs;
  }

  getCurrentSong() {
    return this.current ? this.current.song : null;
  }
}

// DEMO: Try the required operations
const player = new TuneWave();

[
  { id: "s1", title: "Ocean Eyes", artist: "Aisha" },
  { id: "s2", title: "Golden Hour", artist: "Bilal" },
  { id: "s3", title: "Night Changes", artist: "Cyrus" },
  { id: "s4", title: "Another Day", artist: "Dina" },
  { id: "s5", title: "Open Sky", artist: "Eman" }
].forEach(song => player.addSong(song));

player.connectArtists("Aisha", "Bilal");
player.connectArtists("Bilal", "Cyrus");
player.connectArtists("Cyrus", "Dina");
player.connectArtists("Dina", "Eman");
player.connectArtists("Aisha", "Eman");

console.log("\n=== TuneWave Music Player ===");
console.log("Playlist:", player.getPlaylist().map(s => s.title));
console.log("Current:", player.getCurrentSong()?.title);
console.log("Next:", player.next().title);
console.log("Previous:", player.previous().title);
console.log("Repeat enabled:", player.toggleRepeat());
console.log("Find song:", player.findSong("Golden Hour").map(s => s.title));
console.log("Prefix search:", player.prefixSearch("o").map(s => s.title));

player.addToUpNext("s4");
console.log("Up Next:", player.playNext().title);
console.log("Back:", player.back().title);
console.log("Recommendations:", player.recommendArtists("Aisha"));

console.log("Remove s3:", player.removeSong("s3"));
console.log("Playlist after removal:", player.getPlaylist().map(s => s.title));

if (typeof window !== "undefined") {
  window.TuneWave = TuneWave;
}