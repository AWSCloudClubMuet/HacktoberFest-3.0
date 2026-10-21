#!/usr/bin/env python3
"""
HelpDeskNet-50K  --  Noisy-label analysis (Milestones 1-5)

Usage:  python helpdesknet_noise_analysis.py [path/to/helpdesknet50k_dummy.csv] [outdir]

Needs: numpy, pandas, scipy, scikit-learn, matplotlib.  No GPU / torch required.

IMPORTANT (honesty note): the CSV is SYNTHETIC. Ticket text comes from 100 templates, each
tied to ONE class, so text is far easier than real tickets. Columns true_label / is_noisy /
noise_pattern are used ONLY to score detectors and simulate "expert review" -- never as features.
"""
import sys, json, os
import numpy as np, pandas as pd
from scipy import stats, optimize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, average_precision_score
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

CSV = sys.argv[1] if len(sys.argv) > 1 else "helpdesknet50k_dummy.csv"
OUT = sys.argv[2] if len(sys.argv) > 2 else "."
os.makedirs(OUT, exist_ok=True)
CLASSES = ["Billing", "Refund", "Technical", "Account Access", "Shipping", "Other"]
K = len(CLASSES); C2I = {c: i for i, c in enumerate(CLASSES)}
SHARE = dict(zip(CLASSES, [.30, .15, .25, .15, .10, .05]))
R = {}                                    # results dict -> results.json
def hdr(s): print("\n" + "=" * 78 + "\n" + s + "\n" + "=" * 78)

# --------------------------------------------------------------------------------------
# MILESTONE 1 - quantify label noise (pure statistics, uses only the numbers in the brief)
# --------------------------------------------------------------------------------------
hdr("MILESTONE 1 - noise rate and Tier A vs Tier B")
z = stats.norm.ppf(0.975)
def wilson(k, n):
    p = k / n; d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return c - h, c + h
def clopper(k, n):
    return stats.beta.ppf(.025, k, n - k + 1), stats.beta.ppf(.975, k + 1, n - k)

kA, nA, kB, nB = 12, 180, 48, 220
k, n = kA + kB, nA + nB
p = k / n
print(f"Pooled disagreement: {k}/{n} = {p:.4f}")
print(f"  Wald (normal)  95% CI: {p - z*np.sqrt(p*(1-p)/n):.4f} - {p + z*np.sqrt(p*(1-p)/n):.4f}")
print(f"  Wilson         95% CI: {wilson(k,n)[0]:.4f} - {wilson(k,n)[1]:.4f}")
print(f"  Clopper-Pearson 95% CI: {clopper(k,n)[0]:.4f} - {clopper(k,n)[1]:.4f}")
NA, NB = 20000, 25000; NC = NA + NB
wA, wB = NA / NC, NB / NC
p_st = wA * kA / nA + wB * kB / nB
se_st = np.sqrt(wA**2 * (kA/nA) * (1-kA/nA) / nA + wB**2 * (kB/nB) * (1-kB/nB) / nB)
print(f"Post-stratified (true tier mix 20k/25k): {p_st:.4f}  95% CI {p_st-z*se_st:.4f} - {p_st+z*se_st:.4f}")
lo, hi = wilson(k, n)
print(f"=> implied noisy tickets among 45,000 crowd labels: ~{p*NC:,.0f}  (CI {lo*NC:,.0f} - {hi*NC:,.0f})")
print(f"=> whole 50k dataset (if expert labels are clean): ~{p*NC/50000:.1%}")
e = 0.02
print(f"Sensitivity: if experts themselves err {e:.0%}, crowd noise ~ (D-e)/(1-2e) = {(p-e)/(1-2*e):.3f}")
R["m1_pooled"] = dict(k=k, n=n, rate=p, wilson=wilson(k, n), poststrat=p_st)

