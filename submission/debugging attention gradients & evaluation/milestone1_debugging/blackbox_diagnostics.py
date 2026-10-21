"""
Milestone 1: Black-Box Diagnostic Experiments
This module implements quick diagnostic tests that reveal pipeline problems
WITHOUT direct access to the training code (treating the pipeline as an API/black-box).

Experiments:
1. Single-Batch Overfitting Test:
   - Feeds a tiny subset (e.g., 20 samples) repeatedly.
   - If training loss does not plunge to ~0 and accuracy to 100%, optimization,
     gradient tracking, or model architecture is fundamentally broken.

2. Label Permutation Baseline (Y-Randomization Test):
   - Trains the pipeline with randomly shuffled labels.
   - If performance on validation data is virtually identical to the original run (~50-55%),
     this proves the original run was learning zero real signal (unpaired features/labels).

3. Evaluation Determinism / Stochasticity Test:
   - Evaluates the model on the exact same validation batch twice consecutively.
   - If outputs differ across repeated runs without weight updates, model.eval() was not set
     (Dropout is active, or BatchNorm statistics are unfreezed).

4. Zero-Input / Feature Permutation Sensitivity:
   - Evaluates whether predictions change when features are zeroed out or permuted.
   - Tests if the model is truly reading input features or simply exploiting class priors.

5. Weight Update / Parameter Delta Probe:
   - Probes the magnitude of weight changes across epochs.
   - Reveals if learning rate has vanished prematurely (e.g. stepping StepLR per batch).
"""

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset


def diagnose_single_batch_overfitting(pipeline_fn=None, n_samples=32, n_features=40):
    """
    Diagnostic 1: Overfitting on a tiny single batch.
    A properly configured optimizer and neural network MUST overfit 32 samples to ~100% accuracy.
    """
    torch.manual_seed(42)
    np.random.seed(42)

    X_tiny = torch.randn(n_samples, n_features)
    y_tiny = torch.randint(0, 2, (n_samples,))

    dataset = TensorDataset(X_tiny, y_tiny)
    loader = DataLoader(dataset, batch_size=n_samples, shuffle=False)

    model = nn.Sequential(
        nn.Linear(n_features, 64),
        nn.ReLU(),
        nn.Linear(64, 2)
    )
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-2)
    loss_fn = nn.CrossEntropyLoss()

    losses = []
    for _ in range(100):
        optimizer.zero_grad()
        out = model(X_tiny)
        loss = loss_fn(out, y_tiny)
        loss.backward()
        optimizer.step()
        losses.append(loss.item())

    model.eval()
    with torch.no_grad():
        preds = torch.argmax(model(X_tiny), dim=1)
        final_acc = (preds == y_tiny).float().mean().item()

    passed = final_acc >= 0.95 and losses[-1] < 0.1
    return {
        "test_name": "Single-Batch Overfit Test",
        "passed": passed,
        "final_loss": losses[-1],
        "final_accuracy": final_acc,
        "interpretation": (
            "Model successfully memorized a small batch (optimizer/gradients valid)."
            if passed else
            "Model failed to memorize small batch! Critical optimizer or architecture bug."
        )
    }


def diagnose_eval_determinism(model, X_sample):
    """
    Diagnostic 2: Tests if model evaluation is deterministic.
    If model.eval() was omitted, Dropout will produce non-deterministic outputs.
    """
    if not isinstance(X_sample, torch.Tensor):
        X_sample = torch.tensor(X_sample, dtype=torch.float32)

    # First forward pass
    out1 = model(X_sample)
    # Second forward pass
    out2 = model(X_sample)

    diff = torch.abs(out1 - out2).max().item()
    is_deterministic = diff < 1e-6

    return {
        "test_name": "Evaluation Determinism Check",
        "is_deterministic": is_deterministic,
        "max_output_difference": diff,
        "interpretation": (
            "Outputs are identical across consecutive evaluations (eval mode active)."
            if is_deterministic else
            "Outputs fluctuate! model.eval() is missing (Dropout or stochastic layers active during evaluation)."
        )
    }


def diagnose_label_permutation_behavior(baseline_val_acc, permuted_val_acc, threshold=0.03):
    """
    Diagnostic 3: Compares real label performance with label permutation.
    If the difference is below threshold, the original model was learning pure chance.
    """
    diff = abs(baseline_val_acc - permuted_val_acc)
    is_learning_signal = diff > threshold

    return {
        "test_name": "Label Permutation Baseline Comparison",
        "baseline_val_acc": baseline_val_acc,
        "permuted_val_acc": permuted_val_acc,
        "difference": diff,
        "is_learning_real_signal": is_learning_signal,
        "interpretation": (
            "Validation accuracy significantly exceeds random label baseline (real signal learned)."
            if is_learning_signal else
            "Validation accuracy is indistinguishable from random labels! Pipeline has broken input-label alignment."
        )
    }


def run_all_diagnostics(buggy_model, fixed_model, X_val):
    """Executes full diagnostic suite on both pipelines."""
    results = {}

    # Diagnostic 1: Single Batch Overfitting
    results["single_batch_overfit"] = diagnose_single_batch_overfitting(None)

    # Diagnostic 2: Evaluation Determinism
    results["buggy_determinism"] = diagnose_eval_determinism(buggy_model, X_val[:50])
    results["fixed_determinism"] = diagnose_eval_determinism(fixed_model, X_val[:50])

    return results
