import unittest
import numpy as np
from synthetic_training import MLP, make_dataset, scale_data, train_variant
from check_gradients import numerical_gradient
class SyntheticTrainingTests(unittest.TestCase):
    def test_data_is_reproducible_and_splits_are_disjoint(self):
        data, other = make_dataset(), make_dataset()
        np.testing.assert_array_equal(data['x'], other['x'])
        np.testing.assert_array_equal(data['y'], other['y'])
        self.assertEqual(data['x'].shape, (10000, 40))
        self.assertEqual(set(data['y']), {0, 1})
        ids = np.r_[data['train'], data['validation'], data['test']]
        self.assertEqual(len(np.unique(ids)), 10000)
        self.assertEqual([len(data[s]) for s in ['train', 'validation', 'test']], [6000, 2000, 2000])
    def test_corrected_scaler_does_not_see_validation_or_test(self):
        data = make_dataset(rows=100, features=6)
        _, mean, std = scale_data(data)
        data['x'][data['validation']] += 1000
        data['x'][data['test']] -= 1000
        _, changed_mean, changed_std = scale_data(data)
        np.testing.assert_array_equal(mean, changed_mean)
        np.testing.assert_array_equal(std, changed_std)
    def test_even_faulty_scaler_never_uses_test(self):
        data = make_dataset(rows=100, features=6)
        _, mean, std = scale_data(data, train_only=False)
        data['x'][data['test']] += 1000
        _, changed_mean, changed_std = scale_data(data, train_only=False)
        np.testing.assert_array_equal(mean, changed_mean)
        np.testing.assert_array_equal(std, changed_std)
    def test_batchnorm_mlp_gradients_match_finite_differences(self):
        rng = np.random.default_rng(9)
        model = MLP(features=4, hidden=5, seed=3, dropout=0, dtype=np.float64)
        x, y = rng.normal(size=(6, 4)), np.array([0, 1, 0, 1, 1, 0])
        _, grads = model.loss_and_gradients(x, y, update_stats=False)
        for name in model.p:
            original = model.p[name].copy()
            def loss(value):
                model.p[name] = value
                logits, _ = model.forward(x, training=True, update_stats=False)
                return model.metrics(logits, y)['loss']
            numerical = numerical_gradient(loss, original)
            model.p[name] = original
            with self.subTest(parameter=name):
                np.testing.assert_allclose(grads[name], numerical, rtol=1e-5, atol=1e-7)
    def test_eval_is_repeatable_and_does_not_update_buffers(self):
        rng = np.random.default_rng(4)
        model = MLP(features=4, hidden=5)
        x = rng.normal(size=(8, 4)).astype(np.float32)
        mean, var = model.mean.copy(), model.var.copy()
        a, _ = model.forward(x)
        b, _ = model.forward(x)
        np.testing.assert_array_equal(a, b)
        np.testing.assert_array_equal(model.mean, mean)
        np.testing.assert_array_equal(model.var, var)
    def test_corrected_scheduler_steps_per_epoch(self):
        data = make_dataset(rows=100, features=40)
        fixed, _ = train_variant(data, 'all_fixed', 7, epochs=2, batch_size=16)
        faulty, _ = train_variant(data, 'faulty_baseline', 7, epochs=2, batch_size=16)
        self.assertAlmostEqual(fixed['final_learning_rate'], .001 * .9 ** 2)
        self.assertAlmostEqual(faulty['final_learning_rate'], .001 * .9 ** 8)
if __name__ == '__main__':
    unittest.main()
