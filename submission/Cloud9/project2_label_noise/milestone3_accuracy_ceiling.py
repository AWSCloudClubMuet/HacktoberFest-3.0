"""
Milestone 3: Reason About the Accuracy Ceiling
Author: Team Cloud9
Description:
    Derives the theoretical relationship between observed test accuracy and true accuracy
    under uniform symmetric label noise. Evaluates sensitivity to correlated errors,
    asymmetric confusion matrices, and explains why the naive scalar estimate is unreliable.
"""

def estimate_true_accuracy_uniform(
    a_obs: float = 0.82,
    eta: float = 0.15,
    num_classes: int = 6
) -> dict:
    """
    Inverts the uniform symmetric noise equation:
        A_obs = (1 - eta) * A_true + [eta / (K - 1)] * (1 - A_true)
    Solving for A_true:
        A_true = [A_obs - eta / (K - 1)] / [1 - eta - eta / (K - 1)]
               = [A_obs - eta / (K - 1)] / [1 - (K / (K - 1)) * eta]
    """
    k = num_classes
    p_flip_to_specific = eta / (k - 1)
    
    # Exact derivation with lucky match term
    numerator = a_obs - p_flip_to_specific
    denominator = 1.0 - (k / (k - 1)) * eta
    a_true_exact = numerator / denominator
    
    # Simplified upper bound (ignoring lucky match when model is wrong)
    # A_obs ~ (1 - eta) * A_true => A_true ~ A_obs / (1 - eta)
    a_true_simplified = a_obs / (1.0 - eta)
    
    return {
        "a_obs": a_obs,
        "eta": eta,
        "num_classes": k,
        "p_flip_specific": p_flip_to_specific,
        "a_true_exact": a_true_exact,
        "a_true_simplified": a_true_simplified,
        "theoretical_ceiling_if_true_100": (1.0 - eta) + p_flip_to_specific * 0.0,
    }

def simulate_correlated_error_impact(
    a_obs: float = 0.82,
    eta: float = 0.15,
    correlation_levels: list = [0.0, 0.2, 0.4, 0.6, 0.8]
) -> list:
    """
    Demonstrates how correlated errors between annotator and model affect estimated true accuracy.
    If the model learns from noisy labels, when a label is corrupted, the model has probability
    P(Y_hat = Y_tilde | corrupted) = (eta / (K-1)) + rho * (1 - eta / (K-1)).
    """
    results = []
    k = 6
    p_random = eta / (k - 1)
    
    for rho in correlation_levels:
        # P(match | corrupted)
        p_match_corrupted = p_random + rho * (1.0 - p_random)
        # A_obs = (1 - eta) * A_true + p_match_corrupted * (1 - A_true)
        # Solving for A_true:
        # A_obs - p_match_corrupted = A_true * (1 - eta - p_match_corrupted)
        denom = (1.0 - eta) - p_match_corrupted
        if abs(denom) > 1e-6:
            a_true = (a_obs - p_match_corrupted) / denom
        else:
            a_true = None
        results.append((rho, p_match_corrupted, a_true))
    return results

def main():
    print("=" * 78)
    print("   HELPDESKNET-50K: MILESTONE 3 — REASON ABOUT THE ACCURACY CEILING")
    print("   Team Cloud9 | Analytical Derivations & Model Quality Estimation")
    print("=" * 78)
    
    res = estimate_true_accuracy_uniform(a_obs=0.82, eta=0.15, num_classes=6)
    print("\n[PART 1] Mathematical Inversion under Uniform Label Noise")
    print("-" * 78)
    print(f"Observed Test Accuracy (A_obs)      : {res['a_obs']*100:.2f}%")
    print(f"Assumed Noise Rate (eta)            : {res['eta']*100:.2f}% (Uniform over 5 classes)")
    print(f"Probability of Specific Flip        : eta / 5 = {res['p_flip_specific']*100:.2f}%")
    print(f"Estimated True Accuracy (Exact)     : {res['a_true_exact']*100:.2f}%  (A_true = 79 / 82)")
    print(f"Estimated True Accuracy (Simplified): {res['a_true_simplified']*100:.2f}%  (A_obs / (1 - eta))")
    print(f"Theoretical Max Observed if 100% Acc: {res['theoretical_ceiling_if_true_100']*100:.2f}%")
    
    print("\n[PART 2] Sensitivity Analysis: Correlated Errors between Model and Crowd")
    print("-" * 78)
    print("If model mistakes correlate with annotator noise (rho > 0):")
    print(f"{'Correlation (rho)':<20} | {'P(Match | Corrupted)':<22} | {'Estimated A_true':<18}")
    print("-" * 65)
    for rho, p_match, a_true in simulate_correlated_error_impact():
        a_str = f"{a_true*100:.2f}%" if a_true is not None else "N/A"
        print(f"{rho:<20.1f} | {p_match*100:<20.2f}% | {a_str:<18}")
    print("=" * 78)

if __name__ == "__main__":
    main()
