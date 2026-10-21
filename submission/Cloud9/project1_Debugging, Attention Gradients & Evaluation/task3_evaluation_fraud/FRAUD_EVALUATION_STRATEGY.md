# Task 3: Realistic Card-Transaction Fraud Detection Evaluation Strategy

## Scenario Context
- **Target Event:** Card-transaction fraud detection.
- **Prevalence:** Severe class imbalance with only **0.1%** fraud incidence ($\text{base rate} = 10^{-3}$).
- **Feedback Dynamics:** Ground-truth chargeback and dispute labels arrive with a **30 to 60-day delay**.
- **Non-Stationarity:** Fraud patterns, attacker tactics, and customer spending habits drift over time.
- **Cost Asymmetry:** Average cost of a False Negative (missed fraud) is **$200**, while a False Positive (false alarm / declined legitimate card) costs **$5**.

---

## 1. Model Comparison Metrics: What to Use and What to Avoid

### Metrics to AVOID (With Justification)

| Metric | Why It Must Be Avoided in Card Fraud Detection |
|---|---|
| **Accuracy** | With 99.9% legitimate transactions, a naive model that predicts every single transaction as non-fraud achieves **99.9% accuracy**. Yet, it captures $0\%$ of fraudulent transactions, resulting in millions of dollars in unmitigated losses. |
| **Standard ROC-AUC** | ROC-AUC plots True Positive Rate vs False Positive Rate ($\text{FPR} = \frac{\text{FP}}{\text{FP} + \text{TN}}$). Because $\text{TN} \approx 99.9\%$, the denominator $(\text{FP} + \text{TN})$ is enormous. Even if the model generates 1,000 false positives for every 10 true frauds, FPR remains microscopic ($< 0.1\%$). Consequently, ROC-AUC remains artificially inflated ($> 0.98$), completely masking severe false-alarm rates. |
| **Fixed-Threshold $F_1$-Score ($T = 0.5$)** | The standard $F_1$-score computes the harmonic mean of precision and recall assuming an uncalibrated default decision boundary at $0.5$. In a $0.1\%$ prevalence regime, posterior probabilities rarely exceed $0.5$, meaning an $F_1$ evaluated at $0.5$ evaluates an arbitrary point disconnected from operational realities and business costs. |

---

### Metrics to USE (With Justification)

1. **Precision-Recall AUC (PR-AUC / Average Precision):**
   - Evaluates Precision ($\frac{\text{TP}}{\text{TP} + \text{FP}}$) directly against Recall ($\frac{\text{TP}}{\text{TP} + \text{FN}}$).
   - Because PR-AUC completely omits True Negatives from its equations, it is hyper-sensitive to false positives within the minority class. A random classifier yields an Average Precision equal to the prevalence ($0.001$), providing a crystal-clear baseline.

2. **Recall at Fixed Precision (or Precision at Fixed Operational Capacity):**
   - In production banking, human fraud investigation teams have fixed daily review capacities (e.g., maximum 500 alerts/day, or top $0.2\%$ of daily volume).
   - Evaluating **Recall @ Precision $\ge 20\%$** or **Recall @ Top 0.5% Volume** directly answers: *"What percentage of stolen funds do we save given our fixed team bandwidth?"*

3. **Expected Business Cost / Financial Utility:**
   $$\text{Total Cost} = C_{\text{FN}} \cdot \text{FN} + C_{\text{FP}} \cdot \text{FP} = \$200 \times \text{FN} + \$5 \times \text{FP}$$
   Direct financial loss quantification gives non-technical risk executives the exact dollar impact of model updates.

4. **Brier Score & Expected Calibration Error (ECE):**
   $$\text{Brier Score} = \frac{1}{N} \sum_{i=1}^N (p_i - y_i)^2$$
   To apply theoretical decision thresholds, model probability outputs must reflect true empirical likelihoods.

---

## 2. Train / Validation / Test Temporal Split Architecture

