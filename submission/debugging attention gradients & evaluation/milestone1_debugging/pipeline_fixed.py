"""
Milestone 1: Fixed Training Pipeline
Corrected PyTorch training pipeline, fixing all identified bugs:
1. Prevents Data Leakage: Scaler is fit exclusively on X_tr, then transforms X_val.
2. Synchronized Shuffling: Targets and inputs remain paired; shuffling delegated to DataLoader.
3. Proper Learning Rate Scheduling: StepLR stepped once per epoch.
4. Correct Evaluation Mode: model.eval() toggled during validation to disable Dropout and freeze BatchNorm.
5. Gradient Disabling: torch.no_grad() used during inference to avoid computation graph overhead.
6. Correct Architecture Layer Order: Linear -> BatchNorm1d -> ReLU -> Dropout -> Linear.
7. Explicit Dtype & Device Management: Guarantees float32 tensors and device consistency.
8. Stratified Data Splitting: Preserves label distribution across splits.
"""

import sys
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
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


class FixedClassifier(nn.Module):
    """
    Corrected Neural Network Architecture for Tabular Data:
    Layer Order: Linear -> BatchNorm1d -> ReLU -> Dropout -> Linear
    Placing BatchNorm BEFORE Dropout avoids the variance-shift problem
    where Dropout corrupts the running variance estimation of BatchNorm.
    """
    def __init__(self, in_features=40, hidden_dim=128, num_classes=2, dropout_p=0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout_p),
            nn.Linear(hidden_dim, num_classes),
        )

    def forward(self, x):
        return self.net(x)


def compute_metrics(model, data_loader, loss_fn, device="cpu"):
    """
    Evaluates loss and accuracy with model.eval() and torch.no_grad().
    Ensures deterministic, leak-free evaluation.
    """
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for xb, yb in data_loader:
            xb, yb = xb.to(device), yb.to(device)
            logits = model(xb)
            loss = loss_fn(logits, yb)
            total_loss += loss.item() * xb.size(0)
            preds = torch.argmax(logits, dim=1)
            correct += (preds == yb).sum().item()
            total += xb.size(0)

    avg_loss = total_loss / max(total, 1)
    avg_acc = correct / max(total, 1)
    return avg_loss, avg_acc


def run_fixed_pipeline(epochs=6, batch_size=64, n_samples=2500, lr=1e-3, gamma=0.9, seed=42, device=None, verbose=True):
    """
    Runs the fully corrected training pipeline.
    Returns:
        model: Trained PyTorch model
        history: Dictionary containing training and validation loss, accuracy, and learning rates
    """
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    np.random.seed(seed)
    torch.manual_seed(seed)

    # 1. Generate data
    X, y = generate_synthetic_data(n_samples=n_samples, n_features=40, random_state=seed)

    # 2. Stratified train/val split BEFORE scaling (prevents data leakage)
    X_tr_raw, X_val_raw, y_tr, y_val = train_test_split(
        X, y, test_size=0.2, random_state=seed, stratify=y
    )

    # 3. Fit scaler ONLY on training data; transform both
    scaler = StandardScaler()
    X_tr = scaler.fit_transform(X_tr_raw)
    X_val = scaler.transform(X_val_raw)

    # 4. Prepare PyTorch Datasets & DataLoaders with paired, synchronized shuffling
    train_dataset = TensorDataset(
        torch.tensor(X_tr, dtype=torch.float32),
        torch.tensor(y_tr, dtype=torch.long)
    )
    val_dataset = TensorDataset(
        torch.tensor(X_val, dtype=torch.float32),
        torch.tensor(y_val, dtype=torch.long)
    )

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    # 5. Initialize Model, Optimizer, Loss Function, and Scheduler
    model = FixedClassifier(in_features=40, hidden_dim=128, num_classes=2, dropout_p=0.3).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    loss_fn = nn.CrossEntropyLoss()

    # StepLR: decayed once per epoch, step_size=2 epochs
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=2, gamma=gamma)

    history = {
        "epochs": [],
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": [],
        "lr": [],
    }

    for epoch in range(epochs):
        # Training Phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device)

            optimizer.zero_grad()
            logits = model(xb)
            loss = loss_fn(logits, yb)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * xb.size(0)
            preds = torch.argmax(logits, dim=1)
            train_correct += (preds == yb).sum().item()
            train_total += xb.size(0)

        # Scheduler stepped ONCE PER EPOCH (outside the batch loop)
        scheduler.step()

        # Evaluation Phase with model.eval() and torch.no_grad()
        epoch_train_loss = train_loss / max(train_total, 1)
        epoch_train_acc = train_correct / max(train_total, 1)
        val_loss, val_acc = compute_metrics(model, val_loader, loss_fn, device=device)
        current_lr = optimizer.param_groups[0]["lr"]

        history["epochs"].append(epoch)
        history["train_loss"].append(epoch_train_loss)
        history["train_acc"].append(epoch_train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)
        history["lr"].append(current_lr)

        if verbose:
            print(f"  [Fixed] Epoch {epoch:2d} | Tr Loss: {epoch_train_loss:.4f} | Tr Acc: {epoch_train_acc:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f} | LR: {current_lr:.2e}", flush=True)

    return model, history


if __name__ == "__main__":
    model, hist = run_fixed_pipeline(epochs=4)
