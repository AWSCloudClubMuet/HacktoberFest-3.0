"""
Milestone 2: Scaled Dot-Product Attention Implementation & Numerical Gradient Check
Written in pure NumPy with clear, beginner-friendly comments and rigorous verification.
"""

import numpy as np


def softmax(x, axis=-1):
    """
    Numerically stable softmax along the specified axis.
    Subtracts the row maximum to prevent exp() from overflowing to infinity.
    """
    # Subtract max per row: exp(x - max) / sum(exp(x - max))
    # This prevents overflow without changing the mathematical output!
    x_max = np.max(x, axis=axis, keepdims=True)
    exp_x = np.exp(x - x_max)
    sum_exp = np.sum(exp_x, axis=axis, keepdims=True)
    return exp_x / sum_exp


def attention_forward(Q, K, V, causal_mask=False):
    """
    Forward pass for Single-Head Scaled Dot-Product Attention:
      S = (Q @ K.T) / sqrt(d)
      P = softmax(S)
      O = P @ V

    Parameters:
      Q: Query matrix of shape (n, d)
      K: Key matrix of shape (n, d)
      V: Value matrix of shape (n, d_v)
      causal_mask: If True, prevents position i from attending to future position j > i

    Returns:
      O: Output matrix of shape (n, d_v)
      cache: Tuple of intermediate values needed for the backward pass
    """
    n, d = Q.shape
    scale = 1.0 / np.sqrt(d)
    
    # Step 1: Raw attention scores S = (Q @ K^T) / sqrt(d)
    S = (Q @ K.T) * scale  # shape: (n, n)
    
    # Step 2: Apply causal mask if requested (upper triangle above diagonal = -inf)
    mask = None
    if causal_mask:
        mask = np.triu(np.ones((n, n), dtype=bool), k=1)
        S_masked = S.copy()
        S_masked[mask] = -1e9  # Large negative value so exp(-1e9) evaluates to 0
        P = softmax(S_masked, axis=-1)
    else:
        P = softmax(S, axis=-1)  # shape: (n, n)
        
    # Step 3: Context output O = P @ V
    O = P @ V  # shape: (n, d_v)
    
    cache = (Q, K, V, S, P, scale, causal_mask, mask)
    return O, cache


def attention_backward(dO, cache):
    """
    Backward pass for Single-Head Scaled Dot-Product Attention:
    Given upstream gradient dO (dL/dO), computes dV, dP, dS, dQ, and dK.

    Parameters:
      dO: Upstream gradient of shape (n, d_v)
      cache: Intermediate values stored during forward pass

    Returns:
      dQ: Gradient w.r.t. Q (n, d)
      dK: Gradient w.r.t. K (n, d)
      dV: Gradient w.r.t. V (n, d_v)
      dP: Gradient w.r.t. attention probabilities P (n, n)
      dS: Gradient w.r.t. attention scores S (n, n)
    """
    Q, K, V, S, P, scale, causal_mask, mask = cache
    
    # 1. Gradient w.r.t. V:
    # O = P @ V  ==>  dV = P.T @ dO
    dV = P.T @ dO  # shape: (n, d_v)
    
    # 2. Gradient w.r.t. P:
    # O = P @ V  ==>  dP = dO @ V.T
    dP = dO @ V.T  # shape: (n, n)
    
    # 3. Gradient w.r.t. S (Backprop through row-wise softmax):
    # dS_ij = P_ij * (dP_ij - sum_k(dP_ik * P_ik))
    sum_dP_P = np.sum(dP * P, axis=-1, keepdims=True)  # shape: (n, 1)
    dS = P * (dP - sum_dP_P)                            # shape: (n, n)
    
    # If causal mask was applied, gradients cannot flow through masked positions
    if causal_mask and mask is not None:
        dS[mask] = 0.0
        
    # 4. Gradient w.r.t. Q and K:
    # S = (Q @ K.T) * scale
    # dQ = (dS @ K) * scale
    # dK = (dS.T @ Q) * scale
    dQ = (dS @ K) * scale    # shape: (n, d)
    dK = (dS.T @ Q) * scale  # shape: (n, d)
    
    return dQ, dK, dV, dP, dS


