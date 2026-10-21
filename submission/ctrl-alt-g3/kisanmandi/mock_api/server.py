"""Local HTTP mock API, using only Python's standard library.

This is a hackathon simulator, not a production identity or trading service.
Demo sign-in is restricted to the six seeded fictional profiles.
"""

import argparse
from datetime import date, datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import math
from pathlib import Path
import re
import secrets
from threading import RLock
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

from seed import build_seed

COLLECTIONS = {"users", "crops", "markets", "prices", "listings", "alerts"}
DISTRICTS = {"Hyderabad", "Sukkur", "Larkana", "Karachi", "Badin", "Jamshoro",
             "Mirpurkhas", "Thatta", "Khairpur", "Shaheed Benazirabad"}


class ApiError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message


def require(ok, message, status=400):
    if not ok:
        raise ApiError(status, message)


def positive(value, label):
    require(type(value) in (int, float) and math.isfinite(value)
            and 0 < value <= 1e10, f"{label} must be a finite number greater than zero")


def valid_phone(value):
    return isinstance(value, str) and re.fullmatch(r"\+?[0-9]{10,15}", value)


def validate_record(collection, item, db, *, creating=True, old=None):
    if collection == "users":
        require(isinstance(item.get("name"), str) and 2 <= len(item["name"].strip()) <= 60,
                "Name must contain 2–60 characters")
        require(valid_phone(item.get("phone")), "Use a phone number with 10–15 digits")
        require(item.get("district") in DISTRICTS, "Select a Sindh district")
        require(item.get("role") in ("Farmer", "Buyer"), "Select Farmer or Buyer")
        return
    require(any(c["id"] == item.get("crop_id") for c in db["crops"]), "Unknown crop")
    if collection == "listings":
        positive(item.get("quantity"), "Quantity")
        positive(item.get("asking_price"), "Asking price")
        require(item.get("district") in DISTRICTS, "Select a Sindh district")
        require(item.get("grade") in ("A", "B", "C"), "Grade must be A, B or C")
        require(valid_phone(item.get("contact_phone")), "Use a phone number with 10–15 digits")
        try:
            available = date.fromisoformat(item.get("available_from", ""))
        except (ValueError, TypeError):
            raise ApiError(400, "Use an ISO available-from date")
        # Existing records may age naturally; a changed date must still be valid.
        if creating or item["available_from"] != (old or {}).get("available_from"):
            require(available >= date.today(), "Available-from date cannot be in the past")
        require(item.get("status") in ("Active", "Sold"), "Status must be Active or Sold")
    elif collection == "alerts":
        require(any(m["id"] == item.get("market_id") for m in db["markets"]), "Unknown market")
        positive(item.get("target_price"), "Target price")
        require(item.get("condition") in ("Above", "Below"), "Select Above or Below")
        require(type(item.get("active_status")) is bool, "Active status must be true or false")


class Store:
    def __init__(self, path):
        self.path = Path(path)
        self.lock = RLock()
        if self.path.exists():
            self.db = json.loads(self.path.read_text(encoding="utf-8"))
        else:
            self.db = build_seed()
        self.db.setdefault("_sessions", {})
        self.roll_forward()
        self.save()

    def save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(".tmp")
        temporary.write_text(json.dumps(self.db, indent=2, allow_nan=False), encoding="utf-8")
        temporary.replace(self.path)

    def roll_forward(self):
        """Keep exactly 14 consecutive days ending today without erasing mutations."""
        today = date.today()
        for crop in self.db["crops"]:
            for market in self.db["markets"]:
                pair = [p for p in self.db["prices"] if p["crop_id"] == crop["id"]
                        and p["market_id"] == market["id"]]
                last = max(pair, key=lambda p: p["date"])
                cursor = date.fromisoformat(last["date"]) + timedelta(days=1)
                while cursor <= today:
                    last = dict(id=f"p-{uuid4().hex}", crop_id=crop["id"],
                                market_id=market["id"], date=cursor.isoformat(), price=last["price"])
                    self.db["prices"].append(last)
                    cursor += timedelta(days=1)
        cutoff = (today - timedelta(days=13)).isoformat()
        self.db["prices"] = [p for p in self.db["prices"] if cutoff <= p["date"] <= today.isoformat()]

    def triggered(self, alert):
        pair = [p for p in self.db["prices"] if p["crop_id"] == alert["crop_id"]
                and p["market_id"] == alert["market_id"]]
        latest = max(pair, key=lambda p: p["date"])["price"] if pair else None
        reached = latest is not None and (latest >= alert["target_price"]
                  if alert["condition"] == "Above" else latest <= alert["target_price"])
        return dict(alert, triggered=alert["active_status"] and reached, latest_price=latest)


