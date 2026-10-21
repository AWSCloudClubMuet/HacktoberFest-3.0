"""
Milestone 2 Runner: Attention Forward/Backward, Numerical Gradient Checking, and Memory Analysis
Executes forward and backward passes, finite-difference gradient verification for Q, K, V, P, S,
and generates diagnostic visualizations.
"""

import os
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import numpy as np
import matplotlib.pyplot as plt
from attention import AttentionLayerNumPy
from grad_check import verify_attention_gradients
from flash_attention_analysis import generate_memory_scaling_plot


def main():
    print("=" * 75, flush=True)
    print(" MILESTONE 2: ATTENTION FORWARD/BACKWARD & FINITE-DIFFERENCE GRAD CHECK ", flush=True)
    print("=" * 75, flush=True)

    # 1. Forward and Backward Pass Demonstration
    print("\n[1/3] Executing Attention Forward & Backward Pass (Batch=1, N=4, M=4, d=8)...", flush=True)
    np.random.seed(42)
    Q = np.random.randn(4, 8)
    K = np.random.randn(4, 8)
    V = np.random.randn(4, 8)

    layer = AttentionLayerNumPy()
    O, cache = layer.forward(Q, K, V)
    dO = np.ones_like(O) # Simple upstream gradient
    grads = layer.backward(dO)

    print(f"  Input Q shape: {Q.shape} | K shape: {K.shape} | V shape: {V.shape}")
    print(f"  Output O shape: {O.shape}")
    print(f"  Computed Gradients:")
    for k, v in grads.items():
        print(f"    Grad {k:2s}: shape = {str(v.shape):<10} | L2 Norm = {np.linalg.norm(v):.6f}")

    # 2. Numerical Gradient Verification
    print("\n[2/3] Performing Finite-Difference Numerical Gradient Checks...", flush=True)
    print("  Specifications:")
    print("    - Precision: float64 double precision")
    print("    - Perturbation Step Size (h): 1.0e-06")
    print("    - Acceptance Threshold: Relative Error < 1.0e-07\n")

    # Unmasked check
    res_unmasked = verify_attention_gradients(N=4, M=4, d=8, d_v=8, h=1e-6, threshold=1e-7, use_causal_mask=False)
    print("  --- CASE A: STANDARD UNMASKED ATTENTION ---")
    print(f"  {'Variable':<10} | {'Rel Error':<14} | {'Max Abs Diff':<14} | {'Threshold':<12} | {'Result':<8}")
    print("  " + "-" * 68)
    for var_name, data in res_unmasked["variables"].items():
        status = "PASSED" if data["passed"] else "FAILED"
        print(f"  {var_name:<10} | {data['relative_error']:<14.2e} | {data['max_abs_diff']:<14.2e} | {data['threshold']:<12.1e} | {status:<8}")

    # Causal masked check
    res_masked = verify_attention_gradients(N=4, M=4, d=8, d_v=8, h=1e-6, threshold=1e-7, use_causal_mask=True)
    print("\n  --- CASE B: CAUSAL MASKED ATTENTION ---")
    print(f"  {'Variable':<10} | {'Rel Error':<14} | {'Max Abs Diff':<14} | {'Threshold':<12} | {'Result':<8}")
    print("  " + "-" * 68)
    for var_name, data in res_masked["variables"].items():
        status = "PASSED" if data["passed"] else "FAILED"
        print(f"  {var_name:<10} | {data['relative_error']:<14.2e} | {data['max_abs_diff']:<14.2e} | {data['threshold']:<12.1e} | {status:<8}")

    # Generate Gradient Error Bar Chart
    figures_dir = ROOT_DIR / "figures"
    figures_dir.mkdir(parents=True, exist_ok=True)
    fig_grad_path = figures_dir / "milestone2_grad_check.png"

    variables = list(res_unmasked["variables"].keys())
    unmasked_errors = [res_unmasked["variables"][v]["relative_error"] for v in variables]
    masked_errors = [res_masked["variables"][v]["relative_error"] for v in variables]

    x = np.arange(len(variables))
    width = 0.35

    plt.figure(figsize=(9, 5))
    plt.bar(x - width/2, unmasked_errors, width, label="Unmasked Attention", color="royalblue")
    plt.bar(x + width/2, masked_errors, width, label="Causal Masked Attention", color="forestgreen")
    plt.axhline(1e-7, color="red", linestyle="--", label="Acceptance Threshold (1e-7)")
    plt.yscale("log")
    plt.xlabel("Target Variable", fontsize=12, fontweight="bold")
    plt.ylabel("Relative Error (log scale)", fontsize=12, fontweight="bold")
    plt.title("Numerical Gradient Check: Analytical vs Finite-Difference", fontsize=13, fontweight="bold")
    plt.xticks(x, variables, fontsize=11)
    plt.ylim(1e-12, 1e-4)
    plt.grid(True, which="both", linestyle="--", alpha=0.5)
    plt.legend(fontsize=10)
    plt.tight_layout()
    plt.savefig(fig_grad_path, dpi=300)
    plt.close()
    print(f"\n[+] Gradient check bar chart saved to: {fig_grad_path}")

    # 3. Memory Scaling & FlashAttention
    print("\n[3/3] Generating FlashAttention Memory Complexity Analysis...", flush=True)
    mem_fig_path, Ns, std_mem, flash_mem = generate_memory_scaling_plot()
    # Ensure also saved in workspace figures/
    local_mem_fig = figures_dir / "milestone2_flash_attention_memory.png"
    plt.figure(figsize=(10, 6))
    plt.plot(Ns, std_mem, "r--o", label="Standard Attention ($O(N^2)$ HBM footprint)", linewidth=2.5, markersize=7)
    plt.plot(Ns, flash_mem, "b-s", label="FlashAttention ($O(N)$ linear HBM footprint)", linewidth=2.5, markersize=7)
    plt.axhline(16 * 1024, color="red", linestyle=":", alpha=0.7, label="16 GB GPU VRAM limit")
    plt.axhline(24 * 1024, color="darkred", linestyle=":", alpha=0.7, label="24 GB GPU VRAM limit")
    plt.xscale("log", base=2)
    plt.yscale("log", base=10)
    plt.xlabel("Sequence Length $N$ (log scale)", fontsize=12)
    plt.ylabel("HBM Memory Consumption (MB, log scale)", fontsize=12)
    plt.title("Memory Scaling: Standard Attention vs FlashAttention (Batch=2, Heads=16, d=64)", fontsize=13, fontweight="bold")
    plt.grid(True, which="both", linestyle="--", alpha=0.5)
    plt.legend(fontsize=11)
    plt.tight_layout()
    plt.savefig(local_mem_fig, dpi=300)
    plt.close()

    print(f"[+] FlashAttention scaling plot saved to: {local_mem_fig}")
    print("=" * 75, flush=True)


if __name__ == "__main__":
    main()
