# HelpDeskNet-50K: Label Noise Analysis & Mitigation Strategy

## Executive Summary

An investigation into the HelpDeskNet-50K dataset reveals that the model's 82% accuracy ceiling is an artifact of evaluation noise rather than a limitation of the classifier architecture. The 45,000 crowd-labeled tickets contain significant, systematic annotation errors, heavily concentrated in specific semantic pairs. This report quantifies the noise, identifies the root causes, and outlines a targeted strategy for data remediation and robust model evaluation.

## Milestone 1: Quantify Label Noise

Based on the expert audit of 400 randomly selected tickets, we established the following baseline noise metrics:

* **Overall Sample Size:** 400
* **Observed Disagreements:** 60
* **Estimated Noise Rate (**$\hat{p}$**):** 15.00%
* **Standard Error (SE):** 0.0179
* **95% Confidence Interval:** \[11.50%, 18.50%\]

### Tier Comparison (Experienced vs. Newer Workers)

* **Tier A (Experienced):** 12/180 errors $\rightarrow$ 6.67% noise rate
* **Tier B (Newer):** 48/220 errors $\rightarrow$ 21.82% noise rate
* **Pooled Rate:** 15.00%

**Statistical Significance:**
A two-proportion hypothesis test yields a Z-statistic of 4.2220 and a P-value of $2.42 \times 10^{-5}$. The difference is **statistically significant** ($p < 0.001$). Tier B's noise rate is approximately **3.27x higher** than Tier A's, indicating that the introduction of newer workers severely degraded dataset quality.

## Milestone 2: Characterize the Noise

Errors are not randomly distributed; they follow highly specific, systematic patterns.

**Systematic Confusion Clusters:**

1. **Billing** $\leftrightarrow$ **Refund:** 26 errors (43.3% of total)
2. **Technical** $\leftrightarrow$ **Account Access:** 15 errors (25.0% of total)
3. **Shipping** $\leftrightarrow$ **Other:** 11 errors (18.3% of total)

The top two clusters alone account for **68.3% of all labeling mistakes**.

**Root Cause & Process Fixes:**
The errors are semantic. Annotators are confusing customer *intent* (e.g., distinguishing a dispute over a charge from a request for money back). To fix this, the annotation process must be updated to include **decision trees** for edge cases and a mandatory **qualification test** (e.g., a 20-ticket benchmark) before onboarding Tier B workers to the live pool.

## Milestone 3: Reason About the Accuracy Ceiling

If we naively assume a uniform 15% noise rate distributed equally among the other 5 classes, we can estimate the true underlying accuracy using the observed 82% accuracy:

* **Observed Accuracy:** 0.82
* **Calculated True Accuracy:** 0.9634 (96.34%)

**Why this estimate is unreliable:**

1. **Non-Uniform Noise:** Errors are heavily concentrated between specific classes (e.g., Billing vs. Refund), not distributed evenly. The mathematical assumption that a mislabeled "Billing" ticket has an equal chance of becoming "Shipping" is false.
2. **Correlated Test Noise:** The model memorizes systematic crowd biases from training and gets rewarded for predicting those same errors on the noisy test set. The test set does not reflect independent, true ground truth.

## Milestone 4: Find the Bad Labels

With a budget of only 2,000 expert reviews, random sampling is highly inefficient. We propose the following targeted strategy:

**Strategy for Choosing Tickets:**

1. **Tier B Filter:** Focus primarily on Tier B tickets (21.8% noise vs 6.7% in Tier A).
2. **Confident Learning:** Select tickets where out-of-fold model predictions heavily disagree with the crowd label.
3. **Semantic Risk:** Prioritize tickets labeled as Billing, Refund, Technical, or Account Access.
4. **Margin Sampling:** Sort remaining ties by lowest model confidence.

**Evaluation & Usage:**

* **Evaluation:** Take a random sample of 100 tickets using this method and 100 tickets purely at random. Compare the 'Hit Rate' (percentage of tickets confirmed as mislabeled). A successful strategy should yield a hit rate >60%, compared to the ~15% baseline.
* **Usage:** Do not immediately mix corrected labels back into training. Move a balanced portion of the 2,000 clean tickets into a locked 'Gold Test Set'. Add the remainder to the training set using high sample weights ($w=1.0$) compared to unverified crowd tickets ($w=0.5$).

## Milestone 5: Mitigate Noise & Evaluate Reliably

**Noise-Robust Training Methods:**

1. **Forward Loss Correction:** Multiply the model's softmax probabilities by the estimated label transition matrix (derived from the audit in Milestone 2) before computing cross-entropy loss to account for systematic flips.
2. **Confident Learning / Pruning:** Use out-of-fold predicted probabilities to identify and filter out likely mislabeled examples prior to final training.

**Trustworthy Evaluation Strategy:**
Set aside the 5,000 tickets labeled entirely by in-house expert agents. Do not use these for training. Stratify them to match the underlying class distribution and split them into a **Clean Validation Set** (for tuning) and a **Gold Benchmark Test Set** (for final evaluation).

**The Problem with the Existing Test Set:**
The currently held-out test set contains the exact same systematic errors (~15% noise) as the training set because it utilized the same crowd workers. An 82% accuracy ceiling on this test set does not mean the model failed to learn; it means the model is being penalized when it correctly predicts the true label over a flawed human label.