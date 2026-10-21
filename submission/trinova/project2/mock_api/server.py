#!/usr/bin/env python3
"""KisanMandi mock API. Standard library only.

Usage:
  python3 server.py           start server on port 3000 (seeds db.json if missing)
  python3 server.py --reset   re-create db.json with fresh seed data, then start
"""
import datetime
import json
import os
import random
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(HERE, "db.json")
COLLECTIONS = ["users", "crops", "markets", "prices", "listings", "alerts"]
PORT = 3000
LOCK = threading.Lock()


def build_seed():
    rnd = random.Random(2026)
    today = datetime.date.today()

    user_defs = [
        ("Imran Solangi", "03005550101", "Mirpurkhas", "Farmer"),
        ("Nazia Memon", "03005550102", "Larkana", "Farmer"),
        ("Ghulam Rasool Mallah", "03005550103", "Hyderabad", "Farmer"),
        ("Zubair Channa", "03005550104", "Sukkur", "Farmer"),
        ("Bashir Qureshi", "03005550105", "Karachi", "Buyer"),
        ("Farah Lakhani", "03005550106", "Hyderabad", "Buyer"),
    ]
    users = [
        {"id": str(i + 1), "name": n, "phone": p, "district": d, "role": r}
        for i, (n, p, d, r) in enumerate(user_defs)
    ]

    crop_defs = [
        ("Wheat", "Grain", 4000), ("Rice", "Grain", 6500),
        ("Cotton", "Fiber", 8500), ("Sugarcane", "Cash Crop", 450),
        ("Onion", "Vegetable", 2200), ("Tomato", "Vegetable", 2600),
        ("Mango", "Fruit", 5500), ("Banana", "Fruit", 3000),
    ]
    crops = [{"id": str(i + 1), "name": n, "category": c}
             for i, (n, c, _) in enumerate(crop_defs)]
    base = {str(i + 1): b for i, (_, _, b) in enumerate(crop_defs)}

    markets = [
        {"id": "1", "name": "Hyderabad Mandi", "district": "Hyderabad"},
        {"id": "2", "name": "Sukkur Mandi", "district": "Sukkur"},
        {"id": "3", "name": "Mirpurkhas Mandi", "district": "Mirpurkhas"},
    ]
    factor = {"1": 1.00, "2": 1.04, "3": 0.97}

    prices, latest, pid = [], {}, 1
    for crop in crops:
        for market in markets:
            p = base[crop["id"]] * factor[market["id"]]
            for offset in range(13, -1, -1):
                p *= 1 + rnd.uniform(-0.03, 0.03)
                value = int(round(p))
                day = today - datetime.timedelta(days=offset)
                prices.append({
                    "id": str(pid), "crop_id": crop["id"],
                    "market_id": market["id"], "date": day.isoformat(),
                    "price": value,
                })
                pid += 1
                if offset == 0:
                    latest[(crop["id"], market["id"])] = value

    def avg_latest(crop_id):
        vals = [latest[(crop_id, m["id"])] for m in markets]
        return sum(vals) / len(vals)

    listings = []
    farmers = users[:4]
    for i in range(12):
        farmer = farmers[i % 4]
        crop = crops[(i * 5) % 8]
        asking = avg_latest(crop["id"]) * rnd.choice([0.88, 0.97, 1.0, 1.03, 1.12])
        listings.append({
            "id": str(i + 1), "user_id": farmer["id"], "crop_id": crop["id"],
            "quantity": rnd.choice([20, 40, 60, 100, 150, 250]),
            "asking_price": int(round(asking)),
            "district": farmer["district"], "grade": "ABC"[i % 3],
            "available_from": (today + datetime.timedelta(days=i % 7)).isoformat(),
            "status": "Sold" if i in (4, 9) else "Active",
            "contact_phone": farmer["phone"],
        })

    alert_defs = [
        ("1", "1", "1", "Above", 0.98, True),
        ("1", "5", "2", "Below", 0.90, True),
        ("2", "3", "3", "Below", 1.05, True),
        ("3", "2", "1", "Above", 1.10, True),
        ("4", "7", "2", "Above", 1.02, False),
    ]
    alerts = [
        {"id": str(i + 1), "user_id": u, "crop_id": c, "market_id": m,
         "condition": cond, "target_price": int(round(latest[(c, m)] * mult)),
         "active_status": active}
        for i, (u, c, m, cond, mult, active) in enumerate(alert_defs)
    ]

    return {"users": users, "crops": crops, "markets": markets,
            "prices": prices, "listings": listings, "alerts": alerts}


def load_db():
    with open(DB_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_db(db):
    tmp = DB_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2)
    os.replace(tmp, DB_FILE)


class Handler(BaseHTTPRequestHandler):
    server_version = "KisanMandiMock/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s -> %s\n" % (self.command, self.path, args[1] if len(args) > 1 else ""))

    def _send(self, code, payload=None):
        body = b"" if payload is None else json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def _route(self):
        url = urlparse(self.path)
        parts = [p for p in url.path.split("/") if p]
        if not parts or parts[0] not in COLLECTIONS:
            return None
        return parts[0], (parts[1] if len(parts) > 1 else None), parse_qs(url.query)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b"{}"
        try:
            data = json.loads(raw or b"{}")
        except ValueError:
            return None
        return data if isinstance(data, dict) else None

    def do_OPTIONS(self):
        self._send(204)

    def do_GET(self):
        route = self._route()
        if route is None:
            return self._send(404, {"error": "unknown collection"})
        name, item_id, query = route
        with LOCK:
            rows = load_db()[name]
        if item_id is not None:
            for row in rows:
                if str(row["id"]) == item_id:
                    return self._send(200, row)
            return self._send(404, {"error": "not found"})
        for key, values in query.items():
            rows = [r for r in rows if str(r.get(key)) in values]
        self._send(200, rows)

    def do_POST(self):
        route = self._route()
        if route is None or route[1] is not None:
            return self._send(404, {"error": "not found"})
        data = self._body()
        if data is None:
            return self._send(400, {"error": "invalid JSON"})
        name = route[0]
        with LOCK:
            db = load_db()
            ids = [int(r["id"]) for r in db[name] if str(r.get("id", "")).isdigit()]
            data["id"] = str(max(ids or [0]) + 1)
            db[name].append(data)
            save_db(db)
        self._send(201, data)

    def do_PUT(self):
        route = self._route()
        if route is None or route[1] is None:
            return self._send(404, {"error": "not found"})
        data = self._body()
        if data is None:
            return self._send(400, {"error": "invalid JSON"})
        name, item_id, _ = route
        with LOCK:
            db = load_db()
            for row in db[name]:
                if str(row["id"]) == item_id:
                    data.pop("id", None)
                    row.update(data)
                    save_db(db)
                    return self._send(200, row)
        self._send(404, {"error": "not found"})

    do_PATCH = do_PUT

    def do_DELETE(self):
        route = self._route()
        if route is None or route[1] is None:
            return self._send(404, {"error": "not found"})
        name, item_id, _ = route
        with LOCK:
            db = load_db()
            for row in db[name]:
                if str(row["id"]) == item_id:
                    db[name].remove(row)
                    save_db(db)
                    return self._send(200, row)
        self._send(404, {"error": "not found"})


if __name__ == "__main__":
    if "--reset" in sys.argv or not os.path.exists(DB_FILE):
        save_db(build_seed())
        print("Seeded", DB_FILE)
    print("KisanMandi mock API running on http://0.0.0.0:%d" % PORT)
    print("Collections:", ", ".join(COLLECTIONS))
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()