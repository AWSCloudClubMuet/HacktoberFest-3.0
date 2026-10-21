# Milestone 4 — Targeted Expert Review Strategy (2,000 Tickets)
**Project: HelpDeskNet-50K Noisy Labels**  
**Team: SheNova**  

---

## 1. Executive Summary & Objective

In **Milestone 1**, we quantified that the crowd-labeled tickets exhibit a **15.00%** disagreement rate (with Tier B exhibiting **21.82%** error versus Tier A's **6.67%**). In **Milestone 2**, we discovered that disagreements are systematically concentrated in mutual confusion pairs (Billing $\leftrightarrow$ Refund accounting for **43.33%**, and Technical $\leftrightarrow$ Account Access accounting for **25.00%**). In **Milestone 3**, we showed why evaluating on noisy test labels creates a false ceiling at $82\%$.

In **Milestone 4**, we address the operational problem: **experts can review only 2,000 additional tickets** out of the 45,000 crowd-labeled tickets. 

The objective of this milestone is to:
1. Design a defensible, multi-objective allocation strategy for 2,000 tickets.
2. Formulate a deterministic sequential deduplication algorithm.
3. Establish a rigorous audit-trail schema that preserves original crowd labels.
4. Formulate an empirical evaluation framework to measure the effectiveness of the selection method.
5. Explicitly document sampling biases, statistical trade-offs, and estimation limitations.

> **Data Integrity Notice:**  
> The actual 50,000-ticket dataset is unavailable. This milestone establishes the **review-selection plan and reusable selection logic** for future production execution. No actual tickets have been selected, fabricated, or altered.

---

## 2. Proposed Allocation Strategy (2,000 Tickets)

To balance the competing goals of **maximizing label error discovery** versus **ensuring representative dataset coverage and unbiased evaluation**, we propose the following three-tier allocation:

### Table 1: Proposed Review Allocation Plan

| Selection Group | Planned Review Count | Share of Allocation | Primary Operational Objective |
|---|:---:|:---:|---|
| **Group A: High-Risk Uncertainty Tickets** | **1,000** | **50.0%** | Maximize discovery and correction of corrupted training labels. |
| **Group B: Stratified Coverage Across Classes & Tiers** | **600** | **30.0%** | Ensure broad representation across all 6 classes and both worker tiers. |
| **Group C: Representative Random Sample** | **400** | **20.0%** | Enable statistically valid, unbiased population error-rate estimation. |
| **TOTAL** | **2,000** | **100.0%** | **Balanced Error Correction & Measurement Framework** |

*Note: This is a proposed allocation plan grounded in active learning and survey sampling principles, not an organizer-supplied statistic.*

---

## 3. Detailed Selection Methodology & Deduplication

### A. Strict Sequential Deduplication Rule
To ensure that every ticket in the 2,000-ticket review batch is unique and unambiguously assigned to exactly one selection purpose, the selection executes **sequentially from the remaining eligible pool**:

1. **Step 1 (High-Risk)**: Select the top **1,000** highest-risk tickets from the full pool of $45,000$ crowd tickets.
2. **Step 2 (Stratified Coverage)**: From the remaining $44,000$ unselected tickets, select **600** tickets partitioned across the 12 class-by-tier strata.
3. **Step 3 (Representative Random)**: From the remaining $43,400$ unselected tickets, draw **400** tickets via simple random sampling with a fixed random seed.

$$\text{Selected Set} = S_{\text{HighRisk}} \cup S_{\text{Stratified}} \cup S_{\text{Random}}, \quad \text{where } S_i \cap S_j = \emptyset \quad \forall i \neq j$$
$$\text{Total Unique Tickets} = 1,000 + 600 + 400 = 2,000$$

### B. Group A: High-Risk Selection (1,000 Tickets)
- **Selection Signals**:
  1. *Model Predictive Uncertainty*: Lowest softmax margin ($P(y_{(1)}|x) - P(y_{(2)}|x)$) or highest predictive Shannon entropy ($H(y|x) = -\sum p_i \log p_i$).
  2. *Disagreement Prior*: Tickets where model prediction conflicts with crowd label, specifically when the conflict falls along known confusion axes (Billing $\leftrightarrow$ Refund or Technical $\leftrightarrow$ Account Access).
- **Required Fields**: `ticket_id`, `crowd_label`, `worker_tier`, `risk_score` (continuous float $\in [0, 1]$).
- **Purpose**: Maximizes the precision of finding bad labels to clean the training set.
- **Statistical Trade-off**: This sample is heavily selection-biased toward difficult boundary tickets and cannot be used alone to estimate overall dataset noise.

### C. Group B: Stratified Coverage (600 Tickets)
- **Strata Definition**: Cross-product of 6 classes $\times$ 2 worker tiers = **12 distinct strata**:
  - *Billing $\times$ Tier A*, *Billing $\times$ Tier B*
  - *Refund $\times$ Tier A*, *Refund $\times$ Tier B*
  - *Technical $\times$ Tier A*, *Technical $\times$ Tier B*
  - *Account Access $\times$ Tier A*, *Account Access $\times$ Tier B*
  - *Shipping $\times$ Tier A*, *Shipping $\times$ Tier B*
  - *Other $\times$ Tier A*, *Other $\times$ Tier B*
- **Balanced Allocation Rule**:
  $$\text{Quota per Stratum} = \frac{600 \text{ tickets}}{12 \text{ strata}} = 50 \text{ tickets per stratum}$$
- **Shortfall Fallback**: If a low-frequency stratum (e.g. *Other $\times$ Tier A*) contains fewer than 50 available tickets in a future dataset, all available tickets in that stratum are selected, and the remaining deficit is redistributed to adjacent strata based on risk score.
- **Purpose**: Prevents the high-risk filter from starving low-frequency classes (such as Shipping 10%, Other 5%) or higher-quality workers (Tier A).

### D. Group C: Representative Random Sample (400 Tickets)
- **Methodology**: Uniform probability sampling without replacement from the remaining eligible tickets using a fixed, documented random seed (e.g., `seed = 42`).
- **Purpose**: Provides an uncorrupted, probability-sampled validation anchor. This allows data scientists to compute an unbiased population error estimate with known confidence intervals.
- **Distinction**: This sample is distinct from the original 400-ticket audit sample and will serve as a follow-up benchmark.

---

## 4. Expert Review Workflow & Label-Tracking Schema

To maintain data provenance and prevent data loss, the expert review process must never overwrite the original annotations.

### Audit Record Schema

Each reviewed ticket produces an immutable record implementing the following schema:

```python
@dataclass
class ExpertReviewAuditRecord:
    ticket_id: str                      # Unique ticket identifier
    original_crowd_label: str           # Preserved original label (immutable)
    worker_tier: str                    # Tier A or Tier B
    selection_group: str                # High-Risk, Stratified, or Random
    expert_label: Optional[str]         # Verified expert label
    reviewer_id: Optional[str]          # Pseudonymous expert agent ID
    review_status: str                  # PENDING, COMPLETED, or ESCALATED_ADJUDICATION
    is_disagreement: Optional[bool]     # crowd_label != expert_label
    correction_rationale: Optional[str] # Documented justification / decision rule applied
```

### Review & Adjudication Protocol
1. **Preservation**: The original crowd label is permanently retained in `original_crowd_label`.
2. **Independent Review**: The expert assigns an `expert_label` without being biased by model predictions.
3. **Automated Flagging**: `is_disagreement` is set automatically (`original_crowd_label != expert_label`).
4. **Adjudication Escalation**: If an expert encounters ambiguous customer wording where multiple categories apply, the ticket status is marked `ESCALATED_ADJUDICATION` and routed to a secondary panel of senior agents.
5. **Audit Trail**: Every change records `reviewer_id`, timestamp, and a standardized rationale code (e.g. `RULE_1_REFUND_OVER_BILLING`).

---

## 5. Evaluation Framework for the Selection Strategy

When executed on a future dataset, the selection strategy must be evaluated across five quantitative metrics:

1. **Error Discovery Yield (Precision)**:
   $$\text{Yield}_g = \frac{\text{Number of Confirmed Mislabelings in Group } g}{\text{Total Tickets Reviewed in Group } g}$$
   - *Hypothesis*: $\text{Yield}_{\text{HighRisk}} > \text{Yield}_{\text{Stratified}} > \text{Yield}_{\text{Random}}$.
2. **Review Efficiency (Error Yield per Expert Hour)**:
   $$\text{Efficiency}_g = \frac{\text{Disagreements Found}_g}{\text{Expert Review Hours Spent}_g}$$
3. **Class & Tier Coverage**:
   Verification that all 12 strata achieve at least 50 reviewed tickets, ensuring no category is ignored.
4. **Adjudication Rate**:
   $$\text{Adjudication Rate} = \frac{\text{Tickets Escalated to Committee}}{2,000}$$
   High adjudication rates (> 10%) indicate remaining guideline ambiguities requiring clarification.
5. **Population Noise Tracking**:
   Using the 400 random sample tickets to test whether population noise has shifted compared to Milestone 1's $15.00\%$ baseline.

---

## 6. Sampling Limitations & Estimation Cautions

1. **Selection Bias of High-Risk Samples**:
   The 1,000 high-risk tickets intentionally over-sample difficult tickets. Calculating error rate exclusively on this subset (e.g., finding $60\%$ errors) would grossly overestimate the overall dataset noise.
2. **Weighting Requirement for Combined Estimates**:
   Because selection probabilities differ across groups ($P_{\text{HighRisk}} \gg P_{\text{Random}}$), the combined 2,000-ticket pool **must not be treated as a simple random sample**. Any population-wide metric computed from the combined pool requires Horvitz-Thompson survey weights ($w_i = 1 / \pi_i$).
3. **Proposal vs. Reality**:
   The 2,000-ticket plan is an operational proposal. Actual error correction and model retraining can only take place once genuine ticket text records are provided.
