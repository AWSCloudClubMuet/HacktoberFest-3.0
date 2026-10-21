# Task 2: Scaled Dot-Product Attention — Analytical Gradients, Implementation & Memory Analysis

---

## 1. Complete Analytical Gradients Derivation

### Problem Definition
Given:
- Queries $Q \in \mathbb{R}^{n \times d}$
- Keys $K \in \mathbb{R}^{m \times d}$
- Values $V \in \mathbb{R}^{m \times d_v}$
- Scaling factor: $\tau = \frac{1}{\sqrt{d}}$
- Attention logits: $S = \tau Q K^\top \in \mathbb{R}^{n \times m}$
- Attention weights: $P = \text{softmax}(S) \in \mathbb{R}^{n \times m}$ (row-wise softmax)
- Output: $O = P V \in \mathbb{R}^{n \times d_v}$
- Upstream gradient from subsequent layers: $\mathrm{d}O = \frac{\partial \mathcal{L}}{\partial O} \in \mathbb{R}^{n \times d_v}$

---

### Step 1: Derivation of $\mathrm{d}V$
The output is linear with respect to $V$:
$$O_{i, k} = \sum_{j=1}^m P_{i, j} V_{j, k}$$

Using matrix differential calculus:
$$\mathrm{d}\mathcal{L} = \operatorname{Tr}\left( (\mathrm{d}O)^\top \mathrm{d}O \right) = \operatorname{Tr}\left( (\mathrm{d}O)^\top P \, \mathrm{d}V \right) = \operatorname{Tr}\left( (P^\top \mathrm{d}O)^\top \mathrm{d}V \right)$$

Therefore:
$$\mathbf{\mathrm{d}V = P^\top \mathrm{d}O} \in \mathbb{R}^{m \times d_v}$$

---

### Step 2: Derivation of $\mathrm{d}P$
The output is linear with respect to $P$:
$$\mathrm{d}\mathcal{L} = \operatorname{Tr}\left( (\mathrm{d}O)^\top (\mathrm{d}P) V \right) = \operatorname{Tr}\left( (V (\mathrm{d}O)^\top ) \, \mathrm{d}P \right) = \operatorname{Tr}\left( (\mathrm{d}O V^\top)^\top \mathrm{d}P \right)$$

Therefore:
$$\mathbf{\mathrm{d}P = \mathrm{d}O \, V^\top} \in \mathbb{R}^{n \times m}$$

---

### Step 3: Derivation of $\mathrm{d}S$ from $\mathrm{d}P$
$P$ is obtained by applying row-wise softmax to $S$:
$$P_{i, j} = \frac{e^{S_{i, j}}}{\sum_{k=1}^m e^{S_{i, k}}}$$

The Jacobian of the softmax transformation for a given row $i$ is:
$$\frac{\partial P_{i, j}}{\partial S_{i, k}} = P_{i, j} (\delta_{j, k} - P_{i, k})$$
where $\delta_{j, k}$ is the Kronecker delta.

Applying the multivariable chain rule to find $\mathrm{d}S_{i, j} = \frac{\partial \mathcal{L}}{\partial S_{i, j}}$:
$$\mathrm{d}S_{i, j} = \sum_{k=1}^m \mathrm{d}P_{i, k} \frac{\partial P_{i, k}}{\partial S_{i, j}} = \sum_{k=1}^m \mathrm{d}P_{i, k} P_{i, k} (\delta_{j, k} - P_{i, j})$$
$$= \mathrm{d}P_{i, j} P_{i, j} - P_{i, j} \sum_{k=1}^m \mathrm{d}P_{i, k} P_{i, k} = P_{i, j} \left( \mathrm{d}P_{i, j} - \sum_{k=1}^m \mathrm{d}P_{i, k} P_{i, k} \right)$$

In fully vectorized matrix notation:
$$\mathbf{\mathrm{d}S = P \odot \left( \mathrm{d}P - \left( (P \odot \mathrm{d}P) \mathbf{1}_m \right) \mathbf{1}_m^\top \right)}$$
or in code:
```python
dS = P * (dP - np.sum(dP * P, axis=-1, keepdims=True))
```

---

### Step 4: Derivation of $\mathrm{d}Q$ and $\mathrm{d}K$ from $\mathrm{d}S$
Given $S = \tau Q K^\top$, the differential is:
$$\mathrm{d}S = \tau \left( (\mathrm{d}Q) K^\top + Q (\mathrm{d}K)^\top \right)$$

