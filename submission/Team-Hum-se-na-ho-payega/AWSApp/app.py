"""
Backup Vault - a small S3 backup / versioning / recovery console.

Run:  python3 app.py     then open http://localhost:8000

With no AWS settings it uses a local folder that behaves like a versioned
S3 bucket, so everything can be tried offline. Set BACKUP_BUCKET (and have
AWS credentials configured the normal way) to use a real bucket instead.
"""
import hashlib, json, os, threading
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).parent
DATA = ROOT / "data"
SOURCE = DATA / "sample"          # the files we are protecting
STATE_FILE = DATA / "state.json"
PORT = int(os.environ.get("PORT", 8000))
BUCKET = os.environ.get("BACKUP_BUCKET")
SNS_TOPIC = os.environ.get("SNS_TOPIC_ARN")
lock = threading.Lock()


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def sha256(data: bytes):
    return hashlib.sha256(data).hexdigest()


# ---------- storage backends ----------
# Both expose the same few methods so the rest of the app doesn't care which is in use.

class LocalStore:
    label = "Local folder (S3 simulation)"

    def __init__(self, root: Path):
        self.blobs = root / "vault"
        self.blobs.mkdir(parents=True, exist_ok=True)
        self.index_file = root / "vault_index.json"
        self.index = json.loads(self.index_file.read_text()) if self.index_file.exists() else {}

    def _save(self):
        self.index_file.write_text(json.dumps(self.index))

    def _blob(self, key, vid):
        return self.blobs / f"{key.replace('/', '__')}.{vid}"

    def put(self, key, data):
        versions = self.index.setdefault(key, [])
        vid = f"v{len(versions) + 1:04d}"
        self._blob(key, vid).write_bytes(data)
        versions.append(dict(id=vid, size=len(data), sha=sha256(data), time=now(), deleted=False))
        self._save()
        return vid

    def delete(self, key):
        versions = self.index.get(key, [])
        versions.append(dict(id=f"v{len(versions) + 1:04d}", size=0, sha="", time=now(), deleted=True))
        self._save()

    def versions(self, key):
        return list(reversed(self.index.get(key, [])))

    def current(self):
        return {k: v[-1] for k, v in self.index.items() if v and not v[-1]["deleted"]}

    def read(self, key, vid):
        return self._blob(key, vid).read_bytes()

    def restore(self, key, vid):
        return self.put(key, self.read(key, vid))

    def usage(self):
        vs = [v for versions in self.index.values() for v in versions if not v["deleted"]]
        return len(vs), sum(v["size"] for v in vs)

    def setup(self):
        return dict(bucket="local-vault", public_access_blocked=True, versioning=True,
                    encryption="simulated", lifecycle=True)


