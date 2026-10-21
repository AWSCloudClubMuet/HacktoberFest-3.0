"""
Milestone 2: Numerical Gradient Checking
Verifies analytical gradients against centered finite-difference numerical gradients.
Uses float64 double-precision arithmetic to prevent roundoff errors.

Specifications:
- Precision: float64 (np.float64)
- Step Size (h): 1e-6 (centered difference: O(h^2) truncation error ~ 1e-12)
- Acceptance Threshold: Relative error < 1e-7
"""

import os
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import numpy as np
from attention import AttentionLayerNumPy


def compute_loss(O):
    """
    Arbitrary scalar loss function L = 0.5 * sum(O^2)
    dL/dO = O
    """
    return 0.5 * np.sum(O ** 2)


def numerical_grad_tensor(forward_func, tensor, h=1e-6):
    """
    Computes numerical gradient of a scalar loss with respect to a tensor
    using two-sided centered finite differences:
        dL/d_ij = (L(tensor + h*e_ij) - L(tensor - h*e_ij)) / (2 * h)
    """
    num_grad = np.zeros_like(tensor, dtype=np.float64)
    it = np.nditer(tensor, flags=["multi_index"], op_flags=["readwrite"])

    while not it.finished:
        idx = it.multi_index
        orig_val = tensor[idx]

        # +h perturbation
        tensor[idx] = orig_val + h
        loss_plus = forward_func()

        # -h perturbation
        tensor[idx] = orig_val - h
        loss_minus = forward_func()

        # Reset original value
        tensor[idx] = orig_val

        # Centered difference
        num_grad[idx] = (loss_plus - loss_minus) / (2.0 * h)
        it.iternext()

    return num_grad


def relative_error(grad_analytical, grad_numerical, eps=1e-12):
    """
    Computes scale-invariant relative error between analytical and numerical gradients:
        rel_err = ||grad_a - grad_n||_2 / max(||grad_a||_2 + ||grad_n||_2, eps)
    """
    numerator = np.linalg.norm(grad_analytical - grad_numerical)
    denominator = max(np.linalg.norm(grad_analytical) + np.linalg.norm(grad_numerical), eps)
    return numerator / denominator


def verify_attention_gradients(N=4, M=4, d=8, d_v=8, h=1e-6, threshold=1e-7, seed=42, use_causal_mask=False):
    """
    Comprehensive gradient verification for single-head attention.
    Verifies dQ, dK, dV, dP, and dS.
    """
    np.random.seed(seed)

    # Initialize double-precision matrices
    Q = np.random.randn(N, d).astype(np.float64)
    K = np.random.randn(M, d).astype(np.float64)
    V = np.random.randn(M, d_v).astype(np.float64)

    mask = None
    if use_causal_mask:
        # Causal mask: upper triangle is -inf
        mask = np.full((N, M), -np.inf, dtype=np.float64)
        mask[np.tril_indices(N, k=0, m=M)] = 0.0

    layer = AttentionLayerNumPy()

    # 1. Forward pass
    O, cache = layer.forward(Q, K, V, mask=mask)

    # Upstream gradient for loss L = 0.5 * sum(O^2) is dO = O
    dO = O.copy()

    # 2. Analytical backward pass
    analytical_grads = layer.backward(dO)

    # 3. Numerical gradient checking for Q, K, V
    # Forward evaluation closure for Q
    def f_Q():
        O_tmp, _ = layer.forward(Q, K, V, mask=mask)
        return compute_loss(O_tmp)

    # Forward evaluation closure for K
    def f_K():
        O_tmp, _ = layer.forward(Q, K, V, mask=mask)
        return compute_loss(O_tmp)

    # Forward evaluation closure for V
    def f_V():
        O_tmp, _ = layer.forward(Q, K, V, mask=mask)
        return compute_loss(O_tmp)

    num_dQ = numerical_grad_tensor(f_Q, Q, h=h)
    num_dK = numerical_grad_tensor(f_K, K, h=h)
    num_dV = numerical_grad_tensor(f_V, V, h=h)

    # 4. Numerical gradient checking for intermediate variables P and S
    # For P: O = P @ V -> L(P) = 0.5 * sum((P @ V)^2)
    def f_P(P_mat):
        return compute_loss(P_mat @ V)

    num_dP = numerical_grad_tensor(lambda: f_P(P_work), P_work := cache[4].copy(), h=h)

    # For S: P = softmax(S) -> O = P(S) @ V -> L(S)
    def f_S(S_mat):
        P_tmp = AttentionLayerNumPy.stable_softmax(S_mat, mask=mask)
        return compute_loss(P_tmp @ V)

    num_dS = numerical_grad_tensor(lambda: f_S(S_work), S_work := cache[3].copy(), h=h)

    # 5. Compute relative errors
    rel_errors = {
        "dQ": relative_error(analytical_grads["dQ"], num_dQ),
        "dK": relative_error(analytical_grads["dK"], num_dK),
        "dV": relative_error(analytical_grads["dV"], num_dV),
        "dP": relative_error(analytical_grads["dP"], num_dP),
        "dS": relative_error(analytical_grads["dS"], num_dS),
    }

    results = {}
    all_passed = True
    for var_name, err in rel_errors.items():
        passed = err < threshold
        all_passed = all_passed and passed
        results[var_name] = {
            "relative_error": float(err),
            "max_abs_diff": float(np.max(np.abs(analytical_grads[var_name] - locals()[f"num_{var_name}"]))),
            "threshold": threshold,
            "passed": bool(passed),
        }

    return {
        "all_passed": all_passed,
        "step_size_h": h,
        "precision": "float64",
        "threshold": threshold,
        "causal_mask": use_causal_mask,
        "variables": results,
    }


if __name__ == "__main__":
    print("Running Attention Gradient Check (Standard Unmasked)...")
    res_unmasked = verify_attention_gradients(use_causal_mask=False)
    for k, v in res_unmasked["variables"].items():
        status = "PASSED" if v["passed"] else "FAILED"
        print(f"[{status}] Variable {k:2s}: Rel Error = {v['relative_error']:.2e} (Threshold: {v['threshold']:.1e})")

    print("\nRunning Attention Gradient Check (Causal Masked)...")
    res_masked = verify_attention_gradients(use_causal_mask=True)
    for k, v in res_masked["variables"].items():
        status = "PASSED" if v["passed"] else "FAILED"
        print(f"[{status}] Variable {k:2s}: Rel Error = {v['relative_error']:.2e} (Threshold: {v['threshold']:.1e})")
