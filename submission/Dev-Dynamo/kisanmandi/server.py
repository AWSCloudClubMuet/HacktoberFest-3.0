#!/usr/bin/env python3
"""KisanMandi demo API and static web server. Python standard library only."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote, parse_qs
from pathlib import Path
import json
import threading
import uuid

BASE_DIR = Path(__file__).resolve().parent
DB_FILE = BASE_DIR / "data" / "db.json"
HOST = "127.0.0.1"
PORT = 8000
LOCK = threading.RLock()
COLLECTIONS = ("users", "crops", "markets", "prices", "listings", "alerts")


def load_db():
    if not DB_FILE.exists():
        DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        DB_FILE.write_text(json.dumps({name: [] for name in COLLECTIONS}, indent=2))
    try:
        data = json.loads(DB_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        data = {}
    for name in COLLECTIONS:
        if not isinstance(data.get(name), list):
            data[name] = []
    return data


def save_db(data):
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp = DB_FILE.with_suffix(".tmp")
    temp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    temp.replace(DB_FILE)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def send_json(self, status, payload):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.end_headers()
        self.wfile.write(raw)

    def read_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1_000_000:
            raise ValueError("Request body is too large.")
        raw = self.rfile.read(length) if length else b"{}"
        value = json.loads(raw.decode("utf-8"))
        if not isinstance(value, dict):
            raise ValueError("JSON body must be an object.")
        return value

    def route(self):
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/api/"):
            return None, None, None
        parts = [unquote(part) for part in parsed.path.strip("/").split("/")]
        if len(parts) < 2 or parts[1] not in COLLECTIONS:
            return "invalid", None, None
        collection = parts[1]
        record_id = parts[2] if len(parts) > 2 else None
        return collection, record_id, parse_qs(parsed.query)

    def do_OPTIONS(self):
        self.send_json(204, {})

    def do_GET(self):
        collection, record_id, query = self.route()
        if collection is None:
            return super().do_GET()
        if collection == "invalid":
            return self.send_json(404, {"error": "Unknown API collection."})
        with LOCK:
            data = load_db()
            records = data[collection]
            if record_id:
                found = next((item for item in records if str(item.get("id")) == record_id), None)
                return self.send_json(200, found) if found else self.send_json(404, {"error": "Record not found."})
            for key, values in (query or {}).items():
                if key in ("limit", "offset"):
                    continue
                expected = values[0]
                records = [item for item in records if str(item.get(key, "")).lower() == expected.lower()]
            try:
                offset = max(0, int((query or {}).get("offset", ["0"])[0]))
                limit = min(1000, max(1, int((query or {}).get("limit", ["1000"])[0])))
                records = records[offset:offset + limit]
            except ValueError:
                return self.send_json(400, {"error": "limit and offset must be integers."})
            return self.send_json(200, records)

    def do_POST(self):
        collection, record_id, _ = self.route()
        if collection is None:
            return self.send_json(404, {"error": "API endpoint not found."})
        if collection == "invalid" or record_id:
            return self.send_json(404, {"error": "Unknown API endpoint."})
        try:
            body = self.read_body()
        except (ValueError, json.JSONDecodeError) as exc:
            return self.send_json(400, {"error": str(exc)})
        with LOCK:
            data = load_db()
            body["id"] = str(body.get("id") or f"{collection[:-1] if collection.endswith('s') else collection}-{uuid.uuid4().hex[:10]}")
            if any(str(item.get("id")) == body["id"] for item in data[collection]):
                return self.send_json(409, {"error": "A record with this id already exists."})
            data[collection].append(body)
            save_db(data)
        return self.send_json(201, body)

    def do_PATCH(self):
        self._update_record(partial=True)

    def do_PUT(self):
        self._update_record(partial=False)

    def _update_record(self, partial):
        collection, record_id, _ = self.route()
        if collection in (None, "invalid") or not record_id:
            return self.send_json(404, {"error": "Record endpoint not found."})
        try:
            body = self.read_body()
        except (ValueError, json.JSONDecodeError) as exc:
            return self.send_json(400, {"error": str(exc)})
        with LOCK:
            data = load_db()
            for index, item in enumerate(data[collection]):
                if str(item.get("id")) == record_id:
                    updated = {**item, **body} if partial else {**body, "id": item["id"]}
                    updated["id"] = item["id"]
                    data[collection][index] = updated
                    save_db(data)
                    return self.send_json(200, updated)
        return self.send_json(404, {"error": "Record not found."})

    def do_DELETE(self):
        collection, record_id, _ = self.route()
        if collection in (None, "invalid") or not record_id:
            return self.send_json(404, {"error": "Record endpoint not found."})
        with LOCK:
            data = load_db()
            old_len = len(data[collection])
            data[collection] = [item for item in data[collection] if str(item.get("id")) != record_id]
            if len(data[collection]) == old_len:
                return self.send_json(404, {"error": "Record not found."})
            save_db(data)
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))


if __name__ == "__main__":
    print(f"KisanMandi running at http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop.")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
