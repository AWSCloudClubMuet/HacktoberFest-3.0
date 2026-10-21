"""
MILESTONE 4 - pick the 2,000 tickets experts should re-check.
1) get out-of-fold (cross-validated) predicted probabilities for every crowd ticket
2) score "how likely is this label wrong?"  3) compare ranking strategies  4) apply corrections
"""
import numpy as np, pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_predict, StratifiedKFold
from sklearn.metrics import roc_auc_score
from common import load, CLASSES

df = load()
crowd = df[df.source.isin(["tierA", "tierB"])].reset_index(drop=True)
test = df[df.source == "test"].reset_index(drop=True)
BUDGET = 2000

vec = TfidfVectorizer(max_features=3000, ngram_range=(1, 2), min_df=3)
X = vec.fit_transform(crowd.text)
y = crowd.noisy_label.values
is_wrong = (crowd.noisy_label != crowd.true_label).values          # known only because this is a simulation

# 1) out-of-fold probabilities: each ticket is scored by a model that never saw it
oof = cross_val_predict(LogisticRegression(max_iter=300, C=5), X, y, cv=StratifiedKFold(5, shuffle=True, random_state=0),
                        method="predict_proba")
p_given = oof[np.arange(len(y)), y]                                  # prob. the model gives to the crowd's label
p_other_max = np.where(np.eye(6)[y] == 1, -1, oof).max(1)

# 2) suspicion scores (higher = more likely mislabeled)
scores = {
 "random":            np.random.default_rng(0).random(len(y)),
 "self-confidence":   1 - p_given,                                   # confident-learning style
 "margin":            p_other_max - p_given,
 "conf+tierB prior":  (1 - p_given) * np.where(crowd.source == "tierB", 1.3, 1.0),
}

# 3) evaluate each strategy -- the "does it work?" step
print(f"Real noise rate in crowd data (sim): {is_wrong.mean():.3f}\n")
print(f"{'strategy':20s} {'errors found in top-2000':>26s} {'precision':>10s} {'recall':>8s} {'lift':>6s} {'AUROC':>7s}")
for name, s in scores.items():
    top = np.argsort(-s)[:BUDGET]
    found = is_wrong[top].sum()
    print(f"{name:20s} {found:26d} {found/BUDGET:10.1%} {found/is_wrong.sum():8.1%} {found/BUDGET/is_wrong.mean():6.1f}x {roc_auc_score(is_wrong, s):7.3f}")

# Same check using ONLY what you'd really have: a 400-ticket audit set (random sample with expert labels)
aud = np.random.default_rng(1).choice(len(y), 400, replace=False)
print(f"\nAudit-set AUROC of self-confidence (what you can really measure): {roc_auc_score(is_wrong[aud], scores['self-confidence'][aud]):.3f}")

# 4) use the corrected labels: experts fix the top-2000 -> retrain -> test on CLEAN test labels
top = np.argsort(-scores["self-confidence"])[:BUDGET]
y_fixed = y.copy(); y_fixed[top] = crowd.true_label.values[top]       # expert verdicts
Xt = vec.transform(test.text)
for name, labels in [("train on raw crowd labels", y), ("train after 2,000 expert fixes", y_fixed)]:
    m = LogisticRegression(max_iter=300, C=5).fit(X, labels)
    pred = m.predict(Xt)
    print(f"{name:32s} acc vs noisy test = {(pred==test.noisy_label).mean():.3f} | acc vs TRUE labels = {(pred==test.true_label).mean():.3f}")

# per-class where are the suspects? (feed back to annotation guidelines)
sus = crowd.iloc[top]
print("\nTop-2000 suspects by crowd label:\n", sus.noisy_label.map(dict(enumerate(CLASSES))).value_counts())
print("Top-2000 suspects by tier:\n", sus.source.value_counts())
