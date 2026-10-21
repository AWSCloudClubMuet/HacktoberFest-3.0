# Debugging attention gradients and evaluation

Issue: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8

Team loop, implementation owner Moksh. This report covers all four required milestones. It includes a training-pipeline correction specification, an executed NumPy attention implementation and numerical verification, a fraud-evaluation design, and learning-curve diagnoses. The supplied task is analytical; no original model-training data or fraud dataset was supplied.

## A Training pipeline

The supplied snippet omits the loader construction, loss definition, device setup, metric function and dataset semantics. The observations below separate visible methodological errors from conditional implementation errors. The snippet alone cannot prove the cause of 55% validation accuracy.

### Problems and fixes

| Finding | Evidence and likely effect | Fix |
| --- | --- | --- |
| Preprocessing leakage | StandardScaler is fitted on all X before splitting. Validation observations influence fitted means and variances. This compromises independence and risks optimistic evaluation; it does not guarantee increased accuracy or explain the 55% stall. | Split raw paired X/y first. Fit the scaler on training rows only; transform validation/test with that same fitted scaler. Fit every learned preprocessing step within each training fold. |
| Input-only shuffle | `np.random.shuffle(X_tr)` moves inputs without their labels. If the loader is constructed from these arrays afterward, pairs are corrupted; an overparameterized model may fit corrupted training examples while generalization fails. If the loader was already built with copies, this line may not affect it. | Remove the input-only shuffle. Pair rows/labels in TensorDataset and use DataLoader(shuffle=True). If shuffling manually, apply a single permutation to both arrays. |
| Validation in training mode | Each epoch calls model.train() but never switches to eval() before validation. Dropout remains stochastic and BatchNorm uses validation-batch statistics and updates its buffers. This can cause fluctuation and contamination of evaluation state. | After training batches call model.eval(); evaluate inside torch.inference_mode() or no_grad(). Restore train() for the next training epoch. no_grad() alone does not disable Dropout or change BatchNorm behavior. |
| Scheduler cadence | StepLR(step_size=1, gamma=0.9) is advanced after every batch. If an epoch-based schedule was intended, decay is much faster than intended. This is a schedule mismatch, not an illegal optimizer operation. | Call scheduler.step() once after all optimizer steps for an epoch, unless a deliberately batch-based schedule is specified. Log the learning rate per epoch. |
| Possible dtype/device mismatch | StandardScaler commonly outputs float64, and torch.tensor(X_val) preserves a NumPy dtype. The model often uses float32 and may be on a different device. This usually produces an explicit error, not a silent 55% result. | Convert every feature split to torch.float32 and move batches/validation tensors to the model device. For two-logit CrossEntropyLoss use integer class IDs with torch.long. |
| Loss/metric contract unknown | loss_fn and accuracy are not supplied. Incorrect target shapes, probability/logit confusion, or wrong argmax dimension can invalidate reported results. | For the shown two-logit output use CrossEntropyLoss on raw logits; predictions are logits.argmax(dim=1). Verify targets are shape (batch,) and labels are 0/1. Count correct predictions across all examples, including partial final batches. |
| Split representativeness unknown | The first 8,000 rows may differ from the last 2,000 by class, time or source. Slicing is not inherently wrong: it can be correct for ordered temporal data. | For IID rows, use a fixed-seed stratified paired split. For time-dependent rows, use chronological splits and explain distribution differences. Keep related duplicate events from leaking across splits. |
| Dropout before BatchNorm | This ordering can make BatchNorm statistics depend on dropout noise. It is a design risk, not a proven bug or the established cause of failure. | Compare the original against Linear -> BatchNorm -> ReLU -> Dropout using the same split and seeds. Tune dropout only on validation data. BatchNorm also needs suitable batch sizes. |
| Training diagnostics absent | A single validation accuracy does not expose class imbalance, collapse, miscalibration, or unstable runs. Lack of random seeds makes comparisons harder. | Report class counts, majority-class accuracy, validation loss, confusion matrix, per-class recall, learning rate and repeated-seed variation. Keep the test set untouched. |