pA, pB = kA / nA, kB / nB
lA, uA = wilson(kA, nA); lB, uB = wilson(kB, nB)
print(f"\nTier A: {kA}/{nA} = {pA:.4f}  Wilson {lA:.4f}-{uA:.4f}")
print(f"Tier B: {kB}/{nB} = {pB:.4f}  Wilson {lB:.4f}-{uB:.4f}")
d = pB - pA
nl = d - np.sqrt((pB - lB)**2 + (uA - pA)**2); nu = d + np.sqrt((uB - pB)**2 + (pA - lA)**2)
print(f"Difference B-A = {d:.4f}; Newcombe 95% CI {nl:.4f} - {nu:.4f}")
pp = (kA + kB) / (nA + nB); zst = d / np.sqrt(pp * (1 - pp) * (1/nA + 1/nB))
print(f"Two-proportion z-test: z = {zst:.3f}, two-sided p = {2*stats.norm.sf(abs(zst)):.2e}")
tab = [[kB, nB - kB], [kA, nA - kA]]
print(f"Fisher exact: p = {stats.fisher_exact(tab)[1]:.2e}   |   chi2 (no continuity corr.): "
      f"{stats.chi2_contingency(tab, correction=False)[0]:.2f}, p = {stats.chi2_contingency(tab, correction=False)[1]:.2e}")
rr = pB / pA; se_lrr = np.sqrt(1/kB - 1/nB + 1/kA - 1/nA)
print(f"Risk ratio B/A = {rr:.2f}  (95% CI {np.exp(np.log(rr)-z*se_lrr):.2f} - {np.exp(np.log(rr)+z*se_lrr):.2f})")
rng = np.random.RandomState(0)
th_a = rng.beta(1 + kA, 1 + nA - kA, 400000); th_b = rng.beta(1 + kB, 1 + nB - kB, 400000)
print(f"Bayesian (flat Beta priors): P(theta_B > theta_A) = {(th_b > th_a).mean():.6f}")
# Permutation sanity check: shuffle tier labels over the 400 audited tickets
y400 = np.r_[np.ones(kA), np.zeros(nA - kA), np.ones(kB), np.zeros(nB - kB)]
obs_d = d; cnt = 0
for _ in range(100000):
    perm = rng.permutation(y400)
    cnt += abs(perm[nA:].mean() - perm[:nA].mean()) >= obs_d - 1e-12
print(f"Permutation test (100k shuffles): p ~ {(cnt+1)/100001:.5f}")
R["m1_tier"] = dict(pA=pA, pB=pB, diff=d, z=zst, p=2 * stats.norm.sf(abs(zst)), rr=rr)

# --------------------------------------------------------------------------------------
# MILESTONE 2 - characterise the noise
# --------------------------------------------------------------------------------------
hdr("MILESTONE 2 - is the noise random or systematic?")
# Brief's table is  CROWD label -> EXPERT label.  Expert label = the true class.  M[crowd, expert].
TR = {("Billing", "Refund"): 14, ("Refund", "Billing"): 12, ("Technical", "Account Access"): 9,
      ("Shipping", "Other"): 8, ("Account Access", "Technical"): 6, ("Technical", "Other"): 5,
      ("Other", "Shipping"): 3, ("Billing", "Other"): 3}
M = np.zeros((K, K), int)
for (crowd, expert), c in TR.items(): M[C2I[crowd], C2I[expert]] = c
tot = M.sum()
pairs = {}
for (a_, b_), c in TR.items():
    key = tuple(sorted((a_, b_))); pairs[key] = pairs.get(key, 0) + c
print("Unordered confusable pairs (both directions):")
for key, c in sorted(pairs.items(), key=lambda kv: -kv[1]):
    print(f"  {key[0]:>15} <-> {key[1]:<15} {c:>3}  ({c/tot:.0%})")
top3 = sum(sorted(pairs.values(), reverse=True)[:3])
print(f"Top-3 pairs hold {top3}/{tot} = {top3/tot:.0%} of errors; non-empty cells: {(M>0).sum()} of {K*(K-1)} off-diagonal cells")
by_true = M.sum(0); by_crowd = M.sum(1)
print("Errors by TRUE (expert) class :", {c: int(by_true[i]) for i, c in enumerate(CLASSES)})
print("Errors by CROWD label         :", {c: int(by_crowd[i]) for i, c in enumerate(CLASSES)})
print(f"True-'Other' tickets that the crowd force-fitted into a specific class: {by_true[C2I['Other']]}/{tot} = {by_true[C2I['Other']]/tot:.0%} of errors (Other is ~5% of data)")
print(f"Crowd used 'Other' wrongly only {by_crowd[C2I['Other']]} times -> the crowd UNDER-uses the catch-all class")
# Null model 'uniform random flips': true class ~ class share, crowd label uniform over the other 5 classes
E = np.zeros((K, K))
for j, cj in enumerate(CLASSES):
    for i in range(K):
        if i != j: E[i, j] = tot * SHARE[cj] / (K - 1)
