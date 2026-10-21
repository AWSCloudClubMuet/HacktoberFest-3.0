
import numpy as np

CLASSES = [
    "Billing",
    "Refund",
    "Technical",
    "Account Access",
    "Shipping",
    "Other"
]


def smooth_target(label_index, num_classes=6, epsilon=0.1):
    """Create a label-smoothed target distribution."""
    if not 0 <= label_index < num_classes:
        raise ValueError("Invalid class index")

    if not 0 <= epsilon <= 1:
        raise ValueError("Epsilon must be between 0 and 1")

    target = np.full(num_classes, epsilon / num_classes)
    target[label_index] += 1 - epsilon
    return target


def cross_entropy(target, predictions):
    """Compute cross-entropy using class probabilities."""
    probabilities = np.asarray(predictions, dtype=float)

    if not np.all(np.isfinite(probabilities)):
        raise ValueError("Predictions must be finite")

    if np.any(probabilities < 0) or not np.isclose(
        probabilities.sum(), 1.0
    ):
        raise ValueError("Predictions must sum to 1")

    probabilities = np.clip(probabilities, 1e-12, 1.0)

    return float(-np.sum(target * np.log(probabilities)))


def run_demo():
    label_index = CLASSES.index("Refund")

    predictions = np.array([
        0.10,  # Billing
        0.70,  # Refund
        0.08,  # Technical
        0.05,  # Account Access
        0.04,  # Shipping
        0.03   # Other
    ])

    ordinary_target = smooth_target(
        label_index, epsilon=0.0
    )
    smoothed_target = smooth_target(
        label_index, epsilon=0.1
    )

    print("Milestone 5: Label Smoothing Demonstration")
    print("-" * 50)

    for name, ordinary, smoothed in zip(
        CLASSES, ordinary_target, smoothed_target
    ):
        print(
            f"{name:15s} Original={ordinary:.4f} "
            f"Smoothed={smoothed:.4f}"
        )

    ordinary_loss = cross_entropy(
        ordinary_target, predictions
    )
    smoothed_loss = cross_entropy(
        smoothed_target, predictions
    )

    print("\nOrdinary cross-entropy:", round(ordinary_loss, 4))
    print("Smoothed cross-entropy:", round(smoothed_loss, 4))
    print("\nDemonstration only: no model was trained.")


if __name__ == "__main__":
    run_demo()
