"""
verify_calculations.py
Re-computes every number used in noisy-labels-answer.md (HelpDeskNet-50K, issue #9).
Run:  python verify_calculations.py
Needs: Python 3.8+  (matplotlib optional, only for the two charts)
"""
import math
import os
import random
from statistics import NormalDist

N = NormalDist()
Z = N.inv_cdf(0.975)  # 1.96


def wilson(k, n, z=Z):
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return c - h, c + h


print("=" * 60)
print("MILESTONE 1: noise rate")
print("=" * 60)
n, k = 400, 60
p = k / n
se = math.sqrt(p * (1 - p) / n)
print(f"p = {p:.4f}  SE = {se:.5f}  margin = {Z*se:.5f}")
print(f"Wald 95% CI   : {100*(p-Z*se):.2f}% to {100*(p+Z*se):.2f}%")
lo, hi = wilson(k, n)
print(f"Wilson 95% CI : {100*lo:.2f}% to {100*hi:.2f}%")

nA, kA, nB, kB = 180, 12, 220, 48
pA, pB = kA / nA, kB / nB
print(f"\nTier A: {kA}/{nA} = {100*pA:.2f}%  Wilson CI {[round(100*x,1) for x in wilson(kA,nA)]}")
print(f"Tier B: {kB}/{nB} = {100*pB:.2f}%  Wilson CI {[round(100*x,1) for x in wilson(kB,nB)]}")

# stratified (weight by how many tickets each tier labeled)
wA, wB = 20000 / 45000, 25000 / 45000
p_strat = wA * pA + wB * pB
var = wA**2 * pA * (1 - pA) / nA + wB**2 * pB * (1 - pB) / nB
se_s = math.sqrt(var)
print(f"\nStratified noise rate (weights {wA:.3f}/{wB:.3f}): {100*p_strat:.2f}%  SE {se_s:.5f}")
print(f"Stratified 95% CI: {100*(p_strat-Z*se_s):.2f}% to {100*(p_strat+Z*se_s):.2f}%")
print(f"Whole dataset (45,000 crowd + 5,000 expert assumed clean): {100*p_strat*0.9:.2f}%")

# two-proportion z-test
diff = pB - pA
p_pool = (kA + kB) / (nA + nB)
se_pool = math.sqrt(p_pool * (1 - p_pool) * (1 / nA + 1 / nB))
z = diff / se_pool
pval = 2 * (1 - N.cdf(abs(z)))
se_unp = math.sqrt(pA * (1 - pA) / nA + pB * (1 - pB) / nB)
print(f"\nDifference B-A = {100*diff:.2f} points; pooled p = {p_pool:.4f}; SE_pooled = {se_pool:.5f}")
print(f"z = {z:.3f}; two-sided p = {pval:.2e}; chi-square = {z*z:.2f}")
print(f"95% CI for difference (unpooled SE {se_unp:.5f}): {100*(diff-Z*se_unp):.2f} to {100*(diff+Z*se_unp):.2f} points")
print(f"Risk ratio B/A = {pB/pA:.2f}")
exp = [nA * p_pool, nA * (1 - p_pool), nB * p_pool, nB * (1 - p_pool)]
print("Expected counts under 'no difference':", [round(e, 1) for e in exp])
try:
    from scipy.stats import fisher_exact
    odds, pf = fisher_exact([[kA, nA - kA], [kB, nB - kB]])
    print(f"Fisher exact p = {pf:.2e}, odds ratio = {odds:.2f}")
except Exception:
    print("(scipy not installed - Fisher exact skipped)")

print("\n" + "=" * 60)
print("MILESTONE 2: pattern in disagreements")
print("=" * 60)
cells = {
    ("Billing", "Refund"): 14,
    ("Refund", "Billing"): 12,
    ("Technical", "Account Access"): 9,
    ("Shipping", "Other"): 8,
    ("Account Access", "Technical"): 6,
    ("Technical", "Other"): 5,
    ("Other", "Shipping"): 3,
    ("Billing", "Other"): 3,
}
print("total disagreements:", sum(cells.values()))
pairs = {
    "Billing <-> Refund": [("Billing", "Refund"), ("Refund", "Billing")],
    "Technical <-> Account Access": [("Technical", "Account Access"), ("Account Access", "Technical")],
    "Shipping <-> Other": [("Shipping", "Other"), ("Other", "Shipping")],
}
in_pairs = 0
for name, keys in pairs.items():
    c = sum(cells[x] for x in keys)
    in_pairs += c
    print(f"{name}: {c} ({100*c/60:.1f}%)")
print(f"3 pairs together: {in_pairs}/60 = {100*in_pairs/60:.1f}%")
print(f"Technical->Other + Billing->Other: {cells[('Technical','Other')]+cells[('Billing','Other')]}")
print(f"non-empty cells: {len(cells)} of 30 possible off-diagonal cells")

classes = ["Billing", "Refund", "Technical", "Account Access", "Shipping", "Other"]
expert_counts = {c: 0 for c in classes}
for (crowd, expert), v in cells.items():
    expert_counts[expert] += v
print("errors by expert (true) class:", expert_counts)

pair_set = set(x for keys in pairs.values() for x in keys)
exp_in_pairs = 0.0
for (crowd, expert) in pair_set:
    exp_in_pairs += expert_counts[expert] / 5
