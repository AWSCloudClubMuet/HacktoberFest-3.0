"""
Milestone 1: Debugging a Silently Failing Training Run
Demonstrates the buggy behavior vs. the corrected implementation,
along with quick black-box diagnostic experiments.
"""

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split


def create_synthetic_data(n_samples=10000, n_features=40, random_state=42):
    """
    Generates a synthetic binary classification dataset with realistic signal.
    """
    np.random.seed(random_state)
    # Generate 40 features
    X = np.random.randn(n_samples, n_features).astype(np.float32)
    # True weights for first 10 features, remaining 30 are noise
    weights = np.zeros(n_features, dtype=np.float32)
    weights[:10] = np.random.uniform(0.5, 1.5, size=10)
    # Target probability with sigmoid
    logits = X @ weights
    probs = 1.0 / (1.0 + np.exp(-logits))
    y = (probs > 0.5).astype(np.int64)
    return X, y


def accuracy(logits, targets):
    preds = torch.argmax(logits, dim=1)
    if isinstance(targets, np.ndarray):
        targets = torch.tensor(targets)
    return (preds == targets).float().mean().item()


def run_buggy_pipeline(X, y):
    print("=" * 60)
    print("RUNNING BUGGY PIPELINE (Demonstration of Failure)")
    print("=" * 60)
    
    # Bug 1: Fitting scaler before train/val split (Data Leakage)
    X_scaled = StandardScaler().fit_transform(X)
    
    # Split
    X_tr, X_val = X_scaled[:8000], X_scaled[8000:]
    y_tr, y_val = y[:8000], y[8000:]
    
    # Bug 2: Shuffling X_tr in-place WITHOUT shuffling y_tr!
    # This decouples features from labels!
    X_tr_copy = X_tr.copy()
    np.random.shuffle(X_tr_copy)
    
    train_ds = TensorDataset(torch.tensor(X_tr_copy, dtype=torch.float32), 
                             torch.tensor(y_tr, dtype=torch.long))
    train_loader = DataLoader(train_ds, batch_size=64)
    
    # Bug 3: Dropout before BatchNorm
    model = nn.Sequential(
        nn.Linear(40, 128),
        nn.ReLU(),
        nn.Dropout(0.5),
        nn.BatchNorm1d(128),
        nn.Linear(128, 2)
    )
    
    loss_fn = nn.CrossEntropyLoss()
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    scheduler = torch.optim.lr_scheduler.StepLR(opt, step_size=1, gamma=0.9)
    
    for epoch in range(1, 6): # run 5 epochs to demonstrate
        model.train()
        train_loss = 0.0
        for xb, yb in train_loader:
            opt.zero_grad()
            out = model(xb)
            loss = loss_fn(out, yb)
            loss.backward()
            opt.step()
            # Bug 4: scheduler.step() inside inner batch loop!
            scheduler.step()
            train_loss += loss.item()
            
        train_loss /= len(train_loader)
        
        # Bug 5: Missing model.eval() and torch.no_grad()
        # Dropout stays on, BatchNorm uses val batch stats
        val_logits = model(torch.tensor(X_val, dtype=torch.float32))
        val_acc = accuracy(val_logits, y_val)
        current_lr = opt.param_groups[0]['lr']
        print(f"Epoch {epoch:2d} | Train Loss: {train_loss:.4f} | "
              f"Val Acc: {val_acc*100:.2f}% | Current LR: {current_lr:.3e}")


