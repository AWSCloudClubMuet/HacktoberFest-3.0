import numpy as np
import torch
import torch.nn as nn
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader, TensorDataset

# Reproducibility
np.random.seed(42)
torch.manual_seed(42)

# Example binary classification dataset
n_samples = 10_000
n_features = 40

X = np.random.randn(n_samples, n_features).astype(np.float32)
true_weights = np.random.randn(n_features)
logits = X @ true_weights
y = (logits > np.median(logits)).astype(np.int64)

# Split before fitting the scaler to avoid data leakage
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train).astype(np.float32)
X_val = scaler.transform(X_val).astype(np.float32)

# Convert to tensors
X_train = torch.from_numpy(X_train)
X_val = torch.from_numpy(X_val)
y_train = torch.from_numpy(y_train)
y_val = torch.from_numpy(y_val)

train_loader = DataLoader(
    TensorDataset(X_train, y_train),
    batch_size=128,
    shuffle=True
)

# Model: BatchNorm before Dropout
model = nn.Sequential(
    nn.Linear(n_features, 128),
    nn.BatchNorm1d(128),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(128, 2)
)

loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

# Step the scheduler once per epoch
scheduler = torch.optim.lr_scheduler.StepLR(
    optimizer, step_size=1, gamma=0.9
)

for epoch in range(20):
    model.train()
    total_loss = 0.0

    for xb, yb in train_loader:
        optimizer.zero_grad()
        outputs = model(xb)
        loss = loss_fn(outputs, yb)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * xb.size(0)

    scheduler.step()

    model.eval()
    with torch.no_grad():
        val_logits = model(X_val)
        val_loss = loss_fn(val_logits, y_val).item()
        val_predictions = val_logits.argmax(dim=1)
        val_accuracy = (val_predictions == y_val).float().mean().item()

    print(
        f"Epoch {epoch + 1:02d} | "
        f"Train Loss: {total_loss / len(X_train):.4f} | "
        f"Val Loss: {val_loss:.4f} | "
        f"Val Accuracy: {val_accuracy:.3f}"
    )
