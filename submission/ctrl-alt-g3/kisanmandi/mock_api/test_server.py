"""Exercise the real HTTP API, including ownership, persistence and boundary rules."""
from collections import Counter
from datetime import date, timedelta
import json
from pathlib import Path
import tempfile
from threading import Thread
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from seed import build_seed
from server import create_server


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.db_path = Path(self.directory.name) / "db.json"
        self.server = create_server("127.0.0.1", 0, self.db_path)
        self.thread = Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.directory.cleanup()

    def request(self, method, path, body=None, token=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        data = json.dumps(body).encode() if body is not None else None
        try:
            response = urlopen(Request(self.url + path, data, headers, method=method), timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.load(response), response.headers

    def login(self, uid="u1"):
        status, _, headers = self.request("POST", "/sessions", {"demo_user_id": uid})
        self.assertEqual(status, 200)
        return headers["X-Session-Token"]

    def listing(self, **changes):
        return dict(crop_id="c1", quantity=20, asking_price=3500, district="Hyderabad",
                    grade="A", available_from=date.today().isoformat(), contact_phone="+920000000001", **changes)

    def test_seed_counts_categories_and_consecutive_prices(self):
        db = build_seed()
        self.assertEqual({k: len(v) for k, v in db.items()},
                         dict(users=6, crops=8, markets=3, prices=336, listings=12, alerts=5))
        self.assertGreaterEqual(len({c["category"] for c in db["crops"]}), 4)
        self.assertEqual(len({m["district"] for m in db["markets"]}), 3)
        pairs = Counter((p["crop_id"], p["market_id"]) for p in db["prices"])
        self.assertEqual(len(pairs), 24)
        self.assertEqual(set(pairs.values()), {14})
        dates = sorted({p["date"] for p in db["prices"]})
        self.assertEqual(dates, [(date.today()-timedelta(days=d)).isoformat() for d in range(13, -1, -1)])

    def test_onboarding_session_restores_profile(self):
        status, user, headers = self.request("POST", "/users", {"name": "Fictional Demo", "phone": "+920000000099", "district": "Badin", "role": "Buyer"})
        self.assertEqual(status, 201)
        code, restored, _ = self.request("GET", "/session", token=headers["X-Session-Token"])
        self.assertEqual(code, 200)
        self.assertEqual(restored, user)
        self.assertIn(user, json.loads(self.db_path.read_text())["users"])
        self.assertEqual(self.request("GET", "/session", token="forged")[0], 401)

    def test_price_discovery_and_filter(self):
        code, prices, _ = self.request("GET", "/prices?crop_id=c1&market_id=m1")
        self.assertEqual(code, 200)
        self.assertEqual(len(prices), 14)
        self.assertTrue(all(p["crop_id"] == "c1" and p["market_id"] == "m1" for p in prices))

    def test_listing_validation_and_buyer_denial(self):
        farmer, buyer = self.login(), self.login("u5")
        self.assertEqual(self.request("POST", "/listings", self.listing(), buyer)[0], 403)
        self.assertEqual(self.request("POST", "/listings", self.listing())[0], 401)
        for key, value in [("quantity", 0), ("quantity", -1), ("quantity", True),
                           ("quantity", float("nan")), ("asking_price", 0), ("asking_price", float("inf")),
                           ("available_from", (date.today()-timedelta(days=1)).isoformat()),
                           ("grade", "D"), ("crop_id", "fake"), ("contact_phone", "abc"), ("district", "fake")]:
            payload = self.listing()
            payload[key] = value
            self.assertEqual(self.request("POST", "/listings", payload, farmer)[0], 400, (key, value))

    def test_listing_ownership_lifecycle_and_persistence(self):
        owner, other = self.login(), self.login("u2")
        code, item, _ = self.request("POST", "/listings", self.listing(), owner)
        self.assertEqual(code, 201)
        path = f'/listings/{item["id"]}'
        self.assertEqual(self.request("PATCH", path, {"asking_price": 4000}, other)[0], 403)
        self.assertEqual(self.request("DELETE", path, token=other)[0], 403)
        self.assertEqual(self.request("PATCH", path, {"user_id": "u2"}, owner)[0], 403)
        self.assertEqual(self.request("PATCH", path, {"asking_price": -1}, owner)[0], 400)
        self.assertEqual(self.request("PATCH", path, {"asking_price": 4000}, owner)[1]["asking_price"], 4000)
        self.assertEqual(self.request("PATCH", path, {"status": "Sold"}, owner)[1]["status"], "Sold")
        self.assertIn(item["id"], [l["id"] for l in json.loads(self.db_path.read_text())["listings"]])
        self.assertEqual(self.request("DELETE", path, token=owner)[0], 200)
        self.assertEqual(self.request("GET", path)[0], 404)

    def test_alert_inclusive_targets_toggle_edit_and_delete(self):
        owner, other = self.login(), self.login("u2")
        latest = max(self.request("GET", "/prices?crop_id=c1&market_id=m1")[1], key=lambda p: p["date"])["price"]
        for condition in ("Above", "Below"):
            body = dict(crop_id="c1", market_id="m1", condition=condition, target_price=latest, active_status=True)
            code, alert, _ = self.request("POST", "/alerts", body, owner)
            self.assertEqual(code, 201)
            self.assertTrue(alert["triggered"])
            path = f'/alerts/{alert["id"]}'
            self.assertEqual(self.request("PATCH", path, {"active_status": False}, other)[0], 403)
            self.assertFalse(self.request("PATCH", path, {"active_status": False}, owner)[1]["triggered"])
            target = latest + 1 if condition == "Above" else latest - 1
            self.assertFalse(self.request("PATCH", path, {"target_price": target, "active_status": True}, owner)[1]["triggered"])
            self.assertEqual(self.request("DELETE", path, token=owner)[0], 200)
        self.assertTrue(all(a["user_id"] == "u1" for a in self.request("GET", "/alerts", token=owner)[1]))
        self.assertEqual(self.request("POST", "/alerts", body, self.login("u5"))[0], 403)

    def test_refresh_reevaluates_alerts_and_keeps_window(self):
        owner = self.login()
        body = dict(crop_id="c1", market_id="m1", condition="Above", target_price=99999, active_status=True)
        alert = self.request("POST", "/alerts", body, owner)[1]
        self.assertFalse(alert["triggered"])
        with self.server.store.lock:
            latest = max([p for p in self.server.store.db["prices"] if p["crop_id"] == "c1" and p["market_id"] == "m1"], key=lambda p:p["date"])
            latest["price"] = 99999
        self.request("GET", "/prices")
        evaluated = self.request("GET", "/alerts", token=owner)[1]
        self.assertTrue(next(a for a in evaluated if a["id"] == alert["id"])["triggered"])
        self.assertEqual(len(self.server.store.db["prices"]), 336)

    def test_bad_json_missing_records_and_readonly_collections(self):
        self.assertEqual(self.request("POST", "/listings", [], self.login())[0], 400)
        self.assertEqual(self.request("GET", "/unknown")[0], 404)
        self.assertEqual(self.request("POST", "/prices", {}, self.login())[0], 405)
        self.assertEqual(self.request("GET", "/listings/no-such-id")[0], 404)


if __name__ == "__main__":
    unittest.main()
