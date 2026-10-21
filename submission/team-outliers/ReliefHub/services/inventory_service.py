"""
Inventory Management Service
Handles warehouse items, categories, stock tracking, and reorder alerts.
"""

from typing import List, Dict, Any, Optional, Tuple
from services.api_client import client

class InventoryService:
    @staticmethod
    def get_all_inventory() -> Tuple[List[Dict[str, Any]], Optional[str]]:
        success, data, err = client.get("inventory")
        if not success:
            return [], err
        return data or [], None

    @staticmethod
    def get_item_by_id(item_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        success, data, err = client.get(f"inventory/{item_id}")
        if not success:
            return None, err
        return data, None

    @staticmethod
    def is_low_stock(item: Dict[str, Any]) -> bool:
        stock = item.get("stock", 0)
        reorder = item.get("reorder_level", 0)
        return int(stock) <= int(reorder)

    @classmethod
    def add_item(cls, name: str, category: str, unit: str, stock: int, reorder_level: int) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        if not name or not category or not unit:
            return False, None, "Name, category, and unit are required."
        if stock < 0 or reorder_level < 0:
            return False, None, "Stock and reorder level cannot be negative."

        payload = {
            "name": name.strip(),
            "category": category.strip(),
            "unit": unit.strip(),
            "stock": int(stock),
            "reorder_level": int(reorder_level)
        }
        success, data, err = client.post("inventory", payload)
        return success, data, err

    @classmethod
    def update_item(cls, item_id: str, update_data: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        if "stock" in update_data and int(update_data["stock"]) < 0:
            return False, None, "Stock cannot be negative."
        if "reorder_level" in update_data and int(update_data["reorder_level"]) < 0:
            return False, None, "Reorder level cannot be negative."

        success, data, err = client.patch(f"inventory/{item_id}", update_data)
        return success, data, err

    @classmethod
    def adjust_stock(cls, item_id: str, delta: int) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Adjust stock by delta (positive to add, negative to deduct).
        Guarantees stock cannot drop below zero.
        """
        item, err = cls.get_item_by_id(item_id)
        if not item:
            return False, None, f"Item not found: {err}"

        current_stock = int(item.get("stock", 0))
        new_stock = current_stock + delta
        if new_stock < 0:
            return False, None, f"Insufficient stock for '{item.get('name')}'. Available: {current_stock}, requested reduction: {-delta}"

        return cls.update_item(item_id, {"stock": new_stock})

    @classmethod
    def delete_item(cls, item_id: str) -> Tuple[bool, Optional[str]]:
        # Check if any camp needs refer to this item
        success_needs, needs, _ = client.get("needs")
        if success_needs and needs:
            linked = [n for n in needs if str(n.get("inventory_item_id")) == str(item_id)]
            if linked:
                return False, f"Cannot delete item: {len(linked)} camp need(s) are linked to it."

        success, _, err = client.delete(f"inventory/{item_id}")
        return success, err
