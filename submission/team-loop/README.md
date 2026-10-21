# Team loop

Team loop's workspace for HacktoberFest 3.0.

## Team members

| Member | Role |
| --- | --- |
| Moksh | Team lead and developer |
| Kartik | Developer |
| Laksh | Developer |

The chosen issues and working ownership are below. See [COORDINATION.md](COORDINATION.md) for the plan, exact working folders, setup, synchronization, and handoffs. Moksh has clarified a deadline of **3:00 PM Pakistan time on 21 October 2026**.

| Issue | Owner | Deliverables | Status |
| --- | --- | --- | --- |
| [#8 Debugging, Attention Gradients & Evaluation](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8) | Moksh | [Analysis, NumPy attention, numerical gradient checks, training fixes](issue-08-attention-evaluation/README.md) | Implemented and locally verified: 22 tests and all numerical checks passed |
| [#9 Noisy Labels: HelpDeskNet-50K](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/9) | Laksh | Calculations, annotation-quality analysis, review and evaluation plan | Awaiting owner's push and verification |
| [#13 TuneWave Music Player](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/13) | Kartik | Data-structure core, tests, demo and complexity notes | Awaiting owner's push and verification |

## Repository and workspace

- Official repository: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0
- Team fork: https://github.com/mokashkumar1/HacktoberFest-3.0
- Team branch: `team-loop`
- Team folder: `submission/team-loop/`

## Project

Submission structure: three independent AI/ML and DSA solutions. Python is the common language; NumPy is required for issue 8. No large-model training, cloud deployment, or mock API is required by the selected issues. The task texts and individual working prompts are included in each issue folder. Issue 8 has a verified local implementation and full analysis; the other two solutions await their owners' handoffs.

## Setup and verification

Create a local virtual environment and install `requirements.txt` as described in COORDINATION.md. Issue 8 run/test commands and actual results are in its README. Each other owner must add exact run/test commands and actual results with their completed solution.

Each contributor should use their own GitHub account and Git author identity, synchronize the team branch before working, and coordinate edits to shared files. Project files, documentation, and assets belong inside this team folder.

## Submission

Moksh will submit the final pull request from this fork's `team-loop` branch to the official repository. The organizers' written instructions specify `submission` as the target branch. At initial setup, only `main` was available in the official repository; confirm the current target with the organizers before submitting.
