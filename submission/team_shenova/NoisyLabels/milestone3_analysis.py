"""
HelpDeskNet-50K — Milestone 3: Estimated Clean Accuracy Under Symmetric Noise
Team SheNova


This module implements the theoretical derivation and calculation for estimating
a classifier's true accuracy from its observed noisy accuracy under a symmetric
label-noise model.

All calculations are derived dynamically. In accordance with project rules,
no individual ticket-level dataset or empirical model training is claimed.
"""

import sys
from typing import Dict, Any

# Ensure stdout supports Unicode characters across all platforms
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def estimate_true_accuracy(a_noisy: float = 0.82, q: float = 0.15, k: int = 6) -> float:
    """
    Estimates true accuracy (a) given observed noisy accuracy (A_noisy),
    noise rate (q), and number of classes (K) under uniform symmetric noise.
    
    Formula:
        A_noisy = (1 - q) * a + (q / (K - 1)) * (1 - a)
        Solving for a:
        a = (A_noisy - q / (K - 1)) / (1 - q - q / (K - 1))
    """
    if not isinstance(k, int) or k < 2:
        raise ValueError(f"Number of classes K must be an integer >= 2, got {k}")
    if not (0.0 <= q < 1.0):
        raise ValueError(f"Noise rate q must be in range [0, 1), got {q}")
    if not (0.0 <= a_noisy <= 1.0):
        raise ValueError(f"Noisy accuracy A_noisy must be in range [0, 1], got {a_noisy}")
    
    chance_flip = q / (k - 1)
    denom = (1.0 - q) - chance_flip
    
    if abs(denom) < 1e-12:
        raise ZeroDivisionError(
            f"Denominator (1 - q - q/(K-1)) is zero when q = (K-1)/K = {(k-1)/k:.4f}. "
            "At this noise rate, labels carry zero mutual information with true classes."
        )
    
    a_true = (a_noisy - chance_flip) / denom
    return a_true


def reconstruct_noisy_accuracy(a_true: float, q: float = 0.15, k: int = 6) -> float:
    """
    Reconstructs observed noisy accuracy from true accuracy under symmetric noise.
    Forward formula:
        A_noisy = (1 - q) * a_true + (q / (K - 1)) * (1 - a_true)
    """
    if not isinstance(k, int) or k < 2:
        raise ValueError(f"Number of classes K must be an integer >= 2, got {k}")
    if not (0.0 <= q < 1.0):
        raise ValueError(f"Noise rate q must be in range [0, 1), got {q}")
    
    chance_flip = q / (k - 1)
    a_noisy = (1.0 - q) * a_true + chance_flip * (1.0 - a_true)
    return a_noisy


def get_derivation_details() -> Dict[str, Any]:
    """
    Returns step-by-step mathematical derivation details using official values.
    """
    k = 6
    q = 0.15
    a_noisy = 0.82
    
    term_clean_coeff = 1.0 - q                   # 0.85
    term_corrupt_coeff = q / (k - 1)             # 0.15 / 5 = 0.03
    denom = term_clean_coeff - term_corrupt_coeff # 0.85 - 0.03 = 0.82
    numer = a_noisy - term_corrupt_coeff          # 0.82 - 0.03 = 0.79
    a_est = numer / denom                         # 0.79 / 0.82 ~ 0.9634146...
    reconstructed = reconstruct_noisy_accuracy(a_est, q, k)
    
    return {
        "k": k,
        "q": q,
        "a_noisy": a_noisy,
        "term_clean_coeff": term_clean_coeff,
        "term_corrupt_coeff": term_corrupt_coeff,
        "numerator": numer,
        "denominator": denom,
        "true_accuracy_estimate": a_est,
        "true_accuracy_pct": a_est * 100.0,
        "reconstructed_noisy_accuracy": reconstructed
    }


def print_milestone3_summary():
    """
    Prints a detailed console summary of the Milestone 3 derivation.
    """
    details = get_derivation_details()
    print("=" * 70)
    print("HELPDESKNET-50K — MILESTONE 3: ESTIMATED CLEAN ACCURACY UNDER SYMMETRIC NOISE")
    print("=" * 70)

    print(f"Number of classes (K):            {details['k']}")
    print(f"Assumed noise rate (q):           {details['q'] * 100:.1f}%")
    print(f"Observed noisy accuracy (A_noisy): {details['a_noisy'] * 100:.2f}%")
    print("-" * 70)
    print("Symmetric Noise Model Equation:")
    print("  A_noisy = (1 - q)*a + [q / (K - 1)] * (1 - a)")
    print(f"  {details['a_noisy']} = ({details['term_clean_coeff']:.2f})*a + ({details['term_corrupt_coeff']:.2f})*(1 - a)")
    print(f"  {details['a_noisy']} = ({details['denominator']:.2f})*a + {details['term_corrupt_coeff']:.2f}")
    print(f"  a = ({details['a_noisy']} - {details['term_corrupt_coeff']:.2f}) / {details['denominator']:.2f}")
    print(f"  a = {details['numerator']:.4f} / {details['denominator']:.4f}")
    print(f"Estimated True Accuracy (a):       {details['true_accuracy_pct']:.4f}% ({details['true_accuracy_estimate']:.7f})")
    print(f"Reconstructed Noisy Accuracy:     {details['reconstructed_noisy_accuracy']:.4f} (matches {details['a_noisy']})")
    print("=" * 70)


if __name__ == "__main__":
    print_milestone3_summary()
