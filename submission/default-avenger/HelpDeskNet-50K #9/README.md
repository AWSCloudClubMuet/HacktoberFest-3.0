# HelpDeskNet-50K: Label Noise Audit and Mitigation Report

**Team Name:** Default Avenger  
**Track:** Machine Learning & Data Science  
**Issue:** #9 - Noisy Labels: HelpDeskNet-50K  

---

## 1. Overview
This report investigates why a fine-tuned customer ticket classifier on the HelpDeskNet-50K dataset is plateauing at 82% validation accuracy. By analyzing the 400-ticket audit sample, running statistical hypothesis tests, and studying the error distribution across categories, we show that this 82% ceiling is primarily caused by annotation errors in the crowd-labeled evaluation data rather than a failure of the model architecture.

---

## 2. Milestone 1: Quantifying Label Noise

### Sample Noise Rate and 95% Confidence Interval
From the audit sample of 400 crowd-labeled tickets, experts found 60 disagreements with the crowd workers.

* Total audited tickets (n): 400
* Observed disagreements (x): 60
* Sample noise proportion (p_hat):
  p_hat = 60 / 400 = 0.15 (15.0%)

Using the normal approximation for a proportion confidence interval:
* Standard Error (SE) = sqrt(p_hat * (1 - p_hat) / n)
  SE = sqrt(0.15 * 0.85 / 400) = sqrt(0.1275 / 400) = 0.01785 (1.79%)

* Margin of Error (ME) at 95% confidence level (Z = 1.96):
  ME = 1.96 * 0.01785 = 0.0350 (3.50%)

* 95% Confidence Interval:
  [15.0% - 3.50%, 15.0% + 3.50%] = [11.50%, 18.50%]

Stratified by the actual population of crowd tickets (20,000 from Tier A and 25,000 from Tier B out of 45,000 total crowd tickets):
* p_stratified = (20000 / 45000) * (12 / 180) + (25000 / 45000) * (48 / 220)
* p_stratified = 0.0296 + 0.1212 = 15.08%

We can conclude with 95% confidence that the true noise rate of the crowd-labeled dataset lies between 11.50% and 18.50%.

### Statistical Test: Tier A vs Tier B (Two-Proportion Z-Test)
We compare the error rates of the two crowd tiers to determine if the difference is statistically significant or just random variation.

* Tier A error rate: p_A = 12 / 180 = 6.67%
* Tier B error rate: p_B = 48 / 220 = 21.82%
* Observed difference: 21.82% - 6.67% = 15.15%

Hypothesis setup:
* H0: p_B - p_A = 0 (Both tiers have the same true error rate)
* H1: p_B - p_A > 0 (Tier B has a higher error rate than Tier A)

Test calculation:
* Pooled proportion (p_pool) = (12 + 48) / (180 + 220) = 60 / 400 = 0.15
* Pooled standard error (SE_diff) = sqrt(0.15 * 0.85 * (1/180 + 1/220)) = 0.03589
* Z-score = (p_B - p_A) / SE_diff = (0.2182 - 0.0667) / 0.03589 = 4.22
* P-value: p < 0.0001 (two-tailed p-value is approximately 2.44e-5)

Conclusion:
Since the p-value is far below the standard threshold of 0.05, we reject the null hypothesis. The difference is statistically significant. Tier B workers have a much higher error rate (roughly 3.3 times higher) than Tier A workers, showing that newer workers lacked proper training or clear instructions.

### Milestone 1 Execution Output
<img src="milestone 1 - results.png" width="700" alt="Milestone 1 Results" />

---

## 3. Milestone 2: Characterizing the Noise

### Analysis of the Disagreement Table
The 60 disagreements breakdown is as follows:

| Crowd Label -> Expert Label | Count | Percentage |
| :--- | :--- | :--- |
| Billing -> Refund | 14 | 23.3% |
| Refund -> Billing | 12 | 20.0% |
| Technical -> Account Access | 9 | 15.0% |
| Shipping -> Other | 8 | 13.3% |
| Account Access -> Technical | 6 | 10.0% |
| Technical -> Other | 5 | 8.3% |
| Other -> Shipping | 3 | 5.0% |
| Billing -> Other | 3 | 5.0% |

### Key Observations
1. The noise is systematic rather than random. Errors heavily cluster around specific class boundaries:
   * Billing and Refund account for 26 out of 60 errors (43.3%).
   * Technical and Account Access account for 15 out of 60 errors (25.0%).
   * Together, these two confusion pairs make up 68.3% of all labeling mistakes.