For illustration only, with 8,000 training rows and batch size 32, there are 250 steps per epoch. After one epoch the batch-stepped learning rate is `0.001 * 0.9**250`, about `3.64e-15`, versus `0.0009` for one epoch step. The issue does not supply a batch size, so this is not a measurement of the original run.

### Corrected training steps

This precise fix description is supplied instead of claiming a rerun of the unavailable training pipeline, as permitted by the issue.

1. Validate X has 40 feature columns, matching nonmissing labels, finite features after defined imputation, and binary target semantics. Log class frequencies and feature availability times.
2. Select paired train/validation rows using the appropriate IID or temporal split. Keep an independent final test set if the experiment includes final model evaluation.
3. Fit StandardScaler only on training X; use transform for other splits. Never fit transformations on held-out rows.
4. Convert scaled X to float32 and class IDs to int64. Build TensorDataset(x_train, y_train). Use a fixed-seed shuffled training loader and a nonshuffled validation loader. Keep paired rows together.
5. Build the model on the chosen device. Use CrossEntropyLoss with two raw logits. Ensure BatchNorm training batches are valid; handle a final single-example training batch deliberately instead of silently dropping evaluation rows.
6. Per epoch: call model.train(); for each paired batch move tensors to the device, zero gradients, compute logits and loss, backpropagate, and optimizer.step(). Accumulate loss weighted by batch size.
7. Call scheduler.step() once at the end of the training epoch for the intended StepLR schedule.
8. Call model.eval(); use torch.inference_mode(); evaluate the full validation set in batches. Compute sample-weighted loss and correct/total, plus class-wise metrics. Do not update weights, scaler or normalization buffers on validation rows.
9. Log metrics and learning rate. Choose hyperparameters and any early-stopped checkpoint on validation data only; evaluate the final chosen model once on the untouched test set.

The 55% observation is consistent with several possibilities: a majority-class baseline, broken pairing, overfitting, shift, poor labels or unstable evaluation. Compare hypotheses rather than declaring a single root cause from this snippet.

### Diagnostic experiments without source access

These experiments assume access to input/output predictions or cooperation from the training operator. A graph of accuracy alone is insufficient to run or interpret all of them.

| Experiment | Observation and interpretation |
| --- | --- |
| Calculate the held-out majority-class baseline and confusion matrix | If one class is about 55% and predictions are mostly that class, the model may have collapsed to that baseline. Accuracy alone concealed this. |
| Repeat identical inputs with a fixed model/checkpoint, alone and in different batch compositions | Variation suggests stochastic inference, batch-sensitive normalization, or nondeterministic preprocessing. It does not identify which without further controls. |
| Ask for a tiny, clean, separable dataset to be fitted and then overfitted | Failure to fit a simple training subset suggests a pairing, loss, feature or optimization problem. Success does not rule out full-data generalization problems. |
| Request a paired-label permutation control with the same split and training budget | Genuine held-out performance should fall toward an appropriate no-information baseline. Persistently strong results suggest leakage or evaluation contamination. |
| Compare scores by class, source, time and feature-missingness group | A chronological/source subgroup gap supports shift or data-quality hypotheses. Report group sample sizes and uncertainty. |
| Request learning-rate history and a fixed-rate control | If the rate collapses within the first epoch and a reasonable fixed-rate control learns, the scheduler hypothesis gains support. This requires operator-provided telemetry. |
| Re-run identical predictions across different request orders with fixed model weights | Order-sensitive outputs motivate checking persistent state or preprocessing. Rule out intentional stateful behavior first. |

### Assumptions and limitations

No original dataset, loader, trained weights, GPU run or verified original class balance was supplied. No improvement on the organizer's original dataset is claimed. Following the additional experimental-data instruction relayed by Moksh, [the synthetic experiment](#synthetic-training-experiment) now documents actual training on generated data using a NumPy equivalent of the supplied architecture. Its mean test accuracy increased from 48.82% to 89.62% across three seeds. This section remains the original-snippet diagnosis and correction specification, not a tested PyTorch rerun; the separate experiment retains neutral and unfavorable ablation results.

