"""Corrected Milestone 1 training script with all 7 bugs fixed."""
import copy

import torch
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

torch.manual_seed(0)

# Stand-in data so the script runs; the real X, y replace this line.
X, y = make_classification(10000, 40, n_informative=10, weights=[0.55], random_state=0)

# Bug 6: shuffled, stratified split, done first so nothing else sees the validation rows.
X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)

# Bug 5: fit the scaler on the training rows only, then apply it to both sets.
scaler = StandardScaler().fit(X_tr)
X_tr, X_val = scaler.transform(X_tr), scaler.transform(X_val)

# Bug 4: float32 features to match the model weights, int64 labels for CrossEntropyLoss.
X_tr = torch.tensor(X_tr, dtype=torch.float32)
X_val = torch.tensor(X_val, dtype=torch.float32)
y_tr = torch.tensor(y_tr, dtype=torch.long)
y_val = torch.tensor(y_val, dtype=torch.long)

# Bug 1: the DataLoader shuffles (x, y) pairs together, so features never lose their labels.
train_loader = DataLoader(TensorDataset(X_tr, y_tr), batch_size=64, shuffle=True)

# Bug 7: BatchNorm comes before ReLU and Dropout, so BN never sees dropout noise.
model = nn.Sequential(
    nn.Linear(40, 128), nn.BatchNorm1d(128), nn.ReLU(), nn.Dropout(0.5),
    nn.Linear(128, 2),
)
loss_fn = nn.CrossEntropyLoss()
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
scheduler = torch.optim.lr_scheduler.StepLR(opt, step_size=1, gamma=0.9)

# Early stopping: keep the weights with the lowest val loss, stop after 10 epochs without improvement.
patience = 10
best_val_loss = float("inf")
best_state = None
best_epoch = 0
epochs_without_improvement = 0
val_accs = []

for epoch in range(1, 51):
    model.train()
    for xb, yb in train_loader:
        loss = loss_fn(model(xb), yb)
        opt.zero_grad()
        loss.backward()
        opt.step()
    lr = scheduler.get_last_lr()[0]  # the LR used during this epoch
    scheduler.step()  # Bug 3: once per epoch, not once per batch

    # Bug 2: eval mode turns dropout off and makes BN use its running stats;
    # no_grad skips building a graph we never use.
    model.eval()
    with torch.no_grad():
        val_logits = model(X_val)
        val_loss = loss_fn(val_logits, y_val).item()
        val_acc = (val_logits.argmax(dim=1) == y_val).float().mean().item()
    val_accs.append(val_acc)
    print(f"epoch {epoch:2d}  lr {lr:.2e}  val loss {val_loss:.4f}  val acc {val_acc:.4f}")

    if val_loss < best_val_loss:
        best_val_loss = val_loss
        best_state = copy.deepcopy(model.state_dict())
        best_epoch = epoch
        epochs_without_improvement = 0
    else:
        epochs_without_improvement += 1
        if epochs_without_improvement >= patience:
            print(f"Stopping early: no val-loss improvement for {patience} epochs")
            break

model.load_state_dict(best_state)
best_acc = max(val_accs)
print(f"final val acc {val_accs[-1]:.4f} (epoch {len(val_accs)})")
print(f"best val acc  {best_acc:.4f} (epoch {val_accs.index(best_acc) + 1})")
print(f"restored checkpoint from epoch {best_epoch}: "
      f"val loss {best_val_loss:.4f}, val acc {val_accs[best_epoch - 1]:.4f}")
