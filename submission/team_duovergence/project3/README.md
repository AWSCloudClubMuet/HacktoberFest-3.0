# Noisy Labels: HelpDeskNet-50K

Analysis of annotation noise in a fictional dataset of 50,000 customer-support tickets with six classes. A text classifier plateaus at 82% accuracy, and the task is to measure the label noise, understand it, and plan how to fix training and evaluation.

This project is analysis only. There is no dataset and no model to train, so the code checks the arithmetic and the statistics.

## Files

| File | Purpose |
|---|---|
| `NOISY_LABELS_ANALYSIS.md` | The full written analysis for all five milestones, with calculations |
| `noisy_labels_calcs.py` | Reproduces every number: confidence intervals, significance tests, the Monte Carlo test, the accuracy-ceiling formula |

## Requirements

Python 3.9 or newer, `numpy`, `scipy`.

```bash
python noisy_labels_calcs.py
```

## Key findings

| Question | Result |
|---|---|
| Crowd noise rate | 60 / 400 = **15.0%**, Wilson 95% CI **11.8% to 18.8%**. About 6,750 of 45,000 crowd labels are likely wrong |
| Tier A vs Tier B | 6.7% vs 21.8%. Two-proportion z = 4.22, p ≈ 2.4e-5. Difference 15.2 points, 95% CI 8.6 to 21.7. Not chance |
| Random or systematic? | **Systematic.** Only 8 of 30 possible confusion cells are used, and the top 3 hold 58% of errors. Uniform random noise never looked this concentrated in 20,000 simulations |
| Biggest confusions | Billing ↔ Refund (43% of errors), Technical ↔ Account Access (25%), Shipping ↔ Other (18%) |
| Pattern with "Other" | In 16 errors the crowd chose a specific class where the expert chose Other, against 3 the other way. Crowd workers under-use Other |
| Likely root cause | Ambiguous class boundaries and unclear rules for Other, made worse by under-trained Tier B workers |
| True accuracy if noise were uniform | (0.82 − 0.03) / (0.85 − 0.03) ≈ **96.3%** |
| Why that is unreliable | Noise is class-dependent and correlated with the model's predictions. The assumption-free bound is **67% to 97%**. A perfect model would score only about 85% on this test set |

## Milestone summary

1. **Quantify noise:** Wilson intervals, a stratified check, and a two-proportion test for the tier gap.
2. **Characterize noise:** confusion pattern analysis, root-cause reasoning, and what to check or change in the annotation process.
3. **Accuracy ceiling:** the naive uniform-noise estimate and the reasons it breaks here.
4. **Find bad labels:** rank tickets for the 2,000 expert reviews using out-of-fold model scores plus tier and class-pair priors. Keep a random control slice, and evaluate the selector against the 400 audited tickets.
5. **Mitigate and evaluate:** transition-matrix loss correction (or a robust loss such as GCE), and small-loss sample selection (co-teaching or confident-learning pruning). Build a gold test set with at least two independent experts per ticket, drawn at random from production tickets.

## How to read the confusion table

The table is crowd → expert. "Shipping → Other" means the crowd labeled the ticket Shipping and the expert labeled it Other.

## Limitations

- Expert labels are treated as ground truth. Experts are imperfect, so "noise" here means disagreement with experts.
- The audit table is not split by tier or worker, so the root cause is the most likely explanation, not a proven one.
- The tier comparison assumes tickets were randomly assigned to tiers and does not adjust for correlation between tickets labeled by the same worker.
- Per-class error rates in the analysis assume the 400 audited tickets mirror the overall class mix.
- Milestones 4 and 5 are plans. Nothing was trained or measured, because no data was provided.
