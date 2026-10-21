"""
Unit and Gradient Verification Tests for Milestone 2 (Attention Gradients)
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import pytest
import numpy as np
from milestone2_attention.attention import AttentionLayerNumPy
from milestone2_attention.grad_check import verify_attention_gradients, relative_error


def test_attention_forward_shapes():
    """Verify output shapes and that attention probabilities sum to 1.0 per row."""
    N, M, d, d_v = 6, 8, 16, 16
    Q = np.random.randn(N, d)
    K = np.random.randn(M, d)
    V = np.random.randn(M, d_v)

    layer = AttentionLayerNumPy()
    O, cache = layer.forward(Q, K, V)
    _, _, _, S, P, _, _ = cache

    assert O.shape == (N, d_v), f"Expected O shape {(N, d_v)}, got {O.shape}"
    assert S.shape == (N, M), f"Expected S shape {(N, M)}, got {S.shape}"
    assert P.shape == (N, M), f"Expected P shape {(N, M)}, got {P.shape}"

    # Verify probability row sum == 1.0
    row_sums = np.sum(P, axis=-1)
    np.testing.assert_allclose(row_sums, np.ones(N), atol=1e-6)


def test_stable_softmax_large_values():
    """Verify that stable_softmax prevents overflow/NaN on extreme large score inputs."""
    S_large = np.array([[1000.0, 999.0, 500.0], [800.0, 850.0, 850.0]])
    P = AttentionLayerNumPy.stable_softmax(S_large)

    assert not np.isnan(P).any(), "Softmax output contains NaN!"
    assert not np.isinf(P).any(), "Softmax output contains Inf!"
    np.testing.assert_allclose(np.sum(P, axis=-1), np.ones(2), atol=1e-6)


def test_analytical_grad_check_unmasked():
    """Verify analytical gradients dQ, dK, dV, dP, dS match numerical finite-differences (rel_err < 1e-7)."""
    res = verify_attention_gradients(N=4, M=4, d=8, d_v=8, h=1e-6, threshold=1e-7, use_causal_mask=False)

    assert res["all_passed"], f"Unmasked gradient check failed: {res['variables']}"
    for var_name, data in res["variables"].items():
        assert data["relative_error"] < 1e-7, (
            f"Variable {var_name} relative error {data['relative_error']:.2e} exceeds threshold 1e-7"
        )


def test_analytical_grad_check_causal_masked():
    """Verify causal masked attention gradients match numerical finite-differences."""
    res = verify_attention_gradients(N=4, M=4, d=8, d_v=8, h=1e-6, threshold=1e-7, use_causal_mask=True)

    assert res["all_passed"], f"Causal masked gradient check failed: {res['variables']}"
    for var_name, data in res["variables"].items():
        assert data["relative_error"] < 1e-7, (
            f"Variable {var_name} relative error {data['relative_error']:.2e} exceeds threshold 1e-7"
        )


def test_causal_mask_zero_gradients():
    """Verify that positions in the causal mask strictly receive zero gradients."""
    N, d = 4, 8
    Q = np.random.randn(N, d)
    K = np.random.randn(N, d)
    V = np.random.randn(N, d)

    mask = np.full((N, N), -np.inf)
    mask[np.tril_indices(N, k=0)] = 0.0

    layer = AttentionLayerNumPy()
    O, _ = layer.forward(Q, K, V, mask=mask)
    dO = np.ones_like(O)
    grads = layer.backward(dO)
    dS = grads["dS"]

    # Upper triangular positions (strictly masked) must have dS == 0
    upper_indices = np.triu_indices(N, k=1)
    np.testing.assert_allclose(dS[upper_indices], np.zeros(len(upper_indices[0])), atol=1e-12)


def test_scaling_factor_variance_preservation():
    """Verify that dividing by sqrt(d) preserves unit variance when Q and K have unit variance."""
    np.random.seed(42)
    d = 128
    N = 1000
    # Independent zero-mean, unit-variance vectors
    q = np.random.randn(N, d)
    k = np.random.randn(N, d)

    # Dot products without scaling
    unscaled_dot = np.sum(q * k, axis=-1)
    # Dot products with 1/sqrt(d) scaling
    scaled_dot = unscaled_dot / np.sqrt(d)

    # Unscaled dot product variance should be ~ d = 128
    assert abs(np.var(unscaled_dot) - d) < 25.0
    # Scaled dot product variance should be ~ 1.0
    assert abs(np.var(scaled_dot) - 1.0) < 0.20
