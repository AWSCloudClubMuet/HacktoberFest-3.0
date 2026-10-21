# Milestone 3: Reason About the Accuracy Ceiling

**Team:** Cloud9  
**Track:** Applied Machine Learning / Data-Centric AI (Project Two)  
**Deliverable:** Mathematical Derivation of True Accuracy & Theoretical Critique of Naive Inversion  
**Executable Script:** [`milestone3_accuracy_ceiling.py`](./milestone3_accuracy_ceiling.py)

---

## 1. Problem Formulation & Notation

In HelpDeskNet-50K, our fine-tuned text classifier plateaus at **$A_{\text{obs}} = 82\%$ observed accuracy** on a held-out test set. However, the test set was labeled by the crowd and carries an estimated **$\eta = 15\%$ label noise**.

Let:
- $Y^* \in \{1, \dots, K\}$ denote the unobserved, true expert label ($K = 6$ classes).
- $\tilde{Y} \in \{1, \dots, K\}$ denote the observed (noisy) crowd label in the test set.
- $\hat{Y} \in \{1, \dots, K\}$ denote the model's predicted class.
- $A_{\text{obs}} = P(\hat{Y} = \tilde{Y}) = 0.82$ denote the observed test accuracy.
- $A_{\text{true}} = P(\hat{Y} = Y^*)$ denote the latent true accuracy of the model against uncorrupted ground truth.

---

## 2. Derivation of True Accuracy under Uniform Symmetric Noise

### 2.1. The Uniform Noise Assumption
We naively assume that each ticket's label has an independent probability $\eta = 0.15$ of being corrupted, and when corrupted, it flips **uniformly at random** to any of the other $K - 1 = 5$ classes:

$$P(\tilde{Y} = j \mid Y^* = i) = \begin{cases} 
1 - \eta = 0.85 & \text{if } j = i \\
\frac{\eta}{K - 1} = \frac{0.15}{5} = 0.03 & \text{if } j \neq i 
\end{cases}$$

### 2.2. Law of Total Probability Decomposition
The observed accuracy is the probability that the model prediction matches the noisy label:

$$P(\hat{Y} = \tilde{Y}) = P(\hat{Y} = \tilde{Y} \mid \hat{Y} = Y^*) P(\hat{Y} = Y^*) + P(\hat{Y} = \tilde{Y} \mid \hat{Y} \neq Y^*) P(\hat{Y} \neq Y^*)$$

We evaluate the two conditional terms:

1. **Case 1: The model prediction is truly correct ($\hat{Y} = Y^*$):**  
   The model matches the observed label $\tilde{Y}$ if and only if the label was **not** corrupted:
   $$P(\hat{Y} = \tilde{Y} \mid \hat{Y} = Y^*) = P(\tilde{Y} = Y^* \mid Y^*) = 1 - \eta = 0.85$$

2. **Case 2: The model prediction is truly incorrect ($\hat{Y} \neq Y^*$):**  
   The model predicted some incorrect class $k \neq Y^*$. Under the assumption of uniform random noise and independent errors, the true label $Y^*$ was corrupted specifically into class $k$ with probability:
   $$P(\hat{Y} = \tilde{Y} \mid \hat{Y} \neq Y^*) = \frac{\eta}{K - 1} = \frac{0.15}{5} = 0.03$$
   *(This represents a "lucky false agreement" where both the model and the noisy label made the exact same incorrect assignment).*

### 2.3. Solving for True Accuracy ($A_{\text{true}}$)

Substituting these values into the total probability formula:

$$A_{\text{obs}} = (1 - \eta) A_{\text{true}} + \left(\frac{\eta}{K - 1}\right) (1 - A_{\text{true}})$$

$$0.82 = (0.85) A_{\text{true}} + (0.03) (1 - A_{\text{true}})$$

$$0.82 = 0.85 A_{\text{true}} + 0.03 - 0.03 A_{\text{true}}$$

$$0.82 - 0.03 = (0.85 - 0.03) A_{\text{true}}$$

$$0.79 = 0.82 A_{\text{true}}$$

$$A_{\text{true}} = \frac{0.79}{0.82} = \frac{79}{82} \approx \mathbf{0.9634} \quad \mathbf{(96.34\%)}$$

*(Note: If one neglects the "lucky match" term and naively uses $A_{\text{obs}} \approx (1 - \eta) A_{\text{true}}$, the estimate is $A_{\text{true}} \approx \frac{0.82}{0.85} = \mathbf{96.47\%}$. Both formulations place the estimated true accuracy at $\approx 96.3\% - 96.5\%$).*

