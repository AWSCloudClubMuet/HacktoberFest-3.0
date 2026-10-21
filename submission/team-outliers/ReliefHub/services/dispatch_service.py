"""
Dispatch Management Service
Implements strict resource allocation, warehouse stock reservation, and dispatch lifecycle rules.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from services.api_client import client
from services.inventory_service import InventoryService
from services.need_service import NeedService

class DispatchService:
    @staticmethod
    def get_all_dispatches() -> Tuple[List[Dict[str, Any]], Optional[str]]:
        success, data, err = client.get("dispatches")
        if not success:
            return [], err
        return data or [], None

    @staticmethod
    def get_dispatch_by_id(dispatch_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        success, data, err = client.get(f"dispatches/{dispatch_id}")
        if not success:
            return None, err
        return data, None

    @classmethod
    def create_dispatch(cls, camp_id: str, need_id: str, quantity: int) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Milestone 3 Rules:
        1. Quantity must be > 0.
        2. Never dispatch more than available stock.
        3. Never exceed need's remaining unreserved quantity.
        4. Reserve stock immediately on creation (deduct from inventory stock).
        """
        if quantity <= 0:
            return False, None, "Dispatch quantity must be greater than 0."

        # Fetch need
        need, err_n = NeedService.get_need_by_id(need_id)
        if not need:
            return False, None, f"Need not found: {err_n}"

        if str(need.get("camp_id")) != str(camp_id):
            return False, None, "The selected need does not belong to the selected camp."

        item_id = str(need.get("inventory_item_id"))
        item, err_i = InventoryService.get_item_by_id(item_id)
        if not item:
            return False, None, f"Associated inventory item not found: {err_i}"

        available_stock = int(item.get("stock", 0))
        if quantity > available_stock:
            return False, None, f"Insufficient warehouse stock! Requested {quantity} {item.get('unit')}, but only {available_stock} available."

        # Check remaining unreserved need
        unreserved, err_u = NeedService.get_remaining_unreserved(need_id)
        if err_u:
            return False, None, f"Could not compute remaining need: {err_u}"

        if quantity > unreserved:
            return False, None, f"Dispatch exceeds unmet need! Maximum unreserved quantity allowed is {unreserved} {item.get('unit')}."

        # Reserve stock immediately (deduct)
        adj_success, _, adj_err = InventoryService.adjust_stock(item_id, -quantity)
        if not adj_success:
            return False, None, f"Failed to reserve warehouse stock: {adj_err}"

        # Create dispatch record
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        payload = {
            "camp_id": str(camp_id),
            "need_id": str(need_id),
            "quantity": int(quantity),
            "status": "Pending",
            "timestamp": now_iso
        }
        create_success, data, create_err = client.post("dispatches", payload)
        if not create_success:
            # Rollback reserved stock
            InventoryService.adjust_stock(item_id, quantity)
            return False, None, f"Failed to record dispatch: {create_err}"

        return True, data, None

    @classmethod
    def update_status(cls, dispatch_id: str, new_status: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Transitions:
        - Pending -> In Transit
        - Pending / In Transit -> Delivered: Increases need fulfilled_quantity.
        - Pending / In Transit -> Cancelled: Restores reserved stock back to warehouse inventory.
        """
        dispatch, err = cls.get_dispatch_by_id(dispatch_id)
        if not dispatch:
            return False, None, f"Dispatch not found: {err}"

        current_status = dispatch.get("status")
        if current_status == new_status:
            return True, dispatch, None

        if current_status == "Delivered":
            return False, None, "A Delivered dispatch has already been fulfilled and cannot be altered."

        if current_status == "Cancelled":
            return False, None, "A Cancelled dispatch cannot be modified."

        need_id = str(dispatch.get("need_id"))
        qty = int(dispatch.get("quantity", 0))

        need, err_n = NeedService.get_need_by_id(need_id)
        if not need:
            return False, None, f"Associated need not found: {err_n}"
        item_id = str(need.get("inventory_item_id"))

        if new_status == "Delivered":
            # Increase fulfilled quantity on the need
            curr_fulfilled = int(need.get("fulfilled_quantity", 0))
            new_fulfilled = curr_fulfilled + qty
            upd_success, _, upd_err = NeedService.update_need(need_id, {"fulfilled_quantity": new_fulfilled})
            if not upd_success:
                return False, None, f"Failed to update need fulfillment: {upd_err}"

        elif new_status == "Cancelled":
            # Restore stock to warehouse inventory
            rest_success, _, rest_err = InventoryService.adjust_stock(item_id, qty)
            if not rest_success:
                return False, None, f"Failed to restore stock upon cancellation: {rest_err}"

        elif new_status not in ("Pending", "In Transit"):
            return False, None, f"Invalid status '{new_status}'."

        success, updated, err_p = client.patch(f"dispatches/{dispatch_id}", {"status": new_status})
        return success, updated, err_p
