"""
HelpDeskNet-50K — Milestone 5: Noise-Robust Training & Trustworthy Evaluation
Team SheNova

This module implements reusable algorithmic components for:
1. Label Smoothing Cross-Entropy Loss
2. Co-Teaching Small-Loss Sample Selection
3. Evaluation Protocol Metrics (Accuracy, Macro-F1, Precision, Recall)
4. Split Disjointness Verification

DATA INTEGRITY NOTICE:
No model training experiment or real evaluation has occurred because the actual
HelpDeskNet-50K dataset is unavailable. Small test fixtures in unit tests are
explicitly labeled as synthetic unit test fixtures.
"""

import sys
from typing import Dict, List, Optional, Tuple, Any, Set
import numpy as np

# Ensure stdout supports Unicode characters across all platforms
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


class LabelSmoothingCrossEntropy:
    """
    Computes smoothed target distributions and categorical cross-entropy loss.
    
    Convention:
        For K classes and smoothing parameter epsilon:
        y'_k = (1 - epsilon) + epsilon / K  if k == y (ground truth)
        y'_k = epsilon / K                  if k != y
    
    Properties:
        - Targets sum to exactly 1.0.
        - Prevents extreme logit output and overconfidence on corrupted labels.
    """
    def __init__(self, num_classes: int = 6, epsilon: float = 0.1):
        if not isinstance(num_classes, int) or num_classes < 2:
            raise ValueError(f"num_classes must be integer >= 2, got {num_classes}")
        if not (0.0 <= epsilon < 1.0):
            raise ValueError(f"epsilon must be in range [0, 1), got {epsilon}")
        self.num_classes = num_classes
        self.epsilon = float(epsilon)

    def compute_smoothed_targets(self, targets: np.ndarray) -> np.ndarray:
        """
        Transforms integer class labels of shape (N,) into smoothed probability
        distributions of shape (N, num_classes).
        """
        targets = np.asarray(targets, dtype=int)
        if targets.ndim != 1:
            raise ValueError("targets array must be 1-dimensional.")
        if np.any((targets < 0) | (targets >= self.num_classes)):
            raise ValueError(f"Target labels must be in range [0, {self.num_classes - 1}].")
        
        n_samples = len(targets)
        # Baseline uniform background probability: epsilon / K
        smoothed = np.full((n_samples, self.num_classes), self.epsilon / self.num_classes, dtype=float)
        
        # Add (1 - epsilon) to true class index
        for i, t in enumerate(targets):
            smoothed[i, t] += (1.0 - self.epsilon)
            
        return smoothed

    def compute_loss(self, logits: np.ndarray, targets: np.ndarray) -> float:
        """
        Computes mean cross-entropy loss between softmax(logits) and smoothed targets.
        """
        logits = np.asarray(logits, dtype=float)
        if logits.ndim != 2 or logits.shape[1] != self.num_classes:
            raise ValueError(f"logits must have shape (N, {self.num_classes}), got {logits.shape}")
        
        smoothed_targets = self.compute_smoothed_targets(targets)
        
        # Numerically stable log-softmax
        max_logits = np.max(logits, axis=1, keepdims=True)
        exp_logits = np.exp(logits - max_logits)
        log_probs = (logits - max_logits) - np.log(np.sum(exp_logits, axis=1, keepdims=True))
        
        # Cross-entropy: - sum(target * log_prob)
        loss_per_sample = -np.sum(smoothed_targets * log_probs, axis=1)
        return float(np.mean(loss_per_sample))


class CoTeachingSelector:
    """
    Implements small-loss sample selection for the Co-Teaching training paradigm.
    
    In each mini-batch:
      - Model 1 and Model 2 compute per-sample losses.
      - Each model selects a fraction R(t) of instances with the smallest loss.
      - Model 1 updates on Model 2's selected instances, and vice versa.
    """
    def __init__(self, estimated_noise_rate: float = 0.15, warmup_epochs: int = 5, total_epochs: int = 15):
        if not (0.0 <= estimated_noise_rate < 1.0):
            raise ValueError(f"estimated_noise_rate must be in [0, 1), got {estimated_noise_rate}")
        if warmup_epochs < 1:
            raise ValueError(f"warmup_epochs must be >= 1, got {warmup_epochs}")
        if total_epochs < warmup_epochs:
            raise ValueError("total_epochs must be >= warmup_epochs")
            
        self.noise_rate = estimated_noise_rate
        self.warmup_epochs = warmup_epochs
        self.total_epochs = total_epochs

    def get_retention_rate(self, epoch: int) -> float:
        """
        Calculates retention rate R(epoch).
        Schedule: drops linearly from 1.0 to (1 - noise_rate) over warmup_epochs,
        then stays constant at (1 - noise_rate).
        """
        if epoch < 0:
            raise ValueError("epoch must be >= 0")
        drop = min(epoch / self.warmup_epochs * self.noise_rate, self.noise_rate)
        return 1.0 - drop

    def select_small_loss_indices(self, losses: np.ndarray, epoch: int) -> np.ndarray:
        """
        Returns indices of the smallest-loss examples according to R(epoch).
        """
        losses = np.asarray(losses, dtype=float)
        if losses.ndim != 1:
            raise ValueError("losses array must be 1-dimensional.")
        n_samples = len(losses)
        if n_samples == 0:
            return np.empty(0, dtype=int)
            
        r = self.get_retention_rate(epoch)
        num_remember = max(1, int(np.round(n_samples * r)))
        num_remember = min(num_remember, n_samples)
        
        # Sort indices ascending by loss
        sorted_indices = np.argsort(losses)
        return sorted_indices[:num_remember]


