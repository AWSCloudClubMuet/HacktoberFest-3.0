"""
ReliefHub Mock REST API Server Runner
Supports JSON Server or standalone fallback REST API using db.json.
Runs on http://127.0.0.1:5000 (or custom port).
"""

import sys
import os
import json
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

PORT = 5000
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db.json")

class MockRESTRequestHandler(BaseHTTPRequestHandler):
    """
    Full JSON-Server compatible REST API handler in pure Python.
    Supports GET, POST, PUT, PATCH, DELETE for all db.json collections.
    Supports filtering by query parameters (e.g. ?camp_id=1).
    """

    def _read_db(self):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            return {}

    def _write_db(self, data):
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def _send_json(self, status_code, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _parse_url(self):
        parsed = urllib.parse.urlparse(self.path)
        path_parts = [p for p in parsed.path.strip("/").split("/") if p]
        collection = path_parts[0] if path_parts else None
        item_id = path_parts[1] if len(path_parts) > 1 else None
        query_params = urllib.parse.parse_qs(parsed.query)
        # flatten single value query params
        flat_query = {k: v[0] for k, v in query_params.items()}
        return collection, item_id, flat_query

    def do_GET(self):
        collection, item_id, query = self._parse_url()
        if not collection:
            # Root health check / summary
            db = self._read_db()
            summary = {k: len(v) for k, v in db.items() if isinstance(v, list)}
            self._send_json(200, {"message": "ReliefHub Mock REST API is running", "collections": summary})
            return

        db = self._read_db()
        if collection not in db:
            self._send_json(404, {"error": f"Collection '{collection}' not found"})
            return

        records = db[collection]
        if item_id:
            for item in records:
                if str(item.get("id")) == str(item_id):
                    self._send_json(200, item)
                    return
            self._send_json(404, {"error": f"Item {item_id} not found in '{collection}'"})
            return

        # Filtering support e.g. ?camp_id=1 or ?status=Active
        if query:
            filtered = []
            for item in records:
                match = True
                for qk, qv in query.items():
                    if str(item.get(qk, "")).lower() != str(qv).lower():
                        match = False
                        break
                if match:
                    filtered.append(item)
            self._send_json(200, filtered)
        else:
            self._send_json(200, records)

    def do_POST(self):
        collection, item_id, _ = self._parse_url()
        if not collection:
            self._send_json(400, {"error": "Missing collection"})
            return

        db = self._read_db()
        if collection not in db:
            db[collection] = []

        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len) if content_len > 0 else b"{}"
        try:
            new_item = json.loads(body.decode("utf-8"))
        except Exception:
            self._send_json(400, {"error": "Invalid JSON body"})
            return

        # Generate unique ID if missing
        if "id" not in new_item or not new_item["id"]:
            existing_ids = [int(x["id"]) for x in db[collection] if str(x.get("id", "")).isdigit()]
            new_id = str(max(existing_ids, default=0) + 1)
            new_item["id"] = new_id
        else:
            new_item["id"] = str(new_item["id"])

        db[collection].append(new_item)
        self._write_db(db)
        self._send_json(201, new_item)

    def do_PUT(self):
        self._handle_update(is_patch=False)

    def do_PATCH(self):
        self._handle_update(is_patch=True)

    def _handle_update(self, is_patch=False):
        collection, item_id, _ = self._parse_url()
        if not collection or not item_id:
            self._send_json(400, {"error": "Collection and item id required"})
            return

        db = self._read_db()
        if collection not in db:
            self._send_json(404, {"error": f"Collection '{collection}' not found"})
            return

        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len) if content_len > 0 else b"{}"
        try:
            update_data = json.loads(body.decode("utf-8"))
        except Exception:
            self._send_json(400, {"error": "Invalid JSON body"})
            return

        for idx, item in enumerate(db[collection]):
            if str(item.get("id")) == str(item_id):
                if is_patch:
                    item.update(update_data)
                    item["id"] = str(item_id)
                    db[collection][idx] = item
                else:
                    update_data["id"] = str(item_id)
                    db[collection][idx] = update_data
                self._write_db(db)
                self._send_json(200, db[collection][idx])
                return

        self._send_json(404, {"error": f"Item {item_id} not found in '{collection}'"})

    def do_DELETE(self):
        collection, item_id, _ = self._parse_url()
        if not collection or not item_id:
            self._send_json(400, {"error": "Collection and item id required"})
            return

        db = self._read_db()
        if collection not in db:
            self._send_json(404, {"error": f"Collection '{collection}' not found"})
            return

        initial_len = len(db[collection])
        db[collection] = [x for x in db[collection] if str(x.get("id")) != str(item_id)]

        if len(db[collection]) < initial_len:
            self._write_db(db)
            self._send_json(200, {"message": f"Item {item_id} deleted successfully"})
        else:
            self._send_json(404, {"error": f"Item {item_id} not found in '{collection}'"})

    def log_message(self, format, *args):
        # Clean quiet logging
        sys.stderr.write(f"[ReliefHub-API] {args[0]} {args[1]} -> {args[2]}\n")


def start_server(port=PORT):
    print(f"Starting ReliefHub Mock REST API on http://127.0.0.1:{port} ...")
    print(f"Database file: {DB_FILE}")
    server = HTTPServer(("127.0.0.1", port), MockRESTRequestHandler)
    print(f"Server is ready! Endpoints: /camps, /inventory, /needs, /dispatches, /donations, /volunteers")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    start_server(port)
