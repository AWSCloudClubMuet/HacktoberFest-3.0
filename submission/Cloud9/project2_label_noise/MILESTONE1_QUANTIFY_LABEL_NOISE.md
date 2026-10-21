# Milestone 1: Quantify Label Noise in HelpDeskNet-50K

**Team:** Cloud9  
**Track:** Applied Machine Learning / Data-Centric AI (Project Two)  
**Deliverable:** Statistical Noise Analysis, Confidence Interval Derivations & Hypothesis Testing  
**Executable Script:** [`milestone1_analysis.py`](./milestone1_analysis.py)

---

## 1. Executive Summary & Problem Framing

HelpDeskNet-50K consists of 50,000 customer-support tickets across 6 categories. A fine-tuned text classifier plateaus at **82% test accuracy**, with additional training epochs and larger architectures failing to yield improvement. 

Because **90% of the dataset (45,000 tickets) was labeled by crowdworkers** and the held-out test set was collected via the exact same crowd process, the observed plateau strongly suggests that the model is bounded not by model capacity, but by **label corruption (noise ceiling)**.

To rigorously diagnose the data quality, in-house experts conducted a random audit of **400 crowd-labeled tickets**, uncovering **60 label disagreements**.

---

## 2. Overall Crowd Noise Rate Estimation (95% Confidence Interval)

### 2.1. Point Estimate (Pooled Sample)

Let $n = 400$ be the total audited sample size, and $x = 60$ be the number of observed disagreements (noise instances):

$$\hat{p} = \frac{x}{n} = \frac{60}{400} = 0.1500 \quad (15.00\%)$$

- **Empirical Noise Rate:** **15.00%** of crowd annotations conflict with expert ground truth.

---

### 2.2. Standard Error & 95% Confidence Intervals

#### Method A: Wald (Normal Approximation) Confidence Interval

Under standard random sampling assumptions, the standard error is:

$$SE = \sqrt{\frac{\hat{p}(1 - \hat{p})}{n}} = \sqrt{\frac{0.1500 \times 0.8500}{400}} = \sqrt{\frac{0.1275}{400}} \approx 0.0178536 \quad (1.79\%)$$

For a 95% two-sided confidence level, the critical normal value is $z_{0.975} = 1.95996 \approx 1.96$:

$$\text{Margin of Error } (ME) = z \times SE = 1.960 \times 0.01785 \approx 0.0350 \quad (3.50\%)$$

$$\text{95% CI}_{\text{Wald}} = \hat{p} \pm ME = [0.1500 - 0.0350, 0.1500 + 0.0350] = \mathbf{[11.50\%,\, 18.50\%]}$$

---

#### Method B: Wilson Score Interval (Recommended for Proportions)

The Wilson score interval provides superior coverage without underestimating variance near boundaries:

$$\tilde{p} = \frac{\hat{p} + \frac{z^2}{2n}}{1 + \frac{z^2}{n}} = \frac{0.15 + \frac{1.96^2}{800}}{1 + \frac{1.96^2}{400}} \approx 0.1533$$

$$\text{95% CI}_{\text{Wilson}} = \mathbf{[11.83\%,\, 18.83\%]}$$

---

### 2.3. Population-Weighted Stratified Estimator

The 45,000 crowd tickets were annotated across two distinct strata:
- **Tier A (Experienced):** $N_A = 20,000$ tickets ($W_A = \frac{20,000}{45,000} = \frac{4}{9} \approx 44.44\%$)
- **Tier B (Newer):** $N_B = 25,000$ tickets ($W_B = \frac{25,000}{45,000} = \frac{5}{9} \approx 55.56\%$)

In the 400-ticket audit:
- Tier A: $n_A = 180$, $x_A = 12 \implies \hat{p}_A = \frac{12}{180} \approx 6.67\%$
- Tier B: $n_B = 220$, $x_B = 48 \implies \hat{p}_B = \frac{48}{220} \approx 21.82\%$

Applying stratified sampling theory:

$$\hat{p}_{\text{strat}} = W_A \hat{p}_A + W_B \hat{p}_B = \left(\frac{4}{9}\right)(0.06667) + \left(\frac{5}{9}\right)(0.21818) = 0.02963 + 0.12121 = \mathbf{0.1508} \quad (15.08\%)$$

$$\text{Var}(\hat{p}_{\text{strat}}) = W_A^2 \frac{\hat{p}_A (1 - \hat{p}_A)}{n_A - 1} + W_B^2 \frac{\hat{p}_B (1 - \hat{p}_B)}{n_B - 1} \approx 0.0003094$$

$$SE_{\text{strat}} = \sqrt{\text{Var}(\hat{p}_{\text{strat}})} \approx 0.01759 \quad (1.76\%)$$

