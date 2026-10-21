"""
HelpDeskNet-50K — Automated Test Suite for Milestone 5
Team SheNova

Tests independently verify Label Smoothing calculations, Co-Teaching retention
and selection, Evaluation Protocol metrics, split disjointness, and regression
against Milestones 1, 2, 3, and 4.

DATA INTEGRITY NOTICE:
All synthetic test fixtures used in this test file are explicitly marked as
synthetic software unit test fixtures and do not represent real HelpDeskNet-50K tickets.
"""

import unittest
import numpy as np

from milestone5_robustness import (
    LabelSmoothingCrossEntropy,
    CoTeachingSelector,
    EvaluationMetricsCalculator,
    verify_split_disjointness,
)
from test_milestone1 import run_milestone1_verification
from milestone2_analysis import get_transition_summary
from milestone3_analysis import estimate_true_accuracy
from milestone4_selection import PROPOSED_PLAN


class TestMilestone5(unittest.TestCase):
    # --- 1. Label Smoothing Tests ---
    def test_label_smoothing_target_distribution_and_sum(self):
        """Verify that smoothed target distributions follow documented convention and sum to 1.0."""
        num_classes = 6
        epsilon = 0.10
        ls = LabelSmoothingCrossEntropy(num_classes=num_classes, epsilon=epsilon)
        
        targets = np.array([0, 1, 5])
        smoothed = ls.compute_smoothed_targets(targets)
        
        # Check shape
        self.assertEqual(smoothed.shape, (3, 6))
        
        # Check that rows sum to exactly 1.0
        row_sums = np.sum(smoothed, axis=1)
        for r_sum in row_sums:
            self.assertAlmostEqual(r_sum, 1.0, places=7)
            
        # Independently calculate expected values:
        # True class: 1 - eps + eps/K = 1 - 0.10 + 0.10/6 = 0.90 + 0.0166667 = 0.9166667
        # Other classes: eps/K = 0.10 / 6 = 0.0166667
        expected_true_prob = 1.0 - 0.10 + (0.10 / 6.0)
        expected_other_prob = 0.10 / 6.0
        
        # Check sample 0 (target = 0)
        self.assertAlmostEqual(smoothed[0, 0], expected_true_prob, places=6)
        for c in range(1, 6):
            self.assertAlmostEqual(smoothed[0, c], expected_other_prob, places=6)
            
        # Check sample 2 (target = 5)
        self.assertAlmostEqual(smoothed[2, 5], expected_true_prob, places=6)
        for c in range(0, 5):
            self.assertAlmostEqual(smoothed[2, c], expected_other_prob, places=6)

    def test_label_smoothing_loss_computation(self):
        """Verify cross-entropy loss computation on a synthetic software test fixture."""
        ls = LabelSmoothingCrossEntropy(num_classes=6, epsilon=0.10)
        
        # Explicitly synthetic toy logits and targets
        logits = np.array([
            [5.0, 1.0, 0.0, -1.0, 0.0, 0.0],
            [0.5, 4.0, 1.0,  0.0, 0.0, 0.0]
        ])
        targets = np.array([0, 1])
        
        loss = ls.compute_loss(logits, targets)
        self.assertIsInstance(loss, float)
        self.assertGreater(loss, 0.0)
        self.assertLess(loss, 5.0)

    def test_label_smoothing_invalid_inputs(self):
        """Verify error handling for invalid class counts, invalid epsilon, and out-of-range labels."""
        with self.assertRaises(ValueError):
            LabelSmoothingCrossEntropy(num_classes=1, epsilon=0.1) # K < 2
        with self.assertRaises(ValueError):
            LabelSmoothingCrossEntropy(num_classes=6, epsilon=-0.05) # eps < 0
        with self.assertRaises(ValueError):
            LabelSmoothingCrossEntropy(num_classes=6, epsilon=1.0) # eps >= 1
            
        ls = LabelSmoothingCrossEntropy(num_classes=6, epsilon=0.1)
        with self.assertRaises(ValueError):
            ls.compute_smoothed_targets(np.array([6])) # Label 6 invalid for K=6

    # --- 2. Co-Teaching Tests ---
    def test_co_teaching_retention_schedule(self):
        """Verify that retention rate follows the documented schedule R(t) = 1 - min(t/Tk * tau, tau)."""
        tau = 0.15 # From Milestone 1 audit
        ct = CoTeachingSelector(estimated_noise_rate=tau, warmup_epochs=5, total_epochs=15)
        
        # Epoch 0: R(0) = 1.0
        self.assertAlmostEqual(ct.get_retention_rate(0), 1.0, places=6)
        
        # Epoch 2: R(2) = 1 - (2/5 * 0.15) = 1 - 0.06 = 0.94
        self.assertAlmostEqual(ct.get_retention_rate(2), 0.94, places=6)
        
        # Epoch 5: R(5) = 1 - 0.15 = 0.85
        self.assertAlmostEqual(ct.get_retention_rate(5), 0.85, places=6)
        
        # Epoch 10: R(10) = 0.85 (capped at 1 - tau)
        self.assertAlmostEqual(ct.get_retention_rate(10), 0.85, places=6)

    def test_co_teaching_small_loss_selection(self):
        """Verify that small-loss selection correctly picks the lowest loss indices."""
        ct = CoTeachingSelector(estimated_noise_rate=0.20, warmup_epochs=5)
        # Synthetic loss vector of 10 items
        losses = np.array([0.9, 0.1, 0.8, 0.2, 0.7, 0.3, 0.6, 0.4, 0.5, 1.5])
        
        # At epoch 5, retention is 1 - 0.20 = 0.80 -> Select 8 lowest losses out of 10
        selected = ct.select_small_loss_indices(losses, epoch=5)
        self.assertEqual(len(selected), 8)
        
        # The two highest losses (0.9 at idx 0 and 1.5 at idx 9) must be discarded
        self.assertNotIn(0, selected)
        self.assertNotIn(9, selected)
        # Lowest loss (0.1 at idx 1) must be included
        self.assertIn(1, selected)

    # --- 3. Evaluation Protocol Metrics Tests ---
    def test_evaluation_metrics_calculator(self):
        """Verify metric calculations against independently specified expected values on a synthetic fixture."""
        calc = EvaluationMetricsCalculator()
        
        # Synthetic ground truth and predictions for 6 samples across classes 0, 1, 2
        # Ground truth: [0, 0, 1, 1, 2, 2]
        # Predictions:  [0, 1, 1, 1, 2, 0]
        y_true = np.array([0, 0, 1, 1, 2, 2])
        y_pred = np.array([0, 1, 1, 1, 2, 0])
        
        # Independent manual calculations:
        # Correct: idx 0 (0==0), idx 2 (1==1), idx 3 (1==1), idx 4 (2==2) -> 4 / 6 = 0.6666667
        expected_accuracy = 4.0 / 6.0
        
        # Class 0: TP=1, FP=1 (idx 5), FN=1 (idx 1) -> Prec = 1/2 = 0.5, Rec = 1/2 = 0.5, F1 = 0.5
        # Class 1: TP=2, FP=1 (idx 1), FN=0 -> Prec = 2/3 = 0.6667, Rec = 2/2 = 1.0, F1 = 2*(2/3)*1 / (2/3 + 1) = 0.80
        # Class 2: TP=1, FP=0, FN=1 (idx 5) -> Prec = 1/1 = 1.0, Rec = 1/2 = 0.5, F1 = 2*1*0.5 / (1.5) = 0.6667
        # Classes 3, 4, 5: TP=0, FP=0, FN=0 -> Prec=0.0, Rec=0.0, F1=0.0
        
        metrics = calc.compute_metrics(y_true, y_pred)
        
        self.assertAlmostEqual(metrics["accuracy"], expected_accuracy, places=5)
        self.assertAlmostEqual(metrics["per_class"]["Billing"]["f1"], 0.50, places=5)
        self.assertAlmostEqual(metrics["per_class"]["Refund"]["f1"], 0.80, places=5)
        self.assertAlmostEqual(metrics["per_class"]["Technical"]["f1"], 2.0 / 3.0, places=5)
        self.assertAlmostEqual(metrics["per_class"]["Account Access"]["f1"], 0.0, places=5)

    def test_evaluation_missing_data_refusal(self):
        """Verify that evaluation code refuses to report real metrics when inputs are None."""
        calc = EvaluationMetricsCalculator()
        with self.assertRaises(ValueError) as cm:
            calc.compute_metrics(None, None)
        self.assertIn("Cannot report real metrics without genuine data", str(cm.exception))

    def test_split_disjointness_verification(self):
        """Verify that split disjointness check flags data leakage and accepts valid partitions."""
        train = {"T1", "T2", "T3"}
        val = {"T4", "T5"}
        test = {"T6", "T7"}
        
        clean_check = verify_split_disjointness(train, val, test)
        self.assertTrue(clean_check["is_disjoint"])
        self.assertEqual(clean_check["train_val_leakage_count"], 0)
        
        # Contaminated split with leakage
        val_leaked = {"T3", "T5"}
        leaked_check = verify_split_disjointness(train, val_leaked, test)
        self.assertFalse(leaked_check["is_disjoint"])
        self.assertEqual(leaked_check["train_val_leakage_count"], 1)

    # --- 4. Global Regression Tests ---
    def test_global_regression_milestones_1_to_4(self):
        """Confirm that Milestones 1, 2, 3, and 4 continue to pass cleanly."""
        # M1
        try:
            run_milestone1_verification()
        except Exception as e:
            self.fail(f"Milestone 1 regression failed: {e}")
            
        # M2
        m2 = get_transition_summary()
        self.assertEqual(sum(t["count"] for t in m2), 60)
        
        # M3
        a_true = estimate_true_accuracy(a_noisy=0.82, q=0.15, k=6)
        self.assertAlmostEqual(a_true, 79.0 / 82.0, places=6)
        
        # M4
        self.assertEqual(PROPOSED_PLAN.total_target, 2000)


if __name__ == "__main__":
    unittest.main()
