# Milestone 3: Fraud Detection Evaluation

## 1. Problem Overview

The objective of this milestone is to evaluate a fraud detection model on a highly imbalanced dataset. Only 0.1% of transactions are fraudulent. Fraud labels are also delayed by 30–60 days, and transaction patterns may change over time. Therefore, the model must be evaluated using suitable metrics, realistic data splits, and financial costs rather than accuracy alone.

## 2. Why Accuracy Is Misleading

Accuracy is not a reliable metric for this problem because fraudulent transactions are extremely rare. A model that predicts every transaction as legitimate could achieve approximately 99.9% accuracy while failing to detect any fraud.

Therefore, precision, recall, Precision-Recall AUC (PR-AUC), the confusion matrix, and expected financial cost are more informative metrics. ROC-AUC can also be reported as a supplementary metric.

## 3. Evaluation Strategy

The dataset is divided chronologically into three subsets:

- **Training set:** 12,000 transactions (60%), used to train the model.
- **Validation set:** 4,000 transactions (20%), used to select the classification threshold.
- **Test set:** 4,000 transactions (20%), used for final evaluation.

A chronological split is appropriate because it simulates predicting future transactions using past data. The feature scaler is fitted only on the training data and then applied to the validation and test sets to prevent data leakage.

In a real fraud detection system, training must also respect label availability. Only labels available by the historical training cutoff should be used. Because chargeback labels can take up to 60 days to arrive, a maturity period should be allowed before treating transactions as fully labelled.

## 4. Evaluation Metrics and Results

The Python implementation uses a Random Forest classifier with class weighting to address class imbalance. The classification threshold is selected on the validation set by minimizing the cost of false negatives and false positives.

The test results are:

| Metric                        | Result |
| ----------------------------- | -----: |
| Overall fraud prevalence      | 0.100% |
| Validation-selected threshold |   0.12 |
| PR-AUC (Average Precision)    | 0.6877 |
| Precision                     | 0.2143 |
| Recall                        | 0.7500 |
| True positives (TP)           |      3 |
| False positives (FP)          |     11 |
| False negatives (FN)          |      1 |
| True negatives (TN)           |  3,985 |
| Total test cost               |   $255 |

The model detected 3 of the 4 fraudulent transactions in the test set, giving a recall of 75%. However, it also incorrectly flagged 11 legitimate transactions. Its precision was approximately 21.43%, meaning that roughly one in five flagged transactions was fraudulent.

The PR-AUC of 0.6877 indicates that the model can rank fraudulent transactions meaningfully in this synthetic experiment. However, only four fraudulent examples appear in the test set, so these results are highly sensitive to individual predictions and should not be considered a reliable estimate of real-world performance.

## 5. Cost-Sensitive Threshold Selection

The assignment specifies a cost of $200 for each missed fraudulent transaction and $5 for each incorrectly flagged legitimate transaction.

The total cost is calculated as:

**Total cost = (FN × $200) + (FP × $5)**

Using the test results:

- Cost of false negatives = 1 × $200 = $200.
- Cost of false positives = 11 × $5 = $55.
- **Total cost = $255.**

The threshold was selected using validation data rather than test data. This prevents the test set from influencing model selection.

If predicted probabilities are well calibrated and these are the only costs, the theoretical decision threshold is:

\[
t = \frac{C*{FP}}{C*{FP}+C\_{FN}}
= \frac{5}{5+200}
\approx 0.0244
\]

This corresponds to approximately 2.44%. However, the code selects a threshold empirically on the validation set. The theoretical threshold and the empirically selected threshold may differ because of probability calibration, model limitations, and the validation sample.

## 6. Delayed Labels and Temporal Drift

Fraud labels may arrive 30–60 days after a transaction. To prevent leakage, a production system should train only on labels that were available at the historical training cutoff. Recent transactions with pending labels should not automatically be treated as legitimate. Evaluation should use sufficiently mature outcomes.

Fraud patterns may also change over time, a problem known as **temporal drift**. The system should monitor changes in transaction features, fraud prevalence, precision, recall, PR-AUC, and financial cost. Once enough mature labels are available, performance should be reassessed and the model retrained when necessary.

## 7. Limitations

This implementation uses synthetic transaction data. Although it demonstrates class imbalance, chronological splitting, threshold selection, and cost-sensitive evaluation, it does not fully simulate delayed-label availability or establish realistic production-level temporal drift.

Furthermore, the test set contains only four fraudulent transactions. A larger and more representative dataset, repeated temporal evaluations, and calibration checks would be needed before deploying such a model.

## 8. Conclusion

This milestone demonstrates that fraud detection should be evaluated using metrics that reflect rare positive cases and the financial consequences of mistakes. Precision, recall, PR-AUC, confusion-matrix counts, and total cost provide a more useful evaluation than accuracy alone. Chronological splitting, delayed-label handling, cost-sensitive threshold selection, probability calibration, and drift monitoring are essential for a reliable real-world fraud detection system.

## Calibration and Delayed-Label Monitoring

### Calibration

A fraud model should produce probabilities that reflect the actual likelihood of fraud. Calibration can be evaluated using a reliability diagram, which groups predictions into probability bins and compares the average predicted probability with the observed fraud rate in each bin. A well-calibrated model has predicted probabilities close to observed fraud rates.

The Brier score measures the mean squared difference between predicted probabilities and actual binary labels. Log loss penalizes incorrect probability estimates, especially confident incorrect predictions. Lower Brier scores and log loss generally indicate better probabilistic predictions. These metrics should be evaluated on a separate, chronologically later dataset with sufficiently mature labels.

### Delayed Fraud Labels

Fraud labels may take 30–60 days to become reliable because chargebacks and investigations take time. Transactions should only be treated as confirmed non-fraud when the relevant label-maturity period has passed. Recent transactions with unresolved outcomes should be treated as pending rather than automatically labeled legitimate.

Evaluation should use a time-based cutoff and include only transactions whose outcomes have matured sufficiently. Track label maturity and reporting delays so that performance estimates are not biased by incomplete labels.

### Drift Monitoring and Retraining

Monitor changes in transaction features, fraud prevalence, precision, recall, PR-AUC, calibration, and the financial cost of false positives and false negatives. Recalculate performance as delayed labels become available. Retrain when sustained data or performance drift is detected, using recent data with mature labels. Validate the updated model on a later time period before deploying it.
