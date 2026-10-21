# 🚀 Team Zyntra — HacktoberFest-Hackathon 2026 Submission

## 👥 Team Information
* **Team Name:** Team Zyntra
* **Track:** Machine Learning & Deep Learning Core Engineering (Problem 2)
* **Branch:** `Team_Zyntra`
* **Lead / Contributor:** Syed Fazeel (`fazeelahmed210@gmail.com`)

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Milestone 1 — Deep Learning Pipeline Debugging](#-milestone-1--deep-learning-pipeline-debugging)
3. [Milestone 2 — Derive and Implement an Attention Gradient](#-milestone-2--derive-and-implement-an-attention-gradient)
4. [Milestone 3 — Design an Evaluation Strategy for Fraud Detection](#-milestone-3--design-an-evaluation-strategy-for-fraud-detection)
5. [Milestone 4 — Diagnose Learning Curves & Experimental Protocol](#-milestone-4--diagnose-learning-curves--experimental-protocol)
6. [Repository Structure](#-repository-structure)
7. [Setup & Execution Guide](#-setup--execution-guide)

---

## 📌 Project Overview
This repository contains the complete, rigorous, and fully verified implementations for all four milestones of Problem 2. Every milestone is provided as a standalone, runnable, and executed Jupyter Notebook with comprehensive markdown analysis, mathematical proofs, and empirical validations:

* **[Milestone 1 Notebook](file:///c:/Users/Admin/Desktop/Hacktoberfest/HacktoberFest-Zyntra/Submission/Team_Zyntra/Prob%202/Milestone_1.ipynb):** Fixed 6 critical bugs in PyTorch training/validation pipelines (data leakage, unsynchronized shuffling, missing eval modes, layer ordering, scheduler aggressiveness, and dtype mismatches).
* **[Milestone 2 Notebook](file:///c:/Users/Admin/Desktop/Hacktoberfest/HacktoberFest-Zyntra/Submission/Team_Zyntra/Prob%202/Milestone_2.ipynb):** Full analytical gradient derivations ($dV, dP, dS, dQ, dK$), pure NumPy forward/backward autodiff implementation, numerical gradient check ($\text{rel\_err} < 10^{-7}$), numerical stability proofs, $1/\sqrt{d}$ variance proof, causal masking backpropagation, and FlashAttention $O(n^2) \to O(n)$ memory analysis.
* **[Milestone 3 Notebook](file:///c:/Users/Admin/Desktop/Hacktoberfest/HacktoberFest-Zyntra/Submission/Team_Zyntra/Prob%202/Milestone_3.ipynb):** Production card-fraud detection evaluation strategy under 0.1% extreme class imbalance, 30–60 day chargeback label delays, cost-optimal threshold derivation ($p^* \approx 2.44\%$), score calibration (Brier score & Isotonic regression), and real-time unsupervised drift detection (PSI).
* **[Milestone 4 Notebook](file:///c:/Users/Admin/Desktop/Hacktoberfest/HacktoberFest-Zyntra/Submission/Team_Zyntra/Prob%202/Milestone_4.ipynb):** Diagnoses and justified interventions for learning curve behaviors (Cases A, B, C), plus an in-depth diagnosis of Case D (persistent 18% gap under 4× data) with an empirical two-step distinguishing protocol (Adversarial Validation + Pooled Shuffled Re-Split).

---

## 🧩 Milestone 1 — Deep Learning Pipeline Debugging
**Notebook:** [`Prob 2/Milestone_1.ipynb`](file:///c:/Users/Admin/Desktop/Hacktoberfest/HacktoberFest-Zyntra/Submission/Team_Zyntra/Prob%202/Milestone_1.ipynb)

### Summary of Identified Bugs & Applied Fixes:
1. **Bug 1: Data Leakage via `StandardScaler` Before Splitting:**
   * *Problem:* Calling `fit_transform(X)` on the entire dataset leaks validation distribution statistics (mean and variance) into the training features.
   * *Fix:* Split data first using stratified `train_test_split`; call `fit_transform(X_tr)` strictly on training data, and `transform(X_val)` on validation data.
2. **Bug 2: Unsynchronized Random Shuffling (`np.random.shuffle(X_tr)`):**
   * *Problem:* Shuffling only `X_tr` without permuting `y_tr` detaches features from their labels, turning the training set into random noise.
   * *Fix:* Use PyTorch's `DataLoader(..., shuffle=True)` with synchronized `TensorDataset(X_tr, y_tr)` to ensure safe, coordinated mini-batch shuffling.
3. **Bug 3: Missing `model.eval()` and `torch.no_grad()` During Validation:**
   * *Problem:* Evaluating in training mode keeps Dropout active (randomly dropping 50% of neurons) and allows BatchNorm to alter running population statistics, while wasting GPU memory building unnecessary autograd computation graphs.
   * *Fix:* Wrap validation inside `model.eval()` and `with torch.no_grad():`.
4. **Bug 4: Inverted Layer Order (`nn.Dropout(0.5)` before `nn.BatchNorm1d`):**
   * *Problem:* Placing Dropout before BatchNorm injects artificial, sample-dependent variance into activations right before computing batch statistics, destabilizing batch normalization.
   * *Fix:* Corrected layer sequence to `Linear -> BatchNorm1d -> ReLU -> Dropout(0.3)`.
5. **Bug 5: Aggressive StepLR Learning Rate Decay (`gamma=0.9, step_size=1` per batch):**
   * *Problem:* Stepping the scheduler after every batch shrinks the learning rate by 10% repeatedly; within a single epoch, the learning rate decays into microscopic irrelevance ($10^{-3} \times 0.9^{125} \approx 1.8 \times 10^{-9}$).
   * *Fix:* Switched to `CosineAnnealingLR` stepped on an epoch basis for smooth, disciplined convergence.
6. **Bug 6: Double vs Float Dtype Mismatch (`torch.tensor(X_val)`):**
   * *Problem:* NumPy floats default to 64-bit (`float64`), whereas PyTorch weights default to 32-bit (`float32`), triggering runtime type mismatch crashes.
   * *Fix:* Explicitly cast inputs using `torch.tensor(..., dtype=torch.float32)`.

---

## 🧩 Milestone 2 — Derive and Implement an Attention Gradient
**Notebook:** [`Prob 2/Milestone_2.ipynb`](file:///c:/Users/Admin/Desktop/Hacktoberfest/HacktoberFest-Zyntra/Submission/Team_Zyntra/Prob%202/Milestone_2.ipynb)

### 1. Mathematical Derivation of All Attention Gradients
Given queries $Q \in \mathbb{R}^{n \times d}$, keys $K \in \mathbb{R}^{m \times d}$, values $V \in \mathbb{R}^{m \times d_v}$, and upstream loss gradient $dO = \frac{\partial \mathcal{L}}{\partial O} \in \mathbb{R}^{n \times d_v}$:
$$S = \frac{Q K^T}{\sqrt{d}} \in \mathbb{R}^{n \times m}, \quad P = \text{softmax}(S) \in \mathbb{R}^{n \times m}, \quad O = P V \in \mathbb{R}^{n \times d_v}$$

* **Gradient w.r.t $V$:**
  $$dO = P(dV) \implies d\mathcal{L} = \text{Tr}\left(dO^T (P \, dV)\right) = \text{Tr}\left((P^T dO)^T dV\right) \implies \mathbf{dV = P^T dO} \in \mathbb{R}^{m \times d_v}$$
* **Gradient w.r.t $P$:**
  $$dO = (dP)V \implies d\mathcal{L} = \text{Tr}\left((dO \, V^T)^T dP\right) \implies \mathbf{dP = dO \, V^T} \in \mathbb{R}^{n \times m}$$
* **Gradient w.r.t Pre-Softmax Scores $S$:**
  Softmax Jacobian is $\frac{\partial P_{ik}}{\partial S_{ij}} = P_{ik}(\delta_{jk} - P_{ij})$. Applying chain rule:
  $$dS_{ij} = \sum_{k=1}^m dP_{ik} \frac{\partial P_{ik}}{\partial S_{ij}} = P_{ij} \left( dP_{ij} - \sum_{k=1}^m dP_{ik} P_{ik} \right)$$
  Vectorized:
  $$\mathbf{dS = P \odot \left( dP - \left[(dP \odot P)\mathbf{1}_m\right] \mathbf{1}_m^T \right)}$$
  *(Computed in NumPy in $O(nm)$ via `dS = P * (dP - np.sum(dP * P, axis=-1, keepdims=True))`)*.
* **Gradients w.r.t $Q$ and $K$:**
  Since $S = \frac{1}{\sqrt{d}} Q K^T$:
  $$\mathbf{dQ = \frac{1}{\sqrt{d}} dS \, K} \in \mathbb{R}^{n \times d}, \quad \mathbf{dK = \frac{1}{\sqrt{d}} dS^T Q} \in \mathbb{R}^{m \times d}$$

### 2. Numerical Gradient Checking Verification
* **Step Size ($h$):** $10^{-5}$ (the optimal balance between $O(h^2)$ truncation error and $O(\epsilon_{\text{mach}} / h)$ cancellation error in float64).
* **Precision:** `np.float64`.
* **Acceptance Threshold:** $\text{Relative Error} < 10^{-7}$.

```
=================================================================
RUNNING NUMERICAL GRADIENT VERIFICATION
=================================================================
Step Size (h):          1e-05
Floating Precision:     float64
Acceptance Threshold:   1e-07

Tensor dV Relative Error: 2.4133e-11  -->  PASSED [OK]
Tensor dP Relative Error: 1.1954e-11  -->  PASSED [OK]
Tensor dS Relative Error: 5.2062e-10  -->  PASSED [OK]
Tensor dQ Relative Error: 3.5720e-10  -->  PASSED [OK]
Tensor dK Relative Error: 4.7704e-09  -->  PASSED [OK]
-----------------------------------------------------------------
ALL GRADIENT CHECKS PASSED FLAWLESSLY WITHIN TOLERANCE!
```

### 3. Forward-Pass Numerical Stability & Shift Invariance Fix
* **The Vulnerability:** $e^{S_{ij}}$ overflows to $+\infty$ at $S_{ij} > 88.72$ in float32, producing $\frac{\infty}{\infty} = \mathbf{NaN}$. If all values are very negative, exponents underflow to zero, producing $\frac{0}{0} = \mathbf{NaN}$.
* **The Fix:** Shift invariance allows subtracting the row maximum $c_i = \max_k S_{ik}$:
  $$\frac{e^{S_{ij} - c_i}}{\sum_k e^{S_{ik} - c_i}} = \frac{e^{-c_i} e^{S_{ij}}}{e^{-c_i} \sum_k e^{S_{ik}}} = \frac{e^{S_{ij}}}{\sum_k e^{S_{ik}}}$$
  Since $S_{ij} - c_i \le 0$, the maximum exponent is $e^0 = 1$. Overflow is mathematically impossible, and the denominator sum is strictly $\ge 1 > 0$, preventing zero division.

### 4. Why Attention Uses Scaling Factor $1/\sqrt{d}$
For independent zero-mean unit-variance components:
$$\mathbb{E}[q_i k_i] = 0, \quad \text{Var}(q_i k_i) = 1 \implies \text{Var}(q \cdot k) = \sum_{i=1}^d \text{Var}(q_i k_i) = d \implies \text{StdDev}(q \cdot k) = \sqrt{d}$$
Without scaling, for $d=1024$, scores have standard deviation of $32$. Softmax saturates into an extreme one-hot argmax state where $P_{ij}(1 - P_{ij}) \approx 0$. **Gradients vanish across all attention projections.** Multiplying by $1/\sqrt{d}$ normalizes the variance back to $1.0$, preserving steady gradient flow.

### 5. Causal Masking in the Backward Pass
* For $j > i$, tokens are masked with $-\infty$, forcing $P_{ij} \equiv 0$.
* In the backward pass, $dS_{ij} = P_{ij}(dP_{ij} - \dots) \equiv 0$ for all $j > i$.
* Consequently, queries only receive gradients from past keys ($j \le i$), and keys only receive gradients from future queries ($i \ge j$). No gradient leaks backwards in time.
* *Verified in notebook: causal finite difference check achieved relative error of $4.63 \times 10^{-9}$ [PASSED].*

### 6. Memory Cost Analysis & How FlashAttention Solves It
* **The $O(n^2)$ Bottleneck:** Standard attention must write intermediate $n \times n$ matrices $S$ and $P$ to GPU High Bandwidth Memory (HBM) and re-read them during backward pass.
  * For $n = 32\text{k}$ with 32 heads, a single layer consumes **$131\text{ GB}$ of activation memory** ($4.2\text{ TB}$ for a 32-layer model). Furthermore, attention is **memory-bandwidth bound**: GPUs spend 80% of time waiting for HBM memory bus transfers.
* **FlashAttention (Dao et al.) Solution:**
  1. **Tiling:** Loads $Q, K, V$ into fast on-chip **SRAM** in small blocks (e.g. $128 \times 128$) where bandwidth is $\sim 19\text{ TB/s}$.
  2. **Online Softmax:** Dynamically tracks running row max $m$ and sum of exponents $\ell$, updating partial attention outputs incrementally without ever writing the $n \times n$ matrix to HBM.
  3. **Backward Recomputation in SRAM:** Discards $S$ and $P$ from the forward pass, storing only vectors $m, \ell \in \mathbb{R}^n$ ($O(n)$ memory!). In the backward pass, it recomputes $S_{\text{block}}$ and $P_{\text{block}}$ in SRAM on the fly. Since Tensor Core FLOPS are $>10\times$ faster than HBM memory reads, recomputation is both faster and drops peak memory from $\mathbf{O(n^2) \to O(n)}$.

---

## 🧩 Milestone 3 — Design an Evaluation Strategy for Fraud Detection
**Notebook:** [`Prob 2/Milestone_3.ipynb`](file:///c:/Users/Admin/Desktop/Hacktoberfest/HacktoberFest-Zyntra/Submission/Team_Zyntra/Prob%202/Milestone_3.ipynb)

### 1. Model Comparison Metrics: What to Use & Avoid
* **Avoid Accuracy:** At 0.1% fraud prevalence, an all-negative classifier achieves 99.9% accuracy while catching zero frauds.
* **Avoid Standard ROC-AUC:** Because the negative pool is huge ($99.9\%$), generating 10,000 false alarms results in an False Positive Rate of $<1\%$, artificially inflating ROC-AUC to $>0.97$ while operational precision is a disastrous $<10\%$.
* **Use PR-AUC (Average Precision):** Evaluates Precision vs. Recall directly on the positive minority class without distortion from true negatives.
* **Use Precision @ Top Alert Capacity:** Measures operational ROI within the fixed daily manual review budget (e.g. top 500 alerts/day).
* **Use Expected Monetary Loss:** Directly optimizes financial impact: $(\text{FN} \times \$200) + (\text{FP} \times \$5)$.

### 2. Train / Validation / Test Split Design
* **Strict Out-of-Time (OOT) Chronological Partition:** Prevents temporal leakage, card re-use memorization, and coordinated fraud ring correlation.
* **The 60-Day Embargo Buffer:** Because chargeback disputes take 30–60 days to arrive, transactions from the most recent 60 days must be strictly embargoed from training and evaluation sets to prevent unconfirmed frauds from corrupting ground-truth labels.
  ```
  Timeline:
  [===== Train Window =====] [== Val ==] [== Test (OOT) ==] [=== Embargo Window ===] [Today]
      Months 1 to 6             Month 7       Months 8 & 9        Past 60 Days (Immature)
  ```

### 3. Evaluating Despite 30–60 Day Label Delays
1. **Fully Matured Retrospective Benchmarks:** Primary model comparisons run strictly on cohorts older than 60 days whose dispute windows are closed.
2. **Surrogate / Early Proxy Labels:** Monitor real-time proxy signals (3DS OTP step-up failures, customer immediate card freeze actions, and Visa CDRN/Ethoca merchant dispute alerts arriving within 24–72 hours).
3. **Maturity Survival Analysis:** Model chargeback arrival latency $F(t) = P(\text{Dispute} \le t \mid \text{Fraud})$ using Kaplan-Meier hazard rates to adjust weights for partially matured recent cohorts.
4. **Automated Rolling Retrospectives:** Log live predictions immutably and run automated retrospective performance audits as each cohort reaches its 60-day maturity mark.

### 4. Cost-Based Decision Threshold & Calibration
* **Optimal Threshold Derivation:**
  Flagging cost: $\mathbb{E}[\text{Cost} \mid \text{Flag}] = 5(1 - p)$. Passing cost: $\mathbb{E}[\text{Cost} \mid \text{Pass}] = 200p$.
  $$5(1 - p) < 200p \implies \mathbf{p^* = \frac{\$5}{\$200 + \$5} \approx 0.02439 \quad (2.44\%)}$$
  *Insight:* Because missing a fraud is **40 times more expensive** than an alert friction cost ($200 vs $5), the model must intervene whenever estimated fraud risk exceeds just **2.44%**.
* **Assessing Score Calibration:**
  A cost threshold of 2.44% requires exact posterior probability calibration.
  * Assessed via **Reliability Diagrams**, **ECE**, and **Brier Score**.
  * Applying **Isotonic Regression** recalibration in the notebook improved Brier score from `0.002638` to `0.000769` (**70.86% improvement**).

### 5. Detecting Production Drift & Retraining Policy
* **Unsupervised Drift Telemetry (No Labels Needed):**
  * **Feature Drift via Population Stability Index (PSI):** Monitored daily against baseline ($\text{PSI} < 0.10$: stable; $\ge 0.25$: critical drift requiring retraining).
  * **Score Drift:** Spikes in the proportion of transactions scoring $> 2.44\%$ flag fraud blitzes or upstream pipeline defects.
* **Retraining Cadence & Safe Deployment:**
  * Bi-weekly / monthly retraining on rolling matured windows.
  * Triggered retraining on $\text{PSI} \ge 0.25$.
  * Deployed in **Shadow Mode** for 14 days, followed by a **Canary Rollout** (5% $\to$ 25% $\to$ 100%).

---

## 🧩 Milestone 4 — Diagnose Learning Curves & Experimental Protocol
**Notebook:** [`Prob 2/Milestone_4.ipynb`](file:///c:/Users/Admin/Desktop/Hacktoberfest/HacktoberFest-Zyntra/Submission/Team_Zyntra/Prob%202/Milestone_4.ipynb)

### Summary of Diagnoses & Interventions:

| Case | Train Acc | Val Acc | Behavior with Growing Data | Root Diagnosis | Recommended Interventions & Justification |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **A** | **62%** | **60%** | Both stay flat | **High Bias (Severe Underfitting)** | Increase capacity (deeper/wider network, GBDTs), add interaction features, relax regularization. More data cannot help an incapable hypothesis class. |
| **B** | **99%** | **78%** | Val rises slowly; gap shrinks | **High Variance (Overfitting)** | Collect more data/augmentations, increase Dropout/weight decay, early stopping. Narrowing gap proves the model capacity is adequate and learns from data volume. |
| **C** | **85%** | **91%** | Both rise slightly | **Inverted Gap (Training Regularization Asymmetry)** | Training noise (Dropout $p=0.5$, augmentations) active in `train()` is off in `eval()`; or epoch-averaged training loss vs post-epoch val eval. Sanity-check train set in `eval()` mode. |
| **D** | **88%** | **70%** | Gap stubborn under 4× data | **Distribution Mismatch or Label Noise** | 4× data fails to close gap because train and val sets do not share the same distribution or Bayes rate. |

---

### Case D Deep Dive: Two Plausible Explanations & The Distinguishing Experiment

* **Explanation 1: Covariate Shift / Domain Mismatch ($P_{\text{train}}(X) \ne P_{\text{val}}(X)$)**:
  Validation features come from an unobserved domain (e.g. mobile vs desktop, new geography). Gathering 4× more training data makes the model an expert on the training domain, but provides zero knowledge of the shifted validation domain.
* **Explanation 2: Validation Label Noise / Quality Asymmetry ($P_{\text{train}}(Y \mid X) \ne P_{\text{val}}(Y \mid X)$)**:
  The validation set contains noisy or inconsistent ground-truth labels (~20% error rate). Validation accuracy is strictly capped by the Bayes error ceiling ($\le 1 - \text{Bayes Rate} \approx 75\%$).

#### The Distinguishing Protocol (Implemented & Executed):
1. **Step 1: Adversarial Validation (Domain Discriminator):**
   Drop target $y$. Train a classifier on features $X$ to predict domain label $z \in \{0 (\text{Train}), 1 (\text{Val})\}$.
   * **If ROC-AUC $\gg 0.50$ (e.g. $0.85$–$0.99$):** **Confirms Explanation 1 (Covariate Shift).**
   * **If ROC-AUC $\approx 0.50$:** **Rules out Covariate Shift; confirms Explanation 2 (Label Noise).**
2. **Step 2: Pooled Shuffled Re-Split Test:**
   Pool Train and Val, randomly shuffle, and re-split 80/20.
   * If the gap vanishes ($\approx 0\%$), domain partition is proven (Explanation 1).
   * If the gap persists, label noise / Bayes ceiling is proven (Explanation 2).

**Empirical Notebook Results:**
```
======================================================================
CASE D EXPERIMENTAL PROTOCOL: ADVERSARIAL VALIDATION & SHUFFLE TEST
======================================================================
Adversarial Validation AUC on Scenario 1 (Covariate Shift): 0.8943
  --> AUC >> 0.50 confirms COVARIATE SHIFT (Explanation 1)!

Adversarial Validation AUC on Scenario 2 (Label Noise):     0.4672
  --> AUC ~ 0.50 rules out Covariate Shift and points to LABEL NOISE (Explanation 2)!

----------------------------------------------------------------------
POOLED SHUFFLED RE-SPLIT BEHAVIOR UNDER COVARIATE SHIFT:
  Original Split:    Train Acc = 93.2% | Val Acc = 91.4%  (Gap: 1.8%)
  Shuffled Re-Split: Train Acc = 100.0% | Val Acc = 99.8%  (Gap: 0.2%)
  --> Generalization gap collapsed after shuffling! Unequivocal proof of domain partition.
======================================================================
```

---

## 📂 Repository Structure

```
HacktoberFest-Zyntra/
├── README.md                                  # Root hackathon overview
├── GIT_WORKFLOW.md                            # Official Git submission guidelines
├── TEAM_COLLABORATION.md                      # Team collaboration protocol
└── Submission/
    └── Team_Zyntra/
        ├── README.md                          # Team Zyntra Master Documentation (this file)
        └── Prob 2/
            ├── README.md                      # Detailed Problem 2 technical documentation
            ├── Milestone_1.ipynb              # Milestone 1: Debugged PyTorch pipeline
            ├── Milestone_2.ipynb              # Milestone 2: Attention Autodiff & Gradient Checks
            ├── Milestone_3.ipynb              # Milestone 3: Fraud Detector Evaluation Strategy
            └── Milestone_4.ipynb              # Milestone 4: Learning Curves & Case D Experiment
```

---

## 💻 Setup & Execution Guide

### 1. Clone & Switch to Team Branch
```bash
git clone https://github.com/SyedFazeel210/HacktoberFest-Zyntra.git
cd HacktoberFest-Zyntra
git checkout Team_Zyntra
```

### 2. Install Required Python Packages
```bash
pip install numpy torch scikit-learn scipy matplotlib nbformat
```

### 3. Run Notebooks
Navigate to the problem folder:
```bash
cd "Submission/Team_Zyntra/Prob 2"
```
Launch Jupyter Notebook / Jupyter Lab:
```bash
jupyter lab
```
Or open any of the `.ipynb` files directly in VS Code or Google Colab. All notebooks are pre-executed with stored cell outputs and visualizations.
