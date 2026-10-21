# KisanMandi HTTP mock API

Base: `http://127.0.0.1:8080`. JSON requests and responses. No package installation is needed for the Python 3.10+ server. Records persist in `mock_api/data/db.json`, which is excluded from Git.

All prices and production costs are **PKR per 40 kg maund**; quantities are **maunds**. Seed data is fictional. Daily prices cover the latest 14 consecutive dates. New dates carry the previous mock rate forward; this is a simulator, not an external crop-price feed.

| Route | Behavior |
|---|---|
| `GET /health` | Server status and units |
| `GET /users` | Six seeded demo profiles |
| `POST /users` | Create profile with `name`, `phone`, `district`, `role` |
| `POST /sessions` | Demo sign-in with `demo_user_id` from `u1`…`u6` |
| `GET /session` | Restore current profile using Bearer token |
| `GET /crops` | Eight crops in four categories |
| `GET /markets` | Three markets in three Sindh districts |
| `GET /prices` | 336 records, maintaining the 14-day window |
| `GET /prices?crop_id=c1&market_id=m1` | Filter any collection by exact field values |
| `GET /listings` | Listings including status; app marketplace shows Active only |
| `POST /listings` | Farmer creates a listing; server assigns owner and timestamp |
| `PATCH /listings/{id}` | Owner edits fields or sets `status` to `Sold` |
| `DELETE /listings/{id}` | Owner deletes listing |
| `GET /alerts` | Current user’s alerts, including computed `triggered` and `latest_price` |
| `POST /alerts` | Farmer creates an alert |
| `PATCH /alerts/{id}` | Owner edits target, crop, market, condition or active status |
| `DELETE /alerts/{id}` | Owner deletes alert |

`POST /users` and `POST /sessions` return the profile and an `X-Session-Token` response header. Subsequent private requests send `Authorization: Bearer TOKEN`. Session IDs, API URL and the token are local preferences; crop, market, user, price, alert and listing records are always read or written over HTTP.

Only seeded IDs can use demo sign-in. New profiles resume through their issued token. This is deliberately a local hackathon identity flow, without password or OTP authentication. Keep it for fictional demonstrations.

Example listing body:

```json
{
  "crop_id": "c1",
  "quantity": 20,
  "asking_price": 3500,
  "district": "Hyderabad",
  "grade": "A",
  "available_from": "YYYY-MM-DD",
  "contact_phone": "+920000000001"
}
```

Use today or a future ISO date. `contact_phone` and `created_at` extend the issue’s listing schema to support per-listing contacts and reliable newest-first sorting. `id`, `user_id` and `created_at` cannot be changed by the client.

Example alert body:

```json
{
  "crop_id": "c1",
  "market_id": "m1",
  "condition": "Above",
  "target_price": 3500,
  "active_status": true
}
```

Above evaluates `latest >= target`; Below evaluates `latest <= target`. Paused alerts never trigger. The Flutter refresh requests prices first, then alerts, so the badge reflects the refreshed price window. The count is the number of **currently matching active rules**, not historical notifications.

Errors use an HTTP status plus `{"error":"message"}`: 400 invalid input, 401 invalid/missing session, 403 forbidden role or ownership, 404 missing record and 405 unsupported write. Reference collections are read-only after seeding. Positive values must be finite and ≤10 billion. New or changed available-from dates must not be in the past; naturally aged existing dates are retained when editing another field.

To reset the simulator, stop the server and delete `mock_api/data/db.json`; restarting regenerates the seed relative to the current date. This also invalidates existing profile sessions. Use **Change profile** and choose a demo profile again.
