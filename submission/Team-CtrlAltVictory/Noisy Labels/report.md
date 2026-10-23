# HelpDeskNet-50K: Label Noise Analysis & Mitigation Strategy

## Executive Summary

The classifier's 82% plateau is consistent with a noise ceiling in the evaluation labels. About 15% of crowd labels disagree with an expert, and a perfect model would score only about 85% on a test set with that much noise. This cannot be confirmed until the model is scored on a clean, expert-labeled test set. The noise is systematic, concentrated in a few confusable class pairs, and roughly three times higher for Tier B workers than for Tier A. The plan is a targeted expert review, noise-robust training, and a gold test set drawn only from random expert-labeled tickets.

## Milestone 1: Quantify Label Noise

Audit of 400 randomly selected crowd tickets, with 60 disagreements. Here "noise" means disagreement with a single expert, who can also be wrong, so the true noise rate may differ somewhat.

| Quantity | Calculation | Result |
|---|---|---|
| Overall noise rate | 60 / 400 | 15.0% |
| Standard error | sqrt(0.15 × 0.85 / 400) | 0.0179 |
| 95% CI (Wald) | 0.15 ± 1.96 × 0.0179 | 11.5% to 18.5% |
| 95% CI (Wilson) | | 11.8% to 18.8% |
| Population-weighted rate | (20,000 × 6.67% + 25,000 × 21.82%) / 45,000 | 15.1% |

| Tier | Audited | Disagreements | Rate |
|---|---|---|---|
| Tier A | 180 | 12 | 6.67% |
| Tier B | 220 | 48 | 21.82% |

**Two-proportion z-test (H0: p_A = p_B).**
- Pooled rate = 60 / 400 = 0.15.
- SE = sqrt(0.15 × 0.85 × (1/180 + 1/220)) = 0.0359.
- z = (0.2182 − 0.0667) / 0.0359 = 4.22, so p ≈ 2.4 × 10⁻⁵.
- The difference is 15.2 percentage points, with a 95% CI of about 8.6 to 21.8 points (unpooled SE = 0.0335).
- Tier B's rate is 3.3 times Tier A's.

The difference is not plausibly due to chance. Tickets were not necessarily assigned to tiers at random, so Tier B may also have received harder tickets. The data shows that Tier B is noisier, not why.

*Data note:* the bundled CSV has 71 audited disagreements (14 in Tier A, 57 in Tier B), not 60. The analysis above uses the figures stated in the task.

## Milestone 2: Characterize the Noise

| Confusion pair | Disagreements | Share |
|---|---|---|
| Billing ↔ Refund (14 + 12) | 26 | 43.3% |
| Technical ↔ Account Access (9 + 6) | 15 | 25.0% |
| Shipping ↔ Other (8 + 3) | 11 | 18.3% |
| Technical → Other | 5 | 8.3% |
| Billing → Other | 3 | 5.0% |

The first two pairs account for 68.3% of all disagreements, and every disagreement involves a semantically adjacent pair. Under uniform random noise, errors would spread across all 30 possible class transitions. Only 8 occur, so the noise is class-dependent and systematic. Several pairs are close to symmetric (Billing ↔ Refund 14 vs 12), which points to an ambiguous class boundary rather than a one-directional bias. Shipping → Other (8) is larger than Other → Shipping (3), which suggests Other acts as a catch-all for unclear tickets.

**Most likely root cause:** the class definitions overlap. A billing dispute and a refund request are hard to tell apart, and so are a login bug and an access problem. Workers with less training resolve those cases inconsistently, which is why Tier B is worse.

**What to check or change:**
- Check whether the same pairs also dominate Tier A's errors. If so, the guidelines are the problem; if not, training is.
- Rewrite the guidelines with decision rules and examples for each confusable pair.
- Require a qualification test and ongoing gold-ticket checks for new workers.
- Collect several labels per ticket on a sample to measure inter-annotator agreement.
- Consider merging classes or adding an "unsure" option.
- Estimate class-conditional noise rates. A confident-joint estimate on the dataset gives roughly 15% for every class, so the noise is concentrated in specific pairs rather than in specific classes.

## Milestone 3: Reason About the Accuracy Ceiling

Let a be the true accuracy, η = 0.15 the flip rate, and q the chance that the crowd label equals the model's wrong prediction. Under uniform noise, q = η / 5 = 0.03.

