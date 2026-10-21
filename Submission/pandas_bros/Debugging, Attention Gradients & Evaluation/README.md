# Debugging, Attention Gradients & Evaluation


Solutions to a four-part machine learning challenge:

1. Debug a training run that silently fails.
2. Derive and implement the gradients of attention.
3. Design an evaluation strategy for a fraud detector.
4. Diagnose learning curves.

Each milestone has its own file. Click a link below to read it.

---

## Files

| Milestone | Topic | Files |
|---|---|---|
| 1 | Debugging a silently failing training run | [Milestone_1_Solution.ipynb](Milestone_1_Solution.ipynb) |
| 2 | Attention gradients and gradient check | [Milestone_2_Solution.md](Milestone_2_Solution.md) (write-up), [Milestone_2_code.ipynb](Milestone_2_code.ipynb) (code) |
| 3 | Fraud detector evaluation strategy | [Milestone_3_Solution.md](Milestone_3_Solution.md) |
| 4 | Diagnosing learning curves | [Milestone_4_Solution.md](Milestone_4_Solution.md) |

---

## Summary of each milestone

### Milestone 1: Debugging a silently failing training run
**Problem:** a binary classifier on 10,000 rows shows falling training loss, but validation accuracy stays near 55%.

**Main findings:**
- The scaler was fit on all data before the split, so validation data leaked into preprocessing.
- `np.random.shuffle(X_tr)` shuffled the features but not the labels, so every row got the wrong label. This is the main reason the model cannot learn.
- BatchNorm was placed after Dropout, which causes a mismatch between training and evaluation.
- Other risks: wrong label format, dtype and device problems, and class imbalance.

**Fixes in the corrected code:**
- Split first (stratified), then fit the scaler on the training data only.
- Use the `DataLoader` to shuffle, so features and labels stay together.
- Use the order Linear → BatchNorm → ReLU → Dropout.
- Convert inputs to `float32` and labels to `long`.
- Step the learning-rate scheduler once per epoch, not once per batch.
- Use `model.eval()` and `torch.inference_mode()` for validation.
- Report accuracy, balanced accuracy and F1.

**Quick experiments** that find pipeline problems without seeing the code: majority-class baseline, label-permutation test, small-subset overfit test, repeated runs with different seeds, feature-label alignment test, learning-rate test, validation-mode test, and a train-vs-validation distribution check.

### Milestone 2: Attention gradients
**Setup:** `S = QKᵀ/√d`, `P = softmax(S)`, `O = PV`.

**Gradients (given `dO`):**
- `dV = Pᵀ·dO`
- `dP = dO·Vᵀ`
- `dS = P ∘ (dP − rowsum(dP ∘ P))`
- `dQ = dS·K/√d`
- `dK = dSᵀ·Q/√d`

**Gradient check:** central differences with step size `h = 1e-6`, `float64`, accepted if the relative error is below `1e-6`. The worst error over 40 random configurations was **1.85e-9**, with and without the causal mask.

**Other topics covered in the write-up:**
- Stability: subtract the row maximum before `exp` to avoid overflow.
- Why divide by `√d`: it keeps the score variance near 1, so softmax does not saturate.
- Causal mask: the backward formulas stay the same, and masked positions get exactly zero gradient.
- Memory: standard attention needs O(n²) memory, while FlashAttention-style tiling needs only O(n) extra, with matching results.

### Milestone 3: Fraud detector evaluation
**Setup:** 0.1% fraud, labels arrive 30–60 days late, a missed fraud costs $200 and a false alarm costs $5.

- **Metrics to use:** PR-AUC, precision and recall at a fixed alert limit, total cost, log loss and Brier score.
- **Metrics to avoid:** accuracy, ROC-AUC alone, F1 at the 0.5 threshold.
- **Split:** by time (train → 60-day gap → validation → 60-day gap → test), never random.
- **Label delay:** evaluate only on transactions with final labels, use early signals, run new models in shadow mode, and keep a small random sample of blocked transactions.
- **Threshold:** flag a transaction when the fraud probability is above 5/205 ≈ **0.0244 (about 2.4%)**. This only works if the probabilities are calibrated, so check calibration with a reliability diagram, Brier score and log loss.
- **Drift:** watch score and feature distributions, then retrain on a schedule or when drift alerts fire or cost rises.

### Milestone 4: Learning curves

| Case | Diagnosis |
|---|---|
| A (62% / 60%, flat) | Underfitting (high bias): use a stronger model or better features. |
| B (99% / 78%) | Overfitting (high variance): add data, regularization, augmentation. |
| C (85% / 91%) | Validation higher than train is unusual: check dropout/eval mode and the split for leakage. |
| D (88% / 70%, gap stays) | Distribution shift or label noise/leakage in train. A held-out slice of the training distribution (train-dev set) tells them apart. |

---

## How to run the code

**Requirements:** Python 3, `numpy`, `torch`, `scikit-learn`

```bash
pip install numpy torch scikit-learn
```

- **Milestone 1:** the notebook expects `X` (10,000 rows × 40 features) and `y` (labels 0 or 1) to be defined before you run the corrected code. The code was smoke-tested on synthetic data of the same shape. It has not been run on the original dataset.
- **Milestone 2:** open [Milestone_2_code.ipynb](Milestone_2_code.ipynb) and run all cells. It prints the gradient check, the stability demo, the `1/√d` experiment, the causal-mask check, the tiled-vs-standard comparison and the memory table.

---

## Notes and assumptions

- Milestone 1 assumes `loss_fn = nn.CrossEntropyLoss()` and a `train_loader` built from the training split, because those parts of the original code were not shown.
- The Milestone 3 threshold assumes correct decisions cost $0.
- The PSI alert levels mentioned in Milestone 3 (about 0.1 and 0.25) are common rules of thumb. They are not from a verified source, so tune them on real data.
- The Milestone 4 diagnoses are inferred from the accuracy numbers alone and should be confirmed with the checks described there.