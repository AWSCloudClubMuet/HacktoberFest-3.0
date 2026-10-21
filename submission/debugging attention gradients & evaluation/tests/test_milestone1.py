"""
Unit and Integration Tests for Milestone 1 (PyTorch Debugging)
"""

import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import pytest
import torch
import numpy as np
from sklearn.preprocessing import StandardScaler
from milestone1_debugging.pipeline_fixed import run_fixed_pipeline, FixedClassifier, compute_metrics
from milestone1_debugging.blackbox_diagnostics import diagnose_eval_determinism, diagnose_single_batch_overfitting


def test_fixed_pipeline_convergence():
    """Verify that the fixed pipeline successfully trains and achieves > 80% validation accuracy."""
    model, hist = run_fixed_pipeline(epochs=5, batch_size=64, n_samples=1500, seed=42, verbose=False)
    final_val_acc = hist["val_acc"][-1]
    final_tr_loss = hist["train_loss"][-1]

    assert final_val_acc >= 0.80, f"Expected val accuracy >= 80%, got {final_val_acc:.2%}"
    assert final_tr_loss < hist["train_loss"][0], "Expected training loss to decrease across epochs"


def test_data_leakage_prevention():
    """Verify that fitting the scaler exclusively on X_tr produces different statistics than whole X."""
    np.random.seed(42)
    X_tr = np.random.randn(800, 10) + 2.0  # mean ~2
    X_val = np.random.randn(200, 10) + 10.0 # mean ~10 (out of distribution)

    scaler_leak = StandardScaler().fit(np.vstack([X_tr, X_val]))
    scaler_clean = StandardScaler().fit(X_tr)

    assert not np.allclose(scaler_leak.mean_, scaler_clean.mean_, atol=0.5), (
        "Clean scaler mean should strictly reflect X_tr only, not contaminated with X_val."
    )


def test_eval_mode_determinism():
    """Verify that in eval mode, the network produces identical deterministic outputs."""
    torch.manual_seed(42)
    model = FixedClassifier(in_features=40, hidden_dim=64, dropout_p=0.5)
    model.eval()

    x = torch.randn(20, 40)
    with torch.no_grad():
        out1 = model(x)
        out2 = model(x)

    diff = torch.abs(out1 - out2).max().item()
    assert diff < 1e-6, f"Outputs in eval mode must be deterministic! Max difference: {diff}"


def test_single_batch_overfit():
    """Verify that optimizer and gradient tracking can memorize a small batch."""
    res = diagnose_single_batch_overfitting(None, n_samples=32, n_features=40)
    assert res["passed"], f"Single batch overfit test failed: {res}"


def test_architecture_layer_order():
    """Verify that BatchNorm is placed before Dropout in FixedClassifier."""
    model = FixedClassifier()
    layer_types = [layer.__class__.__name__ for layer in model.net]
    bn_idx = layer_types.index("BatchNorm1d")
    dropout_idx = layer_types.index("Dropout")

    assert bn_idx < dropout_idx, "BatchNorm1d must precede Dropout to avoid variance shift!"
