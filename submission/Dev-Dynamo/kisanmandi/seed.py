#!/usr/bin/env python3
"""Creates data/db.json with fictional KisanMandi data.
6 users, 8 crops (5 categories), 3 markets, 336 prices (8 x 3 x 14 days), 12 listings, 5 alerts.
Run:  python3 seed.py   (this RESETS the database)"""
import json
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(2026)
OUT = Path(__file__).resolve().parent / "data" / "db.json"

crops = [
    ("wheat", "Wheat", "Grains", 3200), ("rice", "Rice", "Grains", 4800),
    ("cotton", "Cotton", "Cash Crops", 8500), ("sugarcane", "Sugarcane", "Cash Crops", 450),
    ("onion", "Onion", "Vegetables", 2400), ("tomato", "Tomato", "Vegetables", 1900),
    ("mango", "Mango", "Fruits", 6200), ("chickpea", "Chickpea", "Pulses", 9000),
]
crops = [{"id": f"crop-{i}", "name": n, "category": c, "unit": "maund", "basePrice": p} for i, n, c, p in crops]

markets = [
    {"id": "market-hyderabad", "name": "Hyderabad Mandi", "district": "Hyderabad"},
    {"id": "market-sukkur", "name": "Sukkur Mandi", "district": "Sukkur"},
    {"id": "market-karachi", "name": "Karachi Sabzi Mandi", "district": "Karachi"},
]
mult = {"market-hyderabad": 1.00, "market-sukkur": 0.94, "market-karachi": 1.08}

users = [
    ("Demo Farmer", "03001234567", "Matiari", "Farmer"),
    ("Ali Raza", "03111234501", "Hyderabad", "Farmer"),
    ("Sana Memon", "03211234502", "Sukkur", "Farmer"),
    ("Imran Buriro", "03331234503", "Larkana", "Farmer"),
    ("Demo Buyer", "03451234504", "Karachi", "Buyer"),
    ("Hira Traders", "03011234505", "Hyderabad", "Buyer"),
]
users = [{"id": f"user-{i+1}", "name": n, "phone": p, "district": d, "role": r} for i, (n, p, d, r) in enumerate(users)]

today = date.today()
prices, latest = [], {}
for c in crops:
    for m in markets:
        p = c["basePrice"] * mult[m["id"]] * random.uniform(0.97, 1.03)
        for k in range(13, -1, -1):
            p = max(c["basePrice"] * 0.7, p * random.uniform(0.975, 1.03))
            d = (today - timedelta(days=k)).isoformat()
            prices.append({"id": f"price-{c['id']}-{m['id']}-{d}", "cropId": c["id"], "marketId": m["id"],
                           "date": d, "price": round(p, 2), "unit": c["unit"]})
        latest[(c["id"], m["id"])] = round(p, 2)

L = [  # (user, crop, qty, price factor vs market, district, grade, status)
    (1, "wheat", 100, .98, "Matiari", "A", "active"), (1, "onion", 60, 1.04, "Matiari", "B", "active"),
    (1, "cotton", 40, .97, "Matiari", "A", "sold"), (2, "rice", 80, .96, "Hyderabad", "A", "active"),
    (2, "tomato", 30, 1.08, "Hyderabad", "C", "active"), (2, "mango", 50, 1.02, "Hyderabad", "A", "active"),
    (3, "wheat", 200, .93, "Sukkur", "B", "active"), (3, "chickpea", 25, 1.01, "Sukkur", "A", "active"),
    (3, "sugarcane", 500, .99, "Sukkur", "B", "sold"), (4, "cotton", 70, 1.05, "Larkana", "B", "active"),
    (4, "onion", 90, .95, "Larkana", "A", "active"), (4, "rice", 120, 1.0, "Larkana", "B", "active"),
]
dist_market = {"Hyderabad": "market-hyderabad", "Sukkur": "market-sukkur", "Karachi": "market-karachi"}
listings = []
for i, (u, c, q, f, d, g, s) in enumerate(L, 1):
    ref = latest[(f"crop-{c}", dist_market.get(d, "market-hyderabad"))]
    listings.append({"id": f"listing-{i}", "userId": f"user-{u}", "cropId": f"crop-{c}", "quantity": q,
                     "askingPrice": round(ref * f), "district": d, "grade": g,
                     "availableFrom": (today + timedelta(days=i % 4)).isoformat(),
                     "contactPhone": users[u - 1]["phone"], "status": s,
                     "createdAt": (today - timedelta(days=i % 6)).isoformat()})

A = [(1, "wheat", "market-hyderabad", "Above", .97), (1, "onion", "market-karachi", "Below", 1.20),
     (1, "rice", "market-sukkur", "Above", 1.10), (2, "cotton", "market-hyderabad", "Below", .90),
     (5, "tomato", "market-karachi", "Above", 1.15)]
alerts = []
for i, (u, c, m, dr, f) in enumerate(A, 1):
    alerts.append({"id": f"alert-{i}", "userId": f"user-{u}", "cropId": f"crop-{c}", "marketId": m,
                   "direction": dr, "targetPrice": round(latest[(f"crop-{c}", m)] * f, -1),
                   "isActive": True, "triggered": False, "triggerCount": 0})

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"users": users, "crops": crops, "markets": markets, "prices": prices,
                           "listings": listings, "alerts": alerts}, indent=2, ensure_ascii=False), encoding="utf-8")
print({k: len(v) for k, v in json.loads(OUT.read_text()).items()})
