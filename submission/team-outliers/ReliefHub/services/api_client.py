"""
Centralized API Client for ReliefHub
Handles requests to the Mock REST API with timeouts and graceful error handling.
"""

import requests
from typing import Any, Dict, List, Optional, Tuple
from config import API_BASE_URL, API_TIMEOUT

class APIClient:
    def __init__(self, base_url: str = API_BASE_URL, timeout: float = API_TIMEOUT):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _url(self, endpoint: str) -> str:
        clean_endpoint = endpoint.strip("/")
        return f"{self.base_url}/{clean_endpoint}"

    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Tuple[bool, Any, Optional[str]]:
        """GET request returning (success, data, error_message)"""
        try:
            resp = requests.get(self._url(endpoint), params=params, timeout=self.timeout)
            if resp.status_code == 200:
                return True, resp.json(), None
            return False, None, f"API Error {resp.status_code}: {resp.text}"
        except requests.exceptions.ConnectionError:
            return False, None, f"Could not connect to Mock API at {self.base_url}. Ensure the server is running."
        except requests.exceptions.Timeout:
            return False, None, f"API request timed out after {self.timeout}s."
        except Exception as e:
            return False, None, str(e)

    def post(self, endpoint: str, payload: Dict[str, Any]) -> Tuple[bool, Any, Optional[str]]:
        """POST request returning (success, data, error_message)"""
        try:
            resp = requests.post(self._url(endpoint), json=payload, timeout=self.timeout)
            if resp.status_code in (200, 201):
                return True, resp.json(), None
            return False, None, f"API Error {resp.status_code}: {resp.text}"
        except requests.exceptions.ConnectionError:
            return False, None, f"Could not connect to Mock API at {self.base_url}."
        except requests.exceptions.Timeout:
            return False, None, f"API request timed out after {self.timeout}s."
        except Exception as e:
            return False, None, str(e)

    def put(self, endpoint: str, payload: Dict[str, Any]) -> Tuple[bool, Any, Optional[str]]:
        """PUT request returning (success, data, error_message)"""
        try:
            resp = requests.put(self._url(endpoint), json=payload, timeout=self.timeout)
            if resp.status_code == 200:
                return True, resp.json(), None
            return False, None, f"API Error {resp.status_code}: {resp.text}"
        except Exception as e:
            return False, None, str(e)

    def patch(self, endpoint: str, payload: Dict[str, Any]) -> Tuple[bool, Any, Optional[str]]:
        """PATCH request returning (success, data, error_message)"""
        try:
            resp = requests.patch(self._url(endpoint), json=payload, timeout=self.timeout)
            if resp.status_code == 200:
                return True, resp.json(), None
            return False, None, f"API Error {resp.status_code}: {resp.text}"
        except Exception as e:
            return False, None, str(e)

    def delete(self, endpoint: str) -> Tuple[bool, Any, Optional[str]]:
        """DELETE request returning (success, data, error_message)"""
        try:
            resp = requests.delete(self._url(endpoint), timeout=self.timeout)
            if resp.status_code in (200, 204):
                return True, resp.json() if resp.text else {"deleted": True}, None
            return False, None, f"API Error {resp.status_code}: {resp.text}"
        except Exception as e:
            return False, None, str(e)

# Global default instance
client = APIClient()