### Synthetic training experiment

#### What was actually executed

Following the additional instruction relayed by Moksh to demonstrate an experiment on generated data, this submission now includes an executed training experiment, not only proposed fixes. We generated 10,000 rows with 40 features and two classes, trained ten predetermined pipeline variants for 50 epochs each across seeds 7, 19 and 42, and recorded all 30 runs.

The faulty baseline averaged **48.82% test accuracy**; the fully corrected pipeline averaged **89.62%** on the same 2,000 held-out rows, an observed increase of **40.80 percentage points**. Sample standard deviations across training seeds were 0.83 and 0.30 percentage points respectively. These summarize initialization/training variation on one fixed synthetic dataset and split; they are not population confidence intervals.

This does not reproduce the organizer's original 55% observation. No data was generated or selected to force that number. This binary-classification dataset is also separate from the report's hypothetical 0.1%-prevalence fraud scenario.

#### Dataset and reproducibility

`experiment_results/dataset.npz` contains the full generated features, labels and split indices. `dataset_preview.csv` shows the first ten rows for inspection; it is not the full dataset. `dataset_metadata.json` records the generation rule, seeds, split counts and a SHA-256 fingerprint of the arrays.

- Generate independent standard-normal raw features z with NumPy seed 2026.
- Compute the label from `2*z0 - 1.5*z1 + 0.9*z2 + 0.8*z3*z4 + 0.5*sin(z5) > 0.3`.
- Independently flip each label with probability 0.02. The remaining 34 features are nuisance features.
- Apply fixed geometric feature scales from 0.01 to 100 and seeded offsets to make standardization relevant. These transformations are part of data generation, not model fitting.
- Use a fixed random IID split with seed 773: 6,000 training, 2,000 validation and 2,000 test rows. Split indices are disjoint and cover every row exactly once.
- The original 8,000/2,000 example is changed deliberately to 6,000/2,000/2,000 so an additional independent final test is available. The validation majority-class baseline is 52.35%, and the test majority-class baseline is 53.70%.

No personal data or external dataset is used. Reproduction checks regenerate the arrays and verify the fingerprint.

#### Model and controlled comparison

We used a handwritten NumPy implementation of the supplied architecture: Linear(40,128), ReLU, Dropout(0.5), BatchNorm and Linear(128,2), trained with cross-entropy and Adam. BatchNorm uses epsilon 1e-5, update momentum 0.1 and an unbiased running-variance update. Hidden weights use He-normal initialization and output weights use standard deviation 1/sqrt(hidden). These are explicit choices held fixed across comparisons, not a claim of matching PyTorch's default initialization or bitwise behavior.

The CPU PyTorch download timed out, so this experiment runs with the existing NumPy dependency. This is a NumPy equivalent, not execution of the original PyTorch snippet. Its MLP/BatchNorm backpropagation is checked against finite differences on a small float64 case; full training uses float32.

Each training seed uses identical initial weights and separate reproducible random streams for batch order, training dropout and validation dropout across variants. We predeclared 50 epochs, batch size 256 and learning rate 0.001; there is no checkpoint/hyperparameter selection based on the final test. All variants report final-epoch metrics. The test set is evaluated read-only at the end of each predetermined run; repeated runs are descriptive comparisons, not a test-driven search for a winning configuration.

The four fix switches are:

| Switch | Faulty setting | Corrected setting |
| --- | --- | --- |
| pairing | Shuffle training inputs once without their labels | Keep input/label pairs together; shuffle paired batches |
| scaler | Fit means/std on training plus validation features | Fit on training features only |
| eval | Validation uses dropout and batch statistics, updating BatchNorm buffers | Read-only validation with dropout off and frozen running statistics |
| scheduler | Multiply learning rate by 0.9 after every training batch | Multiply by 0.9 after every epoch |

Even the faulty scaler excludes the test features so the final test does not participate in preprocessing fit. Its intentional validation leakage means that its validation estimate is compromised; that is part of the failure being demonstrated.