Observed accuracy = a(1 − η) + (1 − a)q, so a = (0.82 − 0.03) / (0.85 − 0.03) = 0.79 / 0.82 ≈ **96.3%**.

**Why this is unreliable:**
- **Non-uniform noise.** Flips happen between confusable pairs, so the 1/5 split across other classes is wrong.
- **Correlated errors.** Ambiguous tickets are hard for the model and also likely to be mislabeled, so model errors often match the crowd's. If q = 0.5, the estimate falls to about 91%; if q = 0.7, about 80%. These values are illustrative.
- **Uncertain noise rate.** The 15% has a CI of 11.8% to 18.8%. Under the uniform formula, noise above 18% is impossible given 82% observed accuracy, since even a perfect model would score only 1 − η. The noise rate itself is also measured against a fallible expert.

## Milestone 4: Find the Bad Labels

**Selection strategy for 2,000 reviews:**
1. Exclude tickets that are already expert-labeled or audited.
2. Train TF-IDF + logistic regression on the crowd labels with 5-fold cross-fitting, so no ticket is scored by a model that trained on it.
3. Apply confident learning: per-class thresholds on out-of-fold probabilities, then rank by the margin between the best other class and the given class, with a small Tier B boost.
4. Allocate the targeted budget across given-label classes in proportion to each class's number of suspects, and rank within each class. Without this, one confusion (Account Access → Technical) took half the budget and Refund was missed entirely.
5. Split the 2,000 as 1,800 targeted plus 200 random control.

**Evaluation of the method.** The metric is precision: the share of reviewed tickets confirmed mislabeled. The random control gives the baseline and an unbiased noise estimate, and the lift is targeted precision divided by control precision, with Wilson CIs. Recall is the share of all estimated bad labels captured within the budget. On this dataset:

| Arm | Reviewed | Precision (95% CI) |
|---|---|---|
| Targeted | 1,800 | 100.0% (99.8% to 100.0%) |
| Random control | 200 | 18.5% (13.7% to 24.5%) |

The lift is 5.4× and the targeted arm catches 26.4% of all bad labels in the pool. The targeted queue covers all six given-label classes (Refund 549, Account Access 446, Technical 294, Billing 288, Other 181, Shipping 42). The queue is 98% Tier B. These results are inflated because the dataset has only about 200 distinct ticket templates. On real tickets, expect much lower precision, and compare against simpler rankers at the same budget.

**Using the corrected labels:**
- Replace the crowd labels with expert labels on all reviewed tickets and retrain.
- Use the (crowd label, expert label) pairs to estimate the transition matrix for loss correction. Only the random control is an unbiased sample, so weight the arms accordingly.
- Do not use the targeted tickets as a test set, because they were chosen for being likely mislabeled.

## Milestone 5: Mitigate Noise & Evaluate Reliably

**Two noise-tolerant training methods:**
1. **Forward loss correction.** Train with cross-entropy on softmax(logits) × T, where T[i][j] is the probability of crowd label j given true class i. Estimate T with a confident joint over cross-fitted probabilities, and refine it with the reviewed pairs. A 6×6 matrix cannot be estimated from the 60 audit disagreements alone.
2. **Symmetric cross-entropy.** This adds a reverse term that bounds the loss, so wrong labels pull the model less. Label smoothing and co-teaching are alternatives.

Confident-learning pruning is a useful data-cleaning step, but it works on the data rather than in the loss, and it is already used in Milestone 4.

**Trustworthy evaluation set:**
- Use the 5,000 expert-labeled tickets, and keep them out of training. First confirm they are a random sample. If the experts chose tickets themselves, they may be easier or unrepresentative.
- Check their class shares against the stated distribution. The maximum gap here is 0.6%.
- Split them with stratification into 2,000 for validation and 3,000 for the gold test set.
- Have a second expert label, or adjudicate, a sample of the test labels, since experts also make mistakes.
- Report accuracy with CIs, including per class. With 3,000 tickets, Other has about 153 test tickets, so its CI half-width is about ±4.8% at 90% accuracy.

**Why the crowd-labeled test set is a problem:**
- It carries the same roughly 15% noise, so a perfect model scores only about 85% on it.
- Errors are systematic, so a model that learns the crowd's mistakes is rewarded and a model that is right is penalized.
- Differences between models become hard to read, because noise can hide real gains.
