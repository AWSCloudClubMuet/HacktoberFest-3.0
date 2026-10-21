# Milestone 3: Song Search & Artist Recommendation — Theoretical Foundations & Architecture

## 1. Executive Summary & Problem Formulation
TuneWave's discovery engine must empower listeners to:
1. Instantly search and locate songs by title using fast prefix queries.
2. Discover new music through a collaborative network of artist relationships.

### Formal Rules & System Requirements:
1. **BST Title Indexing:** Songs are indexed in a **Binary Search Tree (BST)** keyed by track `title`.
2. **Pruned Prefix Search:** `prefixSearch(prefix)` returns matching titles in **alphabetical order** and **skips subtrees that cannot match**.
3. **Undirected Artist Network:** Artists form an **undirected graph** where edges represent mutual musical similarity.
4. **2-Hop Recommendation Rule:** `recommendArtists(artist)` returns artists **exactly two links away** who are **not already directly related**, formatted in **alphabetical order**.
5. **Required Operations:**
   - `addSong(title, songId)`
   - `findSong(title)`
   - `prefixSearch(prefix)`
   - `addRelation(artistA, artistB)`
   - `recommendArtists(artist)`

---

## 2. Part I: Song Search via Binary Search Tree (BST)

### Architectural Overview
A Binary Search Tree (BST) enforces the symmetric order property:
$$\forall x \in \text{Left}(node): x.\text{title} < node.\text{title}$$
$$\forall y \in \text{Right}(node): y.\text{title} > node.\text{title}$$

```
                           [ "Hotel California" ]
                                  /       \
                                 /         \
                 [ "Bohemian Rhapsody" ]   [ "Stairway to Heaven" ]
                         /     \                       \
                        /       \                       \
               [ "Blinding" ]  [ "Comfortably" ]     [ "Starboy" ]
```

### Exact Search: `findSong(title)`
Given a target `title`, standard BST descent proceeds as:
- Compare query `title` with `node.title`.
- If equal, song found; return `songId`.
- If `query < node.title`, recurse into `node.left`.
- If `query > node.title`, recurse into `node.right`.
- **Complexity:** $O(h)$ where $h$ is tree height ($O(\log N)$ average).

---

### Pruned Prefix Search: `prefixSearch(prefix)`

#### The Subtree Pruning Invariant
A naive approach would perform a full $O(N)$ tree traversal and filter strings with `startswith`. However, TuneWave requires **skipping subtrees that cannot match**.

Let $P$ be the search prefix of length $L = |P|$. For any BST node $u$ with title $T = u.\text{title}$:
Let $T_L = T[0:L]$ (the first $L$ characters of $T$, or $T$ itself if $|T| < L$).

$$\begin{array}{|l|l|l|}
\hline
\textbf{Case} & \textbf{Condition} & \textbf{Subtree Pruning Action} \\
\hline
\textbf{Case 1: Match} & T_L = P & \text{Match found! Recurse both Left and Right subtrees.} \\
\textbf{Case 2: Prefix Smaller} & P < T_L & \text{All keys in Right Subtree are } > T > P \implies \textbf{Prune Right Subtree!} \\
\textbf{Case 3: Prefix Greater} & P > T_L & \text{All keys in Left Subtree are } < T < P \implies \textbf{Prune Left Subtree!} \\
\hline
\end{array}$$

#### Inherent Alphabetical Ordering
Because the BST property guarantees that in-order traversal ($\text{Left} \rightarrow \text{Node} \rightarrow \text{Right}$) visits keys in strict monotonically increasing lexicographical order, executing an **in-order traversal with pruning** guarantees that results are produced **in alphabetical order** without requiring an expensive post-hoc sorting step.

#### Pruned Traversal Algorithm
```python
def _prefix_search(node, prefix, results):
    if node is None:
        return

    L = len(prefix)
    node_prefix = node.title[:L]

    # Explore Left Subtree if it can possibly contain matches
    if prefix <= node_prefix:
        _prefix_search(node.left, prefix, results)

    # Check Current Node
    if node.title.startswith(prefix):
        results.append(node.title)

    # Explore Right Subtree if it can possibly contain matches
    if prefix >= node_prefix:
        _prefix_search(node.right, prefix, results)
```

---

## 3. Part II: Artist Recommendations via Undirected Graph

### Graph Formalization
Let $G = (V, E)$ be an undirected, unweighted graph where:
- $V$ is the set of artists.
- $E$ is the set of symmetric "related artist" edges: $(u, v) \in E \iff (v, u) \in E$.

```
    [Drake] ------------- [The Weeknd] ------------- [Daft Punk]
       |                         |                         |
       |                         |                         |
    [Future]               [Travis Scott]           [Pharrell Williams]
```

