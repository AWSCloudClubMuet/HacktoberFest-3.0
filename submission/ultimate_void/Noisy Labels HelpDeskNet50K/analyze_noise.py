"""
HelpDeskNet-50K: Label Noise Analysis & Statistical Verification Script
========================================================================
This script performs all the statistical calculations, confidence intervals,
hypothesis testing, and mathematical derivations for the HelpDeskNet-50K case study.

Written with clear, beginner-friendly explanations and step-by-step arithmetic.
"""

import math
from scipy import stats

def print_section(title):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)

# ==============================================================================
# MILESTONE 1: QUANTIFY LABEL NOISE
# ==============================================================================
print_section("MILESTONE 1: QUANTIFY LABEL NOISE")

# 1. Dataset Population Numbers
total_dataset = 50000
expert_initial = 5000
crowd_total = 45000
tier_A_total = 20000
tier_B_total = 25000

# 2. Audit Sample Numbers
n_audit = 400
disagreements_total = 60

n_A = 180
k_A = 12

n_B = 220
k_B = 48

# Calculate sample error rates
p_hat_total = disagreements_total / n_audit # 60 / 400 = 0.15 (15.0%)
p_hat_A = k_A / n_A                         # 12 / 180 = 0.0667 (6.67%)
p_hat_B = k_B / n_B                         # 48 / 220 = 0.2182 (21.82%)

print(f"Overall Crowd Audit Error Rate: {p_hat_total:.4f} ({p_hat_total * 100:.2f}%)")
print(f"Tier A Audit Error Rate:        {p_hat_A:.4f} ({p_hat_A * 100:.2f}%)")
print(f"Tier B Audit Error Rate:        {p_hat_B:.4f} ({p_hat_B * 100:.2f}%)")

# 3. Overall 95% Confidence Interval (Wald Method)
# Formula: Margin of Error = z * sqrt(p * (1 - p) / n)
# For 95% confidence, z = 1.96
z_95 = 1.95996
se_total = math.sqrt(p_hat_total * (1 - p_hat_total) / n_audit)
margin_total = z_95 * se_total
ci_total_lower = p_hat_total - margin_total
ci_total_upper = p_hat_total + margin_total

print(f"\n--- Overall 95% Confidence Interval (Wald) ---")
print(f"Standard Error (SE): {se_total:.4f}")
print(f"Margin of Error:     {margin_total:.4f} (or {margin_total * 100:.2f}%)")
print(f"95% CI: [{ci_total_lower:.4f}, {ci_total_upper:.4f}] -> [{ci_total_lower*100:.2f}%, {ci_total_upper*100:.2f}%]")

# 4. Stratified Population Estimate
# Tier A is 20,000 / 45,000 = 44.44% of crowd tickets
# Tier B is 25,000 / 45,000 = 55.56% of crowd tickets
weight_A = tier_A_total / crowd_total
weight_B = tier_B_total / crowd_total
p_strat = (weight_A * p_hat_A) + (weight_B * p_hat_B)
var_strat = (weight_A**2) * (p_hat_A * (1 - p_hat_A) / (n_A - 1)) + (weight_B**2) * (p_hat_B * (1 - p_hat_B) / (n_B - 1))
se_strat = math.sqrt(var_strat)
ci_strat_lower = p_strat - z_95 * se_strat
ci_strat_upper = p_strat + z_95 * se_strat

print(f"\n--- Stratified Population Estimate ---")
print(f"Tier A Weight: {weight_A:.4f}, Tier B Weight: {weight_B:.4f}")
print(f"Stratified Mean Noise Rate: {p_strat:.4f} ({p_strat * 100:.2f}%)")
print(f"Stratified SE:              {se_strat:.4f}")
print(f"Stratified 95% CI:          [{ci_strat_lower*100:.2f}%, {ci_strat_upper*100:.2f}%]")

# 5. Comparing Tier A vs Tier B: Hypothesis Testing
# Null Hypothesis (H0): p_A == p_B (no real difference, difference is just random luck)
# Alternative Hypothesis (H1): p_A != p_B (difference is real and statistically significant)
p_pooled = (k_A + k_B) / (n_A + n_B)
se_pooled = math.sqrt(p_pooled * (1 - p_pooled) * (1 / n_A + 1 / n_B))
z_stat = (p_hat_B - p_hat_A) / se_pooled
p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))

print(f"\n--- Two-Sample Proportion Z-Test (Tier A vs Tier B) ---")
print(f"Difference (Tier B - Tier A): {(p_hat_B - p_hat_A):.4f} ({(p_hat_B - p_hat_A)*100:.2f}% percentage points)")
print(f"Pooled Proportion:           {p_pooled:.4f}")
print(f"Pooled Standard Error:       {se_pooled:.4f}")
print(f"Z-statistic:                 {z_stat:.4f}")
print(f"P-value:                     {p_value:.6e}")

