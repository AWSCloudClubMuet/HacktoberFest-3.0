"""
HelpDeskNet-50K — Milestone 4: Expert Review Selection Strategy (2,000 Tickets)
Team SheNova

This module implements the selection algorithm, input validation, stratified
allocation, and audit trail tracking for prioritizing 2,000 tickets for expert review.

DATA INTEGRITY NOTICE:
The real ticket-level dataset is unavailable. This code provides the operational
selection logic designed to run on future real records. Small synthetic fixtures
used in unit tests are explicitly marked as software test fixtures and are not
observations from the HelpDeskNet-50K dataset.
"""

import sys
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass
import pandas as pd
import numpy as np

# Ensure stdout supports Unicode characters across all platforms
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


@dataclass(frozen=True)
class ReviewAllocationPlan:
    """Proposed allocation plan for 2,000 tickets."""
    high_risk_target: int = 1000
    stratified_target: int = 600
    random_target: int = 400
    
    @property
    def total_target(self) -> int:
        return self.high_risk_target + self.stratified_target + self.random_target


PROPOSED_PLAN = ReviewAllocationPlan()

REQUIRED_COLUMNS = {"ticket_id", "crowd_label", "worker_tier", "risk_score"}
VALID_CLASSES = {"Billing", "Refund", "Technical", "Account Access", "Shipping", "Other"}
VALID_TIERS = {"Tier A", "Tier B"}


@dataclass
class ExpertReviewAuditRecord:
    """Audit trail record for an individual ticket reviewed by an expert."""
    ticket_id: str
    original_crowd_label: str
    worker_tier: str
    selection_group: str
    expert_label: Optional[str] = None
    reviewer_id: Optional[str] = None
    review_status: str = "PENDING_REVIEW" # PENDING_REVIEW, COMPLETED, ESCALATED_ADJUDICATION
    is_disagreement: Optional[bool] = None
    correction_rationale: Optional[str] = None
    
    def record_expert_review(self, expert_label: str, reviewer_id: str, rationale: Optional[str] = None):
        """Records the expert's judgment while strictly preserving the original crowd label."""
        if expert_label not in VALID_CLASSES:
            raise ValueError(f"Invalid expert label '{expert_label}'. Must be one of {VALID_CLASSES}")
        self.expert_label = expert_label
        self.reviewer_id = reviewer_id
        self.is_disagreement = (self.original_crowd_label != expert_label)
        self.correction_rationale = rationale
        self.review_status = "COMPLETED"

    def escalate_for_adjudication(self, reviewer_id: str, notes: str):
        """Escalates an ambiguous ticket to a secondary expert committee."""
        self.reviewer_id = reviewer_id
        self.review_status = "ESCALATED_ADJUDICATION"
        self.correction_rationale = f"ADJUDICATION_REQUESTED: {notes}"


