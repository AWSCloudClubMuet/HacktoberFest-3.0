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