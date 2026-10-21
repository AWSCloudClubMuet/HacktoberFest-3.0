# Moksh working prompt

Paste the following into the coding assistant opened on your local clone. TASK.md is the authoritative problem statement snapshot; inspect the current official issue if requirements changed.

---

I am Moksh, lead of team loop, working on issue #8: https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/8.

Repository: https://github.com/mokashkumar1/HacktoberFest-3.0. Shared branch: team-loop. Read the repository instructions, submission/team-loop/COORDINATION.md, and this folder's TASK.md before editing. The user-stated deadline is 3:00 PM Pakistan time on 21 October 2026. Complete all mandatory deliverables and leave time for verification and demonstration.

My exclusive implementation folder is submission/team-loop/issue-08-attention-evaluation/. Kartik owns issue-13-tunewave/; Laksh owns issue-09-noisy-labels/. Do not modify their folders. As lead I own the top-level team README and coordination, but coordinate any shared dependency changes first.

Implement all four mandatory milestones in TASK.md:

1. Diagnose the provided training pipeline. Distinguish definite bugs from issues that depend on omitted code. Explain symptoms and fixes, and give black-box diagnostic experiments. Supply corrected training code or a sufficiently precise description of each fix, as the issue allows. Do not require a GPU, dataset download, or PyTorch installation just to read or verify the NumPy deliverables. If corrected PyTorch code is not executed, explicitly state that.
2. Derive all attention gradients. Implement stable forward/backward passes in float64 NumPy, with deterministic numerical gradient checks for Q, K and V. Include an unmasked case and a causal-mask case. Document finite-difference step size, error metric, acceptance threshold and actual measured results. Explain softmax stabilization, scaling, masking and quadratic attention memory versus FlashAttention. Avoid all-masked rows or document/test their handling.
3. Design fraud evaluation with extreme imbalance, temporal changes, label maturity, calibration and the stated costs. State assumptions behind the cost threshold. No invented real-world dataset or performance results.
4. Diagnose learning-curve cases A/B/C and propose at least two explanations and a distinguishing experiment for D. Do not treat a single aggregate accuracy pattern as proof of a particular cause.

Suggested outputs: README.md or REPORT.md; attention.py; check_gradients.py; test_attention.py; training_fixes.md or corrected_training.py. Use standard-library unittest where appropriate and the shared NumPy environment. Any synthetic data must be labeled synthetic.

Run meaningful checks and save reproducible commands and actual output. Keep the explanations clear enough for me to defend in a short demo. Finish with a requirement-by-requirement checklist, changed files, test results, assumptions and remaining gaps.

Before committing, inspect the diff. Stage only this issue folder (and lead-owned shared files only when intentionally changed). Follow COORDINATION.md for synchronizing the shared branch; never force-push. Do not create the final external PR until the solutions are verified and the upstream target is confirmed.
