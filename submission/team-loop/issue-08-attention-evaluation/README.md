# Issue 8 Debugging attention gradients and evaluation

Owner: Moksh, team loop.

Source: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8

All four required sections are covered in [REPORT.md](REPORT.md). The numerical implementation and checks run locally with Python and NumPy; no GPU, AWS access, training dataset, PyTorch or scikit-learn installation is needed for the submitted executable checks. The original training pipeline and fraud model were not run; their correction/evaluation designs are explicitly labeled.

## Files and requirements

| File | Purpose |
| --- | --- |
| TRAINING-FIXES.md | Visible/conditional problems, symptoms, precise fixes and black-box diagnostic experiments |
| REPORT.md | All five attention gradients, stability/masking/scaling/memory, fraud evaluation and cases A-D |
| attention.py | Hand-derived single-head forward/backward in float64 NumPy |
| check_gradients.py | Central finite differences for dQ/dK/dV/dP/dS in three masking/shape scenarios |
| evaluation.py | Tested constant-cost fraud threshold and illustrative baseline arithmetic |
| test_attention.py and test_evaluation.py | Behavioral, derivative, validation and cost-rule tests |
| verify.py | One-command local verification, optionally saving evidence |
| results/ | Actual recorded local results, not simulated benchmark claims |
| DEMO-GUIDE.md | Roman Urdu explanation and likely reviewer questions |

Tested environment: Python 3.11.9 and NumPy 2.4.6. Parent requirements.txt permits NumPy >=1.24,<3. Small floating-point differences between versions/platforms are expected; the checks use explicit tolerances.

## Setup on another laptop

From the repository root:

```powershell
cd submission/team-loop
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd issue-08-attention-evaluation
```

If the environment already exists, do not recreate it unnecessarily. All remaining commands below assume the issue-08 folder is the working directory.

## Run

One command runs all tests, gradient checks and scenario arithmetic:

```powershell
..\.venv\Scripts\python.exe verify.py
```

Record fresh machine-readable evidence and test output:

```powershell
..\.venv\Scripts\python.exe verify.py --write-results
```

Run components separately:

```powershell
..\.venv\Scripts\python.exe -m unittest discover -s . -p "test_*.py" -v
..\.venv\Scripts\python.exe check_gradients.py
..\.venv\Scripts\python.exe evaluation.py
```

Verification exits nonzero on failed tests or gradient checks. Recorded results: 26 tests passed, and all 15 gradient-array checks passed across unmasked, causal and custom-mask cases. The final audit also checks forward output against an independent scalar-loop reference across four seeds and both causal/noncausal modes, zero upstream gradients, and cost-helper overflow/input consistency. The fixed-cost threshold is 5/205, approximately 2.439%. Numerical step size is 1e-6 in float64, with maximum absolute error <=1e-7 and relative L2 error <=1e-6. The JSON files contain actual measured errors. See [FINAL-AUDIT.md](FINAL-AUDIT.md) for scope and remaining presentation/submission steps.

## Requirement coverage

- [x] Training bugs, symptom attribution, precise corrections and black-box experiments: TRAINING-FIXES.md.
- [x] Derive dV, dP, dS, dQ and dK: REPORT.md section B.
- [x] NumPy forward/backward and numerical evidence: attention.py, check_gradients.py and results/.
- [x] Stability, scaling, causal masks and FlashAttention memory explanation: REPORT.md section B.
- [x] Fraud metrics, chronological splits, delayed labels, cost threshold, calibration and drift: REPORT.md section C.
- [x] Cases A/B/C and two D hypotheses plus distinguishing experiment: REPORT.md section D.
- [x] Assumptions, limits, source attribution and reproduction instructions.

## Important limits

The training section supplies the issue's allowed precise-fix description, not a tested PyTorch training rerun. Fraud metrics are a design, not claimed production measurements. Fully masked attention rows are rejected; causal mode requires square attention and includes the diagonal. NumPy tests use small synthetic arrays. FlashAttention is explained, not implemented.

Developed with coding-assistant support and references linked in REPORT.md. Moksh must review and explain the work and follow the organizers' AI-use policy. No claim is made that formatting or variable names bypass AI detection.
