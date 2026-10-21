import csv
import random
from pathlib import Path

CATEGORIES = [
    "Billing",
    "Refund",
    "Technical",
    "Account Access",
    "Shipping",
    "Other"
]

CATEGORY_WEIGHTS = [30, 15, 25, 15, 10, 5]

CONFUSION_PAIRS = {
    "Billing": "Refund",
    "Refund": "Billing",
    "Technical": "Account Access",
    "Account Access": "Technical",
    "Shipping": "Other",
    "Other": "Shipping"
}

def generate_synthetic_tickets(n=45000, seed=42):
    rng = random.Random(seed)
    tickets = []

    for i in range(n):
        true_label = rng.choices(
            CATEGORIES,
            weights=CATEGORY_WEIGHTS,
            k=1
        )[0]
        tier = "A" if i < 20000 else "B"
        noise_rate = 0.0667 if tier == "A" else 0.2182

        given_label = true_label

        if rng.random() < noise_rate:
            given_label = CONFUSION_PAIRS[true_label]
        predicted_label = true_label

        if rng.random() < 0.12:
            predicted_label = rng.choice(
                [c for c in CATEGORIES if c != true_label]
            )

        confidence = round(rng.uniform(0.55, 0.99), 3)

        tickets.append({
            "ticket_id": f"T{i+1:05d}",
            "tier": tier,
            "true_label": true_label,
            "given_label": given_label,
            "predicted_label": predicted_label,
            "confidence": confidence
        })

    return tickets


def save_tickets(tickets, filename="synthetic_tickets.csv"):
    output_dir = Path(__file__).resolve().parent.parent / "outputs"
    output_dir.mkdir(exist_ok=True)

    output_path = output_dir / filename

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=tickets[0].keys())
        writer.writeheader()
        writer.writerows(tickets)

    print(f"Created {len(tickets)} synthetic tickets")
    print(f"Saved to: {output_path}")


def select_review_tickets(tickets, budget=2000, seed=42):
    """Select unique tickets for expert review without using true labels."""
    rng = random.Random(seed)

    if budget < 0 or budget > len(tickets):
        raise ValueError("Invalid expert-review budget")

    ids = [t["ticket_id"] for t in tickets]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate ticket IDs found")

    selected = []
    used_ids = set()

    def add_candidates(candidates, count, reason):
        added = 0
        for ticket in candidates:
            if added >= count:
                break
            if ticket["ticket_id"] in used_ids:
                continue

            record = {
                k: v for k, v in ticket.items()
                if k != "true_label"
            }
            record["review_reason"] = reason
            selected.append(record)
            used_ids.add(ticket["ticket_id"])
            added += 1

    control_count = round(budget * 0.10)
    control = rng.sample(tickets, control_count)
    add_candidates(control, control_count, "random_control")

    remaining = [
        t for t in tickets if t["ticket_id"] not in used_ids
    ]

    disagreement = sorted(
        (
            t for t in remaining
            if t["given_label"] != t["predicted_label"]
        ),
        key=lambda t: float(t["confidence"]),
        reverse=True
    )

    add_candidates(
        disagreement,
        round(budget * 0.50),
        "high_confidence_disagreement"
    )

    # 25%: Known category confusion pairs
    known_pairs = {
        frozenset(("Billing", "Refund")),
        frozenset(("Technical", "Account Access")),
        frozenset(("Shipping", "Other"))
    }

    pair_candidates = sorted(
        (
            t for t in tickets
            if t["given_label"] != t["predicted_label"]
            and frozenset((
                t["given_label"], t["predicted_label"]
            )) in known_pairs
        ),
        key=lambda t: float(t["confidence"]),
        reverse=True
    )

    add_candidates(
        pair_candidates,
        round(budget * 0.25),
        "known_confusion_pair"
    )

    uncertain = sorted(
        tickets,
        key=lambda t: (
            t["given_label"] not in ("Other", "Shipping"),
            float(t["confidence"])
        )
    )

    add_candidates(
        uncertain,
        round(budget * 0.15),
        "uncertain_or_rare_class"
    )

    if len(selected) < budget:
        remaining = [
            t for t in tickets
            if t["ticket_id"] not in used_ids
        ]
        rng.shuffle(remaining)
        add_candidates(
            remaining,
            budget - len(selected),
            "budget_fallback"
        )

    assert len(selected) == budget
    assert len({t["ticket_id"] for t in selected}) == budget

    return selected


if __name__ == "__main__":
    tickets = generate_synthetic_tickets()
    save_tickets(tickets)

    review_queue = select_review_tickets(tickets)
    save_tickets(review_queue, "review_queue.csv")

    print("\nReview allocation:")
    reasons = sorted(set(t["review_reason"] for t in review_queue))

    for reason in reasons:
        count = sum(
            t["review_reason"] == reason
            for t in review_queue
        )
        print(f"{reason}: {count}")

    print(f"\nTotal selected: {len(review_queue)}")
    print("Unique tickets:", len({
        t["ticket_id"] for t in review_queue
    }))
