# HelpDeskNet-50K: Noisy Labels Analysis

Numbers in M1-M3 come from the organisers' tables. M4-M5 results come from a simulated copy of the dataset (true labels known), so they show how the method behaves, not the real dataset's exact numbers.

## M1. Quantify label noise
**Overall noise (crowd labels).** 60/400 = 15.0%.
- Wilson 95% CI: 11.8% to 18.8% (Wald: 11.5% to 18.5%).
- Tier-weighted (20k A, 25k B): 0.444 x 6.67% + 0.556 x 21.82% = 15.1%, SE = 1.75 points, 95% CI 11.6% to 18.5%.
- That is about 6,800 wrong labels among 45,000 (5,200 to 8,300). Across all 50,000 tickets (experts assumed correct): about 13.6%.

**Tier A vs Tier B.** A = 12/180 = 6.7%, B = 48/220 = 21.8%. Difference = 15.2 points (B is 3.3x worse).
- Pooled p = 0.15, SE = sqrt(0.15 x 0.85 x (1/180 + 1/220)) = 0.0359, z = 0.1515/0.0359 = 4.22, p = 2.4e-5.
- 95% CI of the difference: 8.6 to 21.7 points. Chi-square = 17.8, Fisher exact p = 1.8e-5.
- Not plausibly chance. Tier B is genuinely worse.

Caveats: the experts are treated as ground truth (they can err too), and 400 tickets give a wide interval.

## M2. Characterize the noise
Errors are **systematic, not random**. All 60 errors sit in 8 of the 30 possible error cells.
- Billing <-> Refund: 26/60 (43%). Both directions, so the two definitions overlap.
- Technical <-> Account Access: 15/60 (25%). Login or app problems are ambiguous.
- Into "Other": 16 tickets the experts call Other were put in Shipping/Technical/Billing by the crowd, versus only 3 going the other way. The crowd forces ambiguous tickets into a specific class, so "Other" is badly under-used.
- Monte-Carlo test against uniform random errors: p < 0.0001.

**Most likely root cause:** unclear, overlapping class definitions (no decision rule for "refund request about a charge", "can't log in because of an app error", "doesn't fit any class"), made worse by weaker training of Tier B. Because errors follow the confusable pairs, this is a guideline problem, not just worker carelessness.

**What to check or change:**
1. Write decision rules with examples and tie-break rules (for example "primary customer intent decides").
2. Measure inter-annotator agreement (Cohen/Fleiss kappa) per class pair.
3. Give every worker an error rate on gold tickets, and look at per-worker errors in Tier B.
4. Add a qualification test and onboarding for new workers; have 2-3 workers label each hard ticket and take the majority.
5. Redesign the "Other" option, or allow multi-label or "unsure".
6. Consider merging Billing and Refund, or making a two-level hierarchy.

## M3. Accuracy ceiling
With uniform flips at eta = 0.15 to one of 5 other classes:
observed = a(1 - eta) + (1 - a) x eta/5, so 0.82 = 0.03 + 0.82a, which gives **a = 0.79/0.82 = 96.3%**.

**Why it is unreliable:**
1. Noise is not uniform. It is concentrated in confusable pairs, so the model learns the crowd's mistakes. Where the model repeats the crowd's wrong label it is scored "correct", which inflates measured accuracy. Real accuracy against experts could be lower.
2. eta is uncertain (CI 11.6% to 18.5%). The formula gives 92.6% at eta = 11.6% and exceeds 100% at 18.5%, which is impossible, so the assumption breaks down.
3. The noise rate on the test set may differ from the audited 400 (different tier mix).
4. Noise depends on the ticket (hard tickets are mislabeled more) and differs by class (Other and Refund are far worse than Shipping).
5. The 82% plateau is near the 85% maximum measurable accuracy: the noisy test cannot show improvements anymore.

## M4. Find the bad labels (2,000 expert reviews)
**Strategy**
1. Train on the crowd labels with 5-fold cross-validation, so each ticket is scored by a model that never saw it.
2. Score suspicion as 1 - P(crowd label), the confident-learning idea. A margin score works similarly.
3. Add priors: Tier B, and tickets in the confusable pairs (Billing/Refund, Technical/Account Access, Shipping/Other).
4. Pick the top ~1,700, stratified by class so small classes are covered. Keep ~300 as a random slice for an unbiased estimate of noise.
5. Run in rounds of 500 and retrain between rounds (active learning).

**Does it work?**
- Evaluate against the 400 audited tickets (known right/wrong): precision@k, recall@k, AUROC, and lift over random (random precision is about 15%).
- The random 300-ticket slice also gives a fresh unbiased noise estimate.

Simulated results (precision in the top 2,000, random is 15.9%):

| Strategy | Errors found | Precision | Lift |
|---|---|---|---|
| Random | 318 | 15.9% | 1.0x |
| Self-confidence | 1,893 | 94.7% | 6.1x |
| Margin | 1,884 | 94.2% | 6.1x |
| Confidence + Tier B prior | 1,917 | 95.9% | 6.2x |

**Using the corrected labels**
1. Overwrite the 2,000 labels and retrain.
2. Use them (and the random slice) to estimate the noise matrix T for loss correction.
3. Use them as a small trusted set for validation and calibration.
4. Treat them as a biased sample: they are not representative, so reweight before estimating overall noise.

Honest note: fixing 2,000 of about 7,000 wrong labels barely changed accuracy in the simulation (93.3% to 93.0%, within noise). Their value is mostly as trusted data and for estimating T, not as a direct training fix.

## M5. Mitigate noise and evaluate reliably
**Two training-time methods**
1. **Confident-learning filtering:** drop (or down-weight) tickets whose label disagrees with confident out-of-fold predictions, then retrain.
2. **Forward loss correction** with an estimated noise matrix T (loss = -log of (p x T) at the crowd label). Alternatives: Generalized Cross-Entropy, co-teaching, label smoothing, early stopping.

Simulated results on an expert-labelled test set (1,500 tickets):

| Model | Noisy-test acc | Expert-test acc |
|---|---|---|
| Baseline | 81.7% | 89.7% +/- 1.5 |
| Filter + retrain | 82.8% | 94.3% +/- 1.2 |
| Forward correction | 83.5% | 96.2% +/- 1.0 |

The noisy test shows differences of about 1 point while the expert test shows about 6.

**A trustworthy evaluation set**
- A random, stratified sample from the real ticket stream, kept out of training and out of review selection.
- Labeled by 2-3 experts independently, with disagreements adjudicated. Report inter-expert kappa.
- About 1,500 tickets (250 per class) so Shipping and Other are measured properly. Reweight by true class share for overall accuracy.
- Report per-class recall/F1, macro-F1 and confidence intervals (n = 1,500 at 90% gives about +/-1.5 points).

**Why the existing test set is a problem**
- It has the same noise (about 15%) and the same systematic confusions as the training data.
- A model trained on those labels learns the crowd's mistakes and is rewarded for repeating them. Training and test errors are correlated.
- Maximum measurable accuracy is about 85%, so the 82% plateau is partly a measurement artifact.
- It cannot rank models that differ by less than the noise, and it favours models that imitate the crowd.