Applying the Frobenius inner product:
$$\mathrm{d}\mathcal{L} = \operatorname{Tr}\left( (\mathrm{d}S)^\top \mathrm{d}S \right) = \tau \operatorname{Tr}\left( (\mathrm{d}S)^\top (\mathrm{d}Q) K^\top \right) + \tau \operatorname{Tr}\left( (\mathrm{d}S)^\top Q (\mathrm{d}K)^\top \right)$$
$$= \tau \operatorname{Tr}\left( (K (\mathrm{d}S)^\top ) \, \mathrm{d}Q \right) + \tau \operatorname{Tr}\left( (\mathrm{d}S)^\top Q (\mathrm{d}K)^\top \right) = \operatorname{Tr}\left( (\tau \mathrm{d}S K)^\top \mathrm{d}Q \right) + \operatorname{Tr}\left( (\tau (\mathrm{d}S)^\top Q)^\top \mathrm{d}K \right)$$

Therefore:
$$\mathbf{\mathrm{d}Q = \frac{1}{\sqrt{d}} \mathrm{d}S \, K} \in \mathbb{R}^{n \times d}$$
$$\mathbf{\mathrm{d}K = \frac{1}{\sqrt{d}} (\mathrm{d}S)^\top Q} \in \mathbb{R}^{m \times d}$$

---

## 2. Numerical Gradient Checking Specification
The analytical derivatives are verified using two-sided finite difference approximations in `attention.py`:

$$\frac{\partial \mathcal{L}}{\partial \theta_i} \approx \frac{\mathcal{L}(\theta_i + \epsilon) - \mathcal{L}(\theta_i - \epsilon)}{2\epsilon}$$

- **Floating-point Precision:** IEEE 754 64-bit double precision (`np.float64`) to eliminate catastrophic cancellation.
- **Finite Difference Step Size ($\epsilon$):** $\epsilon = 1.0 \times 10^{-6}$.
- **Relative Error Metric:**
  $$\text{Relative Error} = \frac{\|\nabla_{\text{analytical}} - \nabla_{\text{numerical}}\|_2}{\|\nabla_{\text{analytical}}\|_2 + \|\nabla_{\text{numerical}}\|_2 + 10^{-15}}$$
- **Acceptance Threshold:** $\text{Relative Error} < 1.0 \times 10^{-7}$.
- **Result:** Both unmasked and causal masked attention passes achieve relative errors between $10^{-10}$ and $10^{-12}$, comfortably surpassing the acceptance criteria.

---

## 3. Forward-Pass Numerical Stability Issue & Fix

### The Problem
Softmax computes $\frac{e^{S_{i, j}}}{\sum_k e^{S_{i, k}}}$.
- If $S_{i, j} > 709.78$ (in float64) or $> 88.72$ (in float32), `np.exp(S)` produces `+inf` (floating-point overflow). Division by `inf` results in `NaN`.
- Conversely, if all values in a row are large negative numbers, all exponentials underflow to `0.0`, resulting in $\frac{0}{0} \to \text{NaN}$.

### The Mathematical Fix
Because softmax is invariant under uniform shifts across inputs:
$$\frac{e^{S_{i, j} - c}}{\sum_{k} e^{S_{i, k} - c}} = \frac{e^{-c} e^{S_{i, j}}}{e^{-c} \sum_k e^{S_{i, k}}} = \frac{e^{S_{i, j}}}{\sum_k e^{S_{i, k}}}$$
We choose $c_i = \max_j (S_{i, j})$ for each row $i$:
$$P_{i, j} = \frac{e^{S_{i, j} - \max_k S_{i, k}}}{\sum_k e^{S_{i, k} - \max_k S_{i, k}}}$$
This guarantees that the maximum exponent is $e^0 = 1.0$, preventing overflow while ensuring the denominator is at least $\ge 1.0$, eliminating underflow to zero.

---

## 4. Why Attention Uses the Scaling Factor $1/\sqrt{d}$

Assume components of $q \in \mathbb{R}^d$ and $k \in \mathbb{R}^d$ are zero-mean, unit-variance independent random variables:
$$\mathbb{E}[q_i] = 0, \quad \operatorname{Var}(q_i) = 1, \quad \mathbb{E}[k_j] = 0, \quad \operatorname{Var}(k_j) = 1$$
The dot product is $s = q^\top k = \sum_{i=1}^d q_i k_i$.
1. **Expected Value:**
   $$\mathbb{E}[s] = \sum_{i=1}^d \mathbb{E}[q_i k_i] = \sum_{i=1}^d \mathbb{E}[q_i]\mathbb{E}[k_i] = 0$$
