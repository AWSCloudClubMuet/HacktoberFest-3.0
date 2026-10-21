# Kartik working prompt

Paste the following into the coding assistant opened on your local clone. TASK.md is the authoritative problem statement snapshot; inspect the current official issue if requirements changed.

---

I am Kartik, member of team loop, working on issue #13: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/13.

Repository: https://github.com/mokashkumar1/HacktoberFest-3.0. Shared branch: team-loop. Read the repository instructions, submission/team-loop/COORDINATION.md, and this folder's TASK.md before editing. We have roughly two hours total.

My exclusive folder is submission/team-loop/issue-13-tunewave/. Moksh owns issue-08-attention-evaluation/ and team coordination; Laksh owns issue-09-noisy-labels/. Do not modify their folders or shared files without coordination.

Implement every mandatory TuneWave operation and playback rule using Python 3.11+ with standard-library dependencies only. The issue asks for the player core: prioritize data structures, correctness, tests and a deterministic demo. Do not spend the time building a website, authentication, audio streaming, database, Docker or AWS deployment.

Required structure and behavior:

1. A real doubly linked list for the playlist plus a song-ID-to-node hash map. Reject duplicate song IDs, support adding/removing/current navigation, repeat wrapping and repeat-off end behavior. Define/document previous-at-start, empty list and current-song deletion behavior where the issue is silent.
2. An Up Next queue that takes priority over playlist continuation and a history stack limited to the last ten songs. Queue/history playback must not move the playlist cursor. back() must pop/replay without immediately pushing the same song back into history. State assumptions about initial playback and missing song IDs; test them.
3. An actual title-keyed BST supporting addSong(title, songId), findSong and alphabetically ordered prefix search with pruning. Do not fake the BST by sorting an array on every query. Document duplicate-title handling and case sensitivity.
4. An undirected related-artist graph. Return alphabetically ordered recommendations at shortest-path distance exactly two, excluding the artist itself and direct neighbors. Test triangles and overlapping neighbors.

Disambiguate the playlist's addSong(song) and the catalog's addSong(title, songId) with separate classes or a documented interface. Explain how the playlist, catalog and playback interact. Demonstrate all named operations.

Suggested outputs: player.py (or small modules); test_player.py using unittest; demo.py; README.md with commands, design, assumptions and time/space complexity. Include behavioral tests for duplicate IDs, empty/single-song playlists, removal, repeat boundaries, queue priority, cursor preservation, history truncation/back, BST lookup/prefix pruning, and graph exclusions.

Run the tests and deterministic demo. Report actual output, not a claimed pass without execution. Explain the implemented data structures so I can demonstrate the solution myself.

Stage only my issue folder. Synchronize the shared branch according to COORDINATION.md, push without force, and send Moksh the commit ID, test output and remaining gaps. Do not fork again, edit the team-wide README, claim an issue publicly, or submit a separate final external PR.
