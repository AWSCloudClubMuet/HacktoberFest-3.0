"""
ReliefHub Seed Script
Initializes db.json with exact required records per GitHub Issue #10.
Counts: 8 camps, 12 inventory, 20 needs, 10 dispatches, 10 donations, 15 volunteers.
"""

import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db.json")

SEED_DATA = {
  "camps": [
    {
      "id": "1",
      "name": "Mehar Central Relief Camp",
      "district": "Dadu",
      "capacity": 300,
      "current_families": 300,
      "status": "Full",
      "lat": 27.1812,
      "lon": 67.8219,
      "contact_person": "Rasheed Mallah",
      "phone": "+92 300 1234501"
    },
    {
      "id": "2",
      "name": "Sukkur Barrage Sector-A Camp",
      "district": "Sukkur",
      "capacity": 450,
      "current_families": 380,
      "status": "Active",
      "lat": 27.7052,
      "lon": 68.8574,
      "contact_person": "Imran Soomro",
      "phone": "+92 301 2345602"
    },
    {
      "id": "3",
      "name": "Kot Diji Model Shelter",
      "district": "Khairpur",
      "capacity": 250,
      "current_families": 190,
      "status": "Active",
      "lat": 27.3408,
      "lon": 68.7088,
      "contact_person": "Mazhar Phulpoto",
      "phone": "+92 302 3456703"
    },
    {
      "id": "4",
      "name": "Larkana Degree College Camp",
      "district": "Larkana",
      "capacity": 350,
      "current_families": 220,
      "status": "Active",
      "lat": 27.559,
      "lon": 68.212,
      "contact_person": "Ghulam Mustafa",
      "phone": "+92 303 4567804"
    },
    {
      "id": "5",
      "name": "Badin Coastal Relief Base",
      "district": "Badin",
      "capacity": 200,
      "current_families": 200,
      "status": "Full",
      "lat": 24.656,
      "lon": 68.8378,
      "contact_person": "Khamiso Khaskheli",
      "phone": "+92 304 5678905"
    },
    {
      "id": "6",
      "name": "Sehwan Sharif High School Camp",
      "district": "Jamshoro",
      "capacity": 400,
      "current_families": 310,
      "status": "Active",
      "lat": 26.4258,
      "lon": 67.8614,
      "contact_person": "Syed Ali Shah",
      "phone": "+92 305 6789006"
    },
    {
      "id": "7",
      "name": "Hyderabad City Stadium Camp",
      "district": "Hyderabad",
      "capacity": 500,
      "current_families": 0,
      "status": "Closed",
      "lat": 25.396,
      "lon": 68.3578,
      "contact_person": "Waseem Akhtar",
      "phone": "+92 306 7890107"
    },
    {
      "id": "8",
      "name": "Khairpur Mirs Sector-B Camp",
      "district": "Khairpur",
      "capacity": 280,
      "current_families": 150,
      "status": "Active",
      "lat": 27.5295,
      "lon": 68.7592,
      "contact_person": "Akbar Shahani",
      "phone": "+92 307 8901208"
    }
  ],
  "inventory": [
    {
      "id": "1",
      "name": "Wheat Flour (20kg Bags)",
      "category": "Food & Rations",
      "unit": "bags",
      "stock": 150,
      "reorder_level": 50
    },
    {
      "id": "2",
      "name": "Rice (25kg Bags)",
      "category": "Food & Rations",
      "unit": "bags",
      "stock": 35,
      "reorder_level": 40
    },
    {
      "id": "3",
      "name": "Cooking Oil (5L Tins)",
      "category": "Food & Rations",
      "unit": "tins",
      "stock": 120,
      "reorder_level": 30
    },
    {
      "id": "4",
      "name": "Mineral Water (19L Bottles)",
      "category": "Clean Water",
      "unit": "bottles",
      "stock": 220,
      "reorder_level": 60
    },
    {
      "id": "5",
      "name": "Water Purification Tablets",
      "category": "Clean Water",
      "unit": "strips",
      "stock": 25,
      "reorder_level": 50
    },
    {
      "id": "6",
      "name": "Water Storage Jerricans (10L)",
      "category": "Clean Water",
      "unit": "units",
      "stock": 80,
      "reorder_level": 25
    },
    {
      "id": "7",
      "name": "Emergency First Aid Kits",
      "category": "Medical Supplies",
      "unit": "kits",
      "stock": 45,
      "reorder_level": 20
    },
    {
      "id": "8",
      "name": "ORS Rehydration Sachets",
      "category": "Medical Supplies",
      "unit": "cartons",
      "stock": 18,
      "reorder_level": 20
    },
    {
      "id": "9",
      "name": "Anti-Malarial & Antibiotics Pack",
      "category": "Medical Supplies",
      "unit": "boxes",
      "stock": 65,
      "reorder_level": 25
    },
    {
      "id": "10",
      "name": "Family Tents (4-6 Person)",
      "category": "Shelter & Bedding",
      "unit": "tents",
      "stock": 70,
      "reorder_level": 20
    },
    {
      "id": "11",
      "name": "Blankets & Tarpaulins",
      "category": "Shelter & Bedding",
      "unit": "bundles",
      "stock": 190,
      "reorder_level": 50
    },
    {
      "id": "12",
      "name": "Hygiene & Soap Kits",
      "category": "Sanitation & Hygiene",
      "unit": "kits",
      "stock": 140,
      "reorder_level": 40
    }
  ],
  "needs": [
    {
      "id": "1",
      "camp_id": "1",
      "inventory_item_id": "5",
      "required_quantity": 100,
      "priority": "High",
      "fulfilled_quantity": 20
    },
    {
      "id": "2",
      "camp_id": "1",
      "inventory_item_id": "8",
      "required_quantity": 80,
      "priority": "High",
      "fulfilled_quantity": 15
    },
    {
      "id": "3",
      "camp_id": "2",
      "inventory_item_id": "7",
      "required_quantity": 50,
      "priority": "High",
      "fulfilled_quantity": 10
    },
    {
      "id": "4",
      "camp_id": "2",
      "inventory_item_id": "1",
      "required_quantity": 100,
      "priority": "High",
      "fulfilled_quantity": 80
    },
    {
      "id": "5",
      "camp_id": "3",
      "inventory_item_id": "4",
      "required_quantity": 150,
      "priority": "Medium",
      "fulfilled_quantity": 120
    },
    {
      "id": "6",
      "camp_id": "3",
      "inventory_item_id": "11",
      "required_quantity": 60,
      "priority": "Low",
      "fulfilled_quantity": 60
    },
    {
      "id": "7",
      "camp_id": "4",
      "inventory_item_id": "2",
      "required_quantity": 70,
      "priority": "High",
      "fulfilled_quantity": 10
    },
    {
      "id": "8",
      "camp_id": "4",
      "inventory_item_id": "10",
      "required_quantity": 50,
      "priority": "High",
      "fulfilled_quantity": 45
    },
    {
      "id": "9",
      "camp_id": "5",
      "inventory_item_id": "3",
      "required_quantity": 40,
      "priority": "Medium",
      "fulfilled_quantity": 20
    },
    {
      "id": "10",
      "camp_id": "5",
      "inventory_item_id": "6",
      "required_quantity": 50,
      "priority": "Low",
      "fulfilled_quantity": 50
    },
    {
      "id": "11",
      "camp_id": "6",
      "inventory_item_id": "9",
      "required_quantity": 60,
      "priority": "High",
      "fulfilled_quantity": 15
    },
    {
      "id": "12",
      "camp_id": "6",
      "inventory_item_id": "12",
      "required_quantity": 80,
      "priority": "Medium",
      "fulfilled_quantity": 60
    },
    {
      "id": "13",
      "camp_id": "8",
      "inventory_item_id": "1",
      "required_quantity": 90,
      "priority": "Medium",
      "fulfilled_quantity": 50
    },
    {
      "id": "14",
      "camp_id": "8",
      "inventory_item_id": "4",
      "required_quantity": 120,
      "priority": "High",
      "fulfilled_quantity": 90
    },
    {
      "id": "15",
      "camp_id": "1",
      "inventory_item_id": "10",
      "required_quantity": 40,
      "priority": "Medium",
      "fulfilled_quantity": 40
    },
    {
      "id": "16",
      "camp_id": "2",
      "inventory_item_id": "12",
      "required_quantity": 70,
      "priority": "Low",
      "fulfilled_quantity": 35
    },
    {
      "id": "17",
      "camp_id": "3",
      "inventory_item_id": "8",
      "required_quantity": 30,
      "priority": "Medium",
      "fulfilled_quantity": 20
    },
    {
      "id": "18",
      "camp_id": "4",
      "inventory_item_id": "5",
      "required_quantity": 60,
      "priority": "Medium",
      "fulfilled_quantity": 45
    },
    {
      "id": "19",
      "camp_id": "5",
      "inventory_item_id": "11",
      "required_quantity": 80,
      "priority": "High",
      "fulfilled_quantity": 70
    },
    {
      "id": "20",
      "camp_id": "6",
      "inventory_item_id": "7",
      "required_quantity": 35,
      "priority": "Medium",
      "fulfilled_quantity": 25
    }
  ],
  "dispatches": [
    {
      "id": "1",
      "camp_id": "2",
      "need_id": "4",
      "quantity": 40,
      "status": "Delivered",
      "timestamp": "2026-10-18T14:30:00Z"
    },
    {
      "id": "2",
      "camp_id": "2",
      "need_id": "4",
      "quantity": 40,
      "status": "Delivered",
      "timestamp": "2026-10-19T09:15:00Z"
    },
    {
      "id": "3",
      "camp_id": "3",
      "need_id": "5",
      "quantity": 60,
      "status": "Delivered",
      "timestamp": "2026-10-19T11:00:00Z"
    },
    {
      "id": "4",
      "camp_id": "3",
      "need_id": "5",
      "quantity": 60,
      "status": "Delivered",
      "timestamp": "2026-10-20T16:20:00Z"
    },
    {
      "id": "5",
      "camp_id": "1",
      "need_id": "1",
      "quantity": 20,
      "status": "Delivered",
      "timestamp": "2026-10-20T08:00:00Z"
    },
    {
      "id": "6",
      "camp_id": "1",
      "need_id": "2",
      "quantity": 15,
      "status": "Delivered",
      "timestamp": "2026-10-20T13:45:00Z"
    },
    {
      "id": "7",
      "camp_id": "4",
      "need_id": "7",
      "quantity": 10,
      "status": "Delivered",
      "timestamp": "2026-10-21T07:30:00Z"
    },
    {
      "id": "8",
      "camp_id": "4",
      "need_id": "7",
      "quantity": 15,
      "status": "In Transit",
      "timestamp": "2026-10-21T09:00:00Z"
    },
    {
      "id": "9",
      "camp_id": "6",
      "need_id": "11",
      "quantity": 10,
      "status": "Pending",
      "timestamp": "2026-10-21T10:15:00Z"
    },
    {
      "id": "10",
      "camp_id": "5",
      "need_id": "9",
      "quantity": 15,
      "status": "Cancelled",
      "timestamp": "2026-10-20T17:00:00Z"
    }
  ],
  "donations": [
    {
      "id": "1",
      "type": "Cash",
      "amount_or_quantity": 250000,
      "item_id": None,
      "category": "General Relief Fund",
      "donor_name": "Sindh Flood Relief Aid",
      "date": "2026-10-17"
    },
    {
      "id": "2",
      "type": "Cash",
      "amount_or_quantity": 100000,
      "item_id": None,
      "category": "Medical Emergency",
      "donor_name": "Al-Khidmat Foundation",
      "date": "2026-10-18"
    },
    {
      "id": "3",
      "type": "In-Kind",
      "amount_or_quantity": 50,
      "item_id": "1",
      "category": "Food & Rations",
      "donor_name": "Karachi Grain Merchants",
      "date": "2026-10-18"
    },
    {
      "id": "4",
      "type": "Cash",
      "amount_or_quantity": 150000,
      "item_id": None,
      "category": "Shelter & Rehabilitation",
      "donor_name": "MUET Alumni Association",
      "date": "2026-10-19"
    },
    {
      "id": "5",
      "type": "In-Kind",
      "amount_or_quantity": 100,
      "item_id": "4",
      "category": "Clean Water",
      "donor_name": "Nestle Water Drive",
      "date": "2026-10-19"
    },
    {
      "id": "6",
      "type": "In-Kind",
      "amount_or_quantity": 30,
      "item_id": "7",
      "category": "Medical Supplies",
      "donor_name": "Red Crescent Society",
      "date": "2026-10-20"
    },
    {
      "id": "7",
      "type": "Cash",
      "amount_or_quantity": 75000,
      "item_id": None,
      "category": "Food & Rations",
      "donor_name": "Local Philanthropist Forum",
      "date": "2026-10-20"
    },
    {
      "id": "8",
      "type": "In-Kind",
      "amount_or_quantity": 40,
      "item_id": "11",
      "category": "Shelter & Bedding",
      "donor_name": "Rotary Club Hyderabad",
      "date": "2026-10-20"
    },
    {
      "id": "9",
      "type": "Cash",
      "amount_or_quantity": 50000,
      "item_id": None,
      "category": "Sanitation & Hygiene",
      "donor_name": "Doctors for Humanity",
      "date": "2026-10-21"
    },
    {
      "id": "10",
      "type": "In-Kind",
      "amount_or_quantity": 50,
      "item_id": "12",
      "category": "Sanitation & Hygiene",
      "donor_name": "UNICEF Partner Network",
      "date": "2026-10-21"
    }
  ],
  "volunteers": [
    {
      "id": "1",
      "name": "Dr. Farooq Ahmed",
      "skill": "Medical",
      "phone": "+92 300 9876501",
      "camp_id": "1"
    },
    {
      "id": "2",
      "name": "Nurse Ayesha Noor",
      "skill": "Medical",
      "phone": "+92 301 9876502",
      "camp_id": "2"
    },
    {
      "id": "3",
      "name": "Tariq Mehmood",
      "skill": "Logistics",
      "phone": "+92 302 9876503",
      "camp_id": "2"
    },
    {
      "id": "4",
      "name": "Bilawal Jamali",
      "skill": "Logistics",
      "phone": "+92 303 9876504",
      "camp_id": "3"
    },
    {
      "id": "5",
      "name": "Razia Sultana",
      "skill": "Cooking",
      "phone": "+92 304 9876505",
      "camp_id": "1"
    },
    {
      "id": "6",
      "name": "Ghulam Murtaza",
      "skill": "Cooking",
      "phone": "+92 305 9876506",
      "camp_id": "4"
    },
    {
      "id": "7",
      "name": "Kamran Shah",
      "skill": "Driving",
      "phone": "+92 306 9876507",
      "camp_id": "5"
    },
    {
      "id": "8",
      "name": "Zulfiqar Ali",
      "skill": "Driving",
      "phone": "+92 307 9876508",
      "camp_id": "6"
    },
    {
      "id": "9",
      "name": "Dr. Saima Qureshi",
      "skill": "Counselling",
      "phone": "+92 308 9876509",
      "camp_id": "4"
    },
    {
      "id": "10",
      "name": "Noman Soomro",
      "skill": "Counselling",
      "phone": "+92 309 9876510",
      "camp_id": "8"
    },
    {
      "id": "11",
      "name": "Zainab Brohi",
      "skill": "Medical",
      "phone": "+92 310 9876511",
      "camp_id": None
    },
    {
      "id": "12",
      "name": "Yasir Memon",
      "skill": "Logistics",
      "phone": "+92 311 9876512",
      "camp_id": None
    },
    {
      "id": "13",
      "name": "Fatima Bhutto",
      "skill": "Cooking",
      "phone": "+92 312 9876513",
      "camp_id": None
    },
    {
      "id": "14",
      "name": "Asadullah Mallah",
      "skill": "Driving",
      "phone": "+92 313 9876514",
      "camp_id": None
    },
    {
      "id": "15",
      "name": "Hina Abbasi",
      "skill": "Counselling",
      "phone": "+92 314 9876515",
      "camp_id": None
    }
  ]
}

def seed_database():
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(SEED_DATA, f, indent=2)
    print(f"Successfully re-seeded {DB_PATH}:")
    for k, v in SEED_DATA.items():
        print(f"  - {k}: {len(v)} records")

if __name__ == "__main__":
    seed_database()
