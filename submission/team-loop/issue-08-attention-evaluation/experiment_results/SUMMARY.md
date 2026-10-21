# Synthetic training experiment results

Actual locally executed results; not the organizer's original 55% experiment.

| Variant | Train mean | Validation mean +/- seed SD | Test mean +/- seed SD |
| --- | ---: | ---: | ---: |
| faulty_baseline | 50.40% | 47.73% +/- 3.19% | 48.82% +/- 0.83% |
| only_pairing_fixed | 55.38% | 54.87% +/- 2.08% | 55.55% +/- 0.44% |
| only_scaler_fixed | 50.37% | 47.73% +/- 3.24% | 48.88% +/- 0.83% |
| only_eval_fixed | 50.36% | 47.72% +/- 3.13% | 48.80% +/- 0.88% |
| only_scheduler_fixed | 56.34% | 51.80% +/- 2.98% | 52.18% +/- 2.23% |
| all_fixed | 91.16% | 88.60% +/- 0.22% | 89.62% +/- 0.30% |
| all_except_pairing | 56.35% | 51.75% +/- 2.90% | 52.02% +/- 2.01% |
| all_except_scaler | 91.15% | 88.62% +/- 0.19% | 89.60% +/- 0.33% |
| all_except_eval | 91.13% | 88.62% +/- 0.23% | 89.65% +/- 0.31% |
| all_except_scheduler | 55.35% | 54.90% +/- 2.05% | 55.48% +/- 0.38% |

SD is sample standard deviation over initialization/training seeds; it is not a confidence interval.
Validation majority baseline: 52.35%. Test majority baseline: 53.70%.

See training_results.json for each run, dataset_metadata.json for generation/split details, and learning_curves.csv for all reported validation epochs.
