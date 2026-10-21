# Machine Learning Debugging, Gradients, and Evaluation

## Overview

This report documents four tasks: debugging a machine-learning training
pipeline, deriving and checking gradients for scaled dot-product
attention, evaluating a rare-event fraud detector, and diagnosing
learning curves.

The Python scripts and individual milestone answers are supporting
artifacts:

-   `milestone1_debugging.py`
-   `milestone1_answer.md`
-   `milestone2_attention.py`
-   `milestone2_answer.md`
-   `milestone3_fraud_detection.py`
-   `milestone3_answer.md`
-   `milestone4_learning_curves.py`
-   `milestone4_answer.md`
-   `milestone4_graphs/`
-   `requirements.txt`

**Reproducibility note:** The fraud-detection experiment uses synthetic
data, and the learning-curve graphs are illustrative simulations. These
results demonstrate methods and reasoning; they are not evidence of
real-world fraud performance or a trained model's empirical learning
curves.

------------------------------------------------------------------------

# Milestone 1: Debugging the Machine-Learning Pipeline

## 1. Main debugging principles

A training pipeline can produce misleadingly strong or weak results when
data preparation, labels, splitting, or evaluation are incorrect.
Debugging should begin with simple checks that isolate the data path
before changing model architecture or hyperparameters.

### A. Features and labels must stay aligned

**Potential bug:** Features `X` and labels `y` are shuffled
independently, or only `X` is shuffled.

**Why it matters:** Each feature row must remain paired with its
original label. If the rows are shuffled separately, the model learns
from incorrect feature-label pairs. Training can become unstable or
appear to perform near chance even when the model is capable of
learning.

**Fix:** Shuffle a shared index or use a single dataset/DataLoader
operation that preserves each `(X[i], y[i])` pair. For example:

``` python
indices = np.random.permutation(len(X))
X_shuffled = X[indices]
y_shuffled = y[indices]
```

An even simpler check is to disable shuffling and verify that a tiny,
clean dataset can be overfit. If it cannot, investigate data alignment,
loss calculation, gradients, and the model's forward pass.

### B. Fit preprocessing only on training data

**Potential bug:** A scaler or other preprocessing transform is fitted
on the full dataset before the train/validation/test split.

**Why it matters:** The transform then uses information from validation
or test data. This is data leakage and can make evaluation results too
optimistic.

**Fix:** Split the data first, fit preprocessing on the training
partition only, and apply the fitted transform to validation and test
data.

``` python
scaler.fit(X_train)
X_train_scaled = scaler.transform(X_train)
X_val_scaled = scaler.transform(X_val)
X_test_scaled = scaler.transform(X_test)
```

For time-dependent data, the split should respect time order rather than
randomly mixing past and future examples.

### C. Check the split strategy

**Potential bug:** Random splitting is used for a time-dependent task,
or related/duplicate observations appear across partitions.

**Why it matters:** Future information or near-duplicate examples can
leak into training and inflate test performance.

**Fix:** Use a chronological split when deployment predicts future
events. Check for duplicate records and ensure that the test set
represents a later period than the training set.

### D. Use the correct evaluation mode

For PyTorch models, evaluation should use `model.eval()` and inference
should generally run inside `torch.no_grad()`.

``` python
model.eval()
with torch.no_grad():
    predictions = model(X_val)
```

`model.eval()` changes the behavior of layers such as dropout and batch
normalization. `torch.no_grad()` avoids tracking gradients during
evaluation. Forgetting these can make evaluation inconsistent or
unnecessarily expensive.

### E. Check optimizer and scheduler timing

Learning-rate schedulers must be stepped at the cadence required by
their design. For schedulers intended to step once per epoch, call
`scheduler.step()` after the epoch's training updates (and follow the
specific scheduler's documented ordering). Log the learning rate so that
an unexpected schedule is visible.

### F. Verify model and loss compatibility

Check that the final layer, activation, target format, and loss function
are compatible. For example, `CrossEntropyLoss` expects unnormalized
class logits and integer class labels; applying softmax before it is
unnecessary and can cause numerical or optimization problems. For binary
classification, `BCEWithLogitsLoss` is typically used with raw logits
and floating-point binary targets.

The exact diagnosis depends on the supplied code. If a DataLoader or
training-loop detail is not present in the snippet, it should be treated
as a hypothesis to test rather than a confirmed bug.

## 2. Practical debugging experiments

1.  **Inspect a few examples:** Print feature rows, labels, shapes, data
    types, and class counts.
