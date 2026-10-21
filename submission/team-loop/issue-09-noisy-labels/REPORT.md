# HelpDeskNet-50K: annotation noise analysis

Team loop, issue 9. Owner: Laksh. Completed on Moksh's laptop with AI assistance.

## Evidence and scope

This is an analysis of the aggregate figures in [the official issue](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/9), checked on 21 October 2026. [TASK.md](TASK.md) preserves the supplied scenario. The dataset is fictional: no individual tickets, worker IDs, predictions, or trained models are supplied. All experimental procedures below are proposals. Numerical results come from [calculations.py](calculations.py); [CALCULATIONS.json](CALCULATIONS.json) records full precision.

The audit measures **crowd/expert disagreement**. Interpreting it as crowd-label error requires the expert labels to be correct, ideally after independent review and adjudication. Neither the original expert-labeled subset nor a single expert is automatically perfect.

## Milestone 1: Quantify noise and compare tiers

### Crowd-label estimate and uncertainty

The audit contains 60 disagreements in 400 randomly sampled crowd-labeled tickets:

```text
p_hat = 60 / 400 = 0.15 = 15%
z = 1.959963984540054 (two-sided 95% normal quantile)
D = 1 + z^2/n
Wilson center = (p_hat + z^2/(2n)) / D
Wilson half-width = z * sqrt(p_hat*(1-p_hat)/n + z^2/(4n^2)) / D
95% interval = center +/- half-width = [0.1183449953, 0.1883136107]
```

Thus crowd disagreement is **15.00%, with a Wilson 95% confidence interval of 11.83% to 18.83%**. Wilson uses score-test inversion; see the [NIST formula](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm). Repeated intervals formed by this procedure have approximately 95% coverage under its sampling assumptions; this is not a 95% probability claim about this particular fixed parameter.

Assumptions: representative random ticket selection, stable labeling process, sufficiently independent observations, and reliable audit judgments. Sampling is below 1% of 45,000 crowd tickets; we omit the small finite-population correction. Repeated errors within the same worker or ticket template could widen uncertainty. Obtain worker IDs and use a worker-cluster bootstrap or a suitable hierarchical model before relying on ticket-independent intervals for operational decisions. The aggregate table cannot support that correction.

Applying the point estimate to 45,000 crowd tickets projects about **6,750 disagreements**; it does not count confirmed errors. The 15% estimate does not apply directly to all 50,000 tickets:

```text
whole-dataset noise = 0.9 * crowd_noise + 0.1 * original_expert_noise
If original_expert_noise = 0: 0.9 * 0.15 = 13.5%
```

Original expert noise is unknown. As a sensitivity check, using known tier population weights gives `(20000/45000)*(12/180) + (25000/45000)*(48/220) = 15.0842%`. The primary estimate remains 15% because the issue says the 400 tickets were randomly sampled from the crowd subset. If the audit had instead used fixed tier sampling quotas, use the weighted estimate and a stratified variance calculation; the pooled Wilson interval would not be its design-based interval.

### Tier comparison

| Tier | Disagree | Agree | Audited | Rate | Wilson 95% CI |
| --- | ---: | ---: | ---: | ---: | ---: |
| A | 12 | 168 | 180 | 6.67% | 3.85% to 11.29% |
| B | 48 | 172 | 220 | 21.82% | 16.87% to 27.73% |

Test `H0: p_A = p_B` against the preselected two-sided alternative:

```text
pooled p = (12+48)/(180+220) = 0.15
SE_null = sqrt(0.15*0.85*(1/180 + 1/220)) = 0.0358870281
z = (12/180 - 48/220) / SE_null = -4.2220033092
two-sided p = 2*Phi(-abs(z)) = 0.0000242140554
```

Expected cell counts under H0 are 27, 153, 33, and 187, so the normal approximation is reasonable under independent ticket sampling. At alpha 0.05, reject equal tier disagreement rates. Tier B is **15.15 percentage points higher**, or **3.27 times** Tier A's observed rate. The p-value is a probability under H0, not the probability that chance caused the result or that Tier B workers are incompetent.