def check_gradients():
    """
    Performs numerical gradient checking using two-sided finite differences:
      g_num = (L(x + h) - L(x - h)) / (2 * h)
    Compares against the analytical gradients dQ, dK, dV.
    """
    print("=" * 70)
    print("NUMERICAL GRADIENT VERIFICATION (Two-Sided Finite Differences)")
    print("=" * 70)
    
    # Double precision (float64) is essential for numerical gradient accuracy
    np.random.seed(42)
    n = 4     # sequence length
    d = 8     # feature dimension
    d_v = 6   # value dimension
    
    # Generate random test matrices in float64
    Q = np.random.randn(n, d).astype(np.float64)
    K = np.random.randn(n, d).astype(np.float64)
    V = np.random.randn(n, d_v).astype(np.float64)
    
    # Random upstream gradient dO (or loss weight matrix)
    dO = np.random.randn(n, d_v).astype(np.float64)
    
    # Objective function: scalar loss L = sum(O * dO)
    # Then dL/dO is exactly dO!
    def compute_loss(q_mat, k_mat, v_mat, causal=False):
        out, _ = attention_forward(q_mat, k_mat, v_mat, causal_mask=causal)
        return np.sum(out * dO)

    # Gradient check settings
    h = 1e-5                 # step size for central finite difference
    threshold = 1e-7         # relative error acceptance threshold
    print(f"Step size (h):            {h:.1e}")
    print(f"Numerical precision:      float64 (IEEE 754 double precision)")
    print(f"Acceptance threshold:     relative error < {threshold:.1e}")
    print(f"Error metric:             Frobenius relative error ||g_ana - g_num|| / (||g_ana|| + ||g_num||)\n")

    for causal in [False, True]:
        mask_name = "CAUSAL MASKED ATTENTION" if causal else "UNMASKED (STANDARD) ATTENTION"
        print(f"--- Testing {mask_name} ---")
        
        # Compute analytical gradients
        O, cache = attention_forward(Q, K, V, causal_mask=causal)
        dQ_ana, dK_ana, dV_ana, dP_ana, dS_ana = attention_backward(dO, cache)
        
        params = [('Q', Q, dQ_ana), ('K', K, dK_ana), ('V', V, dV_ana)]
        
        for name, matrix, grad_ana in params:
            grad_num = np.zeros_like(matrix)
            it = np.nditer(matrix, flags=['multi_index'])
            
            while not it.finished:
                idx = it.multi_index
                orig_val = matrix[idx]
                
                # Perturb +h
                matrix[idx] = orig_val + h
                if name == 'Q':
                    loss_plus = compute_loss(matrix, K, V, causal)
                elif name == 'K':
                    loss_plus = compute_loss(Q, matrix, V, causal)
                else:
                    loss_plus = compute_loss(Q, K, matrix, causal)
                    
                # Perturb -h
                matrix[idx] = orig_val - h
                if name == 'Q':
                    loss_minus = compute_loss(matrix, K, V, causal)
                elif name == 'K':
                    loss_minus = compute_loss(Q, matrix, V, causal)
                else:
                    loss_minus = compute_loss(Q, K, matrix, causal)
                    
                # Restore original value
                matrix[idx] = orig_val
                
                # Two-sided numerical derivative
                grad_num[idx] = (loss_plus - loss_minus) / (2.0 * h)
                it.iternext()
                
            # Compute relative Frobenius error
            norm_diff = np.linalg.norm(grad_ana - grad_num)
            norm_sum = np.linalg.norm(grad_ana) + np.linalg.norm(grad_num)
            rel_error = norm_diff / norm_sum
            max_abs_error = np.max(np.abs(grad_ana - grad_num))
            
            passed = rel_error < threshold
            status = "PASSED [OK]" if passed else "FAILED [X]"
            print(f"  Gradient w.r.t {name}:")
            print(f"    - Relative Error:   {rel_error:12.4e} (threshold: < {threshold:.1e})")
            print(f"    - Max Absolute Err: {max_abs_error:12.4e}")
            print(f"    - Verification:     {status}")
        print()


check_gradients()
