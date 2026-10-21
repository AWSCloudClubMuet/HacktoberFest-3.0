import unittest
import math
import numpy as np
from attention import forward, backward
from check_gradients import run_checks

class AttentionTests(unittest.TestCase):
    def setUp(self):
        self.q = np.array([[1., 0.], [0., 1.], [1., 1.]])
        self.k = np.array([[0., 1.], [1., 0.], [1., 1.]])
        self.v = np.array([[1., 2.], [3., 4.], [5., 6.]])

    def test_zero_scores_average_values(self):
        out, cache = forward(np.zeros((2, 3)), np.ones((4, 3)), np.arange(8).reshape(4, 2))
        np.testing.assert_allclose(out, [[3., 4.], [3., 4.]])
        np.testing.assert_allclose(cache.p.sum(axis=1), 1)

    def test_scale_is_inverse_sqrt_feature_count(self):
        _, cache = forward(self.q, self.k, self.v)
        self.assertAlmostEqual(cache.scale, 1 / np.sqrt(2))

    def test_one_key_returns_its_value(self):
        out, cache = forward(self.q, self.k[:1], self.v[:1])
        np.testing.assert_array_equal(out, np.repeat(self.v[:1], 3, axis=0))
        grads = backward(np.ones_like(out), cache)
        np.testing.assert_array_equal(grads['dq'], np.zeros_like(self.q))
        np.testing.assert_array_equal(grads['dk'], np.zeros_like(self.k[:1]))
        np.testing.assert_array_equal(grads['dv'], [[3, 3]])

    def test_causal_output_cannot_see_future_keys(self):
        out, cache = forward(self.q, self.k, self.v, causal=True)
        k, v = self.k.copy(), self.v.copy()
        k[-1] = [99, -99]
        v[-1] = [999, 999]
        changed, _ = forward(self.q, k, v, causal=True)
        np.testing.assert_allclose(out[:2], changed[:2])
        np.testing.assert_array_equal(cache.p[np.triu_indices(3, 1)], 0)
        np.testing.assert_allclose(out[0], self.v[0])

    def test_masked_score_gradients_are_zero(self):
        out, cache = forward(self.q, self.k, self.v, causal=True)
        grads = backward(np.ones_like(out), cache)
        np.testing.assert_array_equal(grads['ds'][~cache.allowed], 0)
        np.testing.assert_allclose(grads['ds'].sum(axis=1), 0, atol=1e-14)

    def test_causal_and_custom_masks_combine(self):
        mask = np.ones((3, 3), dtype=bool)
        mask[2, 0] = False
        _, cache = forward(self.q, self.k, self.v, causal=True, mask=mask)
        self.assertFalse(cache.allowed[2, 0])
        self.assertFalse(cache.allowed[0, 2])

    def test_cache_does_not_alias_inputs(self):
        q = self.q.copy()
        out, cache = forward(q, self.k, self.v)
        before = backward(np.ones_like(out), cache)['dk']
        q[:] = 100
        np.testing.assert_array_equal(backward(np.ones_like(out), cache)['dk'], before)

    def test_large_scores_remain_finite(self):
        out, cache = forward(np.array([[1000., -1000.]]), self.k, self.v)
        self.assertTrue(np.isfinite(out).all())
        self.assertTrue(np.isfinite(cache.p).all())
        self.assertAlmostEqual(float(cache.p.sum()), 1)

    def test_all_analytic_gradients_match_finite_differences(self):
        report = run_checks()
        self.assertTrue(report['passed'], report)

    def test_forward_matches_independent_loop_reference(self):
        for seed in [0, 7, 19, 64]:
            rng = np.random.default_rng(seed)
            for causal in [False, True]:
                nq, nk, d, dv = (4, 4, 3, 2) if causal else (3, 5, 2, 3)
                q, k, v = rng.normal(size=(nq, d)), rng.normal(size=(nk, d)), rng.normal(size=(nk, dv))
                mask = rng.random((nq, nk)) > 0.4
                for i in range(nq):
                    mask[i, min(i, nk - 1)] = True
                expected = []
                for i in range(nq):
                    indices = [j for j in range(nk) if mask[i, j] and (not causal or j <= i)]
                    scores = [sum(float(q[i, t]) * float(k[j, t]) for t in range(d)) / math.sqrt(d) for j in indices]
                    weights = [math.exp(s - max(scores)) for s in scores]
                    expected.append([sum(w * float(v[j, col]) for j, w in zip(indices, weights)) / sum(weights)
                                     for col in range(dv)])
                with self.subTest(seed=seed, causal=causal):
                    actual, _ = forward(q, k, v, causal=causal, mask=mask)
                    np.testing.assert_allclose(actual, expected, rtol=1e-12, atol=1e-12)

    def test_zero_upstream_gradient_gives_zero_gradients(self):
        out, cache = forward(self.q, self.k, self.v, causal=True)
        for name, gradient in backward(np.zeros_like(out), cache).items():
            with self.subTest(gradient=name):
                np.testing.assert_array_equal(gradient, np.zeros_like(gradient))

    def test_rejects_shape_errors(self):
        bad = [([], self.k, self.v), ([1, 2], self.k, self.v),
               (self.q, np.ones((3, 4)), self.v), (self.q, self.k, np.ones((2, 2)))]
        for q, k, v in bad:
            with self.subTest(q=np.shape(q), k=np.shape(k), v=np.shape(v)):
                with self.assertRaises(ValueError):
                    forward(q, k, v)

    def test_rejects_nonfinite_input(self):
        for value in [np.nan, np.inf, -np.inf]:
            q = self.q.copy()
            q[0, 0] = value
            with self.subTest(value=value), self.assertRaises(ValueError):
                forward(q, self.k, self.v)

    def test_rejects_nonboolean_or_wrong_shape_mask(self):
        for mask in [np.ones((3, 3)), np.ones((2, 3), dtype=bool)]:
            with self.assertRaises(ValueError):
                forward(self.q, self.k, self.v, mask=mask)

    def test_rejects_fully_masked_row(self):
        mask = np.ones((3, 3), dtype=bool)
        mask[1] = False
        with self.assertRaisesRegex(ValueError, 'fully masked'):
            forward(self.q, self.k, self.v, mask=mask)

    def test_rejects_rectangular_causal_mode(self):
        with self.assertRaises(ValueError):
            forward(self.q[:2], self.k, self.v, causal=True)

    def test_rejects_wrong_output_gradient(self):
        _, cache = forward(self.q, self.k, self.v)
        with self.assertRaises(ValueError):
            backward(np.ones((3, 1)), cache)

    def test_rejects_overflow_instead_of_returning_nan(self):
        with self.assertRaises(ValueError):
            forward(np.full((2, 2), 1e308), np.full((2, 2), 1e308), self.v[:2])

if __name__ == '__main__':
    unittest.main()