2.  **Check pairing:** Apply one permutation to both `X` and `y`, then
    verify that each row retains its label.
3.  **Overfit a tiny subset:** Train on a very small clean subset. A
    sufficiently expressive model should generally be able to fit it.
    Failure suggests a pipeline, loss, gradient, or optimization issue.
4.  **Establish a baseline:** Compare against a simple majority-class or
    simple linear baseline.
5.  **Check leakage:** Confirm that preprocessing is fitted on training
    data only and that the test set is not used for model or threshold
    selection.
6.  **Make evaluation deterministic where appropriate:** Use evaluation
    mode, disable gradient tracking, and control random seeds when
    diagnosing reproducibility.

## 3. Interpretation and limitations

The accompanying `milestone1_debugging.py` script is a synthetic
demonstration of a corrected workflow. Its high validation accuracy is
not, by itself, proof that every suspected issue in the original
pipeline was present or fixed. The strongest evidence comes from
isolating each bug with a targeted experiment and comparing behavior
before and after the correction.

------------------------------------------------------------------------

# Milestone 2: Scaled Dot-Product Attention and Gradient Checking

## 1. Forward pass

For a single attention head, let:

-   (Q `\in `{=tex}`\mathbb{R}`{=tex}\^{n_q `\times `{=tex}d}) be the
    query matrix,
-   (K `\in `{=tex}`\mathbb{R}`{=tex}\^{n_k `\times `{=tex}d}) be the
    key matrix,
-   (V `\in `{=tex}`\mathbb{R}`{=tex}\^{n_k `\times `{=tex}d_v}) be the
    value matrix.

The scaled score matrix is

\[ S = `\frac{QK^\top}{\sqrt{d}}`{=tex}. \]

Apply softmax row-wise to obtain attention weights:

\[ P = `\operatorname{softmax}`{=tex}(S). \]

The output is

\[ O = PV. \]

Scaling by (1/`\sqrt{d}`{=tex}) helps keep dot-product magnitudes from
growing too large as the key/query dimension increases. Without scaling,
softmax can become saturated, which may lead to very small gradients.

## 2. Backward-pass derivation

Let (L) be a scalar loss and let (G =
`\partial `{=tex}L/`\partial `{=tex}O) be the upstream gradient.

### Gradient with respect to values

Since (O=PV),

\[ `\frac{\partial L}{\partial V}`{=tex}=P\^`\top `{=tex}G. \]

### Gradient with respect to attention weights

\[ `\frac{\partial L}{\partial P}`{=tex}=GV\^`\top`{=tex}. \]

Define (D_P = GV\^`\top`{=tex}).

### Gradient through row-wise softmax

For each row (i), the softmax Jacobian gives

\[ `\frac{\partial L}{\partial S_{ij}}`{=tex}
=P\_{ij}`\left`{=tex}(D\_{P,ij}-`\sum`{=tex}*k
P*{ik}D\_{P,ik}`\right`{=tex}). \]

In vectorized form,

\[
D_S=P`\odot`{=tex}`\left`{=tex}(D_P-`\operatorname{sum}`{=tex}(D_P`\odot `{=tex}P,`\text{ axis}`{=tex}=-1,`\text{ keepdims=True}`{=tex})`\right`{=tex}).
\]

Here, (`\odot`{=tex}) denotes elementwise multiplication.

### Gradients with respect to queries and keys

Because (S=QK\^`\top`{=tex}/`\sqrt `{=tex}d),

\[ `\frac{\partial L}{\partial Q}`{=tex}=`\frac{D_SK}{\sqrt d}`{=tex},
`\qquad`{=tex}
`\frac{\partial L}{\partial K}`{=tex}=`\frac{D_S^\top Q}{\sqrt d}`{=tex}.
\]

These equations are implemented in the accompanying NumPy script
`milestone2_attention.py`.

## 3. Numerical gradient-check configuration

The analytical backward pass is checked against central finite
differences. For a parameter element (`\theta`{=tex}\_i), the numerical
estimate is

\[ `\frac{\partial L}{\partial \theta_i}`{=tex} `\approx`{=tex}
`\frac{L(\theta_i+\epsilon)-L(\theta_i-\epsilon)}{2\epsilon}`{=tex}. \]

The report configuration is:

-   **Finite-difference method:** Central finite differences.
-   **Finite-difference step size:** (`\epsilon `{=tex}= 10\^{-6}).
-   **Numerical precision:** `float64`.
-   **Acceptance threshold:** Relative error less than (10\^{-5}).