### Recommendation Logic: Exactly 2 Links Away
The rule requires recommending artists who are:
1. **Reachable in exactly 2 links** (path length = 2).
2. **Not already directly related** (distance $\neq 1$).
3. **Not the source artist** (distance $\neq 0$).
4. Returned in **alphabetical order**.

### Mathematical Formulation
Let $A$ be the target artist.
1. **Immediate 1-Hop Neighbors ($N_1$):**
   $$N_1(A) = \{ u \in V \mid (A, u) \in E \}$$

2. **2-Hop Neighborhood Candidates ($N_2$):**
   $$N_2(A) = \bigcup_{u \in N_1(A)} \{ v \in V \mid (u, v) \in E \}$$

3. **Recommendation Filtering Set ($R$):**
   $$R(A) = \{ v \in N_2(A) \mid v \neq A \land v \notin N_1(A) \}$$

4. **Alphabetical Output:**
   $$\text{recommendArtists}(A) = \text{sorted}(R(A))$$

### Triangle Prevention (Direct Link Suppression)
A frequent edge case in social and recommendation graphs is the "triangle" topology:
```
           (Artist A)
           /        \
   (Link 1)          (Link 1)
         /            \
    (Artist B) ====== (Artist C)
             (Link 2)
```
Here, $C \in N(B)$, so from $A \rightarrow B \rightarrow C$, $C$ appears to be 2 hops away. However, $A$ and $C$ already share a direct edge ($(A, C) \in E$). TuneWave's strict rule mandates that $C$ is **excluded** because $C \in N_1(A)$.

---

## 4. Algorithmic Specifications

### 1. `addSong(title, songId)`
- Recursively traverses the BST from root to leaf to insert a new `BSTNode(title, songId)`.
- If title already exists, updates or appends `songId`.

### 2. `findSong(title)`
- Performs standard BST search. Returns `songId` if found, else `None`.

### 3. `prefixSearch(prefix)`
- Initializes `results = []`.
- Invokes recursive in-order descent with branch pruning.
- Returns `results`.

### 4. `addRelation(artistA, artistB)`
- Adds symmetric edge:
  $$\text{adj}[artistA].\text{add}(artistB)$$
  $$\text{adj}[artistB].\text{add}(artistA)$$

### 5. `recommendArtists(artist)`
- Retrieves $N_1 = \text{adj}[artist]$.
- Collects all $v \in \text{adj}[u]$ for each $u \in N_1$.
- Filters out $v == artist$ and $v \in N_1$.
- Returns sorted unique list of candidate artists.

---

## 5. Formal Edge-Case Verification Matrix

| Scenario | Setup | Query | Expected Result |
| :--- | :--- | :--- | :--- |
| **Empty BST** | Root is `None` | `findSong("Hello")`, `prefixSearch("H")` | Returns `None`, `[]`. |
| **Prefix with No Matches** | Songs: `["Apple", "Banana"]` | `prefixSearch("Cat")` | Returns `[]` with pruned traversal. |
| **Complete Prefix Match** | Songs: `["Starboy", "Starlight", "Stay"]` | `prefixSearch("Sta")` | Returns `["Starboy", "Starlight", "Stay"]` in alphabetical order. |
| **Subtree Pruning Check** | Left subtree has keys $< P$, right has $> P$ | `prefixSearch("M")` | Discards left subtree of $A$ and right subtree of $Z$. |
| **Isolated Artist** | Artist $X$ has no edges | `recommendArtists(X)` | Returns `[]`. |
| **Direct Triangle Graph** | $A-B, B-C, A-C$ | `recommendArtists(A)` | Returns `[]` (since $C$ is already directly connected to $A$). |
| **Standard 2-Hop Path** | $A-B, B-C$ | `recommendArtists(A)` | Returns `[C]`. |
| **Alphabetical Sorting** | $A-B, B-Z, B-M, B-A2$ | `recommendArtists(A)` | Returns `[A2, M, Z]` in sorted order. |

---

## 6. Algorithmic Complexity Summary

$$\begin{array}{|l|c|c|l|}
\hline
\textbf{Operation} & \textbf{Time Complexity} & \textbf{Space Complexity} & \textbf{Justification} \\
\hline
\text{addSong(title, id)} & O(h) & O(1) & \text{Descent along BST branch of height } h \\
\text{findSong(title)} & O(h) & O(1) & \text{Binary search descent} \\
\text{prefixSearch(prefix)} & O(h + K) & O(K) & \text{Pruned in-order traversal returning } K \text{ matches} \\
\text{addRelation(A, B)} & O(1) & O(1) & \text{Adjacency set insertion} \\
\text{recommendArtists(A)} & O(|N_1| \cdot \bar{d} + M \log M) & O(M) & \text{2-hop exploration + sorting } M \text{ recommendations} \\
\hline
\end{array}$$

The combination of a pruned Binary Search Tree and an unweighted undirected graph structure satisfies all TuneWave Milestone 3 functional and performance constraints.
