"""
Volunteer Management Service
Handles volunteer registration, skill classification, and assignment integrity.
"""

from typing import List, Dict, Any, Optional, Tuple
from services.api_client import client
from services.camp_service import CampService

class VolunteerService:
    @staticmethod
    def get_all_volunteers() -> Tuple[List[Dict[str, Any]], Optional[str]]:
        success, data, err = client.get("volunteers")
        if not success:
            return [], err
        return data or [], None

    @staticmethod
    def get_volunteer_by_id(vol_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        success, data, err = client.get(f"volunteers/{vol_id}")
        if not success:
            return None, err
        return data, None

    @classmethod
    def register_volunteer(cls, name: str, skill: str, phone: str = "",
                           camp_id: Optional[str] = None) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        if not name or not skill:
            return False, None, "Volunteer name and skill are required."

        if camp_id:
            # Check if camp is Closed
            camp, err_c = CampService.get_camp_by_id(str(camp_id))
            if not camp:
                return False, None, f"Camp not found: {err_c}"
            if camp.get("status") == "Closed":
                return False, None, "Volunteers cannot be deployed to a 'Closed' camp."

        payload = {
            "name": name.strip(),
            "skill": skill.strip(),
            "phone": phone.strip(),
            "camp_id": str(camp_id) if camp_id else None
        }
        success, data, err = client.post("volunteers", payload)
        return success, data, err

    @classmethod
    def assign_to_camp(cls, volunteer_id: str, camp_id: Optional[str]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Milestone 4 Rules:
        - Each volunteer may have only one assignment.
        - Cannot be assigned to a Closed camp.
        - Setting camp_id=None unassigns the volunteer.
        """
        vol, err = cls.get_volunteer_by_id(volunteer_id)
        if not vol:
            return False, None, f"Volunteer not found: {err}"

        if camp_id:
            camp, err_c = CampService.get_camp_by_id(str(camp_id))
            if not camp:
                return False, None, f"Camp not found: {err_c}"
            if camp.get("status") == "Closed":
                return False, None, f"Cannot assign volunteer to '{camp.get('name')}': Camp is Closed."

        success, updated, err_p = client.patch(f"volunteers/{volunteer_id}", {"camp_id": str(camp_id) if camp_id else None})
        return success, updated, err_p

    @classmethod
    def delete_volunteer(cls, volunteer_id: str) -> Tuple[bool, Optional[str]]:
        success, _, err = client.delete(f"volunteers/{volunteer_id}")
        return success, err
