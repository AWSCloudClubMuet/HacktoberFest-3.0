"""Corrected PyTorch binary classifier example.

Run:
    python milestone1/train_classifier.py --synthetic

For real data, call run_training(X, y) with X shaped (N, 40) and y
containing integer class labels 0/1. Replace the split strategy when
the data are temporal or grouped by account/customer.
"""
import argparse
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score,
    average_precision_score, roc_auc_score,
)


def make_synthetic(seed=42, n=10_000, d=40):
    """Create reproducible synthetic data for a runnable smoke test."""
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n, d)).astype(np.float32)
    w = rng.normal(size=d)
    logits = X @ w / np.sqrt(d)
    probs = 1 / (1 + np.exp(-logits))
    y = (rng.random(n) < probs).astype(np.int64)
    return X, y


def run_training(X, y, epochs=50, seed=42):
    np.random.seed(seed)
    torch.manual_seed(seed)
    X = np.asarray(X, dtype=np.float32)
    y = np.asarray(y).reshape(-1).astype(np.int64)

    if X.ndim != 2 or X.shape[1] != 40:
        raise ValueError("Expected X with shape (N, 40).")
    if len(X) != len(y):
        raise ValueError("X and y must have the same number of rows.")
    if not np.isfinite(X).all():
        raise ValueError("X contains NaN or infinite values.")
    if not set(np.unique(y)).issubset({0, 1}):
        raise ValueError("Expected integer labels 0 and 1.")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    X_tr, X_val, y_tr, y_val = train_test_split(
        X, y, test_size=0.20, random_state=seed, stratify=y
    )

    scaler = StandardScaler()
    X_tr = scaler.fit_transform(X_tr).astype(np.float32)
    X_val = scaler.transform(X_val).astype(np.float32)

    train_ds = TensorDataset(torch.from_numpy(X_tr), torch.from_numpy(y_tr))
    train_loader = DataLoader(train_ds, batch_size=128, shuffle=True)
    X_val_t = torch.from_numpy(X_val).to(device)
    y_val_t = torch.from_numpy(y_val).to(device)

    model = nn.Sequential(
        nn.Linear(40, 128),
        nn.BatchNorm1d(128),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(128, 2),
    ).to(device)

    loss_fn = nn.CrossEntropyLoss()
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    scheduler = torch.optim.lr_scheduler.StepLR(opt, step_size=1, gamma=0.9)

    for epoch in range(epochs):
        model.train()
        total_loss, seen = 0.0, 0
        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device)
            opt.zero_grad(set_to_none=True)
            logits = model(xb)
            loss = loss_fn(logits, yb)
            loss.backward()
            opt.step()
            total_loss += loss.item() * len(yb)
            seen += len(yb)

        # Step once per epoch, not once per minibatch.
        scheduler.step()

        model.eval()
        with torch.inference_mode():
            val_logits = model(X_val_t)
            val_loss = loss_fn(val_logits, y_val_t).item()
            probs = val_logits.softmax(dim=1)[:, 1].cpu().numpy()
            preds = val_logits.argmax(dim=1).cpu().numpy()

        metrics = {
            "epoch": epoch + 1,
            "train_loss": total_loss / seen,
            "val_loss": val_loss,
            "accuracy": accuracy_score(y_val, preds),
            "balanced_accuracy": balanced_accuracy_score(y_val, preds),
            "pr_auc": average_precision_score(y_val, probs),
            "roc_auc": roc_auc_score(y_val, probs),
            "learning_rate": opt.param_groups[0]["lr"],
        }
        print(" | ".join(f"{k}={v:.5f}" if isinstance(v, (float, np.floating))
                         else f"{k}={v}" for k, v in metrics.items()))

    return model, scaler


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--synthetic", action="store_true",
                        help="Run a smoke test on generated data.")
    args = parser.parse_args()
    if not args.synthetic:
        parser.error("Use --synthetic for demo data, or import run_training(X, y).")
    X, y = make_synthetic()
    run_training(X, y)