mask = ~np.eye(K, dtype=bool)
chi = ((M[mask] - E[mask]) ** 2 / E[mask]).sum()
rng = np.random.RandomState(1); src = np.array([SHARE[c] for c in CLASSES]); sims = []
for _ in range(20000):
    tc = rng.choice(K, tot, p=src); cl = (tc + rng.randint(1, K, tot)) % K
    Ms = np.zeros((K, K)); np.add.at(Ms, (cl, tc), 1)
    sims.append(((Ms[mask] - E[mask]) ** 2 / E[mask]).sum())
print(f"Chi-square vs 'uniform random flip' null = {chi:.1f}; Monte-Carlo p = {(np.sum(np.array(sims) >= chi)+1)/20001:.5f}")
print("Biggest cells, observed vs expected under uniform flips (crowd -> expert):")
for (a_, b_), c in sorted(TR.items(), key=lambda kv: -kv[1])[:5]:
    print(f"  {a_} -> {b_}: observed {c}, expected {E[C2I[a_], C2I[b_]]:.1f}")
print("\nError rate per TRUE class (ASSUMES the 400-ticket audit mirrors the stated class shares: n_i = 400*share):")
for i, c in enumerate(CLASSES):
    ni = 400 * SHARE[c]; print(f"  {c:>15}: {int(by_true[i]):>2}/{ni:>4.0f} = {by_true[i]/ni:.0%}")
print("Direction asymmetry inside each confusable pair (per-true-class rate):")
for x_, y_ in [("Refund", "Billing"), ("Account Access", "Technical"), ("Other", "Shipping")]:
    r1 = M[C2I[y_], C2I[x_]] / (400 * SHARE[x_]); r2 = M[C2I[x_], C2I[y_]] / (400 * SHARE[y_])
    print(f"  true {x_:>14} labelled {y_:<10}: {M[C2I[y_], C2I[x_]]:>2}/{400*SHARE[x_]:>3.0f} = {r1:.0%}   vs   true {y_:<10} labelled {x_:<14}: {M[C2I[x_], C2I[y_]]:>2}/{400*SHARE[y_]:>3.0f} = {r2:.0%}")
print("Sensitivity: how many audited true-Other tickets would make Other's error rate 30%?  16/0.30 =", round(by_true[C2I['Other']] / 0.30), "(vs ~20 if Other = 5%)")
R["m2"] = dict(top3_share=top3 / tot, true_other_errors=int(by_true[C2I['Other']]), chi2=float(chi))

fig, ax = plt.subplots(figsize=(6.6, 5.4))
ax.imshow(np.where(mask, M, np.nan), cmap="Reds", vmin=0, vmax=16)
ax.set_xticks(range(K)); ax.set_xticklabels(CLASSES, rotation=35, ha="right"); ax.set_yticks(range(K)); ax.set_yticklabels(CLASSES)
ax.set_xlabel("Expert label (= true class)"); ax.set_ylabel("Crowd label")
for i in range(K):
    for j in range(K):
        if i == j: ax.text(j, i, "-", ha="center", va="center", color="#999")
        else: ax.text(j, i, int(M[i, j]), ha="center", va="center", color="white" if M[i, j] > 8 else "black")
ax.set_title("60 audit disagreements: crowd label vs expert label\n(only 8 of 30 off-diagonal cells are non-zero)", fontsize=10)
plt.tight_layout(); plt.savefig(f"{OUT}/fig1_transition_matrix.png", dpi=150); plt.close()

# --------------------------------------------------------------------------------------
# MILESTONE 3 - accuracy ceiling under naive uniform noise
# --------------------------------------------------------------------------------------
hdr("MILESTONE 3 - what does 82% on a 15%-noisy test set imply?")
def true_acc(obs, eta, c=None):
    """obs = a*(1-eta) + (1-a)*c ; c = P(wrong prediction coincides with the noisy label).
       Uniform flips to one of the other 5 classes -> c = eta/5."""
    c = eta / 5 if c is None else c
    return (obs - c) / ((1 - eta) - c)
