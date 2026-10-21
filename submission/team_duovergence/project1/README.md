# Debugging, Attention Gradients & Evaluation

Machine learning debugging, attention gradients, evaluation design and learning-curve diagnosis. The task is a mix of written analysis and code, in four milestones.

## What is in this folder

| File | What it is | Needs |
|---|---|---|
| `ANALYSIS.md` | The written technical analysis for all four milestones | none |
| `attention.py` | NumPy single-head attention: forward, backward, causal mask, gradient check, tiled FlashAttention-style version | numpy |
| `milestone1_fixed.py` | Corrected PyTorch training script for Milestone 1 | torch, scikit-learn, numpy |
| `milestone1_evidence.py` | Reproduces the main bugs and the numbers behind the analysis | numpy, scikit-learn |

## Milestones at a glance

**1. Debugging a silently failing training run.** Nine problems found. The main ones:
- `np.random.shuffle(X_tr)` shuffles features but not labels, so each row is paired with the wrong label. Training loss still falls while validation stays at chance.
- Validation is run without `model.eval()` and `torch.no_grad()`, so dropout stays on and BatchNorm uses batch statistics. This makes validation accuracy noisy.
- `scheduler.step()` is called every batch, so the learning rate shrinks by 10% per batch instead of per epoch.
- Smaller issues: scaler fitted on all data (leakage), Dropout placed before BatchNorm, unshuffled split, dtype mismatches, a small validation set.

The analysis also lists quick experiments that reveal such problems without seeing the code (shuffled-label test, overfitting a tiny batch, simple baselines, adversarial validation).

**2. Attention gradients.** Derivation, implementation and numerical check:
- `dV = PᵀdO`, `dP = dOVᵀ`, `dS = P ⊙ (dP − rowsum(dP ⊙ P))`, `dQ = dSK/√d`, `dK = dSᵀQ/√d`
- Gradient check: float64, central differences, step size `1e-5`, acceptance threshold relative error `< 1e-6`. Observed errors are about `1e-9`, with and without the causal mask.
- Stability fix: subtract the row maximum before the exponential.
- Also covered: why the `1/√d` scale is used, the effect of a causal mask on the backward pass, and the O(n²) memory cost with how FlashAttention avoids it.
- `attention.py` includes a tiled version that never builds the n×n matrix. It matches the standard version to about `5e-16` for the output and all gradients.

**3. Fraud-detector evaluation** (0.1% fraud, labels delayed 30 to 60 days):
- Use PR-AUC, precision or recall at a fixed alert budget, and expected cost. Avoid accuracy and ROC-AUC as the main metric.
- Split by time, group by card, and leave a gap for label maturity.
- Cost-based threshold: flag when `p × 200 > (1 − p) × 5`, so `p > 5/205 ≈ 2.4%`, valid only if scores are calibrated.
- Drift monitoring with PSI and matured-label performance, with retraining triggers.

**4. Learning curves:**
- A: high bias (underfitting).
- B: high variance (overfitting).
- C: validation above training, so check the measurement and the split first.
- D: gap persists with 4× data. Candidates are distribution shift, label noise or leakage. The distinguishing experiment is a train-dev hold-out from the training distribution.

## How to run

```bash
python attention.py            # gradient checks, tiled-vs-standard check, memory table
python milestone1_evidence.py  # bug reproduction (sklearn, no PyTorch needed)
python milestone1_fixed.py     # corrected training run (needs PyTorch)
```

`attention.py` finishes with an assertion that fails if any check does not pass.

## Verification status

- `attention.py`: run and passing.
- `milestone1_evidence.py`: run. With X shuffled but y not, an equivalent MLP reaches 48.7% validation accuracy while training loss falls (0.71 to 0.50). With correct pairing it reaches 86.6%. This uses synthetic data and scikit-learn, not the original PyTorch code.
- `milestone1_fixed.py`: **not run.** PyTorch could not be installed in the environment where this was built. It was reviewed line by line only. Run it before relying on it.
- The original dataset and `train_loader` were not provided, so the fixed script uses synthetic data. Replace the data block with the real `X` and `y`.

## Assumptions

- The batch size in the original code is unknown. How fast the per-batch scheduler collapses the learning rate depends on it. With batch size 64 the rate is about `2e-9` after the first epoch.
- Fraud cost figures ($200 for a missed fraud, $5 for a false alarm) are taken as averages from the task.