# Chi-Square Test & Fisher's Exact Test
contingency_table = [[k_A, n_A - k_A], [k_B, n_B - k_B]]
chi2, p_chi2, dof, _ = stats.chi2_contingency(contingency_table, correction=False)
odds_ratio, p_fisher = stats.fisher_exact(contingency_table)

print(f"\nChi-Square Statistic: {chi2:.4f} (p-value: {p_chi2:.6e})")
print(f"Fisher's Exact Test p-value: {p_fisher:.6e}")
print(f"Relative Risk (Tier B / Tier A): {p_hat_B / p_hat_A:.2f}x")

# Expected Total Errors in Entire Crowd Dataset
exp_errors_A = tier_A_total * p_hat_A
exp_errors_B = tier_B_total * p_hat_B
exp_errors_total = exp_errors_A + exp_errors_B
print(f"\nExpected Total Errors in Tier A (20,000 tickets): {exp_errors_A:.0f}")
print(f"Expected Total Errors in Tier B (25,000 tickets): {exp_errors_B:.0f}")
print(f"Expected Total Errors in Crowd Data (45,000):     {exp_errors_total:.0f}")
print(f"Share of total errors originating in Tier B:     {(exp_errors_B / exp_errors_total) * 100:.2f}%")


# ==============================================================================
# MILESTONE 2: CHARACTERIZE THE NOISE
# ==============================================================================
print_section("MILESTONE 2: CHARACTERIZE THE NOISE")

disagreements = [
    ("Billing", "Refund", 14),
    ("Refund", "Billing", 12),
    ("Technical", "Account Access", 9),
    ("Shipping", "Other", 8),
    ("Account Access", "Technical", 6),
    ("Technical", "Other", 5),
    ("Other", "Shipping", 3),
    ("Billing", "Other", 3),
]

print("Breakdown of 60 Audit Disagreements:")
for crowd, expert, count in sorted(disagreements, key=lambda x: -x[2]):
    pct = (count / 60) * 100
    print(f"  {crowd:15s} -> {expert:15s} : {count:2d} ({pct:5.1f}%)")

pair_billing_refund = 14 + 12
pair_tech_account = 9 + 6
involving_other = 8 + 3 + 5 + 3

print("\nStructural Confusion Themes:")
print(f"  1. Billing <-> Refund:              {pair_billing_refund} / 60 ({pair_billing_refund / 60 * 100:.1f}%)")
print(f"  2. Technical <-> Account Access:    {pair_tech_account} / 60 ({pair_tech_account / 60 * 100:.1f}%)")
print(f"  3. Ambiguity with 'Other':          {involving_other} / 60 ({involving_other / 60 * 100:.1f}%)")
print(f"  Total explained by top 3 themes:   {pair_billing_refund + pair_tech_account + involving_other} / 60 (100.0%)")


# ==============================================================================
# MILESTONE 3: REASON ABOUT THE ACCURACY CEILING
# ==============================================================================
print_section("MILESTONE 3: REASON ABOUT THE ACCURACY CEILING")

K = 6           # Number of classes
eta = 0.15      # Noise rate (15%)
A_noisy = 0.82  # Measured accuracy on noisy test set

# Under uniform random noise to any of the other (K - 1) classes:
# Probability of flipping to any specific wrong class = eta / (K - 1)
# Measured accuracy formula:
# A_noisy = A_true * (1 - eta) + (1 - A_true) * (eta / (K - 1))
# Solving for A_true:
# A_noisy - eta / (K - 1) = A_true * [1 - eta - eta / (K - 1)]
# A_noisy - eta / (K - 1) = A_true * [1 - eta * K / (K - 1)]
# A_true = (A_noisy - eta / (K - 1)) / (1 - eta * K / (K - 1))

flip_prob_each = eta / (K - 1) # 0.15 / 5 = 0.03
numerator = A_noisy - flip_prob_each
denominator = 1.0 - (eta * K / (K - 1))
A_true = numerator / denominator

# Theoretical ceiling of a 100% perfect model on this noisy test set:
A_noisy_ceiling = 1.0 * (1 - eta) + 0.0 # Oracle agrees with clean labels (85%), disagrees with flipped (15%)

print(f"Noise rate (eta):                          {eta * 100:.1f}%")
print(f"Number of classes (K):                     {K}")
print(f"Measured accuracy on noisy test set:       {A_noisy * 100:.2f}%")
print(f"Theoretical maximum accuracy of an oracle: {A_noisy_ceiling * 100:.2f}%")
print(f"Estimated true model accuracy (A_true):    {A_true * 100:.2f}%")
print(f"Model accuracy as % of theoretical cap:   {(A_noisy / A_noisy_ceiling) * 100:.2f}%")