class S3Store:
    label = f"AWS S3 ({BUCKET})"

    def __init__(self, bucket):
        import boto3  # imported here so local mode doesn't need it installed
        self.s3 = boto3.client("s3")
        self.bucket = bucket

    def put(self, key, data):
        r = self.s3.put_object(Bucket=self.bucket, Key=key, Body=data,
                               Metadata={"sha256": sha256(data)}, ServerSideEncryption="AES256")
        return r["VersionId"]

    def delete(self, key):
        self.s3.delete_object(Bucket=self.bucket, Key=key)

    def _sha(self, key, vid=None):
        args = dict(Bucket=self.bucket, Key=key)
        if vid:
            args["VersionId"] = vid
        return self.s3.head_object(**args)["Metadata"].get("sha256", "")

    def versions(self, key):
        r = self.s3.list_object_versions(Bucket=self.bucket, Prefix=key)
        out = []
        for v in r.get("Versions", []):
            if v["Key"] == key:
                out.append(dict(id=v["VersionId"], size=v["Size"], sha=self._sha(key, v["VersionId"]),
                                time=v["LastModified"].isoformat(timespec="seconds"), deleted=False))
        for m in r.get("DeleteMarkers", []):
            if m["Key"] == key:
                out.append(dict(id=m["VersionId"], size=0, sha="", deleted=True,
                                time=m["LastModified"].isoformat(timespec="seconds")))
        return sorted(out, key=lambda v: v["time"], reverse=True)

    def current(self):
        out = {}
        for page in self.s3.get_paginator("list_objects_v2").paginate(Bucket=self.bucket):
            for o in page.get("Contents", []):
                out[o["Key"]] = dict(size=o["Size"], sha=self._sha(o["Key"]),
                                     time=o["LastModified"].isoformat(timespec="seconds"), deleted=False)
        return out

    def read(self, key, vid):
        return self.s3.get_object(Bucket=self.bucket, Key=key, VersionId=vid)["Body"].read()

    def restore(self, key, vid):
        # copying an old version onto the same key makes it the newest version
        r = self.s3.copy_object(Bucket=self.bucket, Key=key, MetadataDirective="COPY",
                                CopySource=dict(Bucket=self.bucket, Key=key, VersionId=vid))
        return r["VersionId"]

    def usage(self):
        count = total = 0
        for page in self.s3.get_paginator("list_object_versions").paginate(Bucket=self.bucket):
            for v in page.get("Versions", []):
                count += 1
                total += v["Size"]
        return count, total

    def setup(self):
        region = self.s3.meta.region_name
        if region and region != "us-east-1":
            self.s3.create_bucket(Bucket=self.bucket, CreateBucketConfiguration={"LocationConstraint": region})
        else:
            self.s3.create_bucket(Bucket=self.bucket)
        self.s3.put_public_access_block(Bucket=self.bucket, PublicAccessBlockConfiguration=dict(
            BlockPublicAcls=True, IgnorePublicAcls=True, BlockPublicPolicy=True, RestrictPublicBuckets=True))
        self.s3.put_bucket_versioning(Bucket=self.bucket, VersioningConfiguration={"Status": "Enabled"})
        self.s3.put_bucket_encryption(Bucket=self.bucket, ServerSideEncryptionConfiguration={
            "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]})
        p = state["policy"]
        self.s3.put_bucket_lifecycle_configuration(Bucket=self.bucket, LifecycleConfiguration={"Rules": [{
            "ID": "old-versions", "Status": "Enabled", "Filter": {"Prefix": ""},
            "NoncurrentVersionTransitions": [{"NoncurrentDays": p["glacier_days"], "StorageClass": "GLACIER"}],
            "NoncurrentVersionExpiration": {"NoncurrentDays": p["retention_days"]}}]})
        return dict(bucket=self.bucket, public_access_blocked=True, versioning=True,
                    encryption="AES256", lifecycle=True)


# ---------- persistent state (job log, events, policy) ----------

def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return dict(jobs=[], events=[], recoveries=[], setup=None, last_verify=None,
                policy=dict(frequency="Daily", rpo_hours=24, rto_minutes=60,
                            retention_days=90, glacier_days=30))

def save_state():
    DATA.mkdir(exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=1))

def event(level, message):
    state["events"].append(dict(time=now(), level=level, message=message))
    if level == "alert" and SNS_TOPIC:
        try:
            import boto3
            boto3.client("sns").publish(TopicArn=SNS_TOPIC, Subject="Backup alert", Message=message)
        except Exception as e:  # an alert failing shouldn't take the app down
            state["events"].append(dict(time=now(), level="warn", message=f"SNS publish failed: {e}"))

state = load_state()
store = S3Store(BUCKET) if BUCKET else LocalStore(DATA)


# ---------- actions ----------

SAMPLE_FILES = {
    "reports/sales_q3.csv": "region,units,revenue\nnorth,120,5400\nsouth,98,4410\neast,143,6435\nwest,87,3915\n",
    "config/app.json": json.dumps({"app": "orders", "debug": False, "db_host": "db.internal", "retries": 3}, indent=2),
    "docs/runbook.md": "# Orders runbook\n\n1. Check the queue depth.\n2. Restart the worker if it is stuck.\n",
    "docs/notes.txt": "Meeting notes, 3rd Oct.\nDecided to keep backups for 90 days.\n",
}

def make_sample():
    for name, text in SAMPLE_FILES.items():
        path = SOURCE / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)

def source_files():
    return sorted(str(p.relative_to(SOURCE)).replace(os.sep, "/") for p in SOURCE.rglob("*") if p.is_file())

def run_backup(simulate_failure=False):
    names = source_files()
    if simulate_failure:
        names.append("reports/missing_file.csv")  # doesn't exist, so the upload step will fail
    current = store.current()
    results = []
    for name in names:
        job = dict(time=now(), file=name, outcome="success", error="", sha="")
        try:
            data = (SOURCE / name).read_bytes()
            job["sha"] = sha256(data)
            if name in current and current[name]["sha"] == job["sha"]:
                job["outcome"] = "unchanged"
            else:
                store.put(name, data)
        except FileNotFoundError:
            job.update(outcome="failed", error=f"Source file not found: {name}")
        except Exception as e:
            job.update(outcome="failed", error=f"{type(e).__name__}: {e}")
        if job["outcome"] == "failed":
            event("alert", f"Backup failed for {name}: {job['error']}")
        state["jobs"].append(job)
        results.append(job)
    ok = sum(j["outcome"] != "failed" for j in results)
    event("info", f"Backup finished: {ok}/{len(results)} files ok")
    return results