### Why Random Splitting is Prohibited
Standard random $K$-fold cross-validation or random train-test splitting causes **temporal look-ahead leakage** and **entity leakage**. It evaluates the model on transactions that occurred *before* transactions in the training set and leaks customer behavioral profiles across folds, failing to test the model's robustness against evolving fraud patterns.

### Out-of-Time (OOT) Walk-Forward Split Design
We construct an **Out-of-Time (OOT) rolling split with a mandatory 60-day embargo buffer**:

```
Timeline:
[================ Train Window ================] [== 60-day Embargo ==] [== Val (OOT) ==] [== Test (Holdout) ==]
Day 0                                        Day 180                 Day 240           Day 270              Day 300
```

1. **Train Window (Days 0 – 180):** 6 months of historical transactions with fully matured chargeback labels.
2. **Purged Embargo Buffer (Days 181 – 240):** A **60-day buffer** between the training window and the validation window. This ensures no transactions with pending or incomplete chargeback statuses contaminate the boundary.
3. **Validation Window (Days 241 – 270):** 1 month of out-of-time matured transactions used for hyperparameter optimization and calibration fitting.
4. **Test Window (Days 271 – 300):** 1 month of completely unseen, out-of-time matured transactions serving as the final uncorrupted benchmark.

---

## 3. Evaluation Strategies Under 30–60 Day Label Delays

Because ground-truth fraud labels (chargebacks) take 30–60 days to reach maturity, evaluating performance on the most recent 30–60 days of traffic using raw labels will yield a false sense of security (artificially high precision and near-zero fraud count).

To solve this, we employ four operational strategies:

1. **Cohort-Maturity Backtesting (Delayed Windowing):**
   - Official retrospective evaluation is strictly performed on **transaction cohorts older than 60 days** ($\text{Age} \ge 60\text{d}$), where label completeness exceeds $98\%$.
2. **Surrogate / Early Proxy Labels:**
   - Instead of waiting for bank chargebacks, track immediate early indicators available within 24–48 hours:
     - Rapid multi-card attempts on same device fingerprint / IP.
     - Direct merchant refund/cancellation requests due to disputed identity.
     - 3D Secure / SMS OTP verification failures followed by alternate payment tries.
   - Use these proxy labels to compute leading indicators of precision decay.
3. **Delayed-Feedback Probabilistic Modeling:**
   - Formulate label arrival as a survival analysis problem (Chapelle, *Modeling Delayed Feedback in Display Advertising*). Model the joint probability $P(Y=1, D \le t)$, distinguishing between transactions that are truly legitimate vs. transactions that are fraudulent but have not yet completed their chargeback journey.
4. **Unsupervised Distribution Drift as an Evaluation Proxy:**
   - In the 0–60 day blind window, measure distribution shifts in model score outputs and high-importance features. A sudden drift indicates potential performance deterioration before labels mature.

---

## 4. Cost-Based Decision Threshold & Score Calibration

### Derivation of Optimal Decision Threshold $p^*$
Let:
- $p(x) = P(Y=1 \mid x)$ be the predicted probability that a transaction is fraudulent.
- $C_{\text{FN}} = \$200$ (cost of missing a fraud).
- $C_{\text{FP}} = \$5$ (cost of incorrectly declining/alerting a legitimate user).
- $C_{\text{TP}} = 0$ (fraud successfully averted).
- $C_{\text{TN}} = 0$ (legitimate transaction approved seamlessly).

The expected financial cost of classifying transaction $x$ as **Fraud** ($\hat{Y} = 1$):
$$\mathbb{E}[\text{Cost} \mid \hat{Y}=1] = P(Y=0 \mid x) \cdot C_{\text{FP}} + P(Y=1 \mid x) \cdot C_{\text{TP}} = (1 - p(x)) \cdot \$5$$

The expected financial cost of classifying transaction $x$ as **Legitimate** ($\hat{Y} = 0$):
$$\mathbb{E}[\text{Cost} \mid \hat{Y}=0] = P(Y=1 \mid x) \cdot C_{\text{FN}} + P(Y=0 \mid x) \cdot C_{\text{TN}} = p(x) \cdot \$200$$

