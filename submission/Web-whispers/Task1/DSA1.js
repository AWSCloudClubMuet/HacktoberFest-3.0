// Milestone 1 Playlist (Doubly Linked List + Hash Map)


class Node {
  constructor(song) {
    this.song = song; 
    this.prev = null;
    this.next = null;
  }
}

class Playlist {
  constructor() {
    this.head = null;
    this.tail = null;
    this.current = null; // node that is currently playing
    this.repeat = false;
    this.map = new Map(); // songId is Node
  }

  // Add to the end and  reject duplicates. O(1)
  addSong(song) {
    if (this.map.has(song.id)) return false;

    const node = new Node(song);
    if (this.tail === null) {
    
      this.head = this.tail = this.current = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
    this.map.set(song.id, node);
    return true;
  }

  // Remove using the hash map. O(1)
  removeSong(songId) {
    const node = this.map.get(songId);
    if (!node) return false;
    this.map.delete(songId);

    // unlink the node
    if (node.prev) node.prev.next = node.next;
    else this.head = node.next;

    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev;

    // if the playing song was removed then  move to a neighbour
    if (this.current === node) {
      this.current = node.next || node.prev; // null if list is now empty
    }
    return true;
  }

  next() {
    if (this.current === null) return null;

    if (this.current.next) {
      this.current = this.current.next;
    } else if (this.repeat) {
      this.current = this.head; // wrap to first
    } else {
      return "end"; // stay on the last song
    }
    return this.current.song;
  }

  previous() {
    if (this.current === null) return null;

    if (this.current.prev) {
      this.current = this.current.prev;
    } else if (this.repeat) {
      this.current = this.tail; // wrap to last
    }
    // otherwise stay on the first song
    return this.current.song;
  }

  toggleRepeat() {
    this.repeat = !this.repeat;
    return this.repeat;
  }
}

// Check test (runs only with node dsa1.js)
if (require.main === module) {
const p = new Playlist();
for (let i = 1; i <= 3; i++) p.addSong({ id: `s${i}`, title: `Song ${i}` });

console.log(p.addSong({ id: "s1", title: "Dup" })); // false (duplicate)
p.next();
p.next(); // now on Song 3
console.log(p.next()); // "end" repeat off
p.toggleRepeat();
console.log(p.next()); // Song 1 wrapped
p.removeSong("s1"); // removing current to moves to Song 2
console.log(p.current.song); // Song 2
}

module.exports = { Playlist, Node };