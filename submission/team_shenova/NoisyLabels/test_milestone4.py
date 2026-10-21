"""
HelpDeskNet-50K — Automated Test Suite for Milestone 4
Team SheNova

Tests independently verify the 2,000-ticket review allocation plan,
deterministic deduplication, schema validation, reproducible random sampling,
empty/small strata handling, audit trail record integrity, and regression
against Milestones 1, 2, and 3.

DATA INTEGRITY NOTICE:
All synthetic test DataFrames in this test file are explicitly marked as
software unit test fixtures and do not represent real HelpDeskNet-50K tickets.
"""

import unittest
import pandas as pd
import numpy as np

from milestone4_selection import (
    PROPOSED_PLAN,
    ReviewAllocationPlan,
    TicketSelectionPipeline,
    ExpertReviewAuditRecord,
    VALID_CLASSES,
    VALID_TIERS,
)
from test_milestone1 import run_milestone1_verification
from milestone2_analysis import get_transition_summary
from milestone3_analysis import estimate_true_accuracy


def make_software_test_fixture(n_records: int = 2500, seed: int = 123) -> pd.DataFrame:
    """
    Creates an explicitly labeled software test fixture for testing
    pipeline selection and deduplication logic.
    NOT REAL HELPDESKNET-50K DATA.
    """
    rng = np.random.RandomState(seed)
    classes = sorted(list(VALID_CLASSES))
    tiers = sorted(list(VALID_TIERS))
    
    data = {
        "ticket_id": [f"TEST_FIXTURE_TICKET_{i:05d}" for i in range(n_records)],
        "crowd_label": [classes[i % len(classes)] for i in range(n_records)],
        "worker_tier": [tiers[i % len(tiers)] for i in range(n_records)],
        "risk_score": rng.uniform(0.0, 1.0, size=n_records).round(4),
        "fixture_provenance": "SYNTHETIC_UNIT_TEST_FIXTURE_DO_NOT_TREAT_AS_REAL_DATA"
    }
    return pd.DataFrame(data)


