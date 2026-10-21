import json
import math
def _costs(false_negative_cost, false_positive_cost):
    fn, fp = float(false_negative_cost), float(false_positive_cost)
    if not math.isfinite(fn) or not math.isfinite(fp) or min(fn, fp) < 0 or (fn == 0 and fp == 0):
        raise ValueError('costs must be finite, nonnegative, and not both zero')
    return fn, fp
def cost_threshold(false_negative_cost=200, false_positive_cost=5):
    fn, fp = _costs(false_negative_cost, false_positive_cost)
    scale = max(fn, fp)
    fn, fp = fn / scale, fp / scale
    return fp / (fn + fp)
def decision_cost(probability, flag, false_negative_cost=200, false_positive_cost=5):
    p = float(probability)
    if not math.isfinite(p) or not 0 <= p <= 1:
        raise ValueError('probability must be finite and between zero and one')
    fn, fp = _costs(false_negative_cost, false_positive_cost)
    return (1 - p) * fp if flag else p * fn
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