obs, eta = 0.82, 0.15
print(f"Uniform flips: obs = a(1-eta) + (1-a)(eta/5)  ->  a = (obs - eta/5)/(1 - eta - eta/5) = {true_acc(obs, eta):.4f}")
print(f"Quick approx ignoring lucky matches: {obs/(1-eta):.4f}.   Ceiling for a PERFECT model on this test set: {1-eta:.0%}")
print("Sensitivity of 'true accuracy' to the assumed noise rate (uniform flips):")
for et, lab in [(wilson(k, n)[0], "CI low"), (0.15, "point"), (wilson(k, n)[1], "CI high")]:
    a = true_acc(obs, et)
    print(f"  eta = {et:.3f} ({lab:>6}): a = {a:.3f}" + ("  (>100% => impossible: the data/assumption are inconsistent)" if a > 1 else ""))
print("Sensitivity to c, the chance a wrong prediction matches the noisy label (eta = .15):")
for c in [0.03, 0.06, 0.10, 0.20, 0.40]:
    print(f"  c = {c:.2f}: a = {true_acc(obs, 0.15, c):.3f}")
R["m3"] = dict(point=true_acc(obs, .15), low_eta=true_acc(obs, wilson(k, n)[0]))
etas = np.linspace(.05, .19, 60)
fig, ax = plt.subplots(figsize=(6.4, 4.2))
for c, lab, ls in [(None, "uniform flips (c = eta/5)", "-"), (0.10, "systematic flips (c = 0.10)", "--"), (0.30, "systematic flips (c = 0.30)", ":")]:
    ax.plot(etas * 100, [min(true_acc(obs, e_, c if c is not None else None), 1.05) * 100 for e_ in etas], ls, label=lab)
ax.axvspan(wilson(k, n)[0] * 100, wilson(k, n)[1] * 100, color="#ddd", alpha=.6, label="95% CI of noise rate")
ax.axhline(100, color="k", lw=.6); ax.set_ylim(88, 106)
ax.set_xlabel("assumed test-label noise rate (%)"); ax.set_ylabel("implied TRUE accuracy (%)")
ax.set_title("Observed 82% -> implied true accuracy depends heavily on noise assumptions", fontsize=9)
ax.legend(fontsize=7.5); plt.tight_layout(); plt.savefig(f"{OUT}/fig2_true_accuracy_sensitivity.png", dpi=150); plt.close()

# --------------------------------------------------------------------------------------
# Data for the simulation milestones (M4/M5)
# --------------------------------------------------------------------------------------
hdr("Loading synthetic data")
import scipy.sparse as sp
from sklearn.preprocessing import normalize
df = pd.read_csv(CSV)
df["y"] = df.observed_label.map(C2I).astype(int)           # label available in "production"
df["t"] = df.true_label.map(C2I).astype(int)               # ORACLE - evaluation / simulated expert only
core = df.text.str.split(r"(?<=[.!?])\s+", n=1, regex=True).str[0]
df["grp"] = pd.factorize(core.str.replace(r"\d+", "#", regex=True))[0]    # ticket "template" id
is_crowd = (df.label_source == "crowd").values
print(f"{len(df):,} tickets, {df.grp.nunique()} distinct phrasing templates, crowd noise {df[is_crowd].is_noisy.mean():.3f}")
X_full = TfidfVectorizer(ngram_range=(1, 2), min_df=5, sublinear_tf=True).fit_transform(df.text).tocsr().astype(np.float64)
print("TF-IDF matrix:", X_full.shape)
tr_mask = (df.split == "train").values; te_mask = (df.split == "test").values
Y, Tr = df.y.values, df.t.values

def degrade(Xm, keep, seed=0):
    """DIFFICULTY DIAL: randomly drop a fraction (1-keep) of each ticket's tf-idf features, then re-normalise.
       Simulates less informative / more ambiguous text. Applied identically to every method; noise stays instance-independent."""
    if keep >= 1: return Xm
    rs = np.random.RandomState(seed); c = Xm.tocoo(); m = rs.rand(len(c.data)) < keep
    return normalize(sp.csr_matrix((c.data[m], (c.row[m], c.col[m])), shape=Xm.shape)).tocsr()

def oof_probs(Xm, idx, mode, seed=0, nf=5, C=10.0):
    """Out-of-fold probabilities for CROWD rows in idx (expert rows are always available for training).
       mode='random': folds over tickets.  mode='group': folds over wording templates (unseen wording at scoring time)."""
    sub = df.iloc[idx]; Xs = Xm[idx]; ys = sub.y.values; cr = is_crowd[idx]; g = sub.grp.values
    rs = np.random.RandomState(seed)
    if mode == "random": fold = np.where(cr, rs.randint(0, nf, len(sub)), -1)
    else:
        ug = rs.permutation(np.unique(g)); gm = {u: i % nf for i, u in enumerate(ug)}; fold = np.array([gm[u] for u in g])
    P = np.full((len(sub), K), np.nan)
    for f in range(nf):
        te = cr & (fold == f); tr = fold != f
        P[te] = LogisticRegression(C=C, max_iter=300).fit(Xs[tr], ys[tr]).predict_proba(Xs[te])
    return P