2. Root cause: The primary issue is ambiguous guidelines for overlapping customer requests. For example, a customer ticket saying "I was double charged on my subscription and need my money back" contains keywords for both Billing and Refund. Similarly, "I cannot log in because of a server error" can be tagged as either Technical or Account Access.
3. Recommended improvements in the annotation process:
   * Write explicit tie-breaking rules (e.g., if a customer explicitly requests money back, always label as Refund).
   * Implement a qualification test with feedback for Tier B workers before letting them work on real tickets.
   * Allow multi-label tagging or a secondary tag for tickets that cover more than one issue.

### Milestone 2 Execution Output
<img src="Milestone 2-results.png" width="700" alt="Milestone 2 Results" />

---

## 4. Milestone 3: Reason About the Accuracy Ceiling

### Estimating True Accuracy Under Uniform Noise
If we assume a simplified model where 15% of the labels are flipped uniformly at random to any of the other 5 classes:

A_noisy = A_true * (1 - eta) + (1 - A_true) * (eta / (K - 1))

Where:
* A_noisy = 0.82 (Observed accuracy on noisy test set)
* eta = 0.15 (Noise rate)
* K = 6 (Total number of classes)
* Flip probability to any single incorrect class = 0.15 / 5 = 0.03

Plugging in the numbers:
* 0.82 = A_true * (0.85) + (1 - A_true) * (0.03)
* 0.82 = 0.85 * A_true + 0.03 - 0.03 * A_true
* 0.82 = 0.82 * A_true + 0.03
* 0.79 = 0.82 * A_true
* A_true = 0.79 / 0.82 = 0.9634 (approximately 96.3%)

### Why This Estimate Is Unreliable
This 96.3% estimate is likely too high in practice because the uniform noise assumption does not hold:
* As shown in Milestone 2, errors are class-conditional, not uniform. A Billing ticket almost never flips to Shipping; it almost always flips to Refund.
* Because the noise is concentrated in specific classes, the model is penalized systematically rather than randomly. Therefore, while true accuracy is certainly higher than 82%, a realistic estimate on clean data is likely in the 88% to 91% range rather than 96.3%.

### Milestone 3 Execution Output
<img src="milestone 3 result.png" width="700" alt="Milestone 3 Results" />

---

## 5. Milestone 4: Plan for Reviewing 2,000 Additional Tickets

### Selection Strategy
To make the best use of the limited budget of 2,000 expert reviews:
1. Target Tier B tickets first: Since Tier B has a 21.8% error rate compared to 6.7% for Tier A, we should allocate 80% of the review budget (1,600 tickets) to Tier B, and 20% (400 tickets) to Tier A.
2. Filter by prediction margin / model loss: Run out-of-fold predictions with the trained model and select tickets where the model's predicted class disagrees with the crowd label with high confidence (low margin between top-1 and top-2 probabilities).
3. Focus on high-confusion classes: Prioritize tickets labeled as Billing, Refund, Technical, or Account Access, where over 68% of known errors occur.

### Evaluating the Selection Strategy
We can evaluate this method by tracking the hit rate (precision@2000):
* Hit rate = Number of actual errors found by experts / 2000
* A random sample would only find about 300 errors (15% of 2000). A successful targeted strategy should yield at least 600 or more confirmed errors (>30% hit rate).

### Using the Corrected Labels
* Reserve 1,000 of the newly verified tickets to build a clean, reliable validation set.
* Add the remaining 1,000 corrected tickets back into the training set with higher sample weights during fine-tuning.

### Milestone 4 Execution Output
<img src="milestone 4 output.png" width="700" alt="Milestone 4 Output" />

---

## 6. Milestone 5: Noise Mitigation and Evaluation Strategy

### Training Methods to Handle Residual Noise
1. Confident Learning (Cleanlab approach): Estimate the joint distribution of noisy crowd labels and model predictions using cross-validation. Identify and remove samples that are likely mislabeled before training the final model.
2. Robust Loss Functions (e.g., Symmetric Cross-Entropy or Loss Truncation): Standard cross-entropy easily overfits to wrong labels. Using a symmetric loss or capping the maximum loss value prevents corrupted crowd labels from dominating gradient updates.

### Building a Trustworthy Evaluation Set
* Stop evaluating on the crowd-labeled test set: The current test set contains roughly 15% errors, which penalizes the model even when it makes the correct prediction and encourages it to memorize crowd mistakes.
* Use the expert-labeled data: The dataset already has 5,000 tickets (10% of the data) labeled by in-house expert agents. This subset should be used as the official, clean benchmark test set to evaluate real model performance.

### Milestone 5 Execution Output
<img src="milestone 5 output.png" width="700" alt="Milestone 5 Output" />

---

## 7. How to Run the Code
The calculations and data analysis can be verified by running the script:
```bash
python analysis.py