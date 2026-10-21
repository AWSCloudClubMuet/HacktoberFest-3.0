# Noisy Labels: HelpDeskNet-50K

**Team LappuCodes** | AWS Cloud Club MUET Hackathon | Issue #9
**Members:** Shiza Shah, Harmain, Fiza

A support-ticket classifier on HelpDeskNet-50K gets stuck at 82% accuracy, and more epochs or a bigger model don't help. Our project looks at whether the labels, not the model, are the problem. We measure the label noise, show that the mistakes are systematic, estimate the model's real accuracy, plan an expert review of 2,000 tickets, and test noise-tolerant training with a cleaner evaluation set.

The full write-up is in **[REPORT.md](REPORT.md)**. This README only explains how to run the code.

## Important note about the data

The organisers gave us tables, not a data file. Milestones 1 to 3 use only the numbers from the brief. For Milestones 4 and 5, `step0_generate_data.py` creates a simulated HelpDeskNet-50K that follows the brief (same class shares, same expert / Tier A / Tier B split, and label mistakes based on the audit table). Because the simulated tickets have known true labels, we can check that our methods work. The numbers from Milestones 4 and 5 show how the methods behave, not exact results on the real data.

## Key findings

| Milestone | Result |
|---|---|
| 1. Noise rate | About 15% of crowd labels are wrong (95% CI 11.6% to 18.5%). Tier B is wrong 21.8% of the time against 6.7% for Tier A (p about 0.00002). |
| 2. Noise pattern | The errors are systematic: Billing/Refund and Technical/Account Access get mixed up, and "Other" is under-used. |
| 3. Accuracy ceiling | Under a uniform-noise assumption, 82% on the noisy test means about 96% true accuracy, but this is likely too optimistic. |
| 4. Finding bad labels | In our simulation, ranking tickets by model disagreement found wrong labels about 6 times more often than random picking. |
| 5. Robust training | Filtering and loss correction improved expert-test accuracy from 89.9% to 94.0% and 96.2%, while the noisy test showed almost no difference. |

## How to run

You need Python 3.10 or newer.

```bash
python -m venv venv
venv\Scripts\activate          # Windows (cmd)
source venv/bin/activate       # Mac / Linux
pip install -r requirements.txt
mkdir outputs
python step0_generate_data.py
python m1_quantify_noise.py
python m2_noise_pattern.py
python m3_accuracy_ceiling.py
python m4_find_bad_labels.py
python m5_robust_training.py
```

`step0` must run first because it creates `data/helpdesknet.csv`. Milestones 4 and 5 take a minute or two. The heat-map for Milestone 2 is saved as `outputs/m2_confusion_heatmap.png`. Results can vary by about a point between runs because the simulated data is random. On Windows PowerShell, if activation is blocked, put `venv\Scripts\python` in front of each command instead of `python`.

## Project structure

| File | What it does |
|---|---|
| `common.py` | Class names and the data loader |
| `step0_generate_data.py` | Builds the simulated dataset |
| `m1_quantify_noise.py` | Noise rate, confidence intervals, Tier A vs Tier B test |
| `m2_noise_pattern.py` | Disagreement table, heat-map, randomness test |
| `m3_accuracy_ceiling.py` | True-accuracy estimate and sensitivity table |
| `m4_find_bad_labels.py` | Ranks tickets for expert review and tests the ranking |
| `m5_robust_training.py` | Two noise-tolerant training methods and expert-set evaluation |
| `REPORT.md` | Full analysis and answers |
| `outputs/` | Saved results and the heat-map |

## Libraries used

numpy, pandas, scipy, scikit-learn, matplotlib