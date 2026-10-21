"""Reproducible aggregate-statistics analysis for fictional HelpDeskNet-50K.

Run: python -m src.analysis
All input figures come from GitHub issue #9, not from raw ticket records.
"""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy.stats import norm

OUT = Path(__file__).resolve().parents[1] / "outputs"
TIERS = {"A": {"size": 20000, "audited": 180, "wrong": 12},
         "B": {"size": 25000, "audited": 220, "wrong": 48}}
CONFUSIONS = [
    ("Billing", "Refund", 14), ("Refund", "Billing", 12),
    ("Technical", "Account Access", 9), ("Shipping", "Other", 8),
    ("Account Access", "Technical", 6), ("Technical", "Other", 5),
    ("Other", "Shipping", 3), ("Billing", "Other", 3),
]

def wilson_interval(errors: int, n: int, z: float = 1.959963984540054):
    phat = errors / n
    denom = 1 + z*z/n
    center = (phat + z*z/(2*n))/denom
    half = z*np.sqrt(phat*(1-phat)/n + z*z/(4*n*n))/denom
    return center-half, center+half

def tier_test():
    a, b = TIERS["A"], TIERS["B"]
    pa, pb = a["wrong"]/a["audited"], b["wrong"]/b["audited"]
    pooled = (a["wrong"] + b["wrong"])/(a["audited"] + b["audited"])
    se = np.sqrt(pooled*(1-pooled)*(1/a["audited"] + 1/b["audited"]))
    z = (pa-pb)/se
    return {"tier_a_rate": pa, "tier_b_rate": pb,
            "z_statistic": float(z), "two_sided_p": float(2*norm.sf(abs(z)))}

def stratified_interval():
    """Wald normal approximation to a stratified-population rate (SRS per tier)."""
    total = sum(t["size"] for t in TIERS.values())
    p = 0.0
    variance = 0.0
    for t in TIERS.values():
        weight, n = t["size"]/total, t["audited"]
        phat = t["wrong"]/n
        p += weight*phat
        # unbiased Bernoulli sample variance and finite population correction
        variance += weight**2*(1-n/t["size"])*phat*(1-phat)/(n-1)
    half = norm.ppf(.975)*np.sqrt(variance)
    return float(p), (float(max(0,p-half)), float(min(1,p+half)))

def corrected_accuracy(observed=.82, error_rate=.15, classes=6):
    """Valid only if true labels are independently flipped uniformly to other labels."""
    denominator = 1-error_rate-error_rate/(classes-1)
    return (observed-error_rate/(classes-1))/denominator

def make_plots():
    plt.figure(figsize=(7,4))
    plt.bar(["Tier A", "Tier B"], [100*TIERS[x]["wrong"]/TIERS[x]["audited"] for x in ["A","B"]])
    plt.ylabel("Expert disagreement rate (%)"); plt.title("Tier annotation disagreement")
    plt.tight_layout(); plt.savefig(OUT/'tier_error_rates.png', dpi=160); plt.close()
    pair_counts = {}
    for source, target, count in CONFUSIONS:
        pair = " / ".join(sorted((source,target)))
        pair_counts[pair] = pair_counts.get(pair,0) + count
    labels, values = zip(*sorted(pair_counts.items(), key=lambda x:x[1], reverse=True))
    plt.figure(figsize=(9,4.6))
    plt.barh(labels[::-1], values[::-1]); plt.xlabel("Expert disagreements")
    plt.title("Most common label confusion pairs (both directions)")
    plt.tight_layout();plt.savefig(OUT/'confusion_pairs.png', dpi=160);plt.close()
    return pair_counts

