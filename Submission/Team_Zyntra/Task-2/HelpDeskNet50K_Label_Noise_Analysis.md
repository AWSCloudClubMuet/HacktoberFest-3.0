# HelpDeskNet-50K Label Noise Analysis

**Dataset:** HelpDeskNet-50K (customer-support ticket classification)
**Subject:** Label Noise Analysis and Mitigation
**Date of preparation:** 21 October 2026

> **Note:** HelpDeskNet-50K and the scenario described in this report are fictional. All numbers come from the information supplied in the assignment brief. No model was trained, no dataset was downloaded, and no experiments were run. Where a calculation depends on a simplifying assumption, the assumption is stated explicitly.

---

## 1. Introduction

### 1.1 What is label noise?

Label noise means that some of the labels attached to training or test examples are wrong. In a customer-support setting, a ticket about a duplicate charge might be tagged "Billing" when the correct category, according to the company's own rules, is "Refund". The ticket text is fine; the label attached to it is not.

Noise can be random (any label can be replaced by any other with equal chance) or systematic (mistakes concentrate on particular class pairs, particular annotators, or particular kinds of text). Systematic noise is usually harder to deal with, because it does not average out.

### 1.2 Why it harms supervised text classification

A supervised classifier learns by treating the provided labels as the truth. If the labels are partly wrong, the model is trained to reproduce those mistakes. Large neural networks are flexible enough to memorise noisy labels, which can hurt performance on new data. Noise also affects *evaluation*: if the test labels are wrong, the accuracy figure is measuring agreement with the annotators, not correctness.

### 1.3 Why a model might plateau at 82%

The brief says a fine-tuned classifier reached 82% accuracy on the held-out test set, and that more epochs or a larger model did not help. This is consistent with label noise acting as a ceiling: if the labels the model is graded against are only partly correct, no amount of extra capacity can push the score to 100%. However, it does not *prove* label noise is the cause. Genuine ambiguity in the tickets, missing information in the text, or weaknesses in the model could also contribute. This report treats label noise as a strong hypothesis and uses the expert audit to test it.

### 1.4 Objectives

1. Quantify how noisy the crowd labels are, with a confidence interval, and compare the two worker tiers.
2. Describe the pattern of the noise and discuss possible causes.
3. Estimate, under clearly stated assumptions, what the accuracy ceiling might look like.
4. Design a way to use 2,000 additional expert reviews as effectively as possible.
5. Recommend noise-tolerant training methods and a more trustworthy evaluation procedure.

### 1.5 Summary of the data used

| Item | Value |
|---|---|
| Total tickets | 50,000 |
| Expert-labeled | 5,000 (10%) |
| Crowd-labeled | 45,000 (90%) |
| Tier A (10 experienced workers) | 20,000 tickets |
| Tier B (30 newer workers) | 25,000 tickets |
| Audit sample (random, crowd-labeled) | 400 tickets |
| Disagreements found in the audit | 60 |
| Additional expert review budget | 2,000 tickets |
| Reported test accuracy | 82% |

Class distribution: Billing 30%, Refund 15%, Technical 25%, Account Access 15%, Shipping 10%, Other 5%.

A quick check that the audit sample looks representative of the two tiers: Tier A produced 20,000 of the 45,000 crowd labels (44.4%), and made up 180 of the 400 audited tickets (45.0%). Tier B produced 55.6% of the crowd labels and made up 220 of 400 (55.0%). These are close, so the sample mix matches the population mix well.

---

## 2. Milestone 1: Quantify Label Noise

### 2.1 Overall noise rate

The simplest estimate of the noise rate is the fraction of audited tickets on which the expert disagreed with the crowd:

$$
\hat{p} = \frac{\text{disagreements}}{\text{audited tickets}} = \frac{60}{400} = 0.15 = 15\%
$$

**What this means.** In a random sample of 400 crowd-labeled tickets, 15% received a different label from an independent expert. If the audit sample is representative, we would expect something near 15% of all crowd-labeled tickets to carry a label that an expert would change.

**Extrapolation to the full crowd-labeled set.**

$$
0.15 \times 45{,}000 = 6{,}750 \text{ tickets}
$$