These values should match the constants and comparison in
`milestone2_attention.py`.

### Recorded gradient-check results

  Gradient                       Relative error Result
  ---------- ---------------------------------- --------
  (dQ)         (3.847 `\times 10`{=tex}\^{-10}) Pass
  (dK)          (8.348 `\times 10`{=tex}\^{-9}) Pass
  (dV)         (5.847 `\times 10`{=tex}\^{-11}) Pass

All three reported relative errors are below (10\^{-5}), consistent with
the script output: **"All attention gradient checks passed!"**

Finite-difference checks are sensitive to precision, step size, and the
scale of the values. Double precision is useful because the
finite-difference calculation subtracts nearby loss values. The check
should use a scalar objective such as the sum of elementwise products
between the output and a fixed upstream gradient.

## 4. Numerical stability

A stable softmax subtracts the maximum score from each row before
exponentiation:

\[ `\operatorname{softmax}`{=tex}(s_i)=
`\frac{\exp(s_i-\max_j s_j)}`{=tex}
{`\sum`{=tex}\_j`\exp`{=tex}(s_j-`\max`{=tex}\_k s_k)}. \]

Subtracting the row maximum does not change the mathematical softmax
result, but it reduces the risk of overflow. Implementations should also
avoid unnecessary low-precision intermediate operations when numerical
stability is important.

## 5. Causal masking

In autoregressive attention, a query at position (i) must not attend to
future positions (j\>i). Before softmax, future score entries are masked
by replacing them with a very negative value (conceptually
(-`\infty`{=tex})). After softmax, those positions receive zero
attention probability.

The mask must be broadcast with the correct dimensions, and each query
row must retain at least one valid key; otherwise, a row consisting
entirely of masked scores can cause undefined softmax behavior.

## 6. Memory complexity and FlashAttention

A conventional implementation materializes the score and attention
matrices, each of which has size proportional to (n_q n_k). For
self-attention with sequence length (n), this creates quadratic memory
usage in sequence length, in addition to the storage needed for Q, K, V,
and the output.

FlashAttention reduces high-bandwidth-memory traffic by computing
attention in tiles and using on-chip memory more efficiently. It avoids
storing the full attention matrix in high-bandwidth memory and uses a
numerically stable online softmax computation. The mathematical
attention result is preserved up to floating-point rounding, while
memory traffic and memory requirements can be substantially reduced for
long sequences.

------------------------------------------------------------------------

# Milestone 3: Fraud Detection Under Extreme Class Imbalance

## 1. Why accuracy is misleading

Fraud is rare in the supplied synthetic experiment, with overall
prevalence of approximately **0.1%**. If 99.9% of transactions are
legitimate, a classifier that predicts every transaction as legitimate
can achieve about 99.9% accuracy while detecting no fraud.

Therefore, accuracy should not be the primary model-selection metric.
Evaluation should emphasize precision-recall behavior, fraud recall,
false-positive burden, calibration, and the financial consequences of
decisions.

## 2. Chronological data splitting and leakage prevention

The example script uses 20,000 synthetic transactions and splits them
chronologically into:

-   Training: 12,000 transactions
-   Validation: 4,000 transactions
-   Test: 4,000 transactions

The scaler is fitted on the training partition and applied to the later
partitions. The validation set is used to select a decision threshold;
the test set is held back for final evaluation.

A production system should preserve this separation using real
transaction timestamps. It should also account for label delays: a
transaction should not be counted as a confirmed negative simply because
a fraud report has not arrived yet.

## 3. Metrics

-   **Precision:** (TP/(TP+FP)). Of the transactions flagged as fraud,
    how many were fraud?
-   **Recall:** (TP/(TP+FN)). Of the actual fraud cases, how many were
    detected?
-   **PR-AUC / average precision:** Summarizes precision-recall
    performance across thresholds and is useful for rare positive
    classes.
-   **Confusion matrix:** Reports true positives, false positives, false
    negatives, and true negatives at the selected threshold.
-   **Calibration metrics:** Brier score and log loss assess the quality
    of predicted probabilities, not just the final classifications.
-   **Financial cost:** Weighs false negatives and false positives
    according to their estimated business impact.

ROC-AUC may still provide information, but precision-recall metrics are
often more informative when positive examples are extremely rare.

## 4. Cost-sensitive threshold selection

The assignment specifies a cost of \$200 per false negative and \$5 per
false positive. At a selected threshold, estimated total cost is

\[ C = 200,FN + 5,FP. \]

