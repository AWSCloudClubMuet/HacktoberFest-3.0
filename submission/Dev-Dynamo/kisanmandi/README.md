# KisanMandi — Crop Prices & Produce Marketplace

Run (Python 3 only, no installs):

    cd kisanmandi
    python3 server.py

Open http://127.0.0.1:8000/ in your browser.

- API: http://127.0.0.1:8000/api/{users,crops,markets,prices,listings,alerts}  (GET, POST, PATCH, PUT, DELETE)
- Reset demo data any time: `python3 seed.py` (then restart server.py)
- Files: server.py (API + static server), seed.py (fictional data), data/db.json, index.html, css/style.css, js/app.js
