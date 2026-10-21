# Organizer issue #8: Debugging, Attention Gradients & Evaluation

Source: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8

Status: source requirements, not an implemented solution.

---

Machine Learning Debugging, Gradients & Evaluation

## 🎯 Goal
Investigate failing ML pipelines, implement attention gradients, design realistic evaluation strategies, and diagnose learning curves. Explain your reasoning and supply calculations or code where requested.

---

## 📍 Milestones & Subtasks

### 🧩 Milestone 1 — Debug a Silently Failing Training Run

**Problem:**
A binary classifier on tabular data (10,000 rows) shows steadily falling training loss, but validation accuracy stays near 55% and fluctuates between epochs.

**Provided training code:**
```python
X = StandardScaler().fit_transform(X)
X_tr, X_val = X[:8000], X[8000:]
y_tr, y_val = y[:8000], y[8000:]
np.random.shuffle(X_tr)

model = nn.Sequential(nn.Linear(40, 128), nn.ReLU(), nn.Dropout(0.5),
              nn.BatchNorm1d(128), nn.Linear(128, 2))
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

**Required analysis:**
1. Identify every bug you can find.
2. Explain which symptom each bug causes.
3. Provide corrected code or a description of each fix.
4. Describe quick experiments that would reveal pipeline problems **without access to the code**.

---

### 🧩 Milestone 2 — Derive and Implement a Gradient

**Problem:**
Consider single-head attention:

`S = QKᵀ / √d`  
`P = softmax(S)` (row-wise)  
`O = PV`

**Required analysis and implementation:**
1. Derive `dV`, `dP`, `dS`, `dQ`, and `dK` given upstream gradient `dO`.
2. Implement forward and backward passes in NumPy; verify using numerical gradient checking. State the step size, precision, and acceptance threshold.
3. Identify the forward-pass numerical stability issue and explain its fix.
4. Explain why attention uses the scaling factor `1/√d`.
5. Explain how the backward pass changes with a causal mask.
6. Analyze memory cost as sequence length `n` grows and explain how FlashAttention avoids it.

---

### 🧩 Milestone 3 — Design an Evaluation Strategy

**Scenario:**
Build a card-transaction fraud detector. Fraud accounts for **0.1%** of transactions; chargeback labels arrive **30–60 days** later, and fraud patterns change over time.

**Required analysis:**
1. Identify which model comparison metrics to use and avoid, with justification.
2. Design the train/validation/test split.
3. Explain how to evaluate despite label delays.
4. Choose a cost-based decision threshold where a false negative costs **$200** on average and a false positive costs **$5**. Explain how to assess score calibration.
5. Explain how to detect production drift and determine when to retrain.

---

### 🧩 Milestone 4 — Diagnose Learning Curves

**Problem:**
For each case, diagnose the training behavior, propose interventions, and justify them.

| Case | Train accuracy | Validation accuracy | Behavior as training data grows |
| --- | ---: | ---: | --- |
| A | 62% | 60% | Both stay flat |
| B | 99% | 78% | Validation rises slowly; gap shrinks slowly |
| C | 85% | 91% | Both rise slightly |
| D | 88% | 70% | Gap does not close even with 4× data |

**Required analysis:**
1. Diagnose cases **A, B, and C**.
2. For case **D**, name at least two plausible explanations and describe **one experiment** that distinguishes them.

---

## 📦 Expected Deliverables
A written technical analysis covering all four tasks, along with corrected training code or fixes and a NumPy attention implementation with gradient-check evidence.