conf_pairs = [("Billing", "Refund"), ("Technical", "Account Access"), ("Shipping", "Other"), ("Technical", "Other"), ("Billing", "Other")]
pair_ok = np.zeros((K, K), bool)                      # confusable pairs learned from the audit table (Milestone 2)
for a_, b_ in conf_pairs: pair_ok[C2I[a_], C2I[b_]] = pair_ok[C2I[b_], C2I[a_]] = True

def features(P, sub):
    y = sub.y.values; n_ = len(sub); py = np.clip(P[np.arange(n_), y], 1e-4, 1 - 1e-4)
    Po = P.copy(); Po[np.arange(n_), y] = -1; kmax = Po.argmax(1)
    q = 1 - py
    return dict(self_conf=q, margin=Po.max(1) - py, tierB=(sub.worker_tier == "Tier B").values.astype(float),
                pair=pair_ok[y, kmax].astype(float), logit_q=np.log(q / (1 - q)))
def cl_flags(P, sub):
    """Confident-learning style flag (Northcutt et al.): label j is suspect if the model is 'confident enough'
       (>= that class's mean self-confidence) in some OTHER class."""
    y = sub.y.values; t = np.array([P[y == j, j].mean() for j in range(K)])
    ok = P >= t[None, :]; ok[np.arange(len(y)), y] = False
    return ok.any(1)

# --------------------------------------------------------------------------------------
# MILESTONE 4 - which 2,000 tickets should experts review?
# --------------------------------------------------------------------------------------
hdr("MILESTONE 4 - ticket-selection strategies (detectors never see true_label / is_noisy)")
BUDGET = 2000
def fit_ce_sk(Xm, y, idx): return LogisticRegression(C=10, max_iter=300).fit(Xm[idx], y[idx])

# Calibrate the difficulty dial so that a model trained on the noisy labels plateaus near the brief's 82% on the noisy test set.
best = None
for keep in [1.0, 0.4, 0.3, 0.25, 0.22, 0.2, 0.18, 0.15]:
    Xd = degrade(X_full, keep, 0); acc = fit_ce_sk(Xd, Y, tr_mask).score(Xd[te_mask], Y[te_mask])
    print(f"  dial keep={keep:<5} -> baseline accuracy on NOISY test = {acc:.3f}")
    if best is None or abs(acc - 0.82) < abs(best[1] - 0.82): best = (keep, acc)
KEEP = best[0]; print(f"=> calibrated keep = {KEEP} (baseline noisy-test accuracy {best[1]:.3f}, brief says 0.82)")
R["calibrated_keep"] = KEEP

pool_mask = (is_crowd & tr_mask & (~df.audit_sample.values)); aud_mask = df.audit_sample.values; noisy = df.is_noisy.values
print(f"Review pool: {pool_mask.sum():,} crowd-labelled train tickets, {noisy[pool_mask].sum():,} truly noisy ({noisy[pool_mask].mean():.1%}). "
      f"With {BUDGET:,} reviews even a PERFECT detector fixes at most {BUDGET/noisy[pool_mask].sum():.0%} of them.")

regimes = [("full text (easy)", X_full, "random"), (f"calibrated dial (keep={KEEP})", degrade(X_full, KEEP, 0), "random"),
           ("harder dial (keep=0.10)", degrade(X_full, 0.10, 0), "random"), ("unseen wording (grouped CV)", X_full, "group")]
