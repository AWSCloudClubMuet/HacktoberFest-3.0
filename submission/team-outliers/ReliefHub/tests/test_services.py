"""
ReliefHub Comprehensive Test Suite
Validates all business rules, calculations, and constraints from GitHub Issue #10.
"""

import pytest
import os
import sys

# Ensure ReliefHub root is on python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.camp_service import CampService
from services.inventory_service import InventoryService
from services.need_service import NeedService
from services.dispatch_service import DispatchService
from services.donation_service import DonationService
from services.volunteer_service import VolunteerService

def test_camp_capacity_rules():
    """Milestone 1: Automatically mark a camp Full when current families reach capacity."""
    # When families reach capacity
    status = CampService._apply_capacity_rule(capacity=100, current_families=100, requested_status="Active")
    assert status == "Full"

    # When families exceed capacity
    status = CampService._apply_capacity_rule(capacity=100, current_families=105, requested_status="Active")
    assert status == "Full"

    # When families drop below capacity from Full
    status = CampService._apply_capacity_rule(capacity=100, current_families=80, requested_status="Full")
    assert status == "Active"

    # Explicit Closed status is preserved
    status = CampService._apply_capacity_rule(capacity=100, current_families=50, requested_status="Closed")
    assert status == "Closed"

def test_inventory_low_stock_detection():
    """Milestone 2: Highlight items at or below their reorder level as Low Stock."""
    healthy_item = {"stock": 100, "reorder_level": 30}
    assert InventoryService.is_low_stock(healthy_item) is False

    borderline_item = {"stock": 30, "reorder_level": 30}
    assert InventoryService.is_low_stock(borderline_item) is True

    depleted_item = {"stock": 15, "reorder_level": 30}
    assert InventoryService.is_low_stock(depleted_item) is True

def test_need_fulfillment_and_critical_gaps():
    """Milestone 2 & 5: Need fulfillment progress and Critical Gaps rule."""
    need_healthy = {
        "required_quantity": 100,
        "fulfilled_quantity": 80,
        "priority": "High"
    }
    assert NeedService.calculate_fulfillment_ratio(need_healthy) == 0.8
    assert NeedService.is_critical_gap(need_healthy) is False

    # High priority and < 40% fulfillment -> Critical Gap
    need_critical = {
        "required_quantity": 100,
        "fulfilled_quantity": 30,
        "priority": "High"
    }
    assert NeedService.calculate_fulfillment_ratio(need_critical) == 0.3
    assert NeedService.is_critical_gap(need_critical) is True

    # Medium priority with < 40% fulfillment is NOT Critical Gap (only High priority)
    need_med = {
        "required_quantity": 100,
        "fulfilled_quantity": 20,
        "priority": "Medium"
    }
    assert NeedService.is_critical_gap(need_med) is False

def test_volunteer_closed_camp_restriction():
    """Milestone 4: Volunteers cannot be assigned to a Closed camp."""
    # Camp 7 in seed data is 'Closed'
    success, _, err = VolunteerService.assign_to_camp("11", "7")
    assert success is False
    assert "Closed" in str(err)

def test_volunteer_unassignment():
    """Milestone 4: Setting camp_id=None unassigns volunteer."""
    # Assign volunteer 11 to active camp 2 first
    s1, _, _ = VolunteerService.assign_to_camp("11", "2")
    assert s1 is True

    # Unassign
    s2, updated, _ = VolunteerService.assign_to_camp("11", None)
    assert s2 is True
    assert updated.get("camp_id") is None

def test_dispatch_over_dispatch_protection():
    """Milestone 3: Never dispatch more than available warehouse stock."""
    # Attempting to dispatch an absurd quantity like 999999
    success, _, err = DispatchService.create_dispatch(camp_id="2", need_id="4", quantity=999999)
    assert success is False
    assert "Insufficient warehouse stock" in str(err) or "exceeds" in str(err)

def test_in_kind_donation_restocks_inventory():
    """Milestone 4: In-kind contributions increase item stock."""
    # Read current stock of item 1
    item_before, _ = InventoryService.get_item_by_id("1")
    initial_stock = int(item_before["stock"])

    # Record in-kind donation of 10 units
    success, don, _ = DonationService.record_donation(
        donation_type="In-Kind",
        amount_or_quantity=10,
        category="Food & Rations",
        donor_name="Unit Test Donor",
        item_id="1"
    )
    assert success is True

    # Check updated stock
    item_after, _ = InventoryService.get_item_by_id("1")
    assert int(item_after["stock"]) == initial_stock + 10

    # Cleanup to preserve database idempotency
    InventoryService.adjust_stock("1", -10)
    if don and "id" in don:
        from services.api_client import client
        client.delete(f"donations/{don['id']}")

def test_donation_summary_aggregation():
    """Milestone 4: Show total cash received and totals per donation category."""
    summary, err = DonationService.get_donation_summary()
    assert err is None
    assert summary["total_cash"] > 0
    assert summary["total_in_kind_units"] > 0
    assert len(summary["cash_by_category"]) > 0

def test_inventory_cannot_drop_negative():
    """Milestone 2: Stock quantities cannot become negative."""
    item, _ = InventoryService.get_item_by_id("1")
    current_stock = int(item["stock"])
    # Attempting to deduct more than available
    success, _, err = InventoryService.adjust_stock("1", -(current_stock + 100))
    assert success is False
    assert "Insufficient stock" in str(err)

def test_camp_prevent_deletion_with_dependencies():
    """Data Integrity: Prevent camp deletion if volunteers or active dispatches exist."""
    # Camp 1 has active volunteers assigned
    success, err = CampService.delete_camp("1")
    assert success is False
    assert "Cannot delete camp" in str(err)

def test_inventory_prevent_deletion_with_linked_needs():
    """Data Integrity: Prevent inventory item deletion if referenced by camp needs."""
    # Item 1 is required by camp needs
    success, err = InventoryService.delete_item("1")
    assert success is False
    assert "Cannot delete item" in str(err)

def test_api_collections_availability():
    """Phase 6: Verify all 6 mock REST API collections are healthy."""
    from services.api_client import client
    for endpoint in ("camps", "inventory", "needs", "dispatches", "donations", "volunteers"):
        ok, data, err = client.get(endpoint)
        assert ok is True
        assert err is None
        assert isinstance(data, list)
        assert len(data) > 0
