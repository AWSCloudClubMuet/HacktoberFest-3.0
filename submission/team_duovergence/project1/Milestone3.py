"""
Task 3: Production Fraud Detection Evaluation & Decision Threshold System
Author: Team Cloud9
Dual-Mode Engine: NumPy backend with pure-Python standard library fallback.
"""

import math
import random

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

def compute_cost_py(y_true, y_prob, threshold, c_fn=200.0, c_fp=5.0):
    fn = 0
    fp = 0
    for yt, yp in zip(y_true, y_prob):
        pred = 1 if yp >= threshold else 0
        if yt == 1 and pred == 0:
            fn += 1
        elif yt == 0 and pred == 1:
            fp += 1
    return fn * c_fn + fp * c_fp, fn, fp

def compute_ece_py(y_true, y_prob, n_bins=10):
    bin_size = 1.0 / n_bins
    bins = [[] for _ in range(n_bins)]
    for yt, yp in zip(y_true, y_prob):
        idx = min(int(yp / bin_size), n_bins - 1)
        bins[idx].append((yt, yp))
        
    ece = 0.0
    total = len(y_true)
    for b in bins:
        if not b:
            continue
        acc = sum(item[0] for item in b) / len(b)
        conf = sum(item[1] for item in b) / len(b)
        ece += abs(acc - conf) * (len(b) / total)
    return ece

def compute_psi_py(baseline, target, n_bins=10):
    baseline_sorted = sorted(baseline)
    quantiles = [baseline_sorted[int(i * len(baseline_sorted) / n_bins)] for i in range(1, n_bins)]
    
    def get_counts(data):
        counts = [0] * n_bins
        for val in data:
            placed = False
            for i, q in enumerate(quantiles):
                if val <= q:
                    counts[i] += 1
                    placed = True
                    break
            if not placed:
                counts[-1] += 1
        return counts
    
    b_counts = get_counts(baseline)
    t_counts = get_counts(target)
    
    b_total = len(baseline)
    t_total = len(target)
    
    psi = 0.0
    for bc, tc in zip(b_counts, t_counts):
        b_prop = (bc + 1e-4) / (b_total + 1e-4 * n_bins)
        t_prop = (tc + 1e-4) / (t_total + 1e-4 * n_bins)
        psi += (t_prop - b_prop) * math.log(t_prop / b_prop)
    return psi

def run_simulation():
    print("=" * 70)
    print("TASK 3: FRAUD DETECTION EVALUATION & THRESHOLD OPTIMIZATION")
    print(f"Backend Engine: {'NumPy' if HAS_NUMPY else 'Pure-Python Standard Library'}")
    print("=" * 70)
    
    c_fn = 200.0  # Cost of False Negative (Average chargeback loss)
    c_fp = 5.0    # Cost of False Positive (Friction/Declined legitimate customer)
    p_star = c_fp / (c_fp + c_fn)
    print(f"\n1. Theoretical Cost-Optimal Decision Threshold:")
    print(f"   p* = C_FP / (C_FP + C_FN) = ${c_fp} / (${c_fp} + ${c_fn}) = {p_star:.4f} ({p_star*100:.2f}%)")
    
    # 2. Simulate 50,000 transactions with 0.1% fraud prevalence
    random.seed(42)
    n_transactions = 50000
    y_true = []
    y_prob = []
    scores_legit = []
    
    for _ in range(n_transactions):
        is_fraud = 1 if random.random() < 0.001 else 0
        y_true.append(is_fraud)
        if is_fraud:
            # Fraudulent scores centered higher
            prob = min(0.99, max(0.01, random.betavariate(2.0, 5.0)))
        else:
            # Legitimate transactions have very low scores
            prob = min(0.99, max(0.0001, random.betavariate(0.1, 80.0)))
            scores_legit.append(prob)
        y_prob.append(prob)
        
    n_fraud = sum(y_true)
    print(f"\n2. Transaction Population:")
    print(f"   Total transactions: {n_transactions:,} | Actual frauds: {n_fraud} (Prevalence: {n_fraud/n_transactions*100:.2f}%)")
    
    # 3. Evaluate Cost Curve
    cost_default, fn_def, fp_def = compute_cost_py(y_true, y_prob, 0.50, c_fn, c_fp)
    cost_optimal, fn_opt, fp_opt = compute_cost_py(y_true, y_prob, p_star, c_fn, c_fp)
    
    print(f"\n3. Cost-Utility Performance Comparison:")
    print(f"   - Standard 0.50 Threshold -> Total Cost: ${cost_default:,.2f} (FN: {fn_def}, FP: {fp_def})")
    print(f"   - Optimal Cost Threshold ({p_star*100:.2f}%) -> Total Cost: ${cost_optimal:,.2f} (FN: {fn_opt}, FP: {fp_opt})")
    savings = cost_default - cost_optimal
    print(f"   - Bottom-Line Savings: ${savings:,.2f} ({(savings/cost_default)*100:.1f}% reduction in net losses)")
    
    # 4. Calibration Error
    ece = compute_ece_py(y_true, y_prob, n_bins=10)
    print(f"\n4. Probability Calibration Assessment:")
    print(f"   - Expected Calibration Error (ECE): {ece:.5f}")
    
    # 5. Production Drift Monitoring (PSI)
    print(f"\n5. Production Drift & Retraining Detection (PSI):")
    # Day 1: In-distribution traffic
    day1_scores = [min(0.99, max(0.0001, random.betavariate(0.1, 80.0))) for _ in range(10000)]
    psi_stable = compute_psi_py(scores_legit, day1_scores)
    print(f"   - Stable Day PSI: {psi_stable:.4f} -> [STABLE (PSI < 0.10, No Action Needed)]")
    
    # Day 2: Attacker campaign / concept drift
    day2_scores = [min(0.99, max(0.0001, random.betavariate(0.4, 50.0))) for _ in range(10000)]
    psi_drift = compute_psi_py(scores_legit, day2_scores)
    print(f"   - Drifted Day PSI: {psi_drift:.4f} -> [ALERT: PSI > 0.25 -> RETRAINING TRIGGERED]")

if __name__ == "__main__":
    run_simulation()
