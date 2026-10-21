"""
Milestone 2: Single-Head Scaled Dot-Product Attention in Pure NumPy
Implements forward and backward passes with:
- Numerically stable row-wise softmax (subtracting row max)
- Scaling factor 1/sqrt(d)
- Analytical gradients for Q, K, V, P, and S given upstream gradient dO
- Optional causal masking support
"""

import numpy as np


class AttentionLayerNumPy:
    """
    Single-head attention layer implemented from first principles in NumPy.

    Mathematical formulation:
        S = (Q @ K.T) / sqrt(d)
        P = softmax(S) (row-wise)
        O = P @ V

    Gradients:
        dO: upstream gradient (dL/dO)
        dV = P.T @ dO
        dP = dO @ V.T
        dS = P * (dP - sum(dP * P, axis=-1, keepdims=True))
        dQ = (dS @ K) / sqrt(d)
        dK = (dS.T @ Q) / sqrt(d)
    """

    def __init__(self, d_k=None):
        self.d_k = d_k
        self.cache = None

    @staticmethod
    def stable_softmax(S, mask=None):
        """
        Numerically stable softmax computed along the last axis (-1).
        Fix for numerical instability:
            If S has large positive values (e.g. 50+), exp(S) overflows to +inf,
            leading to inf/inf -> NaN.
            By subtracting the row maximum m = max(S, axis=-1),
            all exponent arguments are <= 0, guaranteeing exp(S - m) in (0, 1]
            and avoiding floating-point overflow completely.
        """
        S_work = S.copy()
        if mask is not None:
            # Mask contains -inf or very large negative value for masked positions
            S_work = S_work + mask

        # Subtract max for numerical stability along row axis
        max_val = np.max(S_work, axis=-1, keepdims=True)
        exp_S = np.exp(S_work - max_val)
        sum_exp = np.sum(exp_S, axis=-1, keepdims=True)
        # Avoid division by zero if an entire row was masked
        sum_exp = np.where(sum_exp == 0, 1.0, sum_exp)
        P = exp_S / sum_exp
        return P

    def forward(self, Q, K, V, mask=None):
        """
        Forward Pass for Single-Head Attention.
        Args:
            Q: Query matrix of shape (N, d) or (B, N, d)
            K: Key matrix of shape (M, d) or (B, M, d)
            V: Value matrix of shape (M, d_v) or (B, M, d_v)
            mask: Optional additive attention mask of shape (N, M) or (B, N, M)
        Returns:
            O: Output matrix of shape (N, d_v) or (B, N, d_v)
            cache: Tuple containing saved tensors for backward pass
        """
        # Head dimension d is the last dimension of Q
        d = Q.shape[-1]
        scale = 1.0 / np.sqrt(d)

        # 1. Compute Scaled Dot-Product Scores S
        if Q.ndim == 2:
            S = (Q @ K.T) * scale
        else:
            S = (Q @ K.swapaxes(-1, -2)) * scale

        # 2. Compute Softmax Probabilities P (Row-wise)
        P = self.stable_softmax(S, mask=mask)

        # 3. Compute Attention Output O
        O = P @ V

        # Cache variables required for backward pass
        self.cache = (Q, K, V, S, P, mask, d)
        return O, self.cache

    def backward(self, dO):
        """
        Backward Pass for Single-Head Attention.
        Given upstream gradient dO = dL/dO:
        Computes analytical gradients dV, dP, dS, dQ, and dK.

        Args:
            dO: Gradient of loss with respect to output O, shape matching O.
        Returns:
            gradients: dict containing:
                'dQ': dL/dQ
                'dK': dL/dK
                'dV': dL/dV
                'dP': dL/dP
                'dS': dL/dS
        """
        if self.cache is None:
            raise ValueError("Forward pass must be executed before backward pass.")

        Q, K, V, S, P, mask, d = self.cache
        scale = 1.0 / np.sqrt(d)

        # 1. Gradient with respect to Value matrix: dV = P^T @ dO
        if dO.ndim == 2:
            dV = P.T @ dO
        else:
            dV = P.swapaxes(-1, -2) @ dO

        # 2. Gradient with respect to Attention Probabilities: dP = dO @ V^T
        if dO.ndim == 2:
            dP = dO @ V.T
        else:
            dP = dO @ V.swapaxes(-1, -2)

        # 3. Gradient with respect to Attention Scores: dS
        # dS_ij = P_ij * (dP_ij - sum_k (dP_ik * P_ik))
        dP_dot_P = np.sum(dP * P, axis=-1, keepdims=True)
        dS = P * (dP - dP_dot_P)

        # If a causal mask was applied, gradients across masked positions must be zeroed
        if mask is not None:
            dS = np.where(np.isneginf(mask) | (mask < -1e8), 0.0, dS)

        # 4. Gradient with respect to Query matrix: dQ = (dS @ K) / sqrt(d)
        dQ = (dS @ K) * scale

        # 5. Gradient with respect to Key matrix: dK = (dS^T @ Q) / sqrt(d)
        if dO.ndim == 2:
            dK = (dS.T @ Q) * scale
        else:
            dK = (dS.swapaxes(-1, -2) @ Q) * scale

        return {
            "dQ": dQ,
            "dK": dK,
            "dV": dV,
            "dP": dP,
            "dS": dS,
        }
