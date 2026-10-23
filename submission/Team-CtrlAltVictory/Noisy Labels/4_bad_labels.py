import argparse
import math
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold

BUDGET, N_CONTROL, SEED = 2000, 200, 42


def wilson(k, n, z=1.96):
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return c - h, c + h


def model():
    return LogisticRegression(max_iter=2000, C=5.0)


def out_of_fold(X, y, k, folds=5):
    P = np.zeros((X.shape[0], k))
    for tr, va in StratifiedKFold(folds, shuffle=True, random_state=SEED).split(X, y):
        P[va] = model().fit(X[tr], y[tr]).predict_proba(X[va])
    return P


def rank_scores(P, y, tier_b, boost=0.05):
    n, k = P.shape
    thr = np.array([P[y == j, j].mean() for j in range(k)])
    p_given = P[np.arange(n), y]
    other = P.copy()
    other[np.arange(n), y] = -1.0
    alt = other.argmax(1)
    margin = other[np.arange(n), alt] - p_given
    suspect = (other >= thr).any(1)
    return margin + suspect + boost * tier_b, alt, suspect


def main(path):
    df = pd.read_csv(path)
    df["clean"] = df["text"].str.replace(r"#?\d+", " NUM ", regex=True).str.lower()
    classes = sorted(df["given_label"].unique())
    cidx = {c: i for i, c in enumerate(classes)}

    crowd = df[df["annotator_tier"].isin(["Tier A", "Tier B"])]
    expert = df[df["annotator_tier"] == "Expert"]
    cand = crowd[~crowd["audited"]].reset_index(drop=True)

    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)
    vec.fit(crowd["clean"])
    X = vec.transform(cand["clean"])
    y = cand["given_label"].map(cidx).values
    truth = cand["true_label"].map(cidx).values
    wrong = truth != y
    tier_b = (cand["annotator_tier"] == "Tier B").values.astype(float)

    P = out_of_fold(X, y, len(classes))
    score, alt, suspect = rank_scores(P, y, tier_b)

    rng = np.random.default_rng(SEED)
    control = rng.choice(len(cand), N_CONTROL, replace=False)
    is_control = np.zeros(len(cand), bool)
    is_control[control] = True
    targeted = np.array(
        [i for i in np.argsort(-score) if not is_control[i]][: BUDGET - N_CONTROL]
    )

    queue = pd.DataFrame(
        {
            "ticket_id": cand["ticket_id"].values[np.r_[targeted, control]],
            "given_label": cand["given_label"].values[np.r_[targeted, control]],
            "suggested_label": [classes[a] for a in alt[np.r_[targeted, control]]],
            "annotator_tier": cand["annotator_tier"].values[np.r_[targeted, control]],
            "arm": ["targeted"] * len(targeted) + ["random_control"] * len(control),
        }
    )
    out = Path(path).resolve().parent.parent / "review_queue.csv"
    queue.to_csv(out, index=False)

    k_t, k_c = int(wrong[targeted].sum()), int(wrong[control].sum())
    p_t, p_c = k_t / len(targeted), k_c / len(control)
    lo_t, hi_t = wilson(k_t, len(targeted))
    lo_c, hi_c = wilson(k_c, len(control))

    y_fix = y.copy()
    reviewed = np.r_[targeted, control]
    y_fix[reviewed] = truth[reviewed]
    y_rand = y.copy()
    pick = rng.choice(len(cand), BUDGET, replace=False)
    y_rand[pick] = truth[pick]
    Xe = vec.transform(expert["clean"])
    ye = expert["true_label"].map(cidx).values
    acc = {
        n: (model().fit(X, lab).predict(Xe) == ye).mean()
        for n, lab in [("noisy", y), ("random fix", y_rand), ("targeted fix", y_fix)]
    }

    print(f"Candidates: {len(cand):,} | Queue: {len(queue):,} -> {out.name}")
    print(f"Targeted precision: {p_t:.1%} [{lo_t:.1%}, {hi_t:.1%}]")
    print(f"Random precision:   {p_c:.1%} [{lo_c:.1%}, {hi_c:.1%}]")
    print(f"Lift: {p_t / p_c:.2f}x | Recall: {k_t / wrong.sum():.1%}")
    print("Expert-set accuracy: " + " | ".join(f"{n} {a:.4f}" for n, a in acc.items()))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--data", default=str(Path(__file__).parent / "data" / "HelpDeskNet-50K.csv")
    )
    main(ap.parse_args().data)