This is an *extrapolation*, not a confirmed count. Nobody has checked the other 44,600 tickets. The real number could be higher or lower (see the confidence interval below). It is also a count of tickets where the expert and crowd disagree, which is not exactly the same as tickets that are definitely wrong, since the expert could occasionally be the one who is mistaken.

As a consistency check, weighting each tier's own rate by its share of the crowd-labeled tickets gives almost the same answer:

$$
\frac{20{,}000 \times 0.0667 + 25{,}000 \times 0.2182}{45{,}000} = \frac{1{,}333 + 5{,}455}{45{,}000} \approx 15.08\%
$$

That works out to about 6,788 potentially incorrect labels (about 1,333 in Tier A and 5,455 in Tier B), which agrees with the 6,750 figure within rounding. It also shows that Tier B accounts for roughly 80% of the estimated noisy labels, even though it labeled only 55.6% of the tickets.

Across the whole dataset, assuming the 5,000 expert-labeled tickets are essentially clean, 6,750 out of 50,000 is about 13.5%.

### 2.2 95% Wilson confidence interval

A single percentage from a sample of 400 is uncertain. The Wilson score interval is a good choice for proportions because it behaves better than the simple "plus or minus" interval when the sample is moderate in size.

**Formula**

$$
\text{CI} = \frac{\hat{p} + \dfrac{z^2}{2n} \;\pm\; z\sqrt{\dfrac{\hat{p}(1-\hat{p})}{n} + \dfrac{z^2}{4n^2}}}{1 + \dfrac{z^2}{n}}
$$

**Variables**

- $\hat{p} = 0.15$ is the observed disagreement proportion
- $n = 400$ is the number of audited tickets
- $z = 1.96$ is the critical value for 95% confidence

**Substitution**

First the pieces:

- $z^2 = 3.8416$
- $z^2/n = 3.8416/400 = 0.009604$
- $z^2/(2n) = 0.004802$
- $\hat{p}(1-\hat{p})/n = (0.15 \times 0.85)/400 = 0.1275/400 = 0.00031875$
- $z^2/(4n^2) = 3.8416/640{,}000 = 0.000006$

Centre of the interval:

$$
\frac{0.15 + 0.004802}{1.009604} = \frac{0.154802}{1.009604} \approx 0.15333
$$

Half-width:

$$
\frac{1.96\sqrt{0.00031875 + 0.000006}}{1.009604} = \frac{1.96 \times \sqrt{0.00032475}}{1.009604} = \frac{1.96 \times 0.018021}{1.009604} \approx 0.03499
$$

**Bounds**

- Lower: $0.15333 - 0.03499 = 0.11834 \approx 11.8\%$
- Upper: $0.15333 + 0.03499 = 0.18831 \approx 18.8\%$

So the 95% Wilson confidence interval is approximately **11.8% to 18.8%**.

**Translating back to ticket counts** (still extrapolation): 11.8% of 45,000 is about 5,300 tickets, and 18.8% is about 8,500. So the plausible range for potentially incorrect crowd labels is roughly 5,300 to 8,500.

**Point estimate vs confidence interval.** The 15% is a point estimate: our single best guess from this sample. The interval shows how much that guess could move if we had drawn a different random sample of 400. The "95%" describes the procedure: if we repeated the audit many times, about 95% of intervals built this way would contain the true rate. It does not mean there is a 95% probability that the true rate lies in this particular interval.

**Limitations**

- The estimate measures disagreement with the experts, not "truth". Experts can also be wrong or can disagree among themselves on borderline tickets.
- The interval only covers sampling variability. It does not cover bias (for example, if the audit sample was not truly random).
- With only 60 disagreements, rare class pairs are barely represented, so class-level noise rates are very uncertain.
- The rate describes crowd labels in general. It should not be applied to the 5,000 expert-labeled tickets.

### 2.3 Tier A versus Tier B

**Disagreement rates**

$$
\hat{p}_A = \frac{12}{180} = 0.0667 = 6.67\%, \qquad \hat{p}_B = \frac{48}{220} = 0.2182 = 21.82\%
$$

**Absolute difference**

$$
21.82\% - 6.67\% = 15.15 \text{ percentage points}
$$

**Ratio**

$$
\frac{0.2182}{0.0667} \approx 3.27
$$

