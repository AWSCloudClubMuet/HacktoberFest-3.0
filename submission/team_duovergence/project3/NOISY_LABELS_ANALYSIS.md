# Noisy Labels: HelpDeskNet-50K, Analysis

All numbers are reproduced by `noisy_labels_calcs.py`.
Convention: the expert label is treated as ground truth. "Noise" below means "crowd disagrees with expert". Experts are not perfect, so these are estimates of noise, not exact values.

---

## Milestone 1: Quantify label noise

### 1. Noise rate of the crowd-labeled data (95% CI)

The 400 audited tickets are a random sample of the 45,000 crowd-labeled tickets.

- p̂ = 60 / 400 = **0.150 (15.0%)**
- Wilson 95% interval (preferred for proportions): **11.8% to 18.8%**
- Wald check: p̂ ± 1.96·√(0.15·0.85/400) = 0.15 ± 0.035 = 11.5% to 18.5% (same story)
- Stratified check using true tier shares (20k/25k of 45k): 0.444·6.67% + 0.556·21.82% = 15.1%, CI 11.6% to 18.5%. The audit mix (180/220) already matches the tier mix, so the answer barely changes.

**Impact in absolute numbers:** about 6,750 of 45,000 crowd labels are likely wrong (CI 5,300 to 8,500). Across all 50,000 tickets, with the 5,000 expert tickets assumed clean, noise is about 13.5% (CI 10.7% to 17.0%).

### 2. Tier A vs Tier B

| | Disagreements | Rate | Wilson 95% CI |
|---|---:|---:|---|
| Tier A | 12 / 180 | 6.7% | 3.9% to 11.3% |
| Tier B | 48 / 220 | 21.8% | 16.9% to 27.7% |

Test of H0: p_A = p_B.
- Pooled p = 60/400 = 0.15
- SE = √(0.15·0.85·(1/180 + 1/220)) = 0.0359
- z = (0.2182 − 0.0667) / 0.0359 = **4.22**, two-sided **p ≈ 2.4 × 10⁻⁵**
- Chi-square test gives the same p. Fisher's exact test: p ≈ 1.8 × 10⁻⁵, odds ratio 3.9.
- Difference = 15.2 points, 95% CI (unpooled) **8.6 to 21.7 points**. Tier B makes about 3.3 times as many errors.

**Conclusion:** the gap is far too large to be chance. The CI for the difference does not come close to zero.

**Two caveats to state:**
- Is the assignment of tickets to tiers random? If Tier B got harder tickets, part of the gap is ticket difficulty, not worker skill. Compare the class mix and ticket lengths across tiers.
- Tickets labeled by the same worker are correlated (about 7 audited tickets per Tier B worker). The real uncertainty is a bit wider than shown. A cluster bootstrap over workers would fix this, if worker IDs are available. The gap is large enough that the conclusion would almost certainly stand.

---

## Milestone 2: Characterize the noise

Table is read as crowd → expert.

### 1. Patterns

- **It is not random.** Only 8 of 30 possible off-diagonal cells are non-zero. Three cells hold 35 of 60 errors (58%). A Monte Carlo test of "60 uniform random flips, source classes in proportion to class share" produced a pattern this concentrated in 0 of 20,000 runs. Uniform noise would typically spread over about 23 distinct cells.
- **Errors sit between semantically close classes, in both directions:**
  - Billing ↔ Refund: 26 errors (43%). Close to symmetric (14 vs 12).
  - Technical ↔ Account Access: 15 errors (25%) (9 vs 6). Login and access problems look like technical problems.
  - Shipping ↔ Other: 11 errors (18%), but **asymmetric** (8 vs 3).
- **"Other" is under-used by the crowd.** In 16 errors the crowd said a specific class and the expert said Other (Shipping→Other 8, Technical→Other 5, Billing→Other 3). Only 3 go the other way. Workers force-fit ambiguous tickets into a real category. This also means true "Other" is probably larger than the 5% in the label distribution.
- **Class-wise rough error rates** (assuming the audit mirrors class shares): Refund about 20%, Shipping about 20%, Other about 15%, Billing 14%, Technical 14%, Account Access 10%. Small classes are hit hardest, so overall accuracy hides the damage.
- This is **class-conditional (asymmetric) noise** that depends on the content of the ticket, not uniform random noise.

### 2. Most likely root cause

**Ambiguous label definitions at class boundaries, not random worker carelessness.** Billing vs Refund ("I was charged twice, give me my money back") and Technical vs Account Access ("cannot log in") overlap, and "Other" has no clear rule for when to use it. Under-trained Tier B workers (3.3 times the error rate) amplify the problem, because they have the least experience handling the borderline cases. Tickets with several intents ("refund my billing mistake") are inherently ambiguous: more than one label is defensible.

