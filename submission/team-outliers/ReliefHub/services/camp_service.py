"""
Camp Management Service
Handles camp CRUD operations, district filtering, capacity status updates.
"""

from typing import List, Dict, Any, Optional, Tuple
from services.api_client import client

class CampService:
    @staticmethod
    def get_all_camps() -> Tuple[List[Dict[str, Any]], Optional[str]]:
        success, data, err = client.get("camps")
        if not success:
            return [], err
        return data or [], None

    @staticmethod
    def get_camp_by_id(camp_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        success, data, err = client.get(f"camps/{camp_id}")
        if not success:
            return None, err
        return data, None

    @staticmethod
    def _apply_capacity_rule(capacity: int, current_families: int, requested_status: str) -> str:
        """
        Milestone 1 Rule: Automatically mark a camp Full when current families reach capacity.
        If current_families < capacity and status was Full, revert to Active.
        Closed status is preserved if explicitly closed.
        """
        if requested_status == "Closed":
            return "Closed"
        if current_families >= capacity:
            return "Full"
        if requested_status == "Full" and current_families < capacity:
            return "Active"
        return requested_status

    @classmethod
    def add_camp(cls, name: str, district: str, capacity: int, current_families: int,
                 status: str = "Active", lat: Optional[float] = None, lon: Optional[float] = None,
                 contact_person: str = "", phone: str = "") -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        # Validations
        if not name or not district:
            return False, None, "Camp name and district are required."
        if capacity <= 0:
            return False, None, "Capacity must be a positive number greater than 0."
        if current_families < 0:
            return False, None, "Current families cannot be negative."
        if current_families > capacity:
            return False, None, "Current families cannot exceed total camp capacity."

        computed_status = cls._apply_capacity_rule(capacity, current_families, status)

        payload = {
            "name": name.strip(),
            "district": district.strip(),
            "capacity": int(capacity),
            "current_families": int(current_families),
            "status": computed_status,
            "lat": lat or 26.0,
            "lon": lon or 68.5,
            "contact_person": contact_person.strip(),
            "phone": phone.strip()
        }
        success, data, err = client.post("camps", payload)
        return success, data, err

    @classmethod
    def update_camp(cls, camp_id: str, update_data: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        cap = update_data.get("capacity")
        fam = update_data.get("current_families")
        st = update_data.get("status")

        if cap is not None and cap <= 0:
            return False, None, "Capacity must be greater than 0."
        if fam is not None and fam < 0:
            return False, None, "Current families cannot be negative."
        if cap is not None and fam is not None and fam > cap:
            return False, None, "Current families cannot exceed camp capacity."

        if cap is not None and fam is not None:
            update_data["status"] = cls._apply_capacity_rule(int(cap), int(fam), st or "Active")

        success, data, err = client.patch(f"camps/{camp_id}", update_data)
        return success, data, err

    @classmethod
    def delete_camp(cls, camp_id: str) -> Tuple[bool, Optional[str]]:
        # Check if there are dispatches or volunteers linked
        success_vols, vols, _ = client.get("volunteers")
        if success_vols and vols:
            assigned = [v for v in vols if str(v.get("camp_id")) == str(camp_id)]
            if assigned:
                return False, f"Cannot delete camp: {len(assigned)} volunteer(s) currently assigned. Please unassign them first."

        success_disp, dispatches, _ = client.get("dispatches")
        if success_disp and dispatches:
            active_disp = [d for d in dispatches if str(d.get("camp_id")) == str(camp_id) and d.get("status") in ("Pending", "In Transit")]
            if active_disp:
                return False, f"Cannot delete camp: There are {len(active_disp)} active (Pending/In Transit) dispatches destined for this camp."

        success, _, err = client.delete(f"camps/{camp_id}")
        return success, err
