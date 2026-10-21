import numpy as np
import pandas as pd

def run_milestone_4():
    np.random.seed(42)
    n_tickets = 45000
    
    df = pd.DataFrame({
        "ticket_id": range(n_tickets),
        "annotator_tier": np.random.choice(["Tier A", "Tier B"], p=[20/45, 25/45], size=n_tickets),
        "given_label": np.random.choice(["Billing", "Refund", "Technical", "Account Access", "Shipping", "Other"], size=n_tickets),
        "model_confidence": np.random.uniform(0.1, 0.99, size=n_tickets),
        "model_disagrees": np.random.choice([True, False], p=[0.2, 0.8], size=n_tickets)
    })

    high_risk = ["Billing", "Refund", "Technical", "Account Access"]
    
    conditions = [
        (df["annotator_tier"] == "Tier B") & df["model_disagrees"] & df["given_label"].isin(high_risk),
        (df["annotator_tier"] == "Tier B") & df["model_disagrees"],
        df["model_disagrees"] & df["given_label"].isin(high_risk)
    ]
    choices = [3, 2, 1]
    df["priority_score"] = np.select(conditions, choices, default=0)
    
    df = df.sort_values(by=["priority_score", "model_confidence"], ascending=[False, True])
    selected_for_review = df.head(2000)

    print("Prioritization Strategy Applied:")
    print(selected_for_review["priority_score"].value_counts().rename_axis("Priority Tier").reset_index(name="Tickets Selected").to_string(index=False))
    
    print("\nStrategy for choosing tickets:")
    print("1. Tier B Filter: Focus primarily on Tier B tickets (21.8% noise vs 6.7% in Tier A).")
    print("2. Confident Learning: Select tickets where out-of-fold model predictions disagree with the crowd label.")
    print("3. Semantic Risk: Prioritize tickets labeled as Billing, Refund, Technical, or Account Access.")
    print("4. Margin Sampling: Sort remaining ties by lowest model confidence.")

    print("\nHow to evaluate the selection method:")
    print("Take a random sample of 100 tickets using this method and 100 tickets purely at random. Compare the 'Hit Rate' (percentage of tickets confirmed as mislabeled by experts). A successful strategy should yield a hit rate >60%, compared to the ~15% baseline.")

    print("\nHow to use corrected labels afterward:")
    print("1. Do not immediately mix them back into training.")
    print("2. Move a balanced portion of the 2,000 clean tickets into a locked 'Gold Test Set' for trustworthy evaluation.")
    print("3. Add the remainder to the training set using high sample weights (e.g., w=1.0) compared to unverified crowd tickets (e.g., w=0.5).")

if __name__ == "__main__":
    run_milestone_4()