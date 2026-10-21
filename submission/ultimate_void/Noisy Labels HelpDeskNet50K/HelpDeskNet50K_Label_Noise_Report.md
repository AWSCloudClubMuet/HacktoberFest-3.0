# HelpDeskNet-50K: Label Noise Analysis & Strategic Mitigation Report

**Dataset:** HelpDeskNet-50K (50,000 customer-support tickets, 6 classes)  
**Baseline Model:** Fine-tuned text classifier plateaued at **82% test accuracy**  
**Audience Level:** Beginner-friendly with complete step-by-step arithmetic, visual tables, and practical machine learning engineering context.

---

## Executive Summary

When a machine learning model stops improving despite trying larger architectures or longer training, practitioners often assume the model has reached its limit. In HelpDeskNet-50K, our investigation reveals that **the bottleneck is not the model—it is the data**.

1. **Noise Quantification:** The crowd-labeled portion of the dataset has an estimated **15.0% error rate** (95% CI: $[11.5\%, 18.5\%]$). Newer crowdworkers (Tier B) have an error rate of **21.8%**, which is over **3.2 times higher** than experienced crowdworkers (Tier A at **6.7%**). This gap is overwhelmingly statistically significant ($p = 2.42 \times 10^{-5}$).
2. **Noise Structure:** Annotation errors are **not random**. Over **68%** of all errors are bidirectional confusions between two semantically overlapping pairs: **Billing $\leftrightarrow$ Refund** (43.3%) and **Technical $\leftrightarrow$ Account Access** (25.0%). Another 31.7% involve dumping ambiguous tickets into **Other**.
3. **Accuracy Ceiling:** On a test set where 15% of labels are noisy, a hypothetically perfect "oracle" model can achieve at most **85% measured accuracy**. An observed score of **82%** means the classifier is already performing near the theoretical upper bound (estimated true accuracy: **$\approx 96.3\%$** under uniform noise assumptions).
4. **Action Plan:** We provide a 4-step targeted strategy to deploy the 2,000-ticket expert review budget, two noise-tolerant training algorithms (Loss Correction and Co-Teaching), and a blueprint for a pristine gold evaluation benchmark.

---

## Milestone 1: Quantify Label Noise

### 1.1 Problem Statement
We need to measure how unreliable the crowd labels are across the 45,000 crowd-labeled tickets, compute a 95% confidence interval, and test whether the difference in error rates between Tier A (experienced) and Tier B (newer) workers is statistically meaningful or just random chance.

---

### 1.2 Data Summary & Basic Counts

| Group | Total Tickets in Dataset | Audited Sample Size ($n$) | Disagreements ($k$) | Sample Noise Rate ($\hat{p}$) |
| :--- | :---: | :---: | :---: | :---: |
| **In-house Experts** | 5,000 (10%) | — | — | Ground Truth (0% assumed) |
| **Crowd Tier A** (10 experienced) | 20,000 (40%) | 180 | 12 | $\frac{12}{180} = \mathbf{6.67\%}$ |
| **Crowd Tier B** (30 newer) | 25,000 (50%) | 220 | 48 | $\frac{48}{220} = \mathbf{21.82\%}$ |
| **Total Crowd Data** | **45,000 (90%)** | **400** | **60** | $\frac{60}{400} = \mathbf{15.00\%}$ |

---

### 1.3 Noise Rate Estimation & 95% Confidence Interval

#### Step 1: Point Estimate
Out of the $n = 400$ audited crowd tickets, experts found $k = 60$ disagreements.
$$\hat{p} = \frac{k}{n} = \frac{60}{400} = 0.1500 \quad (15.00\%)$$

#### Step 2: Standard Error (SE)
The Standard Error measures how much our sample proportion is expected to fluctuate from one random sample to another:
$$SE = \sqrt{\frac{\hat{p}(1 - \hat{p})}{n}} = \sqrt{\frac{0.15 \times (1 - 0.15)}{400}} = \sqrt{\frac{0.1275}{400}} = \sqrt{0.00031875} \approx \mathbf{0.01785} \quad (1.79\%)$$

#### Step 3: Margin of Error ($ME$) for 95% Confidence
For a standard normal distribution (bell curve), 95% of the area falls within $z = 1.96$ standard deviations of the mean:
$$ME = z \times SE = 1.95996 \times 0.01785 \approx \mathbf{0.0350} \quad (3.50\%)$$

