HelpDeskNet-50K — Noisy Label Analysis

 Milestone 1: Quantifying Label Noise

 Objective

The objective of this milestone is to estimate the amount of annotation noise in the HelpDeskNet-50K scenario and determine whether Tier A and Tier B annotators have significantly different disagreement rates.

 Methodology

The provided audit consists of 400 crowd-labeled support tickets independently reviewed by expert annotators. Out of these, 60 labels disagreed with expert judgments, resulting in an observed disagreement rate of 15%.

A 95% Wilson confidence interval was calculated to quantify uncertainty around the pooled disagreement estimate. It ranged from approximately 11.83% to 18.83%.

Because the full crowd-labeled population contains 20,000 Tier A tickets and 25,000 Tier B tickets, a population-weighted estimate was also calculated. The resulting estimated disagreement rate was 15.08%, with an approximate stratified 95% confidence interval of 11.65%–18.51%.

 Tier Comparison

Tier A had 12 disagreements among 180 audited tickets, resulting in a disagreement rate of 6.67%.

Tier B had 48 disagreements among 220 audited tickets, resulting in a disagreement rate of 21.82%.

A two-sided two-proportion z-test was performed to determine whether the difference was statistically significant.

The resulting z-statistic was approximately -4.222, with a p-value of 0.0000242.

 Results and Interpretation

The statistical test provides strong evidence that the underlying disagreement rates differ between the two annotator tiers. Tier B has a substantially higher observed disagreement rate than Tier A.

This suggests that Tier B annotations may benefit from increased quality monitoring, clearer guidelines, and targeted expert review.

However, these results do not establish the specific cause of the difference. Additionally, disagreement is treated as label error only under the assumption that expert judgments accurately represent ground truth.

 Conclusion

The findings indicate meaningful annotation-quality problems in the HelpDeskNet-50K scenario. Approximately 15% of audited crowd labels disagreed with experts, and the disagreement rate was significantly higher for Tier B.

These findings motivate further investigation into systematic label confusion and targeted annotation improvements in the following milestones. 


Milestone 2: Characterizing Label Noise

Objective:

The objective of this milestone is to identify systematic annotation errors in the HelpDeskNet-50K dataset and investigate why certain support-ticket categories are frequently confused.

Methodology:

The provided expert-audit results contain 60 disagreements between crowdworker labels and expert judgments. We analyzed the directed confusion counts and grouped related category pairs to identify recurring patterns.

The analysis was visualized using a horizontal bar chart generated with Python and Matplotlib.

Results:

| Confusion Pair | Disagreements | Percentage |
|---|---:|---:|
| Billing ↔ Refund | 26 | 43.33% |
| Technical ↔ Account Access | 15 | 25.00% |
| Shipping ↔ Other | 11 | 18.33% |
| Technical → Other | 5 | 8.33% |
| Billing → Other | 3 | 5.00% |
| Total | 60 | 100% |

The most frequent confusion occurs between Billing and Refund, accounting for 43.33% of all observed disagreements.

Technical and Account Access account for another 25%, while Shipping and Other account for 18.33%.

Together, these three confusion pairs account for approximately 86.67% of the audit disagreements.

![Label Confusion Analysis](confusion_pairs.png)

Interpretation:
The concentration of errors within a few category pairs suggests that annotation mistakes are not uniformly distributed across all possible label combinations.

Some support-ticket categories have overlapping meanings. For example, a customer requesting reimbursement for an incorrect charge might be classified as either Billing or Refund, depending on how the labeling guidelines define the categories.

Similarly, a user unable to access an account because of a technical malfunction may be labeled Technical or Account Access.

These observations suggest possible systematic annotation noise. However, individual ticket records and annotation instructions would be required to confirm the underlying causes.

Recommendations:

1.Improve annotation guidelines: Define each ticket category clearly and provide examples of difficult cases.

2.Introduce decision rules: Explain how annotators should handle tickets involving multiple related categories.

3.Provide targeted annotator training:Focus additional training on frequently confused categories, especially Billing and Refund.

4.Use expert adjudication: Refer ambiguous or disputed tickets to experienced reviewers.

5.Monitor annotation quality: Track disagreements across annotator tiers and ticket categories.

6.Introduce double annotation: Use independent annotators for selected high-risk tickets and resolve disagreements through expert review.

Conclusion:

The analysis identified concentrated patterns of labeling disagreement, particularly between Billing and Refund, Technical and Account Access, and Shipping and Other.

These findings support improving the annotation process through clearer category definitions, targeted training, and expert review.

Reducing such disagreements could improve the reliability of training and evaluation labels used in future machine learning experiments.  




Milestone 3: Reasoning About the Accuracy Ceiling

 Objective

