import sqlite3
from pathlib import Path

GIG_ID = 1  # change this to any existing gig id that is still Open

conn = sqlite3.connect(Path(__file__).resolve().parent / "campus_gig.db")
conn.execute("UPDATE gigs SET deadline = '2026-01-01' WHERE id = ?", (GIG_ID,))
conn.commit()
conn.close()
print(f"Gig {GIG_ID} deadline moved to the past")
