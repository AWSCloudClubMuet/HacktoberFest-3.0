"""Deterministic, fictional Sindh mandi data. Prices are PKR per 40 kg maund."""

from datetime import date, timedelta
from random import Random


def build_seed(today=None):
    today = today or date.today()
    crops = [
        {"id": "c1", "name": "Wheat", "category": "Grains"},
        {"id": "c2", "name": "Rice", "category": "Grains"},
        {"id": "c3", "name": "Cotton", "category": "Cash crops"},
        {"id": "c4", "name": "Sugarcane", "category": "Cash crops"},
        {"id": "c5", "name": "Onion", "category": "Vegetables"},
        {"id": "c6", "name": "Tomato", "category": "Vegetables"},
        {"id": "c7", "name": "Mango", "category": "Fruit"},
        {"id": "c8", "name": "Banana", "category": "Fruit"},
    ]
    markets = [
        {"id": "m1", "name": "Hyderabad Mandi", "district": "Hyderabad"},
        {"id": "m2", "name": "Sukkur Mandi", "district": "Sukkur"},
        {"id": "m3", "name": "Larkana Mandi", "district": "Larkana"},
    ]
    users = [
        {"id": f"u{i+1}", "name": name, "phone": f"+92000000000{i+1}",
         "district": district, "role": "Farmer" if i < 4 else "Buyer"}
        for i, (name, district) in enumerate([
            ("Mehran Demo", "Hyderabad"), ("Sohni Demo", "Sukkur"),
            ("Darya Demo", "Larkana"), ("Badal Demo", "Badin"),
            ("Roshan Demo", "Karachi"), ("Neelam Demo", "Hyderabad"),
        ])
    ]
    rng = Random(43)
    prices = []
    bases = [3400, 5100, 7800, 480, 2650, 3100, 6400, 2900]
    for ci, crop in enumerate(crops):
        for mi, market in enumerate(markets):
            for day in range(14):
                amount = round((bases[ci] * (1 + mi * .045) + day * (ci + 2) * 4
                                + rng.randint(-45, 45)) / 5) * 5
                prices.append({
                    "id": f"p-{ci+1}-{mi+1}-{day}", "crop_id": crop["id"],
                    "market_id": market["id"],
                    "date": (today - timedelta(days=13-day)).isoformat(),
                    "price": amount,
                })
    listings = []
    for i in range(12):
        owner = users[i % 4]
        ci = i % 8
        average = sum(p["price"] for p in prices
                      if p["crop_id"] == crops[ci]["id"]
                      and p["date"] == today.isoformat()) / 3
        listings.append({
            "id": f"l{i+1}", "user_id": owner["id"], "crop_id": crops[ci]["id"],
            "quantity": [12, 25, 40, 18][i % 4],
            "asking_price": round(average * [.88, 1, 1.12][i % 3]),
            "district": owner["district"], "grade": "ABC"[i % 3],
            "available_from": (today + timedelta(days=i % 4)).isoformat(),
            "contact_phone": owner["phone"], "status": "Active",
            "created_at": f"{today.isoformat()}T{8+i//4:02}:{i%4*10:02}:00Z",
        })
    alerts = [
        {"id": f"a{i+1}", "user_id": users[i % 4]["id"],
         "crop_id": crops[i % 8]["id"], "market_id": markets[i % 3]["id"],
         "condition": "Above" if i % 2 == 0 else "Below",
         "target_price": bases[i % 8] if i % 2 == 0 else bases[i % 8] * 1.5,
         "active_status": i != 4}
        for i in range(5)
    ]
    return dict(users=users, crops=crops, markets=markets, prices=prices,
                listings=listings, alerts=alerts)
