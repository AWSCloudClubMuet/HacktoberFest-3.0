This repository contains the solution for the Noisy Labels: HelpDeskNet-50K hackathon challenge. The goal of this project is to measure annotation noise, identify systematic mislabeling, estimate its impact on model accuracy, and design a robust mitigation strategy.

## Repository Structure

* **`report.md`** - The final, comprehensive analysis report covering all five milestones.
* **`generate_dataset.py`** - Script to generate the synthetic 50K ticket dataset matching the hackathon's statistical parameters.
* **`analysis/`** - Python scripts used to verify calculations:
  * `milestone1_noise_quantification.py`: Calculates confidence intervals and Tier A vs. Tier B statistical significance.
  * `milestone3_accuracy_ceiling.py`: Computes the true accuracy derivation under uniform noise.
  * `milestone4_prioritization.py`: Simulates the active audit prioritization strategy.

## Key Findings

* **Overall Noise:** Estimated at 15.00% (95% CI: [11.50%, 18.50%]).
* **Annotator Discrepancy:** Tier B workers are ~3.27x noisier than experienced Tier A workers.
* **Systematic Errors:** 68.3% of all errors are clustered in specific semantic pairs (Billing vs. Refund, Technical vs. Account Access).
* **Mitigation:** We propose targeted confident-learning audits for Tier B tickets and Forward Loss Correction to train robustly on the remaining noisy data.