all_idx = np.arange(len(df)); curves, rows4, det_cache = {}, [], {}
STRATS = ["random", "Tier-B first (no model)", "self-confidence", "margin", "confident-learning + margin", "combined (model+tier+pair rule)"]
for rname, Xm, mode in regimes:
    P = oof_probs(Xm, all_idx, mode); det_cache[rname] = P
    oof_acc = (P.argmax(1) == Tr)[pool_mask].mean()
    Fp = features(P[pool_mask], df[pool_mask]); Fa = features(P[aud_mask], df[aud_mask])
    cols = ["logit_q", "margin", "tierB", "pair"]
    ya = noisy[aud_mask].astype(int)
    stack = LogisticRegression(C=1.0, max_iter=500).fit(np.c_[[Fa[c] for c in cols]].T, ya)   # fit ONLY on the 400 audit rows
    yn = noisy[pool_mask]; rs = np.random.RandomState(7); nn = pool_mask.sum()
    sc = {"random": rs.rand(nn), "Tier-B first (no model)": Fp["tierB"] + 0.1 * rs.rand(nn), "self-confidence": Fp["self_conf"],
          "margin": Fp["margin"], "confident-learning + margin": cl_flags(P[pool_mask], df[pool_mask]) * 10 + Fp["margin"],
          "combined (model+tier+pair rule)": stack.decision_function(np.c_[[Fp[c] for c in cols]].T)}
    for s_name, s in sc.items():
        order = np.argsort(-s, kind="stable"); curves[(rname, s_name)] = np.cumsum(yn[order]); hit = yn[order[:BUDGET]]
        rows4.append(dict(regime=rname, detector_acc=oof_acc, strategy=s_name, noisy_found=int(hit.sum()), precision=hit.mean(),
                          recall=hit.sum() / yn.sum(), lift=hit.mean() / yn.mean(), AUROC=roc_auc_score(yn, s), AP=average_precision_score(yn, s)))
    print(f"  {rname:<32} detector accuracy vs truth {oof_acc:.3f} | audit-400 AUROC: margin {roc_auc_score(ya, Fa['margin']):.3f}, "
          f"tier-B {roc_auc_score(ya, Fa['tierB']):.3f}  (oracle AUROC on pool: margin {roc_auc_score(yn, sc['margin']):.3f}, tier-B {roc_auc_score(yn, sc['Tier-B first (no model)']):.3f})")
res4 = pd.DataFrame(rows4)
pd.set_option("display.width", 250)
print("\nPrecision of the top-2000 selection  (random review would give ~15%):")
print(res4.pivot(index="regime", columns="strategy", values="precision").loc[[r[0] for r in regimes], STRATS].round(3).to_string())
print("\nTruly-mislabelled tickets found in the top-2000 (out of", int(noisy[pool_mask].sum()), "in the pool):")
print(res4.pivot(index="regime", columns="strategy", values="noisy_found").loc[[r[0] for r in regimes], STRATS].astype(int).to_string())
R["m4_table"] = res4.to_dict(orient="records")

fig, axs = plt.subplots(1, 3, figsize=(15, 4.3), sharey=True)
for ax, rname in zip(axs, [regimes[0][0], regimes[1][0], regimes[3][0]]):
    for s_name in ["random", "Tier-B first (no model)", "margin", "confident-learning + margin", "combined (model+tier+pair rule)"]:
        g_ = curves[(rname, s_name)][:6000]; ax.plot(np.arange(1, len(g_) + 1), g_, label=s_name, lw=1.6, ls=":" if s_name == "random" else "-")
    ax.axvline(BUDGET, color="k", lw=.8, ls="--"); ax.text(BUDGET + 80, 150, "2,000\nreview budget", fontsize=8)
    ax.set_title(f"{rname}\ndetector accuracy {res4[res4.regime==rname].detector_acc.iloc[0]:.0%}", fontsize=9); ax.set_xlabel("tickets reviewed (ranked)")
axs[0].set_ylabel("truly mislabelled tickets found"); axs[0].legend(fontsize=7.5, loc="upper left")
plt.tight_layout(); plt.savefig(f"{OUT}/fig3_review_selection_curves.png", dpi=150); plt.close()

