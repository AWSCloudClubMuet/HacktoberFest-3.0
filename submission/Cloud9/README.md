# Team Cloud9 — HacktoberFest 3.0 Hackathon Submission
## Track: Machine Learning Debugging, Attention Gradients & Evaluation (Issue #8)

---

## 🏆 Team Overview
- **Team Name:** Cloud9
- **Repository Branch:** `Cloud9`
- **Submission Directory:** `submission/Cloud9`
- **Project Title:** End-to-End ML Diagnostics, Analytical Attention Gradients & Robust Production Evaluation

---

## 📌 Project Architecture & Milestone Structure

Our submission comprehensively solves all 4 milestones defined in **Issue #8**:

```
submission/Cloud9/
├── README.md                                   # Master Submission Overview
├── task1_debugging/
│   ├── ANALYSIS.md                             # Comprehensive Bug Identification & Diagnostics Report
│   └── solution.py                             # Buggy Reproduction, Fixed Pipeline & Black-Box Tests
├── task2_attention_gradients/
│   ├── DERIVATIONS_AND_ANALYSIS.md             # Complete Analytical Derivations & Memory Analysis
│   └── attention.py                            # NumPy Forward/Backward Implementation & Gradient Check
├── task3_evaluation_fraud/
│   ├── FRAUD_EVALUATION_STRATEGY.md            # Realistic Evaluation Strategy under Label Latency
│   └── fraud_evaluation.py                     # Cost-Optimal Threshold, Calibration & PSI Drift Code
└── task4_learning_curves/
    └── LEARNING_CURVE_DIAGNOSTICS.md           # Diagnostics for Cases A, B, C and Hypothesis Test for D
```

---

## 🚀 Summary of Solutions Across All 4 Milestones

### 1. Milestone 1: Tabular Binary Classifier Debugging
- **Core Problem:** Training loss steadily decreases, but validation accuracy remains stuck at ~55% and oscillates wildly between epochs.
- **Root Causes Discovered:**
  1. `np.random.shuffle(X_tr)` shuffles features in-place without shuffling `y_tr`, completely scrambling the correspondence between features and labels. The high-capacity network memorizes random noise (loss drops), but learns zero generalizable patterns (validation accuracy ~55%).
  2. Missing `model.eval()` and `torch.no_grad()` allows `Dropout(0.5)` to inject severe stochastic noise during validation and allows `BatchNorm1d` to mutate its running statistics on the validation slice.
  3. `scheduler.step()` executed inside the mini-batch loop causes exponential decay ($0.9^{125} \approx 10^{-6}$ per epoch), freezing learning prematurely.
  4. Feature scaling leakage (`StandardScaler().fit_transform(X)`) computed before the train/validation split.
  5. Inverted layer ordering (`Dropout` placed before `BatchNorm`).
- **Deliverables:**
  - Full diagnostic report in [`task1_debugging/ANALYSIS.md`](./task1_debugging/ANALYSIS.md).
  - Production-ready implementation with 4 black-box diagnostic tests in [`task1_debugging/solution.py`](./task1_debugging/solution.py).

---

### 2. Milestone 2: Single-Head Attention Gradients & Implementation
- **Mathematical Derivations:**
  - $\mathrm{d}V = P^\top \mathrm{d}O$
  - $\mathrm{d}P = \mathrm{d}O V^\top$
  - $\mathrm{d}S = P \odot \left( \mathrm{d}P - \left( (P \odot \mathrm{d}P) \mathbf{1} \right) \mathbf{1}^\top \right)$
  - $\mathrm{d}Q = \frac{1}{\sqrt{d}} \mathrm{d}S K$
  - $\mathrm{d}K = \frac{1}{\sqrt{d}} (\mathrm{d}S)^\top Q$
- **Numerical Verification:**
  - Implemented in NumPy using IEEE 754 `float64` double precision and two-sided central difference checking ($\epsilon = 1.0 \times 10^{-6}$).
  - Relative error threshold $< 1.0 \times 10^{-7}$ successfully verified for both standard and causal attention.