As an independent calculation, a two-sided Fisher exact test gives **p = 0.0000183006863**. With fixed margins, for `k` Tier A disagreements:

```text
P(K=k) = C(60,k) * C(340,180-k) / C(400,180)
p_two_sided = sum P(K=k) for tables with P(K=k) <= P(K=12)
```

This probability-order definition follows the [SciPy Fisher documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.fisher_exact.html); our implementation uses integer combinations and has no SciPy dependency. Fisher also assumes independent observations; it does not repair worker clustering. Tier differences could reflect task difficulty, language, category mix or assignment policy. Worker-level and category-adjusted analysis is needed to attribute causes.

## Milestone 2: Characterize the errors

Billing/Refund swaps account for **26/60 = 43.33% of disagreements**. Technical/Account Access swaps account for **15/60 = 25%**. These semantically related pairs suggest ambiguous boundaries rather than purely arbitrary flips. Shipping/Other swaps occur in both directions (8 and 3); several categories flow into expert Other, indicating that the fallback category also needs a clear definition.

These are conditional counts among disagreements. We do not know how many audited tickets had each original label, each expert label, or each tier/class combination. Therefore 14 Billing-to-Refund cases are neither a Billing error rate nor evidence that Billing is the worst class. Dataset-wide class shares cannot replace missing audit denominators. The table is not a complete confusion matrix or a row-normalized noise transition matrix. The observed patterns suggest structured noise, but do not alone establish a formal rejection of every uniform-noise model.

**Leading hypothesis:** unclear class definitions and uneven annotator calibration, especially for newer workers, interact with overlapping ticket intent. Alternative explanations include harder tickets assigned to Tier B, missing context, language differences, rushed work, or inconsistent experts. The aggregates do not prove a root cause.

Proposed annotation changes and checks:

1. Review disagreements blind to model prediction and worker tier. Capture two independent expert labels, reasons and adjudicated outcomes, including unresolved/ambiguous cases.
2. Version a decision guide: Billing concerns charges/invoices; Refund concerns returning an already paid amount; Account Access concerns authentication/recovery; Technical concerns failures after access. These are proposed definitions for domain experts to approve. Include multi-intent tie-breaking examples and explicit Other inclusion/exclusion rules.
3. Retrain and qualify annotators on boundary cases; double-label a random ongoing sample and adjudicate disagreements. Use hidden gold items for feedback, with sufficient samples before action against a worker.
4. Collect class, tier, worker, timestamp, language and difficulty denominators. Compare like-for-like workloads and annotation speed. Track agreement and expert error rates by worker and class after adjusting for mix. Audit experts too.
5. Re-audit a fresh random batch after changing the guide; compare noise estimates with uncertainty under the same design. Keep the guide version and change log so improvement can be attributed to a specific intervention.

## Milestone 3: What 82% noisy accuracy implies

Let `a = P(model predicts true class)`, `eta = 0.15`, and `K = 6`. For this calculation only, assume a correct label is retained with probability `1-eta`; otherwise it is replaced uniformly by one of the other `K-1` labels, independently of the model prediction conditional on the true class.

If the model is correct, it matches the noisy label only when no flip occurs. If it is incorrect, it can accidentally match one of the five flipped labels:

```text
A_noisy = a*(1-eta) + (1-a)*eta/(K-1)
        = 0.85*a + 0.03*(1-a)
        = 0.03 + 0.82*a
a = (0.82 - 0.03) / 0.82 = 79/82 = 0.9634146341
```

The requested naive estimate is **96.34% true accuracy**. Simply dividing `82%/85%` misses accidental agreements on wrong predictions. Under this assumed process a perfect true classifier would score 85% against the noisy labels; that is a model-dependent expected ceiling under independence, not a universal ceiling for this dataset.

