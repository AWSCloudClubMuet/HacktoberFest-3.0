# HelpDeskNet-50K: Noisy Label Analysis and Mitigation

**Author:** Nabeel Shahid  
**Project area:** Machine Learning, Data Quality, Statistical Analysis

## 1. Project overview

HelpDeskNet-50K is a fictional customer-support dataset containing 50,000 tickets divided into six classes: Billing, Refund, Technical, Account Access, Shipping, and Other.

A text classifier reaches only 82% accuracy and stops improving. Instead of assuming that the model is the only problem, this project investigates whether incorrect training and test labels are creating an accuracy ceiling.

The central question is:

> Is the model failing, or is it learning from unreliable labels?

## 2. Proposed analysis

Experts audited 400 crowd-labeled tickets and found 60 disagreements. I used this audit to estimate the overall noise rate, compare worker tiers, identify systematic class confusion, prioritize additional expert review, and design a trustworthy evaluation process.

## 3. Main results

- Estimated crowd-label noise: **15%**
- 95% Wilson confidence interval: **11.83%–18.83%**
- Estimated incorrect labels among 45,000 crowd-labeled tickets: **6,750**
- Approximate interval: **5,325–8,474** incorrect labels
- Tier A noise: **6.67%**
- Tier B noise: **21.82%**
- Tier difference: statistically significant, with **p < 0.001**
- Naive true-accuracy estimate under uniform noise: **96.34%**

The Tier B result suggests that worker experience or training quality is strongly associated with annotation reliability. The disagreement table also shows systematic confusion, especially between Billing and Refund and between Technical and Account Access.

## 4. Expert-review strategy

Because experts can review only 2,000 additional tickets, the project prioritizes the most useful tickets:

- 1,500 high-risk Tier B tickets selected using model uncertainty and disagreement patterns
- 500 high-risk Tier A tickets for comparison and coverage

The corrected labels can then be used to create a trusted evaluation set, improve training data, update annotation guidelines, and measure whether model performance improves.

## 5. Noise mitigation and evaluation

Two proposed training-time methods are small-loss selection and co-teaching. Both reduce the influence of suspicious labels while retaining useful data. The final model should be evaluated on a fresh expert-adjudicated test set rather than the original crowd-labeled test set, because the original test labels contain the same annotation biases.

## 6. Deliverable

Open `HelpDeskNet_Analysis.ipynb` in Google Colab or Jupyter Notebook and run the cells in order. The notebook contains the calculations, statistical test, disagreement visualization, accuracy-ceiling estimate, review simulation, and noise-mitigation proposal.

## 7. Limitation

The dataset and audit scenario are fictional. The 96.34% value is only the result under the requested assumption that 15% of labels are flipped uniformly across the other five classes. Since the observed noise is systematic, the final model accuracy must be measured on an independent expert-labeled test set.
