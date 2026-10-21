# Milestone 4 — Learning-curve diagnosis

## Case A: train 62%, validation 60%; both flat

**Likely diagnosis:** underfitting/high bias or ineffective optimization. The small gap and flat curves suggest the model is not learning enough useful structure.

**Interventions:** verify gradients and parameter updates; overfit a tiny subset; check label quality; tune learning rate; increase capacity or improve features; reduce excessive regularization.

**Reasoning:** more data alone rarely fixes a model that cannot fit its current training set.

## Case B: train 99%, validation 78%; gap shrinks slowly

**Likely diagnosis:** overfitting/high variance.

**Interventions:** collect more representative data; add justified weight decay/dropout; reduce complexity; early stop on validation performance; check distribution shift and leakage.

**Reasoning:** training-specific memorization can explain the large generalization gap. More representative data may reduce it, but the curve does not prove overfitting is the only cause.

## Case C: train 85%, validation 91%; both rise slightly

**Possible explanations:** validation data are easier, training-time dropout/augmentation makes training harder, BatchNorm or other training/evaluation differences, or sampling noise.

**Interventions:** measure training accuracy in evaluation mode; compare class/feature distributions; inspect overlap/leakage if suspicious; calculate uncertainty intervals across splits.

**Reasoning:** validation accuracy exceeding training accuracy is not automatically a bug.

## Case D: train 88%, validation 70%; gap persists with 4x data

At least two plausible explanations:
1. **Distribution shift:** the validation population or label relationship differs from training.
2. **Persistent overfitting/spurious features:** the model exploits patterns that do not transfer.
Other possibilities include label noise, preprocessing mismatch, or differing task difficulty.

**Distinguishing experiment:** hold fixed an IID validation set sampled from the training distribution and the original deployment-like validation set. Train at several sample sizes and evaluate on both.

- If IID validation approaches training accuracy but deployment-like validation remains poor, distribution shift is strongly implicated.
- If both validation sets remain far below training, investigate overfitting, label noise, features, and model fit.

Accuracy values alone are suggestive, not definitive; use controlled experiments to identify root causes.