class TicketSelectionPipeline:
    """
    Executes deterministic, deduplicated sequential selection of tickets
    across High-Risk, Stratified, and Random groups.
    """
    def __init__(self, plan: ReviewAllocationPlan = PROPOSED_PLAN):
        self.plan = plan

    def validate_input_dataframe(self, df: pd.DataFrame) -> None:
        """Validates that input DataFrame satisfies the required schema."""
        if not isinstance(df, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame.")
        missing_cols = REQUIRED_COLUMNS - set(df.columns)
        if missing_cols:
            raise ValueError(f"Input DataFrame is missing required columns: {sorted(list(missing_cols))}")
        if df["ticket_id"].duplicated().any():
            raise ValueError("Input DataFrame contains duplicate 'ticket_id' entries.")
        if not df["risk_score"].dtype.kind in "fc": # float or int
            raise ValueError("'risk_score' must be numeric.")
        
        # Verify valid categories if present
        invalid_classes = set(df["crowd_label"].unique()) - VALID_CLASSES
        if invalid_classes:
            raise ValueError(f"Unrecognized class labels in crowd_label: {invalid_classes}")
        invalid_tiers = set(df["worker_tier"].unique()) - VALID_TIERS
        if invalid_tiers:
            raise ValueError(f"Unrecognized worker tiers in worker_tier: {invalid_tiers}")

    def select_tickets(
        self,
        df: pd.DataFrame,
        random_seed: int = 42
    ) -> Dict[str, Any]:
        """
        Executes sequential selection with strict deduplication:
          1. Select top high_risk_target tickets by risk_score.
          2. From remainder, select stratified_target tickets across (crowd_label, worker_tier).
          3. From remainder, select random_target tickets randomly with seed.
        """
        self.validate_input_dataframe(df)
        total_available = len(df)
        if total_available < self.plan.total_target:
            raise ValueError(
                f"Available ticket count ({total_available}) is less than total planned target ({self.plan.total_target}). "
                "Per project rules, tickets are never fabricated to meet quotas."
            )

        selected_ids: Set[str] = set()
        
        # --- Step 1: High-Risk Selection ---
        # Sort by risk_score descending, break ties deterministically by ticket_id
        df_sorted_risk = df.sort_values(by=["risk_score", "ticket_id"], ascending=[False, True])
        high_risk_df = df_sorted_risk.head(self.plan.high_risk_target).copy()
        high_risk_df["selection_group"] = "High-Risk"
        selected_ids.update(high_risk_df["ticket_id"])
        
        # Pool remaining after high-risk
        remaining_after_step1 = df[~df["ticket_id"].isin(selected_ids)].copy()

        # --- Step 2: Stratified Selection across (crowd_label, worker_tier) ---
        # 6 classes * 2 tiers = 12 strata.
        # Balanced target = 600 / 12 = 50 tickets per stratum.
        num_strata = len(VALID_CLASSES) * len(VALID_TIERS) # 12
        base_quota_per_stratum = self.plan.stratified_target // num_strata # 50
        
        stratified_records = []
        shortfall = 0
        
        # Deterministic ordering of strata
        for c in sorted(list(VALID_CLASSES)):
            for t in sorted(list(VALID_TIERS)):
                stratum_df = remaining_after_step1[
                    (remaining_after_step1["crowd_label"] == c) & 
                    (remaining_after_step1["worker_tier"] == t)
                ].sort_values(by=["ticket_id"])
                
                avail_in_stratum = len(stratum_df)
                take = min(avail_in_stratum, base_quota_per_stratum)
                if take > 0:
                    stratified_records.append(stratum_df.head(take))
                if take < base_quota_per_stratum:
                    shortfall += (base_quota_per_stratum - take)

        if stratified_records:
            stratified_df = pd.concat(stratified_records, ignore_index=True)
        else:
            stratified_df = pd.DataFrame(columns=df.columns)

        # Handle shortfall if any stratum had < 50 tickets by drawing from remaining
        if shortfall > 0:
            strata_selected_ids = set(stratified_df["ticket_id"])
            remaining_for_shortfall = remaining_after_step1[
                ~remaining_after_step1["ticket_id"].isin(strata_selected_ids)
            ].sort_values(by=["risk_score", "ticket_id"], ascending=[False, True])
            
            fill = remaining_for_shortfall.head(shortfall)
            stratified_df = pd.concat([stratified_df, fill], ignore_index=True)

        stratified_df["selection_group"] = "Stratified Coverage"
        selected_ids.update(stratified_df["ticket_id"])

        # --- Step 3: Representative Random Sampling ---
        remaining_after_step2 = df[~df["ticket_id"].isin(selected_ids)].copy()
        rng = np.random.RandomState(random_seed)
        
        random_indices = rng.choice(
            len(remaining_after_step2),
            size=self.plan.random_target,
            replace=False
        )
        random_df = remaining_after_step2.iloc[random_indices].copy()
        random_df["selection_group"] = "Representative Random"
        selected_ids.update(random_df["ticket_id"])

        # Combine all selections
        all_selected = pd.concat([high_risk_df, stratified_df, random_df], ignore_index=True)
        
        # Verify deduplication
        assert len(selected_ids) == self.plan.total_target, "Deduplication check failed!"
        assert len(all_selected) == self.plan.total_target, "Total selection count mismatch!"

        return {
            "high_risk": high_risk_df,
            "stratified": stratified_df,
            "random": random_df,
            "combined": all_selected,
            "counts": {
                "High-Risk": len(high_risk_df),
                "Stratified Coverage": len(stratified_df),
                "Representative Random": len(random_df),
                "Total Selected": len(all_selected)
            }
        }


def print_milestone4_plan_summary():
    """Prints the proposed 2,000-ticket expert review allocation plan."""
    print("=" * 70)
    print("HELPDESKNET-50K — MILESTONE 4: PROPOSED 2,000-TICKET REVIEW PLAN")
    print("=" * 70)
    print(f"{'Selection Group':<35} | {'Planned Count':>15} | {'Share of Review':>15}")
    print("-" * 70)
    print(f"{'High-Risk Uncertainty Tickets':<35} | {PROPOSED_PLAN.high_risk_target:>15} | {PROPOSED_PLAN.high_risk_target / PROPOSED_PLAN.total_target * 100:>14.1f}%")
    print(f"{'Stratified Coverage (12 strata)':<35} | {PROPOSED_PLAN.stratified_target:>15} | {PROPOSED_PLAN.stratified_target / PROPOSED_PLAN.total_target * 100:>14.1f}%")
    print(f"{'Representative Random Sample':<35} | {PROPOSED_PLAN.random_target:>15} | {PROPOSED_PLAN.random_target / PROPOSED_PLAN.total_target * 100:>14.1f}%")
    print("-" * 70)
    print(f"{'TOTAL PLANNED ALLOCATION':<35} | {PROPOSED_PLAN.total_target:>15} | {100.0:>14.1f}%")
    print("=" * 70)
    print("STATUS: Plan and deterministic selection algorithm implemented.")
    print("DATA NOTICE: No actual HelpDeskNet-50K ticket records have been selected or modified.")
    print("=" * 70)


if __name__ == "__main__":
    print_milestone4_plan_summary()