Tier B's disagreement rate is about 3.3 times Tier A's.

**Two-proportion z-test**

- Null hypothesis $H_0$: $p_A = p_B$ (both tiers have the same true disagreement rate)
- Alternative hypothesis $H_1$: $p_A \neq p_B$ (two-sided)

Pooled proportion (the combined rate, which is what we would use if $H_0$ were true):

$$
\hat{p}_{pool} = \frac{12 + 48}{180 + 220} = \frac{60}{400} = 0.15
$$

Standard error:

$$
SE = \sqrt{\hat{p}_{pool}(1 - \hat{p}_{pool})\left(\frac{1}{n_A} + \frac{1}{n_B}\right)} = \sqrt{0.15 \times 0.85 \times \left(\frac{1}{180} + \frac{1}{220}\right)}
$$

$$
= \sqrt{0.1275 \times (0.005556 + 0.004545)} = \sqrt{0.1275 \times 0.010101} = \sqrt{0.0012879} \approx 0.03589
$$

z-statistic:

$$
z = \frac{\hat{p}_B - \hat{p}_A}{SE} = \frac{0.21818 - 0.06667}{0.03589} = \frac{0.15152}{0.03589} \approx 4.22
$$

Two-sided p-value:

$$
p = 2 \times P(Z > 4.22) \approx 0.000024
$$

**Conclusion.** Since $p \approx 0.000024$ is far below 0.05, we reject the null hypothesis. If the two tiers really had the same disagreement rate, a gap this large would almost never appear by chance in an audit of this size. The difference between the tiers is statistically significant.

**Caution on interpretation.** A significant result tells us the gap is unlikely to be a fluke. It does not tell us *why* the gap exists. Tier B workers are described as "newer", but they may also have been given different ticket types, worked under different time pressure, or been paid differently. Experience is a plausible explanation, not a proven one. The test also assumes the audited tickets are independent and that each tier was sampled fairly, which seems reasonable here given the random audit but is still an assumption. (Also, the z-test is an approximation. Its expected counts are all well above 5 here, so it should be reliable.)

---

## 3. Milestone 2: Characterize Annotation Noise

### 3.1 What the disagreement table shows

| Crowd label | Expert label | Count |
|---|---|---:|
| Billing | Refund | 14 |
| Refund | Billing | 12 |
| Technical | Account Access | 9 |
| Shipping | Other | 8 |
| Account Access | Technical | 6 |
| Technical | Other | 5 |
| Other | Shipping | 3 |
| Billing | Other | 3 |
| **Total** | | **60** |

Check: 14 + 12 + 9 + 8 + 6 + 5 + 3 + 3 = 60, matching the audit total.

Grouping the two directions of each related pair:

| Class pair | Calculation | Combined | Share of 60 |
|---|---|---:|---:|
| Billing ↔ Refund | 14 + 12 | 26 | 43.3% |
| Technical ↔ Account Access | 9 + 6 | 15 | 25.0% |
| Shipping ↔ Other | 8 + 3 | 11 | 18.3% |
| Remaining (Technical → Other 5, Billing → Other 3) | 5 + 3 | 8 | 13.3% |
| **Total** | | **60** | **100%** |

The three related pairs together account for 52 of the 60 disagreements (86.7%).

### 3.2 Why this looks systematic rather than uniform

If noise were uniform and random, a wrong label would be equally likely to land on any of the five other classes. With six classes there are 30 possible (crowd label, expert label) combinations. Spread evenly, 60 disagreements would give about 2 per combination. What we actually see is very different: only 8 of the 30 combinations appear at all, and one of them has 14. More than half of the errors (26 of 60) sit in one pair of classes that a human would naturally describe as "close in meaning".

That is the signature of class-dependent (systematic) noise: mistakes follow the class boundaries that are hard to draw, rather than being scattered. It matters for modelling, because the uniform-noise assumptions used in many textbook results will not hold here (this comes up again in Milestone 3).

Two further observations from the table:

- **Billing ↔ Refund is nearly symmetric** (14 one way, 12 the other). That points to genuine confusion about where the boundary lies, rather than a one-directional habit of over-using one label.
- **The "Other" column is interesting.** In 16 of the 60 disagreements (8 + 5 + 3) the *expert* chose "Other", whereas the crowd chose "Other" in only 3 cases where the expert disagreed. So in this sample the crowd seems, if anything, to have been pushing tickets into specific classes that the expert thought belonged in "Other", not over-using "Other" itself. It is worth reading this carefully: with so few cases, it is a hint to investigate and not a firm result.

