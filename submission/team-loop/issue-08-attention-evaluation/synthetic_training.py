import os
for _name in ('OPENBLAS_NUM_THREADS', 'OMP_NUM_THREADS', 'MKL_NUM_THREADS'):
    os.environ[_name] = '1'
import argparse
import csv
import hashlib
import json
from pathlib import Path
import time
import numpy as np
VARIANTS = {
    'faulty_baseline': set(),
    'only_pairing_fixed': {'pairing'},
    'only_scaler_fixed': {'scaler'},
    'only_eval_fixed': {'eval'},
    'only_scheduler_fixed': {'scheduler'},
    'all_fixed': {'pairing', 'scaler', 'eval', 'scheduler'},
    'all_except_pairing': {'scaler', 'eval', 'scheduler'},
    'all_except_scaler': {'pairing', 'eval', 'scheduler'},
    'all_except_eval': {'pairing', 'scaler', 'scheduler'},
    'all_except_scheduler': {'pairing', 'scaler', 'eval'}
}
def make_dataset(rows=10000, features=40, seed=2026, split_seed=773):
    if rows < 20 or features < 6:
        raise ValueError('need at least 20 rows and 6 features')
    rng = np.random.default_rng(seed)
    raw = rng.normal(size=(rows, features))
    score = 2 * raw[:, 0] - 1.5 * raw[:, 1] + 0.9 * raw[:, 2]
    score += 0.8 * raw[:, 3] * raw[:, 4] + 0.5 * np.sin(raw[:, 5])
    y = (score > 0.3).astype(np.int64)
    flips = rng.random(rows) < 0.02
    y[flips] = 1 - y[flips]
    scales = np.geomspace(0.01, 100, features)
    offsets = rng.uniform(-20, 20, features)
    x = (raw * scales + offsets).astype(np.float32)
    order = np.random.default_rng(split_seed).permutation(rows)
    a, b = int(rows * 0.6), int(rows * 0.8)
    return {'x': x, 'y': y, 'train': order[:a], 'validation': order[a:b], 'test': order[b:]}
def scale_data(data, train_only=True):
    ids = data['train'] if train_only else np.r_[data['train'], data['validation']]
    mean = data['x'][ids].mean(axis=0, dtype=np.float64)
    std = data['x'][ids].std(axis=0, dtype=np.float64)
    std = np.where(std == 0, 1, std)
    x = ((data['x'] - mean) / std).astype(np.float32)
    return x, mean, std