def main():
    OUT.mkdir(exist_ok=True)
    n, disagreements = 400, 60
    noise = disagreements/n
    pooled_ci = wilson_interval(disagreements,n)
    strata_rate, strata_ci = stratified_interval()
    test = tier_test()
    pairs = make_plots()
    data = {
        "source": "https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/9",
        "data_type": "fictional scenario; aggregate-only analysis",
        "audit_noise_rate": noise, "audit_wilson_95_ci": pooled_ci,
        "population_weighted_noise_rate": strata_rate,
        "stratified_approx_95_ci": strata_ci,
        "tier_comparison": test,
        "most_common_bidirectional_pair": max(pairs,key=pairs.get),
        "most_common_pair_count": max(pairs.values()),
        "noise_model_accuracy_estimate": corrected_accuracy(),
        "accuracy_assumption": "15% independent uniform flips to one of five wrong classes",
    }
    (OUT/'results.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf8')
    report = f"""# HelpDeskNet-50K: Reproducible Milestone Report

## Source and limitations
Source: {data['source']}. The 50,000 tickets are fictional and no ticket-level records are supplied. All numeric findings below come from given aggregate values; we did **not** train on real tickets.

## Milestone 1 — Quantify noise
Expert audit disagreement: 60/400 = **{noise:.2%}**. Pooled 95% Wilson interval: **{pooled_ci[0]:.2%}–{pooled_ci[1]:.2%}**. Tier A: 12/180 = **{test['tier_a_rate']:.2%}**; Tier B: 48/220 = **{test['tier_b_rate']:.2%}**. Two-sided pooled two-proportion z-test: z={test['z_statistic']:.3f}, p={test['two_sided_p']:.6g}. Difference is statistically significant at alpha=0.05, conditional on representative independent sampling and expert labels being correct.

Because the crowd population comprises 20,000 Tier A and 25,000 Tier B tickets, the population-weighted disagreement estimate is **{strata_rate:.2%}** with approximate stratified 95% normal interval **{strata_ci[0]:.2%}–{strata_ci[1]:.2%}** (assumes independent simple random sampling within each tier). The pooled Wilson interval uses the audit mix rather than population weights.

## Milestone 2 — Characterize noise
Billing/Refund accounts for **26/60 = 43.33%** of all disagreements; Technical/Account Access accounts for **15/60 = 25%**. This concentrated pattern suggests nonuniform, category-dependent errors. Ambiguous category guidelines and less-experienced annotators are plausible hypotheses, not proven causes. Audit individual ticket texts, review decision rules and boundary cases, retrain workers, and adjudicate ambiguous tickets.

## Milestone 3 — Noisy accuracy ceiling
Under independent uniform flips among the five other classes, noisy accuracy A_noisy = (1-eta)*A_true + eta/(K-1)*(1-A_true). For eta=.15, K=6, A_noisy=.82, estimated A_true = **{corrected_accuracy():.2%}**. This estimate is **not** a measured accuracy and may be unreliable because error patterns are systematic and tier-specific; train/test label errors may also be correlated.

## Milestone 4 — Prioritize 2,000 expert reviews
Proposed allocation: 1,000 confident out-of-fold prediction/label disagreements; 500 high-risk known confusion cases; 300 uncertain or rare-class cases; 200 random control examples. Deduplicate selections and enforce a total budget of 2,000. Use cross-validation probabilities (not in-sample model predictions). Experts should be blinded to model recommendations when feasible. Evaluate precision@K (confirmed bad labels / reviewed labels), uplift versus random sampling, per-tier/per-class discovery, and downstream held-out expert-test macro F1 after corrections. This is a proposed design: no authentic ticket IDs can be selected without ticket-level records.

## Milestone 5 — Mitigate and evaluate
Compare cross-entropy baseline to label smoothing and a small-loss/Co-teaching method (tune only on validation data). Audit the remaining noise and track per-class macro F1, accuracy, precision, recall, and confusion matrices. Create a held-out, representative expert-labeled test set with independent annotations, arbitration and documented guidelines. Do not use the expert test set for training or hyperparameter tuning. The existing crowd-labeled test set is unreliable because it may mark correct predictions wrong and reward shared annotation errors.

## Demonstration
Run `python -m src.analysis` then inspect `outputs/results.json`, `outputs/tier_error_rates.png`, and `outputs/confusion_pairs.png`. Run `pytest -q` for reproducibility tests. No model-training performance or review yields are claimed.
"""
    (OUT/'milestone_report.md').write_text(report,encoding='utf8')
    print(report)
    print('Outputs written to:',OUT)

if __name__ == '__main__': main()