### 3.3 Possible root causes

The table cannot prove the exact cause of any individual error, so the following are plausible explanations to test, not established facts.

1. **Overlapping class definitions.** Billing and Refund clearly overlap: a refund request is often about a charge. If the guidelines do not say which one wins when a ticket is about both ("I was charged twice, please refund me"), different workers will choose differently. The same applies to Technical and Account Access (for example, "I can't log in because the app crashes").
2. **Ambiguous ticket wording.** Some tickets genuinely belong to more than one category, or do not contain enough information to decide. Some of these "errors" may really be unavoidable ambiguity.
3. **Inconsistent reading of the guidelines.** Even a clear guideline can be read in different ways, particularly across a pool of 40 workers.
4. **Differences in worker experience.** The Tier A / Tier B gap (6.67% vs 21.82%) fits with this, though it is not proof.
5. **Insufficient worker training.** Newer workers may not have seen enough worked examples of borderline cases.
6. **Use of "Other" as a catch-all or its under-use.** Given the data above, "Other" seems to be handled inconsistently. Workers may not know when a ticket is really outside the five named classes. Since "Other" is only 5% of the data, errors there also affect a small class heavily.

### 3.4 Recommendations

**Annotation guidelines**
- Write a short decision rule for each confusing pair, for example a rule stating which class takes priority when a ticket mentions both a charge and a refund.
- Add 3 to 5 worked examples per class, with explicit borderline examples ("this is Refund, not Billing, because...").
- Define "Other" positively and give examples of what belongs there, so it is neither a dumping ground nor ignored.
- Allow a "needs review / unsure" flag rather than forcing a guess.

**Worker qualification**
- Require new workers to pass a qualification set of expert-labeled tickets that deliberately includes the confusing pairs, before they label production data.
- Use a probation period during which a larger share of a new worker's output is checked.

**Quality monitoring**
- Insert hidden gold-standard tickets (already expert-labeled) into the workflow and track each worker's accuracy against them.
- Track per-worker and per-tier disagreement rates over time, and monitor the confusion pairs in particular.
- Use overlap labeling (two or three workers on the same ticket) for hard classes and send disagreements to review.
- Give workers feedback on their mistakes, since this is cheap and helps newer workers improve.

**Expert adjudication**
- Send tickets with worker disagreement, or from low-scoring workers, to an expert.
- Keep an adjudication log of the reasoning. Repeated rulings on the same kind of ticket should be turned into new guideline examples.
- Where experts themselves disagree, record that and update the definitions instead of forcing a single answer.

---

## 4. Milestone 3: Reason About the Accuracy Ceiling

### 4.1 Setup and assumptions

This section is a thought experiment. The following are **assumptions**, not observed facts:

- There are $K = 6$ classes.
- The test-label noise rate is $\eta = 0.15$ (taken from the audit estimate).
- When a label is wrong, it is flipped *uniformly* to one of the other 5 classes.
- The model has some unknown true accuracy $a$.
- The observed accuracy on the noisy test set is $q = 0.82$ (this one is an observed figure from the brief).

### 4.2 Deriving the relationship

A noisy test example can be scored as correct in two ways:

1. The label is correct (probability $1 - \eta$) and the model is correct (probability $a$). Contribution: $(1-\eta)\,a$.
2. The label is wrong (probability $\eta$) and the model is *wrong* in just the way that matches the wrong label. If the model is wrong, its prediction is one of the 5 other classes, and under uniform flipping the wrong label hits that same class with probability $1/5$. Contribution: $\eta\,(1-a)/5$.

So:

$$
q = (1-\eta)\,a + \eta\,\frac{1-a}{5}
$$

(Here $q$ is the observed accuracy. It is unrelated to the $q$ parameter in the GCE loss in Section 6.)

### 4.3 Algebraic solution

Expand the right side:

$$
q = (1-\eta)\,a + \frac{\eta}{5} - \frac{\eta}{5}\,a
$$

Collect the terms containing $a$:

