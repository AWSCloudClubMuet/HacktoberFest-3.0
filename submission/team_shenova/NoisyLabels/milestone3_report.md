# Milestone 3 — Estimated Clean Accuracy Under Symmetric Noise
**Project: HelpDeskNet-50K Noisy Labels**  
**Team: SheNova**  


---

## 1. Executive Summary & Objective

A fine-tuned text classifier on the **HelpDeskNet-50K** dataset plateaus at **82.00% accuracy** on a held-out test set, and neither scaling model size nor increasing training epochs improves performance. 

The objective of **Milestone 3** is to:
1. Formulate a mathematical model showing how test-label noise distorts observed evaluation accuracy.
2. Calculate the theoretical true accuracy ($a$) under a standard symmetric-noise assumption.
3. Critically analyze why this theoretical estimate ($96.34\%$) is assumption-dependent and cannot be interpreted as empirical proof of the model's true performance.
4. Establish the distinction between theoretical mathematical adjustment and empirical gold-standard evaluation.

> **Data Scope & Integrity Notice:**  
> This calculation is a theoretical mathematical derivation based strictly on the scenario parameters ($K=6$, $q=0.15$, $A_{\text{noisy}}=0.82$). In accordance with hackathon rules, no claim is made that a real model was trained, that individual tickets were evaluated, or that 96.34% is a measured empirical accuracy.

---

## 2. Mathematical Derivation Under Symmetric Noise

### A. Model Parameters & Definitions
- $K = 6$: Number of distinct ticket categories (*Billing, Refund, Technical, Account Access, Shipping, Other*).
- $q = 0.15$: Probability that a ticket label is corrupted (assumed to be 15% for this theoretical baseline).
- $a$: The model's true accuracy against uncorrupted ground-truth labels ($P(\hat{Y} = Y^*)$).
- $A_{\text{noisy}} = 0.82$: Observed accuracy measured against the noisy test labels ($P(\hat{Y} = \tilde{Y})$).

### B. Theoretical Assumptions (Symmetric Uniform Noise)
For the purpose of this derivation:
1. Exactly $15\%$ of labels are corrupted ($q = 0.15$).
2. A corrupted label flips **uniformly at random** to one of the remaining $K - 1 = 5$ classes with probability $\frac{q}{K - 1} = \frac{0.15}{5} = 0.03$.
3. The noise-generating mechanism is conditionally independent of the true class $Y^*$ and the model's prediction $\hat{Y}$.
4. The model's predictions remain fixed as we evaluate their agreement against the noisy labels.

### C. Derivation of the Forward Equation
An observed prediction $\hat{Y}$ matches the noisy label $\tilde{Y}$ in two mutually exclusive cases:

1. **Case 1: The label is clean (uncorrupted) AND the model's prediction is correct.**
   - Probability that the label is clean: $1 - q$.
   - Probability that the model predicts the true label correctly: $a$.
   - Contribution:
     $$P(\text{Clean} \cap \text{Correct}) = (1 - q) a$$

2. **Case 2: The label is corrupted AND the corrupted label accidentally flips to the model's incorrect prediction.**
   - Probability that the model predicts incorrectly: $1 - a$.
   - Probability that the label is corrupted: $q$.
   - Given corruption, the label flips uniformly to one of the other $K - 1$ classes. The chance it flips to the specific incorrect class chosen by the model is $\frac{1}{K - 1}$.
   - Contribution:
     $$P(\text{Corrupted} \cap \text{Accidental Match}) = \frac{q}{K - 1}(1 - a)$$

Summing both disjoint probabilities yields the forward relation:
$$A_{\text{noisy}} = (1 - q)a + \frac{q}{K - 1}(1 - a)$$

---

## 3. Step-by-Step Substitution & Solution

Substitute the scenario values ($K = 6$, $q = 0.15$, $A_{\text{noisy}} = 0.82$):

$$0.82 = (1 - 0.15)a + \frac{0.15}{6 - 1}(1 - a)$$

$$0.82 = 0.85a + \frac{0.15}{5}(1 - a)$$

$$0.82 = 0.85a + 0.03(1 - a)$$

Distribute $0.03$:

$$0.82 = 0.85a + 0.03 - 0.03a$$

Group like terms:

$$0.82 = (0.85 - 0.03)a + 0.03$$

$$0.82 = 0.82a + 0.03$$

Isolate $a$:

$$0.82a = 0.82 - 0.03$$

$$0.82a = 0.79$$

$$a = \frac{0.79}{0.82} = \frac{79}{82} \approx 0.963414634...$$

**Result**: 
$$\mathbf{a \approx 96.34\%}$$

### Verification by Back-Substitution:
Reconstruct $A_{\text{noisy}}$ using $a = 0.9634146$:
$$A_{\text{noisy}} = 0.85 \times (0.9634146) + 0.03 \times (1 - 0.9634146)$$
$$A_{\text{noisy}} = 0.8189024 + 0.0010976 = 0.8200000 \quad (82.00\%)$$
The derivation is mathematically exact and reversible.

---

