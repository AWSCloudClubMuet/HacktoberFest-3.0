
import numpy as np

np.random.seed(42)


def softmax(x):
    # Numerically stable row-wise softmax
    x = x - np.max(x, axis=-1, keepdims=True)
    exp_x = np.exp(x)
    return exp_x / np.sum(exp_x, axis=-1, keepdims=True)


def attention_forward(Q, K, V):
    d = Q.shape[-1]

    # Scaled dot-product attention
    S = Q @ K.T / np.sqrt(d)
    P = softmax(S)
    O = P @ V

    return O, (Q, K, V, S, P)


def attention_backward(dO, cache):
    Q, K, V, S, P = cache
    d = Q.shape[-1]

    # O = P @ V
    dP = dO @ V.T
    dV = P.T @ dO

    # P = softmax(S)
    dS = P * (
        dP - np.sum(dP * P, axis=-1, keepdims=True)
    )

    # S = Q @ K.T / sqrt(d)
    dQ = dS @ K / np.sqrt(d)
    dK = dS.T @ Q / np.sqrt(d)

    return dQ, dK, dV


def loss(Q, K, V, dO):
    O, _ = attention_forward(Q, K, V)
    return np.sum(O * dO)


def numerical_gradient(array, objective, eps=1e-5):
    grad = np.zeros_like(array)

    for idx in np.ndindex(array.shape):
        original = array[idx]

        array[idx] = original + eps
        plus = objective()

        array[idx] = original - eps
        minus = objective()

        array[idx] = original
        grad[idx] = (plus - minus) / (2 * eps)

    return grad


def relative_error(a, b):
    return np.max(
        np.abs(a - b) /
        np.maximum(1e-8, np.abs(a) + np.abs(b))
    )


# Small float64 test for accurate gradient checking
n, d, dv = 3, 4, 2

Q = np.random.randn(n, d).astype(np.float64)
K = np.random.randn(n, d).astype(np.float64)
V = np.random.randn(n, dv).astype(np.float64)
dO = np.random.randn(n, dv).astype(np.float64)

O, cache = attention_forward(Q, K, V)
dQ, dK, dV = attention_backward(dO, cache)

num_dQ = numerical_gradient(Q, lambda: loss(Q, K, V, dO))
num_dK = numerical_gradient(K, lambda: loss(Q, K, V, dO))
num_dV = numerical_gradient(V, lambda: loss(Q, K, V, dO))

for name, analytical, numerical in [
    ("dQ", dQ, num_dQ),
    ("dK", dK, num_dK),
    ("dV", dV, num_dV),
]:
    error = relative_error(analytical, numerical)
    print(f"{name} relative error: {error:.3e}")
    assert error < 1e-7, f"{name} gradient check failed!"

print("All attention gradient checks passed!")
