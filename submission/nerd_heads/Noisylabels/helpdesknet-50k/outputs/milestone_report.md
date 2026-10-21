# HelpDeskNet-50K: Reproducible Milestone Report

## Source and limitations
Source: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/9. The 50,000 tickets are fictional and no ticket-level records are supplied. All numeric findings below come from given aggregate values; we did **not** train on real tickets.

## Milestone 1 — Quantify noise
Expert audit disagreement: 60/400 = **15.00%**. Pooled 95% Wilson interval: **11.83%–18.83%**. Tier A: 12/180 = **6.67%**; Tier B: 48/220 = **21.82%**. Two-sided pooled two-proportion z-test: z=-4.222, p=2.42141e-05. Difference is statistically significant at alpha=0.05, conditional on representative independent sampling and expert labels being correct.

Because the crowd population comprises 20,000 Tier A and 25,000 Tier B tickets, the population-weighted disagreement estimate is **15.08%** with approximate stratified 95% normal interval **11.65%–18.51%** (assumes independent simple random sampling within each tier). The pooled Wilson interval uses the audit mix rather than population weights.

## Milestone 2 — Characterize noise
Billing/Refund accounts for **26/60 = 43.33%** of all disagreements; Technical/Account Access accounts for **15/60 = 25%**. This concentrated pattern suggests nonuniform, category-dependent errors. Ambiguous category guidelines and less-experienced annotators are plausible hypotheses, not proven causes. Audit individual ticket texts, review decision rules and boundary cases, retrain workers, and adjudicate ambiguous tickets.

## Milestone 3 — Noisy accuracy ceiling
Under independent uniform flips among the five other classes, noisy accuracy A_noisy = (1-eta)*A_true + eta/(K-1)*(1-A_true). For eta=.15, K=6, A_noisy=.82, estimated A_true = **96.34%**. This estimate is **not** a measured accuracy and may be unreliable because error patterns are systematic and tier-specific; train/test label errors may also be correlated.

## Milestone 4 — Prioritize 2,000 expert reviews
Proposed allocation: 1,000 confident out-of-fold prediction/label disagreements; 500 high-risk known confusion cases; 300 uncertain or rare-class cases; 200 random control examples. Deduplicate selections and enforce a total budget of 2,000. Use cross-validation probabilities (not in-sample model predictions). Experts should be blinded to model recommendations when feasible. Evaluate precision@K (confirmed bad labels / reviewed labels), uplift versus random sampling, per-tier/per-class discovery, and downstream held-out expert-test macro F1 after corrections. This is a proposed design: no authentic ticket IDs can be selected without ticket-level records.

## Milestone 5 — Mitigate and evaluate
Compare cross-entropy baseline to label smoothing and a small-loss/Co-teaching method (tune only on validation data). Audit the remaining noise and track per-class macro F1, accuracy, precision, recall, and confusion matrices. Create a held-out, representative expert-labeled test set with independent annotations, arbitration and documented guidelines. Do not use the expert test set for training or hyperparameter tuning. The existing crowd-labeled test set is unreliable because it may mark correct predictions wrong and reward shared annotation errors.

## Demonstration
Run `python -m src.analysis` then inspect `outputs/results.json`, `outputs/tier_error_rates.png`, and `outputs/confusion_pairs.png`. Run `pytest -q` for reproducibility tests. No model-training performance or review yields are claimed.
