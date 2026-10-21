"""Single-head scaled dot-product attention in NumPy: forward, backward and a tiled forward."""
import numpy as np


def softmax(S):
    """Row-wise softmax that cannot overflow and gives zeros for fully masked rows."""
    row_max = S.max(axis=-1, keepdims=True)
    # A fully masked row is all -inf, so its max is -inf and S - max would be NaN. Use 0 instead.
    row_max = np.where(np.isneginf(row_max), 0.0, row_max)
    # Subtracting the row max makes the largest exponent exp(0) = 1, so exp cannot overflow.
    E = np.exp(S - row_max)
    total = E.sum(axis=-1, keepdims=True)
    # A fully masked row sums to 0. Dividing by 1 instead leaves it as zeros rather than NaN.
    return E / np.where(total == 0, 1.0, total)


def forward(Q, K, V, causal=False):
    """Q (n,d), K (m,d), V (m,d_v) -> output O (n,d_v) and a cache for backward."""
    # A Python float (not np.sqrt) so that float32 inputs stay float32.
    scale = 1.0 / Q.shape[-1] ** 0.5
    S = Q @ K.T * scale
    if causal:
        # Query i may only look at keys j <= i. Masking before the softmax makes those
        # weights exactly 0, and the remaining weights in each row still sum to 1.
        future = np.triu(np.ones(S.shape, dtype=bool), k=1)
        S = np.where(future, -np.inf, S)
    P = softmax(S)
    O = P @ V
    cache = {"Q": Q, "K": K, "V": V, "P": P, "scale": scale}
    return O, cache


def backward(dO, cache):
    """Upstream gradient dO (n,d_v) -> dQ (n,d), dK (m,d), dV (m,d_v).

    Also stores dS in the cache so the property checks can look at it.
    """
    Q, K, V, P, scale = cache["Q"], cache["K"], cache["V"], cache["P"], cache["scale"]
    dV = P.T @ dO                        # (m,n)(n,d_v) = (m,d_v)
    dP = dO @ V.T                        # (n,d_v)(d_v,m) = (n,m)
    D = (P * dP).sum(axis=-1, keepdims=True)  # (n,m) summed over m = (n,1)
    dS = P * (dP - D)                    # (n,m); 0 wherever the mask made P = 0
    dQ = dS @ K * scale                  # (n,m)(m,d) = (n,d)
    dK = dS.T @ Q * scale                # (m,n)(n,d) = (m,d)
    cache["dS"] = dS
    return dQ, dK, dV


def tiled_forward(Q, K, V, block):
    """FlashAttention-style forward: walk over K and V one block at a time.

    Only (n, block) tiles of the score matrix are ever built, never the full (n, m).
    Returns O (n,d_v) and the per-row logsumexp (n,), which is all a real kernel keeps.
    """
    scale = 1.0 / Q.shape[-1] ** 0.5
    n = Q.shape[0]
    running_max = np.full((n, 1), -np.inf)  # largest logit seen so far in each row
    running_sum = np.zeros((n, 1))          # sum of exp(logit - running_max) so far
    acc = np.zeros((n, V.shape[1]))         # sum of exp(logit - running_max) * v, not yet normalised

    for start in range(0, K.shape[0], block):
        K_block = K[start:start + block]
        V_block = V[start:start + block]
        S_block = Q @ K_block.T * scale
        new_max = np.maximum(running_max, S_block.max(axis=-1, keepdims=True))
        # Earlier terms were measured against the old max; this factor moves them to the new max.
        # On the first block the old max is -inf, so the factor is 0 and nothing carries over.
        rescale = np.exp(running_max - new_max)
        P_block = np.exp(S_block - new_max)
        running_sum = rescale * running_sum + P_block.sum(axis=-1, keepdims=True)
        acc = rescale * acc + P_block @ V_block
        running_max = new_max

    O = acc / running_sum  # normalise once, at the very end
    logsumexp = (running_max + np.log(running_sum)).ravel()
    return O, logsumexp
