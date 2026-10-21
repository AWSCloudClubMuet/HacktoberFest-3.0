# Milestone 5 — Mitigate Label Noise and Evaluate Reliably
**Project: HelpDeskNet-50K Noisy Labels**  
**Team: SheNova**  

---

## 1. Executive Summary & Objective

In **Milestones 1 and 2**, we measured that crowd annotations carry a **15.00%** overall disagreement rate (concentrated in Tier B at **21.82%**, with Billing $\leftrightarrow$ Refund driving **43.33%** of errors). In **Milestone 3**, we demonstrated mathematically that evaluating against noisy test labels imposes a deflated accuracy ceiling. In **Milestone 4**, we designed a multi-objective strategy to allocate 2,000 tickets for expert review.

In **Milestone 5**, we address the core machine learning challenge:
1. Formulate and implement **two distinct training-time methods** that tolerate residual label noise.
2. Design a **trustworthy, leakage-free evaluation protocol** anchored by expert-labeled gold ground truth.
3. Detail a rigorous **model comparison framework** across a conventional baseline, label smoothing, and co-teaching.
4. Explain why the existing model's reported **82.00% accuracy** on the crowd-labeled test set is fundamentally untrustworthy.

> **Data Scope & Integrity Notice:**  
> The actual ticket text records are unavailable. All methods, interfaces, metrics, and protocols are implemented as testable, modular Python components. In accordance with hackathon rules, no real model training experiment or empirical evaluation is fabricated.

---

## 2. Two Noise-Robust Training Methods

### Method A: Label Smoothing Regularization

Standard categorical cross-entropy trains neural networks to output Dirac delta one-hot targets ($y_k = 1$ for the annotated label, $0$ elsewhere). When labels are noisy, this forces the model to memorize incorrect annotations, driving logits toward $\pm \infty$ and causing extreme overconfidence.

#### Mathematical Formulation
For $K = 6$ classes and smoothing parameter $\epsilon \in [0, 1)$, label smoothing replaces the one-hot target with a softened distribution $y'_k$:

$$y'_k = \begin{cases} 
1 - \epsilon + \frac{\epsilon}{K}, & \text{if } k = y \quad (\text{annotated class}) \\ 
\frac{\epsilon}{K}, & \text{if } k \ne y \quad (\text{other classes}) 
\end{cases}$$

For $K = 6$ and $\epsilon = 0.10$:
- Ground truth class target: $1 - 0.10 + \frac{0.10}{6} = 0.90 + 0.01667 \approx 0.9167$ (or $91.67\%$).
- Remaining 5 classes target: $\frac{0.10}{6} \approx 0.0167$ (or $1.67\%$ each).
- Sum across all 6 classes: $0.9167 + 5 \times 0.0167 = 1.0000$ ($100\%$).

#### Why It Works & Limitations
- **Benefits**: Soft targets truncate logit growth, preventing the network from assigning infinite certainty to erroneous crowd annotations. This penalizes overconfidence and smooths the loss landscape.
- **Limitations**:
  - Label smoothing **does not identify or correct corrupted labels**; it dampens confidence uniformly across both clean and dirty examples.
  - Excessive smoothing ($\epsilon \ge 0.30$) destroys class separability and degrades accuracy.
- **Hyperparameter Selection**: $\epsilon$ should be selected via grid search ($\epsilon \in \{0.05, 0.10, 0.15, 0.20\}$) evaluated on an expert-labeled validation set.

---

### Method B: Co-Teaching Paradigm

Co-teaching (Han et al., NeurIPS 2018) is a state-of-the-art deep learning paradigm that leverages the **memorization effect**: deep neural networks naturally learn clean, simple semantic patterns in early training epochs before gradually memorizing random noise in later epochs.

#### Algorithmic Architecture
Co-teaching simultaneously trains two independently initialized networks, **Model A ($f_{\theta_1}$)** and **Model B ($f_{\theta_2}$)**:

1. **Independent Loss Computation**: For a mini-batch of $N$ tickets, both Model A and Model B compute per-sample cross-entropy losses independently.
2. **Small-Loss Selection**: Each model selects a subset of instances that have the smallest loss, under the principle that small-loss samples are predominantly clean.
3. **Cross-Update (Peer Teaching)**: 
   - Model A updates its parameters using the small-loss subset selected by **Model B**.
   - Model B updates its parameters using the small-loss subset selected by **Model A**.
   Because the models possess different random initializations, they make different early errors; cross-feeding filters out individual model bias.
4. **Dynamic Retention Schedule $R(t)$**:
   $$R(t) = 1 - \min\left(\frac{t}{T_k} \cdot \tau, \tau\right)$$
   where:
   - $\tau = 0.15$: Working noise heuristic derived from the 400-ticket audit point estimate ($15.00\%$, Wilson 95% CI: $[11.83\%, 18.83\%]$). **This is an estimated parameter, not a confirmed noise rate that holds uniformly across all 50,000 tickets or in every split.**
   - $T_k = 5$: Warmup epoch threshold.
   - At epoch $0$: $R(0) = 1.0$ (100% of samples retained while representations form).
   - At epoch $T_k \ge 5$: $R(t) = 1 - 0.15 = 0.85$ (drops the 15% highest-loss samples, filtering out likely corrupted crowd labels).

