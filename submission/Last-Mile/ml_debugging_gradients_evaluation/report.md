# Machine Learning Debugging, Gradients & Evaluation

## Milestone 1 — Silently failing training run

The most severe bug is `np.random.shuffle(X_tr)` without applying the same permutation to `y_tr`. This breaks feature-label correspondence. The loss may still fall, but the model is trained on incorrect targets.

Other bugs and risks:
- Scaling before the split leaks validation distribution statistics; split first and fit scaler only on training.
- Missing `model.eval()` leaves dropout active and BatchNorm in training mode during validation.
- Missing `torch.inference_mode()` wastes memory and computation.
- Calling `scheduler.step()` inside the minibatch loop decays the learning rate too quickly for a per-epoch `StepLR`.
- A sequential split can be invalid for time-, group-, or label-sorted data.
- Missing checks for label encoding, shape, NaNs, infinities, and class imbalance can hide data issues.
- Accuracy alone can conceal majority-class predictions.
- Dropout before BatchNorm can distort running statistics; test a more conventional layer order.

Corrected runnable example: `milestone1/train_classifier.py`. It uses a stratified split, train-only scaling, shuffled aligned batches, evaluation mode, inference mode, per-epoch scheduler stepping, and class-sensitive metrics. It can run on generated data using `python milestone1/train_classifier.py --synthetic`.

Black-box experiments: tiny-subset overfit, repeated validation inference, LR logging, baseline/confusion matrix, label permutation, and row-ID alignment audit.

## Milestone 2 — Attention gradients

Forward:
\[
S=QK^T/\sqrt d,\quad P=\operatorname{softmax}(S),\quad O=PV.
\]

For upstream `G = dL/dO`:
\[
dV=P^TG,\quad dP=GV^T.
\]
\[
dS=P\odot(dP-\operatorname{rowsum}(dP\odot P)).
\]
\[
dQ=dSK/\sqrt d,\quad dK=dS^TQ/\sqrt d.
\]

The row-wise softmax derivative follows from `∂p_i/∂s_j = p_i(δ_ij-p_j)`.

The implementation in `milestone2/attention_numpy.py` uses NumPy float64, central finite differences, step size `1e-5`, and an acceptance threshold of maximum absolute error below `1e-7`. Run the script to obtain measured gradient-check output.

For stability, subtract each row maximum before exponentiation. Scaling by `1/sqrt(d)` keeps score variance roughly constant under standard assumptions and helps avoid softmax saturation. A causal mask sets future-position scores to negative infinity; masked probabilities and score gradients are zero.

Dense attention materializes an O(n²) score/probability matrix and uses O(n²d) arithmetic. FlashAttention uses tiling, fused operations, and online softmax to avoid materializing the full matrix in high-bandwidth memory; exact dense attention arithmetic remains quadratic.

## Milestone 3 — Fraud evaluation

At 0.1% fraud prevalence, an all-legitimate classifier has 99.9% accuracy but zero fraud recall. Use PR-AUC, precision, recall, confusion matrices, cost at threshold, and operational capacity metrics; ROC-AUC is secondary and accuracy is not a primary metric.

Use chronological, label-maturity-aware train/validation/test windows. Exclude immature outcomes from confirmed negatives, prevent point-in-time leakage, and consider account-group splits where relevant. Use mature cohorts for official evaluation and provisional metrics for recent cohorts.

For calibrated fraud probability `p`, the simplified expected costs are:
- Allow: `200p`
- Flag: `5(1-p)`

Flag when `5(1-p) < 200p`, giving `p > 5/205 ≈ 2.44%`. Real thresholds must reflect actual intervention effectiveness and operational constraints.

Assess calibration using reliability diagrams, Brier score, log loss, and segment/time checks. Monitor feature, score, mature-label performance, calibration, and operational drift. Retrain when persistent material drift or measured performance degradation justifies it, then validate on later data and roll out with rollback.

## Milestone 4 — Learning curves

- **A (62%/60%, flat):** likely underfitting or ineffective optimization. Check gradients, tiny-set overfit, learning rate, capacity, and features.
- **B (99%/78%, slowly shrinking gap):** likely overfitting/high variance. Try representative data, regularization, simpler models, early stopping, and distribution checks.
- **C (85%/91%, both improving):** validation may be easier; training-time regularization, BatchNorm behavior, or sampling variability can explain it. Compare both in evaluation mode and inspect distributions.
- **D (88%/70%, gap persists with 4x data):** plausible distribution shift or persistent overfitting/spurious features. Compare performance on a fixed IID holdout and the deployment-like validation set as training size grows. IID recovery with persistent deployment failure supports distribution shift.

These diagnoses are hypotheses; controlled experiments determine the root cause.
