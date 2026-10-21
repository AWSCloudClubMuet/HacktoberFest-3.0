# Issue 9: Noisy Labels

Laksh's part of Team loop's submission. Completed on Moksh's laptop with AI assistance.

We used the audit figures in [TASK.md](TASK.md) to study label noise in HelpDeskNet-50K. The dataset is fictional, so this project contains calculations and a review plan rather than a trained model. [REPORT.md](REPORT.md) covers all five assignment sections, including the formulas, assumptions and references.

## Run

Use Python 3.11 or later. No extra packages are needed. From this folder:

```powershell
python calculations.py
python calculations.py --json
python verify.py
```

You can also use the team's existing Python environment:

```powershell
& '..\.venv\Scripts\python.exe' calculations.py
& '..\.venv\Scripts\python.exe' verify.py
```

To run the tests separately:

```powershell
python -m unittest discover -s . -p 'test_*.py' -v
```

## Main results

The audit found 60 disagreements out of 400 tickets: **15%**, with a Wilson 95% confidence interval of **11.83% to 18.83%**. Tier A had **6.67%** disagreement and Tier B had **21.82%**, a difference of **15.15 percentage points**. The two-sided z test gives p = **0.0000242141**; the Fisher exact check gives p = **0.0000183007**.

The question's uniform-noise assumption gives an estimated true accuracy of **96.34%**. This is a calculation under assumptions, not a measured model score. The report explains why systematic errors could make it unreliable.

Our proposed 2,000-ticket review budget reserves 800 tickets for evaluation and 1,200 for training review. It includes random sampling, targeted corrections, two training methods and an independent expert evaluation plan.

## Verification

`verify.py` runs **16 tests** and compares the saved numbers with fresh calculations. [VERIFICATION.txt](VERIFICATION.txt) contains the test output, and [CALCULATIONS.json](CALCULATIONS.json) contains the full results. Use `python verify.py --write-results` to refresh both after checking a change.

The tests check the maths and code. They cannot establish the true error rate, worker-level effects or model improvements without actual ticket data. Crowd/expert disagreement is only an error estimate if the expert labels are reliable.
