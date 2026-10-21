# Laksh's issue #9 presentation guide

## One-minute explanation

“We investigated whether unreliable labels could explain the model's plateau. The expert audit disagrees with 60 of 400 crowd labels, so estimated disagreement is 15%, with a Wilson 95% interval of about 11.83% to 18.83%.

“Tier B has 21.82% disagreement versus Tier A's 6.67%. A two-proportion test and a Fisher exact cross-check both show strong evidence of a difference if sampled tickets are independent. This does not prove that worker experience caused it; the ticket mix may differ.

“The largest disagreement pairs are Billing/Refund and Technical/Account Access. We propose clearer annotation boundaries and expert adjudication. Under the question's hypothetical uniform-noise assumption, 82% noisy accuracy corresponds to 96.34% true accuracy. That is an estimate under assumptions, not a measured result.

“We allocate 2,000 additional reviews between independent evaluation, a random training audit and targeted training corrections. Then we compare ordinary training with generalized cross entropy and prediction bootstrapping on an expert-labeled evaluation set.”

## Show the evidence

From this folder, run:

```powershell
& '..\.venv\Scripts\python.exe' calculations.py
& '..\.venv\Scripts\python.exe' verify.py
```

Open REPORT.md alongside the output: M1 contains formulas; M3 derives the 96.34% value; M4's budget totals exactly 2,000. Verification runs 16 numerical tests and compares saved calculations with new results.

## Likely questions

**Why Wilson instead of just reporting 15%?** A sample estimate has uncertainty. Wilson gives a score-based interval bounded between zero and one.

**Why not call every disagreement a proven error?** Experts can disagree too. The calculation becomes a crowd-error estimate only if adjudicated expert labels are a reliable reference.

**Is the entire dataset 15% noisy?** No. That is the crowd subset's estimate. If the original expert subset were perfect, the whole-dataset estimate would be 90% times 15%, or 13.5%. Expert error is unknown.

**What does p = 0.000024 mean?** Under equal tier rates and the sampling assumptions, a discrepancy at least this extreme is very unlikely. It is not the probability that the null hypothesis is true. Tickets from the same worker may be correlated, so we need worker IDs for stronger inference.

**Why not divide 82 by 85?** Even an incorrect model prediction can match an accidentally flipped label. The formula is `0.82 = 0.85*a + 0.03*(1-a)`, which gives `a = 79/82`.

**Did you achieve 96.34%?** No. It is the issue's requested hypothetical calculation. We did not train a model, and the real noise patterns could invalidate the assumptions.

**Can you identify the worst class?** No. Directional disagreement counts lack per-class audit denominators. Billing/Refund is the largest pair among the disagreements, not necessarily the class with the highest error rate.

**Why reserve 800 reviews for evaluation?** Corrections alone cannot tell us whether the model improved if the test labels remain unreliable. We propose 500 locked test tickets and 300 separate validation tickets, leaving 1,200 training reviews. It is a policy tradeoff, not an experimentally optimized allocation.

**How do you know targeted review works?** Measure confirmed corrections per reviewed ticket against the 400-ticket random baseline, adjust comparisons for tier mix, then test downstream performance on untouched expert evaluation. Those measurements are proposed, not fabricated.

**Why not trust high-confidence model disagreements?** Models also make systematic mistakes. Out-of-fold scoring reduces memorization leakage, but only blinded expert review can decide the correction.

**What does the test suite establish?** Correctness of numerical formulas, exact-test calculations, edge cases and the recorded output. It cannot prove annotation causes or real model improvements without data.

**Who did the work?** Laksh owns issue #9 in the team plan. With his laptop unavailable, the implementation and analysis were completed with AI assistance on Moksh's laptop. Explain that honestly if asked; do not claim a training or labeling experiment was performed.
