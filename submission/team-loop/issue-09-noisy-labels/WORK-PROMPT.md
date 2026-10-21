# Laksh working prompt

Paste the following into the coding assistant opened on your local clone. TASK.md is the authoritative problem statement snapshot; inspect the current official issue if requirements changed.

---

I am Laksh, member of team loop, working on issue #9: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/9.

Repository: https://github.com/mokashkumar1/HacktoberFest-3.0. Shared branch: team-loop. Read the repository instructions, submission/team-loop/COORDINATION.md, and this folder's TASK.md before editing. We have roughly two hours total.

My exclusive folder is submission/team-loop/issue-09-noisy-labels/. Moksh owns issue-08-attention-evaluation/ and shared coordination; Kartik owns issue-13-tunewave/. Do not change their files or root dependency files without coordination.

Produce a complete documented analysis for all five milestones of TASK.md, plus a reproducible Python calculations script. Use the standard library if practical; this task does not require training a model or downloading 50,000 tickets. The issue explicitly describes a fictional dataset and supplies aggregate audit statistics. Do not invent individual records or claim a real model was trained.

Cover:

1. Overall crowd-label noise estimate and a named 95% confidence-interval method with formula, assumptions and calculations. Compare Tier A versus Tier B using an appropriate two-sample statistical test; report the statistic, p-value, assumptions and practical difference. Distinguish expert disagreement from proven annotation error and distinguish crowd-subset estimates from the whole dataset.
2. Interpret the provided directional disagreement counts. Explain denominator limitations: these counts alone are not per-class error rates or a full confusion matrix. Give plausible root causes and concrete annotation-process improvements without claiming that the audit proves a cause.
3. Derive the six-class uniform-flip relationship between true accuracy and noisy-test accuracy under the stated independence assumptions. Calculate the requested approximate true accuracy, then explain why systematic/asymmetric errors and correlated model/annotator mistakes can invalidate the estimate.
4. Give a specific allocation/strategy for the 2,000-ticket review budget, with an unbiased random component and targeted review. Explain how to evaluate selection quality and how to use corrected labels without leaking evaluation data into training.
5. Explain two noise-robust training methods and a trustworthy independent expert evaluation set, including sample selection, adjudication and why the current test process is problematic.

Suggested outputs: REPORT.md; calculations.py; test_calculations.py; README.md with exact run/test commands. Validate calculations and intervals programmatically. Report actual results and distinguish given facts, assumptions and recommendations. Cite any external technical sources used.

Finish with a requirement checklist, changed files, run commands, actual test results and any remaining gaps. Explain the key results so I can present them myself.

Stage only my issue folder. Synchronize the shared branch according to COORDINATION.md, push without force, and send Moksh the commit ID and handoff. Do not fork again, edit the team-wide README, claim an issue publicly, or submit a separate final external PR.
