"""MILESTONE 3 - what is the model's TRUE accuracy if 15% of test labels are flipped uniformly?"""
import numpy as np
K = 6
def true_acc(obs, eta, K=6):
    # obs = a*(1-eta) + (1-a)*eta/(K-1)   ->  solve for a
    return (obs - eta/(K-1)) / (1 - eta - eta/(K-1))

obs = 0.82
print(f"Noisy-test accuracy = {obs}; eta = 0.15")
print(f"  true accuracy = ({obs} - 0.15/5) / (1 - 0.15 - 0.15/5) = {true_acc(obs,.15):.4f}")
print(f"  (shortcut ignoring chance-agreement: 0.82/0.85 = {0.82/0.85:.4f})")
print("\nSensitivity to the noise rate (use the CI from Milestone 1):")
for eta in [0.10, 0.116, 0.13, 0.15, 0.17, 0.185]:
    print(f"  eta={eta:.3f} -> true acc = {true_acc(obs, eta):.3f}   (max measurable acc on noisy test = {1-eta:.3f})")
