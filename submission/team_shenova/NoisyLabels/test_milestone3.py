"""
HelpDeskNet-50K — Automated Test Suite for Milestone 3
Team SheNova

Tests independently verify the mathematical derivation, back-substitution,
input validation, boundary cases, and regression against Milestones 1 and 2.
"""

import unittest
from milestone3_analysis import (
    estimate_true_accuracy,
    reconstruct_noisy_accuracy,
    get_derivation_details,
)
from test_milestone1 import run_milestone1_verification
from milestone2_analysis import get_transition_summary


class TestMilestone3(unittest.TestCase):
    def setUp(self):
        # Independently specified expected scenario parameters
        self.k_scenario = 6
        self.q_scenario = 0.15
        self.a_noisy_scenario = 0.82
        
        # Independently calculated expected true accuracy:
        # a = (0.82 - 0.15/5) / (1 - 0.15 - 0.15/5) = 0.79 / 0.82 = 79 / 82
        self.expected_true_accuracy = 79.0 / 82.0 # 0.9634146341463414

    def test_official_scenario_calculation(self):
        """Confirm that K=6, q=0.15, A_noisy=0.82 produces approx 0.9634146."""
        computed_a = estimate_true_accuracy(
            a_noisy=self.a_noisy_scenario,
            q=self.q_scenario,
            k=self.k_scenario
        )
        self.assertAlmostEqual(computed_a, self.expected_true_accuracy, places=7)
        self.assertAlmostEqual(computed_a, 0.9634146, places=6)
        self.assertAlmostEqual(computed_a * 100.0, 96.34, places=1)

    def test_back_substitution_reconstruction(self):
        """Substitute calculated a back into forward formula to reconstruct 0.82."""
        computed_a = estimate_true_accuracy(
            a_noisy=self.a_noisy_scenario,
            q=self.q_scenario,
            k=self.k_scenario
        )
        reconstructed_noisy = reconstruct_noisy_accuracy(
            a_true=computed_a,
            q=self.q_scenario,
            k=self.k_scenario
        )
        self.assertAlmostEqual(reconstructed_noisy, self.a_noisy_scenario, places=7)
        self.assertAlmostEqual(reconstructed_noisy, 0.82, places=4)

    def test_derivation_details_structure(self):
        """Verify derivation details dictionary contains all expected step components."""
        details = get_derivation_details()
        self.assertEqual(details["k"], 6)
        self.assertEqual(details["q"], 0.15)
        self.assertEqual(details["a_noisy"], 0.82)
        self.assertAlmostEqual(details["term_clean_coeff"], 0.85, places=5)
        self.assertAlmostEqual(details["term_corrupt_coeff"], 0.03, places=5)
        self.assertAlmostEqual(details["numerator"], 0.79, places=5)
        self.assertAlmostEqual(details["denominator"], 0.82, places=5)
        self.assertAlmostEqual(details["true_accuracy_estimate"], self.expected_true_accuracy, places=7)

    def test_boundary_zero_noise(self):
        """When q=0 (clean labels), true accuracy must equal observed noisy accuracy."""
        for test_acc in [0.50, 0.82, 0.95]:
            computed_a = estimate_true_accuracy(a_noisy=test_acc, q=0.0, k=6)
            self.assertAlmostEqual(computed_a, test_acc, places=7)

    def test_boundary_perfect_accuracy_forward(self):
        """If true accuracy is 1.0, noisy accuracy must equal (1 - q) + q/(K-1)*0 = 1 - q."""
        reconstructed = reconstruct_noisy_accuracy(a_true=1.0, q=0.15, k=6)
        self.assertAlmostEqual(reconstructed, 0.85, places=7)

    def test_boundary_random_guessing_model(self):
        """If model guesses randomly with a = 1/K, noisy accuracy remains 1/K regardless of q."""
        k = 6
        a_random = 1.0 / k
        reconstructed = reconstruct_noisy_accuracy(a_true=a_random, q=0.15, k=k)
        self.assertAlmostEqual(reconstructed, a_random, places=7)

    def test_invalid_inputs(self):
        """Check proper exceptions for invalid class counts, probabilities, and noise rates."""
        # Invalid K
        with self.assertRaises(ValueError):
            estimate_true_accuracy(a_noisy=0.82, q=0.15, k=1)
        with self.assertRaises(ValueError):
            estimate_true_accuracy(a_noisy=0.82, q=0.15, k="six") # type: ignore

        # Invalid q
        with self.assertRaises(ValueError):
            estimate_true_accuracy(a_noisy=0.82, q=-0.05, k=6)
        with self.assertRaises(ValueError):
            estimate_true_accuracy(a_noisy=0.82, q=1.05, k=6)

        # Invalid a_noisy
        with self.assertRaises(ValueError):
            estimate_true_accuracy(a_noisy=-0.1, q=0.15, k=6)
        with self.assertRaises(ValueError):
            estimate_true_accuracy(a_noisy=1.1, q=0.15, k=6)

        # Singular denominator case: q = (K - 1) / K = 5 / 6 for K=6
        q_singular = 5.0 / 6.0
        with self.assertRaises(ZeroDivisionError):
            estimate_true_accuracy(a_noisy=0.82, q=q_singular, k=6)

    def test_milestone1_and_2_regression(self):
        """Confirm that running Milestone 3 does not break Milestone 1 or Milestone 2."""
        # M1 verification
        try:
            run_milestone1_verification()
        except Exception as e:
            self.fail(f"Milestone 1 regression failed: {e}")

        # M2 verification
        m2_transitions = get_transition_summary()
        self.assertEqual(len(m2_transitions), 8)
        self.assertEqual(sum(t["count"] for t in m2_transitions), 60)


if __name__ == "__main__":
    unittest.main()