def run_corrected_pipeline(X, y):
    print("\n" + "=" * 60)
    print("RUNNING CORRECTED PIPELINE (All Fixes Applied)")
    print("=" * 60)
    
    # Fix 1: Split BEFORE scaling (prevents data leakage)
    X_tr, X_val, y_tr, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    scaler = StandardScaler()
    X_tr = scaler.fit_transform(X_tr)
    X_val = scaler.transform(X_val) # only transform validation set!
    
    # Fix 2: Keep features and labels synchronized!
    # DataLoader handles random shuffling safely every epoch
    train_ds = TensorDataset(torch.tensor(X_tr, dtype=torch.float32), 
                             torch.tensor(y_tr, dtype=torch.long))
    train_loader = DataLoader(train_ds, batch_size=64, shuffle=True)
    
    # Fix 3: Proper layer order: Linear -> BatchNorm -> ReLU -> Dropout
    model = nn.Sequential(
        nn.Linear(40, 128),
        nn.BatchNorm1d(128),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(128, 2)
    )
    
    loss_fn = nn.CrossEntropyLoss()
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    scheduler = torch.optim.lr_scheduler.StepLR(opt, step_size=5, gamma=0.5)
    
    X_val_tensor = torch.tensor(X_val, dtype=torch.float32)
    
    for epoch in range(1, 6):
        model.train()
        train_loss = 0.0
        for xb, yb in train_loader:
            opt.zero_grad()
            out = model(xb)
            loss = loss_fn(out, yb)
            loss.backward()
            opt.step()
            train_loss += loss.item()
            
        # Fix 4: scheduler.step() called ONCE per epoch!
        scheduler.step()
        train_loss /= len(train_loader)
        
        # Fix 5: Set model to eval mode and disable gradient calculation
        model.eval()
        with torch.no_grad():
            val_logits = model(X_val_tensor)
            val_acc = accuracy(val_logits, y_val)
            
        current_lr = opt.param_groups[0]['lr']
        print(f"Epoch {epoch:2d} | Train Loss: {train_loss:.4f} | "
              f"Val Acc: {val_acc*100:.2f}% | Current LR: {current_lr:.3e}")


def run_blackbox_diagnostics(X, y):
    print("\n" + "=" * 60)
    print("BLACK-BOX PIPELINE DIAGNOSTICS (Without Reading Model Code)")
    print("=" * 60)
    
    # Test 1: Single-Batch Overfitting Test
    print("[Diagnostic 1] Single Batch Overfit Test:")
    single_x = torch.tensor(X[:32], dtype=torch.float32)
    single_y = torch.tensor(y[:32], dtype=torch.long)
    toy_model = nn.Sequential(nn.Linear(40, 64), nn.ReLU(), nn.Linear(64, 2))
    opt = torch.optim.Adam(toy_model.parameters(), lr=0.01)
    loss_fn = nn.CrossEntropyLoss()
    for step in range(50):
        opt.zero_grad()
        loss = loss_fn(toy_model(single_x), single_y)
        loss.backward()
        opt.step()
    toy_acc = accuracy(toy_model(single_x), single_y)
    print(f" -> 32-sample batch overfit accuracy after 50 steps: {toy_acc*100:.1f}% "
          f"(Loss: {loss.item():.4f})")
    if toy_acc > 0.95:
        print("    PASS: Architecture and optimizer can learn signal.")
    else:
        print("    FAIL: Fundamental architecture or optimization bug.")

    # Test 2: Eval Mode Stochasticity Test
    print("\n[Diagnostic 2] Model Determinism / Eval Mode Check:")
    buggy_model = nn.Sequential(nn.Linear(40, 128), nn.ReLU(), nn.Dropout(0.5))
    test_input = torch.randn(10, 40)
    out1 = buggy_model(test_input)
    out2 = buggy_model(test_input)
    diff = (out1 - out2).abs().max().item()
    print(f" -> Max difference between two back-to-back inferences without eval(): {diff:.4f}")
    if diff > 1e-5:
        print("    DETECTED: Model has active stochasticity (e.g., Dropout) during evaluation!")
        
    buggy_model.eval()
    out1_eval = buggy_model(test_input)
    out2_eval = buggy_model(test_input)
    diff_eval = (out1_eval - out2_eval).abs().max().item()
    print(f" -> Max difference between inferences WITH eval(): {diff_eval:.4f}")
    if diff_eval == 0.0:
        print("    PASS: Evaluation is fully deterministic in eval() mode.")


X, y = create_synthetic_data(10000, 40)
run_buggy_pipeline(X, y)
run_corrected_pipeline(X, y)
run_blackbox_diagnostics(X, y)