The threshold should be selected using validation data, not the test
set. A practical method is to evaluate candidate thresholds and choose
the one minimizing validation cost, subject to any operational
constraints on review capacity, precision, or recall.

If probabilities are calibrated and the only choices are to flag or not
flag a transaction, then the expected cost of flagging a transaction
with fraud probability (p) is (5(1-p)), while the expected cost of not
flagging it is (200p). Flagging is preferred when

\[ 5(1-p) \< 200p `\quad`{=tex}`\Longrightarrow`{=tex}`\quad`{=tex} p \>
`\frac{5}{205}`{=tex}`\approx 0.02439`{=tex}. \]

Thus, the theoretical cost-based threshold is about **2.44%** under
these assumptions. The empirically selected validation threshold can
differ because of imperfect calibration, model limitations, discrete
validation outcomes, and operational constraints. The test set must not
be used to tune this threshold.

## 5. Recorded synthetic evaluation

The example run reported:

  Measure                             Recorded result
  --------------------------------- -----------------
  Overall fraud prevalence                     0.100%
  Training transactions                        12,000
  Validation transactions                       4,000
  Test transactions                             4,000
  Validation-selected threshold                  0.12
  Test PR-AUC / average precision              0.6877
  Test precision                               0.2143
  Test recall                                  0.7500
  True positives                                    3
  False positives                                  11
  False negatives                                   1
  True negatives                                3,985
  Test cost                                     \$255

These values are from a synthetic demonstration. There are very few
positive cases, so metrics such as precision and recall can change
sharply when a single example changes. The results should be interpreted
as an illustration of the evaluation workflow, not as evidence of
production performance.

## 6. Calibration

A fraud model's predicted probabilities should be checked against
observed fraud rates. A **reliability diagram** groups predictions into
probability bins and plots average predicted probability against the
observed positive fraction in each bin. A well-calibrated model has
predicted probabilities that agree with observed frequencies, although
the result depends on binning and the amount of data in each bin.

The **Brier score** is the mean squared difference between predicted
probabilities and binary outcomes. **Log loss** penalizes incorrect
probability estimates, especially confident incorrect predictions. Lower
values generally indicate better probability estimates when comparing
models on the same evaluation set.

Calibration should be measured on a separate, later dataset with
sufficiently mature labels. If a model is poorly calibrated, possible
remedies include Platt/sigmoid calibration or isotonic regression fitted
on held-out calibration data. Calibration must not be fitted on the
final test set.

## 7. Delayed labels and label maturity

Fraud labels may take 30--60 days to become reliable because
chargebacks, customer disputes, and investigations take time. Recent
transactions whose outcomes are unresolved should be treated as
**pending**, not automatically as legitimate.

A robust evaluation process should:

1.  Define a label-maturity window based on the actual reporting
    process.
2.  Evaluate only transactions whose outcome window has sufficiently
    matured.
3.  Track the proportion of labels that remain pending and how long
    labels take to arrive.
4.  Recompute metrics as later fraud confirmations become available.
5.  Avoid comparing cohorts with very different label maturity without
    accounting for the difference.

The exact maturity rule should reflect the business's real chargeback
and investigation process rather than assuming that every label is final
after a fixed number of days.

## 8. Drift monitoring and retraining

Monitor feature distributions, transaction volumes, fraud prevalence,
precision, recall, PR-AUC, calibration, false-positive burden, and total
decision cost over time. Because labels arrive late, distinguish
immediately observable data drift from delayed, label-based performance
drift.

Retraining may be warranted when sustained drift or deteriorating
mature-label performance is observed. Use recent data with reliable
labels, preserve chronological validation, compare the candidate model
against the current model, and evaluate the candidate on a later holdout
period before deployment. Track the model version, training window,
threshold, calibration procedure, and evaluation date.

## 9. Limitations

The accompanying fraud script uses synthetic data. It demonstrates class
imbalance, chronological splitting, training-only preprocessing,
validation threshold selection, and cost calculation. It does **not**
reproduce a real production label-delay process or realistic evolving
fraud patterns. Those require timestamped real-world data and explicit
label-maturity logic.

------------------------------------------------------------------------

# Milestone 4: Diagnosing Learning Curves

Learning curves should be interpreted by comparing training performance
with validation performance over epochs. The direction of the metric
matters: for loss, lower is better; for accuracy, higher is better. The
exact diagnosis also depends on the task, data quality, model capacity,
and whether training and validation sets are drawn from comparable
distributions.

## Curve A: Underfitting / high bias

**Typical pattern:** Training and validation performance are both poor,
or both losses remain high and close together.

