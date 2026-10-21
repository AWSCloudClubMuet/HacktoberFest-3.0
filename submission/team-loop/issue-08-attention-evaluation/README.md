# Issue 8 Debugging attention gradients and evaluation

Owner: Moksh, team loop.

Source: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8

All four required sections are covered in [REPORT.md](REPORT.md). Following the additional experimental-data instruction relayed by Moksh, we also generated a 10,000-row, 40-feature dataset and executed 30 training runs. The faulty baseline averaged **48.82% test accuracy** and the corrected pipeline **89.62%** on that synthetic task. See [EXPERIMENT.md](EXPERIMENT.md) for methodology, ablations and limits. Everything runs with Python and NumPy; no GPU, AWS, PyTorch or scikit-learn installation is needed. The organizer's original dataset/model and the fraud model were not run.

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
| synthetic_training.py | Generated dataset, handwritten MLP/BatchNorm/Adam and 30 controlled training runs |
| test_synthetic_training.py | Dataset, split/scaler isolation, scheduler, inference and MLP-gradient tests |
| verify_experiment.py | Validate saved evidence and optionally reproduce a paired training seed |
| EXPERIMENT.md and experiment_results/ | Full dataset, measured training results, learning curves and experiment explanation |
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

Verification exits nonzero on failed tests, gradient checks or saved-experiment integrity checks. Recorded results: 32 tests passed, and all 15 attention gradient-array checks passed across unmasked, causal and custom-mask cases. Tests also cover an independent loop reference, cost-helper robustness, MLP/BatchNorm gradients, deterministic data and scaler/split isolation. The fixed-cost fraud threshold is 5/205, approximately 2.439%. Attention numerical step size is 1e-6 in float64, with maximum absolute error <=1e-7 and relative L2 error <=1e-6. The JSON files contain actual measured errors. See [FINAL-AUDIT.md](FINAL-AUDIT.md) for scope and remaining presentation/submission steps.

## Requirement coverage

- [x] Training bugs, symptom attribution, precise corrections and black-box experiments: TRAINING-FIXES.md.
- [x] Derive dV, dP, dS, dQ and dK: REPORT.md section B.
- [x] NumPy forward/backward and numerical evidence: attention.py, check_gradients.py and results/.
- [x] Stability, scaling, causal masks and FlashAttention memory explanation: REPORT.md section B.
- [x] Fraud metrics, chronological splits, delayed labels, cost threshold, calibration and drift: REPORT.md section C.
- [x] Cases A/B/C and two D hypotheses plus distinguishing experiment: REPORT.md section D.
- [x] Assumptions, limits, source attribution and reproduction instructions.
- [x] Additional synthetic-data experiment: 10,000 rows, 40 features, 10 variants x 3 seeds x 50 epochs; saved results and paired replay.

## Important limits

The original PyTorch training run was not reproduced. The additional experiment trains a documented NumPy equivalent on generated data; its improvement is not a claim about the original 55% example or a real fraud detector. Fraud evaluation is a design. Fully masked attention rows are rejected; causal mode requires square attention and includes the diagonal. FlashAttention is explained, not implemented.

Developed with coding-assistant support and references linked in REPORT.md. Moksh must review and explain the work and follow the organizers' AI-use policy. No claim is made that formatting or variable names bypass AI detection.
