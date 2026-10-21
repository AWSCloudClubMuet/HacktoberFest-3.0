# Issue 8: Attention and model evaluation

Moksh, team loop. [Original issue](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8).

This project covers the training bugs, attention gradients, fraud evaluation and learning curves asked for in the issue. [REPORT.md](REPORT.md) explains the approach, calculations, experiment and limitations.

We also generated 10,000 rows with 40 features and trained a small NumPy model. Across three training seeds, the faulty pipeline averaged 48.82% test accuracy and the corrected pipeline averaged 89.62%. These are measured results on our synthetic dataset. They do not show an improvement on the original 55% example, whose dataset was not provided.

## Setup

From the repository root, run these commands in PowerShell. Skip creating and installing the environment if it already exists.

```powershell
cd submission/team-loop
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd issue-08-attention-evaluation
```

Tested with Python 3.11.9 and NumPy 2.4.6. The project only needs Python and NumPy.

## Check the work

Run all tests, attention gradient checks and checks of the saved experiment:

```powershell
..\.venv\Scripts\python.exe verify.py
```

Add `--write-results` to update the verification files in `results/`. Verification returns a failure status if a check fails.

To retrain the faulty and corrected models for seed 7 and compare their losses and accuracy with the saved results:

```powershell
..\.venv\Scripts\python.exe verify_experiment.py --rerun-seed 7
```

To repeat the full experiment of ten variants, three seeds and 50 epochs:

```powershell
..\.venv\Scripts\python.exe synthetic_training.py
```

The full experiment replaces the saved files in `experiment_results/`. For a separate trial, use `--epochs 10 --output experiment_trial`.

## Files

| File | What it does |
| --- | --- |
| attention.py | Attention forward and backward calculations, including masks |
| check_gradients.py | Finite difference checks of all five attention gradients |
| evaluation.py | Fraud cost threshold and baseline calculations |
| synthetic_training.py | Dataset generation, model training and comparisons |
| test_*.py | Tests for attention, evaluation and training |
| verify.py | Runs the complete verification |
| verify_experiment.py | Checks the saved dataset and results, with optional retraining |
| results/ | Test output and attention gradient evidence |
| experiment_results/ | Full dataset, metadata, training results and learning curves |

The recorded verification passed 32 tests and 15 attention gradient checks. The tests cover masking, an independent attention reference, model gradients, data splits, preprocessing and evaluation behaviour.

## Limits

The training experiment uses a handwritten NumPy equivalent of the supplied architecture. We did not run the original PyTorch model or train a real fraud detector. Fully masked attention rows are rejected; causal attention requires equal query and key lengths and includes the diagonal. FlashAttention is explained in the report, not implemented.

We used coding assistant support. References and assumptions are included in the report, and the team should be able to explain the implementation and follow the organizers' AI use rules.