class MLP:
    def __init__(self, features=40, hidden=128, seed=7, dropout=0.5, dtype=np.float32):
        if not 0 <= dropout < 1:
            raise ValueError('dropout must be in [0,1)')
        rng = np.random.default_rng(seed)
        self.p = {
            'w1': (rng.normal(size=(features, hidden)) * np.sqrt(2 / features)).astype(dtype),
            'b1': np.zeros(hidden, dtype=dtype), 'gamma': np.ones(hidden, dtype=dtype),
            'beta': np.zeros(hidden, dtype=dtype),
            'w2': (rng.normal(size=(hidden, 2)) * np.sqrt(1 / hidden)).astype(dtype),
            'b2': np.zeros(2, dtype=dtype)
        }
        self.mean = np.zeros(hidden, dtype=dtype)
        self.var = np.ones(hidden, dtype=dtype)
        self.dropout = dropout
        self.m = {name: np.zeros_like(p) for name, p in self.p.items()}
        self.v = {name: np.zeros_like(p) for name, p in self.p.items()}
        self.step = 0
    def forward(self, x, training=False, rng=None, update_stats=True):
        p = self.p
        z = x @ p['w1'] + p['b1']
        a = np.maximum(z, 0)
        drop = np.ones_like(a)
        if training and self.dropout:
            if rng is None:
                raise ValueError('training dropout needs an explicit random generator')
            drop = (rng.random(a.shape) >= self.dropout).astype(a.dtype) / (1 - self.dropout)
            a = a * drop
        if training:
            mean = a.mean(axis=0)
            var = a.var(axis=0)
            if update_stats:
                self.mean = 0.9 * self.mean + 0.1 * mean
                unbiased = var * (len(x) / (len(x) - 1)) if len(x) > 1 else var
                self.var = 0.9 * self.var + 0.1 * unbiased
        else:
            mean, var = self.mean, self.var
        inv = 1 / np.sqrt(var + 1e-5)
        norm = (a - mean) * inv
        bn = norm * p['gamma'] + p['beta']
        logits = bn @ p['w2'] + p['b2']
        return logits, (x, z, drop, norm, inv, bn)
    @staticmethod
    def metrics(logits, y):
        shifted = logits - logits.max(axis=1, keepdims=True)
        exps = np.exp(shifted)
        loss = np.mean(np.log(exps.sum(axis=1)) - shifted[np.arange(len(y)), y])
        return {'loss': float(loss), 'accuracy': float(np.mean(logits.argmax(axis=1) == y))}
    def loss_and_gradients(self, x, y, rng=None, update_stats=True):
        logits, cache = self.forward(x, training=True, rng=rng, update_stats=update_stats)
        x, z, drop, norm, inv, bn = cache
        shifted = logits - logits.max(axis=1, keepdims=True)
        probs = np.exp(shifted)
        total = probs.sum(axis=1, keepdims=True)
        loss = float(np.mean(np.log(total[:, 0]) - shifted[np.arange(len(y)), y]))
        probs /= total
        dz = probs.copy()
        dz[np.arange(len(y)), y] -= 1
        dz /= len(y)
        grads = {'w2': bn.T @ dz, 'b2': dz.sum(axis=0)}
        dbn = dz @ self.p['w2'].T
        grads['gamma'] = (dbn * norm).sum(axis=0)
        grads['beta'] = dbn.sum(axis=0)
        dn = dbn * self.p['gamma']
        da = inv * (dn - dn.mean(axis=0) - norm * (dn * norm).mean(axis=0))
        dz1 = da * drop * (z > 0)
        grads['w1'], grads['b1'] = x.T @ dz1, dz1.sum(axis=0)
        return loss, grads
    def update(self, grads, lr):
        self.step += 1
        for name in self.p:
            self.m[name] = 0.9 * self.m[name] + 0.1 * grads[name]
            self.v[name] = 0.999 * self.v[name] + 0.001 * grads[name] ** 2
            m = self.m[name] / (1 - 0.9 ** self.step)
            v = self.v[name] / (1 - 0.999 ** self.step)
            self.p[name] -= lr * m / (np.sqrt(v) + 1e-8)
def train_variant(data, name, seed, epochs=50, batch_size=256):
    fixes = VARIANTS[name]
    x, _, _ = scale_data(data, train_only='scaler' in fixes)
    tx, ty = x[data['train']].copy(), data['y'][data['train']]
    if 'pairing' not in fixes:
        tx = tx[np.random.default_rng(seed + 100).permutation(len(tx))]
    vx, vy = x[data['validation']], data['y'][data['validation']]
    model = MLP(seed=seed)
    batches = np.random.default_rng(seed + 200)
    training_rng = np.random.default_rng(seed + 300)
    validation_rng = np.random.default_rng(seed + 400)
    lr, history = 1e-3, []
    for epoch in range(epochs):
        order = batches.permutation(len(tx))
        train_loss = 0.0
        for start in range(0, len(tx), batch_size):
            ids = order[start:start + batch_size]
            loss, grads = model.loss_and_gradients(tx[ids], ty[ids], training_rng)
            train_loss += loss * len(ids)
            model.update(grads, lr)
            if 'scheduler' not in fixes:
                lr *= 0.9
        if 'scheduler' in fixes:
            lr *= 0.9
        reported, _ = model.forward(vx, training='eval' not in fixes, rng=validation_rng)
        row = {'epoch': epoch + 1, 'learning_rate_after_epoch': lr,
               'train_loss': train_loss / len(tx)}
        row.update({'reported_validation_' + k: v for k, v in model.metrics(reported, vy).items()})
        canonical, _ = model.forward(vx)
        row.update({'canonical_validation_' + k: v for k, v in model.metrics(canonical, vy).items()})
        history.append(row)
    train_logits, _ = model.forward(tx)
    validation_logits, _ = model.forward(vx)
    test_logits, _ = model.forward(x[data['test']])
    result = {'variant': name, 'seed': seed, 'fixes': sorted(fixes), 'epochs': epochs,
              'batch_size': batch_size, 'final_learning_rate': lr,
              'reported_validation_accuracy': history[-1]['reported_validation_accuracy'],
              'train': model.metrics(train_logits, ty),
              'validation': model.metrics(validation_logits, vy),
              'test': model.metrics(test_logits, data['y'][data['test']])}
    return result, history
