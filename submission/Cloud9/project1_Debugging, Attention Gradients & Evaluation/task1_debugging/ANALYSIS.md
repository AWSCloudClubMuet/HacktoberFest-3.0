# Task 1: Machine Learning Debugging, Gradients & Evaluation

## Problem Statement
A binary classifier on tabular data (10,000 rows, 40 features) shows steadily falling training loss, but validation accuracy stays near 55% and fluctuates erratically between epochs.

### Original Buggy Code
```python
X = StandardScaler().fit_transform(X)
X_tr, X_val = X[:8000], X[8000:]
y_tr, y_val = y[:8000], y[8000:]
np.random.shuffle(X_tr)

model = nn.Sequential(
    nn.Linear(40, 128),
    nn.ReLU(),
    nn.Dropout(0.5),
    nn.BatchNorm1d(128),
    nn.Linear(128, 2)
)
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
scheduler = torch.optim.lr_scheduler.StepLR(opt, step_size=1, gamma=0.9)

for epoch in range(50):
    model.train()
    for xb, yb in train_loader:
        loss = loss_fn(model(xb), yb)
        opt.zero_grad(); loss.backward(); opt.step()
        scheduler.step()
    val_logits = model(torch.tensor(X_val))
    print(epoch, accuracy(val_logits, y_val))
```

---

## 1. Identified Bugs & Symptoms

### Bug 1: In-Place Independent Feature Shuffling
- **Code:** `np.random.shuffle(X_tr)`
- **Mechanism:** `np.random.shuffle` shuffles the rows of `X_tr` in-place, but `y_tr` remains un-shuffled. This completely destroys the correspondence between feature vectors and target labels.
- **Symptom:** The network trains on randomized label noise. Because deep neural nets have high representational capacity (Zhang et al., *Understanding deep learning requires rethinking generalization*), training loss steadily drops as it memorizes arbitrary noise. However, validation accuracy cannot exceed baseline random guess (~50–55%).

### Bug 2: Missing Evaluation Mode (`model.eval()`) & Inference Scope
- **Code:** `val_logits = model(torch.tensor(X_val))` without calling `model.eval()`.
- **Mechanism:** `nn.Dropout(0.5)` stays active during validation, zeroing out 50% of hidden neurons at random for every inference pass. Simultaneously, `BatchNorm1d` continues computing and updating running mean/variance on the validation slice rather than using frozen population statistics.
- **Symptom:** Validation accuracy fluctuates erratically between consecutive epochs even if model weights have stopped changing significantly.

### Bug 3: Learning Rate Scheduler Stepped per Mini-Batch
- **Code:** `scheduler.step()` inside the `for xb, yb in train_loader:` loop.
- **Mechanism:** `StepLR(step_size=1, gamma=0.9)` is intended to step once per epoch. Stepping it once per batch decays the learning rate by $(0.9)^{\text{num\_batches}}$. For 8,000 samples with batch size 64 (125 batches/epoch), after just 1 epoch the learning rate is multiplied by $0.9^{125} \approx 1.83 \times 10^{-6}$. In epoch 2, it drops below $10^{-12}$, freezing parameter updates completely.
- **Symptom:** The model quickly stops learning after the very first epoch; parameters freeze.

### Bug 4: Data Leakage in Standardization
- **Code:** `X = StandardScaler().fit_transform(X)` before slicing into train/val.
- **Mechanism:** Mean and standard deviation are computed over the entire dataset, leaking validation distribution parameters into the training set.
- **Symptom:** Biased evaluation metrics, failure to generalize properly when evaluated on out-of-distribution test sets.

### Bug 5: Suboptimal Layer Ordering (Dropout before BatchNorm)
- **Code:** `nn.ReLU() -> nn.Dropout(0.5) -> nn.BatchNorm1d(128)`.
- **Mechanism:** Dropout introduces stochastic zeroing of activations, causing shifting variance that interferes with BatchNorm's running variance estimator.
- **Symptom:** Destabilizes batch normalization statistics and causes variance shift between training and test inference.

### Bug 6: Untyped Tensor Creation
- **Code:** `torch.tensor(X_val)`
- **Mechanism:** Inherits `float64` from NumPy, whereas default PyTorch layer weights are `float32`.
- **Symptom:** `RuntimeError: expected scalar type Float but found Double`.

---

## 2. Corrected Code Implementation
See [solution.py](file:///e:/AWS%20HACKATHON/Cloud9/submission/Cloud9/task1_debugging/solution.py) for the complete, executable implementation.

---

## 3. Black-Box Diagnostic Experiments (Zero Code Access)

When only model predictions and validation metrics are accessible without source code, these four tests isolate the root causes:

1. **Repeated Inference Test (Detects Active Dropout / BatchNorm Drift):**
   - *Procedure:* Send the identical validation batch through the inference API multiple times without updating weights.
   - *Observation:* If predictions change between identical calls, stochastic layers (Dropout) are active at inference time.

2. **Label Randomization Baseline Test (Detects Label Decoupling):**
   - *Procedure:* Train a secondary model on deliberately shuffled labels.
   - *Observation:* If the production model's training loss trajectory matches the randomized-label model, the features and labels in the production pipeline were decoupled.

3. **Deterministic Dummy Feature Test (Detects True Signal vs Class Prior):**
   - *Procedure:* Replace all validation features with zeros or Gaussian white noise $\mathcal{N}(0, 1)$ and observe accuracy.
   - *Observation:* If accuracy on pure noise is ~55% (matching the reported validation accuracy), the model has learned no feature patterns and is simply outputting the majority class prior.

4. **Batch Size Sensitivity Test (Detects Premature Scheduler Decay):**
   - *Procedure:* Run with batch size 32 vs 256.
   - *Observation:* Smaller batch sizes induce far more steps per epoch. If training loss immediately plateaus with small batch sizes, an iteration-level scheduler is decaying learning rate too fast.
