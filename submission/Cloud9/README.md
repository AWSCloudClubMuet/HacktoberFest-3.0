# Team Cloud9 — HacktoberFest 3.0 Hackathon Submission
## Multi-Track Machine Learning Engineering & Data-Centric AI

---

## 👥 Team Overview
- **Team Name:** Cloud9
- **Repository Branch:** `Cloud9`
- **Submission Directory:** `submission/Cloud9`
- **Team Lead:** Saad
- **Members:** Anus, Workspace Collaborator
- **Team Repository:** [https://github.com/Saad-AI14/Cloud9](https://github.com/Saad-AI14/Cloud9)

---

## 📂 Project Architecture

Our team submission encompasses two full, end-to-end production machine learning projects:

```
submission/Cloud9/
├── README.md                                                        # Master Submission Overview
│
├── project1_Debugging, Attention Gradients & Evaluation/            # Project 1 (ML Debugging & Attention Gradients)
│   ├── README.md                                                    # Project 1 Guide & Architecture
│   ├── task1_debugging/
│   │   ├── ANALYSIS.md                                              # Comprehensive Bug Diagnostics Report
│   │   └── solution.py                                              # Buggy Reproduction, Fixed Pipeline & Tests
│   ├── task2_attention_gradients/
│   │   ├── DERIVATIONS_AND_ANALYSIS.md                              # Matrix Calculus Derivations & Memory Analysis
│   │   └── attention.py                                             # NumPy Attention Forward/Backward & Checks
│   ├── task3_evaluation_fraud/
│   │   ├── FRAUD_EVALUATION_STRATEGY.md                             # Realistic Evaluation Strategy under Latency
│   │   └── fraud_evaluation.py                                      # Cost-Optimal Threshold & Drift Tracking
│   └── task4_learning_curves/
│       └── LEARNING_CURVE_DIAGNOSTICS.md                            # Learning Curve Diagnostics (Cases A-D)
│
└── project2_label_noise/                                            # Project 2 (HelpDeskNet-50K Label Noise)
    ├── README.md                                                    # Project 2 Master Summary
    ├── milestone1_analysis.py                                       # Milestone 1 Code (Noise CI & Z-Test)
    ├── MILESTONE1_QUANTIFY_LABEL_NOISE.md                           # Milestone 1 Report
    ├── milestone2_characterize_noise.py                             # Milestone 2 Code (Error Taxonomy & Goodness-of-Fit)
    ├── MILESTONE2_CHARACTERIZE_NOISE.md                             # Milestone 2 Report
    ├── milestone3_accuracy_ceiling.py                               # Milestone 3 Code (Accuracy Ceiling & Inversion)
    ├── MILESTONE3_ACCURACY_CEILING.md                               # Milestone 3 Report
    ├── milestone4_bad_labels.py                                     # Milestone 4 Code (Active Relabeling Simulation)
    ├── MILESTONE4_FIND_BAD_LABELS.md                                # Milestone 4 Report
    ├── milestone5_mitigation_eval.py                                # Milestone 5 Code (Symmetric CE & Co-Teaching)
    └── MILESTONE5_MITIGATE_AND_EVALUATE.md                          # Milestone 5 Report
```

---

## 🌟 Project 1: ML Debugging, Attention Gradients & Evaluation

Detailed documentation is available in [`project1_Debugging, Attention Gradients & Evaluation/README.md`](./project1_Debugging,%20Attention%20Gradients%20&%20Evaluation/README.md).

### 1. Milestone 1: Tabular Binary Classifier Debugging
- **Core Diagnosis:** Uncovered five critical pipeline bugs: in-place feature shuffling without labels, missing `model.eval()`, misplaced exponential learning rate scheduler, data leakage in `StandardScaler`, and inverted Dropout/BatchNorm ordering.
- **Deliverables:**
  - Diagnostic Report: [`ANALYSIS.md`](./project1_Debugging,%20Attention%20Gradients%20&%20Evaluation/task1_debugging/ANALYSIS.md)
  - Code & Verification: [`solution.py`](./project1_Debugging,%20Attention%20Gradients%20&%20Evaluation/task1_debugging/solution.py)

### 2. Milestone 2: Single-Head Attention Gradients & Implementation
- **Mathematical Derivations:** Exact matrix calculus for $\mathrm{d}Q, \mathrm{d}K, \mathrm{d}V, \mathrm{d}S, \mathrm{d}P$ with safe softmax shift and causal masking.
- **Numerical Verification:** NumPy implementation verified with two-sided numerical gradient checking ($\text{error} < 10^{-7}$).
- **Deliverables:**
  - Complete Derivations: [`DERIVATIONS_AND_ANALYSIS.md`](./project1_Debugging,%20Attention%20Gradients%20&%20Evaluation/task2_attention_gradients/DERIVATIONS_AND_ANALYSIS.md)
  - NumPy Implementation: [`attention.py`](./project1_Debugging,%20Attention%20Gradients%20&%20Evaluation/task2_attention_gradients/attention.py)

### 3. Milestone 3: Realistic Fraud Detection Evaluation Strategy
- **Evaluation Strategy:** Out-of-Time (OOT) temporal split with 60-day embargo buffer for delayed labels.
- **Cost-Optimal Threshold:** Derived $p^* = \frac{C_{\text{FP}}}{C_{\text{FP}} + C_{\text{FN}}} = \frac{5}{5 + 200} = \mathbf{2.44\%}$.
- **Deliverables:**
  - Strategy Report: [`FRAUD_EVALUATION_STRATEGY.md`](./project1_Debugging,%20Attention%20Gradients%20&%20Evaluation/task3_evaluation_fraud/FRAUD_EVALUATION_STRATEGY.md)
  - Simulation & PSI Code: [`fraud_evaluation.py`](./project1_Debugging,%20Attention%20Gradients%20&%20Evaluation/task3_evaluation_fraud/fraud_evaluation.py)

### 4. Milestone 4: Learning Curve Diagnostics
- **Diagnostics:** Comprehensive analysis of Underfitting (Case A), Overfitting (Case B), Optimization Instability (Case C), and Validation Loss < Training Loss (Case D) with a Symmetric Evaluation Protocol.
- **Deliverables:**
  - Report: [`LEARNING_CURVE_DIAGNOSTICS.md`](./project1_Debugging,%20Attention%20Gradients%20&%20Evaluation/task4_learning_curves/LEARNING_CURVE_DIAGNOSTICS.md)

---

## 🌟 Project 2: HelpDeskNet-50K — Label Noise & Robust Strategy

Detailed documentation is available in [`project2_label_noise/README.md`](./project2_label_noise/README.md).

### 1. Milestone 1: Quantify Label Noise
- **Analysis:** Estimated empirical crowd noise rate $\hat{p} = \mathbf{15.00\%}$ with 95% Wald CI $[11.50\%, 18.50\%]$ and Wilson CI $[11.83\%, 18.83\%]$.
- **Significance Test:** Proved Tier B (21.82% error) is significantly noisier than Tier A (6.67% error) at $z = 4.2220$, $p = 2.42 \times 10^{-5}$ ($\chi^2 = 17.83$).
- **Deliverables:**
  - Report: [`MILESTONE1_QUANTIFY_LABEL_NOISE.md`](./project2_label_noise/MILESTONE1_QUANTIFY_LABEL_NOISE.md)
  - Code: [`milestone1_analysis.py`](./project2_label_noise/milestone1_analysis.py)

### 2. Milestone 2: Characterize the Noise
- **Analysis:** Proved noise is non-random ($\chi^2 = 222.00, p < 10^{-15}$). Top error clusters: `Billing` $\leftrightarrow$ `Refund` (43.33%) and `Technical` $\leftrightarrow$ `Account Access` (25.00%). Formulated annotation guidelines and decision trees.
- **Deliverables:**
  - Report: [`MILESTONE2_CHARACTERIZE_NOISE.md`](./project2_label_noise/MILESTONE2_CHARACTERIZE_NOISE.md)
  - Code: [`milestone2_characterize_noise.py`](./project2_label_noise/milestone2_characterize_noise.py)

### 3. Milestone 3: Reason About the Accuracy Ceiling
- **Analysis:** Inverted uniform noise equation to derive latent true accuracy $A_{\text{true}} = \frac{79}{82} \approx \mathbf{96.34\%}$. Detailed 5 failure modes of naive inversion (correlated model-human errors, asymmetric noise, biased boundaries).
- **Deliverables:**
  - Report: [`MILESTONE3_ACCURACY_CEILING.md`](./project2_label_noise/MILESTONE3_ACCURACY_CEILING.md)
  - Code: [`milestone3_accuracy_ceiling.py`](./project2_label_noise/milestone3_accuracy_ceiling.py)

### 4. Milestone 4: Find the Bad Labels (2,000 Review Budget)
- **Strategy:** Allocated 1,000 tickets to pure gold test/validation and 1,000 tickets to active Confident Learning relabeling. Achieved 4.80× lift (~1,440 errors found vs. 300 under random selection).
- **Deliverables:**
  - Report: [`MILESTONE4_FIND_BAD_LABELS.md`](./project2_label_noise/MILESTONE4_FIND_BAD_LABELS.md)
  - Code: [`milestone4_bad_labels.py`](./project2_label_noise/milestone4_bad_labels.py)

### 5. Milestone 5: Mitigate Noise & Evaluate Reliably
- **Strategy:** Implemented Symmetric Cross-Entropy ($\mathcal{L}_{\text{SCE}}$), Forward Loss Correction via transition matrix $T$, and Co-Teaching sample retention schedules. Designed a 100% expert gold evaluation protocol and explained test set ranking inversion.
- **Deliverables:**
  - Report: [`MILESTONE5_MITIGATE_AND_EVALUATE.md`](./project2_label_noise/MILESTONE5_MITIGATE_AND_EVALUATE.md)
  - Code: [`milestone5_mitigation_eval.py`](./project2_label_noise/milestone5_mitigation_eval.py)

---

## 💻 Setup & Verification

```bash
# Verify Project 1:
python "submission/Cloud9/project1_Debugging, Attention Gradients & Evaluation/task1_debugging/solution.py"
python "submission/Cloud9/project1_Debugging, Attention Gradients & Evaluation/task2_attention_gradients/attention.py"
python "submission/Cloud9/project1_Debugging, Attention Gradients & Evaluation/task3_evaluation_fraud/fraud_evaluation.py"

# Verify Project 2:
python "submission/Cloud9/project2_label_noise/milestone1_analysis.py"
python "submission/Cloud9/project2_label_noise/milestone2_characterize_noise.py"
python "submission/Cloud9/project2_label_noise/milestone3_accuracy_ceiling.py"
python "submission/Cloud9/project2_label_noise/milestone4_bad_labels.py"
python "submission/Cloud9/project2_label_noise/milestone5_mitigation_eval.py"
```