def run_experiment(output, epochs=50, seeds=(7, 19, 42)):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    data = make_dataset()
    np.savez_compressed(output / 'dataset.npz', **data)
    fingerprint = hashlib.sha256(data['x'].tobytes() + data['y'].tobytes() +
                                 b''.join(data[s].tobytes() for s in ['train', 'validation', 'test'])).hexdigest()
    meta = {'synthetic': True, 'rows': 10000, 'features': 40, 'classes': 2,
            'generation_seed': 2026, 'split_seed': 773, 'dataset_array_sha256': fingerprint,
            'formula_before_feature_scaling': '2*z0-1.5*z1+0.9*z2+0.8*z3*z4+0.5*sin(z5)>0.3',
            'independent_label_flip_probability': 0.02,
            'feature_transform': '40 geometric scales from 0.01 to 100 plus seeded random offsets',
            'splits': {s: {'rows': len(data[s]), 'positive_rate': float(data['y'][data[s]].mean())}
                       for s in ['train', 'validation', 'test']},
            'baseline_scaler_fit': 'train+validation only; never test',
            'corrected_scaler_fit': 'train only',
            'architecture': '40 -> Linear(128) -> ReLU -> Dropout(0.5) -> BatchNorm -> Linear(2)',
            'framework': 'handwritten NumPy, not PyTorch', 'numpy': np.__version__,
            'optimizer': 'Adam lr=0.001, beta1=0.9, beta2=0.999, eps=1e-8',
            'initialization': 'He normal w1; normal with std=1/sqrt(hidden) w2; fixed per training seed',
            'schedule': 'gamma=0.9 per batch if faulty; per epoch if fixed',
            'seeds': list(seeds), 'epochs': epochs, 'checkpoint_rule': 'final epoch; no tuning or test-based selection'}
    (output / 'dataset_metadata.json').write_text(json.dumps(meta, indent=2) + '\n', encoding='utf-8')
    with (output / 'dataset_preview.csv').open('w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow([f'x{i:02d}' for i in range(40)] + ['label'])
        writer.writerows([list(data['x'][i]) + [int(data['y'][i])] for i in range(10)])
    runs, curves = [], []
    start = time.perf_counter()
    for seed in seeds:
        for name in VARIANTS:
            result, history = train_variant(data, name, seed, epochs)
            runs.append(result)
            curves.extend({'variant': name, 'seed': seed, **row} for row in history)
            print(f"seed={seed:2} {name:25} val={result['validation']['accuracy']:.4f} test={result['test']['accuracy']:.4f}", flush=True)
    summary = []
    for name in VARIANTS:
        group = [r for r in runs if r['variant'] == name]
        row = {'variant': name}
        for split in ['train', 'validation', 'test']:
            scores = [r[split]['accuracy'] for r in group]
            row[split + '_mean_accuracy'] = float(np.mean(scores))
            row[split + '_std_accuracy'] = float(np.std(scores, ddof=1)) if len(scores) > 1 else 0.0
        summary.append(row)
    results = {'metadata': meta, 'elapsed_seconds': time.perf_counter() - start,
               'majority_baselines': {s: float(max(data['y'][data[s]].mean(), 1-data['y'][data[s]].mean()))
                                      for s in ['validation', 'test']},
               'runs': runs, 'summary': summary,
               'limitations': ['Synthetic IID dataset, not the organizer original run.',
                               'NumPy implementation is architecturally equivalent, not a bitwise PyTorch reproduction.',
                               'Three seeds measure training variation on one fixed dataset/split, not population uncertainty.',
                               'Broken scaling intentionally uses validation features; no variant fits on test features.',
                               'A fix need not improve accuracy by itself; interactions and neutral results are retained.']}
    (output / 'training_results.json').write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')
    with (output / 'learning_curves.csv').open('w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=list(curves[0]))
        writer.writeheader()
        writer.writerows(curves)
    return results
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run the synthetic training experiment.')
    parser.add_argument('--output', default=str(Path(__file__).parent / 'experiment_results'))
    parser.add_argument('--epochs', type=int, default=50)
    args = parser.parse_args()
    if args.epochs < 1:
        parser.error('--epochs must be positive')
    run_experiment(args.output, args.epochs)
