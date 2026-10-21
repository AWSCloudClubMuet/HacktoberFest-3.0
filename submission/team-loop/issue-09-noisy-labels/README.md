# Issue #9 — Noisy Labels: HelpDeskNet-50K

**Team loop · Owner: Laksh.** Completed with AI assistance on Moksh's laptop after Laksh's laptop became unavailable. The configured Git identity records who performed the commit; it does not imply Laksh personally executed these calculations.

All five milestones are addressed in [REPORT.md](REPORT.md), with reproducible standard-library calculations. This is a fictional aggregate-data analysis. No model training, ticket downloads, real relabeling or accuracy improvement is claimed.

## Run

Python 3.11+; no third-party packages are required for this issue. From this folder:

```powershell
python calculations.py
python calculations.py --json
python verify.py
```

If Python is not on PATH, use the existing team environment:

```powershell
& '..\.venv\Scripts\python.exe' calculations.py
& '..\.venv\Scripts\python.exe' verify.py
```

From the repository root:

```powershell
& '.\submission\team-loop\.venv\Scripts\python.exe' '.\submission\team-loop\issue-09-noisy-labels\verify.py'
```

To run tests directly or deliberately refresh the recorded calculation/test output after reviewing changes:

```powershell
python -m unittest discover -s . -p 'test_*.py' -v
python verify.py --write-results
```

## Results

| Calculation | Result |
| --- | --- |
| Crowd/expert disagreement | 60/400 = **15.00%** |
| Wilson 95% confidence interval | **11.83%–18.83%** |
| Tier A / Tier B | **6.67% / 21.82%** |
| Tier B minus A | **15.15 percentage points** |
| Two-sided pooled z test | z = **-4.222003**, p = **0.0000242141** |
| Two-sided Fisher exact cross-check | p = **0.0000183007** |
| Naive six-class true accuracy | **96.34%**, conditional on independent symmetric flips |
| Proposed extra review allocation | **2,000 unique tickets: 800 evaluation, 1,200 training** |

`verify.py` runs **16 tests** and checks that recorded results match a fresh calculation. [VERIFICATION.txt](VERIFICATION.txt) records the actual successful run. Tests include score-interval inversion, a Pearson chi-square cross-check, exact Fisher fixtures and exhaustive small-table enumeration, accuracy-model edge cases and budget consistency. This validates calculations; it does not validate assumptions about unavailable ticket data.

## Files and milestone map

| File | Purpose |
| --- | --- |
| [TASK.md](TASK.md) | Supplied official problem snapshot |
| [REPORT.md](REPORT.md) | All five milestones, formulas, sources, assumptions and requirement checklist |
| [calculations.py](calculations.py) | Reproducible statistics, exact-test cross-check and budget totals |
| [test_calculations.py](test_calculations.py) | Numerical tests |
| [verify.py](verify.py) | Single verification command, independent of the caller's working directory |
| [CALCULATIONS.json](CALCULATIONS.json) | Full-precision generated numerical record |
| [VERIFICATION.txt](VERIFICATION.txt) | Actual successful test output |
| [DEMO-GUIDE.md](DEMO-GUIDE.md) | One-minute explanation and likely questions |
| [HANDOFF.md](HANDOFF.md) | Integration notes and remaining team responsibilities |

The audit estimates disagreement in the crowd subset. Experts may also be wrong; worker clustering can invalidate ticket-independent uncertainty; asymmetric noise undermines the naive 96.34% estimate. Actual selection yield and model improvements require data and experiments beyond this fictional task. See the report for the proposed methods and their limits.
