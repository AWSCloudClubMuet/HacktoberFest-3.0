# Comprehensive Guide: Machine Learning Debugging, Gradients, and Evaluation

Welcome to this technical guide. Machine learning in the real world is rarely as clean as textbook examples. Models fail silently, gradients can behave unexpectedly, production labels arrive late, and learning curves exhibit perplexing patterns. 

This guide breaks down four core engineering challenges in detail, providing step-by-step intuitive explanations, mathematical proofs, Python/NumPy code, and empirical validation.

---

## Table of Contents
1. [Milestone 1 — Debugging a Silently Failing Training Run](#milestone-1--debugging-a-silently-failing-training-run)
   - [Problem Statement & Code Analysis](#m1-problem)
   - [Bug Inventory & Symptom Breakdown](#m1-bugs)
   - [Corrected Pipeline Implementation](#m1-code)
   - [Black-Box Pipeline Diagnostics](#m1-diagnostics)
2. [Milestone 2 — Deriving & Implementing Scaled Dot-Product Attention Gradients](#milestone-2--deriving--implementing-scaled-dot-product-attention-gradients)
   - [Mathematical Foundations of Attention](#m2-math)
   - [Step-by-Step Gradient Derivations ($dV, dP, dS, dQ, dK$)](#m2-derivations)
   - [NumPy Implementation & Numerical Gradient Check](#m2-implementation)
   - [Numerical Stability & The Softmax Trick](#m2-stability)
   - [Why the Scaling Factor $1/\sqrt{d}$?](#m2-scale)
   - [Causal Masking in the Backward Pass](#m2-mask)
   - [Memory Scaling & How FlashAttention Solves It](#m2-flash)
3. [Milestone 3 — Designing a Production Evaluation Strategy (Fraud Detection)](#milestone-3--designing-a-production-evaluation-strategy-fraud-detection)
   - [Metrics to Use vs. Metrics to Avoid](#m3-metrics)
   - [Temporal Data Splitting & Embargo Windows](#m3-splits)
   - [Evaluating Under 30–60 Day Label Delays](#m3-delays)
   - [Optimal Cost-Based Decision Threshold Derivation](#m3-threshold)
   - [Score Calibration (Reliability Diagrams, Brier Score, ECE)](#m3-calibration)
   - [Production Drift Detection (PSI) & Retraining Policy](#m3-drift)
4. [Milestone 4 — Diagnosing Learning Curves](#milestone-4--diagnosing-learning-curves)
   - [Analysis of Cases A, B, and C](#m4-cases-abc)
   - [Case D: Persistent Generalization Gap](#m4-case-d)
   - [Distinguishing Experiment: Adversarial Validation](#m4-adversarial)
5. [Summary of Production Best Practices](#summary)

---

<a id="milestone-1--debugging-a-silently-failing-training-run"></a>
# Milestone 1 — Debugging a Silently Failing Training Run

<a id="m1-problem"></a>
### 1.1 The Mystery: Falling Loss, Fluctuating 55% Validation Accuracy
In a binary classification task on tabular data (10,000 rows, 40 features), we observe the following symptoms:
- **Training loss drops steadily** with each epoch.
- **Validation accuracy stays near 55%** (barely above a random coin flip).
- **Validation accuracy fluctuates wildly** from epoch to epoch.

Here is the original code:
```python
X = StandardScaler().fit_transform(X)
X_tr, X_val = X[:8000], X[8000:]
y_tr, y_val = y[:8000], y[8000:]
np.random.shuffle(X_tr)

model = nn.Sequential(nn.Linear(40, 128), nn.ReLU(), nn.Dropout(0.5),
              nn.BatchNorm1d(128), nn.Linear(128, 2))
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
scheduler = torch.optim.lr_scheduler.StepLR(opt, step_size=1, gamma=0.9)

for epoch in range(50):
    model.train()
    for xb, yb in train_loader:
        loss = loss_fn(model(xb), yb)
        opt.zero_grad(); loss.backward(); opt.step()
        scheduler.step()
    val_logits = model(torch.tensor(X_val))
    print(epoch, accuracy(val_logits, y_val))
```

---

<a id="m1-bugs"></a>
### 1.2 Bug Inventory & Symptom Breakdown

| # | Bug in Code | Direct Symptom / Consequence | Severity |
|---|---|---|---|
| **1** | `np.random.shuffle(X_tr)` shuffles features without shuffling `y_tr` | **Feature-target decoupling**: Training inputs are paired with completely random labels. Training loss drops because a 128-neuron MLP memorizes noise, but validation accuracy remains at chance (~55%). | **Critical** |
| **2** | `scheduler.step()` inside the minibatch loop | **Premature learning rate decay**: $8000/64 = 125$ batches/epoch means lr decays by $0.9^{125} \approx 1.9 \times 10^{-9}$ in Epoch 1, and $2.5 \times 10^{-32}$ by Epoch 5, completely freezing the weights. | **Critical** |
| **3** | Missing `model.eval()` and `torch.no_grad()` at validation | **Stochastic evaluation**: `Dropout(0.5)` stays on during validation, randomly dropping half the neurons each call. This causes validation accuracy to fluctuate wildly between epochs. `BatchNorm1d` also improperly updates running stats. | **High** |
| **4** | `StandardScaler().fit_transform(X)` before the split | **Data leakage**: Mean and variance of the 2,000 validation samples leak into the training features before splitting. | **Medium** |
| **5** | Layer order: `Dropout(0.5)` placed before `BatchNorm1d(128)` | **Variance shift disharmony**: Dropout randomly sets activations to 0 and scales by $1/(1-p)$, shifting variance between train and eval modes and degrading BatchNorm statistics. | **Medium** |
| **6** | `torch.tensor(X_val)` without dtype specification | **Type mismatch**: NumPy float64 converted to `torch.float64`, causing dtype mismatch errors when passed to `torch.float32` layers. | **Low** |

#### In-Depth Explanation of the Key Bugs:

1. **Why does training loss fall while validation accuracy stays at 55%? (The Shuffling Bug)**
   - Imagine a teacher giving you a flashcard deck of 8,000 cards. If the questions are shuffled but the answers remain in their original positions, question #1 is paired with answer #482! 
   - A deep neural network has enough capacity to memorize 8,000 arbitrary pairings (a well-known result from Zhang et al., *"Rethinking Generalization"*). The model successfully memorizes the random noise, driving the training loss down.
   - However, when evaluated on validation data where the true relationships hold, the memorized random garbage has zero predictive power. The model defaults to predicting the majority class or guessing at random (~55%).

2. **Why does validation accuracy fluctuate between epochs? (The Missing `model.eval()` Bug)**
   - Neural network layers like `nn.Dropout` and `nn.BatchNorm1d` have two distinct operational modes:
     - **Train mode (`model.train()`)**: Dropout randomly zeroes out 50% of the neurons to force redundancy. BatchNorm computes the batch mean and variance from the current mini-batch.
     - **Eval mode (`model.eval()`)**: Dropout is disabled (all neurons fire, scaled appropriately). BatchNorm freezes its running statistics and uses accumulated population metrics.
   - Because `model.eval()` was omitted, during validation 50% of the neurons were randomly silenced on every single validation pass! Even if the model had learned something, its output would randomly shift every epoch.

3. **Why does learning freeze almost immediately? (The Scheduler Bug)**
   - PyTorch's `StepLR(step_size=1, gamma=0.9)` is designed to be called **once per epoch**.
   - If placed inside `for xb, yb in train_loader:`, it executes once per **minibatch**. With 125 batches per epoch:
     $$\text{LR}_{\text{epoch 1}} = 10^{-3} \times (0.9)^{125} \approx 1.91 \times 10^{-9}$$
     $$\text{LR}_{\text{epoch 2}} = 10^{-3} \times (0.9)^{250} \approx 3.64 \times 10^{-15}$$
   - Within minutes, the learning rate drops below machine epsilon, and gradient descent comes to a complete standstill.

---

<a id="m1-code"></a>
### 1.3 Corrected Pipeline Implementation

Here is the clean, idiomatic PyTorch implementation resolving all six issues:

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 1. Split BEFORE scaling to prevent data leakage
X_tr, X_val, y_tr, y_val = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

# 2. Fit scaler ONLY on training data; transform validation data
scaler = StandardScaler()
X_tr = scaler.fit_transform(X_tr)
X_val = scaler.transform(X_val)

# 3. Create PyTorch datasets and loaders (DataLoader handles shuffling safely!)
train_ds = TensorDataset(
    torch.tensor(X_tr, dtype=torch.float32),
    torch.tensor(y_tr, dtype=torch.long)
)
# shuffle=True ensures features and labels stay synchronized across epochs
train_loader = DataLoader(train_ds, batch_size=64, shuffle=True)

X_val_tensor = torch.tensor(X_val, dtype=torch.float32)

# 4. Correct layer ordering: Linear -> BatchNorm -> ReLU -> Dropout
model = nn.Sequential(
    nn.Linear(40, 128),
    nn.BatchNorm1d(128),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(128, 2)
)

loss_fn = nn.CrossEntropyLoss()
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
# StepLR now steps once per epoch
scheduler = torch.optim.lr_scheduler.StepLR(opt, step_size=5, gamma=0.5)

for epoch in range(1, 51):
    # TRAINING PHASE
    model.train()
    total_loss = 0.0
    for xb, yb in train_loader:
        opt.zero_grad()
        logits = model(xb)
        loss = loss_fn(logits, yb)
        loss.backward()
        opt.step()
        total_loss += loss.item()
        
    # Step scheduler once per epoch outside the minibatch loop
    scheduler.step()
    
    # EVALUATION PHASE
    model.eval()  # Freeze dropout and batchnorm statistics
    with torch.no_grad():  # Save memory and computation
        val_logits = model(X_val_tensor)
        val_preds = torch.argmax(val_logits, dim=1)
        val_acc = (val_preds == torch.tensor(y_val)).float().mean().item()
        
    avg_loss = total_loss / len(train_loader)
    print(f"Epoch {epoch:2d} | Train Loss: {avg_loss:.4f} | Val Acc: {val_acc*100:.2f}%")
```

---

<a id="m1-diagnostics"></a>
### 1.4 Quick Black-Box Experiments (Revealing Bugs Without Code Access)

If you are handed an ML pipeline as a black box (e.g., via a remote API or Docker container) and observe poor validation metrics, you can run these simple experiments:

1. **Single-Batch Overfitting Test (Model Sanity Check)**
   - *Protocol:* Feed the exact same single batch of 16–32 samples repeatedly for 50–100 iterations.
   - *Expected Behavior:* A healthy architecture and optimizer should drive training loss to $\approx 0.0$ and training accuracy to $100\%$.
   - *Diagnosis:* If the model cannot overfit 32 samples, the optimizer is frozen (learning rate is zero/too small), gradients are exploding/vanishing, or the loss function is misconfigured.

2. **Deterministic Evaluation Check (Eval Mode Verification)**
   - *Protocol:* Without performing any weight updates, pass the exact same validation batch through the model twice: `pred_1 = model(X_val)` and `pred_2 = model(X_val)`. Compute `diff = max(abs(pred_1 - pred_2))`.
   - *Expected Behavior:* In evaluation mode, predictions must be identical (`diff == 0.0`).
   - *Diagnosis:* If `diff > 0`, stochastic operations like Dropout or batch-dependent operations are active at inference time, proving that `model.eval()` was omitted.

3. **Label Randomization Baseline (Signal vs. Memorization Test)**
   - *Protocol:* Run the pipeline on a dataset where labels $y$ are completely randomly permuted.
   - *Expected Behavior:* On random labels, train loss may fall, but validation accuracy will be exactly chance (50%).
   - *Diagnosis:* If your actual pipeline's validation performance is identical to the random-label run, your training data features are decoupled from the target labels or contains zero true signal.

4. **Learning Rate & Parameter Update Metric ($L_2$ Norm Tracking)**
   - *Protocol:* Log the norm of parameter updates: $\|\theta_{t+1} - \theta_t\|_2$.
   - *Expected Behavior:* Updates should decrease smoothly.
   - *Diagnosis:* If the update norm drops to zero after epoch 1, a learning rate scheduler is stepping too frequently or decay is excessively aggressive.

---

<a id="milestone-2--deriving--implementing-scaled-dot-product-attention-gradients"></a>
# Milestone 2 — Deriving & Implementing Scaled Dot-Product Attention Gradients

<a id="m2-math"></a>
### 2.1 Mathematical Foundations of Attention
Scaled Dot-Product Attention (Vaswani et al., 2017) is the computational core of the Transformer architecture. Given:
- **Queries ($Q$)**: Matrix of size $(n \times d)$, representing $n$ sequence tokens, each with feature dimension $d$.
- **Keys ($K$)**: Matrix of size $(n \times d)$, representing the $n$ sequence tokens to match against.
- **Values ($V$)**: Matrix of size $(n \times d_v)$, representing the information content of each token.

The operations proceed in three steps:
1. **Raw Attention Scores ($S$)**:
   $$S = \frac{Q K^T}{\sqrt{d}} \in \mathbb{R}^{n \times n}$$
2. **Attention Probabilities ($P$) via Row-Wise Softmax**:
   $$P_{ij} = \frac{\exp(S_{ij})}{\sum_{k=1}^n \exp(S_{ik})} \in \mathbb{R}^{n \times n}$$
3. **Context Output ($O$)**:
   $$O = P V \in \mathbb{R}^{n \times d_v}$$

We are given an upstream loss gradient $\frac{\partial L}{\partial O} = dO \in \mathbb{R}^{n \times d_v}$. We must derive the gradients w.r.t. $V, P, S, Q,$ and $K$.

---

<a id="m2-derivations"></a>
### 2.2 Step-by-Step Gradient Derivations

#### 1. Derivation of $dV = \frac{\partial L}{\partial V}$
Each element of $O$ is defined as:
$$O_{ij} = \sum_{k=1}^n P_{ik} V_{kj}$$
Using the multivariate chain rule:
$$\frac{\partial L}{\partial V_{kj}} = \sum_{i=1}^n \frac{\partial L}{\partial O_{ij}} \frac{\partial O_{ij}}{\partial V_{kj}} = \sum_{i=1}^n dO_{ij} P_{ik} = \sum_{i=1}^n (P^T)_{ki} dO_{ij}$$
In compact matrix notation:
$$\mathbf{dV = P^T dO} \quad \in \mathbb{R}^{n \times d_v}$$

#### 2. Derivation of $dP = \frac{\partial L}{\partial P}$
Similarly, differentiating $O_{ij} = \sum_{k=1}^n P_{ik} V_{kj}$ with respect to $P_{ik}$:
$$\frac{\partial L}{\partial P_{ik}} = \sum_{j=1}^{d_v} \frac{\partial L}{\partial O_{ij}} \frac{\partial O_{ij}}{\partial P_{ik}} = \sum_{j=1}^{d_v} dO_{ij} V_{kj} = \sum_{j=1}^{d_v} dO_{ij} (V^T)_{jk}$$
In compact matrix notation:
$$\mathbf{dP = dO V^T} \quad \in \mathbb{R}^{n \times n}$$

#### 3. Derivation of $dS = \frac{\partial L}{\partial S}$ (Backpropagation Through Softmax)
Softmax is computed independently for each row $i$. Let $p = P_{i, :}$ and $s = S_{i, :}$.
Recall the derivative of the softmax function:
$$\frac{\partial p_j}{\partial s_k} = \begin{cases} p_j (1 - p_j) & \text{if } j = k \\ -p_j p_k & \text{if } j \neq k \end{cases} = p_j (\delta_{jk} - p_k)$$
where $\delta_{jk}$ is the Kronecker delta.
Now applying the chain rule to compute $\frac{\partial L}{\partial s_k}$:
$$\frac{\partial L}{\partial s_k} = \sum_{j=1}^n \frac{\partial L}{\partial p_j} \frac{\partial p_j}{\partial s_k} = \sum_{j=1}^n dp_j \cdot p_j (\delta_{jk} - p_k) = dp_k p_k - p_k \sum_{j=1}^n dp_j p_j = p_k \left( dp_k - \sum_{j=1}^n dp_j p_j \right)$$
Notice that $\sum_{j=1}^n dp_j p_j$ is simply the inner product (dot product) of the upstream gradient $dp$ with the softmax probabilities $p$.
Expressed across all rows in matrix form:
$$\mathbf{dS = P \odot \left( dP - \text{rowsum}(dP \odot P) \right)} \quad \in \mathbb{R}^{n \times n}$$
where $\odot$ denotes element-wise (Hadamard) multiplication, and $\text{rowsum}(\cdot)$ is broadcast across columns.

#### 4. Derivation of $dQ = \frac{\partial L}{\partial Q}$ and $dK = \frac{\partial L}{\partial K}$
Recall that:
$$S_{ij} = \frac{1}{\sqrt{d}} \sum_{a=1}^d Q_{ia} K_{ja}$$
Differentiating with respect to $Q_{ia}$:
$$\frac{\partial S_{ij}}{\partial Q_{ia}} = \frac{1}{\sqrt{d}} K_{ja}$$
Applying the chain rule across all elements $j$:
$$\frac{\partial L}{\partial Q_{ia}} = \sum_{j=1}^n \frac{\partial L}{\partial S_{ij}} \frac{\partial S_{ij}}{\partial Q_{ia}} = \frac{1}{\sqrt{d}} \sum_{j=1}^n dS_{ij} K_{ja} = \frac{1}{\sqrt{d}} (dS \cdot K)_{ia}$$
In matrix form:
$$\mathbf{dQ = \frac{1}{\sqrt{d}} dS K} \quad \in \mathbb{R}^{n \times d}$$

Similarly, differentiating with respect to $K_{ja}$:
$$\frac{\partial S_{ij}}{\partial K_{ja}} = \frac{1}{\sqrt{d}} Q_{ia}$$
Applying the chain rule across all elements $i$:
$$\frac{\partial L}{\partial K_{ja}} = \sum_{i=1}^n \frac{\partial L}{\partial S_{ij}} \frac{\partial S_{ij}}{\partial K_{ja}} = \frac{1}{\sqrt{d}} \sum_{i=1}^n dS_{ij} Q_{ia} = \frac{1}{\sqrt{d}} \sum_{i=1}^n (dS^T)_{ji} Q_{ia} = \frac{1}{\sqrt{d}} (dS^T Q)_{ja}$$
In matrix form:
$$\mathbf{dK = \frac{1}{\sqrt{d}} dS^T Q} \quad \in \mathbb{R}^{n \times d}$$

---

<a id="m2-implementation"></a>
### 2.3 NumPy Implementation & Numerical Gradient Check

The implementation below contains the exact forward and backward passes, equipped with stable softmax and causal masking.

```python
import numpy as np

def stable_softmax(x, axis=-1):
    """Numerically stable softmax: subtract max per row before exp()."""
    x_max = np.max(x, axis=axis, keepdims=True)
    exp_x = np.exp(x - x_max)
    return exp_x / np.sum(exp_x, axis=axis, keepdims=True)

def attention_forward(Q, K, V, causal_mask=False):
    """
    Computes scaled dot-product attention forward pass.
    S = (Q @ K.T) / sqrt(d)
    P = softmax(S)
    O = P @ V
    """
    n, d = Q.shape
    scale = 1.0 / np.sqrt(d)
    S = (Q @ K.T) * scale
    
    mask = None
    if causal_mask:
        mask = np.triu(np.ones((n, n), dtype=bool), k=1)
        S_masked = S.copy()
        S_masked[mask] = -1e9  # Set upper triangle to large negative number
        P = stable_softmax(S_masked, axis=-1)
    else:
        P = stable_softmax(S, axis=-1)
        
    O = P @ V
    cache = (Q, K, V, S, P, scale, causal_mask, mask)
    return O, cache

def attention_backward(dO, cache):
    """
    Computes analytical gradients dQ, dK, dV, dP, dS given upstream dO.
    """
    Q, K, V, S, P, scale, causal_mask, mask = cache
    
    # 1. Gradient w.r.t V
    dV = P.T @ dO
    
    # 2. Gradient w.r.t P
    dP = dO @ V.T
    
    # 3. Gradient w.r.t S (Softmax backward)
    row_sum_dP_P = np.sum(dP * P, axis=-1, keepdims=True)
    dS = P * (dP - row_sum_dP_P)
    
    # Masked positions receive zero gradient
    if causal_mask and mask is not None:
        dS[mask] = 0.0
        
    # 4. Gradients w.r.t Q and K
    dQ = (dS @ K) * scale
    dK = (dS.T @ Q) * scale
    
    return dQ, dK, dV, dP, dS
```

#### Empirical Gradient Check Verification Results

We verify the analytical gradients using central finite differences:
$$g_{\text{num}} = \frac{L(x + h) - L(x - h)}{2h}$$
where $L = \sum (O \odot dO)$, meaning $\frac{\partial L}{\partial O} = dO$.

**Verification Parameters:**
- **Step size ($h$):** $1.0 \times 10^{-5}$
- **Precision:** `float64` (IEEE 754 double precision)
- **Error Metric:** Frobenius relative error $\frac{\|g_{\text{ana}} - g_{\text{num}}\|_F}{\|g_{\text{ana}}\|_F + \|g_{\text{num}}\|_F}$
- **Acceptance Threshold:** Relative error $< 1.0 \times 10^{-7}$

**Verification Output:**
```
======================================================================
NUMERICAL GRADIENT VERIFICATION (Two-Sided Finite Differences)
======================================================================
Step size (h):            1.0e-05
Numerical precision:      float64 (IEEE 754 double precision)
Acceptance threshold:     relative error < 1.0e-07
Error metric:             Frobenius relative error ||g_ana - g_num|| / (||g_ana|| + ||g_num||)

--- Testing UNMASKED (STANDARD) ATTENTION ---
  Gradient w.r.t Q:
    - Relative Error:     3.6285e-11 (threshold: < 1.0e-07)
    - Max Absolute Err:   4.7343e-11
    - Verification:     PASSED [OK]
  Gradient w.r.t K:
    - Relative Error:     4.3370e-11 (threshold: < 1.0e-07)
    - Max Absolute Err:   7.5815e-11
    - Verification:     PASSED [OK]
  Gradient w.r.t V:
    - Relative Error:     1.5951e-11 (threshold: < 1.0e-07)
    - Max Absolute Err:   3.4442e-11
    - Verification:     PASSED [OK]

--- Testing CAUSAL MASKED ATTENTION ---
  Gradient w.r.t Q:
    - Relative Error:     4.7843e-11 (threshold: < 1.0e-07)
    - Max Absolute Err:   6.1522e-11
    - Verification:     PASSED [OK]
  Gradient w.r.t K:
    - Relative Error:     6.9918e-11 (threshold: < 1.0e-07)
    - Max Absolute Err:   8.2202e-11
    - Verification:     PASSED [OK]
  Gradient w.r.t V:
    - Relative Error:     1.4791e-11 (threshold: < 1.0e-07)
    - Max Absolute Err:   3.4149e-11
    - Verification:     PASSED [OK]
```
All gradients match numerical derivatives with an error of $\sim 10^{-11}$, well below the $10^{-7}$ threshold.

---

<a id="m2-stability"></a>
### 2.4 Forward-Pass Numerical Stability & The Softmax Trick

#### The Issue: Numerical Overflow
The naive softmax formula is:
$$P_{ij} = \frac{\exp(S_{ij})}{\sum_k \exp(S_{ik})}$$
In 32-bit floating point (`float32`), any number $x > 88.7$ produces $\exp(x) = \infty$. In 64-bit float, $x > 709.78$ overflows.
When $\exp(S_{ij}) = \infty$, the fraction becomes $\frac{\infty}{\infty} = \text{NaN}$ (Not a Number), causing model weights to corrupt.

#### The Fix: Max Subtraction
We subtract the maximum value of each row $m_i = \max_k S_{ik}$ prior to exponentiating:
$$P_{ij} = \frac{\exp(S_{ij} - m_i)}{\sum_k \exp(S_{ik} - m_i)}$$

#### Mathematical Proof of Invariance:
$$\frac{\exp(S_{ij} - m_i)}{\sum_k \exp(S_{ik} - m_i)} = \frac{\exp(S_{ij}) \cdot \exp(-m_i)}{\sum_k [\exp(S_{ik}) \cdot \exp(-m_i)]} = \frac{\exp(S_{ij}) \cdot \exp(-m_i)}{\exp(-m_i) \sum_k \exp(S_{ik})} = \frac{\exp(S_{ij})}{\sum_k \exp(S_{ik})}$$
Because the constant factor $\exp(-m_i)$ factors out of the sum and cancels between numerator and denominator, the output is mathematically identical.
However, numerically, the maximum exponent is now $\exp(m_i - m_i) = \exp(0) = 1.0$. Overflow is guaranteed impossible!

---

<a id="m2-scale"></a>
### 2.5 Why Attention Uses the Scaling Factor $1/\sqrt{d}$

Let the components of $q \in \mathbb{R}^d$ and $k \in \mathbb{R}^d$ be independent random variables with zero mean and unit variance:
$$\mathbb{E}[q_i] = 0, \quad \text{Var}(q_i) = 1, \quad \mathbb{E}[k_i] = 0, \quad \text{Var}(k_i) = 1$$
The dot product is $s = q^T k = \sum_{i=1}^d q_i k_i$.
1. **Expected Value:**
   $$\mathbb{E}[s] = \sum_{i=1}^d \mathbb{E}[q_i k_i] = \sum_{i=1}^d \mathbb{E}[q_i]\mathbb{E}[k_i] = 0$$
2. **Variance:**
   $$\text{Var}(q_i k_i) = \mathbb{E}[q_i^2 k_i^2] - (\mathbb{E}[q_i k_i])^2 = \mathbb{E}[q_i^2]\mathbb{E}[k_i^2] - 0 = (1)(1) = 1$$
   Since the terms are independent, the variance of the sum is the sum of variances:
   $$\text{Var}(s) = \sum_{i=1}^d \text{Var}(q_i k_i) = \sum_{i=1}^d 1 = d$$
   The standard deviation of the raw dot product is therefore $\sqrt{d}$.

#### What happens if we do NOT divide by $\sqrt{d}$?
For modern LLM dimensions (e.g., $d = 64$ or $128$), the dot products have standard deviation $8$ or $11.3$. Dot product values frequently reach $+30$ or $-30$.
When large inputs enter the softmax function:
- The single largest entry gets probability $P_{ij} \approx 1.0$.
- All other entries get $P_{ij} \approx 0.0$.

Recall the gradient of softmax:
$$\frac{\partial P_{ij}}{\partial S_{ik}} = P_{ij}(\delta_{jk} - P_{ik})$$
- When $P_{ij} \approx 1.0$: the gradient is $1 \times (1 - 1) = 0$.
- When $P_{ij} \approx 0.0$: the gradient is $0 \times (0 - 0) = 0$.

**The gradients vanish completely!** Backpropagation halts, and the model cannot learn.
Dividing by $\sqrt{d}$ scales the variance back down to $\text{Var}\left(\frac{s}{\sqrt{d}}\right) = \frac{1}{d} \text{Var}(s) = \frac{d}{d} = 1.0$, keeping the logits in the active, sensitive region of softmax where gradients are strong.

---

<a id="m2-mask"></a>
### 2.6 Causal Masking in the Backward Pass

In autoregressive models (like GPT), token $i$ should only attend to tokens $j \le i$. It must never look into the future ($j > i$).
- **Forward Pass:** We set $S_{ij} = -\infty$ (or $-10^9$) for all $j > i$.
  When exponentiated, $\exp(-\infty) = 0$, so $P_{ij} = 0$ for all $j > i$.
- **Backward Pass:**
  Because future tokens $j > i$ were blocked from influencing the output, their mathematical derivative is zero:
  $$\frac{\partial L}{\partial S_{ij}} = 0 \quad \text{for all } j > i$$
  In our vectorized backward pass, since $P_{ij} = 0$ for $j > i$, the formula $dS = P \odot (dP - \text{rowsum}(dP \odot P))$ naturally evaluates to zero for masked entries. However, to guarantee numerical purity against $-10^9$ approximations, we explicitly enforce:
  $$dS[\text{mask}] = 0.0$$
  This ensures no gradient leaks backwards into future query-key pairs.

---

<a id="m2-flash"></a>
### 2.7 Memory Cost as Sequence Length $n$ Grows & FlashAttention

#### The $O(n^2)$ Memory Wall
Standard attention materializes two full $n \times n$ intermediate matrices in memory:
1. $S = \frac{QK^T}{\sqrt{d}} \in \mathbb{R}^{n \times n}$
2. $P = \text{softmax}(S) \in \mathbb{R}^{n \times n}$

For sequence length $n = 4,096$, storing $P$ and $S$ in 16-bit float takes:
$$4,096 \times 4,096 \times 2 \text{ bytes} \approx 33.5 \text{ MB per attention head}$$
With 32 attention heads and batch size 8:
$$33.5 \text{ MB} \times 32 \times 8 \approx 8.6 \text{ GB}$$
If we scale the sequence length to $n = 32,768$ ($8\times$ longer):
Memory scales quadratically: $8^2 = 64\times$!
$$8.6 \text{ GB} \times 64 = 550 \text{ GB}$$
This exceeds the total GPU VRAM of even an 80 GB A100/H100 cluster!

Furthermore, GPUs have two types of memory:
- **High Bandwidth Memory (HBM):** Large (40–80 GB), but relatively slow (~1.5–3 TB/s).
- **SRAM (On-Chip Cache):** Very small (~20–40 MB per GPU), but blisteringly fast (~19 TB/s).
Standard attention repeatedly reads and writes $n \times n$ matrices to HBM, making it severely memory-bandwidth bound (memory wall).

#### How FlashAttention (Dao et al.) Solves It
FlashAttention avoids materializing the $n \times n$ matrices in HBM entirely through three innovations:

1. **Tiling (Block-Wise Computation):**
   FlashAttention divides $Q, K,$ and $V$ into small blocks (e.g., $128 \times 128$) that fit entirely within fast on-chip SRAM.

2. **Online Softmax:**
   Standard softmax requires seeing all entries in a row to find $\max(x)$ and $\sum e^x$.
   Online softmax (Milakov & Gimelshein, 2018) updates the running maximum and running normalizer incrementally block by block. When a new block of Keys arrives, the previous partial output is rescaled on-the-fly without needing to store the full row.

3. **Recomputation in the Backward Pass:**
   Instead of saving the massive $n \times n$ matrix $P$ in HBM during the forward pass for backpropagation, FlashAttention stores only the small normalization statistics (running max and sum). During the backward pass, it recomputes $S$ and $P$ on-the-fly block-by-block directly in SRAM.

**Impact:** Reduces peak memory from **$O(n^2)$ down to $O(n)$**, and yields a **$2\times$ to $4\times$ wall-clock speedup** by cutting down slow memory reads and writes.

---

<a id="milestone-3--designing-a-production-evaluation-strategy-fraud-detection"></a>
# Milestone 3 — Designing a Production Evaluation Strategy (Fraud Detection)

### Scenario Overview
- **Domain:** Credit card transaction fraud detection.
- **Extreme Class Imbalance:** Fraud represents only **0.1%** of all transactions (1 positive in 1,000).
- **Label Latency:** Chargeback labels take **30 to 60 days** to arrive from cardholder banks.
- **Non-Stationarity:** Fraudsters evolve patterns continuously (adversarial concept drift).

---

<a id="m3-metrics"></a>
### 3.1 Metrics to Use vs. Metrics to Avoid

#### Metrics to Avoid
- **Raw Accuracy:**
  A dummy model that blindly classifies every transaction as "Legitimate" achieves **99.9% accuracy**, while catching zero fraud and bankrupting the institution. Accuracy is useless under class imbalance.
- **Standard ROC-AUC (Area Under the ROC Curve):**
  ROC plots True Positive Rate ($TPR$) vs. False Positive Rate ($FPR = \frac{FP}{FP + TN}$).
  Because legitimate transactions ($TN$) are overwhelming (99.9%), a huge surge in false alarms ($FP$) barely nudges $FPR$. For instance, if $TN = 999,000$ and $FP = 10,000$, $FPR \approx 1\%$. 
  The ROC curve looks stellar (AUC > 0.98), yet the operational reality is a disaster: for every 1 true fraud caught, human reviewers must sift through 10 false alarms!

#### Metrics to Prioritize
1. **Precision-Recall AUC (PR-AUC / Average Precision):**
   PR curves plot Precision ($\frac{TP}{TP + FP}$) against Recall ($\frac{TP}{TP + FN}$). By ignoring $TN$, PR-AUC focuses on the rare positive class and punishes false alarms.
2. **Expected Business Cost / Loss Function ($C$):**
   Directly translates predictions into financial profit/loss using the real costs of errors ($FN = \$200, FP = \$5$).
3. **Precision at Fixed Operational Recall (e.g., Precision @ 80% Recall):**
   Answers the question: *"When we catch 80% of all fraud, what percentage of flagged cards belong to innocent customers?"*
4. **Top-$K$ Lift / Alert Rate:**
   Fraud teams have a fixed daily budget of human investigator hours (e.g., review 500 alerts/day). Top-$K$ precision measures how many true frauds are present in the top 500 highest-risk transactions.

---

<a id="m3-splits"></a>
### 3.2 Train / Validation / Test Splitting Strategy

**Rule #1 of Time-Series ML: Never use random $k$-fold cross-validation!**
Random splitting shuffles future data into the past, causing lookahead leakage and unrealistically inflated test scores.

#### Temporal Splitting with Embargo (Blackout) Windows
Because chargebacks take up to 60 days to mature, transactions that occurred 20 days ago may look "legitimate" simply because the victim hasn't noticed their stolen card yet! If used for training, they will be mislabeled as legitimate, actively corrupting the model.

```
Time Axis (Months) ----------------------------------------------------->
[--- Train Period ---]  [-- Embargo --]  [--- Val Period ---]  [-- Embargo --]  [--- Test Period ---]
    Months 1 to 6           Month 7-8          Month 9            Month 10-11          Month 12
(Fully Matured Labels)     (60-day gap)     (Tuning & Thresh)     (60-day gap)     (Out-of-Time Eval)
```

1. **Training Set (Months 1–6):** Only transactions with fully settled chargebacks ($\ge 60$ days old).
2. **Embargo / Blackout Buffer (Months 7–8):** A 60-day buffer period that is dropped from evaluation to prevent label immaturity leakage.
3. **Validation Set (Month 9):** Used for hyperparameter tuning and threshold optimization.
4. **Out-of-Time Test Set (Month 12):** Evaluates true future generalization in production.

---

<a id="m3-delays"></a>
### 3.3 Evaluating Models Despite 30–60 Day Label Latencies

When labels take 2 months to arrive, how do we know if our model deployed yesterday is working?

1. **Mature Cohort Backtesting:**
   Official model benchmark numbers must only be reported on "mature cohorts" (transactions older than 60 days).
2. **Early Proxy Signals (Fast Feedback Loops):**
   Do not wait for formal bank chargebacks. Aggregate rapid indicator signals that arrive within hours or days:
   - Cardholder SMS / mobile app verification denials.
   - Immediate customer service dispute calls.
   - High-risk merchant acquirer warning flags (e.g., TC40 / SAFE reports).
3. **Lag-Adjusted Survival Curves:**
   Model the empirical arrival distribution of chargebacks:
   - Day 15: ~40% of chargebacks have arrived.
   - Day 30: ~75% have arrived.
   - Day 60: ~99% have arrived.
   Use Kaplan-Meier survival curves to project the final fraud rate of recent transactions based on early incoming dispute volumes.

---

<a id="m3-threshold"></a>
### 3.4 Optimal Cost-Based Decision Threshold Derivation

In fraud detection, predicting "Fraud" or "Not Fraud" requires choosing a probability threshold $p^*$. Defaulting to $p^* = 0.5$ is wrong because the costs of errors are asymmetric.

#### Given Costs:
- **False Negative ($FN$):** We predict Legitimate, but transaction is Fraud.
  **Cost = \$200** (loss of stolen funds + bank chargeback penalty fee).
- **False Positive ($FP$):** We predict Fraud, but transaction is Legitimate.
  **Cost = \$5** (lost interchange revenue + SMS verification / customer friction).
- **True Positive ($TP$) & True Negative ($TN$):** Cost $\approx \$0$.

#### Mathematical Derivation of Optimal Threshold $p^*$:
Let $p = P(\text{Transaction is Fraud} \mid x)$ be the predicted probability of fraud.

- **Option A: Flag transaction as Fraud (Action = 1):**
  If it is actually legitimate (probability $1 - p$), we incur a False Positive cost of $\$5$.
  $$\mathbb{E}[\text{Cost} \mid \text{Flag}] = 5 \times (1 - p)$$

- **Option B: Allow transaction as Normal (Action = 0):**
  If it is actually fraud (probability $p$), we incur a False Negative cost of $\$200$.
  $$\mathbb{E}[\text{Cost} \mid \text{Allow}] = 200 \times p$$

We should flag the transaction whenever the expected cost of flagging is lower than allowing:
$$\mathbb{E}[\text{Cost} \mid \text{Flag}] < \mathbb{E}[\text{Cost} \mid \text{Allow}]$$
$$5 \times (1 - p) < 200 \times p$$
$$5 - 5p < 200p$$
$$5 < 205p$$
$$p > \frac{5}{205} = \frac{1}{41} \approx 0.02439 \quad (\mathbf{2.44\%})$$

**Decision Rule:**
$$\text{Flag as Fraud if } P(\text{Fraud}) \ge \mathbf{2.44\%}$$
Because letting fraud pass is $40\times$ more expensive than a false alarm ($200 vs $5), the model should flag a transaction even if there is only a **2.44% chance** of fraud!

---

<a id="m3-calibration"></a>
### 3.5 Assessing Score Calibration

The threshold $p^* = 2.44\%$ is only valid if the model's output $p$ represents a true probability. If a model outputs $0.03$, does that transaction really have a 3% chance of being fraud?

#### How to Measure Calibration:
1. **Reliability Diagram (Calibration Curve):**
   Divide predictions into bins (e.g., [0-1%], [1-2%], [2-3%], ..., [9-10%]). For each bin, plot the average predicted probability on the $x$-axis against the actual fraction of true frauds on the $y$-axis.
   - **Perfect Calibration:** Points lie exactly on the $45^\circ$ line ($y = x$).
   - **Under-confident:** Points lie above the diagonal.
   - **Over-confident:** Points lie below the diagonal.
2. **Brier Score:**
   The mean squared error between predicted probabilities $p_i$ and true binary labels $y_i \in \{0, 1\}$:
   $$\text{Brier} = \frac{1}{N} \sum_{i=1}^N (p_i - y_i)^2$$
   Lower is better.
3. **Expected Calibration Error (ECE):**
   The weighted average difference between predicted confidence and empirical accuracy across $M$ bins:
   $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{conf}(B_m) - \text{acc}(B_m) \right|$$

#### How to Fix Poor Calibration:
Fit a post-hoc calibration layer on the held-out validation set:
- **Platt Scaling:** Fit a simple 1D logistic regression on the model's raw logits.
- **Isotonic Regression:** Fit a non-parametric, monotonically increasing step function (recommended for tree-based models like XGBoost/LightGBM).

---

<a id="m3-drift"></a>
### 3.6 Detecting Production Drift & Retraining Strategy

Because labels take 30–60 days to arrive, **you cannot rely on performance metrics to detect model degradation!** If you wait for chargebacks to drop, you have already lost millions.

#### 1. Real-Time Drift Detection (Without Ground Truth Labels)
- **Prediction Score Drift:** Monitor the distribution of predicted probabilities $P(\text{Fraud})$ daily. If the 99th percentile of scores suddenly jumps from 0.03 to 0.12, or the percentage of transactions crossing the 2.44% threshold triples, drift or upstream feature breakage has occurred.
- **Feature Distribution Drift (Population Stability Index - PSI):**
  PSI measures how much an input feature $X$ has shifted from reference baseline to production:
  $$\text{PSI} = \sum_{b=1}^B \left( \text{Actual}_b - \text{Expected}_b \right) \times \ln\left( \frac{\text{Actual}_b}{\text{Expected}_b} \right)$$
  - **$\text{PSI} < 0.10$:** No significant change; model is stable.
  - **$0.10 \le \text{PSI} \le 0.25$:** Moderate drift; schedule retraining.
  - **$\text{PSI} > 0.25$:** Severe drift; trigger alerts and investigate immediately.

#### 2. Production Retraining Policy
- **Cadence Retraining:** Retrain weekly or monthly using a rolling window of the most recent 6 months of fully matured data.
- **Event-Driven Retraining:** Trigger automated retraining pipelines if PSI on top features exceeds 0.25, or when new merchant categories / geographical regions are launched.
- **Champion / Challenger Deployment:** Never push a retrained model straight to 100% traffic. Deploy in **Shadow Mode** (running parallel without taking real blocking actions) for 1–2 weeks, followed by a **Canary Rollout** (5% $\to$ 20% $\to$ 100%).

---

<a id="milestone-4--diagnosing-learning-curves"></a>
# Milestone 4 — Diagnosing Learning Curves

Learning curves plot model performance (training accuracy vs. validation accuracy) as a function of the number of training samples ($N$). They are diagnostic tools for understanding whether an ML model suffers from high bias, high variance, or data distribution flaws.

---

<a id="m4-cases-abc"></a>
### 4.1 Diagnosing Cases A, B, and C

| Case | Train Acc | Val Acc | Behavior as Training Data Grows | Diagnosis |
|---|---|---|---|---|
| **A** | 62% | 60% | Both stay flat | **High Bias (Severe Underfitting)** |
| **B** | 99% | 78% | Val rises slowly; gap shrinks slowly | **High Variance (Overfitting)** |
| **C** | 85% | 91% | Both rise slightly | **Validation Outperforming Training (Validation Paradox)** |
| **D** | 88% | 70% | Gap does not close even with $4\times$ data | **Persistent Generalization Gap (Distribution Shift or Label Noise)** |

#### Case A: High Bias (Underfitting)
- **Symptoms:** Low training accuracy (62%) and low validation accuracy (60%). The gap is negligible (2%), and adding more data does not help.
- **Root Cause:** The model is not expressive enough to capture the true underlying data function, or the features lack predictive signal.
- **Interventions:**
  1. *Increase model capacity:* Use a deeper network, add more neurons/layers, or switch from a linear model to a gradient boosted tree (XGBoost) or multi-layer perceptron.
  2. *Feature Engineering:* Create non-linear features, interaction terms, or domain-specific representations.
  3. *Reduce Regularization:* Decrease weight decay ($L_2$), reduce dropout rates, or relax tree depth constraints.

#### Case B: High Variance (Overfitting)
- **Symptoms:** Near-perfect training accuracy (99%) with lower validation accuracy (78%). The gap is large (21%), but crucially, *validation accuracy is slowly rising and the gap is closing as more training data is added*.
- **Root Cause:** The model is memorizing training noise, but it has genuine capacity to learn the true concept once supplied with enough data diversity.
- **Interventions:**
  1. *Add more training data:* The learning curve proves that data volume is directly healing the generalization gap.
  2. *Add Regularization:* Increase Dropout (e.g. 0.3 to 0.5), apply weight decay ($10^{-4}$), or add early stopping.
  3. *Data Augmentation:* Introduce label-preserving perturbations to synthesize data diversity.

#### Case C: Validation Paradox (Validation Outperforming Training)
- **Symptoms:** Validation accuracy (91%) is substantially higher than training accuracy (85%).
- **Root Causes:**
  1. *Regularization is active during training but disabled during evaluation:* Heavy Dropout (e.g., 50%) or data noise is applied during training, crippling training accuracy. At test time, all neurons fire deterministically, boosting validation performance.
  2. *Measurement Timing:* Training loss and accuracy are calculated as a rolling average during the epoch while weights are still updating, whereas validation is evaluated at the end of the epoch when the weights are at their best.
  3. *Validation Set Asymmetry:* The validation set is small, unrepresentative, or contains easier examples than the training set.
- **Interventions:**
  1. Evaluate training accuracy with `model.eval()` at the end of the epoch to remove dropout effects and observe the true comparison.
  2. Audit train/validation splits to ensure stratified, representative class and difficulty distributions.

---

<a id="m4-case-d"></a>
### 4.2 Case D: Persistent Generalization Gap

#### The Dilemma:
In Case D, Train accuracy is 88%, Validation accuracy is 70%, and **multiplying training data by $4\times$ does not close the gap**.

In typical overfitting (Case B), adding $4\times$ data shrinks the generalization gap. When adding data fails to close an 18% deficit, the problem is **not sample size**.

#### Two Plausible Explanations:

1. **Explanation 1: Covariate / Distribution Shift (Out-of-Distribution Validation Set)**
   - The validation set is drawn from a different distribution than the training set.
   - *Real-world example:* Training data is collected from US users, but validation data is collected from European users; or training data is from 2024, and validation is from 2026.
   - The model learns real patterns that hold true in the training distribution, but those relationships do not transfer to the validation distribution. Gathering $4\times$ more data from the *same* training distribution cannot bridge this gap.

2. **Explanation 2: Systematic Validation Label Noise / Inconsistent Annotations**
   - The validation labels are corrupt, noisy, or were annotated using different guidelines than training data.
   - *Real-world example:* Medical imaging where training scans were labeled by an automated consensus algorithm, but validation scans were labeled by human doctors with a 20% disagreement rate.
   - If ~15–20% of validation labels are mislabeled, the theoretical maximum accuracy any model can achieve on validation is $\approx 80\%$. The model is actually performing well, but the validation benchmark is noisy.

---

<a id="m4-adversarial"></a>
### 4.3 Distinguishing Experiment: Adversarial Validation

How do we decisively determine whether Case D is caused by **Distribution Shift (Explanation 1)** or **Label Noise (Explanation 2)**?

#### The Adversarial Validation Protocol:
We train a binary classification model whose sole objective is to distinguish whether a given sample came from the **Training Set** or the **Validation Set**.

```
Step 1: Take X_train and X_val (Features only, discard labels y!)
Step 2: Assign target: z = 0 for all X_train rows, z = 1 for all X_val rows.
Step 3: Combine and split into 80/20 train/test.
Step 4: Train a classifier (e.g., LightGBM or Logistic Regression) to predict z from X.
Step 5: Measure the ROC-AUC of this classifier.
```

```
                        [ Run Adversarial Validation ]
                                      |
                      Is Adversarial ROC-AUC > 0.70?
                                     / \
                                    /   \
                                  YES    NO (AUC ≈ 0.50)
                                  /       \
         [ Covariate / Distribution Shift ] [ Label Noise or Target Shift ]
        - Features differ between train/val - Features are identically distributed
        - Inspect feature importances       - Train/Val distributions match
        - Retrain on domain-adapted data    - Audit validation ground truth labels
```

#### Outcome Analysis:
1. **If Adversarial ROC-AUC is significantly higher than 0.50 (e.g., 0.75 – 0.95):**
   - **Explanation 1 (Distribution Shift) is CONFIRMED.**
   - The classifier easily tells train samples apart from validation samples based on the features alone.
   - By looking at the **feature importances** of the adversarial model, you can instantly identify which specific features are drifting.

2. **If Adversarial ROC-AUC is near 0.50 (random chance):**
   - **Explanation 1 is RULED OUT.** The input feature distributions of train and validation are identical.
   - Therefore, the 18% gap must be caused by **Explanation 2 (Label Noise / Label Inconsistency)** or a change in the relationship $P(y \mid X)$ between train and val.
   - *Confirmation step:* Have senior domain experts re-annotate 200 validation samples to measure ground-truth label noise.

---

<a id="summary"></a>
# Summary of Production Best Practices

1. **Pipeline Discipline:** Always split datasets before any preprocessing. Use data loaders that maintain feature-label synchronization. Explicitly call `model.eval()` and `torch.no_grad()` during inference.
2. **Attention Architecture:** Always scale raw dot products by $1/\sqrt{d}$ to prevent vanishing gradients from softmax saturation. Use the row-max subtraction trick to eliminate numerical overflow. Adopt FlashAttention tiling for long sequences to bypass $O(n^2)$ HBM memory bottlenecks.
3. **Imbalanced Production Systems:** Never evaluate imbalanced pipelines using accuracy or standard ROC-AUC; use PR-AUC, operational top-$K$ precision, and expected cost curves. Enforce temporal splitting with embargo periods to reflect real-world label latency.
4. **Learning Curve Forensics:** When validation accuracy stagnates despite adding massive data, do not waste compute collecting more samples. Run adversarial validation to diagnose whether you face feature distribution drift or noisy ground-truth labels.