## 4. Why This Theoretical Estimate Is Unreliable for HelpDeskNet-50K

While the derivation illustrates how label noise deflates apparent model accuracy, **$96.34\%$ is a theoretical artifact of an idealized model, not a reliable measurement of actual classifier performance.** 

For the HelpDeskNet-50K dataset, this estimate is unreliable for five concrete reasons:

### 1. Label Noise in HelpDeskNet-50K Is Systematic, Not Uniformly Random
The derivation assumes that mislabeled tickets flip with equal $3\%$ probability to any of the other five classes. However, **Milestone 2 proved that error transitions are highly asymmetric and structured**:
- Mutual confusion between **Billing $\leftrightarrow$ Refund** accounts for **$43.33\%$** of all audit disagreements (26 / 60).
- Mutual confusion between **Technical $\leftrightarrow$ Account Access** accounts for **$25.00\%$** (15 / 60).
- Disagreements between distant classes (e.g. *Refund $\rightarrow$ Shipping* or *Billing $\rightarrow$ Technical*) were **$0$** in the audit sample.
Because label noise is concentrated between semantically adjacent classes, a corrupted label is far more likely to mislead the model in specific clusters than a uniform $\frac{q}{5}$ flip would suggest.

### 2. The 15% Noise Rate Is an Audit Estimate, Not a Fixed Universal Constant
The $q = 0.15$ figure originates from an audit sample of 400 tickets (60 disagreements). As established in Milestone 1:
- The **95% Wilson confidence interval** for the noise rate is **$[11.83\%, 18.83\%]$**.
- If true noise $q = 0.1183$, the implied true accuracy is:
  $$a = \frac{0.82 - 0.1183/5}{1 - 0.1183 - 0.1183/5} \approx \frac{0.7963}{0.8580} \approx 92.81\%$$
- If true noise $q = 0.1883$, the implied true accuracy is:
  $$a = \frac{0.82 - 0.1883/5}{1 - 0.1883 - 0.1883/5} \approx \frac{0.7823}{0.7740} \approx 101.07\% \quad (\text{Mathematically impossible without model error correlation})$$
Sensitivity to sample uncertainty demonstrates that treating $15\%$ as a point constant introduces large estimation variance.

### 3. Noise Rates Vary Dramatically Across Worker Tiers
The dataset was annotated by two distinct worker pools with vastly different error rates:
- **Tier A (20,000 tickets)**: Noise rate = **$6.67\%$**.
- **Tier B (25,000 tickets)**: Noise rate = **$21.82\%$**.
A single global noise parameter $q=0.15$ conceals this heterogeneity. If the held-out test set contains a higher proportion of Tier A tickets, $q$ is much lower and $a$ is much lower; if it contains more Tier B tickets, the reverse holds.

### 4. Noise Is Correlated with Ticket Difficulty (Instance-Dependent Noise)
The derivation assumes corruption is independent of the model's prediction. In practice, both crowd annotators and text classifiers struggle with the exact same ambiguous tickets (e.g. compound tickets mentioning both an invoice dispute and a refund demand). When noise is instance-dependent, errors between the model and noisy labels are correlated rather than independent, violating the $(1-a)$ chance agreement assumption.

### 5. Observed Accuracy Measures Agreement with Crowd Consensus, Not Correctness
The held-out test set was labeled by the same crowd process as the training set. Therefore, an 82% score indicates that the model agrees with crowd judgment $82\%$ of the time—not that it agrees with expert-level ground truth.

---

## 5. Theoretical Noise Adjustment vs. Empirical Gold-Standard Evaluation

To ensure rigorous communication in machine learning projects, we must maintain a strict distinction between theoretical adjustments and empirical measurements:

| Dimension | Theoretical Noise-Adjusted Accuracy | Empirical Gold-Standard Evaluation |
|---|---|---|
| **Definition** | Mathematical estimate derived by inverting an assumed noise process model. | Direct empirical measurement of model predictions against verified expert labels. |
| **Data Required** | Aggregate noise rate ($q$), class count ($K$), and observed noisy accuracy ($A_{\text{noisy}}$). | A dedicated, held-out gold test set audited and adjudicated by in-house domain experts. |
| **Underlying Assumptions** | Uniform, symmetric, instance-independent corruption across all classes. | Unbiased sampling and accurate domain-expert labeling standards. |
| **Diagnostic Utility** | Explains why noisy test sets depress observed metrics (ceiling effect). | Quantifies real-world classification capability and model reliability in production. |
| **Risk of Misuse** | Mistaking $96.34\%$ for proven model capability leads to false confidence. | None; ground truth is verified directly. |

---

## 6. Conclusion

The derivation rigorously explains why the model plateaus at $82\%$: when evaluation labels are corrupted at $\approx 15\%$, a classifier cannot achieve an observed score above $\approx 85\%$ even if it is nearly perfect, because $15\%$ of its correct predictions are scored as incorrect. 

However, **$96.34\%$ must be reported as the estimated clean accuracy under symmetric noise**, not as an established empirical truth. A reliable evaluation requires an independently expert-labeled gold evaluation set (as designed in Milestone 5).

