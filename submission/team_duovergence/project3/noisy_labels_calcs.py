"""Supporting calculations for HelpDeskNet-50K (Noisy Labels). Run: python noisy_labels_calcs.py"""
import numpy as np
from scipy import stats

rng = np.random.default_rng(0)


def wilson(k, n, z=1.959964):
    p = k / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return centre - half, centre + half


print("=== MILESTONE 1 ===")
kA, nA, kB, nB = 12, 180, 48, 220
k, n = kA + kB, nA + nB
p = k / n
lo, hi = wilson(k, n)
se = np.sqrt(p * (1 - p) / n)
print(f"Overall: {k}/{n} = {p:.3%}")
print(f"  Wald 95% CI   : ({p - 1.96 * se:.3%}, {p + 1.96 * se:.3%})")
print(f"  Wilson 95% CI : ({lo:.3%}, {hi:.3%})")
print(f"  Mislabeled among 45,000 crowd tickets: {p * 45000:,.0f} "
      f"(CI {lo * 45000:,.0f} to {hi * 45000:,.0f})")
print(f"  Across all 50,000 (expert 5,000 assumed clean): {p * 45000 / 50000:.2%} "
      f"(CI {lo * 45000 / 50000:.2%} to {hi * 45000 / 50000:.2%})")

wA, wB = 20000 / 45000, 25000 / 45000
pA, pB = kA / nA, kB / nB
strat = wA * pA + wB * pB
se_s = np.sqrt(wA**2 * pA * (1 - pA) / nA + wB**2 * pB * (1 - pB) / nB)
print(f"Stratified (weights 20k/25k): {strat:.3%}, 95% CI ({strat - 1.96 * se_s:.3%}, {strat + 1.96 * se_s:.3%})")

loA, hiA = wilson(kA, nA)
loB, hiB = wilson(kB, nB)
print(f"Tier A: {kA}/{nA} = {pA:.2%}, Wilson CI ({loA:.2%}, {hiA:.2%})")
print(f"Tier B: {kB}/{nB} = {pB:.2%}, Wilson CI ({loB:.2%}, {hiB:.2%})")

diff = pB - pA
se_d = np.sqrt(pA * (1 - pA) / nA + pB * (1 - pB) / nB)
print(f"Difference B - A = {diff:.2%}, unpooled 95% CI ({diff - 1.96 * se_d:.2%}, {diff + 1.96 * se_d:.2%})")
pp = k / n
se_pool = np.sqrt(pp * (1 - pp) * (1 / nA + 1 / nB))
z = diff / se_pool
print(f"Two-proportion z-test (pooled): SE={se_pool:.5f}, z={z:.2f}, two-sided p={2 * stats.norm.sf(abs(z)):.2e}")
chi2, pchi, _, _ = stats.chi2_contingency([[kA, nA - kA], [kB, nB - kB]], correction=False)
print(f"Chi-square (no correction): chi2={chi2:.2f}, p={pchi:.2e}")
odds, pf = stats.fisher_exact([[kB, nB - kB], [kA, nA - kA]])
print(f"Fisher exact: odds ratio={odds:.2f}, p={pf:.2e}")
print(f"Risk ratio B/A = {pB / pA:.2f}")

print("\n=== MILESTONE 2 ===")
cells = {("Billing", "Refund"): 14, ("Refund", "Billing"): 12, ("Technical", "Account Access"): 9,
         ("Shipping", "Other"): 8, ("Account Access", "Technical"): 6, ("Technical", "Other"): 5,
         ("Other", "Shipping"): 3, ("Billing", "Other"): 3}
classes = ["Billing", "Refund", "Technical", "Account Access", "Shipping", "Other"]
share = np.array([.30, .15, .25, .15, .10, .05])
print("Nonzero cells:", len(cells), "of 30 possible off-diagonal cells")
top3 = sum(sorted(cells.values(), reverse=True)[:3])
print(f"Top 3 cells = {top3}/60 = {top3 / 60:.0%}")
pair = {}
for (a, b), c in cells.items():
    pair[frozenset((a, b))] = pair.get(frozenset((a, b)), 0) + c
for pr, c in sorted(pair.items(), key=lambda x: -x[1]):
    print(f"  pair {sorted(pr)}: {c} ({c / 60:.0%})")
to_other = sum(c for (a, b), c in cells.items() if b == "Other")
from_other = sum(c for (a, b), c in cells.items() if a == "Other")
print(f"Crowd said X, expert said Other: {to_other};  crowd said Other, expert said X: {from_other}")

# Per crowd-label error rate, assuming audit mirrors class mix
print("Approx error rate per crowd label (assuming audit mirrors class shares):")
for i, c in enumerate(classes):
    errs = sum(v for (a, b), v in cells.items() if a == c)
    print(f"  {c:15s} {errs:2d} / {400 * share[i]:5.0f} = {errs / (400 * share[i]):.0%}")

# Monte Carlo null: 60 errors, source ~ class share (same noise rate per class), target uniform among 5 others
obs_distinct = len(cells)
obs_top3 = top3
sims = 20000
d_cnt = t_cnt = 0
for _ in range(sims):
    src = rng.choice(6, size=60, p=share)
    tgt = np.array([rng.choice([j for j in range(6) if j != s]) for s in src])
    code = src * 6 + tgt
    _, counts = np.unique(code, return_counts=True)
    d_cnt += len(counts) <= obs_distinct
    t_cnt += np.sort(counts)[::-1][:3].sum() >= obs_top3
print(f"Monte Carlo null (uniform flips, {sims} runs): "
      f"P(distinct cells <= {obs_distinct}) = {d_cnt / sims:.4f}; P(top3 >= {obs_top3}) = {t_cnt / sims:.4f}")
src = rng.choice(6, size=60, p=share)
print("(null typically has ~", int(np.mean([len(np.unique(rng.choice(6, size=60, p=share) * 6 + rng.integers(0, 5, 60))) for _ in range(2000)])), "distinct cells)")

print("\n=== MILESTONE 3 ===")
obs, eta = 0.82, 0.15
A = (obs - eta / 5) / (1 - eta - eta / 5)
print(f"obs = A(1-eta) + (1-A)(eta/5)  ->  A = {A:.4f}  (naive shortcut obs/(1-eta) = {obs / (1 - eta):.4f})")
print(f"Perfect model scores 1-eta = {1 - eta:.0%} on the noisy test set")
for e in [0.118, 0.135, 0.15, 0.17, 0.188]:
    Ae = (obs - e / 5) / (1 - e - e / 5)
    print(f"  eta={e:.3f}: implied true acc = {Ae:.3f}  (perfect-model ceiling {1 - e:.3f})")
print(f"Assumption-free bound |A - observed| <= eta: A in [{obs - eta:.2f}, {min(1, obs + eta):.2f}]")

print("\n=== MILESTONE 4/5: sizing ===")
for n_ in [1000, 1500, 2000, 3000]:
    for acc in [0.90, 0.95]:
        print(f"  gold test n={n_}, acc={acc}: 95% half-width = {1.96 * np.sqrt(acc * (1 - acc) / n_):.2%}")
print("Review yield: random 2000 finds ~", round(0.15 * 2000), "bad labels;",
      "selector at 50% precision finds", 1000, "; at 30% finds", 600)