We retain both the validation number reported under each variant's own mode and a common read-only evaluation-mode validation number. The summary table uses the latter for a consistent comparison. Training loss, both validation losses/accuracies and learning rate are saved per epoch in learning_curves.csv. No final-test scores are used during epochs.

#### Results and interpretation

| Variant | Validation mean | Test mean | Test seed SD |
| --- | ---: | ---: | ---: |
| Faulty baseline | 47.73% | 48.82% | 0.83 pp |
| Only pairing fixed | 54.87% | 55.55% | 0.44 pp |
| Only scaler fixed | 47.73% | 48.88% | 0.83 pp |
| Only eval fixed | 47.72% | 48.80% | 0.88 pp |
| Only scheduler fixed | 51.80% | 52.18% | 2.23 pp |
| All four fixed | 88.60% | 89.62% | 0.30 pp |
| All except pairing | 51.75% | 52.02% | 2.01 pp |
| All except scaler | 88.62% | 89.60% | 0.33 pp |
| All except eval | 88.62% | 89.65% | 0.31 pp |
| All except scheduler | 54.90% | 55.48% | 0.38 pp |

The pairing and scheduler faults dominate this controlled example. Fixing one while retaining the other leaves a major problem in place. Fixes interact, so isolated single-fix improvements do not add up to the fully corrected gain.

Removing scaler leakage remains methodologically correct but does not materially improve this IID experiment's accuracy. Evaluation mode restores a valid deterministic evaluation procedure; it does not necessarily increase accuracy, and the all-except-eval variant's mean test score is very slightly higher here. These small differences across only three seeds should not be presented as a reliable ranking. All outcomes are retained rather than discarding neutral or unfavorable comparisons.

The fully corrected mean training accuracy is 91.16%, validation is 88.60% and test is 89.62%. The discrepancy reflects generalization and sampling/training variation; no claim of perfect learning is made. The fixed 0.9-per-epoch schedule and dropout are not tuned to maximize this dataset's test score.

#### Run and inspect

From this issue folder, using the existing parent NumPy environment:

```powershell
..\.venv\Scripts\python.exe verify_experiment.py

..\.venv\Scripts\python.exe verify_experiment.py --rerun-seed 7

..\.venv\Scripts\python.exe synthetic_training.py

..\.venv\Scripts\python.exe verify.py
```

The complete run took approximately one to two minutes on this laptop; runtime is hardware dependent. A separate paired seed-7 replay reproduced 48.00% baseline test accuracy and 89.65% corrected test accuracy and matched the saved loss/accuracy values within the documented replay tolerances (rtol=1e-5, atol=1e-6).

The default experiment command overwrites experiment_results/ with freshly executed output. To experiment with a different epoch count, use a different output folder, for example `--epochs 10 --output experiment_trial`, and do not replace the recorded full results with a trial while presenting the full-run numbers.

#### Limits

This establishes observed improvement on one explicitly defined synthetic task. It does not prove the cause of the original 55% result or expected improvement on real university or fraud data. Three training seeds do not explore dataset/split uncertainty. Initialization, data rule, hidden-layer size, dropout and schedule are documented controlled choices. The original PyTorch model was not executed; no original-dataset accuracy is claimed. The attention-gradient implementation remains a separate, independently verified deliverable.

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

Verification results: 32 unittest tests passed, including attention reference/gradient tests, cost-helper robustness, and six synthetic-training tests. Across the 15 attention gradient-array checks, the largest maximum absolute error was approximately 2.624e-10 and the largest relative L2 error approximately 4.515e-10. Exact machine-readable results are in [results/gradient_checks.json](results/gradient_checks.json). Last digits can vary with numerical libraries/platforms. These small numerical checks establish local derivative consistency and tested edge behavior; they are not a proof for every possible input or a model-quality benchmark. The separately documented training experiment provides measured model results on the generated dataset.

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
- No original PyTorch training run was executed; precise fix descriptions satisfy the written issue's permitted alternative. The additional NumPy experiment shows improvement on generated data, not on the original 55% example. Full methodology and seed variability are in the synthetic experiment section.
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
