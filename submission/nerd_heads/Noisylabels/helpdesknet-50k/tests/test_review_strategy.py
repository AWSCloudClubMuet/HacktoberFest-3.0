
import pytest

from src.review_strategy import (
    generate_synthetic_tickets,
    select_review_tickets,
)


@pytest.fixture(scope="module")
def sample_tickets():
    return generate_synthetic_tickets(n=5000, seed=42)


def test_correct_budget(sample_tickets):
    selected = select_review_tickets(
        sample_tickets, budget=2000
    )
    assert len(selected) == 2000


def test_no_duplicate_ids(sample_tickets):
    selected = select_review_tickets(
        sample_tickets, budget=2000
    )
    ids = [ticket["ticket_id"] for ticket in selected]
    assert len(ids) == len(set(ids))


def test_no_true_label_leakage(sample_tickets):
    selected = select_review_tickets(
        sample_tickets, budget=2000
    )
    assert all(
        "true_label" not in ticket
        for ticket in selected
    )


def test_reproducibility(sample_tickets):
    first = select_review_tickets(
        sample_tickets, budget=2000, seed=42
    )
    second = select_review_tickets(
        sample_tickets, budget=2000, seed=42
    )
    assert first == second


def test_invalid_budget(sample_tickets):
    with pytest.raises(ValueError):
        select_review_tickets(
            sample_tickets, budget=6000
        )
