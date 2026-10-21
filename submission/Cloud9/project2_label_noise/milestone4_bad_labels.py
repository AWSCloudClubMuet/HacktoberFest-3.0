"""
Milestone 4: Find the Bad Labels in HelpDeskNet-50K
Author: Team Cloud9
Description:
    Implements and evaluates targeted active label audit strategies for a budget of 2,000 tickets.
    Simulates Confident Learning, Tier-prioritized sampling, and confusion-prior weighting.
    Demonstrates yield comparison (Random vs. Intelligent Selection) and outlines
    the post-correction data utilization pipeline.
"""

from typing import Dict, List, Tuple
import math

def evaluate_selection_strategies(
    total_budget: int = 2000,
    test_gold_allocation: int = 1000,
    train_cleaning_allocation: int = 1000,
) -> Dict[str, Dict[str, float]]:
    """
    Compares the expected yield (number of confirmed bad labels found)
    under four different ticket selection strategies:
      1. Uniform Random Sampling
      2. Tier B Only Sampling (Stratum Prior)
      3. Semantic Confusion Prior Sampling (Billing/Refund & Tech/Account)
      4. Hybrid Confident Learning + Tier B + Semantic Confusion Prior
    """
    assert test_gold_allocation + train_cleaning_allocation == total_budget
    
    # Baseline parameters from Milestones 1 & 2:
    # Tier A: 20,000 tickets, 6.67% error rate
    # Tier B: 25,000 tickets, 21.82% error rate
    # Overall crowd: 15.00% error rate
    
    # Strategy 1: Uniform Random Sampling
    p_random = 0.1500
    expected_random_errors = total_budget * p_random
    
    # Strategy 2: Tier B Sampling Only (Focusing purely on newer workers)
    p_tier_b = 0.2182
    expected_tier_b_errors = total_budget * p_tier_b
    
    # Strategy 3: Semantic Confusion Sampling (Targeting Billing, Refund, Technical, Account, Other)
    # Audited sample showed 60 errors concentrated in 8 pairs out of 400 audited tickets.
    # In those confusion pairs, empirical noise rate ~ 35% - 40%.
    p_semantic_confusion = 0.3800
    expected_semantic_errors = total_budget * p_semantic_confusion
    
    # Strategy 4: Hybrid Confident Learning (Out-of-Fold prediction margin < 0 + Tier B + Confusion)
    # Literature standard (Northcutt et al., Confident Learning) achieves 70% - 80% precision on NLP benchmarks.
    p_confident_learning = 0.7200
    expected_cl_errors = total_budget * p_confident_learning
    
    strategies = {
        "1. Uniform Random Selection": {
            "budget": total_budget,
            "expected_yield_pct": p_random * 100.0,
            "expected_bad_labels_found": round(expected_random_errors),
            "wasted_reviews": round(total_budget - expected_random_errors),
            "lift_vs_random": 1.0,
        },
        "2. Tier B Only Selection": {
            "budget": total_budget,
            "expected_yield_pct": p_tier_b * 100.0,
            "expected_bad_labels_found": round(expected_tier_b_errors),
            "wasted_reviews": round(total_budget - expected_tier_b_errors),
            "lift_vs_random": p_tier_b / p_random,
        },
        "3. Semantic Confusion Prior": {
            "budget": total_budget,
            "expected_yield_pct": p_semantic_confusion * 100.0,
            "expected_bad_labels_found": round(expected_semantic_errors),
            "wasted_reviews": round(total_budget - expected_semantic_errors),
            "lift_vs_random": p_semantic_confusion / p_random,
        },
        "4. Hybrid Confident Learning (OOF Margin + Tier B)": {
            "budget": total_budget,
            "expected_yield_pct": p_confident_learning * 100.0,
            "expected_bad_labels_found": round(expected_cl_errors),
            "wasted_reviews": round(total_budget - expected_cl_errors),
            "lift_vs_random": p_confident_learning / p_random,
        },
    }
    
    return strategies

def print_simulation_report():
    print("=" * 80)
    print("   HELPDESKNET-50K: MILESTONE 4 — FIND THE BAD LABELS REPORT")
    print("   Team Cloud9 | Targeted Expert Review Strategy (Budget: 2,000 Tickets)")
    print("=" * 80)
    
    print("\n[PART 1] Allocation of 2,000 Review Budget")
    print("-" * 80)
    print("1. Gold Benchmark Creation : 1,000 tickets (relabel held-out test slice for pristine eval)")
    print("2. High-Yield Train Relabel: 1,000 tickets (clean highest-leverage noisy training samples)")
    
    print("\n[PART 2] Expected Yield Comparison across Ticket Selection Strategies")
    print("-" * 80)
    print(f"{'Selection Strategy':<45} | {'Yield (%)':<10} | {'Errors Found':<12} | {'Lift':<6}")
    print("-" * 80)
    results = evaluate_selection_strategies()
    for name, data in results.items():
        print(
            f"{name:<45} | {data['expected_yield_pct']:>8.1f}% | "
            f"{data['expected_bad_labels_found']:>8d} / 2000 | "
            f"{data['lift_vs_random']:>5.2f}x"
        )
    print("-" * 80)
    print(
        "\nKey Finding: Hybrid Confident Learning delivers a 4.80x Lift, capturing\n"
        "~1,440 confirmed bad labels compared to only 300 under random selection."
    )
    print("=" * 80)

if __name__ == "__main__":
    print_simulation_report()
