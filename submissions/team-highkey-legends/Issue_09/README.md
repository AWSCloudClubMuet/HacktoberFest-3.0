# HelpDeskNet-50K: Noisy Label Analysis

An analysis of the annotation noise in a fictitious dataset consisting of 50,000 customer-support tickets (divided into six classes) after a fine-tuned classifier has reached an accuracy of 82 per cent.

The central hypothesis is that the error or the plateau is due to the quality of the labels and not to the capacity of the model.

## Important note on data

HelpDeskNet-50K is imaginary and **no dataset is provided**; all the figures in this project are taken from the numbers stated in the problem statement (such as the 400-ticket expert audit, the 60-disagreement breakdown, the class shares and the sizes of the labeling process). Milestone 4 makes use of a **synthetic simulation** constructed from those figures and the model-confidence signal is assumed rather than actually measured, so the results offered are only illustrative.

## Repository contents

File  Description 
The notebook called `notebook.ipynb` contains the code for Milestones 1 to 4 (this includes the calculations, the heatmap, the Monte Carlo test, the derivation of the accuracy ceiling, and the selection simulation). 
REPORT.md: A complete written report on milestones 1 through 5 
The guide / this file 

## Milestone overview



Milestone M1: 
How loud are the crowd labels? Are Tier A and Tier B any different?  
Method: Wald and Wilson CIs, two-proportion z-test, Fisher's exact test Where: Notebook + report 
Milestone  M2 :
Is the noise systematic or random? 
Method: Disagreement heatmap, pair-level analysis, Monte Carlo test against uniform noise 
Where: Notebook + report 
Milestone M3: 
What is the model's actual accuracy likely to be? 
Method : Symmetric-noise derivation plus sensitivity analysis | 
where: Notebook + report 
Milestone M4 :
What 2,000 tickets should experts look at?  
 Method : Simulation comparing random, priors-only, model-only and combined selection 
  where: Notebook + report 
 Milestone M5: 
 How can we train and evaluate things in a reliable way? 
 Method: Design only (no code) 
where : Report 

## Key results

– The rate of crowd noise was **15.0%** (95% Wilson CI 11.8% to 18.8%); it was approximately **13.5%** in the entire 50K dataset.
Tier A is 6.7% and Tier B is 21.8%. The difference is 15.2 percentage points. z equals 4.22. p equals 2.4e-5.
- The noise is systematic since only eight out of the thirty possible confusions happen, and three of the class pairs are responsible for 86.7% of the disagreements (with a Monte Carlo p value less than 0.0001).
- According to the naive uniform-noise model the actual accuracy is around **96%**, but the estimate is fragile and likely optimistic.
Because there are 2,000 reviews, recall is limited to nearly 30% and therefore relabelling on its own is insufficient, noise-robust training being necessary.

## How to run

The requirements are Python 3.9 or later together with the packages numpy, pandas, scipy, statsmodels and matplotlib.

```bash
pip install numpy pandas scipy statsmodels matplotlib
```

Open the notebook called notebook.ipynb and execute the cells one below the other in the order given. Each cell includes its own imports and data, and the random seeds are set (to default_rng(42) in the case of the Monte Carlo test and to default_rng(0) for the selection simulation), which ensures that the results are reproducible.

## Caveats

1. Since experts are regarded as being correct, any disagreement is taken to represent noise rather than actual noise.
The estimates at the tier level are based on small samples (180 and 220 tickets), which is why their confidence intervals are wide.
3. The root cause—namely, the unclear guidelines together with inadequate training—is the most probable explanation, even though it has not been proven.
The M4 simulation makes use of a model-confidence quality (that is, strong, moderate, or weak) and employs a single random seed.