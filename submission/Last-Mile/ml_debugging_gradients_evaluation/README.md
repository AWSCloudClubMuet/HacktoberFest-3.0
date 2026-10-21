# Machine Learning Debugging, Gradients & Evaluation

Complete project package covering all four milestones:
1. Debugging a silently failing PyTorch training run.
2. Deriving, implementing, and numerically checking attention gradients.
3. Designing evaluation for delayed-label, imbalanced fraud detection.
4. Diagnosing learning curves.

## Requirements

Python 3.9+ recommended.

```bash
pip install -r requirements.txt
```

## Run the attention gradient check

```bash
python milestone2/attention_numpy.py
```

The script uses NumPy float64, central finite differences with step size `1e-5`, and asserts maximum absolute gradient error below `1e-7`.

## Run the training pipeline example

```bash
python milestone1/train_classifier.py --synthetic
```

The synthetic option generates a small reproducible binary classification dataset so the example can run without external files. For your own data, edit the loading section or adapt `run_training(X, y)`.

## Contents

- `milestone1/train_classifier.py`: corrected training pipeline and evaluation metrics.
- `milestone1/debugging_checklist.md`: likely bugs, symptoms, and black-box experiments.
- `milestone2/attention_numpy.py`: forward/backward attention and finite-difference gradient checks.
- `milestone2/attention_notes.md`: derivation, stability, masking, scaling, and memory discussion.
- `milestone3/fraud_evaluation.md`: split design, metrics, threshold derivation, calibration, delayed labels, and drift.
- `milestone4/learning_curves.md`: diagnosis and experiments for cases A–D.
- `report.md`: consolidated technical report.

Note: the provided training script uses an IID stratified split for demonstration. For time-dependent or account-grouped data, replace it with an appropriate chronological or group split.