I cannot prove this from the table alone. The table is not split by tier or worker, so it cannot say whether Tier A makes the same kinds of errors at lower frequency.

### 3. What to check or change in the annotation process

**Check:**
- Per-worker and per-tier confusion matrices. Are a few workers causing most errors, or does everyone make the same mistakes (guideline problem)?
- Inter-annotator agreement (Cohen's or Fleiss' kappa) on tickets labeled by 2 or more workers. Use agreement between experts too, to see if the "ground truth" is itself stable.
- Time per ticket, pay structure, and the interface (label order, default choice, whether "Other" is hidden or discouraged).
- Whether tickets were randomly assigned to tiers.

**Change:**
- Rewrite guidelines with explicit decision rules and worked examples for the three confusable pairs and for "Other".
- Merge or redefine Billing/Refund, or allow a primary + secondary label for multi-intent tickets.
- Add hidden gold-standard tickets, qualification tests, and feedback loops for Tier B. Route low-agreement tickets to Tier A or experts.
- Collect 2 or 3 labels on difficult tickets and aggregate (for example majority vote or Dawid-Skene).

---

## Milestone 3: The accuracy ceiling

### 1. Naive estimate

Assume a 15% flip rate, uniform over the 5 other classes. Let A be the true accuracy.
- If the model is right (probability A), it matches the noisy label when the label was not flipped: 0.85.
- If the model is wrong (probability 1 − A), it matches the noisy label only when the label was flipped to exactly the model's wrong class: 0.15/5 = 0.03.

0.82 = 0.85·A + 0.03·(1 − A)  →  A = (0.82 − 0.03) / (0.85 − 0.03) = 0.79 / 0.82 = **0.963, about 96%**.

(The shortcut 0.82/0.85 = 96.5% is nearly the same.) Under this assumption a perfect model would score only 85% on the noisy test set. That explains the plateau: the model is near the ceiling set by the labels, and a bigger model or more epochs cannot help.

### 2. Why it is unreliable here

1. **Noise is not uniform.** Errors are concentrated in confusable class pairs (Milestone 2). The formula assumes the model's mistakes agree with the noisy label only 3% of the time.
2. **Noise is correlated with what the model predicts.** The model trained on crowd labels learns the crowd's systematic habits (for example calling some Billing tickets "Refund"). It is then truly wrong but counted correct on the noisy test set, and the same ticket difficulty hurts the model and the crowd. The noise rate among tickets the model gets right is lower than 15%, so true accuracy is lower than 96%. Example: if the noise among correctly predicted tickets is 10% and wrong predictions match the noisy label 20% of the time, A = (0.82 − 0.20)/(0.90 − 0.20) ≈ 89%.
3. **The 15% itself is uncertain.** The CI is 11.8% to 18.8%, and the formula is very sensitive to it: η = 11.8% gives A ≈ 93%, η = 17% gives 99%, and at η ≈ 18.8% it gives more than 100%, which is impossible, because a perfect model could then only score 81.2% < 82%.
4. **Noise differs by tier and class.** The overall rate hides that Tier B labels are far worse and that small classes are worse hit.
5. **"True" is relative to experts, who are also imperfect,** and some tickets are genuinely ambiguous, so 100% may not be reachable.

**Assumption-free bound:** the model's agreement with the noisy label and with the true label can differ by at most the noise rate (|A − 0.82| ≤ 0.15). So true accuracy is between **67% and 97%**. The honest conclusion is "probably high 80s to mid 90s, cannot be pinned down without clean labels". That is why a clean test set is needed (Milestone 5).

---

## Milestone 4: Find the bad labels (2,000 expert reviews)

### 1. Selection strategy

Goal: maximize the number of wrong labels found per review. Random review finds about 15% × 2,000 = **300**. A good selector should find several times that.

1. **Get out-of-fold predictions.** Train with K-fold cross-validation (K = 5) so every ticket is scored by a model that did not train on it. Using in-sample predictions would only show what the model memorized.
2. **Score each crowd-labeled ticket for "probably wrong":**
   - Low predicted probability for its given label, or high loss.
   - Confident disagreement (confident learning): the model strongly predicts another class. Use per-class thresholds, because classes differ in size and noise.
   - Margin between top class and given label, and agreement across an ensemble or several seeds.
3. **Add priors from the audit.** Up-weight Tier B tickets (21.8% vs 6.7% base error), tickets in the confusable pairs (Billing↔Refund, Technical↔Account Access, anything labeled Shipping/Technical/Billing that could be Other), and tickets from low-agreement workers.
4. **Rank and review the top of the list.** Reserve about 10 to 15% of the budget (200 to 300 tickets) as a **random control sample**. It is needed to measure the selector's real precision and to estimate the noise rate without bias.
5. **Optional: iterate in rounds** (for example 4 rounds of 500). Retrain on new corrections after each round and re-rank (active learning).

