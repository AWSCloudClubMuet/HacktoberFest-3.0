# Training pipeline diagnosis and corrections

The supplied snippet omits the loader construction, loss definition, device setup, metric function and dataset semantics. The observations below separate visible methodological errors from conditional implementation errors. The snippet alone cannot prove the cause of 55% validation accuracy.

## Findings and precise fixes

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

## Corrected training procedure

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

## Diagnostic experiments without source access

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

## Assumptions and limitations

No original dataset, loader, trained weights, GPU run or verified original class balance was supplied. No improvement on the organizer's original dataset is claimed. Following the additional experimental-data instruction relayed by Moksh, [EXPERIMENT.md](EXPERIMENT.md) now documents actual training on generated data using a NumPy equivalent of the supplied architecture. Its mean test accuracy increased from 48.82% to 89.62% across three seeds. This section remains the original-snippet diagnosis and correction specification, not a tested PyTorch rerun; the separate experiment retains neutral and unfavorable ablation results.

## Sources

- Organizer problem: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8
- Preprocessing leakage guidance: https://scikit-learn.org/stable/common_pitfalls.html
- PyTorch evaluation mode: https://docs.pytorch.org/docs/2.14/generated/torch.nn.Module.html#torch.nn.Module.eval
- StepLR schedule and usage: https://docs.pytorch.org/docs/2.14/generated/torch.optim.lr_scheduler.StepLR.html
