# Machine Learning Debugging, Gradients and Evaluation

**Author:** Nabeel Shahid  
**Project area:** Machine Learning Engineering, Deep Learning, Model Evaluation

## 1. Project overview

This project investigates four common machine-learning problems: a silently failing training pipeline, the mathematical backward pass of attention, unreliable fraud-model evaluation, and confusing learning curves.

The goal is not only to obtain a score. The goal is to determine whether the data pipeline, mathematical implementation, evaluation design, and model behavior can be trusted.

## 2. Training-pipeline debugging

The provided binary classifier shows decreasing training loss but validation accuracy close to 55%. The analysis identifies the causes, including broken feature-label alignment when only `X_tr` is shuffled, scaling before the train/validation split, validation in training mode, and learning-rate scheduling after every batch instead of every epoch.

The corrected approach uses a stratified split, training-only scaling, paired feature-label handling, `model.eval()`, `torch.no_grad()`, correct tensor dtypes, and an epoch-level scheduler step. Black-box tests such as the tiny-batch overfit test and shuffled-label test are also proposed.

## 3. Attention gradients

For single-head attention:

```text
S = QKᵀ/√d,     P = softmax(S),     O = PV
```

The project derives and implements:

- `dV = Pᵀ dO`
- `dP = dO Vᵀ`
- the row-wise softmax gradient `dS`
- `dQ = dS K/√d`
- `dK = dSᵀ Q/√d`

The NumPy implementation uses a numerically stable softmax and verifies the analytical gradients with central finite differences using step size `1e-6`. The project also explains the `1/√d` scaling factor, causal masks, O(n²) memory cost, and FlashAttention.

## 4. Fraud-detection evaluation

Fraud represents only 0.1% of transactions, labels arrive 30–60 days later, and fraud patterns change over time. Accuracy is therefore not a suitable primary metric because an all-normal classifier could achieve 99.9% accuracy while detecting no fraud.

The proposed evaluation uses precision, recall, PR-AUC, false-positive rate, fraud capture rate, and expected financial cost. It uses chronological train/validation/test splits and evaluates only transactions whose chargeback labels have matured.

Given a false-negative cost of $200 and a false-positive cost of $5, the theoretical cost threshold is:

```text
p > 5 / (200 + 5) = 0.0244
```

Therefore, the starting threshold is **2.44%**, after which validation data and operational capacity must be considered.

## 5. Learning-curve diagnosis

The project interprets four cases:

- Case A indicates underfitting or high bias.
- Case B indicates overfitting or high variance.
- Case C can occur when Dropout, augmentation, or BatchNorm makes training harder than evaluation.
- Case D requires distinguishing distribution shift from noisy labels or a pipeline problem.

## 6. Deliverable

Open `ML_Debugging_Gradients.ipynb` in Google Colab or Jupyter Notebook and run the cells in order. PyTorch is required for the training-debugging cell; NumPy is required for the attention implementation.

## 7. Limitation

The training example uses dummy data to demonstrate debugging. The attention mathematics and fraud-evaluation strategy are general methods, but production fraud detection would require real, time-stamped transaction data and matured chargeback labels.
