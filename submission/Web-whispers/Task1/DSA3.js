// Milestone 3 Song Search and Related Artists (BST + Graph)

class TreeNode {
  constructor(title, songId) {
    this.title = title;           // original title as the user typed it
    this.key = title.toLowerCase(); // BST key search ignores upper/lower case
    this.songId = songId;
    this.left = null;
    this.right = null;
  }
}

//  Songs stored in a BST keyed by the title
class SongSearch {
  constructor() {
    this.root = null;
  }

  // Insert a song a title that already exists is rejected
  addSong(title, songId) {
    const node = new TreeNode(title, songId);
    if (this.root === null) {
      this.root = node;
      return true;
    }
    let cur = this.root;
    while (true) {
      if (node.key === cur.key) return false; // duplicate title
      if (node.key < cur.key) {
        if (cur.left === null) { cur.left = node; return true; }
        cur = cur.left;
      } else {
        if (cur.right === null) { cur.right = node; return true; }
        cur = cur.right;
      }
    }
  }

  // Exact title lookup and  Returns the songId or null if not found
  findSong(title) {
    const key = title.toLowerCase();
    let cur = this.root;
    while (cur !== null) {
      if (key === cur.key) return cur.songId;
      cur = key < cur.key ? cur.left : cur.right;
    }
    return null;
  }

  // All titles starting with prefix in the alphabetical order
  // Subtrees that cannot contain a match are skipped
  prefixSearch(prefix) {
    const p = prefix.toLowerCase();
    const result = [];

    const visit = (node) => {
      if (node === null) return;
      const matches = node.key.startsWith(p);

      // If node.key < p (and no match) every match is bigger so skip the left subtree
      if (matches || node.key > p) visit(node.left);

      if (matches) result.push(node.title);

      // If node.key > p (and no match) every match is smaller so skip the right subtree
      if (matches || node.key < p) visit(node.right);
    };

    visit(this.root);
    return result; // inorder traversal = alphabetical
  }
}

// Artists as an undirected graph 
class ArtistGraph {
  constructor() {
    this.adj = new Map(); // artist -> Set of related artists
  }

  // Link two artists both ways (undirected)
  addRelation(artistA, artistB) {
    if (artistA === artistB) return false;
    if (!this.adj.has(artistA)) this.adj.set(artistA, new Set());
    if (!this.adj.has(artistB)) this.adj.set(artistB, new Set());
    this.adj.get(artistA).add(artistB);
    this.adj.get(artistB).add(artistA);
    return true;
  }

  // Artists exactly two links away and not already directly related
  // in alphabetical order
  recommendArtists(artist) {
    const direct = this.adj.get(artist);
    if (!direct) return [];

    const found = new Set();
    for (const friend of direct) {
      for (const other of this.adj.get(friend)) {
        if (other !== artist && !direct.has(other)) found.add(other);
      }
    }
    return [...found].sort((a, b) => a.localeCompare(b));
  }
}

// check test (runs only with node DSA3.js) 
if (require.main === module) {
  const s = new SongSearch();
  s.addSong("Shape of You", "s1");
  s.addSong("Shallow", "s2");
  s.addSong("Sunflower", "s3");
  s.addSong("Believer", "s4");
  s.addSong("Shake It Off", "s5");

  console.log(s.findSong("Shallow"));        // s2
  console.log(s.findSong("Unknown"));        // null
  console.log(s.addSong("Shallow", "x"));    // false (duplicate title)
  console.log(s.prefixSearch("Sha"));        // [ 'Shake It Off', 'Shallow', 'Shape of You' ]
  console.log(s.prefixSearch("Z"));          // []

  const g = new ArtistGraph();
  g.addRelation("A", "B");
  g.addRelation("A", "C");
  g.addRelation("B", "D");
  g.addRelation("C", "D");
  g.addRelation("C", "E");
  g.addRelation("B", "C");
  g.addRelation("E", "F");

  console.log(g.recommendArtists("A"));      // [ 'D', 'E' ]
  console.log(g.recommendArtists("B"));      // [ 'E' ]  (C is already related to B)
  console.log(g.recommendArtists("F"));      // [ 'C' ]
  console.log(g.recommendArtists("Nobody")); // []
}

module.exports = { SongSearch, ArtistGraph };