#### Step 4: 95% Confidence Interval Range
$$\text{CI}_{95\%} = \hat{p} \pm ME = 0.1500 \pm 0.0350 = [\mathbf{0.1150}, \mathbf{0.1850}] \quad \implies \quad [\mathbf{11.50\%}, \mathbf{18.50\%}]$$

*(Using the Wilson Score Interval without normal approximation yields $[11.83\%, 18.83\%]$, confirming the result).*

#### Step 5: Stratified Population Weighting
Because Tier A represents $\frac{20,000}{45,000} = 44.44\%$ of the crowd data and Tier B represents $\frac{25,000}{45,000} = 55.56\%$, we can also calculate the exact stratified mean:
$$\hat{p}_{\text{strat}} = \left(\frac{4}{9} \times \frac{12}{180}\right) + \left(\frac{5}{9} \times \frac{48}{220}\right) = 0.02963 + 0.12121 = \mathbf{15.08\%}$$
$$\text{Stratified 95% CI} = [\mathbf{11.64\%}, \mathbf{18.53\%}]$$

> **Beginner Summary:** We can say with 95% statistical confidence that the true noise rate across all 45,000 crowd tickets lies between **11.5% and 18.5%**, centered right at **15.0%**.

---

### 1.4 Assessing the Difference: Tier A vs. Tier B

Is Tier B's higher error rate (21.82% vs. 6.67%) a genuine problem, or could it be a fluke of random sampling?

#### Formulating Hypotheses
- **Null Hypothesis ($H_0$):** $p_A = p_B$ (There is no true difference between Tier A and Tier B; the observed gap is just random chance).
- **Alternative Hypothesis ($H_1$):** $p_B > p_A$ or $p_A \neq p_B$ (Tier B has a genuinely higher error rate than Tier A).

#### Step-by-Step Two-Proportion Z-Test
1. **Calculate the Observed Difference:**
   $$\Delta \hat{p} = \hat{p}_B - \hat{p}_A = 0.2182 - 0.0667 = \mathbf{0.1515} \quad (15.15\text{ percentage points})$$

2. **Calculate Pooled Proportion ($p_{\text{pool}}$ under $H_0$):**
   $$p_{\text{pool}} = \frac{k_A + k_B}{n_A + n_B} = \frac{12 + 48}{180 + 220} = \frac{60}{400} = 0.1500$$

3. **Calculate Pooled Standard Error ($SE_{\text{diff}}$):**
   $$SE_{\text{diff}} = \sqrt{p_{\text{pool}}(1 - p_{\text{pool}}) \left(\frac{1}{n_A} + \frac{1}{n_B}\right)} = \sqrt{0.15 \times 0.85 \times \left(\frac{1}{180} + \frac{1}{220}\right)}$$
   $$SE_{\text{diff}} = \sqrt{0.1275 \times (0.005556 + 0.004545)} = \sqrt{0.1275 \times 0.010101} = \sqrt{0.0012879} \approx \mathbf{0.03589}$$

4. **Calculate the Z-Score:**
   $$z = \frac{\Delta \hat{p}}{SE_{\text{diff}}} = \frac{0.1515}{0.03589} \approx \mathbf{4.22}$$

5. **Determine the P-Value:**
   A $z$-score of $+4.22$ sits more than 4 standard deviations out on the bell curve.
   $$p\text{-value} = 2 \times (1 - \Phi(4.22)) \approx \mathbf{2.42 \times 10^{-5}} \quad (\mathbf{0.0000242})$$

#### Verification with Chi-Square ($\chi^2$) and Fisher's Exact Test
- **Pearson's Chi-Square Test:** $\chi^2 = 17.83, \, df = 1, \, p = 2.42 \times 10^{-5}$
- **Fisher's Exact Test:** $p = 1.83 \times 10^{-5}$, Odds Ratio = $0.256$ (Tier B workers have $3.9 \times$ higher odds of making an error).

#### Population Impact Analysis
Let us project these error rates onto the full 45,000 crowd tickets:
- **Expected errors from Tier A:** $20,000 \times 6.67\% = \mathbf{1,333\text{ tickets}}$
- **Expected errors from Tier B:** $25,000 \times 21.82\% = \mathbf{5,455\text{ tickets}}$
- **Total expected crowd errors:** $1,333 + 5,455 = \mathbf{6,788\text{ tickets}}$
- **Tier B's Share of All Errors:** $\frac{5,455}{6,788} = \mathbf{80.36\%}$

