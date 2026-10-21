# Team loop: ML reliability and TuneWave

Our HacktoberFest 3.0 submission contains three independent solutions: debugging a machine learning pipeline and implementing attention gradients, analyzing noisy support-ticket labels, and building a music-player core with data structures.

## Team

| Member | GitHub | Role and issue |
| --- | --- | --- |
| Moksh | [mokashkumar1](https://github.com/mokashkumar1) | Team lead; issue 8; integration and submission |
| Laksh | [lukshkumar38](https://github.com/lukshkumar38) | Issue 9: label-noise analysis and review strategy |
| Kartik | [kartikmaheshwari01](https://github.com/kartikmaheshwari01) | Issue 13: TuneWave data structures, tests and demo |

## Solutions and requirement coverage

| Issue | Deliverables | Documentation |
| --- | --- | --- |
| [8: Debugging, Attention Gradients & Evaluation](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8) | Training bug analysis and precise fixes; NumPy attention forward/backward with all five gradients; numerical checks; fraud evaluation design; learning-curve diagnoses. Includes an additional controlled synthetic training experiment. | [Run guide](issue-08-attention-evaluation/README.md), [technical report](issue-08-attention-evaluation/REPORT.md) |
| [9: Noisy Labels: HelpDeskNet-50K](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/9) | Noise estimate and confidence interval; tier comparison; systematic-error analysis; six-class accuracy derivation; a 2,000-ticket expert-review plan; two robust-training proposals and independent evaluation design. | [Run guide](issue-09-noisy-labels/README.md), [analysis and calculations](issue-09-noisy-labels/REPORT.md) |
| [13: TuneWave Music Player](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/13) | Doubly linked playlist with ID lookup; repeat/navigation/removal; FIFO Up Next; bounded history stack; title BST and pruned prefix search; undirected artist graph and two-hop recommendations. | [Run guide, behavior and complexity](issue-13-tunewave/README.md) |

## Technologies

Python 3.11 or later, NumPy, and Python's standard library, including `unittest`, `collections`, `dataclasses`, `statistics` and `math`. We tested with Python 3.11.9 and NumPy 2.4.6. Only issue 8 needs NumPy. AWS credentials, Docker, a GPU and external APIs are not needed to run these solutions.

## Setup

Clone our team branch and open the team folder:

```powershell
git clone --branch team-loop https://github.com/mokashkumar1/HacktoberFest-3.0.git
cd HacktoberFest-3.0/submission/team-loop
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

If the repository is already cloned, open `submission/team-loop` in that checkout. Reuse the environment if it already exists. All commands below start in this team folder; no environment activation is required. On macOS or Linux, create the environment with `python3` and replace `.\.venv\Scripts\python.exe` with `.venv/bin/python`.

## Verify all three solutions

Run each command and check that it succeeds:

```powershell
.\.venv\Scripts\python.exe issue-08-attention-evaluation/verify.py
.\.venv\Scripts\python.exe issue-09-noisy-labels/verify.py
.\.venv\Scripts\python.exe -m unittest discover -s issue-13-tunewave -p "test_*.py" -v
```

The suites contain **78 tests**: 32 for issue 8, 16 for issue 9, and 30 for TuneWave. Issue 8 also checks 15 attention gradient arrays across unmasked, causal and custom-mask cases, plus the saved experiment's dataset, split integrity and result arithmetic. Issue 9 compares freshly calculated results with its saved JSON. [VERIFICATION.txt](VERIFICATION.txt) records the final local verification and demo output.

To run the music-player demo:

```powershell
.\.venv\Scripts\python.exe issue-13-tunewave/demo.py
```

To inspect the label-noise calculations:

```powershell
.\.venv\Scripts\python.exe issue-09-noisy-labels/calculations.py
```

## Training experiment and evidence

Issue 8 includes a generated dataset of 10,000 rows and 40 features, with disjoint 6,000/2,000/2,000 train/validation/test splits. Ten predetermined pipeline variants were trained for 50 epochs across three seeds. Mean test accuracy was **48.82% for the faulty baseline** and **89.62% with all four corrections**, a difference of 40.80 percentage points on this synthetic task. The test majority-class baseline was 53.70%.

The experiment uses a handwritten NumPy equivalent of the supplied model. It does not reproduce or establish an improvement on the organizer's original 55% example. The report retains neutral ablations and describes the controls and limitations.

The full dataset, generation metadata, 30 run results and learning curves are in [experiment_results](issue-08-attention-evaluation/experiment_results). Attention checks and test evidence are in [results](issue-08-attention-evaluation/results). For issue 9, [CALCULATIONS.json](issue-09-noisy-labels/CALCULATIONS.json) stores the full-precision calculations.

Replay one faulty/corrected pair and compare it with the saved results:

```powershell
.\.venv\Scripts\python.exe issue-08-attention-evaluation/verify_experiment.py --rerun-seed 7
```

Reproduce all 30 training runs:

```powershell
.\.venv\Scripts\python.exe issue-08-attention-evaluation/synthetic_training.py
```

The full experiment replaces its recorded output. Use `--epochs 10 --output experiment_trial` for a separate trial rather than replacing the full-run evidence with a shorter experiment.

## Scope and limitations

Issue 9 analyzes supplied aggregate data. Its 15% crowd/expert disagreement estimate has a Wilson 95% interval of 11.83% to 18.83%. The 96.34% implied true accuracy is a calculation under the six-class uniform-noise assumption, not a measured model result. Ticket review and robust training are proposals; no ticket-level dataset or classifier was supplied.

Fraud evaluation, label-delay handling and the learning-curve distinguishing experiments are documented designs. No real fraud detector was trained. Attention is a separate NumPy implementation; fully masked rows are rejected, causal attention is square, and FlashAttention is explained rather than implemented.

TuneWave models playback without playing audio. It is in memory, with no database or concurrency support. Playlist removal preserves the catalog, queued songs and history. Its BST is unbalanced, so worst-case search is linear. The issue README defines all boundary behavior.

## Attribution

We used coding-assistant support while developing and reviewing the submission. The team remains responsible for understanding and explaining it. The technical reports cite the organizer tasks and references used. Only source code, technical documentation, tests and reproducible evidence are included here; our private presentation study PDF is not part of the submission.