# --------------------------------------------------------------------------------------
# MILESTONES 4b / 5 - use the corrections, train robustly, evaluate trustworthily  (calibrated regime)
# --------------------------------------------------------------------------------------
hdr(f"MILESTONES 4-5 - robust training and honest evaluation (calibrated regime, keep={KEEP})")
def softmax_fit(Xtr, ytr, loss="ce", T=None, q=0.7, C=10.0, w=None, maxiter=400, init=None):
    n_, d_ = Xtr.shape; l2 = 1.0 / (C * n_); w = np.ones(n_) if w is None else w; w = w / w.mean()
    Yo = np.zeros((n_, K)); Yo[np.arange(n_), ytr] = 1
    def fg(theta):
        W = theta[:d_ * K].reshape(d_, K); b = theta[d_ * K:]
        Z = Xtr @ W + b; Z -= Z.max(1, keepdims=True); P = np.exp(Z); P /= P.sum(1, keepdims=True); py = P[np.arange(n_), ytr]
        if loss == "ce": L = -np.log(py + 1e-12); G = P - Yo
        elif loss == "gce": L = (1 - py ** q) / q; G = (py ** q)[:, None] * (P - Yo)               # Zhang & Sabuncu 2018
        elif loss == "fwd":                                                                         # Patrini et al. 2017
            Q = P @ T; qy = Q[np.arange(n_), ytr] + 1e-12; L = -np.log(qy)
            g = -T[:, ytr].T / qy[:, None]; G = P * (g - (P * g).sum(1, keepdims=True))
        f = (w * L).mean() + 0.5 * l2 * (W ** 2).sum(); Gw = G * w[:, None] / n_
        return f, np.r_[np.asarray(Xtr.T @ Gw + l2 * W).ravel(), Gw.sum(0)]
    th0 = np.zeros(d_ * K + K) if init is None else np.r_[init[0].ravel(), init[1]]     # robust losses are non-convex: warm-start from CE
    th = optimize.minimize(fg, th0, jac=True, method="L-BFGS-B", options=dict(maxiter=maxiter)).x
    return th[:d_ * K].reshape(d_, K), th[d_ * K:]
def predict(mod, Xte): return (Xte @ mod[0] + mod[1]).argmax(1)

# transition matrix T from the 400 audit tickets (expert label = true_label there), lightly smoothed
Cm = np.zeros((K, K)); a = df[aud_mask]; np.add.at(Cm, (a.t.values, a.y.values), 1)
T = Cm + 0.5 * (1 - np.eye(K)); T = T / T.sum(1, keepdims=True)
print("Transition matrix T estimated from the 400-ticket audit, diagonal (1 - flip rate per true class):", np.round(np.diag(T), 3))

SEEDS = [0, 1, 2]; allrows = []
for sd in SEEDS:
    Xd = degrade(X_full, KEEP, sd)
    P = oof_probs(Xd, all_idx, "random", seed=sd)
    Fp = features(P[pool_mask], df[pool_mask]); Fa = features(P[aud_mask], df[aud_mask]); cols = ["logit_q", "margin", "tierB", "pair"]
    stack = LogisticRegression(max_iter=500).fit(np.c_[[Fa[c] for c in cols]].T, noisy[aud_mask].astype(int))
    pool_rows = np.where(pool_mask)[0]; det_score = stack.decision_function(np.c_[[Fp[c] for c in cols]].T)
    review_det = pool_rows[np.argsort(-det_score, kind="stable")[:BUDGET]]
    review_rand = np.random.RandomState(sd + 50).choice(pool_rows, BUDGET, replace=False)
    flagged = pool_rows[cl_flags(P[pool_mask], df[pool_mask])]
    drop = np.zeros(len(df), bool); drop[flagged] = True
    print(f"[seed {sd}] detector-picked: {noisy[review_det].mean():.1%} truly noisy | random-picked: {noisy[review_rand].mean():.1%} | "
          f"CL flags {len(flagged):,} tickets ({noisy[flagged].mean():.1%} noisy)")
    def run(name, ylab, loss="ce", keep=None, Tm=None):
        m = tr_mask.copy()
        if keep is not None: m &= keep
        mod = softmax_fit(Xd[m], ylab[m], loss="ce")
        if loss != "ce": mod = softmax_fit(Xd[m], ylab[m], loss=loss, T=Tm, init=mod)      # CE warm start, then robust loss
        pr = predict(mod, Xd[te_mask])
        return dict(seed=sd, method=name, true_acc=(pr == Tr[te_mask]).mean(), noisy_acc=(pr == Y[te_mask]).mean(), n_train=int(m.sum())), mod
    y_r = Y.copy(); y_r[review_rand] = Tr[review_rand]; y_d = Y.copy(); y_d[review_det] = Tr[review_det]
    rest_flagged = drop & ~np.isin(np.arange(len(df)), review_det)          # flagged suspects that experts did NOT get to review
    r0, base_model = run("A. CE on crowd+expert labels (baseline)", Y); allrows.append(r0)
    allrows.append(run("B. Generalised CE (q=0.7), CE warm start", Y, loss="gce")[0])
    allrows.append(run("C. Forward loss correction (T from audit)", Y, loss="fwd", Tm=T)[0])
    allrows.append(run("D. Prune confident-learning flags, retrain", Y, keep=~drop)[0])
    allrows.append(run("E. Expert-fix 2,000 RANDOM tickets", y_r)[0])
    allrows.append(run("F. Expert-fix 2,000 DETECTOR-picked tickets", y_d)[0])
    allrows.append(run("G. F + prune the remaining flagged suspects", y_d, keep=~rest_flagged)[0])
    allrows.append(run("I. G + generalised CE on what is left", y_d, loss="gce", keep=~rest_flagged)[0])
    allrows.append(run("H. ORACLE: every label clean (upper bound)", Tr.copy())[0])
    if sd == SEEDS[0]:
        clean_model = run("clean", Tr.copy())[1]; Xd0 = Xd; base0 = base_model