class TestMilestone4(unittest.TestCase):
    def test_planned_allocation_sum(self):
        """Verify that the planned allocation is exactly 1,000 + 600 + 400 = 2,000."""
        plan = PROPOSED_PLAN
        self.assertEqual(plan.high_risk_target, 1000)
        self.assertEqual(plan.stratified_target, 600)
        self.assertEqual(plan.random_target, 400)
        self.assertEqual(plan.total_target, 2000)
        self.assertEqual(
            plan.high_risk_target + plan.stratified_target + plan.random_target,
            2000
        )

    def test_deduplication_and_selection_counts(self):
        """
        Verify that sequential selection produces exactly 2,000 unique records
        with zero overlap between High-Risk, Stratified, and Random groups.
        """
        fixture_df = make_software_test_fixture(n_records=2500, seed=42)
        pipeline = TicketSelectionPipeline(plan=PROPOSED_PLAN)
        
        results = pipeline.select_tickets(fixture_df, random_seed=999)
        
        high_risk_ids = set(results["high_risk"]["ticket_id"])
        stratified_ids = set(results["stratified"]["ticket_id"])
        random_ids = set(results["random"]["ticket_id"])
        combined_ids = set(results["combined"]["ticket_id"])
        
        # Verify disjoint sets (zero duplicate tickets across groups)
        self.assertEqual(len(high_risk_ids.intersection(stratified_ids)), 0, "High-Risk and Stratified overlap!")
        self.assertEqual(len(high_risk_ids.intersection(random_ids)), 0, "High-Risk and Random overlap!")
        self.assertEqual(len(stratified_ids.intersection(random_ids)), 0, "Stratified and Random overlap!")
        
        # Verify exact counts
        self.assertEqual(len(high_risk_ids), 1000)
        self.assertEqual(len(stratified_ids), 600)
        self.assertEqual(len(random_ids), 400)
        self.assertEqual(len(combined_ids), 2000)
        self.assertEqual(len(results["combined"]), 2000)

    def test_reproducible_random_sampling(self):
        """Verify that identical random seed produces identical selection outcomes."""
        fixture_df = make_software_test_fixture(n_records=2500, seed=10)
        pipeline = TicketSelectionPipeline(plan=PROPOSED_PLAN)
        
        res1 = pipeline.select_tickets(fixture_df, random_seed=777)
        res2 = pipeline.select_tickets(fixture_df, random_seed=777)
        res3 = pipeline.select_tickets(fixture_df, random_seed=888)
        
        # Same seed must match 100%
        pd.testing.assert_frame_equal(res1["random"], res2["random"])
        
        # Different seed should produce different random subset
        self.assertFalse(res1["random"]["ticket_id"].equals(res3["random"]["ticket_id"]))

    def test_schema_validation(self):
        """Verify informative error handling for invalid or missing columns and duplicate IDs."""
        pipeline = TicketSelectionPipeline()
        
        # Missing column
        bad_df1 = pd.DataFrame({"ticket_id": ["T1"], "crowd_label": ["Billing"], "worker_tier": ["Tier A"]})
        with self.assertRaises(ValueError) as cm:
            pipeline.validate_input_dataframe(bad_df1)
        self.assertIn("missing required columns", str(cm.exception))
        
        # Duplicate ticket_id
        bad_df2 = pd.DataFrame({
            "ticket_id": ["T1", "T1"],
            "crowd_label": ["Billing", "Refund"],
            "worker_tier": ["Tier A", "Tier B"],
            "risk_score": [0.5, 0.6]
        })
        with self.assertRaises(ValueError) as cm:
            pipeline.validate_input_dataframe(bad_df2)
        self.assertIn("duplicate 'ticket_id'", str(cm.exception))

        # Invalid category label
        bad_df3 = pd.DataFrame({
            "ticket_id": ["T1"],
            "crowd_label": ["UnknownCategory"],
            "worker_tier": ["Tier A"],
            "risk_score": [0.5]
        })
        with self.assertRaises(ValueError) as cm:
            pipeline.validate_input_dataframe(bad_df3)
        self.assertIn("Unrecognized class labels", str(cm.exception))

    def test_insufficient_data_error(self):
        """Verify pipeline refuses to fabricate data if pool < total planned quota."""
        small_fixture = make_software_test_fixture(n_records=1500) # Need 2000
        pipeline = TicketSelectionPipeline(plan=PROPOSED_PLAN)
        
        with self.assertRaises(ValueError) as cm:
            pipeline.select_tickets(small_fixture)
        self.assertIn("Per project rules, tickets are never fabricated to meet quotas", str(cm.exception))

    def test_expert_review_audit_record(self):
        """Verify that expert review audit records preserve original crowd labels and track rationale."""
        rec = ExpertReviewAuditRecord(
            ticket_id="T_AUDIT_001",
            original_crowd_label="Billing",
            worker_tier="Tier B",
            selection_group="High-Risk"
        )
        self.assertEqual(rec.review_status, "PENDING_REVIEW")
        self.assertEqual(rec.original_crowd_label, "Billing")
        
        # Record review with disagreement
        rec.record_expert_review(
            expert_label="Refund",
            reviewer_id="EXPERT_AGENT_07",
            rationale="Customer explicitly requested charge reversal; Rule 1 applied."
        )
        self.assertEqual(rec.original_crowd_label, "Billing", "Original label must be preserved!")
        self.assertEqual(rec.expert_label, "Refund")
        self.assertTrue(rec.is_disagreement)
        self.assertEqual(rec.reviewer_id, "EXPERT_AGENT_07")
        self.assertEqual(rec.review_status, "COMPLETED")
        self.assertIn("Rule 1 applied", rec.correction_rationale)

        # Test adjudication escalation
        rec_adj = ExpertReviewAuditRecord(
            ticket_id="T_AUDIT_002",
            original_crowd_label="Technical",
            worker_tier="Tier A",
            selection_group="Stratified Coverage"
        )
        rec_adj.escalate_for_adjudication(
            reviewer_id="EXPERT_AGENT_03",
            notes="Compound query: customer describes system error during password reset."
        )
        self.assertEqual(rec_adj.review_status, "ESCALATED_ADJUDICATION")
        self.assertIn("ADJUDICATION_REQUESTED", rec_adj.correction_rationale)

    def test_regression_milestones_1_2_3(self):
        """Verify that Milestone 1, 2, and 3 calculations and tests continue to pass without regression."""
        # Milestone 1
        try:
            run_milestone1_verification()
        except Exception as e:
            self.fail(f"Milestone 1 regression failed: {e}")
            
        # Milestone 2
        m2_transitions = get_transition_summary()
        self.assertEqual(sum(t["count"] for t in m2_transitions), 60)
        
        # Milestone 3
        a_true = estimate_true_accuracy(a_noisy=0.82, q=0.15, k=6)
        self.assertAlmostEqual(a_true, 79.0 / 82.0, places=6)


if __name__ == "__main__":
    unittest.main()
