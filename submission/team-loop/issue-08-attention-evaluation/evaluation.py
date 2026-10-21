"""Small cost/baseline calculations for the issue's fraud scenario."""
import json
import math

def cost_threshold(false_negative_cost=200, false_positive_cost=5):
    """Assumes calibrated P(fraud|x), zero correct-decision costs, no capacity cap."""
    fn, fp = float(false_negative_cost), float(false_positive_cost)
    if not math.isfinite(fn) or not math.isfinite(fp) or min(fn, fp) < 0 or fn + fp == 0:
        raise ValueError('costs must be finite, nonnegative, and not both zero')
    return fp / (fn + fp)

def decision_cost(probability, flag, false_negative_cost=200, false_positive_cost=5):
    p = float(probability)
    if not math.isfinite(p) or not 0 <= p <= 1:
        raise ValueError('probability must be finite and between zero and one')
    cost_threshold(false_negative_cost, false_positive_cost)
    return (1 - p) * false_positive_cost if flag else p * false_negative_cost

def scenario():
    return {'fraud_prevalence': 0.001, 'always_normal_accuracy': 0.999,
            'always_normal_fraud_recall': 0.0,
            'theoretical_cost_threshold': cost_threshold(),
            'illustrative_transactions': 100000,
            'expected_frauds_at_given_prevalence': 100,
            'always_normal_expected_cost_at_100000_transactions': 20000,
            'label': 'Scenario arithmetic only; no trained model or measured performance.'}

if __name__ == '__main__':
    print(json.dumps(scenario(), indent=2))