$$
q - \frac{\eta}{5} = a\left(1 - \eta - \frac{\eta}{5}\right)
$$

Solve for $a$:

$$
a = \frac{q - \eta/5}{1 - \eta - \eta/5}
$$

Substitute $\eta = 0.15$ (so $\eta/5 = 0.03$) and $q = 0.82$:

$$
a = \frac{0.82 - 0.03}{1 - 0.15 - 0.03} = \frac{0.79}{0.82} \approx 0.9634
$$

Check by plugging back in: $0.85 \times 0.9634 + 0.03 \times (1 - 0.9634) = 0.8189 + 0.0011 = 0.82$. This matches the observed accuracy, so the algebra is consistent.

*A note on the denominator:* the step above shows the denominator is $(1-\eta) - \eta/5 = 0.85 - 0.03 = 0.82$. Writing it as $0.85 + 0.03$ would give $0.88$, which would not match $0.79/0.82$, so the minus sign is the correct one.

**Result:** under these assumptions, the model's true accuracy would be about **96.34%**.

### 4.4 Why this should not be treated as the real accuracy

The 96.34% is what comes out of a simplified model. It is a "what if" figure, not a measurement. The model has not been shown to achieve it. Reasons for caution:

- **The noise is class-dependent, not uniform.** Section 3 showed that errors cluster in specific class pairs. The formula assumes a wrong label lands on the model's wrong prediction 1 time in 5. If noise is concentrated in confusing pairs, and the model tends to be confused in the same pairs, that probability could be much higher, and the correction would change substantially.
- **The two worker groups have different noise rates.** A single $\eta = 0.15$ hides the fact that Tier B is about 3.3 times noisier than Tier A.
- **The classes are imbalanced.** Billing is 30% of the data and Other only 5%, so noise has different consequences across classes.
- **Training labels are probably noisy too.** The same crowd labeled the training data, so the model may have learned some of the crowd's mistakes, and the "model errors" and "label errors" are not independent as the formula assumes.
- **Expert judgments are not perfect.** The 15% is disagreement with experts. Some of those might be tickets where the expert label is debatable.
- **The test set uses the same labeling process as the training set.** Any shared bias in the process affects both.

So the safest reading is this: the calculation shows that a 15% noise rate *could* explain a large part of the gap between 82% and 100%, so 82% may understate the model's real ability. The actual figure can only be established with an independently expert-labeled test set (Section 6.2).

---

## 5. Milestone 4: Identify and Correct Bad Labels

### 5.1 Proposed allocation of the 2,000 reviews

The 2,000 additional expert reviews are on top of the 400 tickets already audited. The allocation below is a proposed starting strategy, not a proven optimum. It should be adjusted after seeing how productive each part turns out to be.

| Component | Tickets | Purpose |
|---|---:|---|
| Random, stratified audit sample | 400 | Unbiased noise estimate per class and per tier |
| Model disagreement | 600 | Tickets where the model's prediction differs from the crowd label |
| High predictive uncertainty | 500 | Tickets where the model is least sure |
| High-risk worker groups and confusing class pairs | 500 | Tickets from Tier B or from the Billing/Refund, Technical/Account Access, Shipping/Other boundaries |
| **Total** | **2,000** | |

The tickets are drawn from the crowd-labeled pool, excluding the 400 already audited. Because one ticket could qualify under several categories (for example, a Tier B ticket in the Billing/Refund pair on which the model also disagrees), the pools must be **deduplicated**. The simplest way is to fill the quotas in a fixed order: random sample first, then model disagreement, then uncertainty, then high-risk. Each ticket is assigned to the first category it qualifies for. If a category runs short after removing duplicates, it is topped up from the next-ranked candidates in the same category. This way the number of unique tickets reviewed never exceeds 2,000.

### 5.2 Generating candidate tickets

- **Model disagreement:** Obtain predictions from a model trained on the existing labels. Ideally use cross-validated (out-of-fold) predictions, so a model does not simply memorise the label of a ticket it was trained on. Tickets where the prediction disagrees with the crowd label are candidates.
- **High uncertainty:** Use the predicted probabilities. Low maximum probability or high entropy marks tickets the model finds hard.
- **High-risk groups:** Select tickets labeled by Tier B workers, and tickets whose crowd label (or model prediction) falls in one of the confusing pairs.
- **Random sample:** Draw uniformly at random within each class so every class, including "Other", gets reasonable coverage.

