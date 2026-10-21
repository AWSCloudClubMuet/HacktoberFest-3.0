# Milestone 3: Fraud Detector Evaluation

**Setup:** Only 0.1% of transactions are fraud. Fraud labels (chargebacks) arrive 30–60 days late, and fraud patterns keep changing. A missed fraud costs $200 and a false alarm costs $5.

## 1. Metrics

**Use:**
- **PR-AUC** (precision–recall area): it focuses on the rare fraud cases.
- **Precision and recall at a fixed alert limit**: analysts can only review so many alerts.
- **Total cost** (200 × missed frauds + 5 × false alarms): this is the real business goal.
- **Log loss / Brier score**: they check whether the probabilities are trustworthy.

**Avoid:**
- **Accuracy**: "always say not fraud" scores 99.9%.
- **ROC-AUC alone**: it can look great even when most alerts are false alarms.
- **F1 at 0.5 threshold**: scores almost never reach 0.5, and F1 treats both mistakes as equal.

## 2. Train / Validation / Test Split

Split **by time**, not randomly:

`Train (oldest) → 60-day gap → Validation → 60-day gap → Test (newest)`

- A random split leaks the future into training and gives fake-good results.
- The 60-day gaps make sure every label is final (the longest delay is 60 days).
- The test set is used **once**, at the end.
- Repeat the split over several time windows (walk-forward) to check the model stays stable.

## 3. Handling Label Delay

- Evaluate only on **old transactions** whose labels are final. Recent "non-fraud" may just not be reported yet.
- Use fast signals (customer reports, analyst confirmations) as early warnings.
- Run the new model **in shadow mode** (scores logged, no action) until labels arrive.
- Keep a small random sample of transactions the model would block, so we still learn if it was right.

## 4. Threshold and Calibration

Flag a transaction when the expected cost of flagging is lower than not flagging:

**5 × (1 − p) < 200 × p → p > 5 / 205 ≈ 0.0244 (about 2.4%)**

In simple words: catching one fraud is worth 40 false alarms, so we flag anything above about 2.4% fraud probability. This only works if the model's probabilities are **calibrated**.

**Check calibration with:**
- a reliability diagram (predicted vs actual fraud rate, using quantile bins),
- average predicted rate vs actual fraud rate,
- Brier score and log loss.

**Fix with:** Platt scaling (logistic recalibration) or a prior-shift correction if training used resampling.

## 5. Drift and Retraining

**Watch (no labels needed):**
- score distribution (PSI or KS test),
- input feature distributions,
- the share of transactions flagged.

**Watch (once labels arrive):**
- PR-AUC, total cost and calibration over time.

**Retrain when:**
- on a regular schedule (for example monthly),
- when drift alerts fire or total cost rises past an agreed limit.

Only replace the live model if the new one has a clearly lower cost in shadow mode.

> **Note:** The 2.4% threshold is calculated directly from the given costs, assuming correct decisions cost $0. Common PSI alert levels (about 0.1 and 0.25) are rules of thumb without a verified source, so tune them on your own data.