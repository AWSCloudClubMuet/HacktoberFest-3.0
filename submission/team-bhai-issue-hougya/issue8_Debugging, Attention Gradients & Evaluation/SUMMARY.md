# Summary: Problems and Solutions

A quick overview of all four milestones: each problem, what I found, and the fix. Full reasoning, derivations and code output are in [ANALYSIS.md](ANALYSIS.md). Section numbers below point there.

---

## Milestone 1: Debugging a silently failing training run

**Symptom:** training loss falls, but validation accuracy sits near 55% and jumps around between epochs.

| # | Bug | What it causes | Fix |
|---|-----|----------------|-----|
| 1 | `np.random.shuffle(X_tr)` shuffles features but not labels | Model trains on random labels: train loss falls, val stays at chance | Shuffle X and y together (`DataLoader(shuffle=True)`) |
| 2 | Validation runs in train mode, no `no_grad()` | Dropout and batch statistics make val accuracy noisy; BN stats absorb val data | `model.eval()` + `torch.no_grad()` for validation |
| 3 | `scheduler.step()` inside the batch loop | LR shrinks 0.9× per batch, about 1.9e-9 after one epoch (batch 64), so training stalls | Call `scheduler.step()` once per epoch |
| 4 | `torch.tensor(X_val)` is float64 | Crash: dtype mismatch with float32 weights | `dtype=torch.float32` for features, `torch.long` for labels |
| 5 | Scaler fit on all data before the split | Validation statistics leak into training | Split first, fit the scaler on train only |
| 6 | First 8,000 rows used for training | Distribution shift if the file is sorted | Shuffled, stratified split |
| 7 | Dropout before BatchNorm | BN learns a variance that changes at eval time | Linear → BatchNorm → ReLU → Dropout |

- **Main causes of the symptom:** bug 1 explains the 55% plateau with falling loss, bug 2 the fluctuation, and bug 3 the stalled training. Bug 3 actually conflicts with "steadily falling loss", which I discuss in Section 1.3.
- **Corrected code:** `m1_train_fixed.py` (Section 1.9). It fixes all seven bugs and adds early stopping on val loss. On stand-in data it reaches **95.4%** validation accuracy at the restored best checkpoint.
- **Finding bugs without the code (Section 1.10):**
  - overfit a single batch;
  - evaluate the same checkpoint twice;
  - retrain with shuffled labels;
  - compare against majority-class and logistic-regression baselines;
  - evaluate on the training data in eval mode;
  - train a classifier to tell train rows from val rows;
  - compare val accuracy in train() and eval() mode;
  - log the LR at every step.

---

## Milestone 2: Attention gradients

**Gradients** (derived in Section 2.1):

```
dV = Pᵀ dO
dP = dO Vᵀ
D  = rowsum(P ⊙ dP)  (= rowsum(dO ⊙ O))
dS = P ⊙ (dP − D)
dQ = dS K / √d
dK = dSᵀ Q / √d
```

| Topic | Problem | Solution and evidence |
|-------|---------|-----------------------|
| Gradient check (2.3) | Prove the backward pass is right | Central differences in **float64**, step **h = 1e-6** (near the optimum ε^(1/3) ≈ 6e-6), relative-error **PASS < 1e-7**. All float64 checks pass, the worst at 1.6e-8. float32 fails (0.13 to 0.45), which shows why float64 is needed. |
| Stability (2.4) | `exp(1000)` overflows → NaN | Subtract the row max before exp. The naive version gives `[nan nan nan]` and the stable one gives the correct answer. |
| 1/√d scaling (2.5) | Var(q·k) = d, so the softmax saturates and gradients vanish | Divide by √d to keep the logit std at 1. Unscaled at d = 1024: the largest weight in each row reaches 0.95 and ‖dS‖ drops from 29 to 8.5. Scaled: both stay flat. |
| Causal mask (2.6) | How does backward change? | It doesn't. Masking before the softmax gives P = 0, so dS = 0 there automatically. Checks: dQ[0] = 0 exactly, future tokens have zero effect, dS = 0 at all masked positions. |
| Memory (2.7) | S and P are n × n per head: 16 GiB in fp32 at n = 64k | FlashAttention processes Q, K and V in tiles with an online softmax and keeps only O plus one logsumexp per row, which is O(n). In backward it uses D = rowsum(dO ⊙ O). My tiled forward matches the standard one to within 1e-15. |

---

## Milestone 3: Fraud detection evaluation

Fraud is 0.1% of transactions, labels arrive 30 to 60 days late, and patterns change over time.

| Question | Answer |
|----------|--------|
| Metrics (3.1) | **Use:** PR-AUC, recall at a fixed alert budget, expected dollar cost, and bootstrap confidence intervals. **Avoid:** accuracy (99.9% by predicting "never fraud"). **Don't rely on:** ROC-AUC, where a 1% false-positive rate can still mean 93 of every 100 blocks are innocent customers. |
| Split (3.2) | By time, not randomly. Train on Jan to Dec 2025, leave a 2-month gap for labels to arrive, validate on Mar to Apr 2026, test on May to Jun 2026. Use a rolling backtest, features built only from the past, and downsampling only in training. |
| Label delays (3.3) | Official metrics only on data at least 60 days old. Meanwhile use faster signals (complaints, analyst reviews), use those early labels to tune and check the anomaly detector (as early estimates only), estimate the missing labels from historical chargeback timing, monitor without labels, and review a sample of blocked transactions. |
| Threshold (3.4) | Block when p × $200 > (1 − p) × $5, which gives **p > 2.44%**. Check calibration with a reliability diagram (equal-size groups, focusing on the region around 2.44%) and fix it with isotonic or Platt scaling. Correct for downsampling. |
| Drift (3.5) | Score distribution (PSI), alert rate and an anomaly detector act as early warnings. Precision and recall on matured labels confirm a real problem. Retrain monthly, or earlier if performance drops, and run the new model in shadow mode before switching. |

---

## Milestone 4: Learning curves

| Case | Train / Val | Diagnosis | What I'd do |
|------|-------------|-----------|-------------|
| A | 62% / 60%, both flat | Underfitting (high bias) | Bigger model, better features, less regularization |
| B | 99% / 78%, gap shrinks slowly | Overfitting (high variance) | Regularization, augmentation, early stopping, smaller model, and more data |
| C | 85% / 91% | Suspicious: val above train | Re-measure train accuracy in eval mode, check for leakage and duplicates, and check whether val is easier or small |
| D | 88% / 70%, gap stays with 4× data | Not a data-quantity problem | See below |

**Case D:** two explanations, and one experiment that separates them.
- **Distribution shift:** train and val come from different sources.
- **Noisy labels:** the labels are wrong in both sets.
- **Experiment:** pool train and val, re-split them randomly, and retrain. If the gap closes, it was distribution shift. If it stays, it is label noise.

---

## Files

| File | What it is |
|------|------------|
| `ANALYSIS.md` | Full write-up for all four milestones |
| `m1_train_fixed.py` | Corrected Milestone 1 training script |
| `attention.py` | NumPy attention: forward, backward, causal mask, tiled forward |
| `gradcheck.py` | Gradient checks and the step-size sweep (writes `h_sweep.png`) |
| `experiments.py` | Stability, 1/√d, causal mask, memory and tiled-forward experiments |

Install the dependencies with `pip install -r requirements.txt`, then run `python gradcheck.py`, `python experiments.py` and `python m1_train_fixed.py`. Seeds are fixed, so the numbers match `ANALYSIS.md`.