> **Conclusion for Milestone 1:**  
> The difference between Tier A and Tier B is **overwhelmingly statistically significant** ($p < 0.0001$). It is virtually impossible to be due to chance. Newer workers in Tier B are **3.27 times more error-prone**, and despite providing only 55.6% of the crowd tickets, **Tier B accounts for over 80% of all annotation errors in the dataset**.

---

## Milestone 2: Characterize the Noise

### 2.1 Problem Statement
Determine whether labeling errors are purely random flips or follow systematic patterns, identify the root causes, and propose specific changes to the annotation workflow.

---

### 2.2 Disagreement Analysis

Below is the full audit table of all 60 disagreements, grouped by category:

| Crowd Label $\rightarrow$ Expert Label | Count | Percentage of Disagreements | Dominant Structural Category |
| :--- | :---: | :---: | :--- |
| **Billing $\rightarrow$ Refund** | 14 | 23.3% | Category 1: Financial Ambiguity (43.3%) |
| **Refund $\rightarrow$ Billing** | 12 | 20.0% | Category 1: Financial Ambiguity |
| **Technical $\rightarrow$ Account Access** | 9 | 15.0% | Category 2: Access & Auth Ambiguity (25.0%) |
| **Shipping $\rightarrow$ Other** | 8 | 13.3% | Category 3: "Other" Catch-All Dumping (31.7%) |
| **Account Access $\rightarrow$ Technical** | 6 | 10.0% | Category 2: Access & Auth Ambiguity |
| **Technical $\rightarrow$ Other** | 5 | 8.3% | Category 3: "Other" Catch-All Dumping |
| **Other $\rightarrow$ Shipping** | 3 | 5.0% | Category 3: "Other" Catch-All Dumping |
| **Billing $\rightarrow$ Other** | 3 | 5.0% | Category 3: "Other" Catch-All Dumping |
| **Total** | **60** | **100.0%** | **3 Focused Structural Categories** |

```
Disagreement Distribution:
Billing <-> Refund:          [#####################] 43.3% (26/60)
Technical <-> Account Access: [############] 25.0% (15/60)
Involving "Other":           [###############] 31.7% (19/60)
All other possible pairs:    [] 0.0% (0/60)
```

---

### 2.3 Key Interpretations: Random vs. Systematic

If annotation noise were random (e.g. workers clicking random radio buttons due to fatigue), errors would be distributed evenly across all $6 \times 5 = 30$ possible off-diagonal error cells. In a random scenario, we would see tickets like *Billing $\rightarrow$ Technical* or *Shipping $\rightarrow$ Account Access*.

Instead, **out of 30 possible confusion pairs, only 5 distinct pairs ever occurred**, and just two bidirectional pairs make up **68.3%** of all errors. This proves conclusively that the noise is **systematic, semantic, and class-conditional**:

1. **The Billing $\leftrightarrow$ Refund Confusion (43.3%):**
   - *Symptom:* Annotators cannot agree when a customer mentions both a charge and money back (e.g., *"You charged me twice on invoice #901, please give my money back"*).
   - *Why it happens:* Both classes deal with money. Without explicit precedence rules, one annotator sees "invoice/charge" and chooses *Billing*, while another sees "give my money back" and chooses *Refund*.

2. **The Technical $\leftrightarrow$ Account Access Confusion (25.0%):**
   - *Symptom:* Tickets involving login failures, 2-Factor Authentication (2FA) errors, or password reset loops flip between *Technical* and *Account Access*.
   - *Why it happens:* An authentication bug is technically software malfunctioning, but its primary intent is accessing an account.

3. **The "Other" Dumping Ground (31.7%):**
   - *Symptom:* High rates of *Shipping $\leftrightarrow$ Other* (11 tickets) and *Technical $\rightarrow$ Other* (5 tickets).
   - *Why it happens:* Annotators use "Other" as a catch-all escape hatch when a ticket is slightly ambiguous, unfamiliar, or spans multiple topics.

---