The objective of this milestone is to investigate how noisy evaluation labels can affect reported classifier accuracy and estimate the underlying true accuracy under a simplified label-noise assumption.

 Given Information

The HelpDeskNet-50K classifier reports 82% accuracy against crowd-labeled evaluation data.

The observed annotation disagreement rate is approximately 15%, and the dataset contains six ticket categories.

For this milestone, we assume that each true label has an independent 15% probability of being replaced uniformly by one of the other five classes.

 Methodology

Let:

- A_noisy = 0.82 represent observed accuracy.
- A_true represent actual accuracy against correct labels.
- η = 0.15 represent the assumed label-flipping probability.
- K = 6 represent the number of classes.

Under the uniform label-noise model:

A_noisy = (1 − η) × A_true + [η / (K − 1)] × (1 − A_true)

Rearranging:

A_true = [A_noisy − η / (K − 1)] / [1 − η − η / (K − 1)]

Substituting the supplied values:

A_true = (0.82 − 0.15/5) / (1 − 0.15 − 0.15/5)

A_true = 0.79 / 0.82

Estimated true accuracy = 96.34%.

 Implementation

The calculation was implemented in Python through the `corrected_accuracy()` function inside `src/analysis.py`.

The resulting estimate was saved in `outputs/results.json` under the field `noise_model_accuracy_estimate`.

 Interpretation

The calculation indicates that a classifier reporting 82% accuracy against noisy evaluation labels could have an estimated true accuracy of approximately 96.34% under the specified uniform-flipping model.

This illustrates how inaccurate evaluation labels can make a classifier appear less accurate than it actually is.

 Limitations:

The estimate is theoretical and has not been validated using a clean, expert-labeled test set.

The actual annotation process may violate the independence and uniform-noise assumptions.

For example, the audit shows concentrated confusion between Billing and Refund, while annotator tiers exhibit different disagreement rates.

These patterns suggest that the actual noise process may be class-dependent or annotator-dependent.

Therefore, 96.34% must not be presented as an experimentally verified model accuracy.

Conclusion:

Noisy evaluation labels can substantially distort reported classifier performance.

Although the uniform-noise model produces an estimated true accuracy of 96.34%, trustworthy evaluation requires a separate, representative expert-labeled test set.

This motivates the improved evaluation procedure proposed in Milestone 5.

## Milestone 4: Finding Potentially Incorrect Labels

### Objective

The objective of this milestone is to design and demonstrate a strategy for prioritizing 2,000 customer-support tickets for expert review from a population of 45,000 crowd-labeled tickets.

Since expert review is expensive and time-consuming, the strategy aims to prioritize suspected labeling errors while maintaining a random comparison group.

### Dataset and Implementation

The HelpDeskNet-50K problem provides aggregate statistics rather than individual customer-support records.

To demonstrate the proposed selection methodology, we generated 45,000 synthetic ticket records using Python.

The synthetic dataset contains ticket identifiers, annotator tiers, simulated true labels, crowdworker labels, simulated predictions, and confidence scores.

The simulation uses the six ticket categories and approximate tier-specific disagreement rates from the problem scenario.

**The synthetic records and model predictions are illustrative. No real customer tickets were reviewed, and no classifier was trained for this demonstration.**

The implementation is provided in `src/review_strategy.py`.

### Proposed Expert-Review Allocation

| Selection Method | Tickets | Percentage |
|---|---:|---:|
| High-confidence model-label disagreements | 1,000 | 50% |
| Known confusion-pair candidates | 500 | 25% |
| Uncertain or rare-category cases | 300 | 15% |
| Random control sample | 200 | 10% |
| **Total** | **2,000** | **100%** |

The allocation is a proposed design rather than a requirement specified by the hackathon problem.

### Selection Methodology

The algorithm first reserves 200 randomly selected tickets as a control group.

It then prioritizes 1,000 high-confidence disagreements between the recorded labels and simulated model predictions.

Next, it selects 500 cases involving known confusion pairs, particularly Billing–Refund, Technical–Account Access, and Shipping–Other.

Another 300 tickets are selected from uncertain predictions or relatively rare categories.

Duplicate ticket identifiers are excluded. If any category cannot fill its allocated quota, the algorithm includes a fallback procedure to maintain the total review budget.

The selection algorithm does not use the synthetic `true_label` field. The exported review queue excludes this field to prevent ground-truth leakage.

### Implementation Results

The program successfully generated a synthetic dataset containing 45,000 records and selected exactly 2,000 unique tickets for the proposed expert-review queue.

The exported file `outputs/review_queue.csv` includes the selected ticket identifiers, annotator tiers, recorded labels, simulated predictions, confidence scores, and review-selection reasons.

