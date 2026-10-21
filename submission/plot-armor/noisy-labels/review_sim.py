#!/usr/bin/env python3
"""
review_sim.py - HelpDeskNet-50K noisy labels, milestone 4 (issue #9)

Question: experts can review only 2,000 additional tickets out of the
45,000-ticket crowd-labeled pool. Which 2,000 do we send them so the
review budget removes the most label noise?

Simulation layout (all synthetic, ground truth known so we can score):
  - 5,000 expert-labeled "gold" tickets, clean labels
  - 45,000 crowd-labeled tickets:
      Tier A: 20,000 @ ~6.7% label error (vetted crowd, 3 votes)
      Tier B: 25,000 @ ~21.8% label error (open crowd, single vote)
      systematic confusion is heaviest between Billing <-> Refund,
      both in how crowd labelers flip labels and in ticket wording
  - a small hand-rolled multinomial Naive Bayes trained on the gold set
    predicts on the whole crowd pool; disagreements between the model
    and the crowd label drive the smarter selection strategies

Stdlib only; numpy is used when present (rng backend + small stats
helpers) and everything degrades gracefully without it. No sklearn.
"""

from __future__ import annotations

import bisect
import os
import random
import sys
from collections import Counter

try:
    import numpy as _np
except ImportError:  # graceful degradation, stdlib only
    _np = None

# ----------------------------------------------------------------------------
# constants (issue #9 numbers)
# ----------------------------------------------------------------------------
SEED = 202609

N_POOL = 45_000          # crowd-labeled tickets
N_TIER_A = 20_000        # tier A, ~6.7% error
N_TIER_B = 25_000        # tier B, ~21.8% error
N_GOLD = 5_000           # expert-labeled portion (clean)
BUDGET = 2_000           # extra tickets experts can review

TIER_A_ERR = 0.067
TIER_B_ERR = 0.218

CLASSES = ["billing", "refund", "account", "technical", "shipping", "general"]
CLASS_PRIORS = [0.21, 0.19, 0.17, 0.17, 0.14, 0.12]

# when a crowd labeler gets a ticket wrong, where the wrong label lands.
# this is the "systematic" part: Billing <-> Refund dominates.
FLIP_TARGETS = {
    "billing":   [("refund", 0.50), ("account", 0.14), ("technical", 0.12),
                  ("shipping", 0.12), ("general", 0.12)],
    "refund":    [("billing", 0.50), ("account", 0.14), ("technical", 0.12),
                  ("shipping", 0.12), ("general", 0.12)],
    "account":   [("technical", 0.35), ("billing", 0.20), ("refund", 0.15),
                  ("shipping", 0.15), ("general", 0.15)],
    "technical": [("account", 0.35), ("billing", 0.15), ("refund", 0.15),
                  ("shipping", 0.20), ("general", 0.15)],
    "shipping":  [("general", 0.35), ("billing", 0.15), ("refund", 0.15),
                  ("account", 0.15), ("technical", 0.20)],
    "general":   [("shipping", 0.35), ("billing", 0.15), ("refund", 0.15),
                  ("account", 0.20), ("technical", 0.15)],
}

# keyword vocabularies: simple class-conditional bag of words
CLASS_VOCAB = {
    "billing":   ["charge", "charged", "invoice", "card", "billed", "subscription",
                  "fee", "price", "receipt", "amount", "payment", "due", "renewal",
                  "auto", "renew", "statement", "cycle", "monthly", "plan",
                  "upgrade", "prorate", "tax", "total", "pay"],
    "refund":    ["refund", "money", "back", "return", "reimburse", "cancelled",
                  "cancel", "chargeback", "dispute", "wrongly", "credited",
                  "credit", "pending", "processing", "days", "wait", "reversal",
                  "transaction", "reimbursement", "partial", "full", "denied",
                  "request", "status"],
    "account":   ["login", "password", "signin", "locked", "reset", "verification",
                  "email", "2fa", "otp", "username", "profile", "deactivated",
                  "recover", "access", "link", "code", "verify", "credentials",
                  "suspended", "unlock"],
    "technical": ["error", "bug", "crash", "loading", "slow", "update", "fails",
                  "screen", "blank", "timeout", "freeze", "broken", "spinning",
                  "logs", "console", "version", "stuck", "white", "retry",
                  "glitch", "hangs"],
    "shipping":  ["delivery", "tracking", "package", "shipped", "courier",
                  "address", "late", "missing", "parcel", "dispatch", "waybill",
                  "arrived", "delay", "lost", "transit", "customs", "warehouse",
                  "undelivered", "reship", "label"],
    "general":   ["question", "info", "details", "feedback", "complaint",
                  "suggestion", "inquiry", "policy", "hours", "contact", "sales",
                  "partner", "bulk", "enterprise", "demo", "pricing", "trial",
                  "wondering", "possible", "instead"],
}

# cross-class bridge words: tickets from one class sometimes contain words of
# its confusion partner, so billing/refund tickets genuinely read alike
BRIDGE_VOCAB = {
    "billing":   ["money", "transaction", "dispute", "cancel", "credited", "pending"],
    "refund":    ["charge", "card", "payment", "receipt", "order", "subscription"],
    "account":   ["error", "fails", "crash", "loading", "stuck", "retry"],
    "technical": ["login", "password", "access", "email", "locked", "reset"],
    "shipping":  ["missing", "late", "question", "status", "info", "policy"],
    "general":   ["delivery", "tracking", "order", "account", "login", "payment"],
}
COMMON_WORDS = ["please", "help", "hi", "team", "thanks", "issue", "need",
                "urgent", "ticket", "support", "still", "since", "when",
                "after", "every", "getting", "keeps", "cannot", "with",
                "this", "again", "checked"]

