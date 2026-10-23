import numpy as np
import pandas as pd

def run_milestone_3():
    k_classes = 6
    acc_noisy = 0.82
    eta = 0.15

    p_correct_label = 1.0 - eta
    p_flipped_to_specific = eta / (k_classes - 1)

    scale_factor = p_correct_label - p_flipped_to_specific
    acc_true = (acc_noisy - p_flipped_to_specific) / scale_factor

    print(f"Observed Accuracy: {acc_noisy:.2f}")
    print(f"Calculated True Accuracy: {acc_true:.4f}\n")

    noise_range = np.linspace(0.05, 0.25, 5)
    inferred_trues = [
        (acc_noisy - (n / (k_classes - 1))) / ((1.0 - n) - (n / (k_classes - 1)))
        for n in noise_range
    ]

    df_sensitivity = pd.DataFrame({
        "Assumed Noise": [f"{n*100:.1f}%" for n in noise_range],
        "Inferred True Accuracy": [f"{t*100:.2f}%" for t in inferred_trues],
    })

    print("Sensitivity Analysis:")
    print(df_sensitivity.to_string(index=False))

    print("\nWhy this estimate is unreliable:")
    print("1. Non-Uniform Noise: Errors are heavily concentrated between specific classes (e.g., Billing vs. Refund), not distributed evenly.")
    print("2. Correlated Test Noise: The model memorizes systematic crowd biases from training and gets rewarded for predicting those same errors on the noisy test set.")

if __name__ == "__main__":
    run_milestone_3()