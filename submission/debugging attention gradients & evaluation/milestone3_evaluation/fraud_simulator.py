"""
Milestone 3: Card-Transaction Fraud Simulation
Simulates realistic credit card transactions with:
- 0.1% extreme class imbalance (1 fraud per 1,000 transactions)
- Realistic temporal timestamps spanning 12 months
- Delayed label arrival: Chargebacks mature 30 to 60 days after transaction date
- Production Drift: Concept & Covariate drift injected in later months (adversarial shift)
"""

import numpy as np
import pandas as pd


def generate_fraud_dataset(n_samples=50000, start_date="2025-01-01", random_state=42):
    """
    Generates a realistic temporal transaction dataset.
    Features:
        - transaction_id: Unique string ID
        - timestamp: datetime of transaction
        - amount: Transaction dollar amount (log-normal distribution)
        - hour_of_day: 0 to 23
        - distance_from_home: Miles from cardholder residence
        - velocity_24h: Number of transactions in previous 24 hours
        - international_txn: Boolean flag
        - is_fraud: True label (0 or 1) - base rate 0.001 (0.1%)
        - label_available_date: Timestamp when chargeback label is confirmed (30-60 day delay)
    """
    np.random.seed(random_state)

    start_ts = pd.to_datetime(start_date)
    # Uniformly distribute transactions over 365 days
    days_offset = np.random.uniform(0, 365, size=n_samples)
    timestamps = [start_ts + pd.Timedelta(days=d) for d in days_offset]
    timestamps = pd.to_datetime(timestamps)

    # Base features
    # Amount is log-normal
    amounts = np.random.lognormal(mean=3.8, sigma=1.1, size=n_samples)
    hours = timestamps.hour.values
    distances = np.random.exponential(scale=15.0, size=n_samples)
    velocities = np.random.poisson(lam=2.5, size=n_samples)
    intl = np.random.binomial(n=1, p=0.04, size=n_samples)

    # Baseline fraud probability: ~0.001 (0.1%)
    # Fraudsters typically make higher amounts, odd hours, high velocity, foreign transactions
    fraud_logits = (
        -8.5
        + 0.008 * amounts
        + 0.05 * distances
        + 0.35 * velocities
        + 1.8 * intl
        + 0.15 * np.sin(2 * np.pi * hours / 24.0)
    )

    # Simulate Concept Drift starting at day 240 (Month 9):
    # Fraudsters change tactics (e.g. lower transaction amounts to evade detection, high domestic velocity)
    is_late_period = days_offset >= 240
    fraud_logits[is_late_period] += (
        0.5 * velocities[is_late_period]
        - 0.004 * amounts[is_late_period]
        + 1.2
    )

    fraud_probs = 1.0 / (1.0 + np.exp(-fraud_logits))
    # Calibrate to enforce overall prevalence ~0.001
    fraud_probs = fraud_probs / fraud_probs.mean() * 0.001
    fraud_probs = np.clip(fraud_probs, 1e-6, 0.95)

    is_fraud = np.random.binomial(n=1, p=fraud_probs, size=n_samples)

    # Label arrival delay: 30 to 60 days uniform delay for fraud chargebacks;
    # non-fraud disputes also mature at 60 days
    label_delays_days = np.random.uniform(30, 60, size=n_samples)
    label_available_dates = [
        ts + pd.Timedelta(days=delay) for ts, delay in zip(timestamps, label_delays_days)
    ]

    df = pd.DataFrame({
        "transaction_id": [f"TXN_{i:07d}" for i in range(n_samples)],
        "timestamp": timestamps,
        "amount": amounts,
        "hour_of_day": hours,
        "distance_from_home": distances,
        "velocity_24h": velocities,
        "international_txn": intl,
        "is_fraud": is_fraud,
        "label_available_date": pd.to_datetime(label_available_dates),
    })

    # Sort strictly by transaction timestamp
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df


if __name__ == "__main__":
    df = generate_fraud_dataset(n_samples=10000)
    print(f"Dataset generated: {len(df)} transactions")
    print(f"Fraud prevalence: {df['is_fraud'].mean():.4%}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
