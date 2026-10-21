# Hacktoberfest 3.0 — Solution

Concise answers to the four milestones.

## M1 · Silent training failure
| Bug | Fix |
|---|---|
| Scaler fit before split (leakage) | Split first, fit scaler on train only |
| `np.random.shuffle(X_tr)` desyncs labels | Remove; use `DataLoader(shuffle=True)` on aligned `(X, y)` |
| `scheduler.step()` per batch (LR → 0) | Step once per epoch |
| Dropout before BatchNorm | `Linear → BN → ReLU → Dropout` |
| No `model.eval()` / `no_grad` in validation | Add both |
| Class balance and metrics never checked | Check majority baseline, confusion matrix, precision/recall |

**Quick checks:** majority-class baseline · overfit 100–500 samples · shuffled-label test · 5 seeds.

## M2 · Attention gradients
```
dV = Pᵀ dO
dP = dO Vᵀ
dS = P ⊙ (dP − sum(dP ⊙ P, axis=-1, keepdims=True))
dQ = dS K / √d      dK = dSᵀ Q / √d
```
- **Gradcheck:** ε = 1e-5, float64, pass if rel. error < 1e-6 (observed ≈ 1e-10, causal and non-causal).
- **Stability:** subtract the row max before `exp` (shifted softmax).
- **Why 1/√d:** keeps score variance ≈ 1, so softmax doesn't saturate and gradients don't vanish.
- **Causal mask:** masked `P = 0` ⇒ `dS = 0` there, so no gradient flows to future tokens.
- **Memory:** standard attention stores an n×n matrix (O(n²)); FlashAttention tiles in SRAM with an online softmax, giving exact output in O(n) memory.

## M3 · Fraud detection (0.1% positives)
- **Metrics:** use PR-AUC, precision, recall, F1. Avoid accuracy (99.9% by predicting "legit" always).
- **Split:** chronological train/val/test, with a gap ≥ the 30–60 day chargeback window.
- **Label delay:** evaluate only on matured data; for partial data, scale fraud counts by the historical delay curve. Never treat immature rows as negatives.
- **Threshold:** flag if `p·200 > (1−p)·5` ⇒ **p > 5/205 ≈ 2.44%**. Check calibration with a reliability curve and Brier score; recalibrate (isotonic/Platt) if needed.
- **Drift:** monitor score PSI (<0.1 ok, 0.1–0.25 investigate, >0.25 act) and alert rate. Retrain every 1–3 months or on a trigger.

## M4 · Learning curves
| Case | Diagnosis | Action |
|---|---|---|
| A (62/60, flat) | Underfit (high bias) | Bigger model, less regularization |
| B (99/78, gap slowly closes) | Overfit (high variance) | More data, stronger regularization, early stopping |
| C (85/91) | Healthy; train-time dropout/augmentation | None |
| D (88/70, gap stays at 4× data) | Distribution shift **or** noisy validation labels | Pool, reshuffle, re-split, retrain: gap closes ⇒ shift; gap persists ⇒ label noise |
