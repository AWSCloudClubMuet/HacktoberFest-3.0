import os
import re
import socket
from flask import Flask, request, abort

app = Flask(__name__)

# FIX: secret from environment variable, never hardcoded
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")


@app.route("/")
def home():
    return "<h1>DevSecOps Demo App</h1><p>Try /resolve?host=example.com</p>"


@app.route("/health")
def health():
    return {"status": "ok"}


@app.route("/resolve")
def resolve():
    host = request.args.get("host", "localhost")
    # FIX: validate input
    if not re.fullmatch(r"[A-Za-z0-9.\-]{1,253}", host):
        abort(400)
    # FIX: no shell commands, use Python's network library
    try:
        return {"host": host, "ip": socket.gethostbyname(host)}
    except socket.gaierror:
        return {"host": host, "error": "could not resolve"}, 404


if __name__ == "__main__":
    # FIX: debug off, host from config
    app.run(host=os.environ.get("APP_HOST", "127.0.0.1"),
            port=int(os.environ.get("APP_PORT", "5000")),
            debug=False)