We classify as Fraud ($\hat{Y}=1$) whenever the expected cost of flagging is less than or equal to the expected cost of passing:
$$(1 - p^*) \cdot 5 \le p^* \cdot 200$$
$$5 - 5p^* \le 200p^* \implies 205p^* \ge 5$$
$$\mathbf{p^* = \frac{C_{\text{FP}}}{C_{\text{FP}} + C_{\text{FN}}} = \frac{5}{5 + 200} = \frac{5}{205} \approx 0.02439 \quad (2.44\%)}$$

**Conclusion:** The bank should flag/block any transaction whose predicted probability of fraud is **$\ge 2.44\%$**! Operating at a standard $50\%$ threshold misses nearly all borderline fraud, costing the institution tens of thousands of dollars.

### Assessing and Ensuring Score Calibration
The theoretical validity of $p^* = 2.44\%$ strictly relies on $p(x)$ being a genuine posterior probability.

1. **Reliability Diagram:**
   - Group predictions into 10–20 quantile bins (since $99.9\%$ of scores are near zero, quantile bins are superior to equal-width bins).
   - Plot mean predicted probability vs empirical fraction of true positives in each bin. Perfect calibration follows the diagonal line $y = x$.
2. **Expected Calibration Error (ECE):**
   $$\text{ECE} = \sum_{b=1}^B \frac{|B_b|}{N} |\operatorname{acc}(B_b) - \operatorname{conf}(B_b)|$$
3. **Calibration Adjustment:**
   - If tree-based ensembles (LightGBM/XGBoost) or neural networks exhibit uncalibrated probabilities, apply **Isotonic Regression** or **Platt Scaling** fitted exclusively on the validation set.

---

## 5. Production Drift Detection & Retraining Triggers

### Drift Detection Without Ground Truth Labels
Because ground-truth labels lag by up to 60 days, retraining triggers cannot wait for drops in accuracy or recall. Drift must be detected using unsupervised distribution metrics:

1. **Population Stability Index (PSI) on Feature Distributions:**
   $$\text{PSI} = \sum_{k=1}^K \left( \% \text{Actual}_k - \% \text{Expected}_k \right) \times \ln\left( \frac{\% \text{Actual}_k}{\% \text{Expected}_k} \right)$$
   - Track daily PSI on high-importance risk features:
     - Transaction Amount
     - Velocity features (transactions in past 1h, 6h, 24h)
     - Geolocation distance from billing address
     - Device risk scores
   - **Action Thresholds:**
     - $\text{PSI} < 0.10$: Distribution stable; no action.
     - $0.10 \le \text{PSI} \le 0.25$: Moderate drift; inspect feature logging and data pipelines.
     - $\text{PSI} > 0.25$: Severe drift; **trigger automated model retraining pipeline**.

2. **Prediction Score Drift (Jensen-Shannon Divergence / Quantile Tracking):**
   - Monitor the distribution of model output scores $p(x)$. If the fraction of transactions scored above $p^* = 2.44\%$ suddenly doubles (e.g., from $0.5\%$ to $1.2\%$), it signals either a coordinated fraud attack or a distribution shift in legitimate traffic.

### Retraining & Deployment Protocol
- **Scheduled Cadence:** Continuous walk-forward retraining every **14 days**, training on the most recent 180-day window of fully matured data (trailing from $T - 60\text{d}$).
- **Event-Driven Retraining:** Immediate retraining triggered when:
  - Any top-5 feature exhibits $\text{PSI} > 0.25$ over a 72-hour rolling window.
  - Surge in short-term early dispute surrogates exceeding $+3\sigma$ standard deviations.
- **Champion-Challenger (Shadow Testing):**
  - Newly retrained challenger models are deployed in shadow mode for 7 days alongside the active champion.
  - Scores are compared on live incoming transactions to ensure stability before promoting the challenger to active traffic.
