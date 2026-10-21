# Milestone 2: Derive and Implement a Gradient (Single-Head Attention)

**Setup:** `S = QKᵀ/√d`, `P = softmax(S)` (row-wise), `O = PV`. We are given the upstream gradient `dO` and must find `dV, dP, dS, dQ, dK`.

---

## 1. Derivation

Work backwards through the three steps of the forward pass.

**Step 1: `O = PV`**
- Each output row is a weighted mix of the rows of `V`, so
  - **`dV = Pᵀ · dO`**
  - **`dP = dO · Vᵀ`**

**Step 2: `P = softmax(S)` (row-wise)**
- Every softmax output in a row depends on every input in that row, so the gradient is not just element-wise. Working out the softmax Jacobian gives:
  - **`dS_ij = P_ij · ( dP_ij − Σ_k P_ik · dP_ik )`**
  - In matrix form: **`dS = P ∘ ( dP − rowsum(dP ∘ P) )`** (∘ = element-wise multiply).
- Handy shortcut used by FlashAttention: `Σ_k P_ik · dP_ik = Σ_j dO_ij · O_ij`, so the row term can be computed from `dO` and `O` alone, without storing `P`.

**Step 3: `S = QKᵀ/√d`**
- **`dQ = dS · K / √d`**
- **`dK = dSᵀ · Q / √d`**

---

## 2. Implementation and numerical gradient check

The forward and backward passes are implemented in plain NumPy (see the accompanying script). To check them, the analytic gradients are compared with numerical gradients computed by **central differences**: `(f(x+h) − f(x−h)) / 2h`.

**Settings:**

| Setting | Value |
|---|---|
| Step size `h` | `1e-6` |
| Precision | `float64` (machine epsilon ≈ 2.2e-16) |
| Error measure | relative error = `‖g_num − g_ana‖ / (‖g_num‖ + ‖g_ana‖)` |
| Acceptance threshold | relative error `< 1e-6` |

**Results:**

```
== Gradient check (float64, central difference) ==
step size h = 1e-06, precision = float64 (eps_mach 2.2e-16), accept if relative error < 1e-06
relative error = ||g_num - g_ana|| / (||g_num|| + ||g_ana||)
  causal=False {'dQ': '1.90e-10', 'dK': '4.07e-10', 'dV': '9.05e-11'} PASS
  causal=True  {'dQ': '2.37e-10', 'dK': '3.19e-10', 'dV': '1.06e-10'} PASS
  worst rel. error over 40 random configs: 1.85e-09
```

**Conclusion:** every error is about 1e-10 to 1e-9, which is roughly 1000× smaller than the 1e-6 threshold. This held across 40 random configurations, with and without the causal mask, so the gradients are correct.

---

## 3. Numerical stability problem and fix

**Problem:** softmax uses `exp(S)`, which overflows when scores are large. Then the result is `inf / inf = NaN`.

**Fix:** subtract the row maximum before `exp`: `softmax(S) = exp(S − max) / Σ exp(S − max)`. The answer is mathematically identical (the subtracted number cancels between top and bottom), but the largest value becomes `exp(0) = 1`, so nothing overflows.

```
== Stability issue: naive softmax overflow ==
naive softmax of logits ~800   -> [nan nan nan nan nan] (inf/inf = NaN)
stable softmax (subtract max)  -> [0.065 0.018 0.856 0.059 0.002]  row sum = 1.0000000000000002
float32 naive at logits ~100   -> [nan nan nan nan nan] (overflows already at ~88.7)
```

In float32 the problem starts much earlier (about 88.7), which matters because deep-learning models often run in lower precision.

---

## 4. Why scale by `1/√d`

If the entries of `q` and `k` are independent with mean 0 and variance 1, then the dot product `q·k` is a sum of `d` terms and has **variance `d`**. Without scaling, scores get bigger as `d` grows. Large scores make softmax almost one-hot (one weight near 1, others near 0). A saturated softmax has an almost-zero gradient, so learning stalls. Dividing by `√d` brings the variance back to about 1. (This argument assumes the unit-variance, independent-entries setting; the experiment below confirms it.)

```
     d |  Var(q.k) unscaled |  Var scaled | max P unscaled | max P scaled | mean |dS| unscaled |   scaled
    16 |               16.1 |        1.01 |          0.585 |        0.111 |            0.00789 |  0.01215
    64 |               63.4 |        0.99 |          0.791 |        0.106 |            0.00453 |  0.01218
   256 |              255.8 |        1.00 |          0.895 |        0.108 |            0.00233 |  0.01219
  1024 |             1031.4 |        1.01 |          0.947 |        0.106 |            0.00121 |  0.01214
```

