"""
Milestone 1: Buggy Training Pipeline Reproduction
Reproduces the exact bugs in the provided snippet and demonstrates the symptoms:
- Falling training loss
- Validation accuracy oscillating near 50-55% (chance level for binary classification)
- Frozen weights due to decaying learning rate per batch (dropping to ~1e-15)
- Corrupted evaluation due to missing model.eval() and active Dropout/BatchNorm
"""

import sys
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import make_classification


def generate_synthetic_data(n_samples=2500, n_features=40, random_state=42):
    """Generate synthetic tabular binary classification data."""
    X, y = make_classification(
        n_samples=n_samples,
        n_features=n_features,
        n_informative=25,
        n_redundant=10,
        n_classes=2,
        weights=[0.5, 0.5],
        flip_y=0.01,
        random_state=random_state,
    )
    return X, y


def accuracy(logits, y_true):
    """Compute accuracy from 2-class logits and true labels."""
    preds = torch.argmax(logits, dim=1).detach().cpu().numpy()
    if isinstance(y_true, torch.Tensor):
        y_true = y_true.detach().cpu().numpy()
    return float((preds == y_true).mean())


def run_buggy_pipeline(epochs=6, batch_size=64, n_samples=2500, seed=42, verbose=True):
    """
    Executes the training loop as written in the GitHub issue to observe symptoms.
    Returns:
        history: dict containing train_losses, val_accuracies, and learning_rates
    """
    np.random.seed(seed)
    torch.manual_seed(seed)

    X, y = generate_synthetic_data(n_samples=n_samples, n_features=40, random_state=seed)

    # --- BUG 1: Data Leakage in Preprocessing ---
    # StandardScaler fit on the ENTIRE dataset before splitting
    X = StandardScaler().fit_transform(X)

    # --- BUG 8: Non-stratified sequential slice ---
    split_idx = int(n_samples * 0.8)
    X_tr, X_val = X[:split_idx], X[split_idx:]
    y_tr, y_val = y[:split_idx], y[split_idx:]

    # --- BUG 2: Unsynchronized Shuffle ---
    # Only X_tr is shuffled; y_tr is untouched! Destroys feature-label alignment.
    np.random.shuffle(X_tr)

    # DataLoader for training
    train_dataset = TensorDataset(torch.tensor(X_tr, dtype=torch.float32), torch.tensor(y_tr, dtype=torch.long))
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

    # --- BUG 6: Layer Ordering (BatchNorm after Dropout) ---
    model = nn.Sequential(
        nn.Linear(40, 128),
        nn.ReLU(),
        nn.Dropout(0.5),
        nn.BatchNorm1d(128),
        nn.Linear(128, 2),
    )

    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.CrossEntropyLoss()

    # StepLR with step_size=1, gamma=0.9
    scheduler = torch.optim.lr_scheduler.StepLR(opt, step_size=1, gamma=0.9)

    history = {"epochs": [], "train_loss": [], "val_acc": [], "lr": []}

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        n_batches = 0

        for xb, yb in train_loader:
            opt.zero_grad()
            out = model(xb)
            loss = loss_fn(out, yb)
            loss.backward()
            opt.step()

            # --- BUG 3: Scheduler Stepped Per Batch Instead of Per Epoch ---
            scheduler.step()

            running_loss += loss.item()
            n_batches += 1

        epoch_train_loss = running_loss / max(n_batches, 1)

        # --- BUG 4 & 5: model.eval() and torch.no_grad() NOT used during validation ---
        # Dropout stays active; BatchNorm uses single batch stats
        # --- BUG 7: Tensor dtype / device inconsistency handled here via float32 ---
        val_logits = model(torch.tensor(X_val, dtype=torch.float32))
        val_acc = accuracy(val_logits, y_val)
        current_lr = opt.param_groups[0]["lr"]

        history["epochs"].append(epoch)
        history["train_loss"].append(epoch_train_loss)
        history["val_acc"].append(val_acc)
        history["lr"].append(current_lr)

        if verbose:
            print(f"  [Buggy] Epoch {epoch:2d} | Train Loss: {epoch_train_loss:.4f} | Val Acc: {val_acc:.4f} | LR: {current_lr:.2e}", flush=True)

    return history


if __name__ == "__main__":
    hist = run_buggy_pipeline(epochs=4)