- **Analysis:**
  - Detailed the safe softmax shift trick to eliminate exponential overflow/underflow.
  - Derived why dot products scale with variance $d$, proving that $\frac{1}{\sqrt{d}}$ prevents softmax gradient saturation.
  - Formulated causal mask gradient zeroing $\mathrm{d}S = \mathrm{d}S \odot (1 - M)$.
  - Analyzed the $\mathcal{O}(n^2)$ memory bottleneck and explained how **FlashAttention** leverages SRAM tiling, online softmax, and gradient recomputation to achieve $\mathcal{O}(n)$ memory complexity.
- **Deliverables:**
  - Complete derivation and analysis in [`task2_attention_gradients/DERIVATIONS_AND_ANALYSIS.md`](./task2_attention_gradients/DERIVATIONS_AND_ANALYSIS.md).
  - Verified NumPy implementation in [`task2_attention_gradients/attention.py`](./task2_attention_gradients/attention.py).

---

### 3. Milestone 3: Realistic Fraud Detection Evaluation Strategy
- **Evaluation Dynamics:** 0.1% fraud prevalence, 30–60 day chargeback label latency, and non-stationary concept drift.
- **Metric Selection:**
  - **Avoid:** Accuracy (trivially 99.9% by predicting all zeros), ROC-AUC (distorted by enormous true-negative counts), and default 0.5 threshold F1.
  - **Use:** PR-AUC (Average Precision), Recall @ fixed operational investigation capacity, and business cost utility.
- **Split Design:** Out-of-Time (OOT) walk-forward temporal split with a mandatory 60-day embargo buffer.
- **Optimal Decision Threshold:**
  - Derived mathematically from cost asymmetry ($C_{\text{FN}} = \$200, C_{\text{FP}} = \$5$):
    $$p^* = \frac{C_{\text{FP}}}{C_{\text{FP}} + C_{\text{FN}}} = \frac{5}{5 + 200} = \mathbf{2.44\%}$$
- **Drift Monitoring:** Population Stability Index (PSI) and Jensen-Shannon Divergence on predicted score distributions to trigger automated retraining when $\text{PSI} > 0.25$ without waiting for delayed labels.
- **Deliverables:**
  - Strategic report in [`task3_evaluation_fraud/FRAUD_EVALUATION_STRATEGY.md`](./task3_evaluation_fraud/FRAUD_EVALUATION_STRATEGY.md).
  - Simulation and monitoring implementation in [`task3_evaluation_fraud/fraud_evaluation.py`](./task3_evaluation_fraud/fraud_evaluation.py).

---

### 4. Milestone 4: Learning Curve Diagnostics
- **Case A (Underfitting / High Bias):** Low model capacity or over-regularization. Intervention: Increase depth/width, reduce regularization, enrich features.
- **Case B (Overfitting / High Variance):** Generalization gap diverges. Intervention: Early stopping, increase dropout/weight decay, data augmentation.
- **Case C (Optimization Instability):** Erratic oscillations or divergence. Intervention: Lower learning rate, apply gradient clipping, introduce LayerNorm/BatchNorm.
- **Case D ($\mathcal{L}_{\text{val}} < \mathcal{L}_{\text{train}}$):**
  - Two plausible explanations: Regularization asymmetry (Dropout active during training, inactive during eval) vs. Validation sampling bias (easier validation split).
  - Decisive experiment: **Symmetric Evaluation Protocol** evaluating both train and validation sets in offline `model.eval()` mode with zero dropout and un-augmented data.
- **Deliverables:**
  - Diagnostic analysis in [`task4_learning_curves/LEARNING_CURVE_DIAGNOSTICS.md`](./task4_learning_curves/LEARNING_CURVE_DIAGNOSTICS.md).

---

## 💻 Setup & Execution

### Prerequisites
- Python 3.10+
- NumPy (`pip install numpy`)

### Running the Implementations

1. **Verify Attention Gradients & Numerical Checks (Task 2):**
   ```bash
   python task2_attention_gradients/attention.py
   ```

2. **Verify Fraud Cost Thresholding & Drift Monitoring (Task 3):**
   ```bash
   python task3_evaluation_fraud/fraud_evaluation.py
   ```

3. **Verify Pipeline Debugging & Diagnostics (Task 1):**
   ```bash
   python task1_debugging/solution.py
   ```
