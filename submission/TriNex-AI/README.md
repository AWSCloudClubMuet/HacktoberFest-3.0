# TriNex-AI — Hacktoberfest Hackathon 2026

## Team Submission

This directory contains TriNex-AI's contributions to the AWS Student Builder Group MUET Jamshoro Hacktoberfest Hackathon 2026.

## Tasks

### 1. Debugging, Attention Gradients & Evaluation

**Directory:** `Debugging & Evaluation of Attention Gradients/`

**Files:**
- `Document.odt` — Written report.
- `attention_gradients.py` — Python implementation.

**Focus:**
- Debugging model-training and evaluation issues.
- Understanding attention gradients.
- Evaluating model behavior and identifying implementation problems.

### 2. Noisy Labels Analysis

**Directory:** `Noisy Labels Analysis/`

**Files:**
- `REPORT.md` — Analysis report and findings.
- `HelpDeskNet50K_Label_Noise_Analysis.ipynb` — Jupyter notebook containing the analysis.
- `helpdesknet50k_label_noise_analysis.py` — Python implementation.

**Focus:**
- Analyzing noisy labels in the HelpDeskNet-50K dataset.
- Investigating the effects of label noise.
- Documenting the methodology, results, and findings.

### 3. TuneWave Music Player (DSA)

**Issue:** #13 — TuneWave Music Player

**Directory:** `TuneWave Music Player/`

**Goal:** Implement the core functionality of a music player using fundamental data structures and algorithms.

**Milestone 1 — Playlist Management**
- Data structures: Doubly linked list and hash map.
- Operations: `addSong(song)`, `removeSong(songId)`, `next()`, `previous()`, `toggleRepeat()`.
- Enforce unique songs in the playlist.
- Support repeat mode and correct end-of-playlist behavior.

**Milestone 2 — Up Next and Playback History**
- Data structures: Queue and stack.
- Operations: `addToUpNext(songId)`, `playNext()`, `back()`.
- Play queued songs before continuing the playlist.
- Maintain a history of the last 10 songs.
- Allow replaying the most recent history entry according to the issue's rules.

**Milestone 3 — Song Search and Related Artists**
- Data structures: Binary search tree (BST) and undirected graph.
- Operations: `addSong(title, songId)`, `findSong(title)`, `prefixSearch(prefix)`, `addRelation(artistA, artistB)`, `recommendArtists(artist)`.
- Return prefix matches in alphabetical order.
- Recommend artists exactly two links away who are not directly related, in alphabetical order.

**Expected outcome:** A working music-player core demonstrating all three milestones and their specified rules.

## Technologies and Concepts

- Python
- NumPy and relevant data-science libraries for the analysis tasks, as required by the implementation.
- Jupyter Notebook
- Data structures and algorithms
- Model debugging, attention gradients, and label-noise analysis

Check each task's imports and dependencies before running its code.

## How to Run

1. Open the relevant task directory.
2. For Python scripts, install the required dependencies and run the script using Python.
3. Open the `.ipynb` notebook in Jupyter Notebook or Google Colab.
4. Read the relevant report for the task's methodology and findings.
5. For TuneWave, follow the implementation's instructions and run its tests or examples to verify the required operations.

## Team

**Team Name:** TriNex-AI

This submission organizes the team's contributions into separate task directories for easier review.
