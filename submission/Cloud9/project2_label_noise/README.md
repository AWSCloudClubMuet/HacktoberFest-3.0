# Project 2: HelpDeskNet-50K — Label Noise Quantification, Systematic Diagnostics & Robust Training/Evaluation Strategy

**Team:** Cloud9  
**Track:** Data-Centric AI / Machine Learning Quality & Evaluation  
**Branch:** `Cloud9`  
**Directory:** `submission/Cloud9/project2_label_noise/`

---

## 🎯 Project Overview & Executive Summary

In **HelpDeskNet-50K** (a corpus of 50,000 customer-support tickets across 6 categories), fine-tuned text classifiers encounter an obstinate **plateau at 82% accuracy** on the held-out test set. Scaling model capacity, hyperparameter sweeps, and extended training schedules fail to yield improvements.

Our investigation establishes that the model is **not suffering from capacity deficits**, but is rather trapped against an **artificial noise ceiling** created by crowdworker labeling corruption:
- **90% of the dataset (45,000 tickets)** and the **held-out test set** were labeled by crowdworkers.
- An expert audit of 400 tickets revealed an overall **crowd noise rate of 15.00%** (95% CI: $[11.50\%, 18.50\%]$).
- Newer crowdworkers (**Tier B**) produced **21.82% error** — over **3.27× higher** than experienced Tier A workers ($p = 2.42 \times 10^{-5}$).
- Crucially, the noise is **100% systematic and semantic** ($\chi^2 = 222.00, p < 10^{-15}$), concentrated in bidirectional confusions between `Billing` $\leftrightarrow$ `Refund` (43.33%) and `Technical` $\leftrightarrow$ `Account Access` (25.00%).
- Evaluating on this noisy test set caps measured accuracy at $\approx 85\%$, inverts model rankings, and penalizes models that predict true ground truth.

---

## 🗂️ Milestone Index & Deliverables

| Milestone | Core Problem & Analysis | Script | Full Documentation |
| :--- | :--- | :---: | :---: |
| **Milestone 1** | **Quantify Label Noise:** Estimate crowd error rate with 95% CI (Wald, Wilson, Stratified) and test statistical significance of Tier A vs. Tier B. | [`milestone1_analysis.py`](./milestone1_analysis.py) | [`MILESTONE1_QUANTIFY_LABEL_NOISE.md`](./MILESTONE1_QUANTIFY_LABEL_NOISE.md) |
| **Milestone 2** | **Characterize the Noise:** Determine whether errors are random or systematic, conduct Goodness-of-Fit tests, diagnose root causes, and reform annotation guidelines. | [`milestone2_characterize_noise.py`](./milestone2_characterize_noise.py) | [`MILESTONE2_CHARACTERIZE_NOISE.md`](./MILESTONE2_CHARACTERIZE_NOISE.md) |
| **Milestone 3** | **Reason About Accuracy Ceiling:** Derive latent true accuracy under uniform noise inversion ($96.34\%$) and explain 5 reasons why naive inversion fails. | [`milestone3_accuracy_ceiling.py`](./milestone3_accuracy_ceiling.py) | [`MILESTONE3_ACCURACY_CEILING.md`](./MILESTONE3_ACCURACY_CEILING.md) |
| **Milestone 4** | **Find the Bad Labels:** Optimize a 2,000-ticket expert review budget using Confident Learning, Stratum weighting, and confusion priors (yielding 4.80× lift). | [`milestone4_bad_labels.py`](./milestone4_bad_labels.py) | [`MILESTONE4_FIND_BAD_LABELS.md`](./MILESTONE4_FIND_BAD_LABELS.md) |
| **Milestone 5** | **Mitigate Noise & Evaluate Reliably:** Implement Symmetric Cross-Entropy & Co-Teaching, construct a trustworthy gold test benchmark, and deconstruct test set flaws. | [`milestone5_mitigation_eval.py`](./milestone5_mitigation_eval.py) | [`MILESTONE5_MITIGATE_AND_EVALUATE.md`](./MILESTONE5_MITIGATE_AND_EVALUATE.md) |

---

## 🚀 Key Mathematical Results Across Milestones

```
+---------------------------------------------------------------------------------------------------------+
| Milestone 1: Noise Rate & Confidence Intervals                                                          |
|   * Empirical Crowd Noise Rate : 15.00% (60 disagreements / 400 audited)                                |
|   * 95% Wald CI                : [11.50%, 18.50%]                                                       |
|   * 95% Wilson Score CI        : [11.83%, 18.83%]                                                       |
|   * Tier A Noise Rate          : 6.67%  (12 / 180)                                                      |
|   * Tier B Noise Rate          : 21.82% (48 / 220) -> 3.27x higher noise rate                          |
|   * Statistical Significance   : z = 4.2220, p = 2.42e-5 (Decisive rejection of H0)                     |
+---------------------------------------------------------------------------------------------------------+
| Milestone 2: Semantic Error Clustering & Non-Randomness                                                 |
|   * Top Error Pairs            : Billing <-> Refund (43.33%), Technical <-> Account Access (25.00%)     |
|   * Chi-Square Goodness-of-Fit : chi2 = 222.00 (df = 29), p < 1e-15 -> Overwhelmingly systematic        |
+---------------------------------------------------------------------------------------------------------+
| Milestone 3: Theoretical True Accuracy Derivation                                                       |
|   * Exact Uniform Inversion    : A_true = (0.82 - 0.03) / (1 - 0.18) = 79 / 82 = 96.34%                |
|   * Why Unreliable             : Correlated errors, asymmetric transition matrix, distorted boundaries  |
+---------------------------------------------------------------------------------------------------------+
| Milestone 4: Active Label Auditing Yield (2,000 Budget)                                                 |
|   * Uniform Random Yield       : 15.0% (~300 bad labels discovered)                                     |
|   * Confident Learning Yield   : 72.0% (~1,440 bad labels discovered) -> 4.80x Lift                    |
|   * Post-Review Allocation     : 1,000 to pure gold benchmark, 1,000 to weighted training set           |
+---------------------------------------------------------------------------------------------------------+
| Milestone 5: Noise-Tolerant Training & Clean Evaluation                                                 |
|   * Training Methods           : Symmetric Cross-Entropy (L_SCE) & Co-Teaching Small-Loss Scheduling   |
|   * Benchmarking Discovery     : Crowd test set inverts rankings (penalizes clean 95% models)           |
|   * Solution                   : 100% expert-audited stratified gold evaluation suite                   |
+---------------------------------------------------------------------------------------------------------+
```

---

## 🛠️ Verification & Reproducibility

All code solutions are self-contained, standard-library compatible, and contain automated assertion tests:

```powershell
# Run all milestone scripts sequentially
python milestone1_analysis.py
python milestone2_characterize_noise.py
python milestone3_accuracy_ceiling.py
python milestone4_bad_labels.py
python milestone5_mitigation_eval.py
```
