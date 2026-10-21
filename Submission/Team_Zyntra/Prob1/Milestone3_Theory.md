# Milestone 3: Song Search & Artist Recommendations (BST + Graph)
**Team Zyntra | TuneWave Music Player**

---

## 1. Problem Overview
In Milestone 3, we implemented two major features for TuneWave's discovery engine:
1. **Song Search via Binary Search Tree (BST):** Fast title lookups and prefix searching that skips subtrees that cannot match, returning titles in alphabetical order.
2. **Artist Recommendations via Undirected Graph:** Building a network of artist similarities and recommending artists who are **exactly 2 links away** and **not already directly related**, in alphabetical order.

---

## 2. Part A: Song Search using a BST

### Why a BST?
A linear list requires checking every song ($O(n)$) to find a title. A Binary Search Tree keyed by track title lets us discard half the search space at each step, giving $O(\log n)$ average search time.

### How Pruned `prefixSearch` Works
The problem explicitly states: *"prefixSearch returns matching titles in alphabetical order and skips subtrees that cannot match."*

Rather than scanning the entire tree and filtering strings with `.startswith()`, we use **subtree pruning**:

Let $P$ be our search prefix of length $L$, and $T$ be the current node's title. Let $T_L = T[:L]$ (the first $L$ letters of the node's title).

1. **Left Subtree Pruning:**
   - If $P > T_L$, then all keys in the left subtree are strictly smaller than $T$, meaning none of them can possibly begin with $P$.
   - Therefore, we **skip the left subtree completely**.
   - We only explore the left subtree if $P \le T_L$.

2. **Right Subtree Pruning:**
   - If $P < T_L$, then all keys in the right subtree are strictly greater than $T$, meaning none of them can possibly begin with $P$.
   - Therefore, we **skip the right subtree completely**.
   - We only explore the right subtree if $P \ge T_L$.

3. **Alphabetical Order for Free:**
   - In a BST, an in-order traversal (`left -> current -> right`) naturally visits elements in ascending alphabetical order.
   - By running an in-order traversal with our pruning checks, results are collected in alphabetical order without needing a separate sorting step!

### Visual of Pruning:
```
                      [ "Hotel California" ]
                             /      \
                            /        \
              [ "Bohemian Rhapsody" ]  [ "Stairway to Heaven" ]
                     /                         \
                    /                           \
           [ "Blinding Lights" ]             [ "Starboy" ]

If searching for prefix "Sta":
- At root "Hotel California": "Sta" > "Ho" -> PRUNE LEFT SUBTREE! (Never visits Bohemian or Blinding)
- Goes directly to right subtree ("Stairway to Heaven") -> Matches!
- Descends to "Starboy" -> Matches!
```

---

## 3. Part B: Related Artists via Undirected Graph

### Graph Structure
We represent musical relationships as an unweighted, undirected graph:
- **Vertices (Nodes):** Artist names.
- **Edges:** Mutual "related artist" links. If $A$ is related to $B$, then $B$ is also related to $A$.
- **Adjacency Representation:** Python `defaultdict(set)` for $O(1)$ edge additions and membership tests.

### 2-Hop Recommendation Logic
The rule states: *"recommendArtists returns artists exactly two links away who are not already directly related, in alphabetical order."*

Here is our step-by-step approach:
1. Find all **1-hop direct neighbors** of the target artist:
   $$N_1 = \text{self.adj}[artist]$$
2. For every direct neighbor $u \in N_1$, look at their neighbors ($v \in \text{self.adj}[u]$). These are candidates at distance 2.
3. **Filter out invalid candidates:**
   - Cannot be the artist themselves ($v \neq artist$).
   - Cannot already be directly related ($v \notin N_1$). This cleanly handles "triangles" where $A-B$ and $B-C$ exist, but $A-C$ also exists directly.
4. Collect all remaining valid candidates into a set (to eliminate duplicates), sort them alphabetically, and return as a list.

---

## 4. Complexity Summary

| Operation | Data Structure | Time | Space | Notes |
| :--- | :--- | :---: | :---: | :--- |
| `addSong(title, id)` | BST | $O(h)$ | $O(1)$ | $h \approx \log n$ average tree height |
| `findSong(title)` | BST | $O(h)$ | $O(1)$ | Standard binary search descent |
| `prefixSearch(prefix)` | BST (Pruned in-order) | $O(h + K)$ | $O(K)$ | Skips irrelevant subtrees; $K$ matches |
| `addRelation(A, B)` | Undirected Graph | $O(1)$ | $O(1)$ | Adds symmetric edges in adjacency sets |
| `recommendArtists(artist)` | Graph (2-Hop BFS) | $O(d_1 \cdot \bar{d} + M \log M)$ | $O(M)$ | 2-hop search, direct link filter, sorted |
