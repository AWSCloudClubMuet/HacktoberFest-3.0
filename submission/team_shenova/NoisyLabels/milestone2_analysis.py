"""
HelpDeskNet-50K — Milestone 2: Characterize the Noise
Team SheNova

This module analyzes the 60 crowd-to-expert disagreements observed during
the 400-ticket audit of the HelpDeskNet-50K dataset.

All computations use the supplied aggregate statistics. No synthetic or
ticket-level data are created or assumed.
"""

import sys
from typing import Dict, List, Tuple

# Ensure stdout supports Unicode characters (arrows) on Windows terminals (cp1252)
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass



# Official scenario disagreement transitions (Crowd Label -> Expert Label)
OFFICIAL_TRANSITIONS: Dict[Tuple[str, str], int] = {
    ("Billing", "Refund"): 14,
    ("Refund", "Billing"): 12,
    ("Technical", "Account Access"): 9,
    ("Shipping", "Other"): 8,
    ("Account Access", "Technical"): 6,
    ("Technical", "Other"): 5,
    ("Other", "Shipping"): 3,
    ("Billing", "Other"): 3,
}

TOTAL_AUDIT_DISAGREEMENTS: int = 60


def get_transition_summary() -> List[Dict[str, any]]:
    """
    Computes count and percentage of total disagreements for each transition.
    Denominator is strictly the total number of audited disagreements (60).
    """
    summary = []
    for (crowd_lbl, expert_lbl), count in OFFICIAL_TRANSITIONS.items():
        pct = (count / TOTAL_AUDIT_DISAGREEMENTS) * 100.0
        summary.append({
            "transition": f"{crowd_lbl} → {expert_lbl}",
            "crowd_label": crowd_lbl,
            "expert_label": expert_lbl,
            "count": count,
            "percentage": pct
        })
    # Sort descending by count for clarity
    summary.sort(key=lambda item: item["count"], reverse=True)
    return summary


def get_bidirectional_pairs() -> List[Dict[str, any]]:
    """
    Calculates combined counts and percentages for bidirectional confusion pairs:
    1. Billing <-> Refund
    2. Technical <-> Account Access
    3. Shipping <-> Other
    """
    pair_defs = [
        ("Billing", "Refund"),
        ("Technical", "Account Access"),
        ("Shipping", "Other")
    ]
    
    results = []
    for c1, c2 in pair_defs:
        forward = OFFICIAL_TRANSITIONS.get((c1, c2), 0)
        reverse = OFFICIAL_TRANSITIONS.get((c2, c1), 0)
        total_pair = forward + reverse
        pct = (total_pair / TOTAL_AUDIT_DISAGREEMENTS) * 100.0
        results.append({
            "pair": f"{c1} ↔ {c2}",
            "class_1": c1,
            "class_2": c2,
            "forward_transition": f"{c1} → {c2}",
            "forward_count": forward,
            "reverse_transition": f"{c2} → {c1}",
            "reverse_count": reverse,
            "total_count": total_pair,
            "percentage": pct
        })
    
    # Sort descending by total count
    results.sort(key=lambda item: item["total_count"], reverse=True)
    return results


def get_largest_individual_transition() -> Dict[str, any]:
    """
    Identifies the single transition with the highest disagreement count.
    """
    summary = get_transition_summary()
    return summary[0]  # Already sorted descending


