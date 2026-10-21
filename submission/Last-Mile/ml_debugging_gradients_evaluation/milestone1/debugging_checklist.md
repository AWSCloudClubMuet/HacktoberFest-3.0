# Milestone 1 — Debugging checklist

## Bugs and risks

1. **Independent shuffle of `X_tr` only**
   - Symptom: feature-label pairing is corrupted; training loss can fall while validation performance remains poor.
   - Fix: do not manually shuffle only `X`; use a `DataLoader(..., shuffle=True)` or apply the same permutation to features and labels.

2. **Scaler fitted before split**
   - Symptom: validation statistics influence preprocessing; optimistic or mismatched validation estimates.
   - Fix: split first, fit scaler on training data, transform validation/test with that scaler.

3. **Missing `model.eval()`**
   - Symptom: dropout remains random at validation; BatchNorm uses batch statistics rather than running estimates.
   - Fix: call `model.eval()` before inference.

4. **Missing no-grad inference context**
   - Symptom: unnecessary graph construction and memory use.
   - Fix: use `torch.inference_mode()` or `torch.no_grad()`.

5. **Scheduler stepped per minibatch**
   - Symptom: LR decays much faster than intended.
   - Fix: step once per epoch for the shown `StepLR` configuration.

6. **Potentially invalid sequential split**
   - Symptom: validation distribution differs if rows are ordered by time, account, source, or label.
   - Fix: choose stratified IID, chronological, or group split based on deployment.

7. **No checks for target shape/type or feature validity**
   - Symptom: incorrect targets, NaNs, or infinities can create misleading training behavior.
   - Fix: validate shapes, classes, finite values, and preprocessing.

8. **Accuracy alone**
   - Symptom: majority-class predictions can appear acceptable.
   - Fix: inspect confusion matrix, balanced accuracy, precision/recall, PR-AUC and ROC-AUC.

9. **Dropout before BatchNorm**
   - Risk: dropout alters the activation distribution used for BatchNorm running statistics.
   - Fix: consider Linear → BatchNorm → ReLU → Dropout; architecture choice should be tested, not assumed to be the root cause.

## Black-box experiments

- **Tiny-set overfit:** train on 32–128 examples with dropout disabled. If loss cannot become very low, check labels, gradients, optimizer, and model implementation.
- **Repeat inference:** evaluate the same validation examples several times. Varying predictions indicate stochastic inference behavior.
- **Learning-rate logging:** log every minibatch and epoch to detect unintended scheduler decay.
- **Baseline comparison:** majority-class baseline plus confusion matrix and class-wise recall.
- **Label permutation:** randomly permute training labels; meaningful generalization should collapse if real label signal is required.
- **Data identity audit:** preserve row IDs through all shuffling, filtering, and batching to verify feature-target alignment.
