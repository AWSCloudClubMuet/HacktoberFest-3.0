# Team Code Slayers

## Team Members and Roles
### 1. Mishal (Team Lead) - TuneWav
 a music player that is divided into three sections:
### 1. Users move forward and back through a playlist and add or remove songs while it plays.
1. A song can appear only once in a playlist; a hash map from song ID to node checks this and finds songs without scanning.
2. With repeat on, next() on the last song wraps to the first. With repeat off, it stays on the last song and returns "end".
### 2. Users queue songs to play next and go back to songs they just heard. 
1. Songs in the Up Next queue play before the playlist continues.
2. Playing from Up Next or history does not move the playlist position.
3. History keeps the last 10 songs played and drops the oldest.
4. back() replays the top song and removes it from history.
### 3. Users search songs by title, and the app suggests artists they have not yet linked to.
1. Store songs in a BST keyed by title.
2. prefixSearch returns matching titles in alphabetical order and skips subtrees that cannot match.
3. Artists form an undirected graph of "related" links.
4. recommendArtists returns artists exactly two links away who are not already directly related, in alphabetical order.

### 2. Anzalna - Kisan Mandi
Coded kisan mandi, and used npm for running the code. 
It has one requirement of npm.

``` npm install``
```npm start```

### 3. Anas - FloodReliefHub


## Technologies Used
- Our project is build primarily using Python. 
- We used dictionaries, lists, classes, and deque of Python.

# Requirements
npm for running KisanMandi