print(f"If wrong labels were uniform over the 5 other classes, expected in 3 pairs: {exp_in_pairs:.1f} of 60 ({100*exp_in_pairs/60:.0f}%)")
random.seed(7)
trials, hits_ge = 100000, 0
for _ in range(trials):
    h = 0
    for expert, cnt in expert_counts.items():
        for _i in range(cnt):
            crowd = random.choice([c for c in classes if c != expert])
            if (crowd, expert) in pair_set:
                h += 1
    if h >= in_pairs:
        hits_ge += 1
print(f"Simulation: P(>= {in_pairs} of 60 in the 3 pairs by chance) = {hits_ge}/{trials}")

print("\n" + "=" * 60)
print("MILESTONE 3: accuracy ceiling")
print("=" * 60)
K = 6


def true_acc(A, eta):
    return (A - eta / (K - 1)) / (1 - eta - eta / (K - 1))


def noisy_acc(T, eta):
    return T * (1 - eta) + (1 - T) * eta / (K - 1)


A = 0.82
print(f"eta = 15%: true accuracy = {100*true_acc(A,0.15):.2f}%  (check: {100*noisy_acc(true_acc(A,0.15),0.15):.2f}%)")
print(f"Quick version 0.82/0.85 = {100*0.82/0.85:.2f}%")
print(f"Perfect model would score {100*(1-0.15):.0f}% on the noisy test set")
for eta in (0.115, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.185):
    print(f"  eta = {100*eta:5.1f}% -> true accuracy = {100*true_acc(A,eta):6.2f}%")
print("noise level at which a perfect model scores exactly 82%: eta = 18%")
# model copies the crowd's systematic mistake: share of its errors that coincide with noisy label
for share in (0.03, 0.2, 0.5):
    # model wrong w.p. 1-T; when wrong its prediction equals noisy label w.p. share
    # A = T*0.85 + (1-T)*share  -> T = (A - share)/(0.85 - share)
    T = (A - share) / (0.85 - share)
    print(f"  if model's wrong answers match the noisy label {100*share:.0f}% of the time -> true accuracy {100*T:.2f}%")

print("\n" + "=" * 60)
print("MILESTONE 4 / 5: review budget and test set size")
print("=" * 60)
print(f"2,000 random reviews would find about {2000*0.15:.0f} wrong labels (15%)")
print(f"2,000 reviews are {100*2000/45000:.1f}% of the 45,000 crowd tickets")
print(f"Tier B has {kB/nB/ (k/n):.2f}x the overall noise rate; Tier A has {kA/nA/(k/n):.2f}x")
for hit in (0.3, 0.4, 0.5, 0.6):
    print(f"  precision {int(hit*100)}% -> {int(2000*hit)} errors fixed ({hit/0.15:.1f}x better than random)")
for acc, margin in ((0.95, 0.02), (0.95, 0.01), (0.90, 0.02), (0.90, 0.01)):
    need = Z**2 * acc * (1 - acc) / margin**2
    print(f"  test set size for accuracy ~{int(acc*100)}% with +/-{int(margin*100)} point margin: {math.ceil(need)}")
print(f"  with 5,000 expert-labeled tickets at 95% accuracy: +/-{100*Z*math.sqrt(.95*.05/5000):.2f} points")

# ---------------- charts ----------------
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    os.makedirs("figures", exist_ok=True)

    fig, ax = plt.subplots(figsize=(6, 4))
    names = ["Tier A\n(experienced)", "Tier B\n(newer)", "Overall\n(audit)"]
    vals = [pA, pB, p]
    cis = [wilson(kA, nA), wilson(kB, nB), wilson(k, n)]
    errs = [[v - c[0] for v, c in zip(vals, cis)], [c[1] - v for v, c in zip(vals, cis)]]
    ax.bar(names, [100 * v for v in vals], yerr=[[100 * e for e in errs[0]], [100 * e for e in errs[1]]],
           capsize=6, color=["#4C9F70", "#D9822B", "#5B7DB1"])
    for i, v in enumerate(vals):
        ax.text(i, 100 * v + 1.2 + 100 * errs[1][i], f"{100*v:.1f}%", ha="center", fontsize=10)
    ax.set_ylabel("Labels that experts disagreed with (%)")
    ax.set_title("Crowd label error rate with 95% confidence intervals")
    ax.set_ylim(0, 35)
    fig.tight_layout()
    fig.savefig("figures/tier_error_rates.png", dpi=150)
    plt.close(fig)

    import numpy as np
    M = np.zeros((6, 6))
    for (crowd, expert), v in cells.items():
        M[classes.index(crowd), classes.index(expert)] = v
    fig, ax = plt.subplots(figsize=(6.5, 5.5))
    im = ax.imshow(M, cmap="Oranges")
    ax.set_xticks(range(6)); ax.set_yticks(range(6))
    ax.set_xticklabels(classes, rotation=40, ha="right"); ax.set_yticklabels(classes)
    ax.set_xlabel("Expert label (treated as truth)"); ax.set_ylabel("Crowd label")
    for i in range(6):
        for j in range(6):
            if M[i, j] > 0:
                ax.text(j, i, int(M[i, j]), ha="center", va="center", fontsize=11)
    ax.set_title("Where crowd labels disagree with experts (60 cases)")
    fig.colorbar(im, ax=ax, shrink=0.8)
    fig.tight_layout()
    fig.savefig("figures/disagreement_heatmap.png", dpi=150)
    plt.close(fig)
    print("\nCharts saved in ./figures/")
except Exception as e:
    print("\n(charts skipped:", e, ")")
