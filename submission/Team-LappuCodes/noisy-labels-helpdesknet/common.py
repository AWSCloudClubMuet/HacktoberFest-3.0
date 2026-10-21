"""Shared constants + data loader."""
import pandas as pd

CLASSES = ["Billing", "Refund", "Technical", "Account Access", "Shipping", "Other"]
C2I = {c: i for i, c in enumerate(CLASSES)}

def load():
    return pd.read_csv("data/helpdesknet.csv")
