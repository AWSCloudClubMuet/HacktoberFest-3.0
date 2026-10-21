"""
HelpDeskNet-50K — Automated Test Suite for Milestone 1
Team SheNova

Tests independently verify the 400-ticket audit counts, overall disagreement rate,
Wilson 95% confidence interval, Tier A vs Tier B disagreement rates, and the
two-sided pooled two-proportion z-test.
"""

import math
import unittest
from scipy import stats


def run_milestone1_verification():
    """
    Standalone verification function preserved for direct execution
    and regression imports from other milestone test suites.
    """
    total_audited = 400
    total_disagreements = 60
    n_A, x_A = 180, 12
    n_B, x_B = 220, 48

    # Additive consistency
    assert n_A + n_B == total_audited, f"Tier sample sizes do not sum to total: {n_A} + {n_B} != {total_audited}"
    assert x_A + x_B == total_disagreements, f"Disagreements do not sum to total: {x_A} + {x_B} != {total_disagreements}"

    # Overall rate
    p_hat = total_disagreements / total_audited
    assert abs(p_hat - 0.15) < 1e-9, f"p_hat error: {p_hat}"

    # Tier rates
    p_A = x_A / n_A
    p_B = x_B / n_B
    diff = p_B - p_A
    assert abs(p_A - 12 / 180) < 1e-9
    assert abs(p_B - 48 / 220) < 1e-9
    assert abs(diff - (48 / 220 - 12 / 180)) < 1e-9

    # Wilson CI
    alpha = 0.05
    z_crit = stats.norm.ppf(1 - alpha / 2)
    denom = 1 + (z_crit**2) / total_audited
    center = (p_hat + (z_crit**2) / (2 * total_audited)) / denom
    half_width = (z_crit * math.sqrt((p_hat * (1 - p_hat) / total_audited) + ((z_crit**2) / (4 * total_audited**2)))) / denom
    ci_lower = center - half_width
    ci_upper = center + half_width
    assert 0.118 <= ci_lower <= 0.119
    assert 0.188 <= ci_upper <= 0.189

    # Pooled z-test
    p_pool = (x_A + x_B) / (n_A + n_B)
    se_pool = math.sqrt(p_pool * (1 - p_pool) * (1 / n_A + 1 / n_B))
    z_stat = (p_B - p_A) / se_pool
    p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))
    assert abs(z_stat - 4.2220) < 0.01
    assert p_value < 0.001


class TestMilestone1(unittest.TestCase):
    def setUp(self):
        self.total_audited = 400
        self.total_disagreements = 60
        self.n_A, self.x_A = 180, 12
        self.n_B, self.x_B = 220, 48

    def test_additive_consistency(self):
        """Verify that Tier A and Tier B sample sizes and disagreements sum to totals."""
        self.assertEqual(self.n_A + self.n_B, self.total_audited)
        self.assertEqual(self.x_A + self.x_B, self.total_disagreements)

    def test_overall_disagreement_rate(self):
        """Verify overall disagreement rate is 60 / 400 = 15.00%."""
        p_hat = self.total_disagreements / self.total_audited
        self.assertEqual(p_hat, 0.15)
        self.assertAlmostEqual(p_hat * 100.0, 15.0, places=2)

    def test_tier_rates_and_difference(self):
        """Verify Tier A (6.67%), Tier B (21.82%), and difference (15.15 percentage points)."""
        p_A = self.x_A / self.n_A
        p_B = self.x_B / self.n_B
        diff = p_B - p_A

        self.assertAlmostEqual(p_A, 12.0 / 180.0, places=6)
        self.assertAlmostEqual(p_A * 100.0, 6.6667, places=2)

        self.assertAlmostEqual(p_B, 48.0 / 220.0, places=6)
        self.assertAlmostEqual(p_B * 100.0, 21.8182, places=2)

        self.assertAlmostEqual(diff * 100.0, 15.1515, places=2)

    def test_wilson_confidence_interval(self):
        """Verify Wilson 95% confidence interval is approximately 11.8% to 18.8%."""
        p_hat = self.total_disagreements / self.total_audited
        alpha = 0.05
        z_crit = stats.norm.ppf(1 - alpha / 2)
        denom = 1 + (z_crit**2) / self.total_audited
        center = (p_hat + (z_crit**2) / (2 * self.total_audited)) / denom
        half_width = (z_crit * math.sqrt((p_hat * (1 - p_hat) / self.total_audited) + ((z_crit**2) / (4 * self.total_audited**2)))) / denom
        ci_lower = center - half_width
        ci_upper = center + half_width

        self.assertAlmostEqual(ci_lower, 0.1183, places=3)
        self.assertAlmostEqual(ci_upper, 0.1883, places=3)
        self.assertAlmostEqual(ci_lower * 100.0, 11.83, places=1)
        self.assertAlmostEqual(ci_upper * 100.0, 18.83, places=1)

    def test_pooled_two_proportion_z_test(self):
        """Verify pooled z statistic is approx 4.22 and two-sided p-value is < 0.0001."""
        p_A = self.x_A / self.n_A
        p_B = self.x_B / self.n_B
        p_pool = (self.x_A + self.x_B) / (self.n_A + self.n_B)
        self.assertEqual(p_pool, 0.15)

        se_pool = math.sqrt(p_pool * (1 - p_pool) * (1 / self.n_A + 1 / self.n_B))
        self.assertAlmostEqual(se_pool, 0.035887, places=5)

        z_stat = (p_B - p_A) / se_pool
        self.assertAlmostEqual(z_stat, 4.2220, places=3)

        p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))
        self.assertLess(p_value, 0.0001)
        self.assertAlmostEqual(p_value, 2.4214e-05, places=8)


if __name__ == "__main__":
    unittest.main()
