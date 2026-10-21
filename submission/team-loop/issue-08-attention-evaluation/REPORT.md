# Debugging attention gradients and evaluation

Issue: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8

Team loop, implementation owner Moksh. This report covers all four required milestones. It includes a training-pipeline correction specification, an executed NumPy attention implementation and numerical verification, a fraud-evaluation design, and learning-curve diagnoses. The supplied task is analytical; no original model-training data or fraud dataset was supplied.

## A Training pipeline

[TRAINING-FIXES.md](TRAINING-FIXES.md) gives the complete finding/effect/fix table and corrected procedure. Its central findings are preprocessing leakage, possible X/y misalignment, validation performed in training mode and overly frequent StepLR decay if the intended schedule is epoch-based. It separately lists conditional dtype/device/loss problems and split/architecture hypotheses.

No single cause of the 55% result is proven: train_loader construction, accuracy implementation, class counts and data ordering are omitted. The majority-class baseline, fixed-checkpoint repeatability, tiny-clean-subset fitting, shuffled-label control and operator learning-rate history are proposed diagnostics. Improved training metrics are not fabricated.

## B Attention derivation and implementation

### Shapes and forward equations

For a single head use Q of shape (nq,d), K of shape (nk,d), V of shape (nk,dv). The original self-attention case has nq=nk=n. Define c=1/sqrt(d):

```text
S = c Q K^T                    (nq,nk)
P_ij = exp(S_ij-m_i) / sum_l exp(S_il-m_i)
O = P V                        (nq,dv)
```

Here m_i is the largest allowed score in row i. Subtracting it preserves softmax ratios while keeping exponential arguments nonpositive. Direct exponentiation can overflow for large positive scores. Finite inputs can still overflow in QK^T at extreme magnitudes; the implementation reports that arithmetic error instead of returning NaNs.

Scaling intuition: if independent, centered q/k components each have variance near one, a d-component dot product has variance near d. Multiplication by 1/sqrt(d) keeps score variance near one. Without it, larger d can make softmax highly saturated and its gradients very small. This variance argument is an approximation, not a guarantee for arbitrary correlated embeddings.

### Backward derivation

Let G=dL/dO be the supplied upstream gradient, with shape (nq,dv). Matrix multiplication differentials give:

```text
dO = dP V + P dV
dV = P^T G                     (nk,dv)
dP = G V^T                     (nq,nk)
```

For one row, softmax has derivative dP_ij/dS_il=P_ij*(delta_jl-P_il). Applying the vector-Jacobian product gives:

```text
t_i = sum_j(dP_ij * P_ij)
dS_ij = P_ij * (dP_ij - t_i)
```

Finally, from S=c Q K^T:

```text
dQ = c dS K                    (nq,d)
dK = c dS^T Q                  (nk,d)
```

These are gradients of L, not updates to the parameters. NumPy code computes all five arrays explicitly; no automatic differentiation or framework attention function is used.

### Masks and edge cases

A boolean mask uses True for an allowed query/key pair. Causal self-attention allows j<=i, including the diagonal. Disallowed scores become negative infinity before stable softmax, so their probabilities and score gradients are exactly zero. The same backward equations apply with these masked probabilities, and dS is explicitly zeroed at forbidden entries.

Zero masked dS entries do not imply that corresponding whole Q/K/V rows have zero gradients: those rows may contribute through other allowed pairs. dP is an unconstrained intermediate gradient and is not forced to zero merely because P is masked.

Fully masked rows are rejected with ValueError. A naive softmax of all negative infinities has an undefined normalization, while replacing them all with the same large finite negative number can produce a misleading uniform distribution. A clear rejection policy makes our behavior testable. This implementation supports rectangular noncausal attention; causal mode deliberately requires equal query/key lengths. Shape errors, nonboolean masks and nonfinite inputs are also rejected.

### Numerical verification

Choose a fixed random upstream matrix G and scalar loss L=sum(O*G). For each coordinate x:

```text
numerical_gradient(x) = [L(x+h)-L(x-h)]/(2h)
```

Settings: NumPy float64, seed 42, central step h=1e-6. Each gradient must satisfy both maximum absolute error <=1e-7 and relative L2 error <=1e-6, where the latter is `norm(analytic-numerical)/max(1e-12,norm(analytic)+norm(numerical))`.

The executable checks cover rectangular unmasked attention, square causal attention, and a custom sparse boolean mask. Q, K, V, intermediate probabilities P and pre-mask scores S are each checked numerically. Perturbations of forbidden pre-mask scores have no effect. The checker exits nonzero if any condition fails.

Recorded local run: 22 unittest tests passed. Across the 15 gradient-array checks, the largest maximum absolute error was approximately 2.624e-10 and the largest relative L2 error approximately 4.515e-10. Exact machine-readable results are in [results/gradient_checks.json](results/gradient_checks.json). Last digits can vary with numerical libraries/platforms. These small synthetic checks establish local derivative consistency and tested edge behavior; they are not a proof for every possible input or a model-quality benchmark.