class EvaluationMetricsCalculator:
    """
    Computes rigorous classification metrics (Accuracy, Macro-F1, Per-Class Precision/Recall)
    on genuine gold test labels. Refuses execution if labels or predictions are missing.
    """
    def __init__(self, class_names: Optional[List[str]] = None):
        self.class_names = class_names or [
            "Billing", "Refund", "Technical", "Account Access", "Shipping", "Other"
        ]
        self.num_classes = len(self.class_names)

    def compute_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, Any]:
        """
        Computes multi-class evaluation metrics with explicit zero-division safeguards.
        """
        if y_true is None or y_pred is None:
            raise ValueError("y_true and y_pred cannot be None. Cannot report real metrics without genuine data.")
        y_true = np.asarray(y_true, dtype=int)
        y_pred = np.asarray(y_pred, dtype=int)
        
        if len(y_true) != len(y_pred):
            raise ValueError(f"Length mismatch: len(y_true)={len(y_true)} vs len(y_pred)={len(y_pred)}")
        if len(y_true) == 0:
            raise ValueError("Input arrays must not be empty.")
            
        n_samples = len(y_true)
        accuracy = float(np.mean(y_true == y_pred))
        
        per_class_metrics = {}
        precisions = []
        recalls = []
        f1s = []
        
        for k in range(self.num_classes):
            c_name = self.class_names[k]
            tp = int(np.sum((y_pred == k) & (y_true == k)))
            fp = int(np.sum((y_pred == k) & (y_true != k)))
            fn = int(np.sum((y_pred != k) & (y_true == k)))
            support = int(np.sum(y_true == k))
            
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
            
            per_class_metrics[c_name] = {
                "precision": prec,
                "recall": rec,
                "f1": f1,
                "support": support
            }
            precisions.append(prec)
            recalls.append(rec)
            f1s.append(f1)
            
        macro_precision = float(np.mean(precisions))
        macro_recall = float(np.mean(recalls))
        macro_f1 = float(np.mean(f1s))
        
        return {
            "accuracy": accuracy,
            "macro_precision": macro_precision,
            "macro_recall": macro_recall,
            "macro_f1": macro_f1,
            "per_class": per_class_metrics,
            "n_samples": n_samples
        }


def verify_split_disjointness(
    train_ids: Set[str],
    val_ids: Set[str],
    test_ids: Set[str]
) -> Dict[str, Any]:
    """
    Verifies that train, validation, and test splits have zero overlap (disjoint sets).
    """
    train_val_overlap = train_ids.intersection(val_ids)
    train_test_overlap = train_ids.intersection(test_ids)
    val_test_overlap = val_ids.intersection(test_ids)
    
    is_disjoint = (
        len(train_val_overlap) == 0 and
        len(train_test_overlap) == 0 and
        len(val_test_overlap) == 0
    )
    
    return {
        "is_disjoint": is_disjoint,
        "train_val_leakage_count": len(train_val_overlap),
        "train_test_leakage_count": len(train_test_overlap),
        "val_test_leakage_count": len(val_test_overlap)
    }


def print_milestone5_summary():
    """Prints a summary of the noise-robust training and evaluation architecture."""
    print("=" * 70)
    print("HELPDESKNET-50K — MILESTONE 5: ROBUST TRAINING & EVALUATION DESIGN")
    print("=" * 70)
    print("1. Method A: Label Smoothing Cross-Entropy Loss")
    print("   - Smooths target probabilities: y'_k = 1 - eps + eps/K for true, eps/K for others.")
    print("   - Prevents overconfident memorization of corrupted labels.")
    print("\n2. Method B: Co-Teaching Paradigm")
    print("   - Dual-model architecture with peer small-loss sample filtering.")
    print("   - Retention schedule R(t) = 1 - min(t/T_k * tau, tau) with tau = 0.15.")
    print("\n3. Trustworthy Evaluation Protocol")
    print("   - Gold-standard expert-labeled evaluation set.")
    print("   - Disjoint split validation (Zero leakage between train/val/test).")
    print("   - Multi-metric reporting: Accuracy, Macro-F1, per-class Precision/Recall.")
    print("=" * 70)
    print("STATUS: Reusable algorithms implemented. No real model training claimed.")
    print("=" * 70)


if __name__ == "__main__":
    print_milestone5_summary()