def get_other_class_involvement() -> Dict[str, any]:
    """
    Distinguishes:
    1. 'Other as destination' (crowd -> Other): 16 / 60 = 26.67%
       (Shipping -> Other: 8, Technical -> Other: 5, Billing -> Other: 3)
    2. 'Other as origin' (Other -> crowd): 3 / 60 = 5.00%
       (Other -> Shipping: 3)
    3. 'Other involved in either direction': (16 + 3) = 19 / 60 = 31.67%
    """
    dest_transitions = [
        (("Shipping", "Other"), OFFICIAL_TRANSITIONS[("Shipping", "Other")]),
        (("Technical", "Other"), OFFICIAL_TRANSITIONS[("Technical", "Other")]),
        (("Billing", "Other"), OFFICIAL_TRANSITIONS[("Billing", "Other")]),
    ]
    dest_count = sum(cnt for _, cnt in dest_transitions)
    dest_pct = (dest_count / TOTAL_AUDIT_DISAGREEMENTS) * 100.0

    origin_transitions = [
        (("Other", "Shipping"), OFFICIAL_TRANSITIONS[("Other", "Shipping")])
    ]
    origin_count = sum(cnt for _, cnt in origin_transitions)
    origin_pct = (origin_count / TOTAL_AUDIT_DISAGREEMENTS) * 100.0

    total_either_count = dest_count + origin_count
    total_either_pct = (total_either_count / TOTAL_AUDIT_DISAGREEMENTS) * 100.0

    return {
        "destination_count": dest_count,
        "destination_pct": dest_pct,
        "destination_transitions": dest_transitions,
        "origin_count": origin_count,
        "origin_pct": origin_pct,
        "origin_transitions": origin_transitions,
        "either_direction_count": total_either_count,
        "either_direction_pct": total_either_pct,
    }


def print_milestone2_summary():
    """
    Prints a formatted summary of Milestone 2 calculations to the console.
    """
    print("=" * 70)
    print("HELPDESKNET-50K — MILESTONE 2: NOISE CHARACTERIZATION")
    print("=" * 70)
    
    # 1. Individual transitions
    transitions = get_transition_summary()
    total_count = sum(t["count"] for t in transitions)
    total_pct = sum(t["percentage"] for t in transitions)
    
    print("\n--- 1. INDIVIDUAL DISAGREEMENT TRANSITIONS (DENOMINATOR = 60) ---")
    print(f"{'Transition':<35} | {'Count':>5} | {'Percentage':>10}")
    print("-" * 56)
    for t in transitions:
        print(f"{t['transition']:<35} | {t['count']:>5} | {t['percentage']:>9.2f}%")
    print("-" * 56)
    print(f"{'TOTAL':<35} | {total_count:>5} | {total_pct:>9.2f}%")
    
    # 2. Largest individual transition
    largest = get_largest_individual_transition()
    print(f"\nLargest Individual Direction: {largest['transition']} with {largest['count']} disagreements ({largest['percentage']:.2f}% of all disagreements)")

    # 3. Bidirectional pairs
    pairs = get_bidirectional_pairs()
    print("\n--- 2. BIDIRECTIONAL CONFUSION PAIRS ---")
    print(f"{'Pair':<30} | {'Breakdown':<25} | {'Total':>5} | {'Share of Disagreements':>22}")
    print("-" * 88)
    for p in pairs:
        breakdown = f"{p['forward_count']} + {p['reverse_count']}"
        print(f"{p['pair']:<30} | {breakdown:<25} | {p['total_count']:>5} | {p['percentage']:>21.2f}%")
    print("-" * 88)
    
    combined_top_2 = pairs[0]["total_count"] + pairs[1]["total_count"]
    combined_top_2_pct = (combined_top_2 / TOTAL_AUDIT_DISAGREEMENTS) * 100.0
    print(f"Top 2 Confusion Pairs Combined ({pairs[0]['pair']} + {pairs[1]['pair']}): {combined_top_2} / 60 ({combined_top_2_pct:.2f}%)")

    # 4. Other class involvement distinction
    other_info = get_other_class_involvement()
    print("\n--- 3. 'OTHER' CLASS INVOLVEMENT ANALYSIS ---")
    print(f"- Other as Destination (Expert = Other): {other_info['destination_count']} / 60 ({other_info['destination_pct']:.2f}%)")
    print(f"  [Shipping -> Other: 8, Technical -> Other: 5, Billing -> Other: 3]")
    print(f"- Other as Origin (Crowd = Other):       {other_info['origin_count']} / 60 ({other_info['origin_pct']:.2f}%)")
    print(f"  [Other -> Shipping: 3]")
    print(f"- Other Involved in Either Direction:    {other_info['either_direction_count']} / 60 ({other_info['either_direction_pct']:.2f}%)")



if __name__ == "__main__":
    print_milestone2_summary()
