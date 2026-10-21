"""
STEP 0 - Build a realistic FAKE HelpDeskNet-50K (the organisers gave no file).
We know the TRUE label of every ticket, so later we can check our methods.
Noise is injected using the organisers' audit table (crowd->expert disagreements).
Output: data/helpdesknet.csv
"""
import numpy as np, pandas as pd, os
from common import CLASSES, C2I

rng = np.random.default_rng(42)
PRIOR = np.array([.30, .15, .25, .15, .10, .05])

VOCAB = {
 "Billing": "invoice charge charged bill billing payment card statement subscription price amount double overcharged receipt plan fee".split(),
 "Refund": "refund return money back reimburse cancel cancelled returned credit reversal refunded chargeback compensation reimbursement".split(),
 "Technical": "error crash bug app freezes loading slow broken server timeout update install screen fails glitch".split(),
 "Account Access": "login password locked reset account email verification otp username signin hacked access twofactor".split(),
 "Shipping": "delivery shipping package tracking courier delayed parcel address arrived shipment dispatch transit lost".split(),
 "Other": "feedback suggestion question information partnership careers general complaint hello opinion survey feature other".split(),
}
NEIGHBOR = {"Billing": "Refund", "Refund": "Billing", "Technical": "Account Access",
            "Account Access": "Technical", "Shipping": "Other", "Other": "Shipping"}
GENERIC = "please help my the is not with I have issue ticket order customer need urgent hi thanks since yesterday again".split()

def make_text(c):
    own, nb = VOCAB[c], VOCAB[NEIGHBOR[c]]
    ambiguous = rng.random() < 0.06           # genuinely confusing tickets
    words = []
    for _ in range(rng.integers(8, 14)):
        r = rng.random()
        if r < (0.30 if ambiguous else 0.04): words.append(rng.choice(nb))
        elif r < 0.62: words.append(rng.choice(own))
        else: words.append(rng.choice(GENERIC))
    return " ".join(words)

# (true class, crowd label, count) from the organisers' audit table (crowd -> expert)
# NOTE: "Billing -> Refund" means crowd said Billing, expert said Refund, so TRUE = Refund.
AUDIT = [("Refund","Billing",14),("Billing","Refund",12),("Account Access","Technical",9),
         ("Other","Shipping",8),("Technical","Account Access",6),("Other","Technical",5),
         ("Shipping","Other",3),("Other","Billing",3)]

def flip_probs(rate, cap=0.6):
    """Per-true-class flip probability so that overall noise = rate."""
    D = np.zeros(6)
    for t, _, n in AUDIT: D[C2I[t]] += n
    base = D / D.sum() / PRIOR
    lo, hi = 0, 10
    for _ in range(60):
        s = (lo + hi) / 2
        f = np.minimum(cap, s * base * rate)
        lo, hi = (s, hi) if (PRIOR * f).sum() < rate else (lo, s)
    return f

DEST = {}
for t, c, n in AUDIT: DEST.setdefault(C2I[t], {})[C2I[c]] = n

def corrupt(y, rate):
    f = flip_probs(rate)
    out = y.copy()
    for i, t in enumerate(y):
        if t in DEST and rng.random() < f[t]:
            ks, ws = zip(*DEST[t].items())
            out[i] = rng.choice(ks, p=np.array(ws) / sum(ws))
    return out

def block(n, source, rate):
    y = rng.choice(6, size=n, p=PRIOR)
    df = pd.DataFrame({"text": [make_text(CLASSES[t]) for t in y], "true_label": y, "source": source})
    df["noisy_label"] = corrupt(y, rate) if rate > 0 else y
    return df

df = pd.concat([block(5000, "expert", 0), block(20000, "tierA", 0.0667),
                block(25000, "tierB", 0.2182), block(10000, "test", 0.15)], ignore_index=True)
df.insert(0, "id", range(len(df)))
os.makedirs("data", exist_ok=True)
df.to_csv("data/helpdesknet.csv", index=False)
print(df.groupby("source").apply(lambda g: pd.Series({"n": len(g), "noise_rate": (g.noisy_label != g.true_label).mean()})))