---

## 3. Why This Naive Estimate Is Unreliable for HelpDeskNet-50K

While the mathematical inversion is algebraically correct under its stated assumptions, the estimate of **$96.34\%$ is highly unreliable in practice** due to 5 critical violations of real-world data distributions:

### Violation 1: Severe Non-Uniformity of Noise (Asymmetric Transition Matrix)
- The naive formula assumes an equal $3\%$ flip rate into all 5 alternative classes.
- As proven in **Milestone 2** ($\chi^2 = 222.00, p < 10^{-15}$), 22 out of 30 class pairs have **0% noise**. 
- Noise is heavily clustered:
  - When `Billing` is corrupted, it flips to `Refund` $82.4\%$ of the time, to `Other` $17.6\%$ of the time, and **never** to `Technical`, `Shipping`, or `Account Access`.
  - Modeling noise as an isotropic scalar $\frac{\eta}{K-1}$ completely mischaracterizes the geometry of the error manifold.

---

### Violation 2: Correlated Errors between Model and Crowdworkers (Shared Linguistic Confusion)
- The derivation assumes that whether the model makes an error ($\hat{Y} \neq Y^*$) is **statistically independent** of whether the annotator made an error ($\tilde{Y} \neq Y^*$).
- **This assumption fails in NLP:** Both the deep learning model and human crowdworkers read the *exact same underlying text* ($X$).
- If a customer ticket contains ambiguous language (e.g., *"Invoice charge dispute — please refund immediately"*), both the crowdworker and the neural network will be pulled toward the exact same confusion (`Refund` instead of `Billing`).
- When both the model and the test label commit the **same error**, the test set records a **false positive agreement**:
  $$P(\hat{Y} = \tilde{Y} \mid \text{corrupted}) \gg 0.03$$
- As demonstrated in our sensitivity analysis ([`milestone3_accuracy_ceiling.py`](./milestone3_accuracy_ceiling.py)), if error correlation $\rho = 0.40$, the probability of false agreement rises to $41.8\%$, and the model's true accuracy drops from $96.3\%$ down to $\approx 93.0\%$.

---

### Violation 3: Contaminated Training Boundaries (Model Capacity to Memorize Noise)
- The classifier was fine-tuned on **45,000 crowd tickets** that contained this exact same 15% noise.
- Deep neural networks fit systematic label noise. Because the training data taught the model that certain billing tickets are labeled `Refund`, the model has internalized corrupted decision boundaries.
- The model is therefore **not** an uncorrupted oracle operating at $96.3\%$ true fidelity; its internal representations have been partially poisoned by Tier B crowd noise.

---

### Violation 4: Class Distribution Imbalance Amplifies Noise Exposure
- HelpDeskNet-50K is not balanced across classes:
  - `Billing`: 30%
  - `Refund`: 15%
  - `Technical`: 25%
  - `Account Access`: 15%
  - `Shipping`: 10%
  - `Other`: 5%
- The two classes with the most extreme bidirectional noise (`Billing` and `Refund`) comprise **45% of the entire dataset**.
- An aggregate scalar noise rate ($\eta = 15\%$) masks the fact that the primary business classes suffer from effective noise rates exceeding $20\%-25\%$, while other classes may be relatively clean.

---

### Summary for Judges & Engineering Leadership

| Assumption in Naive Inversion | Reality in HelpDeskNet-50K | Impact on Estimated True Accuracy |
| :--- | :--- | :--- |
| **Uniform flip probability ($\eta / 5 = 3\%$)** | Highly sparse, asymmetric semantic confusion ($\chi^2 = 222.00$) | Distorts effective error transition rates |
| **Independent error mechanisms** | Model and humans share linguistic ambiguity on the same text $X$ | Artificially inflates observed test accuracy ($A_{\text{obs}}$) |
| **Clean decision boundaries** | Model was trained on the same 15% crowd noise | True model accuracy is lower than $96.34\%$ |
| **Equal class vulnerability** | 45% of data belongs to the top confused classes | Over-optimistic estimation of production robustness |

**Engineering Recommendation:**  
Never rely on inverted theoretical scalar formulas to certify model readiness. The only definitive measurement of true accuracy is to evaluate the 82% checkpoint against a **clean, expert-audited gold benchmark** (Milestone 4 & 5).