### 2.4 Root Causes
1. **Ambiguous, Overlapping Annotation Guidelines:** The instructions lacked mutually exclusive operational definitions and hierarchical tie-breaking rules.
2. **Onboarding & Experience Disparity:** Tier A workers had experience and implicit knowledge; Tier B workers (30 newer workers) were thrown into production without sufficient qualification testing, creating a 21.8% error rate.
3. **Single-Annotator Bottleneck:** Each ticket was labeled by only one worker without redundancy, consensus verification, or real-time confidence flags.

---

### 2.5 Actionable Fixes for the Annotation Process

```mermaid
flowchart TD
    Start["New Incoming Ticket"] --> Q1{"Does the customer request<br/>funds returned / refunded?"}
    Q1 -- "Yes" --> Refund["Label: REFUND<br/>(Precedence Rule 1)"]
    Q1 -- "No" --> Q2{"Is the issue related to login,<br/>passwords, 2FA, or permissions?"}
    Q2 -- "Yes" --> Acc["Label: ACCOUNT ACCESS<br/>(Precedence Rule 2)"]
    Q2 -- "No" --> Q3{"Is it a software bug,<br/>crash, or system error?"}
    Q3 -- "Yes" --> Tech["Label: TECHNICAL"]
    Q3 -- "No" --> Q4{"Is it an invoice, subscription,<br/>or charge dispute?"}
    Q4 -- "Yes" --> Bill["Label: BILLING"]
    Q4 -- "No" --> Q5{"Is it physical delivery,<br/>tracking, or carrier delay?"}
    Q5 -- "Yes" --> Ship["Label: SHIPPING"]
    Q5 -- "No" --> Other["Label: OTHER<br/>(Mandatory explanation required)"]
```

1. **Establish Clear Precedence Rules (Tie-Breakers):**
   - *Rule 1 (Refund over Billing):* If a customer requests money back or disputes a completed transaction, classify as **Refund**, even if invoice/billing details are mentioned.
   - *Rule 2 (Account Access over Technical):* If any login, password, session token, or permission barrier prevents user access, classify as **Account Access**, even if caused by a technical glitch.
2. **Restrict the "Other" Category:**
   - Force annotators selecting "Other" to type a brief 5-word explanation or select a sub-reason. This prevents lazy dumping of complex tickets.
3. **Tier B Qualification & Calibration Loop:**
   - Require newer annotators to pass a 50-ticket "golden benchmark" test with $\ge 92\%$ agreement before labeling live tickets.
   - Inject hidden audit tickets (1 in every 20) into the workflow to track annotator drift in real-time.

---

## Milestone 3: Reason About the Accuracy Ceiling

### 3.1 Problem Statement
Estimate the model's true accuracy if we naively assume 15% uniform random label noise on the test set, and explain why that naive estimate cannot be trusted for HelpDeskNet-50K.

---

### 3.2 Mathematical Derivation Under Uniform Noise

Let:
- $K = 6$ (total number of classes).
- $\eta = 0.15$ (probability that a label is corrupted, i.e., 15%).
- $Y^*$ be the true ground-truth label.
- $\tilde{Y}$ be the noisy label in the test set.
- $\hat{Y}$ be the model's predicted label.
- $A_{\text{true}} = P(\hat{Y} = Y^*)$ be the true accuracy against real customer intent.
- $A_{\text{noisy}} = P(\hat{Y} = \tilde{Y}) = 0.82$ (the observed accuracy on the noisy test set).

#### The Uniform Random Noise Assumption
In the naive uniform model:
- With probability $1 - \eta = 0.85$, the label is correct: $\tilde{Y} = Y^*$.
- With probability $\eta = 0.15$, the label is flipped uniformly at random to one of the other $K - 1 = 5$ classes.
- The probability of flipping to any *specific* incorrect class is:
  $$P(\tilde{Y} = j \mid Y^* = i) = \frac{\eta}{K - 1} = \frac{0.15}{5} = \mathbf{0.03} \quad (3.0\%)$$

#### Relating Measured Accuracy to True Accuracy
By the Law of Total Probability:
$$P(\hat{Y} = \tilde{Y}) = P(\hat{Y} = \tilde{Y} \mid \tilde{Y} = Y^*) P(\tilde{Y} = Y^*) + P(\hat{Y} = \tilde{Y} \mid \tilde{Y} \neq Y^*) P(\tilde{Y} \neq Y^*)$$

