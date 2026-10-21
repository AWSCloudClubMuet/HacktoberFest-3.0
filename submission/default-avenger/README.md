HacktoberFest 3.0: Team Default Avenger Submission
Team Name: Default Avenger
Target Branch: submission
Repository: AWSCloudClubMuet / HacktoberFest-3.0
1. Project Overview
This repository contains our team's project submission for HacktoberFest 3.0. Following the event guidelines, our team chose and solved three different problems:
Problem 1 (Machine Learning): Noisy Labels in HelpDeskNet-50K (Issue #9)
Problem 2 (Data Structures & Java): TuneWave Console Music Player
Problem 3 (Web Development): ReliefHub Flood Relief Dashboard
2. Summary of Solved Problems
#	Project Name	Field	Technologies Used	Folder Location
1	Noisy Labels (HelpDeskNet-50K)	Machine Learning & Data Science	Python, NumPy, Pandas, Scipy, Matplotlib	/HelpDeskNet-50K #9/
2	TuneWave Music Player	Data Structures & Algorithms	Java, Doubly Linked List, BST, Graph	/TuneWave/
3	ReliefHub Dashboard	Web Development	HTML, CSS, JavaScript, Node.js, JSON Server	/ReliefHub/
3. Folder Structure
<pre>
submission/default-avenger/
├── README.md # Main Team Report (This file)
│
├── HelpDeskNet-50K #9/ # Problem 1: Machine Learning
│ ├── analysis.py # Python script for calculations
│ ├── chart.png # Error distribution chart
│ ├── milestone 1 - results.png # Output screenshot 1
│ ├── Milestone 2-results.png # Output screenshot 2
│ ├── milestone 3 result.png # Output screenshot 3
│ ├── milestone 4 output.png # Output screenshot 4
│ ├── milestone 5 output.png # Output screenshot 5
│ └── README.md # Detailed report for Problem 1
│
├── TuneWave/ # Problem 2: Java Data Structures
│ ├── Main.java # Main console menu
│ ├── Song.java # Song class
│ ├── Node.java # Doubly linked list node
│ ├── Playlist.java # Playlist navigation logic
│ ├── SongSearchTree.java # Binary Search Tree for song search
│ ├── ArtistGraph.java # Graph for artist recommendations
│ └── README.md # Detailed guide for Problem 2
│
└── ReliefHub/ # Problem 3: Web Dashboard
├── index.html # Dashboard page
├── app.js # Frontend JavaScript logic
├── styles.css # CSS styling
├── db.json # Sample data for camps and inventory
└── README.md # Detailed guide for Problem 3
</pre>
4. Problem 1: HelpDeskNet-50K (Issue #9)
Topic: Machine Learning & Data Cleaning
Goal: Find out why a customer support ticket model gets stuck at 82% accuracy, and create a plan to fix the data.
What We Did:
Found the noise rate: Analyzed 400 audited tickets and found that 15% of crowd labels are incorrect (95% confidence interval: 11.5% to 18.5%).
Compared worker groups: Used a two-proportion Z-test to show that Tier B (new workers) made significantly more errors (21.8%) than Tier A (6.7%) with p < 0.0001.
Identified confusion pairs: Showed that 68% of all mistakes happen between just two pairs: Billing vs. Refund (43.3%) and Technical vs. Account Access (25.0%).
Estimated true accuracy: Under a simple uniform noise formula, true accuracy is around 96.3%, but on real data it is realistically around 88% to 91% because errors are concentrated in specific classes.
Plan for 2,000 reviews: Recommended spending 80% of expert review time on Tier B tickets and tickets where the model has low prediction confidence.
Model training and evaluation: Recommended using Cleanlab and loss correction during training, and using the 5,000 expert-labeled tickets as the real test set instead of the noisy crowd test set.
Details: See HelpDeskNet-50K #9/README.md.
5. Problem 2: TuneWave Console Music Player
Topic: Data Structures and Algorithms in Java
Goal: Build a console-based music player to show how classic data structures work in practice.
Data Structures Used:
Doubly Linked List (Playlist.java): Allows moving forward (next) and backward (previous) through the playlist easily, and handles repeating the playlist.
Binary Search Tree (SongSearchTree.java): Used to quickly search for song titles in alphabetical order, and supports prefix search for autocomplete.
Undirected Graph (ArtistGraph.java): Connects related artists together and recommends new artists who are two links away.
How to Run:
Step 1: Open terminal in TuneWave folder (cd TuneWave)
Step 2: Compile files (javac *.java)
Step 3: Run program (java Main)
Details: See TuneWave/README.md.
6. Problem 3: ReliefHub Flood Relief Dashboard
Topic: Web Development
Goal: Build an easy-to-use web dashboard to help manage flood relief efforts, supplies, and volunteers in Sindh, Pakistan.
Main Features:
Camp Management: Track relief camps, district locations, number of families, and current capacity.
Supplies & Inventory: Track shortages, warehouse stock, and required relief items.
Dispatch Tracking: Coordinate supply deliveries and make sure resources are not double-allocated.
Volunteers & Donations: Register volunteers by skills and keep records of incoming donations.
API Setup: Uses Node.js and JSON Server (db.json) for realistic HTTP requests, with starter files for Express and PostgreSQL.
Details: See ReliefHub/README.md.
7. Submission Checklist

All code and documentation are inside /submission/default-avenger/.

All three selected problems are completely solved with code and reports.

Branch name (default-avenger) matches our team name.

Step-by-step commit history pushed to GitHub.
