"""
Camp Needs Service
Handles camp resource requirements, priority, fulfillment tracking, and critical gap identification.
"""

from typing import List, Dict, Any, Optional, Tuple
from services.api_client import client

class NeedService:
    @staticmethod
    def get_all_needs() -> Tuple[List[Dict[str, Any]], Optional[str]]:
        success, data, err = client.get("needs")
        if not success:
            return [], err
        return data or [], None

    @staticmethod
    def get_need_by_id(need_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        success, data, err = client.get(f"needs/{need_id}")
        if not success:
            return None, err
        return data, None

    @classmethod
    def get_needs_by_camp(cls, camp_id: str) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        all_needs, err = cls.get_all_needs()
        if err:
            return [], err
        return [n for n in all_needs if str(n.get("camp_id")) == str(camp_id)], None

    @staticmethod
    def calculate_fulfillment_ratio(need: Dict[str, Any]) -> float:
        req = float(need.get("required_quantity", 0))
        ful = float(need.get("fulfilled_quantity", 0))
        if req <= 0:
            return 1.0
        return min(1.0, max(0.0, ful / req))

    @staticmethod
    def is_critical_gap(need: Dict[str, Any]) -> bool:
        """
        Milestone 5 Rule: High-priority needs under 40% fulfilment.
        """
        priority = need.get("priority", "")
        req = float(need.get("required_quantity", 0))
        ful = float(need.get("fulfilled_quantity", 0))
        if priority != "High" or req <= 0:
            return False
        return (ful / req) < 0.40

    @classmethod
    def get_remaining_unreserved(cls, need_id: str) -> Tuple[int, Optional[str]]:
        """
        Milestone 3 Rule:
        Remaining unreserved quantity = required - fulfilled - other Pending/In Transit dispatches
        """
        need, err = cls.get_need_by_id(need_id)
        if not need:
            return 0, err

        req = int(need.get("required_quantity", 0))
        ful = int(need.get("fulfilled_quantity", 0))

        # Fetch dispatches
        success, dispatches, err_d = client.get("dispatches")
        active_dispatches_qty = 0
        if success and dispatches:
            for d in dispatches:
                if str(d.get("need_id")) == str(need_id) and d.get("status") in ("Pending", "In Transit"):
                    active_dispatches_qty += int(d.get("quantity", 0))

        unreserved = req - ful - active_dispatches_qty
        return max(0, unreserved), None

    @classmethod
    def add_need(cls, camp_id: str, inventory_item_id: str, required_quantity: int,
                 priority: str = "Medium", fulfilled_quantity: int = 0) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        if not camp_id or not inventory_item_id:
            return False, None, "Camp and inventory item must be selected."
        if required_quantity <= 0:
            return False, None, "Required quantity must be greater than 0."
        if fulfilled_quantity < 0:
            return False, None, "Fulfilled quantity cannot be negative."

        payload = {
            "camp_id": str(camp_id),
            "inventory_item_id": str(inventory_item_id),
            "required_quantity": int(required_quantity),
            "priority": priority,
            "fulfilled_quantity": int(fulfilled_quantity)
        }
        success, data, err = client.post("needs", payload)
        return success, data, err

    @classmethod
    def update_need(cls, need_id: str, update_data: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        if "required_quantity" in update_data and int(update_data["required_quantity"]) <= 0:
            return False, None, "Required quantity must be greater than 0."
        if "fulfilled_quantity" in update_data and int(update_data["fulfilled_quantity"]) < 0:
            return False, None, "Fulfilled quantity cannot be negative."

        success, data, err = client.patch(f"needs/{need_id}", update_data)
        return success, data, err

    @classmethod
    def delete_need(cls, need_id: str) -> Tuple[bool, Optional[str]]:
        # Check active dispatches
        success, dispatches, _ = client.get("dispatches")
        if success and dispatches:
            active = [d for d in dispatches if str(d.get("need_id")) == str(need_id) and d.get("status") in ("Pending", "In Transit")]
            if active:
                return False, f"Cannot delete need: {len(active)} active dispatch(es) are associated with it."

        success_del, _, err = client.delete(f"needs/{need_id}")
        return success_del, err