### 2. Evaluating whether the selector works

- **Offline, before spending the budget:** we already have 400 audited tickets with 60 known errors. Score them with out-of-fold predictions and measure **precision@k, recall@k, PR-AUC and ROC-AUC** for finding the 60. Compare with the random baseline (precision 15%). Sixty positives is small, so report bootstrap CIs.
- **Online:** among the reviewed tickets, measure the fraction where the expert disagrees (yield). Target a lift of 2 to 3 times over 15% (for example 30% to 45% precision, so 600 to 900 bad labels found instead of 300). Compare against the random control slice.
- **Downstream:** retrain with corrections and measure on a clean test set (Milestone 5). A selector is only useful if accuracy on clean data goes up.
- **Pitfalls:** the selector finds errors where the model is confident, so it can miss systematic noise the model has learned (crowd habits). The random control sample shows how much is missed. Do not estimate overall noise from the targeted sample, because it is biased towards errors. Use inverse-probability weights or the random slice.

### 3. Using the corrected labels

- Replace the crowd label with the expert label on every reviewed ticket (use two experts and adjudicate where they disagree).
- Retrain on: 5,000 original expert tickets + 2,000 corrected tickets (give them higher weight) + remaining crowd tickets (use robust methods from Milestone 5, down-weight Tier B).
- Estimate a **noise transition matrix** T (P(crowd = j | true = i)) from the audit and the reviewed tickets. Use it for loss correction.
- Use reviewed tickets as a **clean validation set** for early stopping and model selection, but keep the gold test set separate and never train on it.
- Feed what was found back to the annotation team (Milestone 2) and re-run the selector with the improved model.

---

## Milestone 5: Mitigate noise and evaluate reliably

### 1. Two training-time methods

1. **Noise-robust loss / loss correction.**
   - *Forward loss correction:* multiply the model's predicted probabilities by the estimated transition matrix T before the cross-entropy, so the model learns the clean distribution. T comes from the audit and the 2,000 reviews (class-conditional noise, which matches what we found).
   - Or use *generalized cross-entropy (GCE)* or *symmetric cross-entropy*, which are less eager to fit wrong labels than plain cross-entropy.
2. **Sample selection / small-loss training (co-teaching, or confident-learning pruning).** Neural networks fit clean examples first and memorize noisy ones later. Train two networks, and each one chooses its small-loss samples to teach the other. Or prune or down-weight tickets flagged by cross-validation (Milestone 4) and train on the rest.

Practical extras: early stopping using a clean validation set, label smoothing, mixup, down-weighting Tier B, and fine-tuning at the end on the expert and corrected labels.

### 2. A trustworthy evaluation set

- **Labels:** at least 2 independent experts per ticket, disagreements adjudicated by a senior expert. Record expert agreement (kappa), because it is the realistic ceiling.
- **Sampling:** a **random** sample from the real ticket distribution, so accuracy reflects production. Oversample small classes (Other 5%, Shipping 10%) and report per-class results, or weight to get overall accuracy. Do not build it from tickets flagged as suspicious, because those are biased towards hard cases.
- **Size:** for 90% to 95% accuracy, 1,500 tickets gives a 95% half-width of about ±1.1 to 1.5 points, and 2,000 gives about ±1.0 to 1.3. Per-class numbers need enough tickets in each class.
- **Hygiene:** separate gold validation and gold test sets. No overlap with training data, including near-duplicates and the same customer or thread. Never tune on the gold test set. Refresh it over time.
- **Reporting:** accuracy and macro-F1 with confidence intervals (bootstrap or Wilson), per-class and per-tier slices, and results on "expert-agreed" vs "ambiguous" tickets.
- The 5,000 in-house expert tickets could serve as the starting point, only if they were chosen randomly and are not used in training. Check how they were selected.

### 3. Why the crowd-labeled test set is problematic

1. **Low ceiling.** With about 15% noise a perfect model scores about 85%. The 82% result is compressed, and differences of 1 to 3 points between models are mostly noise.
2. **Rewards the wrong behavior.** A model that copies the crowd's systematic mistakes scores higher than one that is actually right. The test can rank models in the wrong order.
3. **Noise is correlated with the training noise.** The test set was labeled by the same process, so annotator habits are shared. A model that memorized those habits looks like it generalizes well.
4. **Noise is not uniform.** It is concentrated in Billing/Refund, Technical/Account Access and Shipping/Other, so per-class metrics (precision and recall for Refund, Other) are biased. Tier mix changes the noise level.
5. **It hides real progress.** Genuine gains from cleaner training data cannot be seen when the test labels are wrong in the same places.
6. **Selection on a noisy test set overfits to the noise** over repeated model comparisons.
