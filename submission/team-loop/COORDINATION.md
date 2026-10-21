# Team loop execution plan

Deadline: **21 October 2026 at 3:00 PM, Asia/Karachi (Pakistan time)**, as clarified by Moksh. Earlier two-hour wording in task prompts is superseded by this deadline. Complete all mandatory requirements; use the remaining time for verification and demo preparation.

## Recommendation

Select issue 8 (Debugging, Attention Gradients & Evaluation), issue 9 (Noisy Labels: HelpDeskNet-50K), and issue 13 (TuneWave Music Player). The team has chosen this division of work; it is not an assignment or approval from the organizers. The tasks are independent and avoid cloud setup, deployment, large training runs, mobile builds, and mandatory mock HTTP APIs.

Exclude issues 14, 15, and 16, labeled C++ and 26 Batch Only. The three Web/App options require substantial working interfaces and mock API state workflows; the selected independent tasks reduce integration dependencies. No ranking or acceptance is guaranteed.

## Verified repository state

- Fork: https://github.com/mokashkumar1/HacktoberFest-3.0
- Official repository: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0
- Branch: `team-loop`
- Team directory: `submission/team-loop/`
- Kartik's account `kartikmaheshwari01` and Laksh's account `lukshkumar38` both have push permission.
- Official target branch `submission` is still absent; only `main` was present at this check. Moksh must clarify the intended final PR target with the organizers now, while implementation proceeds. Do not create an imitation upstream submission branch or silently submit to main.

## Ownership

| Owner | Issue | Exclusive working folder | Main output |
| --- | --- | --- | --- |
| Moksh | #8 | `issue-08-attention-evaluation/` | Technical analysis, NumPy attention and gradient checks, training fixes |
| Kartik | #13 | `issue-13-tunewave/` | Python music-player core with actual data structures, tests and demo |
| Laksh | #9 | `issue-09-noisy-labels/` | Statistical calculations and evidence-based written analysis |

Moksh also owns this coordination file, the top-level team README, requirements, final verification, and the external submission PR. Each member owns their issue README/report, implementation, and tests. Do not edit another member's folder without coordination. These person assignments are provisional if the team needs to swap based on expertise; the folders stay separate.

## Commands for Moksh

```powershell
cd 'D:\02_Development_Projects\AWS HACKATHON\HacktoberFest-3.0'
git switch team-loop
git pull --ff-only origin team-loop
```

## Commands for teammates

First clone only, in your chosen parent folder:

```powershell
git clone --branch team-loop https://github.com/mokashkumar1/HacktoberFest-3.0.git
cd HacktoberFest-3.0
```

If already cloned, finish or safely save local work and use:

```powershell
git status
git switch team-loop
git pull --ff-only origin team-loop
```

Read `COORDINATION.md`, your issue's `TASK.md`, and your issue's `WORK-PROMPT.md`. TASK.md contains the organizer's issue text as retrieved during planning, not an implemented solution.

## Minimal Python environment

Python 3.11 or later is suitable. NumPy is needed for issue 8; issue 13 can use only the standard library. Issue 9 calculations should also use the standard library when practical. Do not install GPU tools, large models, Docker services, or AWS resources for these tasks.

From the team directory:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Invoke `.venv\Scripts\python.exe` directly; activating PowerShell scripts is unnecessary. Keep the environment out of Git.

## Schedule before the deadline

| Target | Work |
| --- | --- |
| Now | Pull the shared plan, work in your assigned folder and clarify the official submission target |
| By 2:00 PM | Complete all mandatory deliverables and run the owner checks |
| 2:00-2:30 PM | Cross-review: Kartik checks Moksh, Moksh checks Laksh, Laksh checks Kartik; each owner makes fixes and rehearses the demo |
| 2:30-2:45 PM | Push accepted work; Moksh verifies the combined repository, README and submission diff |
| By 2:45 PM | Aim to submit using the organizer-confirmed target, leaving a buffer |
| 3:00 PM | User-stated deadline; all final changes and required submission must be in place |

These are internal milestones, not alternative organizer deadlines. Do not silently omit mandatory requirements or claim incomplete work is complete.

## Shared branch commit protocol

1. Pull before starting with a clean working tree.
2. Stage only your own issue folder and inspect the staged diff.
3. Commit under your own identity.
4. Fetch and merge `origin/team-loop` before pushing. Coordinate merges one person at a time.
5. Re-run checks if the merge affects the tested code; push without force.
6. If the remote advanced again, repeat fetch/merge and checks. Never discard someone else's changes to make a push succeed.

Example for Kartik, replacing the folder for other members:

```powershell
git add submission/team-loop/issue-13-tunewave
git diff --staged
git commit -m "Implement TuneWave core for issue 13"
git fetch origin
git merge origin/team-loop
git push origin team-loop
git log -1 --oneline
```

## Required handoff from each person

- Issue number and completed requirements.
- Changed files and exact commands to reproduce results.
- Actual test/numerical-check output, not invented pass claims.
- Assumptions, limits and any incomplete requirements.
- Commit ID after pushing.
- A short explanation the owner can present in the demo.

## Submission readiness

The root team README must link all three solutions and list authors, setup, run/test commands, results and limitations. Moksh's issue 8 implementation and analysis have passed local verification; see its README and recorded results. Issues 9 and 13 remain pending teammate handoffs and verification. No official issue has been claimed or commented on, and no final PR has been created. Final submission is Moksh's responsibility after work is verified and the official target is clarified.
