import math
import numpy as np
import pandas as pd


def run_milestone_1():
    n_total, x_total = 400, 60
    n_a, x_a = 180, 12
    n_b, x_b = 220, 48

    pop_a, pop_b = 20000, 25000
    pop_total = pop_a + pop_b

    p_hat = x_total / n_total
    se_overall = np.sqrt((p_hat * (1.0 - p_hat)) / n_total)
    z_crit = 1.95996

    ci_lower = p_hat - z_crit * se_overall
    ci_upper = p_hat + z_crit * se_overall

    weight_a = pop_a / pop_total
    weight_b = pop_b / pop_total
    p_hat_weighted = (weight_a * (x_a / n_a)) + (weight_b * (x_b / n_b))

    p_a = x_a / n_a
    p_b = x_b / n_b
    ratio = p_b / p_a

    p_pool = (x_a + x_b) / (n_a + n_b)
    se_diff = np.sqrt(p_pool * (1.0 - p_pool) * ((1.0 / n_a) + (1.0 / n_b)))

    z_stat = (p_b - p_a) / se_diff

    p_value = 2.0 * (1.0 - 0.5 * (1.0 + math.erf(abs(z_stat) / np.sqrt(2.0))))

    print(f"Overall Sample Size:             {n_total}")
    print(f"Observed Disagreements:          {x_total}")
    print(f"Estimated Noise Rate (p_hat):    {p_hat:.4f} ({p_hat * 100:.2f}%)")
    print(f"Standard Error (SE):             {se_overall:.4f}")
    print(f"Population-Weighted Rate:        {p_hat_weighted:.4f} ({p_hat_weighted * 100:.2f}%)")
    print(f"95% Confidence Interval:         [{ci_lower:.4f}, {ci_upper:.4f}] ({ci_lower * 100:.2f}% to {ci_upper * 100:.2f}%)")

    print("\nTier Comparison Table")
    df_tiers = pd.DataFrame(
        {
            "Tier": ["Tier A (Experienced)", "Tier B (Newer)"],
            "Audited (n)": [n_a, n_b],
            "Disagreements (x)": [x_a, x_b],
            "Error Rate": [f"{p_a * 100:.2f}%", f"{p_b * 100:.2f}%"],
            "Population": [pop_a, pop_b],
            "Population Share": [f"{weight_a * 100:.1f}%", f"{weight_b * 100:.1f}%"],
        }
    )
    print(df_tiers.to_string(index=False))

    print("\nHypothesis Test (H0: p_A == p_B)")
    print(f"Pooled Rate:                     {p_pool:.4f}")
    print(f"Standard Error (Difference):     {se_diff:.4f}")
    print(f"Z-statistic:                     {z_stat:.4f}")
    print(f"P-value:                         {p_value:.6e}")
    print(f"Rate Ratio (Tier B / Tier A):    {ratio:.2f}x")

    if p_value < 0.05:
        print("Verdict: The difference is STATISTICALLY SIGNIFICANT (p < 0.001).")
        print(f"Tier B workers exhibit a noise rate {ratio:.2f}x higher than Tier A.")
    else:
        print("Verdict: The difference is plausibly due to random chance.")


if __name__ == "__main__":
    run_milestone_1()