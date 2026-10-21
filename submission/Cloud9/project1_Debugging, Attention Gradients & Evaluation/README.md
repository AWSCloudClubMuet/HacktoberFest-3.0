# Project 1: Machine Learning Debugging, Attention Gradients & Robust Evaluation

**Team:** Cloud9  
**Submission Directory:** `submission/Cloud9/project1_Debugging, Attention Gradients & Evaluation/`  
**Parent Overview:** [`../README.md`](../README.md)

---

## 📂 Project Architecture

```
project1_Debugging, Attention Gradients & Evaluation/
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

## 🎯 Task Summaries

### Task 1: Tabular Binary Classifier Debugging
- Identifies critical bugs: in-place feature shuffle without label alignment, missing `model.eval()`, misplaced LR scheduler, data leakage in `StandardScaler`, and inverted Dropout/BatchNorm ordering.
- Code & Tests: [`task1_debugging/solution.py`](./task1_debugging/solution.py) | Report: [`task1_debugging/ANALYSIS.md`](./task1_debugging/ANALYSIS.md)

### Task 2: Single-Head Attention Gradients & Implementation
- Exact analytical matrix calculus derivations for $\mathrm{d}Q, \mathrm{d}K, \mathrm{d}V, \mathrm{d}S, \mathrm{d}P$.
- NumPy implementation verified with two-sided numerical gradient checking ($\text{error} < 10^{-7}$).
- Code: [`task2_attention_gradients/attention.py`](./task2_attention_gradients/attention.py) | Derivations: [`task2_attention_gradients/DERIVATIONS_AND_ANALYSIS.md`](./task2_attention_gradients/DERIVATIONS_AND_ANALYSIS.md)

### Task 3: Realistic Fraud Detection Evaluation Strategy
- Addresses 0.1% fraud prevalence, 30-60 day label latency, and non-stationary drift.
- Derives cost-optimal decision threshold ($p^* = 2.44\%$) and implements PSI drift tracking.
- Code: [`task3_evaluation_fraud/fraud_evaluation.py`](./task3_evaluation_fraud/fraud_evaluation.py) | Strategy: [`task3_evaluation_fraud/FRAUD_EVALUATION_STRATEGY.md`](./task3_evaluation_fraud/FRAUD_EVALUATION_STRATEGY.md)

### Task 4: Learning Curve Diagnostics
- In-depth diagnostics for Underfitting (Case A), Overfitting (Case B), Optimization Instability (Case C), and Validation Loss < Training Loss (Case D) with a rigorous Symmetric Evaluation Protocol.
- Diagnostics: [`task4_learning_curves/LEARNING_CURVE_DIAGNOSTICS.md`](./task4_learning_curves/LEARNING_CURVE_DIAGNOSTICS.md)

---

## 💻 Execution

```bash
python task1_debugging/solution.py
python task2_attention_gradients/attention.py
python task3_evaluation_fraud/fraud_evaluation.py
```
