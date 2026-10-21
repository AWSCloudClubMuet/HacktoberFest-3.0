from synthetic_training import VARIANTS, make_dataset, train_variant
import argparse
import csv
import hashlib
import json
from pathlib import Path
import numpy as np
def check_saved_results(folder=None, rerun_seed=None):
    folder = Path(folder) if folder else Path(__file__).parent / 'experiment_results'
    result = json.loads((folder / 'training_results.json').read_text(encoding='utf-8'))
    meta = json.loads((folder / 'dataset_metadata.json').read_text(encoding='utf-8'))
    if meta != result['metadata']:
        raise ValueError('metadata files disagree')
    with np.load(folder / 'dataset.npz', allow_pickle=False) as stored:
        data = {key: stored[key] for key in stored.files}
    expected = make_dataset(seed=meta['generation_seed'], split_seed=meta['split_seed'])
    for name in expected:
        np.testing.assert_array_equal(data[name], expected[name])
    if data['x'].shape != (10000, 40) or set(data['y']) != {0, 1}:
        raise ValueError('dataset dimensions/classes are wrong')
    ids = np.r_[data['train'], data['validation'], data['test']]
    if not np.array_equal(np.sort(ids), np.arange(10000)):
        raise ValueError('split overlap, missing rows, or invalid indices')
    fingerprint = hashlib.sha256(data['x'].tobytes() + data['y'].tobytes() +
                                 b''.join(data[s].tobytes() for s in ['train', 'validation', 'test'])).hexdigest()
    if fingerprint != meta['dataset_array_sha256']:
        raise ValueError('dataset checksum mismatch')
    keys = [(r['variant'], r['seed']) for r in result['runs']]
    expected_keys = {(name, seed) for name in VARIANTS for seed in meta['seeds']}
    if len(keys) != len(expected_keys) or set(keys) != expected_keys:
        raise ValueError('missing or duplicate training runs')
    for run in result['runs']:
        if run['fixes'] != sorted(VARIANTS[run['variant']]) or run['epochs'] != meta['epochs']:
            raise ValueError('run configuration mismatch')
        for split in ['train', 'validation', 'test']:
            score = run[split]
            if not 0 <= score['accuracy'] <= 1 or not np.isfinite(score['loss']) or score['loss'] < 0:
                raise ValueError('invalid accuracy/loss')
    for summary in result['summary']:
        runs = [r for r in result['runs'] if r['variant'] == summary['variant']]
        for split in ['train', 'validation', 'test']:
            scores = [r[split]['accuracy'] for r in runs]
            np.testing.assert_allclose(summary[split + '_mean_accuracy'], np.mean(scores))
            sd = np.std(scores, ddof=1) if len(scores) > 1 else 0
            np.testing.assert_allclose(summary[split + '_std_accuracy'], sd)
    with (folder / 'learning_curves.csv').open(newline='', encoding='utf-8') as file:
        curves = list(csv.DictReader(file))
    if len(curves) != len(keys) * meta['epochs']:
        raise ValueError('incomplete learning curves')
    for name, seed in expected_keys:
        selected = [r for r in curves if r['variant'] == name and int(r['seed']) == seed]
        if {int(r['epoch']) for r in selected} != set(range(1, meta['epochs'] + 1)):
            raise ValueError('learning-curve epochs incomplete')
    replay = []
    if rerun_seed is not None:
        if rerun_seed not in meta['seeds']:
            raise ValueError('replay seed is not among the recorded seeds')
        for name in ['faulty_baseline', 'all_fixed']:
            actual, _ = train_variant(data, name, rerun_seed, meta['epochs'])
            recorded = next(r for r in result['runs'] if r['variant'] == name and r['seed'] == rerun_seed)
            for split in ['train', 'validation', 'test']:
                for metric in ['loss', 'accuracy']:
                    np.testing.assert_allclose(actual[split][metric], recorded[split][metric], rtol=1e-5, atol=1e-6)
            replay.append({'variant': name, 'seed': rerun_seed, 'test_accuracy': actual['test']['accuracy'], 'matched': True})
    return {'passed': True, 'dataset_rows': 10000, 'features': 40, 'recorded_runs': len(keys),
            'epochs_per_run': meta['epochs'], 'split_overlap': False,
            'dataset_checksum_matches': True, 'summaries_recalculated': True, 'replay': replay}
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Check the saved training experiment.')
    parser.add_argument('--folder')
    parser.add_argument('--rerun-seed', type=int)
    args = parser.parse_args()
    print(json.dumps(check_saved_results(args.folder, args.rerun_seed), indent=2))
