"""Reproduce issue #9 aggregate calculations using only Python's standard library.

Disagreement is treated as label error only conditionally on adjudicated experts
being correct. No ticket-level data or trained classifier is available.
"""

import argparse
import json
import math
from statistics import NormalDist


TRANSITIONS = {
    "Billing -> Refund": 14,
    "Refund -> Billing": 12,
    "Technical -> Account Access": 9,
    "Shipping -> Other": 8,
    "Account Access -> Technical": 6,
    "Technical -> Other": 5,
    "Other -> Shipping": 3,
    "Billing -> Other": 3,
}
REVIEW_BUDGET = {
    "locked_expert_test": 500,
    "expert_validation": 300,
    "random_training_audit": 400,
    "targeted_training_tier_b": 500,
    "targeted_training_tier_a": 200,
    "targeted_training_diversity": 100,
}


def _counts(errors, total):
    if (type(errors) is not int or type(total) is not int
            or total <= 0 or not 0 <= errors <= total):
        raise ValueError("Require integer counts with 0 <= errors <= total and total > 0")


def wilson_interval(errors, total, confidence=0.95):
    """Two-sided Wilson score interval, without a finite-population correction."""
    _counts(errors, total)
    if not math.isfinite(confidence) or not 0 < confidence < 1:
        raise ValueError("Confidence must be finite and between 0 and 1")
    z = NormalDist().inv_cdf(0.5 + confidence / 2)
    p = errors / total
    denominator = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denominator
    half = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total**2)) / denominator
    return max(0.0, center - half), min(1.0, center + half)


def proportion_z_test(errors_a, total_a, errors_b, total_b):
    """Pooled two-sided z test for H0: p_A = p_B; sign is A minus B."""
    _counts(errors_a, total_a)
    _counts(errors_b, total_b)
    pooled = (errors_a + errors_b) / (total_a + total_b)
    se = math.sqrt(pooled * (1 - pooled) * (1 / total_a + 1 / total_b))
    # At the degenerate margins both observed proportions are equal.
    z = 0.0 if se == 0 else (errors_a / total_a - errors_b / total_b) / se
    return {"pooled_rate": pooled, "null_standard_error": se,
            "z_a_minus_b": z, "two_sided_p": math.erfc(abs(z) / math.sqrt(2))}


def fisher_exact_two_sided(errors_a, total_a, errors_b, total_b):
    """Fixed-margin Fisher test; sum tables no more probable than observed.

    Integer binomial numerators make probability-order comparisons exact.
    This is an independent small-sample cross-check, not a clustering fix.
    """
    _counts(errors_a, total_a)
    _counts(errors_b, total_b)
    errors = errors_a + errors_b
    total = total_a + total_b
    lo, hi = max(0, total_a - (total - errors)), min(total_a, errors)
    observed = math.comb(errors, errors_a) * math.comb(total - errors, total_a - errors_a)
    numerator = 0
    for k in range(lo, hi + 1):
        probability_numerator = math.comb(errors, k) * math.comb(total - errors, total_a - k)
        if probability_numerator <= observed:
            numerator += probability_numerator
    return numerator / math.comb(total, total_a)


def noisy_accuracy(true_accuracy, flip_rate, classes=6):
    """Independent symmetric flips uniformly to OTHER labels only."""
    if type(classes) is not int or classes < 2:
        raise ValueError("At least two integer classes are required")
    if any(not math.isfinite(x) or not 0 <= x <= 1 for x in (true_accuracy, flip_rate)):
        raise ValueError("Accuracy and flip rate must be finite probabilities")
    return true_accuracy * (1 - flip_rate) + (1 - true_accuracy) * flip_rate / (classes - 1)


def infer_true_accuracy(observed_accuracy, flip_rate, classes=6):
    intercept = noisy_accuracy(0, flip_rate, classes)
    slope = noisy_accuracy(1, flip_rate, classes) - intercept
    if not math.isfinite(observed_accuracy) or not 0 <= observed_accuracy <= 1:
        raise ValueError("Observed accuracy must be a finite probability")
    if math.isclose(slope, 0, abs_tol=1e-15):
        raise ValueError("Unidentifiable: noisy labels are independent of the true class")
    result = (observed_accuracy - intercept) / slope
    if result < -1e-12 or result > 1 + 1e-12:
        raise ValueError("Observed accuracy is incompatible with the assumed noise model")
    return min(1.0, max(0.0, result))


def results():
    overall = 60 / 400
    weighted = (20000 / 45000) * (12 / 180) + (25000 / 45000) * (48 / 220)
    return {
        "scope": "Supplied aggregate audit; no model training or ticket-level experiment",
        "crowd_disagreement": {"count": 60, "audited": 400, "rate": overall,
                               "wilson_95": wilson_interval(60, 400),
                               "projected_count_of_45000": overall * 45000},
        "tier_a": {"rate": 12 / 180, "wilson_95": wilson_interval(12, 180)},
        "tier_b": {"rate": 48 / 220, "wilson_95": wilson_interval(48, 220)},
        "tier_comparison": {
            **proportion_z_test(12, 180, 48, 220),
            "fisher_two_sided_p": fisher_exact_two_sided(12, 180, 48, 220),
            "difference_b_minus_a": 48 / 220 - 12 / 180,
            "risk_ratio_b_over_a": (48 / 220) / (12 / 180),
        },
        "sensitivity": {
            "poststratified_crowd_rate": weighted,
            "whole_dataset_rate_if_expert_noise_zero": 0.9 * overall,
            "whole_dataset_formula": "0.9 * crowd_noise + 0.1 * expert_noise",
        },
        "transition_counts": TRANSITIONS,
        "transition_total": sum(TRANSITIONS.values()),
        "billing_refund_share_of_disagreements": 26 / 60,
        "technical_account_share_of_disagreements": 15 / 60,
        "naive_symmetric_flip_model": {
            "classes": 6, "flip_rate": 0.15, "observed_accuracy": 0.82,
            "true_accuracy": infer_true_accuracy(0.82, 0.15),
            "maximum_noisy_accuracy_at_perfect_true_accuracy": noisy_accuracy(1, 0.15),
        },
        "proposed_review_allocation": REVIEW_BUDGET,
        "review_total": sum(REVIEW_BUDGET.values()),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Print full machine-readable results")
    args = parser.parse_args()
    data = results()
    if args.json:
        print(json.dumps(data, indent=2, sort_keys=True, allow_nan=False))
        return
    low, high = data["crowd_disagreement"]["wilson_95"]
    comparison = data["tier_comparison"]
    print(f"Crowd disagreement: 60/400 = 15.0000%; Wilson 95% CI [{low:.4%}, {high:.4%}]")
    print(f"Tier A: {12/180:.4%}; Tier B: {48/220:.4%}")
    print(f"B-A difference: {100*comparison['difference_b_minus_a']:.4f} percentage points")
    print(f"Pooled z (A-B): {comparison['z_a_minus_b']:.6f}; two-sided p: {comparison['two_sided_p']:.8g}")
    print(f"Fisher exact two-sided p: {comparison['fisher_two_sided_p']:.8g}")
    print(f"Naive true accuracy: {data['naive_symmetric_flip_model']['true_accuracy']:.4%}")
    print(f"Proposed additional review budget: {data['review_total']} unique tickets")
    print("All projections and significance claims depend on the assumptions in REPORT.md.")


if __name__ == "__main__":
    main()
