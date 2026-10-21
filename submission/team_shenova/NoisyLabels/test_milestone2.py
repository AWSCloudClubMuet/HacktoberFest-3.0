"""
HelpDeskNet-50K — Automated Test Suite for Milestone 2
Team SheNova

Tests compare calculated values from milestone2_analysis against independently
defined expected values derived strictly from the official hackathon scenario.
Also runs regression tests for Milestone 1 to ensure zero breakage.
"""

import sys
import unittest
from milestone2_analysis import (
    OFFICIAL_TRANSITIONS,
    TOTAL_AUDIT_DISAGREEMENTS,
    get_transition_summary,
    get_bidirectional_pairs,
    get_largest_individual_transition,
    get_other_class_involvement,
)
from test_milestone1 import run_milestone1_verification


class TestMilestone2(unittest.TestCase):
    def setUp(self):
        # Independently specified expected counts (Ground Truth from Scenario Specification)
        self.expected_counts = {
            ("Billing", "Refund"): 14,
            ("Refund", "Billing"): 12,
            ("Technical", "Account Access"): 9,
            ("Shipping", "Other"): 8,
            ("Account Access", "Technical"): 6,
            ("Technical", "Other"): 5,
            ("Other", "Shipping"): 3,
            ("Billing", "Other"): 3,
        }
        self.expected_total_disagreements = 60

        # Independently calculated expected percentages (denominator = 60)
        self.expected_percentages = {
            ("Billing", "Refund"): 14 / 60 * 100.0,         # ~23.3333%
            ("Refund", "Billing"): 12 / 60 * 100.0,         # 20.0000%
            ("Technical", "Account Access"): 9 / 60 * 100.0,# 15.0000%
            ("Shipping", "Other"): 8 / 60 * 100.0,          # ~13.3333%
            ("Account Access", "Technical"): 6 / 60 * 100.0,# 10.0000%
            ("Technical", "Other"): 5 / 60 * 100.0,         # ~8.3333%
            ("Other", "Shipping"): 3 / 60 * 100.0,          # 5.0000%
            ("Billing", "Other"): 3 / 60 * 100.0,           # 5.0000%
        }

    def test_transition_completeness_and_uniqueness(self):
        """Verify that every supplied transition appears exactly once, none missing, no duplicates."""
        self.assertEqual(len(OFFICIAL_TRANSITIONS), 8, "Expected exactly 8 transitions.")
        self.assertEqual(set(OFFICIAL_TRANSITIONS.keys()), set(self.expected_counts.keys()))
        for key, expected_val in self.expected_counts.items():
            self.assertEqual(OFFICIAL_TRANSITIONS[key], expected_val, f"Mismatch in count for {key}")

    def test_sum_of_disagreements(self):
        """Verify that the sum of all 8 transitions is exactly 60."""
        actual_sum = sum(OFFICIAL_TRANSITIONS.values())
        self.assertEqual(actual_sum, self.expected_total_disagreements)
        self.assertEqual(actual_sum, 60)

    def test_individual_transition_percentages(self):
        """Verify that each transition's percentage is calculated using 60 as the denominator."""
        summary = get_transition_summary()
        self.assertEqual(len(summary), 8)

        total_pct = 0.0
        for item in summary:
            pair = (item["crowd_label"], item["expert_label"])
            expected_cnt = self.expected_counts[pair]
            expected_pct = self.expected_percentages[pair]

            self.assertEqual(item["count"], expected_cnt)
            self.assertAlmostEqual(item["percentage"], expected_pct, places=4,
                                   msg=f"Percentage mismatch for {pair}")
            total_pct += item["percentage"]

        # Sum of percentages should be 100.0% within floating point tolerance
        self.assertAlmostEqual(total_pct, 100.0, places=4)

    def test_largest_individual_transition(self):
        """Verify that Billing -> Refund is identified as the single largest direction."""
        largest = get_largest_individual_transition()
        self.assertEqual(largest["crowd_label"], "Billing")
        self.assertEqual(largest["expert_label"], "Refund")
        self.assertEqual(largest["count"], 14)
        self.assertAlmostEqual(largest["percentage"], 14 / 60 * 100.0, places=4)
        self.assertAlmostEqual(largest["percentage"], 23.3333, places=2)

    def test_bidirectional_pairs(self):
        """Verify bidirectional pairs: Billing <-> Refund, Technical <-> Account Access, Shipping <-> Other."""
        pairs = get_bidirectional_pairs()
        pair_dict = {p["pair"]: p for p in pairs}

        # 1. Billing <-> Refund: (14 + 12) = 26 -> 26 / 60 = 43.3333%
        self.assertIn("Billing ↔ Refund", pair_dict)
        br = pair_dict["Billing ↔ Refund"]
        self.assertEqual(br["forward_count"], 14)
        self.assertEqual(br["reverse_count"], 12)
        self.assertEqual(br["total_count"], 26)
        self.assertAlmostEqual(br["percentage"], 26 / 60 * 100.0, places=4)
        self.assertAlmostEqual(br["percentage"], 43.33, places=1)

        # 2. Technical <-> Account Access: (9 + 6) = 15 -> 15 / 60 = 25.0000%
        self.assertIn("Technical ↔ Account Access", pair_dict)
        ta = pair_dict["Technical ↔ Account Access"]
        self.assertEqual(ta["forward_count"], 9)
        self.assertEqual(ta["reverse_count"], 6)
        self.assertEqual(ta["total_count"], 15)
        self.assertAlmostEqual(ta["percentage"], 15 / 60 * 100.0, places=4)
        self.assertAlmostEqual(ta["percentage"], 25.00, places=2)

        # 3. Shipping <-> Other: (8 + 3) = 11 -> 11 / 60 = 18.3333%
        self.assertIn("Shipping ↔ Other", pair_dict)
        so = pair_dict["Shipping ↔ Other"]
        self.assertEqual(so["forward_count"], 8)
        self.assertEqual(so["reverse_count"], 3)
        self.assertEqual(so["total_count"], 11)
        self.assertAlmostEqual(so["percentage"], 11 / 60 * 100.0, places=4)
        self.assertAlmostEqual(so["percentage"], 18.33, places=1)

    def test_other_class_involvement(self):
        """
        Verify distinct calculations:
        1. Other as destination (16 / 60 = 26.67%)
        2. Other as origin (3 / 60 = 5.00%)
        3. Other in either direction (19 / 60 = 31.67%)
        """
        other_data = get_other_class_involvement()
        self.assertEqual(other_data["destination_count"], 16)
        self.assertAlmostEqual(other_data["destination_pct"], 16 / 60 * 100.0, places=4)
        self.assertAlmostEqual(other_data["destination_pct"], 26.6667, places=2)

        self.assertEqual(other_data["origin_count"], 3)
        self.assertAlmostEqual(other_data["origin_pct"], 3 / 60 * 100.0, places=4)
        self.assertAlmostEqual(other_data["origin_pct"], 5.00, places=2)

        self.assertEqual(other_data["either_direction_count"], 19)
        self.assertAlmostEqual(other_data["either_direction_pct"], 19 / 60 * 100.0, places=4)
        self.assertAlmostEqual(other_data["either_direction_pct"], 31.6667, places=2)

    def test_milestone1_regression(self):
        """Ensure Milestone 1 calculations and assertions remain strictly intact."""
        try:
            run_milestone1_verification()
        except Exception as e:
            self.fail(f"Milestone 1 regression check failed: {e}")


if __name__ == "__main__":
    unittest.main()

