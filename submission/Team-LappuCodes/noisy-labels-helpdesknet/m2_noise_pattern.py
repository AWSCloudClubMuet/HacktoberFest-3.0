"""MILESTONE 2 - is the noise random or systematic? Builds the confusion table + heat-map."""
import numpy as np, pandas as pd, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from common import CLASSES, C2I

pairs = {("Billing","Refund"):14, ("Refund","Billing"):12, ("Technical","Account Access"):9,
         ("Shipping","Other"):8, ("Account Access","Technical"):6, ("Technical","Other"):5,
         ("Other","Shipping"):3, ("Billing","Other"):3}          # (crowd, expert): count
M = np.zeros((6, 6), int)
for (c, e), k in pairs.items(): M[C2I[c], C2I[e]] = k
tab = pd.DataFrame(M, index=[f"crowd:{c}" for c in CLASSES], columns=[f"expert:{c}" for c in CLASSES])
print(tab, "\n")

N = M.sum()
print("Share of all disagreements by confusable group:")
groups = {"Billing <-> Refund": M[0,1]+M[1,0], "Technical <-> Account Access": M[2,3]+M[3,2],
          "Anything involving Other (Shipping/Technical/Billing <-> Other)": M[4,5]+M[5,4]+M[2,5]+M[0,5]}
for g, v in groups.items(): print(f"  {g}: {v}/{N} = {v/N:.0%}")
print("  Only 8 of the 30 possible error cells are used at all; the other 22 are empty")

print("\nDirection (asymmetry):")
print("  Billing->Refund(crowd said Billing, expert Refund)=14 vs Refund->Billing=12   (roughly symmetric)")
print("  crowd Shipping, expert Other = 8  vs  crowd Other, expert Shipping = 3        (one-way!)")
print("  Experts labelled 16 tickets 'Other' that crowd put in Shipping/Technical/Billing; only 3 went the other way")

# Monte-Carlo: how surprising is this if errors were uniform over the 30 off-diagonal cells?
rng = np.random.default_rng(0)
observed = ((M[M>0]**2).sum())                     # concentration statistic (sum of squares)
sims = [(np.bincount(rng.integers(0, 30, N), minlength=30)**2).sum() for _ in range(20000)]
print(f"\nConcentration statistic observed={observed}, uniform-random mean={np.mean(sims):.0f}, "
      f"p-value<{max((np.array(sims) >= observed).mean(), 1/20000):.4f}  -> errors are NOT uniform")

fig, ax = plt.subplots(figsize=(7, 5.5))
im = ax.imshow(M, cmap="Reds")
ax.set_xticks(range(6)); ax.set_xticklabels(CLASSES, rotation=45, ha="right")
ax.set_yticks(range(6)); ax.set_yticklabels(CLASSES)
ax.set_xlabel("Expert (true) label"); ax.set_ylabel("Crowd label"); ax.set_title("Crowd -> Expert disagreements (n=60)")
for i in range(6):
    for j in range(6):
        if M[i, j]: ax.text(j, i, M[i, j], ha="center", va="center")
plt.colorbar(im); plt.tight_layout(); plt.savefig("outputs/m2_confusion_heatmap.png", dpi=150)
print("saved outputs/m2_confusion_heatmap.png")
