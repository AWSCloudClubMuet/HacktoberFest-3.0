# Organizer issue #9: Noisy Labels: HelpDeskNet-50K

Source: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/9

Status: source requirements, not an implemented solution.

---

Noisy Labels: HelpDeskNet-50K

## 🎯 Goal
Measure annotation noise, identify systematic mislabeling, estimate its impact on model accuracy, prioritize expert relabeling, and design a robust training and evaluation strategy.

---

## 🏢 Scenario
**HelpDeskNet-50K** is a fictional dataset of **50,000** customer-support tickets, each labeled with one of six classes. A fine-tuned text classifier plateaus at **82% accuracy** on a held-out test set; more epochs or a larger model do not help.

### Dataset class distribution

| Class | Share of data |
| --- | ---: |
| Billing | 30% |
| Refund | 15% |
| Technical | 25% |
| Account Access | 15% |
| Shipping | 10% |
| Other | 5% |

### Labeling process
- **5,000 tickets (10%)** were labeled by in-house expert agents.
- **45,000 tickets (90%)** were labeled by crowdworkers.
- **Tier A:** 10 experienced workers labeled **20,000** tickets.
- **Tier B:** 30 newer workers labeled **25,000** tickets.
- The held-out test set was labeled by the **same crowd process** as the training set.

### Expert audit
Experts relabeled **400** randomly selected crowd-labeled tickets and identified **60 disagreements**.

| Crowd group | Audited | Disagreements |
| --- | ---: | ---: |
| Tier A | 180 | 12 |
| Tier B | 220 | 48 |

**Breakdown of 60 disagreements (crowd → expert):**

| Crowd label → Expert label | Count |
| --- | ---: |
| Billing → Refund | 14 |
| Refund → Billing | 12 |
| Technical → Account Access | 9 |
| Shipping → Other | 8 |
| Account Access → Technical | 6 |
| Technical → Other | 5 |
| Other → Shipping | 3 |
| Billing → Other | 3 |

---

## 📍 Milestones & Subtasks

### 🧩 Milestone 1 — Quantify Label Noise

**Problem:** Determine how unreliable the crowd labels are.

**Required analysis:**
1. Estimate the crowd-labeled dataset's noise rate with a **95% confidence interval**.
2. Assess whether the difference between Tier A and Tier B is statistically meaningful or plausibly due to chance.
3. **Show your calculations.**

---

### 🧩 Milestone 2 — Characterize the Noise

**Problem:** Determine whether labeling errors are random or systematic.

**Required analysis:**
1. Interpret patterns in the crowd-to-expert disagreement table.
2. Identify the most likely root cause.
3. Explain what to check or change in the annotation process.

---

### 🧩 Milestone 3 — Reason About the Accuracy Ceiling

**Problem:** Infer underlying classification quality despite noisy evaluation labels.

**Required analysis:**
1. **Naively assume 15%** of labels are flipped uniformly at random to one of the other five classes. If the model gets **82% accuracy on the noisy test set**, estimate its approximate true accuracy.
2. Explain why that estimate might be unreliable for **this dataset**.

---

### 🧩 Milestone 4 — Find the Bad Labels

**Problem:** Experts can review only **2,000 additional tickets**.

**Required analysis:**
1. Propose a strategy for choosing which tickets to review.
2. Describe how to evaluate whether the ticket-selection method works.
3. Explain how to use the corrected labels afterward.

---

### 🧩 Milestone 5 — Mitigate Noise & Evaluate Reliably

**Problem:** Improve model robustness and make reported performance trustworthy.

**Required analysis:**
1. Name **two training-time methods** that tolerate residual label noise.
2. Explain how to construct a trustworthy evaluation set.
3. Explain why the existing crowd-labeled test set is problematic.

---

## 📦 Expected Deliverables
A documented analysis with confidence intervals and supporting calculations, annotation-quality findings, a targeted expert-review plan, noise-robust training proposals, and a trustworthy evaluation strategy.