**How to read it:**
- **Variance:** unscaled variance tracks `d` (16 → 1031). Scaled stays at about 1.
- **Max attention weight:** unscaled climbs toward 1 (0.585 → 0.947), meaning the softmax is saturating. Scaled stays flat at about 0.11.
- **Gradient size `|dS|`:** unscaled shrinks as `d` grows (0.0079 → 0.0012), which is the vanishing-gradient effect. Scaled stays constant at about 0.0122.

---

## 5. How the backward pass changes with a causal mask

- **Forward:** set `S_ij = −∞` for future positions (`j > i`). After softmax, `P_ij = 0` there.
- **Backward:** **the formulas do not change.** Since `P = 0` at masked positions, `dS = P ∘ (…)` is automatically `0` there, so no gradient flows to or from future tokens.
- **Implementation note:** the mask must be applied together with the max-subtraction trick. Each row keeps its diagonal entry, so no row is fully masked.

**Evidence:**

```
== Causal mask check: masked entries get exactly zero gradient & no future leakage ==
  loss on output row 2 -> dK/dV rows 3..6 are exactly zero: True | dQ rows !=2 zero: True
```

A loss placed only on output row 2 sends exactly zero gradient to the keys and values of the future positions (rows 3–6), and exactly zero gradient to the other query rows. The gradient check above also passes with `causal=True`.

---

## 6. Memory cost and how FlashAttention avoids it

**The problem:** standard attention builds `n × n` matrices (`S`, `P`, and in the backward pass `dP`, `dS`), so memory grows as **O(n²)**. Doubling the sequence length makes it 4× larger.

```
== Memory vs sequence length (per head, per batch element) ==
       n |  P (fp16) per head |   P+S+dP+dS fp32 /head |  Flash extras (L,m,l) fp32
    1024 |            2.0 MiB |               16.0 MiB |                    0.0 MiB
    4096 |           32.0 MiB |              256.0 MiB |                    0.0 MiB
   16384 |          512.0 MiB |                4.0 GiB |                    0.2 MiB
   65536 |            8.0 GiB |               64.0 GiB |                    0.8 MiB
  131072 |           32.0 GiB |              256.0 GiB |                    1.5 MiB
```

(This table counts only the attention matrices, not `Q, K, V, O`, which are O(n·d).) At `n = 131072` the standard method needs 256 GiB per head, which is impossible, while the FlashAttention extras are about 1.5 MiB.

**How FlashAttention avoids the `n × n` matrix:**
1. **Tiling:** split `Q, K, V` into small blocks that fit in fast on-chip memory, and process one block pair at a time.
2. **Online softmax:** keep a running row maximum `m` and running sum `l`, and rescale earlier partial results as new blocks arrive. This gives the exact same softmax without ever holding a full row of scores.
3. **Save only small statistics:** store `O` plus one number per row (the log-sum-exp `L`), which is O(n) memory.
4. **Recompute in the backward pass:** rebuild each block of `S` and `P` from `Q, K` and `L`, instead of reading a stored `n × n` matrix.

**Result:** extra memory is **O(n)** instead of **O(n²)**. The amount of computation is still O(n²·d), but it runs faster because far less data moves between slow and fast memory. FlashAttention is **exact**, not an approximation.

**Evidence that the tiled version matches the standard one (forward and backward, with and without the causal mask):**

```
== Tiled (FlashAttention-style) vs. standard: forward and backward ==
  causal=False max|diff| O, dQ, dK, dV = ['4.4e-16', '5.6e-16', '4.4e-16', '5.0e-16'] PASS
  causal=True  max|diff| O, dQ, dK, dV = ['3.9e-16', '4.9e-16', '7.2e-16', '1.3e-15'] PASS
```

The differences are at the level of float64 rounding error (about 1e-16), confirming the tiled algorithm gives the same answers.

---

## Summary

| Task | Result |
|---|---|
| Gradients | `dV = PᵀdO`, `dP = dOVᵀ`, `dS = P∘(dP − rowsum(dP∘P))`, `dQ = dSK/√d`, `dK = dSᵀQ/√d` |
| Gradient check | h = 1e-6, float64, threshold 1e-6. Worst error 1.85e-9 over 40 configs ✅ |
| Stability | Subtract the row max before `exp` |
| `1/√d` | Keeps score variance at about 1 so softmax doesn't saturate |
| Causal mask | Same formulas; masked entries get exactly zero gradient |
| Memory | Standard O(n²) vs FlashAttention O(n) extra, with matching results |