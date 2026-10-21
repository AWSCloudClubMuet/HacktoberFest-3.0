# Milestone 2 — Attention gradient derivation

## Forward pass

Let `Q ∈ R^(nq×d)`, `K ∈ R^(nk×d)`, and `V ∈ R^(nk×dv)`.

\[
S=QK^T/\sqrt{d},\quad P=\operatorname{softmax}(S),\quad O=PV.
\]

Softmax acts row-wise. Let `G = dL/dO`.

## Backward pass

From `O = P V`:

\[
dV=P^T G,\qquad dP=G V^T.
\]

For each row of the softmax, with `A = dP`:

\[
dS=P\odot(A-\operatorname{rowsum}(A\odot P)).
\]

The row sum is broadcast over columns. Since `S=QKᵀ/√d`:

\[
dQ=dS K/\sqrt d,\qquad dK=dS^T Q/\sqrt d.
\]

These equations assume Q, K, and V are independent inputs.

## Numerical stability

Naive exponentials can overflow. Compute each row's softmax after subtracting its maximum:

\[
p_i=\frac{\exp(s_i-m)}{\sum_j\exp(s_j-m)},\quad m=\max_j s_j.
\]

The subtraction leaves softmax unchanged and ensures the largest exponent is one. Masked entries are set to negative infinity before softmax. Every row must retain at least one allowed entry.

## Why scale by 1/sqrt(d)?

Under independent, zero-mean, unit-variance query/key components, the unscaled dot product has variance approximately `d`. Large logits can saturate softmax and reduce gradients. Scaling by `1/sqrt(d)` keeps the score variance approximately order one.

## Causal mask

In causal self-attention, position `i` can attend only to positions `j <= i`. Masked positions have probability zero and therefore score gradient zero. The same backward equations apply to the masked probabilities. The mask itself is fixed and has no gradient.

## Memory and FlashAttention

Materializing the score/probability matrix requires O(n²) memory per head, while dense attention computation is O(n²d). Increasing sequence length fourfold multiplies the number of score entries by sixteen.

FlashAttention uses tiled fused computation and online softmax normalization, avoiding storage of the full attention matrix in high-bandwidth memory. Backward recomputes some intermediate values as needed. Exact dense attention still has quadratic arithmetic complexity, but memory traffic and intermediate storage are substantially reduced.

## Gradient-check settings

- Precision: NumPy float64.
- Method: central finite differences.
- Step size: 1e-5.
- Acceptance criterion: maximum absolute gradient error < 1e-7.
- Objective: `0.5 * sum(O**2)`.
- Random seed: 7.

Run `python milestone2/attention_numpy.py` to obtain actual measured errors. Do not report expected errors as measured evidence unless the script has been run.