The selection process produced the intended allocation:

- 1,000 high-confidence disagreements
- 500 known confusion-pair candidates
- 300 uncertain or rare-category cases
- 200 random control examples

Automated testing confirmed that the selection function respects the review budget, avoids duplicate ticket IDs, excludes true labels from the review queue, produces reproducible results with a fixed random seed, and rejects invalid review budgets.

All 10 project tests passed.

### Evaluation Strategy

In a real implementation, the selected tickets would be independently reviewed by qualified experts.

We would calculate error-discovery precision as:

Precision@K = Confirmed labeling errors / Reviewed tickets

We would also compare targeted-review error-discovery rates against the random control group.

After expert corrections, a classifier could be retrained and evaluated using a separate clean test set. Changes in accuracy, macro F1-score, and class-specific performance would help determine whether targeted correction improves model performance.

### Limitations

The demonstration uses synthetic records and simulated prediction confidences. These confidences are not outputs from an actual trained classifier and have not been calibrated.

Consequently, the experiment demonstrates the functionality and reproducibility of the selection algorithm but does not establish its real-world error-detection effectiveness.

The synthetic `true_label` field is available for simulation purposes only and must not be used during review-candidate selection.

Actual ticket records, out-of-fold model probabilities, and expert-verified corrections would be required to evaluate the approach empirically.

### Conclusion

The proposed strategy provides a reproducible way to prioritize a limited expert-review budget.

The implemented Python demonstration successfully selects 2,000 unique review candidates from 45,000 synthetic tickets while maintaining a random comparison group.

The approach illustrates how targeted label auditing could be organized in a real customer-support classification system, subject to future validation using authentic data. 

## Milestone 5: Noise-Robust Training and Reliable Evaluation

### Objective

The objective of this milestone is to recommend machine learning methods that reduce the influence of incorrectly labeled training data and develop a trustworthy procedure for evaluating classifier performance.

### Method 1: Label Smoothing

Label smoothing modifies one-hot training targets by distributing a small amount of probability across all classes.

For six classes and a smoothing factor of 0.1, the labeled class receives approximately 91.67% target probability, while each other class receives approximately 1.67%.

This discourages excessive confidence in individual annotations and can improve generalization under some conditions.

We implemented a reproducible NumPy demonstration in `src/robust_training.py`. The demonstration compares ordinary and smoothed target distributions and calculates their cross-entropy losses for illustrative class probabilities.

No real HelpDeskNet model was trained or evaluated.

### Method 2: Co-teaching

Co-teaching uses two neural networks to reduce the influence of potentially mislabeled examples.

Each network selects a subset of relatively low-loss training examples and provides those examples to the other network for updating its parameters.

The method aims to limit the influence of noisy labels during training.

However, it may also exclude difficult but correctly labeled examples, and its effectiveness depends on the noise process, model architecture and training configuration.

Co-teaching is proposed as a future experiment, not implemented or empirically tested in this submission.

### Reliable Evaluation Strategy

We recommend constructing a separate, representative expert-labeled test set.

Tickets should be independently labeled by qualified experts, with disagreements resolved through documented adjudication.

The resulting test set must remain isolated from model training, hyperparameter tuning and label-selection procedures.

The ordinary cross-entropy baseline, label smoothing and Co-teaching approaches should be evaluated on the same held-out test set.

Recommended metrics include:

- Overall accuracy
- Macro F1-score
- Per-class precision
- Per-class recall
- Confusion matrix

### Why the Existing Test Set Is Unreliable

The original evaluation process uses crowd-labeled records that may contain annotation errors.

A correct model prediction could be marked incorrect because the recorded label is wrong.

Conversely, an incorrect prediction could accidentally match an incorrect recorded label and be counted as correct.

Consequently, the reported 82% accuracy may not reliably represent performance against the true labels.

The theoretical correction performed in Milestone 3 depends on assumptions that may not match the real annotation process.

An independently verified evaluation set is required to establish trustworthy performance.

### Limitations

The HelpDeskNet-50K scenario provides aggregate statistics but no real ticket-level training or evaluation dataset.

The label-smoothing implementation demonstrates the mathematical technique using illustrative probabilities.

No accuracy improvement, macro F1 improvement or reduced label-error rate has been experimentally established.

Training the proposed methods and measuring their effectiveness remain future work.

### Conclusion

Label smoothing and Co-teaching are two candidate approaches for reducing the impact of noisy training labels.

Label smoothing is relatively simple to implement, whereas Co-teaching provides a more specialized noise-handling strategy.

Neither technique guarantees improved performance.

A clean, expert-labeled and properly isolated evaluation set is essential for determining whether any proposed training method actually improves HelpDeskNet-50K classification.