P_OWN, P_BRIDGE, P_COMMON = 0.62, 0.16, 0.22
WORDS_MIN, WORDS_MAX = 6, 10


# ----------------------------------------------------------------------------
# seeded rng wrapper: numpy backend when present, stdlib fallback
# ----------------------------------------------------------------------------
class RNG:
    def __init__(self, seed):
        self._rng = _np.random.default_rng(seed) if _np is not None else random.Random(seed)

    def random(self):
        return float(self._rng.random())

    def randint(self, lo, hi):  # lo inclusive, hi exclusive
        if _np is not None:
            return int(self._rng.integers(lo, hi))
        return self._rng.randrange(lo, hi)

    def shuffle(self, lst):
        for i in range(len(lst) - 1, 0, -1):  # fish-yates, works on any backend
            j = self.randint(0, i + 1)
            lst[i], lst[j] = lst[j], lst[i]


def _cum_weights(pairs):
    items = [p[0] for p in pairs]
    cum, total = [], 0.0
    for _, w in pairs:
        total += w
        cum.append(total)
    return items, cum, total


def _weighted_pick(rng, items, cum, total):
    u = rng.random() * total
    return items[bisect.bisect_right(cum, u)]


# ----------------------------------------------------------------------------
# synthetic data generation
# ----------------------------------------------------------------------------
def _sample_words(rng, true_class):
    own = CLASS_VOCAB[true_class]
    bridge = BRIDGE_VOCAB[true_class]
    words = []
    for _ in range(rng.randint(WORDS_MIN, WORDS_MAX + 1)):
        r = rng.random()
        if r < P_OWN:
            words.append(own[rng.randint(0, len(own))])
        elif r < P_OWN + P_BRIDGE:
            words.append(bridge[rng.randint(0, len(bridge))])
        else:
            words.append(COMMON_WORDS[rng.randint(0, len(COMMON_WORDS))])
    return words


def _sample_class(rng, cls_items, cls_cum, cls_total):
    return _weighted_pick(rng, cls_items, cls_cum, cls_total)


def build_gold_set(rng):
    """5,000 expert-labeled tickets, clean labels (model training data)."""
    cls_items, cls_cum, cls_total = _cum_weights(list(zip(CLASSES, CLASS_PRIORS)))
    gold = []
    for tid in range(N_GOLD):
        c = _sample_class(rng, cls_items, cls_cum, cls_total)
        gold.append({"id": tid, "true": c, "label": c,
                     "tier": "gold", "words": _sample_words(rng, c)})
    return gold


def build_crowd_pool(rng):
    """45,000 crowd-labeled tickets with tier-dependent noisy labels."""
    cls_items, cls_cum, cls_total = _cum_weights(list(zip(CLASSES, CLASS_PRIORS)))
    flips = {c: _cum_weights(FLIP_TARGETS[c]) for c in CLASSES}

    tiers = ["A"] * N_TIER_A + ["B"] * N_TIER_B
    rng.shuffle(tiers)

    pool = []
    for tid, tier in enumerate(tiers):
        true_c = _sample_class(rng, cls_items, cls_cum, cls_total)
        err_rate = TIER_A_ERR if tier == "A" else TIER_B_ERR
        if rng.random() < err_rate:
            items, cum, total = flips[true_c]
            label = _weighted_pick(rng, items, cum, total)
        else:
            label = true_c
        pool.append({"id": tid, "true": true_c, "label": label,
                     "tier": tier, "words": _sample_words(rng, true_c)})
    return pool


# ----------------------------------------------------------------------------
# reporting helpers
# ----------------------------------------------------------------------------
def line(char="-", n=78):
    return char * n


def pool_report(pool):
    n = len(pool)
    err = sum(1 for t in pool if t["label"] != t["true"])
    per_tier = {}
    for tier in ("A", "B"):
        sub = [t for t in pool if t["tier"] == tier]
        e = sum(1 for t in sub if t["label"] != t["true"])
        per_tier[tier] = (len(sub), e, 100.0 * e / len(sub))

    conf = Counter((t["true"], t["label"]) for t in pool if t["label"] != t["true"])
    cls_counts = Counter(t["true"] for t in pool)

    print(line("="))
    print("HelpDeskNet-50K - milestone 4: expert review prioritization (issue #9)")
    print(f"team plot-armor | seed {SEED} | numpy backend: {'on' if _np is not None else 'off (stdlib fallback)'}")
    print(line("="))
    print(f"crowd pool: {n:,} tickets   gold (expert, clean): {N_GOLD:,}   review budget: {BUDGET:,}")
    print(f"base label noise (before any review): {err:,}/{n:,} = {100.0 * err / n:.2f}%")
    for tier, (cnt, e, pct) in per_tier.items():
        print(f"  tier {tier}: {cnt:,} tickets, {e:,} mislabeled = {pct:.2f}%")
    print(f"class mix (true): " + ", ".join(f"{c} {cls_counts[c]:,}" for c in CLASSES))
    print("top crowd confusions (true -> wrong label):")
    for (t, l), cnt in conf.most_common(5):
        print(f"  {t:>9} -> {l:<9} {cnt:,} ({100.0 * cnt / err:.1f}% of all errors)")
    return err


# ----------------------------------------------------------------------------
def main():
    rng_pool = RNG(SEED)
    rng_gold = RNG(SEED + 1)

    gold = build_gold_set(rng_gold)
    pool = build_crowd_pool(rng_pool)

    base_err = pool_report(pool)

    print()
    print(f"baseline: {base_err:,} mislabeled tickets sit in the pool")
    print("(selection strategies land in the next milestone step)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
