"""
Donations Management Service
Handles Cash and In-Kind donations, inventory restock, and financial aggregation.
"""

from datetime import date
from typing import List, Dict, Any, Optional, Tuple
from services.api_client import client
from services.inventory_service import InventoryService

class DonationService:
    @staticmethod
    def get_all_donations() -> Tuple[List[Dict[str, Any]], Optional[str]]:
        success, data, err = client.get("donations")
        if not success:
            return [], err
        return data or [], None

    @classmethod
    def record_donation(cls, donation_type: str, amount_or_quantity: float, category: str,
                        donor_name: str, item_id: Optional[str] = None,
                        donation_date: Optional[str] = None) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Milestone 4 Rule:
        - Record Cash or In-Kind donations.
        - In-kind contributions increase warehouse item stock immediately.
        """
        if donation_type not in ("Cash", "In-Kind"):
            return False, None, "Invalid donation type. Must be 'Cash' or 'In-Kind'."

        if amount_or_quantity <= 0:
            return False, None, "Amount or quantity must be greater than 0."

        if not category:
            return False, None, "Donation category is required."

        if not donor_name:
            donor_name = "Anonymous Donor"

        if donation_type == "In-Kind":
            if not item_id:
                return False, None, "An inventory item must be selected for in-kind donations."
            # Increase stock immediately
            adj_success, _, adj_err = InventoryService.adjust_stock(item_id, int(amount_or_quantity))
            if not adj_success:
                return False, None, f"Failed to restock inventory with donation: {adj_err}"

        payload = {
            "type": donation_type,
            "amount_or_quantity": amount_or_quantity,
            "item_id": str(item_id) if item_id else None,
            "category": category,
            "donor_name": donor_name.strip(),
            "date": donation_date or str(date.today())
        }

        success, data, err = client.post("donations", payload)
        if not success and donation_type == "In-Kind" and item_id:
            # Rollback inventory adjustment
            InventoryService.adjust_stock(item_id, -int(amount_or_quantity))
            return False, None, f"Failed to record donation: {err}"

        return success, data, err

    @classmethod
    def get_donation_summary(cls) -> Tuple[Dict[str, Any], Optional[str]]:
        donations, err = cls.get_all_donations()
        if err:
            return {}, err

        total_cash = 0.0
        total_in_kind_units = 0
        cash_by_category: Dict[str, float] = {}
        in_kind_by_category: Dict[str, int] = {}

        for d in donations:
            dtype = d.get("type")
            amt = float(d.get("amount_or_quantity", 0))
            cat = d.get("category", "General")

            if dtype == "Cash":
                total_cash += amt
                cash_by_category[cat] = cash_by_category.get(cat, 0.0) + amt
            elif dtype == "In-Kind":
                total_in_kind_units += int(amt)
                in_kind_by_category[cat] = in_kind_by_category.get(cat, 0) + int(amt)

        return {
            "total_cash": total_cash,
            "total_in_kind_units": total_in_kind_units,
            "cash_by_category": cash_by_category,
            "in_kind_by_category": in_kind_by_category,
            "total_records": len(donations)
        }, None