1. **When the label is clean ($\tilde{Y} = Y^*$, probability $1 - \eta$):**  
   The model agrees with the test label if and only if it predicted the true class.
   $$P(\hat{Y} = \tilde{Y} \mid \tilde{Y} = Y^*) = P(\hat{Y} = Y^*) = A_{\text{true}}$$

2. **When the label is flipped ($\tilde{Y} \neq Y^*$, probability $\eta$):**  
   The noisy label $\tilde{Y}$ was chosen uniformly among the 5 incorrect classes.
   - If the model predicted correctly ($\hat{Y} = Y^*$), it can **never** match the noisy label ($\tilde{Y} \neq Y^*$).
   - If the model made a mistake ($\hat{Y} \neq Y^*$, probability $1 - A_{\text{true}}$), there is a $\frac{1}{K - 1} = \frac{1}{5}$ chance that its incorrect prediction happens to coincide with the random noisy label.

Combining these two terms yields the universal relation:
$$A_{\text{noisy}} = A_{\text{true}}(1 - \eta) + (1 - A_{\text{true}}) \left(\frac{\eta}{K - 1}\right)$$

#### Step-by-Step Numerical Calculation
Plug in our numbers: $A_{\text{noisy}} = 0.82$, $\eta = 0.15$, $K = 6$:
$$0.82 = A_{\text{true}}(1 - 0.15) + (1 - A_{\text{true}}) \left(\frac{0.15}{5}\right)$$
$$0.82 = 0.85 A_{\text{true}} + 0.03(1 - A_{\text{true}})$$
$$0.82 = 0.85 A_{\text{true}} + 0.03 - 0.03 A_{\text{true}}$$
$$0.82 = 0.82 A_{\text{true}} + 0.03$$
$$0.82 - 0.03 = 0.82 A_{\text{true}}$$
$$0.79 = 0.82 A_{\text{true}}$$
$$A_{\text{true}} = \frac{0.79}{0.82} \approx \mathbf{0.9634} \quad (\mathbf{96.34\%})$$

*(If accidental agreement on errors is omitted, $A_{\text{true}} \approx \frac{0.82}{0.85} = 96.47\%$. Both methods yield $\approx 96.3\% - 96.5\%$.)*

---

### 3.3 The Intuition of the "Accuracy Ceiling"

Why can't the model reach 90% or 95% on the test set?
Imagine a hypothetically perfect AI model—an **Oracle** that knows the true ground truth $100\%$ of the time ($A_{\text{true}} = 1.0$).
What score would this perfect Oracle get on our test set?
$$A_{\text{oracle}} = 1.0 \times (1 - \eta) + 0 = 1 - 0.15 = \mathbf{85.00\%}$$

Because 15% of the test labels are wrong, a 100% correct model will disagree with every single one of those 15% corrupted labels!
Therefore, **85% is the absolute theoretical ceiling for any model evaluated on this test set**.

Our fine-tuned classifier is scoring **82.0%**, which represents:
$$\frac{82.0\%}{85.0\%} = \mathbf{96.47\%\text{ of the theoretical maximum}}$$

The model plateaued at 82% because it had already solved almost the entire learnable space. Further training only attempted to memorize noise.

---

### 3.4 Why the Naive Estimate Is Unreliable for HelpDeskNet-50K

While the math above is theoretically sound, relying on $96.34\%$ as the true accuracy is misleading for this specific dataset due to four critical violations of assumptions:

```
  Naive Assumption                          Reality in HelpDeskNet-50K
┌──────────────────────────────────────┐   ┌──────────────────────────────────────────┐
│ 1. Uniform noise across all 6 classes│ ≠ │ Heavy clustering: Billing<->Refund (43%) │
├──────────────────────────────────────┤   ├──────────────────────────────────────────┤
│ 2. Independent errors (Model vs Test)│ ≠ │ Correlated errors: Model trained on noise│
├──────────────────────────────────────┤   ├──────────────────────────────────────────┤
│ 3. Balanced classes                  │ ≠ │ Severe skew: Billing 30% vs Other 5%     │
├──────────────────────────────────────┤   ├──────────────────────────────────────────┤
│ 4. Independent of ticket text        │ ≠ │ Semantic ambiguity on difficult tickets  │
└──────────────────────────────────────┘   └──────────────────────────────────────────┘
```