class Handler(BaseHTTPRequestHandler):
    server_version = "KisanMandiMock/1.0"

    def log_message(self, fmt, *args):
        print(f"{self.address_string()} {fmt % args}")

    def send_json(self, code, body, token=None):
        payload = json.dumps(body, allow_nan=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Expose-Headers", "X-Session-Token")
        if token:
            self.send_header("X-Session-Token", token)
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_json(200, {})

    def read_body(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            require(0 < length <= 32768, "Expected a JSON body under 32 KB")
            value = json.loads(self.rfile.read(length))
            require(isinstance(value, dict), "Expected a JSON object")
            return value
        except (ValueError, json.JSONDecodeError):
            raise ApiError(400, "Invalid JSON")

    def user(self):
        token = self.headers.get("Authorization", "").removeprefix("Bearer ")
        uid = self.server.store.db["_sessions"].get(token)
        user = next((u for u in self.server.store.db["users"] if u["id"] == uid), None)
        require(user is not None, "Choose or create a profile first", 401)
        return user

    def start_session(self, user):
        token = secrets.token_urlsafe(32)
        self.server.store.db["_sessions"][token] = user["id"]
        self.server.store.save()
        return token

    def handle_request(self, method):
        store = self.server.store
        try:
            with store.lock:
                parsed = urlparse(self.path)
                parts = parsed.path.strip("/").split("/")
                name = parts[0]
                if method == "GET" and name == "health":
                    return self.send_json(200, {"status": "ok", "fictional": True,
                                               "unit": "PKR / 40 kg maund"})
                if method == "POST" and name == "sessions":
                    data = self.read_body()
                    uid = data.get("demo_user_id")
                    require(uid in {f"u{i}" for i in range(1, 7)}, "Only seeded demo users can use demo sign-in")
                    user = next(u for u in store.db["users"] if u["id"] == uid)
                    return self.send_json(200, user, self.start_session(user))
                if method == "GET" and name == "session":
                    return self.send_json(200, self.user())
                require(name in COLLECTIONS, "Unknown endpoint", 404)
                item_id = parts[1] if len(parts) == 2 else None
                require(len(parts) <= 2, "Unknown endpoint", 404)
                if method == "GET":
                    if name == "prices":
                        store.roll_forward()
                        store.save()
                    records = store.db[name]
                    if name == "alerts":
                        user = self.user()
                        records = [store.triggered(a) for a in records if a["user_id"] == user["id"]]
                    elif name == "users":
                        # Only fictional seeded profiles are available to the demo picker.
                        records = [u for u in records if u["id"] in {f"u{i}" for i in range(1, 7)}]
                    for key, values in parse_qs(parsed.query).items():
                        records = [r for r in records if str(r.get(key, "")) == values[0]]
                    if item_id:
                        found = next((r for r in records if r["id"] == item_id), None)
                        require(found is not None, "Record not found", 404)
                        return self.send_json(200, found)
                    return self.send_json(200, records)
                require(name in ("users", "alerts", "listings"), "Reference data is read-only", 405)
                if method == "POST" and name == "users":
                    data = self.read_body()
                    user = {k: data.get(k) for k in ("name", "phone", "district", "role")}
                    validate_record(name, user, store.db)
                    user.update(id=f"u-{uuid4().hex}", name=user["name"].strip())
                    store.db["users"].append(user)
                    return self.send_json(201, user, self.start_session(user))
                require(name != "users", "Profiles cannot be changed through the demo API", 405)
                user = self.user()
                require(user["role"] == "Farmer", "Only farmers can change listings or alerts", 403)
                if method == "POST":
                    require(item_id is None, "POST to the collection", 405)
                    data = self.read_body()
                    fields = ("crop_id", "quantity", "asking_price", "district", "grade",
                              "available_from", "contact_phone") if name == "listings" else (
                                  "crop_id", "market_id", "condition", "target_price", "active_status")
                    item = {k: data.get(k) for k in fields}
                    item.update(id=uuid4().hex, user_id=user["id"])
                    if name == "listings":
                        item.update(status="Active", created_at=datetime.now(timezone.utc).isoformat())
                    validate_record(name, item, store.db)
                    store.db[name].append(item)
                    store.save()
                    return self.send_json(201, store.triggered(item) if name == "alerts" else item)
                require(item_id is not None, "Record ID is required", 405)
                old = next((r for r in store.db[name] if r["id"] == item_id), None)
                require(old is not None, "Record not found", 404)
                require(old["user_id"] == user["id"], "You can only change your own records", 403)
                if method == "DELETE":
                    store.db[name].remove(old)
                    store.save()
                    return self.send_json(200, {"deleted": item_id})
                require(method == "PATCH", "Method not supported", 405)
                data = self.read_body()
                require(not ({"id", "user_id", "created_at"} & data.keys()), "Ownership fields cannot be changed", 403)
                editable = set(old) - {"id", "user_id", "created_at"}
                require(set(data) <= editable, "Unknown or computed field")
                item = dict(old, **data)
                validate_record(name, item, store.db, creating=False, old=old)
                old.update(item)
                store.save()
                return self.send_json(200, store.triggered(old) if name == "alerts" else old)
        except ApiError as error:
            self.send_json(error.status, {"error": error.message})

    def do_GET(self):
        self.handle_request("GET")

    def do_POST(self):
        self.handle_request("POST")

    def do_PATCH(self):
        self.handle_request("PATCH")

    def do_DELETE(self):
        self.handle_request("DELETE")


def create_server(host="127.0.0.1", port=8080, database="data/db.json"):
    server = ThreadingHTTPServer((host, port), Handler)
    server.store = Store(database)
    return server


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8080, type=int)
    parser.add_argument("--db", default=str(Path(__file__).parent / "data" / "db.json"))
    options = parser.parse_args()
    server = create_server(options.host, options.port, options.db)
    print(f"KisanMandi mock API: http://{options.host}:{options.port} (fictional records only)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