**Interpretation:** The model may be too simple, insufficiently trained,
overly regularized, or unable to represent the underlying relationship.

**Possible interventions:**

-   Increase model capacity when appropriate.
-   Train longer if both curves are still improving.
-   Reduce excessive regularization.
-   Improve informative features or the input representation.
-   Verify that the optimization procedure and learning rate allow
    learning.

Do not increase model complexity automatically; first rule out data and
implementation bugs.

## Curve B: Overfitting / high variance

**Typical pattern:** Training performance continues to improve, while
validation performance stops improving or deteriorates. The gap between
training and validation grows.

**Interpretation:** The model is fitting training-specific patterns that
do not generalize.

**Possible interventions:**

-   Use early stopping based on validation performance.
-   Increase regularization or use dropout when appropriate.
-   Add more representative training data or data augmentation where
    valid.
-   Reduce model capacity.
-   Check for train/validation distribution mismatch and leakage.

Choose the intervention based on evidence rather than applying every
technique at once.

## Curve C: Healthy generalization, with checks

**Typical pattern:** Training and validation performance improve and
remain reasonably close, with no sustained widening gap.

**Interpretation:** This can indicate that the model is learning useful
patterns and generalizing. Small differences between curves are normal.

**Checks to perform:**

-   Confirm that training and validation data are prepared consistently.
-   Verify that validation data are not used for gradient updates.
-   Check that evaluation mode is used correctly.
-   Confirm that the split reflects the intended deployment setting.
-   Watch for leakage, duplicates, and changes in the class
    distribution.

A visually healthy curve is encouraging, but it does not replace
evaluation on a truly held-out test set.

## Curve D: Persistent gap or unusual behavior --- two hypotheses

Two plausible explanations for a persistent training-validation gap are:

1.  **Overfitting / high variance:** The model learns patterns specific
    to the training data and fails to generalize.
2.  **Distribution mismatch or a data-pipeline problem:** The validation
    set may differ from the training set, or preprocessing, labels, or
    evaluation mode may be inconsistent.

Other causes can include label noise, an unrepresentative validation
set, or an implementation error, so the curve alone is not sufficient to
establish a cause.

### Experiment to distinguish the hypotheses

Create a small validation subset sampled from the same source and
distribution as the training data, ensuring that it remains separate
from gradient updates. Compare performance on this subset with
performance on the original validation set.

-   If performance is much better on the same-distribution subset but
    poor on the original validation set, this supports distribution
    mismatch as a major contributor.
-   If the gap persists even on the same-distribution subset,
    overfitting or another pipeline/model issue becomes more plausible.

Then test regularization or early stopping as a controlled follow-up. If
these reduce the gap and improve held-out performance, that supports the
overfitting hypothesis. Keep the data split fixed during comparisons so
that the intervention can be interpreted.

## Graphs and evidence

The script `milestone4_learning_curves.py` creates illustrative
learning-curve plots in `milestone4_graphs/`. These graphs demonstrate
common patterns; they are simulated curves, not measurements from
training an actual model. Any conclusions should be presented as pattern
diagnosis, not empirical claims about a specific trained model.

------------------------------------------------------------------------

# Final Reproducibility and Submission Checklist

Before submitting:

-   [ ] Confirm all four individual milestone answer files are present.
-   [ ] Confirm the four Python scripts are present.
-   [ ] Confirm `requirements.txt` is present.
-   [ ] Confirm the `milestone4_graphs/` folder contains the generated
    images.
-   [ ] Run `python milestone1_debugging.py` and verify it completes.
-   [ ] Run `python milestone2_attention.py` and verify all gradient
    checks pass.
-   [ ] Run `python milestone3_fraud_detection.py` and verify it
    completes.
-   [ ] Run `python milestone4_learning_curves.py` and verify it
    completes and generates the graphs.
-   [ ] Ensure the finite-difference step size, `float64` precision, and
    acceptance threshold in this report match the actual constants and
    comparison in `milestone2_attention.py`.
-   [ ] Ensure all reported numerical outputs match the latest script
    runs.
-   [ ] Keep synthetic and illustrative results clearly identified as
    such.

## Conclusion

The key lessons are to preserve feature-label alignment, prevent
preprocessing leakage, use a time-appropriate evaluation strategy,
verify analytical gradients numerically, evaluate rare-event classifiers
with precision-recall and cost-sensitive metrics, account for delayed
labels, monitor calibration and drift, and diagnose learning curves
through targeted experiments rather than visual pattern matching alone.
