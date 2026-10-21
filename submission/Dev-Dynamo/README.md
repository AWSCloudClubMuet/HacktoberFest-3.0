# 🎵 TuneWave — Music Player

**A Java-based music player project featuring playlist management, song searching, artist recommendations, and a graphical user interface.**

## 📌 About the Project

TuneWave is a music player application developed in Java that combines fundamental data structures with a clean, modern user interface. It features a collection of Bollywood and Lollywood songs and demonstrates how data structures can be used to organize and manage music efficiently.

The project includes a console-based implementation and a Swing-based graphical user interface (GUI).

## ✨ Features

- 🎶 **Music Library:** A collection of 30 songs from Bollywood and Lollywood.
- 🔍 **Song Search:** Find songs by title using a Binary Search Tree (BST).
- 🔤 **Prefix Search:** Search for songs using the beginning of a title.
- 🎧 **Playlist Management:** Add, remove, and browse songs.
- ⏭️ **Playback Navigation:** Previous and next song controls in the GUI.
- 📋 **Queue Management:** Add songs to the Up Next queue.
- 🕘 **Recently Played History:** Keep track of selected songs.
- 🔁 **Repeat Mode:** Toggle the repeat setting.
- 🤝 **Artist Recommendations:** Discover related artists using a graph-based structure.
- 🖥️ **Graphical Interface:** A Java Swing GUI with song search, navigation, a playlist view, and playback controls.

> **Note:** The current GUI is a functional interface demonstration. Actual audio playback, timeline seeking, and volume adjustment are not yet connected to an audio engine.

## 🛠️ Technologies Used

- **Programming Language:** Java
- **GUI Framework:** Java Swing
- **Data Structures:** Binary Search Tree (BST), Graph, Queue, Lists
- **Version Control:** Git and GitHub

## 🧠 Data Structures

| Data Structure | Purpose |
|---|---|
| Binary Search Tree | Song searching and prefix-based lookup |
| Graph | Artist relationships and recommendations |
| Queue | Managing songs in Up Next |
| Lists | Organizing the music library and history |

## 📂 Project Structure

```text
TuneWave Music Player/
├── Playlist.java
├── TuneWaveGUI.java
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Java Development Kit (JDK) installed
- A terminal or Java-compatible IDE, such as Visual Studio Code

Check your Java installation:

```bash
java -version
javac -version
```

### Run the Console Version

Open a terminal inside the project folder and run:

```bash
javac Playlist.java
java Playlist
```

### Run the GUI Version

Compile both Java files:

```bash
javac Playlist.java TuneWaveGUI.java
```

Launch the graphical interface:

```bash
java TuneWaveGUI
```

## 🎨 Interface

The TuneWave GUI features a light theme with black text and violet accents. Its layout includes navigation, a searchable music library, a featured playlist panel, and a bottom control bar.

## 🎯 Project Objective

The objective of TuneWave is to demonstrate the practical application of Java programming and data structures in a music-related application while providing a foundation for future improvements, including real audio playback and more advanced music recommendations.

## 🔮 Future Improvements

- Integrate actual audio playback.
- Connect the timeline and volume controls to the audio engine.
- Add album artwork and richer song metadata.
- Improve artist recommendations.
- Add persistent playlists and saved user preferences.

## 👥 Team

**Team:** Dev-Dynamo

**Project:** TuneWave Music Player

## 📄 License

This project was developed for educational and hackathon purposes.