1. **Noise is Not Uniform (Class-Conditional):**  
   Labels do not flip with 3% probability to random categories. Billing never flips to Technical; it flips almost exclusively to Refund (23.3%). Under asymmetric noise, error dynamics depend on the transition matrix $T_{ij}$, not a single scalar $\eta$.
2. **Correlated Errors (Model Trained on Crowd Noise):**  
   The held-out test set was created by the *same* crowd process as the training set. Because modern deep text classifiers are powerful function approximators, the model learns the crowdworkers' systematic biases! If annotators consistently label ambiguous billing tickets as Refund, the model will make that exact same mistake on the test set. The model and test labels agree on the **wrong** class, which artificially inflates measured accuracy and hides real errors.
3. **Class Imbalance:**  
   Billing is 30% of the dataset, while Other is 5%. A flip from Billing to Refund affects six times more data volume than an error in Other.
4. **Instance-Dependent Difficulty:**  
   Vague or multi-intent tickets confuse both human annotators and deep learning models simultaneously. Label errors correlate strongly with ticket difficulty.

---

## Milestone 4: Find the Bad Labels (Prioritized Expert Review)

### 4.1 Problem Statement
We have a budget for experts to review **only 2,000 additional tickets** out of the 45,000 crowd-labeled dataset. We must maximize the return on expert time, prove the method works, and put the corrected labels to work.

---

### 4.2 Ticket Selection Strategy: The High-Yield Funnel

Random sampling would only uncover $2,000 \times 15\% = 300$ errors (a 15% yield), wasting 85% of expensive expert time. Instead, we use an active, algorithmic selection strategy:

```mermaid
flowchart TD
    Total["45,000 Crowd Tickets"] --> Split["Strategic Budget Split (2,000 Tickets)"]
    Split -->|500 Tickets| GoldSet["Track 1: Pristine Gold Test Set<br/>(Stratified across all 6 classes)"]
    Split -->|1,500 Tickets| Targeted["Track 2: Targeted Training Data Repair"]
    
    Targeted --> Strat1["Filter 1: Prioritize Tier B Workers<br/>(Contains 80.4% of all errors)"]
    Strat1 --> Strat2["Filter 2: Confident Learning / Cross-Validation<br/>(Out-of-fold Prediction Disagreement)"]
    Strat2 --> Strat3["Filter 3: Semantic Confusion Pairs<br/>(Billing-Refund & Tech-Access)"]
    Strat3 --> Experts["Expert Relabeling Queue"]
```

#### Detailed Breakdown of the 2,000 Ticket Budget:
1. **Track 1: 500 Tickets $\rightarrow$ The Gold Evaluation Benchmark:**
   - Take a stratified random sample of 500 tickets across all 6 classes (30% Billing, 15% Refund, 25% Technical, 15% Account Access, 10% Shipping, 5% Other).
   - Have experts thoroughly review and adjudicate these 500 tickets.
   - Combined with the original 5,000 expert tickets, this gives an untainted, gold evaluation benchmark.
2. **Track 2: 1,500 Tickets $\rightarrow$ Targeted High-Probability Error Repair:**
   - Run 5-fold cross-validation across the crowd training set to get out-of-fold predicted probability vectors $\hat{\mathbf{p}}(x)$.
   - Use **Confident Learning** (Northcutt et al., 2021) to calculate the self-confidence threshold per class $t_j = \frac{1}{|X_j|} \sum_{x \in X_j} \hat{p}(y=j \mid x)$.
   - Flag any ticket where the model has high confidence in class $j$, but the crowd labeled it as class $i$ ($i \neq j$).
   - Rank candidates by **Prediction Margin**:
     $$\text{Margin}(x) = \hat{p}(\text{crowd\_label} \mid x) - \max_{j \neq \text{crowd\_label}} \hat{p}(j \mid x)$$
     Select tickets with the most negative margins (where the model strongly rejects the crowd label).
   - Draw **80% of these candidates from Tier B** (since Tier B holds 80.4% of total dataset errors).
   - Focus specifically on candidate tickets crossing the known confusion boundaries: *Billing $\leftrightarrow$ Refund*, *Technical $\leftrightarrow$ Account Access*, and tickets labeled *Other*.

---

### 4.3 How to Evaluate Whether the Ticket Selection Method Works

To prove the algorithm is effective, track four objective metrics:

