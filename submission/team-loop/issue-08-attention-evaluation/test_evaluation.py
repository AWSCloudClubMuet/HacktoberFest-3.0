import unittest
from evaluation import cost_threshold, decision_cost, scenario

class EvaluationTests(unittest.TestCase):
    def test_threshold_derivation(self):
        threshold = cost_threshold()
        self.assertAlmostEqual(threshold, 1 / 41)
        self.assertAlmostEqual(decision_cost(threshold, True), decision_cost(threshold, False))

    def test_preferred_decision_on_each_side(self):
        self.assertLess(decision_cost(0.01, False), decision_cost(0.01, True))
        self.assertLess(decision_cost(0.10, True), decision_cost(0.10, False))

    def test_zero_cost_boundaries(self):
        self.assertEqual(cost_threshold(200, 0), 0)
        self.assertEqual(cost_threshold(0, 5), 1)

    def test_invalid_costs(self):
        for fn, fp in [(0, 0), (-1, 5), (200, -1), (float('nan'), 5), (200, float('inf'))]:
            with self.subTest(fn=fn, fp=fp), self.assertRaises(ValueError):
                cost_threshold(fn, fp)

    def test_invalid_probabilities(self):
        for p in [-0.1, 1.1, float('nan'), float('inf')]:
            with self.subTest(p=p), self.assertRaises(ValueError):
                decision_cost(p, True)

    def test_baseline_arithmetic(self):
        result = scenario()
        self.assertEqual(result['always_normal_accuracy'], 0.999)
        self.assertEqual(result['always_normal_fraud_recall'], 0)
        self.assertEqual(result['always_normal_expected_cost_at_100000_transactions'], 20000)

if __name__ == '__main__':
    unittest.main()
