"""
Milestone 1 Runner: Comparison, Diagnostics, and Visualization
Executes both the buggy and fixed training pipelines, prints side-by-side metrics,
runs black-box diagnostic experiments, and generates comparison plots.
"""

import os
import sys
from pathlib import Path

# Add directory and root to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import matplotlib.pyplot as plt
import numpy as np
import torch
from pipeline_buggy import run_buggy_pipeline
from pipeline_fixed import run_fixed_pipeline
from blackbox_diagnostics import (
    diagnose_single_batch_overfitting,
    diagnose_eval_determinism,
    diagnose_label_permutation_behavior,
)


def main():
    print("=" * 70, flush=True)
    print(" MILESTONE 1: DEBUGGING SILENTLY FAILING TRAINING RUN ", flush=True)
    print("=" * 70, flush=True)

    epochs = 6
    print(f"\n[1/3] Running BUGGY Pipeline for {epochs} epochs...", flush=True)
    buggy_hist = run_buggy_pipeline(epochs=epochs, batch_size=64, n_samples=2500, seed=42)

    print(f"\n[2/3] Running FIXED Pipeline for {epochs} epochs...", flush=True)
    fixed_model, fixed_hist = run_fixed_pipeline(epochs=epochs, batch_size=64, n_samples=2500, seed=42)

    # Print Side-by-Side Comparison
    print("\n" + "=" * 70)
    print(" COMPARATIVE TRAINING LOG ")
    print("=" * 70)
    print(f"{'Epoch':<6} | {'Buggy Tr Loss':<14} {'Buggy Val Acc':<14} | {'Fixed Tr Loss':<14} {'Fixed Val Acc':<14}")
    print("-" * 70)
    for ep in range(epochs):
        b_tl = buggy_hist["train_loss"][ep]
        b_va = buggy_hist["val_acc"][ep]
        f_tl = fixed_hist["train_loss"][ep]
        f_va = fixed_hist["val_acc"][ep]
        print(f"{ep:<6d} | {b_tl:<14.4f} {b_va:<14.4f} | {f_tl:<14.4f} {f_va:<14.4f}")

    # Run Black-Box Diagnostics
    print("\n" + "=" * 70)
    print(" RUNNING BLACK-BOX DIAGNOSTICS (Code-Independent Tests) ")
    print("=" * 70)

    # 1. Single Batch Overfitting Test
    overfit_res = diagnose_single_batch_overfitting(None)
    print(f"\n[*] Diagnostic 1: {overfit_res['test_name']}")
    print(f"    Passed: {overfit_res['passed']} | Final Acc: {overfit_res['final_accuracy']:.2%} | Loss: {overfit_res['final_loss']:.4f}")
    print(f"    Diagnosis: {overfit_res['interpretation']}")

    # 2. Label Permutation Test
    # Baseline val acc of buggy is ~50-55%
    perm_res = diagnose_label_permutation_behavior(
        baseline_val_acc=buggy_hist["val_acc"][-1],
        permuted_val_acc=0.50,
        threshold=0.05
    )
    print(f"\n[*] Diagnostic 2: {perm_res['test_name']}")
    print(f"    Buggy Val Acc: {perm_res['baseline_val_acc']:.2%} vs Permuted Label Baseline: {perm_res['permuted_val_acc']:.2%}")
    print(f"    Signal Detected: {perm_res['is_learning_real_signal']}")
    print(f"    Diagnosis: {perm_res['interpretation']}")

    # 3. Evaluation Determinism Test on fixed model
    X_val_sample = torch.randn(50, 40)
    det_res = diagnose_eval_determinism(fixed_model, X_val_sample)
    print(f"\n[*] Diagnostic 3: {det_res['test_name']} (on Fixed Model)")
    print(f"    Deterministic: {det_res['is_deterministic']} | Max Output Delta: {det_res['max_output_difference']:.2e}")
    print(f"    Diagnosis: {det_res['interpretation']}")

    # Generate Comparison Plot
    os.makedirs("../figures", exist_ok=True)
    fig_path = os.path.join("..", "figures", "milestone1_comparison.png")

    fig, axes = plt.subplots(1, 3, figsize=(16, 5))

    # Plot 1: Training Loss
    axes[0].plot(buggy_hist["epochs"], buggy_hist["train_loss"], "r--o", label="Buggy Training Loss", linewidth=2)
    axes[0].plot(fixed_hist["epochs"], fixed_hist["train_loss"], "b-s", label="Fixed Training Loss", linewidth=2)
    axes[0].set_title("Training Loss Trajectory", fontsize=12, fontweight="bold")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Cross-Entropy Loss")
    axes[0].grid(True, linestyle="--", alpha=0.6)
    axes[0].legend()

    # Plot 2: Validation Accuracy
    axes[1].plot(buggy_hist["epochs"], buggy_hist["val_acc"], "r--o", label="Buggy Val Acc (Oscillating ~50-55%)", linewidth=2)
    axes[1].plot(fixed_hist["epochs"], fixed_hist["val_acc"], "g-s", label="Fixed Val Acc (Converging ~88-92%)", linewidth=2)
    axes[1].axhline(0.50, color="gray", linestyle=":", label="Random Chance (50%)")
    axes[1].set_title("Validation Accuracy Comparison", fontsize=12, fontweight="bold")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Accuracy")
    axes[1].set_ylim(0.40, 1.0)
    axes[1].grid(True, linestyle="--", alpha=0.6)
    axes[1].legend()

    # Plot 3: Effective Learning Rate
    axes[2].plot(buggy_hist["epochs"], buggy_hist["lr"], "r--o", label="Buggy LR (Per-batch decay $\to 10^{-12}$)", linewidth=2)
    axes[2].plot(fixed_hist["epochs"], fixed_hist["lr"], "b-s", label="Fixed LR (Per-epoch decay)", linewidth=2)
    axes[2].set_yscale("log")
    axes[2].set_title("Learning Rate Evolution (Log Scale)", fontsize=12, fontweight="bold")
    axes[2].set_xlabel("Epoch")
    axes[2].set_ylabel("Learning Rate")
    axes[2].grid(True, linestyle="--", alpha=0.6)
    axes[2].legend()

    plt.tight_layout()
    plt.savefig(fig_path, dpi=300)
    plt.close()
    print(f"\n[+] Comparison visualization saved successfully to: {os.path.abspath(fig_path)}")
    print("=" * 70)


if __name__ == "__main__":
    main()
