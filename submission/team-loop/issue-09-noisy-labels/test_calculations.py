import itertools
import math
import unittest
from fractions import Fraction

from calculations import (TRANSITIONS, REVIEW_BUDGET, fisher_exact_two_sided,
                          infer_true_accuracy, noisy_accuracy, proportion_z_test,
                          results, wilson_interval)

class IntervalTests(unittest.TestCase):
    def test_wilson_known_reference(self):
        lo, hi = wilson_interval(0, 10)
        self.assertAlmostEqual(lo, 0)
        self.assertAlmostEqual(hi, 0.2775327998628892, places=12)

    def test_wilson_symmetry_and_bounds(self):
        for n in (1, 10, 180, 400):
            for k in (0, n // 2, n):
                lo, hi = wilson_interval(k, n)
                rlo, rhi = wilson_interval(n - k, n)
                self.assertLessEqual(lo, k / n + 1e-15)
                self.assertGreaterEqual(hi + 1e-15, k / n)
                self.assertAlmostEqual(lo, 1 - rhi)
                self.assertAlmostEqual(hi, 1 - rlo)

    def test_invalid_counts_and_confidence(self):
        for k, n in ((-1, 10), (11, 10), (1, 0), (1.5, 10), (True, 10)):
            with self.assertRaises(ValueError):
                wilson_interval(k, n)
        for c in (0, 1, float("nan"), float("inf")):
            with self.assertRaises(ValueError):
                wilson_interval(1, 10, c)

    def test_audit_interval(self):
        lo, hi = wilson_interval(60, 400)
        self.assertAlmostEqual(lo, 0.118345, places=6)
        self.assertAlmostEqual(hi, 0.188314, places=6)
        for bound in (lo, hi):
            self.assertAlmostEqual(400 * (0.15-bound)**2 / (bound*(1-bound)),
                                   3.841458820694124, places=10)

class ComparisonTests(unittest.TestCase):
    def test_z_against_independent_chi_square_statistic(self):
        observed = ((12, 168), (48, 172))
        row_totals, column_totals = (180, 220), (60, 340)
        chi_square = sum(
            (observed[r][c] - row_totals[r] * column_totals[c] / 400) ** 2
            / (row_totals[r] * column_totals[c] / 400)
            for r in range(2) for c in range(2)
        )
        test = proportion_z_test(12, 180, 48, 220)
        self.assertAlmostEqual(test["z_a_minus_b"] ** 2, chi_square)
        self.assertLess(test["two_sided_p"], 0.001)

    def test_fisher_known_small_table(self):
        self.assertAlmostEqual(fisher_exact_two_sided(1, 10, 11, 14),
                               0.0027594561852200836, places=14)

    def test_fisher_against_exhaustive_assignments(self):
        frequencies = {}
        for positions in itertools.combinations(range(8), 3):
            errors_in_a = sum(p < 4 for p in positions)
            frequencies[errors_in_a] = frequencies.get(errors_in_a, 0) + 1
        for k, frequency in frequencies.items():
            expected = Fraction(sum(v for v in frequencies.values() if v <= frequency),
                                math.comb(8, 3))
            self.assertAlmostEqual(fisher_exact_two_sided(k, 4, 3-k, 4), float(expected))

    def test_tier_swap_invariance(self):
        a = proportion_z_test(12, 180, 48, 220)
        b = proportion_z_test(48, 220, 12, 180)
        self.assertAlmostEqual(a["z_a_minus_b"], -b["z_a_minus_b"])
        self.assertAlmostEqual(a["two_sided_p"], b["two_sided_p"])
        self.assertAlmostEqual(fisher_exact_two_sided(12, 180, 48, 220),
                               fisher_exact_two_sided(48, 220, 12, 180))

    def test_equal_and_degenerate_rates(self):
        for a, na, b, nb in ((2, 10, 4, 20), (0, 10, 0, 20), (10, 10, 20, 20)):
            test = proportion_z_test(a, na, b, nb)
            self.assertEqual(test["z_a_minus_b"], 0)
            self.assertEqual(test["two_sided_p"], 1)
        self.assertEqual(fisher_exact_two_sided(0, 10, 0, 20), 1)

class AccuracyTests(unittest.TestCase):
    def test_issue_answer_exact_rational(self):
        self.assertAlmostEqual(infer_true_accuracy(0.82, 0.15), float(Fraction(79, 82)))

    def test_round_trip(self):
        for classes in (2, 6, 10):
            for eta in (0, 0.15, 0.4, 1):
                for true in (0, 0.25, 0.82, 1):
                    observed = noisy_accuracy(true, eta, classes)
                    self.assertAlmostEqual(infer_true_accuracy(observed, eta, classes), true)

    def test_uniform_noise_ceiling(self):
        self.assertAlmostEqual(noisy_accuracy(1, 0.15), 0.85)
        self.assertAlmostEqual(noisy_accuracy(0, 0.15), 0.03)

    def test_unidentifiable_or_impossible(self):
        for observed, eta in ((0.9, 0.15), (0.02, 0.15), (1/6, 5/6)):
            with self.assertRaises(ValueError):
                infer_true_accuracy(observed, eta)

    def test_invalid_probabilities(self):
        for a, eta, k in ((-0.1, 0.15, 6), (0.82, 2, 6), (0.82, 0.15, 1),
                          (float("nan"), 0.15, 6), (0.82, 0.15, 6.0)):
            with self.assertRaises(ValueError):
                noisy_accuracy(a, eta, k)

class ScenarioTests(unittest.TestCase):
    def test_source_totals_and_review_budget(self):
        self.assertEqual(sum(TRANSITIONS.values()), 60)
        self.assertEqual(sum(REVIEW_BUDGET.values()), 2000)
        self.assertTrue(all(v > 0 for v in REVIEW_BUDGET.values()))

    def test_scope_and_weighting(self):
        data = results()
        self.assertAlmostEqual(data["crowd_disagreement"]["rate"], 0.15)
        self.assertAlmostEqual(data["sensitivity"]["whole_dataset_rate_if_expert_noise_zero"], 0.135)
        self.assertAlmostEqual(data["sensitivity"]["poststratified_crowd_rate"], 0.15084175084175083)
        self.assertAlmostEqual(data["tier_comparison"]["risk_ratio_b_over_a"], 36/11)

if __name__ == "__main__":
    unittest.main(verbosity=2)
