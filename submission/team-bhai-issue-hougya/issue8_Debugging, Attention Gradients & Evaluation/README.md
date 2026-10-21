# Issue #8: ML Debugging, Attention Gradients & Production Evaluation

**Contributor:** Syed Abdullah Ali
**Team:** `team-bhai-issue-hougya`
**Reference:** [Issue #8 — ML Debugging, Attention Gradients & Evaluation](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8)

---

## Overview

This project tackles four foundational machine learning engineering challenges:
1. Debugging a model where training loss falls while validation accuracy stalls at coin-flip performance (55%).
2. Deriving and implementing numerically stable scaled dot-product attention forward and backward passes from scratch in NumPy, verified with central difference gradient checks.
3. Designing an evaluation and monitoring framework for a production credit card fraud detection system with extreme class imbalance and delayed labels.
4. Diagnosing learning curve pathologies and separating distribution shift from label noise with a concrete experiment.

For full mathematical proofs, step-by-step derivations, and complete output logs, see **[ANALYSIS.md](ANALYSIS.md)**.

---

## Milestone Breakdown

### Milestone 1 — Debugging the Silently Failing Training Run

**Symptom:** Training loss decreases steadily, but validation accuracy hovers around 55% and fluctuates wildly between epochs.

**Root-Cause Diagnosis (7 Bugs Found):**

| # | Bug | Actual Impact | Fix |
|---|---|---|---|
| 1 | `np.random.shuffle(X_tr)` shuffles features without labels | Model trains on decoupled, random labels. Train loss overfits arbitrary noise while validation stays at chance (55%). | Shuffle features and labels synchronously using PyTorch `DataLoader(shuffle=True)`. |
| 2 | Validation loop runs in training mode without `torch.no_grad()` | Dropout remains active and running batch statistics absorb validation data, causing noisy evaluation. | Wrap validation loop in `model.eval()` and `with torch.no_grad():`. |
| 3 | `scheduler.step()` placed inside the mini-batch loop | Learning rate decays 0.9x every batch (reaching 1.9e-9 by batch 64), choking model updates after epoch 1. | Call `scheduler.step()` once per epoch after validation. |
| 4 | Features loaded as `float64` | PyTorch linear layers expect `float32`, triggering runtime dtype mismatches. | Cast features explicitly to `torch.float32` and labels to `torch.long`. |
| 5 | Data scaler fit on the combined dataset before train/val split | Future validation statistics leak into training set. | Split data first; fit scaler exclusively on training split. |
| 6 | First 8,000 rows arbitrarily sliced for training | Introduces severe sampling bias if the source file was sorted by date or class. | Use a stratified, randomized split. |
| 7 | Dropout applied before BatchNorm | Changing variance at inference breaks BatchNorm's learned shift/scale parameters. | Order layers correctly: Linear -> BatchNorm -> ReLU -> Dropout. |

**Verification:**
The corrected pipeline is implemented in `m1_train_fixed.py`. On benchmark data, it eliminates the 55% plateau and reaches **95.4%** validation accuracy with early stopping.

---

### Milestone 2 — Attention Gradients from Scratch

Implemented multi-head attention forward and backward passes in pure NumPy without auto-differentiation libraries.

**Derived Analytical Gradients:**
```text
dV = P^T @ dO
dP = dO @ V^T
D  = rowsum(P * dP)
dS = P * (dP - D)
dQ = (dS @ K) / √d
dK = (dS^T @ Q) / √d
```

**Key Engineering Validations:**
- **Numerical Gradient Checks (`gradcheck.py`):** Verified analytical backward pass using two-sided central differences in `float64` with step size `h = 1e-6`. Maximum relative error across all tensors was `1.6e-8` (well below the `1e-7` pass threshold). Running in `float32` yields relative errors of 0.13 to 0.45, confirming float64 precision is strictly required for gradient verification.
- **Numerical Stability:** Subtracted row-wise maxima (`x - max(x)`) before computing `exp()` to prevent overflow (`NaN`).
- **1/√d Scaling Analysis:** Without scaling by `1/√d`, logit variance scales linearly with dimension `d`. At `d = 1024`, softmax saturates (max probability reaches 0.95) and gradient magnitude `||dS||` drops from 29.0 to 8.5 (vanishing gradients). Scaling by `1/√d` maintains unit variance and stable gradients.
- **Causal Masking:** Validated that masking before softmax sets attention weights `P = 0`, ensuring `dS = 0` and future tokens have strictly zero gradient impact on past positions.
- **Memory Footprint:** Highlighted the quadratic O(n^2) memory bottleneck of storing intermediate attention matrices `S` and `P` (16 GiB at sequence length 64k) and implemented a tiled forward pass matching FlashAttention's online softmax algorithm to within `1e-15` precision.

---

### Milestone 3 — Fraud Detection System Evaluation

Designed a production evaluation framework for an asymmetric, low-prevalence transaction stream (0.1% fraud rate):

- **Target Metrics:** Avoid raw accuracy (a dumb model predicting "never fraud" scores 99.9% while catching zero fraud). Avoid standalone ROC-AUC where a 1% false positive rate still flags 93 innocent users for every 7 real fraudsters. Prioritize **PR-AUC**, **Recall at a fixed daily analyst review budget**, and **Total Dollar Expected Loss**.
- **Temporal Splitting:** Random train/test splits cause future leakage. Use strict out-of-time splits with a 60-day buffer to account for chargeback discovery lag: Train on Year 1, leave 60 days buffer, validate on Months 3-4, test on Months 5-6.
- **Cost-Optimal Operating Threshold:**
  Setting average false-positive friction cost at $5 and average prevented fraud loss at $200:
  `p * $200 > (1 - p) * $5  =>  p > 2.44%`
  Transactions with predicted fraud probability above 2.44% should be flagged or blocked. Calibrated probabilities using isotonic regression.
- **Concept Drift Monitoring:** Monitor Population Stability Index (PSI) on score distributions and track alert volume daily; verify precision/recall once delayed labels mature at 60 days.

---

### Milestone 4 — Learning Curve Diagnostics

| Case | Training / Validation Performance | Diagnosis | Prescribed Remediation |
|---|---|---|---|
| **A** | 62% / 60%, both flat across epochs | High Bias (Underfitting) | Increase model capacity, add non-linear features, reduce regularization. |
| **B** | 99% / 78%, validation gap narrows slowly | High Variance (Overfitting) | Add weight decay, dropout, data augmentation, early stopping, or gather more samples. |
| **C** | 85% / 91% (Validation outperforms Training) | Evaluation Artifact / Leakage | Check for test data leakage in training set; ensure training metrics are re-evaluated in `eval()` mode without active dropout. |
| **D** | 88% / 70%, gap remains wide with 4x data | Structural Data Pathology | Not a dataset size issue. Differentiate between covariate shift and noisy labels using the pooled split experiment below. |

**Disentangling Case D (Distribution Shift vs. Label Noise):**
Pool training and validation sets together, shuffle, re-split 50/50, and retrain.
- If the validation gap vanishes, the problem was **distribution shift** (train and validation originated from different populations).
- If the gap persists, the problem is **label noise** (systematic mislabeling across both splits).

---

## Reproduction Instructions

### 1. Environment Setup
```bash
cd "submission/team-bhai-issue-hougya/issue8_Debugging, Attention Gradients & Evaluation"
pip install -r requirements.txt
```

### 2. Run All Validations
```bash
# Run Milestone 1 corrected training pipeline (reaches 95.4% val accuracy)
python m1_train_fixed.py

# Run Milestone 2 gradient checks and step-size sweep (generates h_sweep.png)
python gradcheck.py

# Run Milestone 2 stability, scaling, causal, and memory experiments
python experiments.py
```
All random seeds are explicitly fixed, guaranteeing identical numbers to those reported in `ANALYSIS.md`.