The observed directional swaps and tier difference make a single symmetric flip rate questionable. A model trained on the same annotation conventions can reproduce crowd mistakes, inflating agreement with noisy test labels even when true accuracy is worse. Conversely, correct predictions can be counted wrong by noisy labels. Instance difficulty, class-specific noise, test/train mix differences, duplicate leakage and expert uncertainty also violate the assumptions. Consequently **96.34% is an algebraic estimate under a hypothetical model, not measured performance**. Test-set size is missing, so even the sampling uncertainty of the reported 82% cannot be quantified here. We do not propagate the audit interval through this formula as if it established a true-accuracy confidence interval.

## Milestone 4: Use 2,000 additional expert reviews

Reserve evaluation data before scoring or selecting training tickets. Treat the budget as **2,000 unique tickets**, each with an expert review protocol; two raters and adjudication require additional expert time. If the budget instead means 2,000 individual rating actions, this allocation must be resized and independent adjudication protected.

| Disjoint review allocation | Tickets | Purpose |
| --- | ---: | --- |
| Locked random expert test | 500 | Final evaluation only |
| Separate random expert validation | 300 | Tune model, review score and loss settings |
| Uniform random training audit | 400 | Unbiased training-pool baseline and correction yield |
| Targeted Tier B training tickets | 500 | Larger observed noise burden |
| Targeted Tier A training tickets | 200 | Do not assume experienced workers are error-free |
| Targeted diversity reserve from remaining training tickets | 100 | Rare classes, language and underrepresented workers/templates |
| **Total** | **2,000** | **800 evaluation + 1,200 training** |

The proportions are an explicit policy proposal, not a statistically proven optimum. Sample 400 training tickets uniformly without replacement first, excluding the original 400 audit tickets and all evaluation groups. Then select the 800 targeted tickets from the remaining training pool. Fill the diversity reserve last with explicit class/language/worker coverage, avoiding all previous selections. If a stratum is exhausted, record the shortfall and transfer slots to the diversity reserve. If the goal prioritizes deployment representation beyond the supplied crowd-held-out population, collect the corresponding fresh data rather than silently claiming it is represented.

Use group-aware out-of-fold predictions: each ticket and its customer/conversation/template group must be absent from that fold's model training. A concrete initial ranking score is `1 - p_OOF(original crowd label)`, with ties resolved by ensemble disagreement, then fixed-seed sampling. Calibrate probabilities using expert validation only. Inspect likely Billing/Refund and Technical/Account Access reversals, but retain broad class/worker coverage and cap repeated near-duplicate templates. High loss is a suspicion signal; a difficult or rare correctly labeled ticket can also receive a high score. Reviewers should not see the score or model suggestion before forming independent judgments. Log ticket IDs, selection reason, pool, fold, score, original label, new label, adjudication and provenance.

### Evaluate selection and use corrections

Freeze the ranking rule before review. For the targeted arm, compute `precision@800 = adjudicated corrections/800`, and for the random arm `random_yield = corrections/400`, with Wilson intervals as an initial ticket-independent summary. Report yield lift and absolute difference, class/tier breakdowns and review minutes per accepted correction. The random arm estimates residual noise in the eligible training pool; the targeted arm's correction rate does not estimate dataset prevalence. Tier B oversampling itself can improve yield, so compare within tiers or standardize to the same tier mix before crediting the model score. For cluster-dependent results use group-level uncertainty. Error recall across all unreviewed tickets is unknown.

Retain original and adjudicated labels with versioned reasons. Replace labels only for training-arm corrections; keep genuinely ambiguous records for adjudication or exclude them with a documented count. Original expert-labeled records may be training anchors only if assigned to the training split. Never promote validation or test corrections into training. Existing audit records are already used for analysis and must not become the final blind test.

To measure downstream benefit, compare the same architecture, splits and compute budget under: original labels with cross entropy; corrected training labels with cross entropy; corrected labels with each robust method below. Use multiple fixed seeds. Select settings and checkpoints on the 300-ticket expert validation set. Once choices are frozen, evaluate final predeclared comparisons on the locked 500-ticket set, using paired error counts and a paired test such as McNemar, plus paired group bootstrap intervals where appropriate. No review yield or model improvement has been measured yet.

