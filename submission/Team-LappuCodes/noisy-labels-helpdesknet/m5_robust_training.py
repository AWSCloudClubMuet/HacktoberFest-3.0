"""
MILESTONE 5 - noise-robust training + trustworthy evaluation.
Method 1: Confident-learning filtering (drop suspected bad labels, retrain)
Method 2: Forward loss correction (model learns through an estimated noise matrix T)
Then evaluate on (a) the noisy crowd test set, (b) a small EXPERT-labelled test set.
"""
import numpy as np
from scipy.special import softmax
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_predict, StratifiedKFold
from common import load

df = load()
crowd = df[df.source.isin(["tierA", "tierB"])].reset_index(drop=True)
expert = df[df.source == "expert"].reset_index(drop=True)
test = df[df.source == "test"].reset_index(drop=True)

train = crowd                                    # (you could also add the 5,000 expert tickets; kept out for a clean comparison)
vec = TfidfVectorizer(max_features=3000, ngram_range=(1, 2), min_df=3)
X = vec.fit_transform(train.text); y = train.noisy_label.values
Xt = vec.transform(test.text)

# ---- TRUSTWORTHY test set: 1,500 stratified tickets with EXPERT labels (here: true_label) ----
rng = np.random.default_rng(7)
idx = np.concatenate([rng.choice(np.where(test.true_label == c)[0], 250, replace=False) for c in range(6)])
Xe, ye = Xt[idx], test.true_label.values[idx]    # 250 per class so small classes (Other) are measured properly

def report(name, pred_noisy_test, pred_expert):
    acc_noisy = (pred_noisy_test == test.noisy_label).mean()
    acc_exp = (pred_expert == ye).mean()
    ci = 1.96 * np.sqrt(acc_exp * (1 - acc_exp) / len(ye))
    macro = np.mean([(pred_expert[ye == c] == c).mean() for c in range(6)])
    print(f"{name:34s} noisy-test acc {acc_noisy:.3f} | expert-test acc {acc_exp:.3f} +/- {ci:.3f} | macro-recall {macro:.3f}")

# ---- Baseline ----
base = LogisticRegression(max_iter=300, C=5).fit(X, y)
report("Baseline (raw crowd labels)", base.predict(Xt), base.predict(Xe))

# ---- Method 1: confident learning / filtering ----
oof = cross_val_predict(LogisticRegression(max_iter=300, C=5), X, y, cv=StratifiedKFold(5, shuffle=True, random_state=0), method="predict_proba")
thr = np.array([oof[y == k, k].mean() for k in range(6)])        # per-class confidence threshold
suspect = np.array([(oof[i] >= thr).any() and (oof[i][y[i]] < thr[y[i]]) and (oof[i].argmax() != y[i]) for i in range(len(y))])
print(f"\nFiltering: removing {suspect.sum()} suspected bad labels ({suspect.mean():.1%});"
      f" of these, truly wrong = {(y[suspect] != train.true_label.values[suspect]).mean():.1%}")
m1 = LogisticRegression(max_iter=300, C=5).fit(X[~suspect], y[~suspect])
report("Method 1: filter + retrain", m1.predict(Xt), m1.predict(Xe))

# ---- Method 2: forward loss correction ----
# estimate T[i,j] = P(crowd says j | true i) from the confident joint
C = np.zeros((6, 6))
for i in range(len(y)):
    cand = np.where(oof[i] >= thr)[0]
    if len(cand): C[cand[np.argmax(oof[i][cand])], y[i]] += 1
T = C / C.sum(1, keepdims=True)
print("\nEstimated noise matrix T (rows=true, cols=crowd label):\n", np.round(T, 2))

def train_forward(X, y, T, epochs=300, lr=0.05, l2=1e-5):
    n, d = X.shape; W = np.zeros((d, 6)); b = np.zeros(6)
    mW, vW, mb, vb = 0*W, 0*W, 0*b, 0*b
    for t in range(1, epochs + 1):
        p = softmax(X @ W + b, axis=1)
        q = p @ T                                          # predicted distribution over NOISY labels
        qy = np.clip(q[np.arange(n), y], 1e-9, None)
        g = -T[:, y].T / qy[:, None]                       # dL/dp  (n x 6)
        gz = p * (g - (p * g).sum(1, keepdims=True)) / n   # through the softmax
        gW = X.T @ gz + l2 * W; gb = gz.sum(0)
        for (P, G, M, V) in ((W, gW, mW, vW), (b, gb, mb, vb)):    # Adam
            M *= .9; M += .1 * G; V *= .999; V += .001 * G**2
            P -= lr * (M / (1 - .9**t)) / (np.sqrt(V / (1 - .999**t)) + 1e-8)
    return W, b

W, b = train_forward(X, y, T)
pred = lambda Z: (Z @ W + b).argmax(1)                     # at test time use p, NOT p@T
report("Method 2: forward loss correction", pred(Xt), pred(Xe))

print("\nHow far can the NOISY test mislead? Gap between noisy-test and expert-test accuracy is the bias.")