### 5.3 Ranking and sampling

Within each component, rank by a simple score, for example the model's confidence in a *different* class than the crowd label (for the disagreement component) or entropy (for the uncertainty component), and take the top ones. Taking only the very top of a ranking tends to pick up one narrow kind of ticket, so it helps to sample proportionally across classes and across the two tiers, or to mix in some lower-ranked items. For the high-risk component, a stratified draw across the three confusing pairs prevents a single pair from using all 500 reviews.

### 5.4 How experts should review

- Experts label *independently* first: they should not see the crowd label or the model prediction, to avoid being anchored by it.
- Where two experts see the same ticket, disagreements go to adjudication with the written guidelines.
- Experts should be able to mark a ticket as ambiguous or multi-class rather than force a single label.
- Rulings on difficult cases should feed back into the guideline examples.

### 5.5 Metadata to preserve

For every reviewed ticket, store: ticket ID; original crowd label; worker ID and tier; model prediction and probabilities; the reason the ticket was selected (which component, and rank); the expert label(s); adjudicated final label; ambiguity flag; reviewer ID; review date; and guideline version. This makes the process auditable, allows weighted estimates later, and lets us measure which selection method is the most productive.

### 5.6 Using corrected labels in training

- Replace verified wrong labels with the expert labels in the training set.
- Keep a record of which labels are expert-verified (they can be treated as more reliable, for example upweighted).
- Do not use the corrected tickets in a way that leaks them into the final test set. Corrected tickets that are used for training must be kept out of the evaluation data.
- Retrain, and compare against the baseline, using the clean validation set described below.
- Optionally, use the expert-reviewed tickets to train a small "label-error detector" to find further suspicious labels in the remaining unreviewed data.

### 5.7 Evaluating the selection strategy

| Metric | Definition | What it tells us |
|---|---|---|
| Error discovery rate | confirmed label errors ÷ tickets reviewed (computed per component and overall) | How productive each strategy is, compared with the random-sample rate (about 15%) |
| Precision of selected tickets | share of tickets flagged for review that turned out to be wrong, e.g. among the top-$k$ of a ranking | Whether the ranking really puts bad labels near the top; the lift over random shows its value |
| Class-wise error discovery | errors found per class, divided by tickets reviewed from that class | Whether some classes (for example "Other" or Refund) are being missed or over-reviewed |
| Expert-review efficiency | corrected labels per 100 tickets reviewed, or per expert hour | Whether the budget is being spent well |
| Downstream improvement | change in accuracy and macro-F1 on a separate clean validation set after retraining on corrected labels | Whether the corrections help the actual goal |

The last metric is the one that matters most. Finding many errors is only useful if fixing them improves a model on trusted data.

### 5.8 Why the targeted error rate is not the population noise rate

The model-disagreement, uncertainty, and high-risk components are selected *because* they are likely to contain errors. Their error rate is therefore expected to be higher than 15%, and it would be wrong to report it as the overall noise rate. Only the random stratified sample is an unbiased estimate. For population-level numbers, use the random sample, or, if the targeted tickets are included, apply sampling weights (each reviewed ticket weighted by the inverse of its probability of being selected) so that the estimate reflects the full 45,000 tickets.

---

## 6. Milestone 5: Mitigate Noise and Evaluate Reliably

### 6.1 Two noise-tolerant training methods

#### 6.1.1 Generalized Cross-Entropy (GCE)

**Intuition.** Standard cross-entropy loss, $-\log p_y$, becomes very large when the model assigns a low probability to the given label. If the label is wrong, the model is strongly pushed to fit it anyway. Mean absolute error (MAE), by contrast, is robust to noise but trains slowly and can be hard to optimise. GCE sits between the two.

**Loss function**

$$
L_q(p_y) = \frac{1 - p_y^{\,q}}{q}, \qquad 0 < q \le 1
$$

where $p_y$ is the probability the model gives to the labeled class. (This $q$ is the GCE hyperparameter, not the accuracy $q$ from Section 4.) As $q \to 0$ the loss approaches cross-entropy, and at $q = 1$ it becomes $1 - p_y$, which is equivalent to MAE up to a constant factor.

