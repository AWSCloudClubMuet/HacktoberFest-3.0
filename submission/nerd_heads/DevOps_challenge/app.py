import subprocess
from flask import Flask, request

app = Flask(__name__)

# DUMMY fake token for demo only, not a real secret
GITHUB_TOKEN = "ghp_1a2b3c4d5e6f7g8h9i0jklmnopqrstuvwxyz"

@app.route("/")
def home():
    return "Hello from DevSecOps demo app!"

@app.route("/ping")
def ping():
    host = request.args.get("host", "127.0.0.1")
    # Command injection bug: user input goes straight into a shell
    out = subprocess.check_output("ping -c 1 " + host, shell=True)
    return out

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)