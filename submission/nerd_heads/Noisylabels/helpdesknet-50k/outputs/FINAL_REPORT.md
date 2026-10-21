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