### Memory growth and FlashAttention

For square sequences, the score and probability matrices each contain n^2 elements. One float64 matrix uses 8*n^2 bytes: 128 MiB at n=4096 and 512 MiB at n=8192. Keeping both doubles those amounts before Q/K/V, masks, gradients and temporary arrays. Our explicit implementation therefore has quadratic attention-matrix storage, plus linear embedding storage. Arithmetic cost is O(n^2*(d+dv)).

FlashAttention computes exact dense attention in tiles using fast on-chip memory, online softmax statistics and recomputation during backward. It avoids materializing the full n-by-n attention matrices in GPU high-bandwidth memory and reduces memory traffic. It does not make general dense attention's arithmetic linear in n. This submission explains the technique; it does not implement a FlashAttention GPU kernel or claim its performance.

## C Fraud evaluation strategy

### Metrics and baseline

At the given prevalence, an always-normal classifier gets 99.9% accuracy and zero fraud recall. In an illustrative 100,000 transactions, the expected 100 frauds would all be missed; at $200 each that is $20,000 expected false-negative cost. These are scenario calculations, not observed data.

Primary comparison measures are average precision (clearly specify the AP definition rather than conflating it with trapezoidal PR-AUC), the precision-recall curve, fraud recall at a fixed investigation capacity or false-positive rate, and monetary cost at the operational threshold. Also show precision, recall, false-positive count/rate and the full confusion matrix at the chosen threshold. At 0.1% prevalence a small FPR can still produce many unnecessary investigations. ROC-AUC is a useful secondary ranking metric, but neither ROC-AUC nor raw accuracy alone establishes operational usefulness. Do not optimize on a balanced test sample while presenting the result as natural-prevalence performance.

Use the same matured chronological test cohort for model comparisons, with block/bootstrap uncertainty that respects time/card dependence. Report segment and time-window results with sample counts; a period containing no fraud cannot support a meaningful fraud-recall estimate.

### Time splits and label maturity

Use rolling chronological development folds. For each simulated deployment date T, train only on earlier transactions whose labels were actually available by T. Fit preprocessing on that training fold. Treat a transaction with no chargeback yet as pending until the chosen maturity policy is met; absence of a chargeback today is not a confirmed negative.

A concrete conservative backtest uses a 60-day label-maturity buffer: at T, training uses eligible transactions dated no later than T-60 days (plus any actual reporting lag), assuming those labels are mature. Score the next chronological validation window using features available at transaction time and evaluate it only after its labels mature. Choose model/calibrator/threshold through these earlier folds. Lock the complete procedure, retrain at a later simulated deployment cutoff using only then-available labels, and score a strictly later final test window. Evaluate that test once after its own maturity horizon. The 60-day rule is an issue-based working assumption; verify actual label completeness and settlement definitions rather than declaring every day-60 non-chargeback certainly legitimate.

Exclude future chargebacks, subsequent investigations and later aggregate statistics from transaction-time features. Prevent duplicate-transaction leakage. For production scoring of existing cards, past history for a card can legitimately appear in training and later test observations if history is constructed as of each transaction. Add a separate card-disjoint analysis if unseen-card generalization matters; blindly grouping all cards changes the question.

### Evaluation before delayed labels arrive

Maintain prediction-time cohorts and log model version, score, decision, features/reference, event timestamp and label-arrival timestamp. Report settled/matured cohorts separately from pending ones. Publish rolling retrospective AP, recall and cost as labels mature, with coverage and sample sizes. Compare the same maturity level across model versions.

For recent cohorts, use input/score shifts and operational or adjudicated proxy indicators as provisional monitoring, not final fraud accuracy. If early estimates use a label-delay model, state censoring assumptions and validate them against later matured outcomes. Declined transactions can have selectively missing outcomes; do not silently label all declines or unreviewed transactions as legitimate. Use suitable adjudication/audit samples and document residual selection bias.

### Cost threshold and calibration

Let p be a calibrated posterior probability of fraud at deployment prevalence. Assume the only costs are $200 for letting fraud through and $5 for flagging a legitimate transaction; correct decisions have zero cost, and there is no capacity constraint.

```text
Expected cost of flagging = 5*(1-p)
Expected cost of passing = 200*p
Flag when 5*(1-p) <= 200*p
p >= 5/205 = 1/41 = 0.0243902439...
```

At equality either action has equal modeled cost. evaluation.py computes and tests the threshold and both expected costs. On a matured validation cohort, also examine empirical `200*FN + 5*FP`, capacity and uncertainty. Costs that vary by transaction amount, intervention efficacy, review expense or capacity require a revised decision policy rather than automatic use of 2.439%.

Check calibration on a disjoint, mature, natural-prevalence time window: show reliability bins with counts, compare predicted and observed rates, and report log loss/Brier score with the base-rate baseline. Sparse positives make bins uncertain. If needed, fit sigmoid or isotonic calibration using held-out development data, then test on later data. Avoid using the same observations to train the base model, fit calibration and claim final performance. Resampling/class weighting can shift probability calibration; validate or correct probabilities for deployment prevalence and monitor them over time.

