"""MILESTONE 1 - noise rate + 95% CI, Tier A vs Tier B test. Uses ONLY the numbers from the task."""
import numpy as np
from scipy import stats

z = 1.96
nA, dA = 180, 12
nB, dB = 220, 48
n, d = nA + nB, dA + dB

def wilson(k, n, z=1.96):
    p = k / n
    centre = (p + z**2 / (2*n)) / (1 + z**2 / n)
    half = z * np.sqrt(p*(1-p)/n + z**2/(4*n**2)) / (1 + z**2/n)
    return centre - half, centre + half

# (a) simple overall estimate
p = d / n
se = np.sqrt(p*(1-p)/n)
print(f"Overall noise  p = {d}/{n} = {p:.3f}")
print(f"  Wald 95% CI   : {p-z*se:.3f} - {p+z*se:.3f}")
print(f"  Wilson 95% CI : {wilson(d,n)[0]:.3f} - {wilson(d,n)[1]:.3f}")

# (b) better: weight tiers by their real share of the crowd data (20k vs 25k)
wA, wB = 20000/45000, 25000/45000
pA, pB = dA/nA, dB/nB
p_str = wA*pA + wB*pB
se_str = np.sqrt(wA**2*pA*(1-pA)/nA + wB**2*pB*(1-pB)/nB)
print(f"\nStratified (weighted) estimate = {p_str:.3f}, 95% CI {p_str-z*se_str:.3f} - {p_str+z*se_str:.3f}")
print(f"  => about {p_str*45000:,.0f} of 45,000 crowd labels wrong (CI {(p_str-z*se_str)*45000:,.0f} - {(p_str+z*se_str)*45000:,.0f})")
print(f"  => whole dataset (experts assumed clean): {p_str*0.9:.3f}")

# (c) Tier A vs Tier B
print(f"\nTier A = {pA:.3f}   Tier B = {pB:.3f}   difference = {pB-pA:.3f}   ratio = {pB/pA:.2f}x")
p_pool = d / n
se_pool = np.sqrt(p_pool*(1-p_pool)*(1/nA + 1/nB))
zstat = (pB-pA)/se_pool
print(f"Two-proportion z-test: z = {zstat:.2f}, p = {2*(1-stats.norm.cdf(abs(zstat))):.2e}")
se_diff = np.sqrt(pA*(1-pA)/nA + pB*(1-pB)/nB)
print(f"95% CI of difference: {pB-pA-z*se_diff:.3f} - {pB-pA+z*se_diff:.3f}")
table = [[dA, nA-dA], [dB, nB-dB]]
chi2, pchi, _, _ = stats.chi2_contingency(table, correction=False)
odds, pf = stats.fisher_exact(table)
print(f"Chi-square = {chi2:.2f} (p={pchi:.2e}); Fisher exact p = {pf:.2e}, odds ratio = {odds:.2f}")
print("=> NOT plausibly chance." if pf < 0.001 else "=> could be chance")
