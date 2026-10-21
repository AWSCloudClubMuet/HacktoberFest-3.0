
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    average_precision_score,
    precision_score,
    recall_score,
    confusion_matrix,
)
from sklearn.preprocessing import StandardScaler

np.random.seed(42)

# Synthetic transaction data: 20,000 transactions, 0.1% fraud
n = 20_000
fraud_count = int(n * 0.001)

# Generate timestamps in chronological order
timestamps = np.arange(n)

# Simulate transaction features
X = np.random.randn(n, 5)

# Assign 20 fraudulent transactions
y = np.zeros(n, dtype=int)
fraud_indices = np.random.choice(n, fraud_count, replace=False)
y[fraud_indices] = 1

# Add a detectable pattern to fraud transactions
X[fraud_indices, 0] += 3.0
X[fraud_indices, 1] += 2.0

# Simulate temporal drift in later transactions
drift_start = int(n * 0.7)
X[drift_start:, 2] += 0.5

# Chronological split: 60% train, 20% validation, 20% test
train_end = int(n * 0.6)
val_end = int(n * 0.8)

X_train, y_train = X[:train_end], y[:train_end]
X_val, y_val = X[train_end:val_end], y[train_end:val_end]
X_test, y_test = X[val_end:], y[val_end:]

# Demonstration only: real systems must train on mature labels
# available at the historical training cutoff.
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_val = scaler.transform(X_val)
X_test = scaler.transform(X_test)

model = RandomForestClassifier(
    n_estimators=100,
    class_weight="balanced",
    random_state=42,
)
model.fit(X_train, y_train)

# Select threshold on validation data by minimizing stated costs
val_scores = model.predict_proba(X_val)[:, 1]
candidates = np.linspace(0.01, 0.99, 99)

best_threshold = 0.5
best_cost = float("inf")

for threshold in candidates:
    pred = (val_scores >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(
        y_val, pred, labels=[0, 1]
    ).ravel()
    cost = 200 * fn + 5 * fp

    if cost < best_cost:
        best_cost = cost
        best_threshold = threshold

# Evaluate only once on the held-out test period
test_scores = model.predict_proba(X_test)[:, 1]
test_pred = (test_scores >= best_threshold).astype(int)

tn, fp, fn, tp = confusion_matrix(
    y_test, test_pred, labels=[0, 1]
).ravel()

print("=== Fraud Detection Evaluation ===")
print(f"Overall fraud prevalence: {y.mean():.3%}")
print(f"Training transactions: {len(y_train)}")
print(f"Validation transactions: {len(y_val)}")
print(f"Test transactions: {len(y_test)}")
print(f"Validation-selected threshold: {best_threshold:.2f}")
print(f"Test PR-AUC (average precision): "
      f"{average_precision_score(y_test, test_scores):.4f}")
print(f"Test precision: "
      f"{precision_score(y_test, test_pred, zero_division=0):.4f}")
print(f"Test recall: "
      f"{recall_score(y_test, test_pred, zero_division=0):.4f}")
print(f"True positives: {tp}")
print(f"False positives: {fp}")
print(f"False negatives: {fn}")
print(f"True negatives: {tn}")
print(f"Test cost ($): {200 * fn + 5 * fp}")

print("\nNote: This is a synthetic demonstration.")
print("Delayed-label maturity and realistic temporal drift")
print("must be handled explicitly in a production evaluation.")
