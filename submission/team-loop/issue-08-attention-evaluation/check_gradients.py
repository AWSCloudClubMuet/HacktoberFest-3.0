"""Central finite differences on deterministic synthetic matrices, not training data."""
import json
import numpy as np
from attention import forward, backward, probabilities

STEP = 1e-6
ABS_LIMIT = 1e-7
REL_LIMIT = 1e-6

def numerical_gradient(fn, value, step=STEP):
    value = np.array(value, dtype=np.float64, copy=True)
    result = np.zeros_like(value)
    for index in np.ndindex(value.shape):
        old = value[index]
        value[index] = old + step
        above = fn(value)
        value[index] = old - step
        below = fn(value)
        value[index] = old
        result[index] = (above - below) / (2 * step)
    return result

def errors(actual, numerical):
    absolute = float(np.max(np.abs(actual - numerical)))
    relative = float(np.linalg.norm(actual - numerical) /
                     max(1e-12, np.linalg.norm(actual) + np.linalg.norm(numerical)))
    return {'max_absolute_error': absolute, 'relative_l2_error': relative,
            'passed': absolute <= ABS_LIMIT and relative <= REL_LIMIT}

def run_checks():
    rng = np.random.default_rng(42)
    cases = [
        ('rectangular', 3, 4, 2, 3, False, None),
        ('causal', 4, 4, 3, 2, True, None),
        ('custom_mask', 3, 4, 2, 2, False,
         np.array([[1, 0, 1, 0], [0, 1, 1, 0], [1, 0, 0, 1]], dtype=bool))
    ]
    reports = []
    for name, nq, nk, d, dv, causal, mask in cases:
        q, k, v = rng.normal(size=(nq, d)), rng.normal(size=(nk, d)), rng.normal(size=(nk, dv))
        dout = rng.normal(size=(nq, dv))
        _, cache = forward(q, k, v, causal, mask)
        grads = backward(dout, cache)
        loss = lambda a, b, c: float(np.sum(forward(a, b, c, causal, mask)[0] * dout))
        numerical = {
            'dq': numerical_gradient(lambda x: loss(x, k, v), q),
            'dk': numerical_gradient(lambda x: loss(q, x, v), k),
            'dv': numerical_gradient(lambda x: loss(q, k, x), v),
            'dp': numerical_gradient(lambda x: float(np.sum((x @ v) * dout)), cache.p),
            'ds': numerical_gradient(lambda x: float(np.sum((probabilities(x, cache.allowed) @ v) * dout)),
                                     (q @ k.T) * cache.scale)
        }
        checks = {key: errors(grads[key], numerical[key]) for key in numerical}
        masked_zero = bool(np.all(grads['ds'][~cache.allowed] == 0))
        reports.append({'case': name, 'checks': checks, 'masked_score_gradients_zero': masked_zero,
                        'passed': masked_zero and all(item['passed'] for item in checks.values())})
    return {'seed': 42, 'precision': 'float64', 'central_difference_step': STEP,
            'max_absolute_error_limit': ABS_LIMIT, 'relative_l2_error_limit': REL_LIMIT,
            'cases': reports, 'passed': all(item['passed'] for item in reports)}

if __name__ == '__main__':
    report = run_checks()
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report['passed'] else 1)
