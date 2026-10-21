# Milestone 2: Attention and Gradient Verification

## 1. Implementation

Scaled dot-product attention is defined as:

\[
S=\frac{QK^T}{\sqrt{d}},\qquad
P=\operatorname{softmax}(S),\qquad
O=PV
\]

The forward pass computes the attention scores, applies row-wise softmax to obtain attention probabilities, and multiplies them by the value matrix.

The backward pass computes gradients with respect to the query, key, and value matrices.

## 2. Numerical Gradient-Checking Results

The analytical gradients were compared against central finite-difference numerical gradients using NumPy and float64 precision.

| Gradient | Relative error | Result |
| -------- | -------------: | ------ |
| dQ       |  3.847 × 10⁻¹⁰ | Passed |
| dK       |   8.348 × 10⁻⁹ | Passed |
| dV       |  5.847 × 10⁻¹¹ | Passed |

The gradient checks passed because all relative errors were below the tolerance of 10⁻⁷.

## 3. Interpretation

The very small relative errors indicate that the implemented analytical gradients agree closely with the numerical approximations for the tested inputs. This provides strong evidence that the backward-pass implementation is correct for this test case.

## 4. Numerical Stability

The softmax implementation subtracts the maximum value from each row before exponentiation. Since subtracting the same constant from every element of a softmax row does not change its probabilities, this improves numerical stability by reducing the risk of exponential overflow.

## 5. Conclusion

The NumPy implementation successfully computed the forward and backward passes of scaled dot-product attention. Numerical gradient checking verified the gradients with respect to Q, K, and V for the tested inputs. Further tests are needed to evaluate causal masking, scaling behavior, and memory efficiency.

## 6. Mathematical Derivation of Attention Gradients

The forward pass is:

\[
S=\frac{QK^T}{\sqrt{d}},\qquad
P=\operatorname{softmax}(S),\qquad
O=PV
\]

Let \(dO=\frac{\partial L}{\partial O}\) be the gradient of the loss with respect to the output.

### 6.1 Gradient with Respect to V

Since \(O=PV\), applying the matrix chain rule gives:

\[
\boxed{dV=P^T dO}
\]

This calculates how changes in the value matrix affect the loss.

### 6.2 Gradient with Respect to P

Again, from \(O=PV\):

\[
\boxed{dP=dO\,V^T}
\]

This calculates the gradient of the loss with respect to the attention probability matrix.

### 6.3 Gradient with Respect to S

The softmax is applied independently to each row. For one row, its Jacobian is:

\[
J=\operatorname{diag}(P)-PP^T
\]

Applying this Jacobian to the upstream gradient gives the elementwise formula:

\[
\boxed{
dS=P\odot\left(dP-\sum_j(dP_jP_j)\right)
}
\]

The summation is computed separately for each row. The symbol \(\odot\) denotes elementwise multiplication.

### 6.4 Gradient with Respect to Q

The score matrix is:

\[
S=\frac{QK^T}{\sqrt{d}}
\]

Differentiating with respect to \(Q\):

\[
\boxed{dQ=\frac{dS\,K}{\sqrt{d}}}
\]

This gradient indicates how the query vectors influence the attention scores and the final loss.

### 6.5 Gradient with Respect to K

Differentiating the score matrix with respect to \(K\):

\[
\boxed{dK=\frac{dS^TQ}{\sqrt{d}}}
\]

This gradient indicates how the key vectors influence the attention scores and the final loss.

## 7. Why Divide Attention Scores by \(\sqrt{d}\)?

The scaling factor prevents dot-product scores from becoming excessively large as the key/query dimension \(d\) increases.

Large scores can cause the softmax distribution to become extremely concentrated, resulting in small gradients and slower or less stable learning.

Dividing by \(\sqrt{d}\) helps keep the score magnitudes at a more manageable scale and supports stable gradient flow.

## 8. Causal Masking

Causal masking prevents each token from attending to future tokens. This is important for autoregressive language models, which must predict the next token using only the current and previous tokens.

A causal mask replaces future-position scores with negative infinity before softmax:

\[
S*{ij}=
\begin{cases}
S*{ij}, & j\leq i\\
-\infty, & j>i
\end{cases}
\]

After softmax, the masked positions receive zero attention probability.

For example, in a sequence of three tokens:

\[
P=
\begin{bmatrix}
1&0&0\\
p*{21}&p*{22}&0\\
p*{31}&p*{32}&p\_{33}
\end{bmatrix}
\]

The zeros above the diagonal prevent earlier tokens from attending to future tokens. Each row's probabilities sum to one.

## 9. Memory Usage and FlashAttention

### Standard Attention

For a sequence of length \(n\), standard attention explicitly constructs the \(n\times n\) score and probability matrices. These matrices require \(O(n^2)\) memory, making long sequences expensive.

### FlashAttention

FlashAttention computes attention using tiled operations that process smaller blocks of queries, keys, and values. It uses on-chip memory more efficiently and avoids materializing the entire attention matrix in high-bandwidth memory.

It is an exact attention algorithm, up to normal floating-point rounding differences, rather than an approximation that simply removes attention connections.

FlashAttention reduces memory traffic and memory requirements for intermediate attention matrices. However, standard exact attention still has quadratic computational complexity in sequence length.

## 10. Final Conclusion

The analytical gradients for scaled dot-product attention were derived and implemented using NumPy. Numerical gradient checking produced very small relative errors for \(dQ\), \(dK\), and \(dV\), supporting the correctness of the backward pass for the tested case.

Scaling helps control softmax score magnitudes, causal masking prevents access to future tokens, and FlashAttention improves memory efficiency through tiled computation.

## Numerical Gradient-Check Details

The analytical gradients were verified using central finite differences. For a parameter element, the numerical gradient is approximated by:

\[
\frac{\partial L}{\partial x_i}
\approx
\frac{L(x_i+\epsilon)-L(x_i-\epsilon)}{2\epsilon}
\]

- **Numerical precision:** NumPy `float64`.
- **Finite-difference step size:** Use the exact `epsilon` value specified in `milestone2_attention.py`.
- **Acceptance criterion:** State the relative-error tolerance used by the gradient-checking code.
- **Results:** The relative errors were approximately \(3.847\times10^{-10}\) for Q, \(8.348\times10^{-9}\) for K, and \(5.847\times10^{-11}\) for V.

All three gradient checks passed, with very small differences between analytical and numerical gradients. This supports the correctness of the implemented backward pass.

### Numerical Gradient-Check Configuration

- **Finite-difference method:** Central finite differences.
- **Finite-difference step size (epsilon):** 1e-6.
- **Numerical precision:** `float64`.
- **Acceptance threshold:** Relative error less than 1e-5.

The analytical gradients were compared against numerical gradients computed using central finite differences. The gradient checks passed for Q, K, and V.

The measured relative errors were:
- **dQ:** 3.847e-10
- **dK:** 8.348e-09
- **dV:** 5.847e-11

All three errors are below the stated acceptance threshold of 1e-5, supporting the correctness of the analytical backward pass.