**Why it can reduce sensitivity to bad labels.** The gradient of the loss with respect to the model parameters equals the cross-entropy gradient multiplied by $p_y^{\,q}$. So examples where the model gives the label a low probability (which is often the case for mislabeled examples) receive a smaller weight than they would under cross-entropy. The model is therefore less strongly dragged towards wrong labels.

**Cautions.**
- It also down-weights genuinely hard but correctly labeled examples, which can slow learning on difficult tickets or on minority classes.
- It is not guaranteed to help. It was designed with certain noise types in mind and may do less against the systematic, class-dependent noise seen here, since a consistent wrong label can still look "confident" to the model.
- The value of $q$ must be tuned, and this tuning needs a **clean validation set**. Tuning it on noisy validation data could simply select the value that best fits the noise.

#### 6.1.2 Co-teaching

**Idea.** Two neural networks are trained at the same time. In each mini-batch, each network computes the loss for every example and ranks them. It then picks the examples with the *smallest* loss, which are more likely to be correctly labeled, since networks tend to learn clean patterns first. Each network passes its chosen examples to the *other* network, which updates on them.

**Why two networks.** If a network picked examples for itself, it could keep reinforcing its own early mistakes. Swapping lets each network act as a check on the other, because the two make somewhat different errors.

**The fraction kept.** The proportion of examples kept in each batch is normally linked to the estimated noise rate and is reduced gradually early in training. Here the audit suggests a noise rate of roughly 15%, so keeping about 85% of examples would be a natural starting point, to be tuned.

**Benefits.** It adapts to the data during training and does not need a clean subset to train on.

**Limitations and risks.**
- Training two networks costs about twice as much compute.
- Small-loss selection can pick *mislabeled* examples. With systematic noise, a consistently mislabeled Billing/Refund ticket may be one the networks come to fit with low loss, and so be retained as "clean".
- It can discard hard but correct examples, which may disproportionately come from minority classes such as "Other".
- The two networks can become more similar over time, which weakens the benefit of the exchange.
- It needs the noise rate (or a good guess) as input.

**Overall.** Neither method is guaranteed to improve performance on this dataset. The right way to find out is to compare the baseline, GCE and Co-teaching on the same clean validation and test sets (see the roadmap).

### 6.2 Constructing a trustworthy evaluation set

1. **Define the target population.** Decide what the model should perform well on, for example incoming support tickets of the same type and time period as production. The evaluation set should be drawn from that population.
2. **Sample representative tickets with coverage of all six classes.** Random sampling alone would give only about 5% "Other" tickets. For the number of tickets in a typical test set, that could leave too few examples to measure per-class performance. A common approach is stratified sampling by class, which deliberately oversamples smaller classes. (See the note on weighting below.)
3. **Have experts label independently.** At least two experts label each ticket without seeing the crowd label or model predictions.
4. **Adjudicate disagreements using explicit guidelines.** A senior reviewer resolves splits, and records the reasoning. Tickets that remain ambiguous are flagged and reported, not hidden.
5. **Prevent overlap, duplicates, and leakage.** Remove exact and near-duplicate tickets (for example repeated tickets from the same customer, or template-based messages) across training, validation and test data. Make sure no ticket in the test set was used in training, in label correction, or in error-detection models.
6. **Keep the test set isolated.** Do not use it for choosing hyperparameters, early stopping or comparing methods. Use a separate clean validation set for those steps, and touch the test set only for final reporting.
7. **Report more than accuracy.** Give accuracy, macro-F1, per-class precision and recall, and the confusion matrix, since accuracy alone hides weak classes.
8. **Include confidence intervals.** For example, the same Wilson interval method from Section 2.2 can be applied to accuracy. As a rough size guide, to estimate an accuracy near 80% to within ±2 percentage points at 95% confidence needs about $1.96^2 \times 0.8 \times 0.2 / 0.02^2 \approx 1{,}537$ tickets. (This is a simple illustration based on an assumed accuracy of 0.8, and per-class estimates will need more tickets in total.)