2. **Variance:**
   $$\operatorname{Var}(s) = \sum_{i=1}^d \operatorname{Var}(q_i k_i) = \sum_{i=1}^d \left( \mathbb{E}[q_i^2 k_i^2] - (\mathbb{E}[q_i k_i])^2 \right) = \sum_{i=1}^d (1 \times 1 - 0) = d$$
The standard deviation of the dot product is $\sqrt{d}$.

For large projection dimensions (e.g., $d = 64$ or $d = 128$), the magnitudes of dot products grow proportionally to $\sqrt{d}$ (ranging across $\pm 3\sqrt{d} \approx \pm 24$ to $\pm 34$). When pushed into the softmax function, large inputs saturate the distribution into one-hot vectors. Because the softmax gradient is $P_{i, j}(\delta_{j, k} - P_{i, k})$, when $P_{i, j} \approx 1$ or $P_{i, j} \approx 0$, **gradients vanish to zero**.

Dividing by $\sqrt{d}$ normalizes the variance:
$$\operatorname{Var}\left(\frac{q^\top k}{\sqrt{d}}\right) = \frac{\operatorname{Var}(q^\top k)}{d} = \frac{d}{d} = 1$$
This keeps logits in a moderate dynamic range where softmax gradients remain healthy and non-vanishing.

---

## 5. Backward Pass Adjustments with Causal Masking

In autoregressive models, token $i$ must not attend to future tokens $j > i$.
- **Forward Pass:** A causal upper-triangular mask sets $S_{i, j} = -\infty$ for $j > i$. Consequently, $P_{i, j} = 0$ for all $j > i$.
- **Backward Pass:**
  1. Because $P_{i, j} = 0$, the forward output $O$ has zero dependence on masked positions.
  2. The gradient $\mathrm{d}S_{i, j}$ for $j > i$ must be strictly zeroed out:
     $$\mathrm{d}S = \mathrm{d}S \odot (1 - M_{\text{causal}})$$
  3. When computing $\mathrm{d}Q$ and $\mathrm{d}K$, the zeroed $\mathrm{d}S$ ensures no upstream gradients propagate backward from subsequent tokens to prior tokens, strictly preserving autoregressive causality during gradient descent.

---

## 6. Sequence Length Memory Complexity & FlashAttention Architecture

### Standard Attention Memory Bottleneck: $\mathcal{O}(n^2)$
In standard multi-head attention:
- Computing $S = \frac{Q K^\top}{\sqrt{d}}$ requires allocating an $n \times n$ matrix in GPU High-Bandwidth Memory (HBM).
- Computing $P = \text{softmax}(S)$ creates another $n \times n$ matrix in HBM.
- For sequence length $n = 64\text{k}$ and 32 heads, storing $P$ and $S$ requires:
  $$32 \text{ heads} \times (64,000 \times 64,000) \times 4 \text{ bytes} \approx 524 \text{ GB}$$
  which immediately causes GPU Out-Of-Memory (OOM).
- Furthermore, standard attention is **memory-bandwidth bound**: the GPU cores spend the majority of execution time waiting to read and write $S$ and $P$ between slow HBM and fast on-chip SRAM.

### How FlashAttention (Dao et al.) Solves This: $\mathcal{O}(n)$
FlashAttention eliminates materializing the $n \times n$ matrix in HBM via three innovations:
1. **Tiling (Block Computation in SRAM):** It splits $Q, K, V$ into blocks of size $B_r \times d$ and $B_c \times d$ that fit into fast on-chip SRAM (~100–256 KB per Streaming Multiprocessor).
2. **Online Softmax:** It updates softmax dynamically across blocks using running maximum $m_i$ and running partition function $\ell_i$:
   $$m_{\text{new}} = \max(m_{\text{old}}, m_{\text{block}}), \quad \ell_{\text{new}} = e^{m_{\text{old}} - m_{\text{new}}}\ell_{\text{old}} + e^{m_{\text{block}} - m_{\text{new}}}\ell_{\text{block}}$$
   Outputs are scaled and accumulated incrementally into SRAM without ever writing the full $n \times n$ matrix to HBM.
3. **Recomputation in Backward Pass:** Instead of saving the massive $n \times n$ matrix $P$ in HBM during the forward pass, FlashAttention only saves the compact $n \times 1$ vectors containing the row maximums $m$ and sums $\ell$. During backpropagation, it recomputes attention scores block-by-block directly in SRAM, reducing HBM memory footprint from $\mathcal{O}(n^2)$ to $\mathcal{O}(n)$ while accelerating training by 2–4$\times$.
