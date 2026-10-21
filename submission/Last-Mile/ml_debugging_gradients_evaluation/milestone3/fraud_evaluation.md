# Milestone 3 — Fraud evaluation strategy

## Why accuracy fails

At a fraud prevalence of 0.1%, predicting every transaction as legitimate yields 99.9% accuracy and zero fraud recall. Accuracy must not be the primary metric.

## Metrics

Use:
- Precision and fraud recall.
- PR-AUC / average precision as a primary ranking metric.
- ROC-AUC as a secondary ranking metric.
- Confusion matrix, false-positive rate, precision at review capacity, and recall at a fixed false-positive rate.
- Expected financial cost at the actual threshold.
- Calibration metrics: reliability diagram, Brier score, and log loss.

Avoid relying on accuracy. Use F1 cautiously because it imposes a fixed precision/recall trade-off unrelated to the stated dollar costs.

## Split design

Use chronological, label-maturity-aware partitions:
1. Older fully matured data for training.
2. A later fully matured validation window for hyperparameters, calibration, and threshold selection.
3. A still later, untouched, fully matured test window for final evaluation.

The example months are task-dependent; ensure enough positive cases. Use group-aware splitting if the goal is generalization to unseen accounts. For realistic scoring of existing accounts, allow only historical account information available at transaction time.

Avoid future-feature leakage. Do not label immature transactions as confirmed negatives.

## Delayed labels

- Official evaluation uses mature cohorts.
- Monitor recent cohorts provisionally using score distribution, alert volume, and early confirmed cases.
- Measure the label-delay distribution and assess whether it differs across segments.
- If necessary, use justified methods for censored outcomes, such as inverse-probability-of-censoring weighting, only when assumptions are defensible.
- Backtest using historical point-in-time features and model versions.

## Cost-based threshold

Given false-negative cost $200 and false-positive cost $5, let `p` be calibrated fraud probability.

Expected cost of allowing:
`C_allow = 200 p`

Expected cost of flagging:
`C_flag = 5 (1-p)`

Flag when `5(1-p) < 200p`, which gives:

`p > 5 / 205 ≈ 0.02439`, or approximately **2.44%**.

This assumes the stated costs capture all relevant consequences and that the action is a binary flag/allow decision. Review capacity, customer friction, prevented-loss fractions, and additional intervention costs may alter the optimal threshold.

## Calibration

Check reliability diagrams and compare average predicted risk with observed fraud rate across bins. Use Brier score and log loss. Evaluate calibration by segment and across time. Fit Platt scaling or isotonic regression on a separate mature validation/calibration set, not the final test set.

## Drift and retraining

Monitor:
- Feature distributions, missingness, and categorical changes.
- Score distributions and alert rates.
- Mature-label PR-AUC, recall, precision, calibration, false-positive rate, and expected cost.
- Operational capacity, chargeback delays, and legitimate-customer friction.

Set alert thresholds from historical variability and business tolerance. Investigate whether drift reflects data-quality problems, feature-semantic changes, population shifts, or changed fraud behavior. Retrain when sustained material drift or confirmed performance degradation justifies it; compare candidates on a later chronological validation window and roll out gradually with rollback capability.
