import numpy as np
import pandas as pd

def run_milestone_5():
    print("Two training-time methods that tolerate residual label noise:")
    print("1. Forward Loss Correction: Multiply the model's softmax probabilities by the estimated label transition matrix (derived in Milestone 2) before computing cross-entropy loss to account for systematic flips.")
    print("2. Confident Learning / Pruning: Use out-of-fold predicted probabilities to identify and filter out likely mislabeled examples prior to final training.\n")

    print("How to construct a trustworthy evaluation set:")
    print("Set aside the 5,000 tickets labeled entirely by in-house expert agents. Do not use these for training. Stratify them to match the underlying class distribution (30% Billing, 15% Refund, etc.) and split them into a Clean Validation Set (for tuning) and a Gold Benchmark Test Set (for final evaluation).\n")

    print("Why the existing crowd-labeled test set is problematic:")
    print("The held-out test set contains the exact same systematic errors (~15% noise) as the training set because it used the same crowd workers. An 82% accuracy ceiling on this test set does not mean the model failed to learn; it means the model is being penalized when it correctly predicts the true label over a flawed human label.")

if __name__ == "__main__":
    run_milestone_5()