#### Practical Caveats & Split Composition Nuance
- **Split Noise Heterogeneity**: Because Tier A tickets exhibit a **$6.67\%$** disagreement rate while Tier B tickets exhibit **$21.82\%$**, the true proportion of noisy labels in any specific training batch or data split depends on that split's worker-tier composition. The parameter $\tau$ must be treated as a tunable hyperparameter on clean validation data rather than an immutable physical constant.
- Small-loss filtering can occasionally discard inherently difficult or atypical tickets that are nonetheless correctly labeled.
- Requires careful validation tuning to ensure both models do not collapse into consensus error modes.


---

## 3. Trustworthy Evaluation Protocol

### Why the Existing Crowd-Labeled Test Set Is Problematic
The current held-out test set was labeled by the **same crowd process** as the training set. This creates two fatal flaws:
1. **Contaminated Scoring**: If the model predicts the true category (*Refund*) for a ticket that the crowd mislabeled as *Billing*, standard scoring penalizes the model as incorrect. While the 400-ticket audit suggests an overall crowd noise rate of approximately 15% (with a 95% Wilson CI of $[11.83\%, 18.83\%]$), the exact noise rate in this specific test split is an unverified sample-dependent quantity governed by its worker-tier composition.
2. **Echo Chamber Effect**: The reported **82.00% accuracy** does not measure domain correctness; it measures the model's fidelity to crowd consensus (including crowd mistakes).


### Ten-Point Evaluation Protocol Specification

To achieve reliable evaluation, future model benchmarks must adhere to the following protocol:

1. **Expert-Labeled Gold Test Set**: A held-out partition of at least 1,000 tickets annotated and cross-adjudicated exclusively by in-house domain experts.
2. **Strict Split Separation**: Disjoint `ticket_id` sets across Training ($70\%$), Validation ($15\%$), and Gold Test ($15\%$) with automated leakage verification.
3. **Independent Adjudication**: Any test ticket where two expert agents disagree is escalated to a senior panel to establish an incontrovertible ground truth.
4. **Protection Against Leakage**: Hashing of ticket text bodies to ensure duplicate or templated tickets do not cross splits.
5. **Class Imbalance Handling**: Macro-averaging across all 6 classes to prevent dominant classes (Billing 30%, Technical 25%) from obscuring failure on minority classes (Other 5%, Shipping 10%).
6. **Primary Metrics**:
   - Overall Accuracy on Gold Set.
   - **Macro-F1 Score** (unweighted mean of per-class F1 scores).
7. **Per-Class Metrics**: Individual Precision, Recall, and F1 for all six classes (*Billing, Refund, Technical, Account Access, Shipping, Other*).
8. **Six-Class Confusion Matrix**: Full $6 \times 6$ cross-tabulation mapping expert ground truth against model predictions.
9. **Confidence Intervals**: 95% bootstrap confidence intervals ($B = 1,000$ resamples) on Macro-F1 and Accuracy.
10. **Documentation & Provenance**: Comprehensive tracking of annotator IDs, timestamps, and model versioning.

---

## 4. Fair Model Comparison Plan

When real ticket text records become available, the three modeling strategies must be benchmarked under rigorous ceteris paribus conditions:

| Parameter | Baseline Model | Label Smoothing Model | Co-Teaching Architecture |
|---|---|---|---|
| **Base Architecture** | Pretrained Transformer (e.g. RoBERTa-base) | Pretrained Transformer (identical backbone) | Dual Pretrained Transformers (Model A & B) |
| **Loss Function** | Standard Cross-Entropy | Label Smoothing Cross-Entropy ($\epsilon=0.10$) | Standard Cross-Entropy on Peer-Selected Batches |
| **Training Data Split** | Identical 70% Crowd Train Split | Identical 70% Crowd Train Split | Identical 70% Crowd Train Split |
| **Validation Split** | Identical Expert-Audited Val Set | Identical Expert-Audited Val Set | Identical Expert-Audited Val Set |
| **Evaluation Set** | Identical Held-Out Gold Test Set | Identical Held-Out Gold Test Set | Identical Held-Out Gold Test Set |
| **Repeated Runs** | 5 Random Seeds | 5 Random Seeds | 5 Random Seeds |
| **Target Hypothesis** | Will overfit to Tier B noise | Expected $+2\text{–}3\%$ Macro-F1 gain | Expected $+4\text{–}6\%$ Macro-F1 gain on noisy pairs |

---

## 5. Summary & Deliverables

- **Implemented Components**:
  - `LabelSmoothingCrossEntropy`: Dynamic soft target calculation and cross-entropy.
  - `CoTeachingSelector`: $R(t)$ scheduling and small-loss peer index selection.
  - `EvaluationMetricsCalculator`: Accuracy, Macro-F1, per-class Precision/Recall with zero-division protection.
  - `verify_split_disjointness`: Automated data leakage detection across splits.
- **Data Compliance**: No empirical benchmark claims are made in the absence of genuine HelpDeskNet-50K text data.
