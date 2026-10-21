# Issue 8 final audit

Owner: Moksh. Scope: the mandatory deliverables in organizer issue 8, not the other two team solutions or final submission acceptance.

## Requirement review

| Requirement | Evidence | Result |
| --- | --- | --- |
| Identify training-code problems, explain symptoms, provide fixes and black-box experiments | TRAINING-FIXES.md finding table, corrected procedure and experiment table | Covered; definite/conditional findings and hypotheses distinguished |
| Derive dV, dP, dS, dQ and dK | REPORT.md section B | Covered with shapes, equations and softmax Jacobian |
| Implement forward/backward in NumPy and verify numerically | attention.py, check_gradients.py, results/gradient_checks.json | All 15 gradient-array checks pass |
| State numerical step, precision and acceptance criteria | check_gradients.py and REPORT.md | float64; central step 1e-6; max absolute <=1e-7 and relative L2 <=1e-6 |
| Explain numerical stability and scaling | REPORT.md section B | Stable row softmax, input overflow behavior and 1/sqrt(d) variance reasoning |
| Explain causal backward behavior | REPORT.md and masked tests | Masked score gradients zero; whole Q/K/V row gradients need not be zero |
| Explain sequence-length memory and FlashAttention | REPORT.md section B | Quadratic baseline storage, tiling/recomputation explanation; no GPU-kernel claim |
| Design fraud metrics, time splits, delayed-label evaluation, cost threshold/calibration and drift handling | REPORT.md section C and evaluation.py | Covered; threshold verified under explicitly stated assumptions |
| Diagnose A/B/C and give at least two D hypotheses plus a distinguishing experiment | REPORT.md section D | Covered; proposed crossed source/label audit and uncertainty acknowledged |

## Final checks and improvements

- 26 unittest tests pass, with no failures, errors or skips.
- Numerical differentiation checks dQ/dK/dV/dP/dS in three attention scenarios. Recorded maximum absolute error is about 2.624e-10, within the specified 1e-7 limit.
- Independent forward-reference tests use scalar loops and math.exp across four seeds in causal and noncausal modes. These reduce reliance on a vectorized implementation merely agreeing with its own derivative.
- Zero upstream gradients, masked gradients, causal future exclusion, stable large scores, malformed inputs, and fully masked rows are covered.
- Audit improvement: normalize finite costs before adding them so extreme costs do not overflow the threshold denominator; normalize accepted numeric inputs consistently in both cost functions. Required default costs were already correct. Regression tests cover both improvements.
- Exact verification commands and machine-readable/test-log evidence are included in README.md and results/.

The audit found no unmet mandatory requirement or known blocking defect in the reviewed scope. This is not a proof that every possible bug is absent or a guarantee of judges' acceptance.

## Limits the presenter must understand

The original training dataset, loader and weights were not supplied; the permitted precise-fix description is delivered instead of an executed PyTorch retraining. No measured accuracy improvement is claimed. Fraud evaluation and learning-curve interventions are documented designs, with scenario arithmetic rather than a trained production detector. FlashAttention is explained rather than implemented. Fully masked rows are deliberately rejected; causal mode is square self-attention.

## Moksh's remaining steps

1. Read DEMO-GUIDE.md and explain the forward/backward idea, numerical verification, cost threshold and limitations in your own words.
2. Run verify.py live and locate the report/results if judges ask.
3. Review teammates' actual handoffs and run their commands before declaring all three issues complete.
4. Confirm the official final-PR target with organizers; the last checked official branch list contained only main, despite instructions naming submission.
5. Finish the combined team README and final submission before the user-stated 3 PM Pakistan-time deadline.

Kartik remains the owner of issue 13 and Laksh of issue 9. This issue's passing tests do not verify their solutions. Each should provide their own requirements checklist, actual test/calculation output, run instructions, assumptions, commit ID and a short demo explanation.
