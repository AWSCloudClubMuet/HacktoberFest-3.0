
"""
Milestone 4: Learning Curves and Model Diagnosis
Generates four individual graph images and one combined image.
These are illustrative curves, not results from model training.
"""

import os
import numpy as np
import matplotlib.pyplot as plt

# Create an output folder
OUTPUT_DIR = "milestone4_graphs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

epochs = np.arange(1, 21)

# Illustrative curves ending at the accuracy values in the assignment
scenarios = {
    "A": {
        "train": np.linspace(0.54, 0.62, 20),
        "val": np.linspace(0.52, 0.60, 20),
        "title": "A - Underfitting (High Bias)",
        "diagnosis": "Both accuracies are low and close.",
        "filename": "scenario_A_underfitting.png",
    },
    "B": {
        "train": np.linspace(0.65, 0.99, 20),
        "val": np.linspace(0.56, 0.78, 20),
        "title": "B - Overfitting (High Variance)",
        "diagnosis": "Training accuracy greatly exceeds validation.",
        "filename": "scenario_B_overfitting.png",
    },
    "C": {
        "train": np.linspace(0.63, 0.85, 20),
        "val": np.linspace(0.66, 0.91, 20),
        "title": "C - Potentially Healthy Generalization",
        "diagnosis": "Validation accuracy is higher than training.",
        "filename": "scenario_C_generalization.png",
    },
    "D": {
        "train": np.linspace(0.58, 0.88, 20),
        "val": np.linspace(0.53, 0.70, 20),
        "title": "D - Persistent Generalization Gap",
        "diagnosis": "A large gap remains despite more data.",
        "filename": "scenario_D_persistent_gap.png",
    },
}


def create_graph(ax, scenario):
    ax.plot(
        epochs, scenario["train"],
        marker="o", markersize=3, label="Training accuracy"
    )
    ax.plot(
        epochs, scenario["val"],
        marker="o", markersize=3, label="Validation accuracy"
    )
    ax.set_title(scenario["title"])
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Accuracy")
    ax.set_ylim(0.4, 1.02)
    ax.set_xticks([1, 5, 10, 15, 20])
    ax.grid(True, alpha=0.3)
    ax.legend()
    ax.text(
        0.5, -0.23, scenario["diagnosis"],
        transform=ax.transAxes,
        ha="center", wrap=True, fontsize=9
    )


def main():
    print("MILESTONE 4: LEARNING CURVE GRAPHS\n")

    # Create one image for each scenario
    for name, scenario in scenarios.items():
        fig, ax = plt.subplots(figsize=(8, 5))
        create_graph(ax, scenario)
        fig.tight_layout()

        path = os.path.join(OUTPUT_DIR, scenario["filename"])
        fig.savefig(path, dpi=200, bbox_inches="tight")
        plt.close(fig)

        print(f"Scenario {name}: {scenario['title']}")
        print(f"  Training accuracy:   {scenario['train'][-1]:.0%}")
        print(f"  Validation accuracy: {scenario['val'][-1]:.0%}")
        print(f"  Saved image: {path}\n")

    # Create a combined image containing all four graphs
    fig, axes = plt.subplots(2, 2, figsize=(13, 9))

    for ax, (name, scenario) in zip(axes.flat, scenarios.items()):
        create_graph(ax, scenario)

    fig.suptitle(
        "Milestone 4: Learning Curves and Model Diagnosis",
        fontsize=16
    )
    fig.tight_layout(rect=[0, 0.02, 1, 0.95])

    combined_path = os.path.join(OUTPUT_DIR, "all_scenarios.png")
    fig.savefig(combined_path, dpi=200, bbox_inches="tight")
    plt.close(fig)

    print(f"Combined image saved: {combined_path}")
    print("\nAll five images generated successfully.")
    print("Note: These are illustrative curves, not trained-model results.")


if __name__ == "__main__":
    main()
