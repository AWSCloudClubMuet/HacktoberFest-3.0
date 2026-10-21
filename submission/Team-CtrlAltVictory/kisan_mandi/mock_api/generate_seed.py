import json
import random
from datetime import date, timedelta

random.seed(2026)
END = date(2026, 10, 21)
DAYS = 14

crops = [
    (1, "Wheat", "Grain", 4200, 10),
    (2, "Rice (IRRI-6)", "Grain", 3900, 10),
    (3, "Cotton (Phutti)", "Cash Crop", 8500, 10),
    (4, "Sugarcane", "Cash Crop", 450, 5),
    (5, "Onion", "Vegetable", 2600, 10),
    (6, "Tomato", "Vegetable", 3200, 10),
    (7, "Green Chilli", "Vegetable", 5200, 10),
    (8, "Mango (Sindhri)", "Fruit", 6500, 10),
]
markets = [
    (1, "Hyderabad Mandi", "Hyderabad", 1.00),
    (2, "Sukkur Mandi", "Sukkur", 0.97),
    (3, "Mirpurkhas Mandi", "Mirpurkhas", 1.03),
]

db = {"users": [], "crops": [], "markets": [], "prices": [], "listings": [], "alerts": []}
for cid, name, cat, _, _ in crops:
    db["crops"].append({"id": cid, "name": name, "category": cat, "unit": "maund (40 kg)"})
for mid, name, dist, _ in markets:
    db["markets"].append({"id": mid, "name": name, "district": dist})

today_price = {}
pid = 1
for cid, name, cat, base, step in crops:
    walk, v = [], base
    for _ in range(DAYS):
        v *= 1 + random.uniform(-0.015, 0.015)
        walk.append(v)
    for mid, _, _, mult in markets:
        for i in range(DAYS):
            d = END - timedelta(days=DAYS - 1 - i)
            p = walk[i] * mult * (1 + random.uniform(-0.008, 0.008))
            p = max(step, round(p / step) * step)
            db["prices"].append({"id": pid, "cropId": cid, "marketId": mid, "date": d.isoformat(), "price": p})
            if i == DAYS - 1:
                today_price[(cid, mid)] = p
            pid += 1

users = [
    ("Ghulam Hussain", "03001234501", "Hyderabad", "farmer"),
    ("Imran Khaskheli", "03001234502", "Mirpurkhas", "farmer"),
    ("Sajida Bibi", "03001234503", "Larkana", "farmer"),
    ("Zeeshan Traders", "03001234504", "Karachi", "buyer"),
    ("Naveed Ahmed", "03001234505", "Sukkur", "buyer"),
    ("Rubina Foods", "03001234506", "Hyderabad", "buyer"),
]
for i, (n, ph, d, r) in enumerate(users, 1):
    db["users"].append({"id": i, "name": n, "phone": ph, "district": d, "role": r})

L = [
    (1, 1, 300, "A", "Hyderabad", "active"), (1, 5, 120, "B", "Hyderabad", "active"),
    (1, 2, 200, "A", "Hyderabad", "active"), (1, 6, 60, "C", "Hyderabad", "sold"),
    (2, 3, 80, "A", "Mirpurkhas", "active"), (2, 8, 150, "A", "Mirpurkhas", "active"),
    (2, 7, 40, "B", "Mirpurkhas", "active"), (2, 4, 500, "B", "Mirpurkhas", "sold"),
    (3, 1, 250, "B", "Larkana", "active"), (3, 2, 180, "C", "Larkana", "active"),
    (3, 5, 90, "A", "Larkana", "active"), (3, 6, 70, "B", "Larkana", "active"),
]
for i, (uid, cid, qty, grade, dist, status) in enumerate(L, 1):
    base = today_price[(cid, 1)]
    step = 5 if cid == 4 else 10
    price = max(step, round(base * random.uniform(0.95, 1.06) / step) * step)
    db["listings"].append({
        "id": i, "userId": uid, "cropId": cid, "quantity": qty, "pricePerMaund": price,
        "grade": grade, "district": dist,
        "availableFrom": (date(2026, 10, 20) + timedelta(days=i)).isoformat(),
        "contact": users[uid - 1][1], "status": status,
        "createdAt": f"2026-10-{10 + i:02d}T09:00:00",
    })

tp = today_price
db["alerts"] = [
    {"id": 1, "userId": 1, "cropId": 1, "marketId": 1, "condition": "above", "targetPrice": tp[(1, 1)] - 50, "active": True, "createdAt": "2026-10-18T10:00:00"},
    {"id": 2, "userId": 1, "cropId": 5, "marketId": 2, "condition": "below", "targetPrice": tp[(5, 2)] - 100, "active": True, "createdAt": "2026-10-18T10:05:00"},
    {"id": 3, "userId": 2, "cropId": 6, "marketId": 3, "condition": "above", "targetPrice": tp[(6, 3)] + 300, "active": True, "createdAt": "2026-10-19T08:00:00"},
    {"id": 4, "userId": 4, "cropId": 2, "marketId": 1, "condition": "below", "targetPrice": tp[(2, 1)] + 100, "active": True, "createdAt": "2026-10-19T11:00:00"},
    {"id": 5, "userId": 4, "cropId": 8, "marketId": 2, "condition": "above", "targetPrice": tp[(8, 2)] + 500, "active": False, "createdAt": "2026-10-20T12:00:00"},
]

with open("db.json", "w") as f:
    json.dump(db, f, indent=2)
