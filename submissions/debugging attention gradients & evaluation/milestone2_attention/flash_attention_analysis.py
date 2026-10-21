"""
Milestone 2: Memory Scaling Analysis and FlashAttention Comparison
Analyzes memory footprint as sequence length N grows:
- Standard Attention: O(N^2) memory required to materialize and cache S and P in HBM.
- FlashAttention: O(N) memory via tiling/online softmax, avoiding HBM IO bottlenecks.
Generates comparative memory scaling plots.
"""

import os
import numpy as np
import matplotlib.pyplot as plt


def calculate_standard_attention_memory(N_vals, batch_size=2, num_heads=16, d=64, bytes_per_elem=4):
    """
    Standard attention stores:
    - Q, K, V: 3 * (B * H * N * d) * bytes
    - S, P: 2 * (B * H * N * N) * bytes (stored for backward pass!)
    - O: (B * H * N * d) * bytes
    """
    mem_bytes = []
    for N in N_vals:
        qkv_mem = 3 * (batch_size * num_heads * N * d) * bytes_per_elem
        o_mem = (batch_size * num_heads * N * d) * bytes_per_elem
        # Intermediate N x N score and probability matrices materialized in HBM
        sp_mem = 2 * (batch_size * num_heads * N * N) * bytes_per_elem
        total = qkv_mem + o_mem + sp_mem
        mem_bytes.append(total / (1024 ** 2)) # Convert to MB
    return np.array(mem_bytes)


def calculate_flash_attention_memory(N_vals, batch_size=2, num_heads=16, d=64, block_size=128, bytes_per_elem=4):
    """
    FlashAttention stores in HBM:
    - Q, K, V: 3 * (B * H * N * d) * bytes
    - O: (B * H * N * d) * bytes
    - Softmax normalization stats (row max m and row sum l): 2 * (B * H * N) * bytes
    Intermediate N x N matrices are NEVER written to HBM; computed in fast SRAM on the fly!
    Total memory scales linearly: O(N).
    """
    mem_bytes = []
    for N in N_vals:
        qkv_mem = 3 * (batch_size * num_heads * N * d) * bytes_per_elem
        o_mem = (batch_size * num_heads * N * d) * bytes_per_elem
        stats_mem = 2 * (batch_size * num_heads * N) * bytes_per_elem
        total = qkv_mem + o_mem + stats_mem
        mem_bytes.append(total / (1024 ** 2)) # Convert to MB
    return np.array(mem_bytes)


def generate_memory_scaling_plot():
    """Generates and saves the comparative memory scaling plot."""
    os.makedirs("../figures", exist_ok=True)
    fig_path = os.path.join("..", "figures", "milestone2_flash_attention_memory.png")

    N_vals = np.array([256, 512, 1024, 2048, 4096, 8192, 16384])
    std_mem = calculate_standard_attention_memory(N_vals)
    flash_mem = calculate_flash_attention_memory(N_vals)

    plt.figure(figsize=(10, 6))
    plt.plot(N_vals, std_mem, "r--o", label="Standard Attention ($O(N^2)$ HBM footprint)", linewidth=2.5, markersize=7)
    plt.plot(N_vals, flash_mem, "b-s", label="FlashAttention ($O(N)$ linear HBM footprint)", linewidth=2.5, markersize=7)

    # Highlight Out-Of-Memory (OOM) zone (e.g. 16GB / 24GB consumer GPU limit)
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

    plt.savefig(fig_path, dpi=300)
    plt.close()
    return fig_path, N_vals, std_mem, flash_mem


if __name__ == "__main__":
    path, Ns, std, fl = generate_memory_scaling_plot()
    print(f"Memory comparison plot saved to: {path}")
    print("\nSequence Length Memory Comparison (MB):")
    for n, s, f in zip(Ns, std, fl):
        print(f"N = {n:5d} | Standard: {s:10.1f} MB | FlashAttention: {f:8.1f} MB | Memory Reduction: {s/f:6.1f}x")
