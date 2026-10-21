"""Single-head scaled dot-product attention and gradient check.

Uses NumPy float64 and central finite differences.
Expected tolerance: max absolute error < 1e-7.
"""
import numpy as np


def softmax_stable(x):
    z = x - np.max(x, axis=-1, keepdims=True)
    e = np.exp(z)
    return e / np.sum(e, axis=-1, keepdims=True)


def attention_forward(Q, K, V, causal=False):
    d = Q.shape[-1]
    S = Q @ K.T / np.sqrt(d)
    if causal:
        if Q.shape[0] != K.shape[0]:
            raise ValueError("This simple causal mask expects self-attention.")
        masked = np.triu(np.ones(S.shape, dtype=bool), k=1)
        S = np.where(masked, -np.inf, S)
    P = softmax_stable(S)
    O = P @ V
    return O, (Q, K, V, P)


def attention_backward(dO, cache):
    Q, K, V, P = cache
    d = Q.shape[-1]
    dV = P.T @ dO
    dP = dO @ V.T
    dS = P * (dP - np.sum(dP * P, axis=-1, keepdims=True))
    dQ = dS @ K / np.sqrt(d)
    dK = dS.T @ Q / np.sqrt(d)
    return dQ, dK, dV


def objective(Q, K, V):
    O, _ = attention_forward(Q, K, V)
    return 0.5 * np.sum(O * O)


def numerical_gradient(f, x, eps=1e-5):
    grad = np.zeros_like(x, dtype=np.float64)
    for idx in np.ndindex(x.shape):
        old = x[idx]
        x[idx] = old + eps
        plus = f()
        x[idx] = old - eps
        minus = f()
        x[idx] = old
        grad[idx] = (plus - minus) / (2 * eps)
    return grad


def check_gradient(name, analytic, numeric, atol=1e-7):
    max_abs = float(np.max(np.abs(analytic - numeric)))
    denom = np.maximum(1e-12, np.abs(analytic) + np.abs(numeric))
    max_rel = float(np.max(np.abs(analytic - numeric) / denom))
    print(f"{name}: max_abs={max_abs:.3e}, max_rel={max_rel:.3e}")
    if max_abs >= atol:
        raise AssertionError(f"{name} failed: max_abs={max_abs:.3e} >= {atol}")


def main():
    rng = np.random.default_rng(7)
    Q = rng.normal(size=(3, 4)).astype(np.float64)
    K = rng.normal(size=(3, 4)).astype(np.float64)
    V = rng.normal(size=(3, 2)).astype(np.float64)

    O, cache = attention_forward(Q, K, V)
    dO = O.copy()  # derivative of 0.5 * ||O||^2 with respect to O
    dQ, dK, dV = attention_backward(dO, cache)

    eps = 1e-5
    num_dQ = numerical_gradient(lambda: objective(Q, K, V), Q, eps)
    num_dK = numerical_gradient(lambda: objective(Q, K, V), K, eps)
    num_dV = numerical_gradient(lambda: objective(Q, K, V), V, eps)

    print(f"dtype=float64, central-difference eps={eps}, atol=1e-7")
    check_gradient("dQ", dQ, num_dQ)
    check_gradient("dK", dK, num_dK)
    check_gradient("dV", dV, num_dV)
    print("All gradient checks passed.")

    # Causal-mask sanity check: masked future scores receive zero gradient.
    O_c, cache_c = attention_forward(Q, K, V, causal=True)
    dQ_c, dK_c, dV_c = attention_backward(O_c, cache_c)
    P_c = cache_c[3]
    assert np.allclose(np.triu(P_c, k=1), 0.0)
    print("Causal mask sanity check passed.")


if __name__ == "__main__":
    main()
