"""Single-head scaled dot-product attention and finite-difference checks.

Run: python attention_gradients.py
The check uses float64, central differences with h=1e-5, and a 1e-6
relative-error acceptance threshold (plus a small absolute-error guard).
"""
from __future__ import annotations

import numpy as np


def stable_softmax(x: np.ndarray, axis: int = -1) -> np.ndarray:
    """Numerically stable softmax; every row must have at least one finite item."""
    shifted = x - np.max(x, axis=axis, keepdims=True)
    exp_shifted = np.exp(shifted)
    return exp_shifted / np.sum(exp_shifted, axis=axis, keepdims=True)


def attention_forward(
    Q: np.ndarray,
    K: np.ndarray,
    V: np.ndarray,
    causal: bool = False,
) -> tuple[np.ndarray, tuple[np.ndarray, np.ndarray, np.ndarray]]:
    """Return O and a cache containing (P, scale, allowed-mask)."""
    n_q, d = Q.shape
    n_k = K.shape[0]
    scale = 1.0 / np.sqrt(d)
    scores = (Q @ K.T) * scale
    allowed = np.ones((n_q, n_k), dtype=bool)
    if causal:
        if n_q != n_k:
            raise ValueError("This causal reference assumes self-attention (n_q == n_k).")
        allowed = np.tril(allowed)
        masked_scores = np.where(allowed, scores, -np.inf)
    else:
        masked_scores = scores
    P = stable_softmax(masked_scores, axis=-1)
    O = P @ V
    return O, (P, scale, allowed)


def attention_backward(
    dO: np.ndarray,
    Q: np.ndarray,
    K: np.ndarray,
    V: np.ndarray,
    cache: tuple[np.ndarray, np.ndarray, np.ndarray],
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Backpropagate dO through O=P@V, P=softmax(S), S=QK^T/sqrt(d)."""
    P, scale, allowed = cache
    dV = P.T @ dO
    dP = dO @ V.T
    row_dot = np.sum(dP * P, axis=-1, keepdims=True)
    dS = P * (dP - row_dot)
    # Masked scores are constants (-inf), so they have zero derivative.
    dS = np.where(allowed, dS, 0.0)
    dQ = (dS @ K) * scale
    dK = (dS.T @ Q) * scale
    return dQ, dK, dV


def scalar_loss(Q: np.ndarray, K: np.ndarray, V: np.ndarray,
                upstream: np.ndarray, causal: bool) -> float:
    O, _ = attention_forward(Q, K, V, causal=causal)
    return float(np.sum(O * upstream))


def numerical_gradient(param: np.ndarray, loss_fn, h: float = 1e-5) -> np.ndarray:
    """Central finite differences in float64."""
    grad = np.zeros_like(param, dtype=np.float64)
    it = np.nditer(param, flags=["multi_index"], op_flags=["readwrite"])
    while not it.finished:
        idx = it.multi_index
        original = param[idx]
        param[idx] = original + h
        plus = loss_fn()
        param[idx] = original - h
        minus = loss_fn()
        param[idx] = original
        grad[idx] = (plus - minus) / (2.0 * h)
        it.iternext()
    return grad


def check(causal: bool) -> None:
    rng = np.random.default_rng(1234 if not causal else 5678)
    n, d, dv = 4, 3, 2
    Q = rng.normal(size=(n, d)).astype(np.float64)
    K = rng.normal(size=(n, d)).astype(np.float64)
    V = rng.normal(size=(n, dv)).astype(np.float64)
    upstream = rng.normal(size=(n, dv)).astype(np.float64)

    O, cache = attention_forward(Q, K, V, causal=causal)
    dQ, dK, dV = attention_backward(upstream, Q, K, V, cache)

    fQ = lambda: scalar_loss(Q, K, V, upstream, causal)
    fK = lambda: scalar_loss(Q, K, V, upstream, causal)
    fV = lambda: scalar_loss(Q, K, V, upstream, causal)
    num_Q = numerical_gradient(Q, fQ)
    num_K = numerical_gradient(K, fK)
    num_V = numerical_gradient(V, fV)

    def errors(analytic, numeric):
        abs_err = np.max(np.abs(analytic - numeric))
        rel_err = np.max(np.abs(analytic - numeric) /
                         np.maximum(1e-12, np.abs(analytic) + np.abs(numeric)))
        return abs_err, rel_err

    results = {"Q": errors(dQ, num_Q), "K": errors(dK, num_K), "V": errors(dV, num_V)}
    print(f"causal={causal}, loss={fQ():.12f}, dtype=float64, h=1e-5")
    for name, (abs_err, rel_err) in results.items():
        print(f"  {name}: max_abs={abs_err:.3e}, max_rel={rel_err:.3e}")
    assert all(abs_err < 1e-8 or rel_err < 1e-6
               for abs_err, rel_err in results.values()), results


if __name__ == "__main__":
    check(causal=False)
    check(causal=True)
    print("PASS: unmasked and causal gradient checks meet the stated threshold.")
