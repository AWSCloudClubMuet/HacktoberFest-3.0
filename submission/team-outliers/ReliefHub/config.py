"""
ReliefHub Configuration, Constants, and Design Tokens
Professional Humanitarian Technology Design System
"""

import os

# API Endpoint configuration (defaults to local mock REST API)
API_BASE_URL = os.environ.get("RELIEFHUB_API_URL", "http://127.0.0.1:5000")
API_TIMEOUT = 5.0  # seconds

# Sindh Districts for Flood Relief Camps
SINDH_DISTRICTS = [
    "Dadu",
    "Sukkur",
    "Khairpur",
    "Larkana",
    "Badin",
    "Jamshoro",
    "Hyderabad",
    "Mirpur Khas",
    "Shaheed Benazirabad",
    "Sanghar",
    "Thatta",
    "Ghotki",
    "Jacobabad",
    "Shikarpur",
    "Kashmore",
    "Naushahro Feroze"
]

# Camp Statuses
CAMP_STATUSES = ["Active", "Full", "Closed"]

# Inventory Categories
INVENTORY_CATEGORIES = [
    "Food & Rations",
    "Clean Water",
    "Medical Supplies",
    "Shelter & Bedding",
    "Sanitation & Hygiene"
]

# Need Priorities
NEED_PRIORITIES = ["High", "Medium", "Low"]

# Dispatch Statuses
DISPATCH_STATUSES = ["Pending", "In Transit", "Delivered", "Cancelled"]

# Donation Types
DONATION_TYPES = ["Cash", "In-Kind"]

# Donation Categories
DONATION_CATEGORIES = [
    "General Relief Fund",
    "Food & Rations",
    "Clean Water",
    "Medical Emergency",
    "Shelter & Rehabilitation",
    "Sanitation & Hygiene"
]

# Volunteer Skills (per official problem statement)
VOLUNTEER_SKILLS = [
    "Medical",
    "Logistics",
    "Cooking",
    "Driving",
    "Counselling"
]

# User Roles
ROLE_COORDINATOR = "Relief Coordinator (Admin)"
ROLE_VOLUNTEER = "Field Volunteer"
USER_ROLES = [ROLE_COORDINATOR, ROLE_VOLUNTEER]

# Design Tokens: Restrained, High-Contrast Humanitarian Emergency Palette
COLOR_NAVY_PRIMARY = "#0F172A"   # Dark Slate 900
COLOR_NAVY_SECONDARY = "#1E293B" # Dark Slate 800
COLOR_TEXT_MAIN = "#0F172A"      # Charcoal Dark
COLOR_TEXT_MUTED = "#64748B"     # Slate 500
COLOR_BORDER = "#E2E8F0"         # Slate 200
COLOR_SURFACE = "#F8FAFC"        # Slate 50

# Semantic Status Colors
COLOR_CRITICAL = "#DC2626"       # Red 600 - Emergency / Critical Gap
COLOR_CRITICAL_BG = "#FEE2E2"    # Red 100
COLOR_WARNING = "#D97706"        # Amber 600 - Warning / Reorder Alert / Full Camp
COLOR_WARNING_BG = "#FEF3C7"     # Amber 100
COLOR_SUCCESS = "#16A34A"        # Green 600 - Nominal / Fulfilled / Active
COLOR_SUCCESS_BG = "#DCFCE7"     # Green 100
COLOR_INFO = "#2563EB"           # Blue 600 - Informational / In Transit
COLOR_INFO_BG = "#DBEAFE"        # Blue 100
COLOR_NEUTRAL = "#475569"        # Slate 600 - Closed / Inactive
COLOR_NEUTRAL_BG = "#F1F5F9"     # Slate 100
