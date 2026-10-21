HacktoberFest Hackathon 2026: Comprehensive Project Report & Workflow Summary

📌 1. Event & Team Overview
Hackathon Name: HacktoberFest Hackathon 2026

Team Name: CodeCrafters

Team Members & Responsibilities:

Bhavesh Kumar (Team Lead): Developed Task 1 (University Scholarship Eligibility Checker) and managed team repository coordination, folder scaffolding, and final Pull Request submission.

Ahtisham Hyder (Member 1): Developed Task 2 (Smart ATM Transaction Simulator).

Asif Mustafa (Member 3): Developed Task 3 (Smart Parking Fee Calculator).

Tech Stack: C++ (Standard Template Library, console I/O, control structures, and validation algorithms), Git & GitHub (Version control and collaboration).

📂 2. Project Architecture & Directory Structure
To ensure clean collaboration without merge conflicts or overlapping code, the team structured the project workspace inside the central submission repository under a dedicated team folder:



Plaintext

submission/
└── CodeCrafters/
    ├── README.md                      # Comprehensive team submission overview
    ├── task1-scholarship/
    │   ├── main.cpp                   # C++ Source Code: Scholarship Eligibility Checker
    │   └── test_output.txt            # Expected console test runs and documentation
    ├── task2-atm/
    │   ├── main.cpp                   # C++ Source Code: Smart ATM Transaction Simulator
    │   └── test_output.txt            # Expected console test runs and documentation
    └── task3-parking/
        ├── main.cpp                   # C++ Source Code: Smart Parking Fee Calculator
        └── test_output.txt            # Expected console test runs and documentation


        
💻 3. Detailed Task Implementations

🎯 Task 1: University Scholarship Eligibility Checker
Author: Bhavesh Kumar (Team Lead)

Objective: Build a robust console-based screening utility that evaluates student profiles against three distinct scholarship categories: Merit, Academic, and Need-Based.

Key Functionality & Features:

Input Validation & Boundary Checking: Rigorously screens user inputs for CGPA (0.0 - 4.0), Attendance percentage (0 - 100%), and Monthly Household Income in Pakistani Rupees (PKR), cleanly handling out-of-range errors and invalid strings without crashing.

Multi-Category Evaluation Logic:

Merit: Requires high academic standing (CGPA >= 3.7, Attendance >= 85%).

Academic: Accessible for strong general performance (CGPA >= 3.3, Attendance >= 80%).

Need-Based: Targets financial support based on household income limits (< Rs. 50,000), minimum acceptable CGPA (2.8), and attendance (>= 75%).

Detailed Reporting & Metrics: Provides a transparent line-by-line decision breakdown explaining why a candidate qualifies or fails specific criteria, accompanied by a custom illustrative performance score percentage and a comprehensive end-of-session summary report tracking total students evaluated and scholarship distributions.

🏧 Task 2: Smart ATM Transaction Simulator
Author: Member 1

Objective: Design a secure banking console simulation tool replicating core ATM operations with robust state management and security protocols.

Key Functionality & Features:

Authentication & Security: Secure PIN verification flows with retry limits to prevent unauthorized account access.

Core Banking Operations: Real-time balance inquiry, fast-cash withdrawals, custom cash withdrawal validation, and deposit handling.

Data Integrity: Implements input sanitization to block negative numbers, zero-value transactions, or overdraft attempts exceeding account thresholds, concluding with a clean session closing log.

🅿️ Task 3: Smart Parking Fee Calculator
Author: Member 3

Objective: Construct an automated vehicle parking management and fee calculation utility supporting diverse vehicle classifications and duration metrics.

Key Functionality & Features:

Dynamic Multi-Tier Pricing: Calculates fees dynamically based on vehicle classification (e.g., Motorcycles, Cars, Vans, Heavy Transport) and total parked duration.

Advanced Rules: Incorporates peak-hour multiplier logic, overnight parking adjustments, and automated receipt printing.

Analytics Dashboard: Generates session analytics summarizing the total number of vehicles processed, parking lot utilization rates, and gross revenue generated.

🔄 4. Collaborative Git & GitHub Workflow
The team executed a professional Git branch-and-pull workflow to manage code integration across three independent local machines:

Fork & Setup (Team Lead):

The Team Lead forked the main hackathon repository, configured the team branch (CodeCrafters), and invited team members as collaborators.

Branching & Modular Development:

Each member pulled updates (git pull origin CodeCrafters), isolated their work into designated task folders (task1-scholarship, task2-atm, task3-parking), and tested their C++ executables locally using GCC/MinGW (g++ main.cpp -o app).

Commit & Push Cycle:

Developers regularly staged changes (git add .), committed with descriptive conventional messages (git commit -m "feat: implement logic"), and pushed updates to the remote shared branch (git push origin CodeCrafters).

Documentation & Final Verification:

Each folder was populated with expected test outputs (test_output.txt) validating console behavior against target user inputs.

Final Submission (Pull Request):

The Team Lead performed a final repository check and opened a Pull Request pointing the team's CodeCrafters workspace branch to the official submission branch before the hackathon deadline.