### Drift and retraining

Monitor feature distributions, missingness, transaction volume and score/alert distributions immediately. Review merchant/channel/card segments and model/data-pipeline health. Feature drift is not automatically concept drift or model failure. After labels mature, track AP, fraud recall, precision, calibration and cost over rolling cohorts against a registered baseline with uncertainty and sufficient fraud counts.

Predefine business-approved deterioration conditions and minimum sample requirements, rather than inventing a universal drift threshold. Investigate broken data pipelines, new fraud patterns, label-policy changes and altered prevalence. Retrain on recent, mature, representative data when evidence warrants it; validate through chronological backtests, recalibrate, compare to the incumbent and use a controlled rollout with rollback. A drifting proxy score alone is not proof that retraining will help.

## D Learning curves

Accuracy levels alone are insufficient for a unique diagnosis; comparisons assume identical metric definitions and reasonably comparable train/validation distributions.

| Case | Interpretation and alternatives | Intervention and justification |
| --- | --- | --- |
| A: 62% train, 60% validation, both flat with more data | Consistent with high bias/underfitting, optimization failure, weak features or a label-noise/information ceiling. A small gap alone does not establish which. | First check class baseline, pairing, labels and ability to overfit a tiny clean subset. If learning works but capacity is limited, improve features/capacity, reduce excessive regularization and tune optimization. More similar data alone is unlikely to fix a flat high-bias curve. |
| B: 99% train, 78% validation, gap slowly shrinks | Consistent with high variance/overfitting; improvement with more data supports this, but split shift or leakage can coexist. | Try representative extra data, justified augmentation, regularization, early stopping and simpler capacity. Compare consistently defined train/evaluation metrics and keep a final test untouched. |
| C: 85% train, 91% validation, both rise slightly | Not automatically a bug. Train accuracy may be measured with Dropout/augmentation on, while validation is clean/eval-mode; validation may be easier. Leakage is another possibility. | Recompute train and validation scores with the same checkpoint, eval mode and comparable preprocessing. Inspect split difficulty, label quality, duplicates and preprocessing leakage. If the gap disappears, stochastic training conditions explain it; otherwise investigate distribution and sampling differences. |
| D: 88% train, 70% validation, gap persists with 4x data | At least two hypotheses: persistent source/time distribution shift; and systematic label-quality differences between train and validation. Persistent high variance or repeated/nonindependent extra data are additional possibilities. | Use the distinguishing experiment below before choosing a fix. More data drawn from the wrong source or with the same label defects need not close the gap. |

### One distinguishing experiment for D

Run a pre-specified crossed source-and-label audit with a frozen model. Take random held-out examples from the training source and validation source, matched on available class/time/difficulty factors and excluding training duplicates. Have blinded experts independently label them and adjudicate disagreements, preserving both original and audited labels.

Compare the model's performance and original-to-expert disagreement rates across both sources, before and after adjudication. If the source performance gap persists with similar reliable label quality, distribution shift is supported. If one source has much worse labels and the gap largely disappears after adjudication, differential label quality is supported. Both can occur; finite audit samples, imperfect experts and residual difficulty differences can leave the result inconclusive. Report intervals and subgroup counts. This is a proposed experiment, not an executed study.

## Assumptions and limitations

- Attention checks use synthetic matrices, one head, 2D real-valued arrays and float64, with no attention dropout or GPU kernels. Small numerical tests do not establish every possible input's behavior.
- Causal mode is square and includes the diagonal. Fully masked rows are rejected. No zero-gradient claim is made for whole Q/K/V rows solely from a masked score.
- No original PyTorch training run was executed; precise fix descriptions satisfy the issue's permitted alternative. No improved 55% validation result is claimed.
- Fraud evaluation, calibration, delay handling and learning-curve experiments are designs. No real card data, trained detector, observed AP or production-cost improvement is claimed.
- The cost threshold depends on calibrated posteriors and the explicit constant-cost assumptions.
- This work was developed with coding-assistant support; sources are attributed below. The owner must review the derivation, reproduce the checks and comply with the organizers' AI-use/disclosure rules.

## References

1. Organizer issue: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8
2. scikit-learn preprocessing pitfalls: https://scikit-learn.org/stable/common_pitfalls.html
3. PyTorch evaluation mode: https://docs.pytorch.org/docs/2.14/generated/torch.nn.Module.html#torch.nn.Module.eval
4. PyTorch StepLR: https://docs.pytorch.org/docs/2.14/generated/torch.optim.lr_scheduler.StepLR.html
5. PyTorch masked-attention reference: https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html
6. Dao et al., FlashAttention (2022): https://arxiv.org/abs/2205.14135
7. scikit-learn model evaluation definitions: https://scikit-learn.org/stable/modules/model_evaluation.html
8. scikit-learn probability calibration: https://scikit-learn.org/stable/modules/calibration.html