def run_verify():
    current = store.current()
    rows = []
    for name in source_files():
        local = (SOURCE / name).read_bytes()
        remote = current.get(name)
        if not remote:
            status, note = "missing", "Not in the backup (never uploaded, or deleted)"
        elif remote["size"] != len(local):
            status, note = "size_mismatch", f"Backup is {remote['size']} bytes, source is {len(local)}"
        elif remote["sha"] != sha256(local):
            status, note = "stale", "Checksum differs from source; the file changed since the last backup"
        else:
            status, note = "ok", "Size and checksum match"
        rows.append(dict(file=name, status=status, note=note))
    bad = [r for r in rows if r["status"] != "ok"]
    report = dict(time=now(), expected=len(rows), found=len(rows) - sum(r["status"] == "missing" for r in rows),
                  healthy=len(rows) - len(bad), rows=rows)
    state["last_verify"] = report
    if bad:
        event("alert", f"Verification found {len(bad)} problem file(s): " + ", ".join(r["file"] for r in bad))
    else:
        event("info", "Verification passed: every file matches its backup")
    return report

def do_restore(key, vid):
    versions = {v["id"]: v for v in store.versions(key)}
    if vid not in versions or versions[vid]["deleted"]:
        raise ValueError("That version can't be restored (it's a delete marker or doesn't exist)")
    new_vid = store.restore(key, vid)
    # check the restored object really is the bytes we meant to bring back
    restored = store.read(key, new_vid)
    verified = sha256(restored) == versions[vid]["sha"]
    state["recoveries"].append(dict(time=now(), file=key, from_version=vid, verified=verified))
    event("info" if verified else "alert", f"Restored {key} from {vid}; verified={verified}")
    return dict(verified=verified, new_version=new_vid)

def build_status():
    jobs = [j for j in state["jobs"] if j["outcome"] != "unchanged"]
    good = [j for j in jobs if j["outcome"] == "success"]
    last = good[-1]["time"] if good else None
    missed = True
    if last:
        age = datetime.now(timezone.utc) - datetime.fromisoformat(last)
        missed = age.total_seconds() > state["policy"]["rpo_hours"] * 3600
    current, (count, size) = store.current(), store.usage()
    files = []
    for name in sorted(set(source_files()) | set(current)):
        src = SOURCE / name
        files.append(dict(file=name, in_source=src.exists(), in_backup=name in current,
                          versions=len([v for v in store.versions(name) if not v["deleted"]]),
                          size=current[name]["size"] if name in current else None))
    return dict(mode=store.label, setup=state["setup"], policy=state["policy"], files=files,
                totals=dict(jobs=len(jobs), ok=len(good), failed=len(jobs) - len(good),
                            last_success=last, missed=missed, versions=count, bytes=size),
                recent_jobs=state["jobs"][-12:][::-1], events=state["events"][-10:][::-1],
                recoveries=state["recoveries"][-5:][::-1], verify=state["last_verify"])


# ---------- http layer ----------

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # keep the terminal quiet

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/api/status":
            with lock:
                return self.send_json(build_status())
        if url.path == "/api/versions":
            key = parse_qs(url.query).get("key", [""])[0]
            with lock:
                return self.send_json(store.versions(key))
        page = ROOT / "static" / ("index.html" if url.path == "/" else url.path.lstrip("/"))
        if not page.is_file() or "static" not in page.resolve().parts:
            return self.send_json({"error": "not found"}, 404)
        types = {".html": "text/html", ".css": "text/css", ".js": "text/javascript"}
        body = page.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", types.get(page.suffix, "text/plain") + "; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(length) or "{}")
        route = urlparse(self.path).path
        try:
            with lock:
                result = self.dispatch(route, body)
                save_state()
            self.send_json(result)
        except Exception as e:
            self.send_json({"error": str(e)}, 400)

    def dispatch(self, route, body):
        if route == "/api/sample":
            make_sample()
            return {"files": source_files()}
        if route == "/api/setup":
            state["setup"] = store.setup()
            event("info", "Storage configured: versioning on, public access blocked, lifecycle rule applied")
            return state["setup"]
        if route == "/api/backup":
            return run_backup(body.get("fail", False))
        if route == "/api/verify":
            return run_verify()
        if route == "/api/edit-source":   # change a local file so it differs from its backup
            path = SOURCE / body["file"]
            path.write_text(path.read_text() + f"\n# edited {now()}\n")
            return {"ok": True}
        if route == "/api/simulate":
            key = body["file"]
            if body["action"] == "delete":
                store.delete(key)
                event("warn", f"Simulated accidental delete of {key}")
            else:
                store.put(key, b"oops, wrong content uploaded by mistake")
                event("warn", f"Simulated bad update of {key}")
            return {"ok": True}
        if route == "/api/restore":
            return do_restore(body["file"], body["version"])
        if route == "/api/policy":
            for k in state["policy"]:
                if k in body:
                    state["policy"][k] = body[k] if k == "frequency" else int(body[k])
            return state["policy"]
        raise ValueError("unknown action")


if __name__ == "__main__":
    DATA.mkdir(exist_ok=True)
    if not SOURCE.exists():
        make_sample()
    print(f"Backup Vault running at http://localhost:{PORT}  [{store.label}]")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