dd = pd.DataFrame(allrows)
summ = dd.groupby("method", sort=True).agg(true_acc=("true_acc", "mean"), true_sd=("true_acc", "std"), noisy_acc=("noisy_acc", "mean"), n_train=("n_train", "mean")).round(4)
print("\nTest-split accuracy, mean over 3 degradation seeds (true_acc = vs hidden clean label [oracle]; noisy_acc = vs crowd label = what you report today):")
print(summ.to_string())
R["m5_models"] = summ.reset_index().to_dict(orient="records")

# --- how misleading is the crowd test set? (seed 0, calibrated regime)
Xd = Xd0; pr = predict(base0, Xd[te_mask]); noisy_acc = (pr == Y[te_mask]).mean(); true_a = (pr == Tr[te_mask]).mean(); eta_te = noisy[te_mask].mean()
print(f"\nBaseline model: noisy-test acc {noisy_acc:.4f}; TRUE acc {true_a:.4f}; test noise rate {eta_te:.4f}")
print(f"  M3 uniform-noise formula  -> {true_acc(noisy_acc, eta_te):.4f}   (compare with true {true_a:.4f})")
print(f"  M3 formula with the brief's 15% -> {true_acc(noisy_acc, 0.15):.4f};   naive ceiling 1-eta = {1-eta_te:.3f}")
pr_c = predict(clean_model, Xd[te_mask])
print("Does noise distort model COMPARISON?  (same features, only the training labels differ)")
for nm, p_ in [("trained on noisy labels", pr), ("trained on clean labels", pr_c)]:
    print(f"  {nm:<26}: noisy-test acc {(p_==Y[te_mask]).mean():.4f} | clean-test acc {(p_==Tr[te_mask]).mean():.4f}")
g_noisy = (pr_c == Y[te_mask]).mean() - (pr == Y[te_mask]).mean(); g_true = (pr_c == Tr[te_mask]).mean() - (pr == Tr[te_mask]).mean()
print(f"  true improvement {g_true*100:.2f} pts looks like {g_noisy*100:.2f} pts on the noisy test set ({g_noisy/g_true:.0%} of it)")
print("Gold test set: random expert-labelled test tickets (simulated with true_label), Wilson 95% CI for the baseline model:")
for nn_ in [500, 1000, 2000]:
    gi = np.random.RandomState(2).choice(np.where(te_mask)[0], nn_, replace=False); kk = int((predict(base0, Xd[gi]) == Tr[gi]).sum()); lo_, hi_ = wilson(kk, nn_)
    print(f"  n={nn_:>4}: acc {kk/nn_:.3f}  CI {lo_:.3f}-{hi_:.3f}  (half-width +/-{(hi_-lo_)/2:.3f})")
print("Gold-set size needed for a +/-m 95% CI half-width (worst case p=0.5 | p=0.9):")
for m_ in [0.03, 0.02, 0.015, 0.01]:
    print(f"  +/-{m_:.1%}: n = {int(np.ceil(z*z*0.25/m_**2)):>5} | {int(np.ceil(z*z*0.09/m_**2)):>5}")
print(f"Sampling error of the 7,500-ticket crowd test set is only +/-{z*np.sqrt(.82*.18/7500)*100:.2f} pts -- but its LABEL BIAS is ~{(true_a-noisy_acc)*100:.1f} pts.")

json.dump(R, open(f"{OUT}/results.json", "w"), indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o))
print("\nSaved: results.json, fig1_transition_matrix.png, fig2_true_accuracy_sensitivity.png, fig3_review_selection_curves.png")