1. **Error Detection Yield (Precision of Selection):**
   $$\text{Yield} = \frac{\text{Number of tickets where expert overrides crowd label}}{\text{Total tickets selected for review (1,500)}} \times 100\%$$
   - *Baseline (Random):* $15.0\%$ (only 225 errors found).
   - *Target Success Threshold:* **$\ge 75\%$ to $85\%$** (finding 1,125 to 1,275 real errors).
2. **True Test Accuracy Uplift:**
   - Retrain the classifier after updating the 1,500 corrected tickets.
   - Measure accuracy on the untainted Gold Test Set. A statistically significant jump in Macro-F1 confirms real learning.
3. **Confusion Matrix Clean-up:**
   - Verify that off-diagonal confusion between Billing/Refund and Tech/Access drops specifically.
4. **Annotator Tier Agreement Convergence:**
   - Measure how the audited error rate of Tier B changes post-cleaning.

---

### 4.4 How to Use the Corrected Labels Afterward

1. **Dataset Relabeling & Loss Reweighting:**
   - Replace erroneous crowd labels with adjudicated expert labels.
   - Assign sample weights during training: weight = $1.0$ for expert-verified tickets, and weight = $0.6$ for unverified crowd tickets from Tier B.
2. **Estimate the Empirical Noise Transition Matrix ($T$):**
   - Use the verified pairs to compute $T_{ij} = P(\tilde{Y} = i \mid Y^* = j)$. This matrix allows mathematically exact loss correction during model training.
3. **Crowdworker Retraining & Active Guidelines:**
   - Extract the top 50 most instructive disagreement examples from the review to create an interactive "living guidelines" document with realistic edge cases for Tier B workers.

---

## Milestone 5: Mitigate Noise & Evaluate Reliably

### 5.1 Problem Statement
Deploy training algorithms that are inherently robust to remaining label noise, build a trustworthy evaluation benchmark, and clearly articulate why the current crowd-labeled test set is invalid.

---

### 5.2 Two Training-Time Methods for Residual Noise

Even after reviewing 2,000 tickets, approximately $\approx 5,200$ noisy labels will remain in the training set. Standard Cross-Entropy loss will force the neural network to memorize these errors. We recommend two complementary methods:

#### Method 1: Forward Loss Correction via Noise Transition Matrix
- **Concept:** Standard Cross-Entropy penalizes the model when its prediction disagrees with the given label:
  $$\mathcal{L}_{\text{CE}}(\hat{\mathbf{p}}, \tilde{y}) = -\log \hat{p}_{\tilde{y}}$$
  When the given label $\tilde{y}$ is wrong, this loss blows up to infinity, forcing the model to corrupt its weights to fit the error.
- **The Fix:** Using the noise transition matrix $T$ estimated from our expert audits ($T_{ij} = P(\tilde{Y} = i \mid Y^* = j)$), we adjust the model's clean prediction vector before computing the loss:
  $$\hat{\mathbf{p}}_{\text{noisy}} = T^\top \hat{\mathbf{p}}$$
  $$\mathcal{L}_{\text{Forward}} = -\log (\hat{\mathbf{p}}_{\text{noisy}})_{\tilde{y}} = -\log \sum_{j=1}^K T_{\tilde{y} j} \hat{p}_j$$
- **Why it works:** The model is trained to output the **true** distribution $\hat{\mathbf{p}}$, while the loss function internally simulates the known human noise process $T$. The model is never forced to memorize human labeling quirks.

#### Method 2: Co-Teaching (Han et al., 2018)
- **Concept:** Deep neural networks exhibit a well-documented phenomenon known as the **"memorization effect"**: during early training epochs, neural networks learn clean, generalizable patterns first, before eventually memorizing noisy outliers in later epochs.
- **The Algorithm:**
  1. Initialize two identical neural networks ($M_1$ and $M_2$) with different random initializations.
  2. For every mini-batch, $M_1$ selects a fraction $1 - R(t)$ of samples that have the **smallest loss** (the samples most likely to have correct labels).
  3. $M_1$ passes these clean samples to $M_2$ to update $M_2$'s parameters.
  4. Simultaneously, $M_2$ selects its own small-loss samples and feeds them to $M_1$.
- **Why it works:** Because the networks have different initializations, they make different error mistakes. By filtering each other's training batches, they cross-protect one another from memorizing noisy labels.