**Effect of oversampling minority classes.** If minority classes are deliberately oversampled, plain accuracy on that set no longer represents accuracy on real traffic. For instance, "Other" would be far more common in the test set than the 5% found in production. To get a figure that reflects the real class mix, weight each class's recall by its real share:

$$
\text{population accuracy} = \sum_{c} \pi_c \cdot \text{recall}_c
$$

where $\pi_c$ is the true proportion of class $c$ (Billing 0.30, Refund 0.15, Technical 0.25, Account Access 0.15, Shipping 0.10, Other 0.05). Macro-F1 and per-class metrics are not affected by this issue in the same way, which is one reason to report them alongside accuracy.

### 6.3 Problems with the current test set

The 82% accuracy figure was measured against labels produced by the same crowd process as the training set. This creates several problems:

- **Wrong labels distort the score.** About 15% of the crowd labels may be wrong, so the figure measures agreement with a partly incorrect reference.
- **Shared biases are not detected.** If the crowd consistently mislabels a certain kind of refund ticket as Billing in both training and test data, a model that learns this habit is *rewarded* for it at test time.
- **A held-out split does not make labels correct.** Holding data out protects against overfitting to specific tickets, but it says nothing about whether the labels are right.
- **The bias can go in either direction.** With systematic noise, the model might copy the crowd's mistakes and score *higher* than its real accuracy, or might correctly learn the true pattern and be penalised for disagreeing with wrong test labels, so score *lower*. Under the uniform-noise assumption in Section 4 the real accuracy would be higher than 82%, but with systematic noise we cannot be sure of the direction or the size of the effect.

**Recommendation.** Keep the existing test set for diagnostics and for tracking changes over time. For example, it is useful for finding which classes the model confuses. But base any final claim about model performance on the independently expert-labeled test set described in Section 6.2.

---

## 7. Implementation Roadmap

1. **Improve class definitions and annotation guidelines.** Write decision rules for the Billing/Refund, Technical/Account Access and Shipping/Other boundaries, define "Other" clearly, and add worked examples. Add worker qualification tests and hidden gold tickets.
2. **Review the 2,000 highest-value tickets.** Use the allocation in Section 5 (random sample, model disagreement, uncertainty, high-risk groups), deduplicated, with independent expert labeling and adjudication.
3. **Correct verified training-label errors.** Apply the expert labels, keep the metadata, and keep corrected tickets out of the final test set.
4. **Compare baseline training with GCE and Co-teaching.** Train all three on the same data, tune hyperparameters (the GCE $q$, the Co-teaching keep rate) using the clean validation set only, and compare on macro-F1 and per-class metrics as well as accuracy.
5. **Evaluate on a clean, independent test set.** Build it as described in Section 6.2, report confidence intervals, and use it once for the final comparison.
6. **Monitor class-wise performance and annotation quality over time.** Track per-class recall, per-worker agreement with gold tickets and the confusion pairs. Re-audit a small random sample regularly so the noise estimate stays up to date.

---

## 8. Conclusion

This report analysed label noise in the fictional HelpDeskNet-50K dataset using the supplied audit results. The main findings are:

- The estimated crowd-label disagreement rate is **15%** (60 of 400 audited tickets), which extrapolates to roughly 6,750 potentially incorrect labels among the 45,000 crowd-labeled tickets. This figure has not been confirmed ticket by ticket.
- The 95% Wilson confidence interval is approximately **11.8% to 18.8%**, or about 5,300 to 8,500 tickets.
- **Tier B's disagreement rate (21.82%) is significantly higher than Tier A's (6.67%)**, with $z \approx 4.22$ and $p \approx 0.000024$. This is a statistically significant difference, but the test does not by itself show that worker experience is the cause.
- The disagreement pattern points to **systematic class-boundary problems**. Billing/Refund, Technical/Account Access and Shipping/Other account for 52 of the 60 disagreements (86.7%).
- Under a simplified uniform-noise model, the true accuracy corresponding to an observed 82% would be about **96.34%**. This is a theoretical figure that depends on assumptions that do not fully hold in this dataset. It must not be presented as the model's confirmed performance.
- The recommended interventions are targeted **expert review**, **noise-tolerant training** (GCE and Co-teaching, to be tested and not assumed to work), and a **trusted, independently expert-labeled evaluation set**, together with better annotation guidelines and ongoing quality monitoring.