$$\text{95% CI}_{\text{Stratified}} = \mathbf{[11.64\%,\, 18.53\%]}$$

---

## 3. Comparative Analysis: Tier A vs. Tier B

| Metric | Tier A (Experienced) | Tier B (Newer) | Difference (Tier B - Tier A) |
| :--- | :---: | :---: | :---: |
| **Worker Pool** | 10 workers | 30 workers | +20 workers |
| **Total Tickets Labeled** | 20,000 | 25,000 | +5,000 tickets |
| **Tickets Audited ($n$)** | 180 | 220 | +40 tickets |
| **Disagreements ($x$)** | 12 | 48 | +36 disagreements |
| **Observed Noise Rate ($\hat{p}$)** | **6.67%** | **21.82%** | **+15.15% (3.27× higher)** |
| **95% CI for Subgroup** | [3.85%, 11.26%] | [16.82%, 27.79%] | Non-overlapping CIs |

---

## 4. Hypothesis Testing: Statistical Significance

### 4.1. Hypothesis Formulation
- **Null Hypothesis ($H_0$):** $p_A = p_B$  
  *(There is no difference in annotation noise rates between Tier A and Tier B; observed differences are due to random sampling variance).*
- **Alternative Hypothesis ($H_1$):** $p_A \neq p_B$  
  *(The noise rate of Tier B is systematically different from Tier A).*
- **Significance Level:** $\alpha = 0.05$ (two-tailed test).

---

### 4.2. Two-Proportion Z-Test

Under $H_0$, we pool the disagreement rates:

$$p_{\text{pool}} = \frac{x_A + x_B}{n_A + n_B} = \frac{12 + 48}{180 + 220} = \frac{60}{400} = 0.1500$$

Standard error of the difference:

$$SE_{\text{diff}} = \sqrt{p_{\text{pool}}(1 - p_{\text{pool}}) \left(\frac{1}{n_A} + \frac{1}{n_B}\right)} = \sqrt{0.15 \times 0.85 \left(\frac{1}{180} + \frac{1}{220}\right)} = \sqrt{0.1275 \times 0.010101} \approx 0.035887$$

Computing the test statistic:

$$z = \frac{\hat{p}_B - \hat{p}_A}{SE_{\text{diff}}} = \frac{0.21818 - 0.06667}{0.035887} = \frac{0.151515}{0.035887} \approx \mathbf{4.2220}$$

Calculating the two-sided p-value:

$$p\text{-value} = 2 \times (1 - \Phi(|z|)) = 2 \times (1 - \Phi(4.2220)) \approx \mathbf{2.42 \times 10^{-5}} \quad (\mathbf{0.0000242})$$

---

### 4.3. Pearson Chi-Square & Yates' Continuity Correction

From the $2 \times 2$ contingency table:

$$\chi^2 = \frac{N (ad - bc)^2}{(a+b)(c+d)(a+c)(b+d)} = \mathbf{17.8253} \quad (p = 2.42 \times 10^{-5})$$

With Yates' continuity correction:

$$\chi^2_{\text{Yates}} = \mathbf{16.6568} \quad (p = 4.48 \times 10^{-5})$$

Both statistics correspond to $p < 0.0001$.

---

### 4.4. Statistical Conclusion

Because the p-value ($p \approx 0.000024$) is orders of magnitude smaller than $\alpha = 0.05$ (and even $\alpha = 0.001$), we **conclusively reject the null hypothesis $H_0$**. 

> **Key Finding:** The disparity between Tier A and Tier B is **statistically meaningful and systematic**. Newer Tier B annotators produce **over 3.27× more errors** than experienced Tier A workers.

---

## 5. Machine Learning Insights: Explaining the 82% Test Plateau

1. **Noise Ceiling on Evaluation:**  
   The held-out test set was created using the exact same crowd process as the training data, meaning it contains **$\approx 15\%$ label corruption**.
   
   If a hypothetical classifier predicts the *true expert ground truth* with **100% accuracy**, its measured accuracy against this noisy test set cannot exceed:
   $$\text{Observed Accuracy} \approx 1 - \text{Test Noise Rate} = 1 - 0.15 = 85.0\%$$
   
2. **True Model Competence:**  
   The model's observed plateau at **82%** indicates that the model is already performing remarkably close to the theoretical ceiling ($\approx 82\% / 85\% = 96.5\%$ concordance with the uncorrupted signal).

3. **Strategic Remedy:**  
   Further model capacity scaling or hyperparameter tuning will not break this ceiling. What is required is:
   - Cleaning systematic error pairs (Milestone 2).
   - Correcting the evaluation protocol using in-house expert validation sets.
   - Targeting Tier B workers for automated relabeling or filtering.
