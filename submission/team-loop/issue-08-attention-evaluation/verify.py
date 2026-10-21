"""Run local verification. --write-results records actual output for review."""
import argparse
import io
import json
import platform
from pathlib import Path
import unittest
import numpy as np
from check_gradients import run_checks
from evaluation import scenario
from verify_experiment import check_saved_results

def verify(write_results=False):
    root = Path(__file__).resolve().parent
    stream = io.StringIO()
    suite = unittest.defaultTestLoader.discover(str(root), pattern='test_*.py')
    tests = unittest.TextTestRunner(stream=stream, verbosity=2).run(suite)
    print(stream.getvalue(), end='')
    gradients = run_checks()
    experiment = check_saved_results()
    result = {'python': platform.python_version(), 'numpy': np.__version__,
              'tests': {'run': tests.testsRun, 'failures': len(tests.failures),
                        'errors': len(tests.errors), 'skipped': len(tests.skipped),
                        'passed': tests.wasSuccessful()},
              'gradient_checks_passed': gradients['passed'], 'fraud_scenario': scenario(),
              'synthetic_experiment': experiment,
              'passed': tests.wasSuccessful() and gradients['passed'] and experiment['passed']}
    if write_results:
        results = root / 'results'
        results.mkdir(exist_ok=True)
        (results / 'gradient_checks.json').write_text(json.dumps(gradients, indent=2) + '\n', encoding='utf-8')
        (results / 'verification.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
        (results / 'unittest_output.txt').write_text(stream.getvalue(), encoding='utf-8')
        print('Actual results saved in results/.')
    print(json.dumps(result, indent=2))
    return result['passed']

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write-results', action='store_true')
    args = parser.parse_args()
    raise SystemExit(0 if verify(args.write_results) else 1)
