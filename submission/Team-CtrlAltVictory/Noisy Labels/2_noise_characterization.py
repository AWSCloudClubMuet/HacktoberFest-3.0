import pandas as pd

def run_milestone_2():
    print("MILESTONE 2: CHARACTERIZE THE NOISE")

    disagreements = [
        ("Billing", "Refund", 14),
        ("Refund", "Billing", 12),
        ("Technical", "Account Access", 9),
        ("Shipping", "Other", 8),
        ("Account Access", "Technical", 6),
        ("Technical", "Other", 5),
        ("Other", "Shipping", 3),
        ("Billing", "Other", 3)
    ]

    df_errors = pd.DataFrame(disagreements, columns=["Crowd_Label", "Expert_Label", "Count"])
    total_errors = df_errors["Count"].sum()
    df_errors["Percent_of_Errors"] = (df_errors["Count"] / total_errors) * 100

    print("Breakdown of Errors by Transition:")
    print(df_errors.to_string(index=False))

    billing_refund = 14 + 12
    tech_access = 9 + 6
    shipping_other = 8 + 3

    print("\nSystematic Confusion Clusters:")
    print(f"1. Billing - Refund:            {billing_refund} errors ({billing_refund / total_errors * 100:.1f}%)")
    print(f"2. Technical - Account Access:   {tech_access} errors ({tech_access / total_errors * 100:.1f}%)")
    print(f"3. Shipping - Other:            {shipping_other} errors ({shipping_other / total_errors * 100:.1f}%)")
    print(f"Top 2 clusters account for {(billing_refund + tech_access) / total_errors * 100:.1f}% of all labeling mistakes.")

if __name__ == "__main__":
    run_milestone_2()