```
       Mini-Batch Data
         ┌─────────┐
         ▼         ▼
    ┌────────┐ ┌────────┐
    │Model M1│ │Model M2│
    └───┬────┘ └───┬────┘
        │          │
        │ Small    │ Small
        │ Loss     │ Loss
        │ Samples  │ Samples
        ▼          ▼
    ┌────────┐ ┌────────┐
    │Update  │ │Update  │
    │Model M2│ │Model M1│
    └────────┘ └────────┘
```

---

### 5.3 Constructing a Trustworthy Evaluation Set

To make model metrics trustworthy to engineering and business leadership, we must build a dedicated **Gold Benchmark Set**:

| Principle | Implementation Details |
| :--- | :--- |
| **1. 100% Expert Ground Truth** | Pull 2,000 tickets exclusively from the in-house expert pool (combining the original 5,000 expert tickets and the 500 newly audited tickets). **Zero unverified crowd labels are permitted in the test set.** |
| **2. Preserved Class Distribution** | Maintain strict stratification matching operational reality:<br>• Billing: 30% (600 tickets)<br>• Refund: 15% (300 tickets)<br>• Technical: 25% (500 tickets)<br>• Account Access: 15% (300 tickets)<br>• Shipping: 10% (200 tickets)<br>• Other: 5% (100 tickets) |
| **3. Dual-Expert Adjudication** | For borderline tickets (especially Billing vs. Refund and Technical vs. Access), two independent experts label the ticket. In case of disagreement, a Senior Lead adjudicates the final label. |
| **4. Strict Data Leakage Prevention** | Enforce a complete hash-based deduplication and customer ID separation between training, validation, and test splits. |
| **5. Comprehensive Metric Suite** | Do not rely on single overall accuracy. Report:<br>• **Macro-averaged F1 Score** (treats all classes equally, protecting the 5% Other class)<br>• **Per-class Precision and Recall**<br>• **Expected Calibration Error (ECE)** |

---

### 5.4 Why the Existing Crowd-Labeled Test Set Is Fatally Flawed

Evaluating our classifier on the existing crowd-labeled test set is actively harmful to the project for three reasons:

1. **The Artificial 85% Ceiling:**  
   Because 15% of the labels are wrong, a model with 100% real-world accuracy will score at most 85% on this test set. Management will believe the model is mediocre (82%) when it is actually operating at world-class performance ($\approx 96\%$).
2. **Penalizing True Intelligence:**  
   When the model correctly classifies an ambiguous ticket as *Billing*, but a Tier B crowdworker erroneously labeled it *Refund*, the test harness marks the model as **incorrect**. The model is literally penalized for being smarter than the crowdworker.
3. **Harmful Model Selection (The Misalignment Trap):**  
   If the team experiments with hyperparameter tuning or new architectures, the metric will reward whichever model **best mimics the crowdworkers' mistakes**. A model that memorizes the systematic errors of Tier B workers will achieve an 87% test score, while a truly clean model will score 82%. You will deploy the worse model into customer-facing production.

---

## Complete Project Flowchart & Implementation Roadmap

```mermaid
flowchart LR
    subgraph Phase1["Phase 1: Diagnosis"]
        A1["Quantify Noise<br/>(15.0% Overall, Tier B: 21.8%)"] --> A2["Map Disagreements<br/>(Billing-Refund 43%, Tech-Access 25%)"]
    end

    subgraph Phase2["Phase 2: Data Cleaning"]
        A2 --> B1["Allocate 2,000 Reviews<br/>(500 Gold Test / 1,500 Targeted Train)"]
        B1 --> B2["Update Guidelines<br/>(Tie-breaker Decision Trees)"]
    end

    subgraph Phase3["Phase 3: Robust Training"]
        B2 --> C1["Noise-Tolerant Loss<br/>(Forward Correction & Co-Teaching)"]
        C1 --> C2["Retrain Classifier"]
    end

    subgraph Phase4["Phase 4: Trustworthy Evaluation"]
        C2 --> D1["Evaluate on 100% Gold Test Set"]
        D1 --> D2["Report Macro-F1 & Class Calibration"]
    end
```

### Final Takeaway
HelpDeskNet-50K did not have a modeling problem—it had a **measurement and label quality problem**. By shifting engineering effort from hyperparameter tuning to **data-centric quality assurance**, the team can break through the artificial 82% barrier, deploy a trustworthy classifier, and maintain high customer satisfaction.