## Milestone 5: Train robustly and evaluate independently

### Two training-time methods

**1. Generalized cross entropy (GCE).** For the probability assigned to the supplied label, use `L_q = (1 - p_y^q)/q`, `0 < q <= 1`. It approaches cross entropy as `q -> 0` and limits the dominance of low-probability noisy labels. Start with a small predeclared validation grid such as `q in {0.3, 0.5, 0.7}`; retain ordinary cross entropy as the baseline. GCE can also suppress hard but correct minority examples, so monitor per-class recall. Its noise-robustness results have assumptions and do not guarantee improvement on these tickets. [Zhang and Sabuncu, NeurIPS 2018](https://arxiv.org/html/1805.07836v4).

**2. Prediction bootstrapping.** Blend the observed one-hot target with a model-generated soft target: `target = beta*y + (1-beta)*p_teacher`, then train against that target. Use a detached target (for example a frozen earlier checkpoint as a conservative implementation variant), a warm-up on training anchors and small amounts of noisy data, and choose beta on clean validation. A starting grid is `{0.8, 0.9, 0.95}`. This can reduce reliance on a wrong annotation but can reinforce the model's own systematic mistakes; keep expert corrections, rare-class monitoring and a cross-entropy baseline. The teacher-checkpoint safeguard is our proposed adaptation. [Reed et al., bootstrapping paper](https://arxiv.org/html/1412.6596v3).

Evaluate these as separate ablations before combining them. Use early stopping on expert validation; more epochs or a larger model can memorize noise and will not fix an unreliable test process. No model was trained for this submission.

### Trustworthy evaluation set

The 500 test and 300 validation tickets above must be previously unused, randomly sampled from the intended held-out population with a recorded seed and inclusion process. Exclude training groups, near-duplicates, original audit tickets and all targeted-review tickets before sampling; if the existing test was already used repeatedly to choose models, prefer a fresh untouched holdout. Preserve the real class mixture for overall accuracy. Under the given 5% Other share, 500 random test tickets contain only about 25 Other examples in expectation; class-specific conclusions will be imprecise. Do not claim fixed class counts from a random sample. A future class-balanced diagnostic set can supplement it, with weights if used for population metrics.

Two independent domain experts label without crowd labels or model predictions, with a third adjudicator for disagreements. Document rubrics, ambiguous cases, inter-expert agreement and remaining exclusions. Keep a locked manifest and label version, with test labels hidden from model development. Report accuracy with a Wilson interval, macro-F1, per-class precision/recall/F1, support counts and the complete model-versus-expert confusion matrix. At n=500, worst-case accuracy uncertainty is roughly +/-4.4 percentage points using the normal approximation; this budget will not reliably resolve tiny gains. For correlated tickets use group-aware uncertainty instead of pretending every ticket is independent.

The old test set uses the same crowd process as training: it rewards agreement with potentially shared annotation mistakes and penalizes some correct predictions. Repeated model selection on it also introduces adaptation bias. Keep its 82% score only as a historical crowd-agreement baseline with label provenance; use the locked expert evaluation for claims about true classification performance.

## Requirement checklist and remaining limits

- [x] M1: overall estimate, named 95% CI, formulas, tier test, p-values, effect size and assumptions.
- [x] M2: directional patterns, denominator limits, leading root-cause hypothesis and concrete process changes.
- [x] M3: full six-class derivation, 96.34% naive answer and dataset-specific reasons it can fail.
- [x] M4: exact 2,000-ticket allocation, random baseline, targeted selection, evaluation and leakage-safe corrections.
- [x] M5: two noise-robust methods, independently adjudicated evaluation and explanation of the old test's limitations.
- [x] Reproducible standard-library calculations and numerical tests, including independent statistical checks.

The documented analysis is complete for the aggregate-data task. Worker-adjusted inference, actual ticket selection, relabeling, training and measured performance gains require data that the fictional scenario does not supply. Those remain proposed procedures, not missing executed experiments.
