# HelpDeskNet-50K — Noisy Label Analysis
**Team SheNova Submission**

This repository contains the complete, mathematically verified, and reproducible analysis for the **HelpDeskNet-50K** noisy label challenge ([GitHub Issue #9](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/9)).

---

## 📌 Project Status Across All Milestones

| Milestone | Status | Description | Primary Code & Reports |
|---|---|---|---|
| **Milestone 1 — Quantify Label Noise** | ✅ Verified | Overall noise rate ($15.00\%$), Wilson 95% CI ($[11.83\%, 18.83\%]$), Tier A vs. Tier B pooled $z$-test ($z=4.22, p < 0.0001$). | [`app.py`](app.py), [`test_milestone1.py`](test_milestone1.py) |
| **Milestone 2 — Characterize the Noise** | ✅ Verified | 8 transition breakdown, bidirectional confusion pairs (Billing $\leftrightarrow$ Refund $43.33\%$, Technical $\leftrightarrow$ Account Access $25.00\%$), root-cause hypotheses, and process improvements. | [`milestone2_analysis.py`](milestone2_analysis.py), [`test_milestone2.py`](test_milestone2.py), [`milestone2_report.md`](milestone2_report.md) |
| **Milestone 3 — Estimated Clean Accuracy** | ✅ Verified | Theoretical derivation under symmetric noise ($a \approx 96.34\%$), back-substitution, analysis of estimation limitations, and distinction between theoretical adjustment and empirical evaluation. | [`milestone3_analysis.py`](milestone3_analysis.py), [`test_milestone3.py`](test_milestone3.py), [`milestone3_report.md`](milestone3_report.md) |
| **Milestone 4 — Select 2,000 Tickets for Review** | ✅ Verified | Proposed multi-objective allocation ($1,000$ High-Risk, $600$ Stratified across 12 strata, $400$ Random), deterministic sequential deduplication algorithm, and immutable audit trail schema. | [`milestone4_selection.py`](milestone4_selection.py), [`test_milestone4.py`](test_milestone4.py), [`milestone4_report.md`](milestone4_report.md) |
| **Milestone 5 — Mitigate Noise & Evaluate Reliably** | ✅ Verified | Label Smoothing Cross-Entropy, Co-Teaching dual-model selection algorithm, 10-point gold evaluation protocol, and model comparison framework. | [`milestone5_robustness.py`](milestone5_robustness.py), [`test_milestone5.py`](test_milestone5.py), [`milestone5_report.md`](milestone5_report.md) |

---

## 🖥️ Launching the Streamlit Analytics Dashboard

The presentation-ready Streamlit analytics dashboard provides an interactive, visual walkthrough across all five milestones and methodology.

```bash
# Launch the Streamlit dashboard
streamlit run app.py
```

Features included in the dashboard:
- **Executive Overview**: High-level problem summary, dataset composition, class distributions, and five-stage audit progress.
- **M1 — Quantify Label Noise**: Overall noise rate with Wilson 95% CI, Tier A vs. Tier B comparison, and pooled two-proportion hypothesis test.
- **M2 — Characterize Noise**: Interactive transition analysis, bidirectional confusion pairs, and annotation protocol recommendations.
- **M3 — Estimate Clean Accuracy**: Step-by-step mathematical derivation of $a \approx 96.34\%$, back-substitution, and theoretical assumption boundaries.
- **M4 — Expert Review Strategy**: Multi-objective ticket review allocation chart, sequential deduplication logic, and interactive audit record pipeline demo.
- **M5 — Noise-Robust Training**: Label smoothing targets, co-teaching dual-model retention curve, and 10-point trustworthy gold evaluation protocol.
- **Methodology & Limitations**: Full transparency documentation covering scenario parameters, statistical derivations, and clear acknowledgments of data constraints.

---

## 🚀 Running the Project & Verification Test Suites

### Prerequisites
- Python 3.10+ (tested with Python 3.12)
- Dependencies installed via:
  ```bash
  pip install -r requirements.txt
  ```

### Verification Commands

From `submission/team_shenova`:

```bash
# 1. Milestone 1 — Quantify Label Noise
python test_milestone1.py

# 2. Milestone 2 — Characterize Noise Transitions
python milestone2_analysis.py
python test_milestone2.py

# 3. Milestone 3 — Estimated Clean Accuracy Under Symmetric Noise
python milestone3_analysis.py
python test_milestone3.py

# 4. Milestone 4 — Select 2,000 Review Tickets
python milestone4_selection.py
python test_milestone4.py

# 5. Milestone 5 — Noise Mitigation & Evaluation Architecture
python milestone5_robustness.py
python test_milestone5.py

# Master regression check running all suites (36 tests)
python -m unittest discover -s . -p "test_*.py"
```

---

## 🔒 Data Compliance & Project Integrity Disclaimers
1. **No External or Fabricated Datasets**: In strict accordance with challenge rules, no outside datasets or synthetic ticket-level records were fabricated to mimic real data.
2. **No Model Training Claims**: The code implements verified mathematical derivations, algorithms, and testable components; no real model training or empirical benchmark on HelpDeskNet-50K is claimed.
3. **Interactive Dashboard**: The Streamlit dashboard visualizes verified analytical derivations and demonstrates proposed algorithms using clean, accessible Altair charts and verified statistical components.

