# HelpDeskNet-50K — VS Code Hackathon Starter

**Official task:** https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/9

This is a working analysis toolkit for the **fictional** HelpDeskNet-50K scenario. It produces milestone report text, statistical results, and two graphs from the published aggregate numbers. It **does not** claim model training or real review of 2,000 ticket records.

## Setup (Windows PowerShell, inside VS Code terminal)

1. Install Python 3.11+ and VS Code Python extension.
2. Open this folder in VS Code and launch **Terminal > New Terminal**.
3. Run:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m src.analysis
python -m pytest -q
```

If `Activate.ps1` is blocked, use `.venv\Scripts\python.exe` rather than changing system policy:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m src.analysis
.\.venv\Scripts\python.exe -m pytest -q
```

## Outputs
- `outputs/results.json` (statistical values)
- `outputs/tier_error_rates.png` (Milestone 1)
- `outputs/confusion_pairs.png` (Milestone 2)
- `outputs/milestone_report.md` (all five milestones)

## Judge demonstration
Open the code in VS Code. Run `python -m src.analysis` and show the generated files, then `python -m pytest -q`. Explain which results are measured from the audit, which are theoretical estimates, and which are proposed strategies.

## What to customize before submitting
- Replace this section with actual team name, member GitHub handles, and individual contributions.
- Edit `outputs/milestone_report.md` for detailed presentation language **after regenerating** (or instead edit the report template in `src/analysis.py` so reruns preserve the edit).
- Consider adding an actual ticket-level selection implementation **only if a real suitable dataset is supplied**. Clearly distinguish simulated examples.
- Review all calculations and discuss assumptions with your team.

## Suggested team roles
Member 1: statistics/tests; Member 2: plots and annotation findings; Member 3: expert-review plan and technical documentation. All commit their own changes to the team branch.
