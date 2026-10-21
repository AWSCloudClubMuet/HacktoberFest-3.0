# Synthetic training experiment

## What was actually executed

Following the additional instruction relayed by Moksh to demonstrate an experiment on generated data, this submission now includes an executed training experiment, not only proposed fixes. We generated 10,000 rows with 40 features and two classes, trained ten predetermined pipeline variants for 50 epochs each across seeds 7, 19 and 42, and recorded all 30 runs.

The faulty baseline averaged **48.82% test accuracy**; the fully corrected pipeline averaged **89.62%** on the same 2,000 held-out rows, an observed increase of **40.80 percentage points**. Sample standard deviations across training seeds were 0.83 and 0.30 percentage points respectively. These summarize initialization/training variation on one fixed synthetic dataset and split; they are not population confidence intervals.

This does not reproduce the organizer's original 55% observation. No data was generated or selected to force that number. This binary-classification dataset is also separate from the report's hypothetical 0.1%-prevalence fraud scenario.

## Dataset and reproducibility

`experiment_results/dataset.npz` contains the full generated features, labels and split indices. `dataset_preview.csv` shows the first ten rows for inspection; it is not the full dataset. `dataset_metadata.json` records the generation rule, seeds, split counts and a SHA-256 fingerprint of the arrays.

- Generate independent standard-normal raw features z with NumPy seed 2026.
- Compute the label from `2*z0 - 1.5*z1 + 0.9*z2 + 0.8*z3*z4 + 0.5*sin(z5) > 0.3`.
- Independently flip each label with probability 0.02. The remaining 34 features are nuisance features.
- Apply fixed geometric feature scales from 0.01 to 100 and seeded offsets to make standardization relevant. These transformations are part of data generation, not model fitting.
- Use a fixed random IID split with seed 773: 6,000 training, 2,000 validation and 2,000 test rows. Split indices are disjoint and cover every row exactly once.
- The original 8,000/2,000 example is changed deliberately to 6,000/2,000/2,000 so an additional independent final test is available. The validation majority-class baseline is 52.35%, and the test majority-class baseline is 53.70%.

No personal data or external dataset is used. Reproduction checks regenerate the arrays and verify the fingerprint.

## Model and controlled comparison

We used a handwritten NumPy implementation of the supplied architecture: Linear(40,128), ReLU, Dropout(0.5), BatchNorm and Linear(128,2), trained with cross-entropy and Adam. BatchNorm uses epsilon 1e-5, update momentum 0.1 and an unbiased running-variance update. Hidden weights use He-normal initialization and output weights use standard deviation 1/sqrt(hidden). These are explicit choices held fixed across comparisons, not a claim of matching PyTorch's default initialization or bitwise behavior.

The CPU PyTorch download timed out, so this experiment runs with the existing NumPy dependency. This is a NumPy equivalent, not execution of the original PyTorch snippet. Its MLP/BatchNorm backpropagation is checked against finite differences on a small float64 case; full training uses float32.

Each training seed uses identical initial weights and separate reproducible random streams for batch order, training dropout and validation dropout across variants. We predeclared 50 epochs, batch size 256 and learning rate 0.001; there is no checkpoint/hyperparameter selection based on the final test. All variants report final-epoch metrics. The test set is evaluated read-only at the end of each predetermined run; repeated runs are descriptive comparisons, not a test-driven search for a winning configuration.

The four fix switches are:

| Switch | Faulty setting | Corrected setting |
| --- | --- | --- |
| pairing | Shuffle training inputs once without their labels | Keep input/label pairs together; shuffle paired batches |
| scaler | Fit means/std on training plus validation features | Fit on training features only |
| eval | Validation uses dropout and batch statistics, updating BatchNorm buffers | Read-only validation with dropout off and frozen running statistics |
| scheduler | Multiply learning rate by 0.9 after every training batch | Multiply by 0.9 after every epoch |

Even the faulty scaler excludes the test features so the final test does not participate in preprocessing fit. Its intentional validation leakage means that its validation estimate is compromised; that is part of the failure being demonstrated.

We retain both the validation number reported under each variant's own mode and a common read-only evaluation-mode validation number. The summary table uses the latter for a consistent comparison. Training loss, both validation losses/accuracies and learning rate are saved per epoch in learning_curves.csv. No final-test scores are used during epochs.

## Results and interpretation

| Variant | Validation mean | Test mean | Test seed SD |
| --- | ---: | ---: | ---: |
| Faulty baseline | 47.73% | 48.82% | 0.83 pp |
| Only pairing fixed | 54.87% | 55.55% | 0.44 pp |
| Only scaler fixed | 47.73% | 48.88% | 0.83 pp |
| Only eval fixed | 47.72% | 48.80% | 0.88 pp |
| Only scheduler fixed | 51.80% | 52.18% | 2.23 pp |
| All four fixed | 88.60% | 89.62% | 0.30 pp |
| All except pairing | 51.75% | 52.02% | 2.01 pp |
| All except scaler | 88.62% | 89.60% | 0.33 pp |
| All except eval | 88.62% | 89.65% | 0.31 pp |
| All except scheduler | 54.90% | 55.48% | 0.38 pp |

The pairing and scheduler faults dominate this controlled example. Fixing one while retaining the other leaves a major problem in place. Fixes interact, so isolated single-fix improvements do not add up to the fully corrected gain.

Removing scaler leakage remains methodologically correct but does not materially improve this IID experiment's accuracy. Evaluation mode restores a valid deterministic evaluation procedure; it does not necessarily increase accuracy, and the all-except-eval variant's mean test score is very slightly higher here. These small differences across only three seeds should not be presented as a reliable ranking. All outcomes are retained rather than discarding neutral or unfavorable comparisons.

The fully corrected mean training accuracy is 91.16%, validation is 88.60% and test is 89.62%. The discrepancy reflects generalization and sampling/training variation; no claim of perfect learning is made. The fixed 0.9-per-epoch schedule and dropout are not tuned to maximize this dataset's test score.

## Run and inspect

From this issue folder, using the existing parent NumPy environment:

```powershell
# Validate saved arrays, run count, splits and summary arithmetic
..\.venv\Scripts\python.exe verify_experiment.py

# Actually retrain baseline and all-fixed for seed 7 and compare to saved scores
..\.venv\Scripts\python.exe verify_experiment.py --rerun-seed 7

# Reproduce all 30 runs and regenerate data/results
..\.venv\Scripts\python.exe synthetic_training.py

# All unit tests, attention checks and saved-experiment validation
..\.venv\Scripts\python.exe verify.py
```

The complete run took approximately one to two minutes on this laptop; runtime is hardware dependent. A separate paired seed-7 replay reproduced 48.00% baseline test accuracy and 89.65% corrected test accuracy and matched the saved loss/accuracy values within the documented replay tolerances (rtol=1e-5, atol=1e-6).

The default experiment command overwrites experiment_results/ with freshly executed output. To experiment with a different epoch count, use a different output folder, for example `--epochs 10 --output experiment_trial`, and do not replace the recorded full results with a trial while presenting the full-run numbers.

## Limits

This establishes observed improvement on one explicitly defined synthetic task. It does not prove the cause of the original 55% result or expected improvement on real university or fraud data. Three training seeds do not explore dataset/split uncertainty. Initialization, data rule, hidden-layer size, dropout and schedule are documented controlled choices. The original PyTorch model was not executed; no original-dataset accuracy is claimed. The attention-gradient implementation remains a separate, independently verified deliverable.
