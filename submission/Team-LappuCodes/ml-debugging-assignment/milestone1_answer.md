# Milestone 1: Debugging a Binary Classification Pipeline

## 1. Problem Description

The binary classification model is trained on a dataset containing 10,000 rows and 40 input features. During training, the training loss decreases, but validation accuracy remains around 55%.

This indicates that the model may not be generalizing well to unseen data. The problem could be caused by data leakage, incorrect data shuffling, improper model evaluation, or incorrect learning-rate scheduling.

## 2. Identify the Bugs

### Bug 1: Data Leakage During Feature Scaling

**Problem:**

```python
X = StandardScaler().fit_transform(X)
```

The scaler is fitted on the entire dataset before splitting it into training and validation sets. Consequently, information about the validation data influences the scaling parameters.

**Symptom:** Validation performance may be misleading because the validation set has influenced preprocessing.

**Fix:** Split the dataset first. Fit the scaler only on the training data and use the fitted scaler to transform the validation data.

```python
scaler = StandardScaler()
X_tr = scaler.fit_transform(X_tr)
X_val = scaler.transform(X_val)
```

### Bug 2: Potentially Biased Train–Validation Split

**Problem:**

```python
X_tr, X_val = X[:8000], X[8000:]
y_tr, y_val = y[:8000], y[8000:]
```

The dataset is divided according to row order. If the data is sorted by class, time, or another feature, the training and validation sets may have different distributions.

**Symptom:** Validation accuracy may remain low because the validation set does not represent the same distribution as the training set.

**Fix:** Use a randomized, stratified split when the observations are independent and representative. If the data is time-dependent, use a chronological split instead.

### Bug 3: Incorrect Data Shuffling

**Problem:**

```python
np.random.shuffle(X_tr)
```

This operation shuffles only the input features, while `y_tr` remains unchanged. As a result, input samples can become paired with incorrect labels.

**Symptom:** The model learns incorrect input–label relationships, leading to poor validation accuracy even when training loss decreases.

**Fix:** Shuffle the features and labels together, or use a PyTorch `DataLoader` with `shuffle=True` so that each input remains paired with its correct label.

### Bug 4: Incorrect Order of Neural Network Layers

**Problem:**

```python
nn.Linear(40, 128),
nn.ReLU(),
nn.Dropout(0.5),
nn.BatchNorm1d(128),
```

Dropout is applied before batch normalization. This means batch normalization receives randomly zeroed activations, which can make its statistics less representative of the activations seen during evaluation.

**Symptom:** Training may become less stable, and validation performance may suffer.

**Fix:** A common alternative ordering is:

```python
nn.Linear(40, 128),
nn.BatchNorm1d(128),
nn.ReLU(),
nn.Dropout(0.5),
```

The best ordering should be verified experimentally rather than assumed to be universally optimal.

### Bug 5: Missing Evaluation Mode

**Problem:**

```python
val_logits = model(torch.tensor(X_val))
```

The model is not switched to evaluation mode before validation. Therefore, dropout remains active, and batch normalization continues using training-mode behavior.

**Symptom:** Validation predictions may vary between evaluations, making accuracy unreliable.

**Fix:**

```python
model.eval()
```

Call this before validation. Return to `model.train()` at the beginning of the next training epoch.

### Bug 6: Missing Gradient Disabling During Validation

**Problem:**

Validation is performed without disabling gradient calculations.

**Symptom:** Extra computation and memory are used unnecessarily during validation.

**Fix:**

```python
model.eval()
with torch.no_grad():
    val_logits = model(X_val_tensor)
```

This disables gradient tracking during evaluation and improves efficiency.

### Bug 7: Learning-Rate Scheduler Is Stepped Too Frequently

**Problem:**

```python
scheduler.step()
```

The scheduler is called inside the training batch loop. However, `StepLR(step_size=1, gamma=0.9)` is intended to reduce the learning rate after each scheduler step, and conventionally it should be stepped once per epoch in this setup.

**Symptom:** The learning rate decreases after every batch rather than every epoch, potentially becoming extremely small before training finishes.

**Fix:** Move `scheduler.step()` outside the batch loop, to the end of each epoch.

```python
for epoch in range(50):
    model.train()

    for xb, yb in train_loader:
        opt.zero_grad()
        loss = loss_fn(model(xb), yb)
        loss.backward()
        opt.step()

    model.eval()
    with torch.no_grad():
        val_logits = model(X_val_tensor)

    scheduler.step()
```

## 3. Experiments to Verify the Bugs

### Experiment 1: Verify Label Alignment

Train the model using the original shuffling approach and compare it with a version that shuffles input samples and their labels together.

**Expected result:** Correctly aligned labels should improve learning and validation performance if label mismatch was a major problem.

### Experiment 2: Verify the Train–Validation Split and Scaling

Split the data appropriately before fitting the scaler. Compare this with the original preprocessing pipeline.

**Expected result:** The new pipeline should prevent validation information from influencing preprocessing. Validation accuracy may change, although improvement is not guaranteed.

### Experiment 3: Verify Evaluation Mode

Evaluate the same validation set multiple times with `model.train()` and then with `model.eval()`.

**Expected result:** With dropout enabled, training-mode predictions can vary. Evaluation-mode predictions should be consistent for the same input and model parameters.

### Experiment 4: Verify Learning-Rate Scheduling

Print the learning rate after every epoch and compare the original scheduler placement with the corrected placement.

**Expected result:** The corrected version should reduce the learning rate once per epoch, according to the configured schedule.

### Experiment 5: Compare Layer Ordering

Train two otherwise identical models: one with dropout before batch normalization and another with batch normalization before activation and dropout.

**Expected result:** Comparing their training loss and validation accuracy will show whether the layer ordering affects performance on this dataset.

## 4. Expected Symptoms and Corresponding Fixes

| Symptom                                                          | Possible cause                                       | Recommended fix                          |
| ---------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| Training loss decreases but validation accuracy remains near 55% | Incorrect input–label pairing or poor generalization | Fix shuffling and inspect the data split |
| Validation performance is inconsistent                           | Dropout remains active during evaluation             | Use `model.eval()`                       |
| Learning rate becomes too small too quickly                      | Scheduler is stepped after every batch               | Step the scheduler once per epoch        |
| Preprocessing uses information from validation data              | Scaler is fitted before splitting                    | Fit the scaler on training data only     |
| Validation is unnecessarily slow or memory-intensive             | Gradient tracking is enabled                         | Use `torch.no_grad()`                    |

## 5. Conclusion

The pipeline contains multiple implementation issues that can explain its poor validation performance. The most serious issue is shuffling `X_tr` without applying the same permutation to `y_tr`, because this breaks the correspondence between inputs and labels. Fitting the scaler on the complete dataset introduces data leakage, while failing to call `model.eval()` makes validation behavior unreliable. Stepping the learning-rate scheduler after every batch also causes the learning rate to decrease much faster than intended.

The recommended approach is to correct these issues, retrain the model, and compare training and validation metrics across controlled experiments. The actual cause of the approximately 55% validation accuracy should be confirmed through these experiments rather than attributed to a single bug without evidence.
