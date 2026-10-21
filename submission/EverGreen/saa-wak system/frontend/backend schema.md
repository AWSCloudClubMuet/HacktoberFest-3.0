# KisanMandi — Backend Schema and Mock API Contract

**Version:** 1.0  
**Purpose:** Define seed data, resource fields, relationships, and HTTP operations for the hackathon mock API.

## 1. General conventions

- JSON over HTTPS.
- IDs are strings.
- Use ISO dates: `YYYY-MM-DD`.
- Use ISO timestamps for event fields where needed.
- Prices and costs are numeric values in PKR; include an explicit unit.
- All seed data is fictional and must be labelled as demo data in the UI.
- Do not store real passwords, national IDs, or private personal information.
- Use one canonical spelling for each crop and market.

## 2. Resource: `users`

Represents demo profiles only, not verified identities.

| Field | Type | Required | Example |
|---|---|---:|---|
| `id` | string | yes | `"user-01"` |
| `displayName` | string | yes | `"Demo Farmer A"` |
| `role` | enum | yes | `"farmer"` or `"buyer"` |
| `district` | string | yes | `"Hyderabad"` |
| `phone` | string | no | `"0300-0000001"` (fictional demo value) |
| `createdAt` | ISO date/time | yes | `"2026-10-01T10:00:00Z"` |

Seed minimum: 6 users. Use fictional display names and non-routable/demo contact values where possible.

Example:
```json
{
  "id": "user-01",
  "displayName": "Demo Farmer A",
  "role": "farmer",
  "district": "Hyderabad",
  "phone": "0300-0000001",
  "createdAt": "2026-10-01T10:00:00Z"
}
```

## 3. Resource: `crops`

| Field | Type | Required | Example |
|---|---|---:|---|
| `id` | string | yes | `"crop-wheat"` |
| `name` | string | yes | `"Wheat"` |
| `category` | enum/string | yes | `"Grains"` |
| `unit` | string | yes | `"PKR per 40 kg"` |
| `description` | string | no | `"Sample grain price series"` |
| `isActive` | boolean | yes | `true` |

Seed minimum: 8 crops across 4+ categories. Suggested crops: wheat, rice, cotton, sugarcane, onion, tomato, mango, banana. Choose a sensible consistent unit per crop and use it for every market/date.

## 4. Resource: `markets`

| Field | Type | Required | Example |
|---|---|---:|---|
| `id` | string | yes | `"market-hyd"` |
| `name` | string | yes | `"Hyderabad Market"` |
| `district` | string | yes | `"Hyderabad"` |
| `province` | string | yes | `"Sindh"` |
| `isActive` | boolean | yes | `true` |

Seed minimum: 3 markets in different districts. Suggested examples: Hyderabad, Sukkur, and Mirpur Khas. Market names are demo labels and should not imply official affiliation.

## 5. Resource: `prices`

One record represents one crop at one market on one date.

| Field | Type | Required | Example |
|---|---|---:|---|
| `id` | string | yes | `"price-wheat-hyd-2026-10-08"` |
| `cropId` | string | yes | `"crop-wheat"` |
| `marketId` | string | yes | `"market-hyd"` |
| `date` | ISO date | yes | `"2026-10-08"` |
| `price` | number | yes | `4100` |
| `unit` | string | yes | `"PKR per 40 kg"` |
| `sourceLabel` | string | yes | `"Fictional demo data"` |

Seed requirement: 8 crops × 3 markets × 14 consecutive dates = **336 records**. The same crop/market/date combination must not be duplicated. Use fictional values with plausible variation, not claims of actual market prices.

Example:
```json
{
  "id": "price-wheat-hyd-2026-10-08",
  "cropId": "crop-wheat",
  "marketId": "market-hyd",
  "date": "2026-10-08",
  "price": 4100,
  "unit": "PKR per 40 kg",
  "sourceLabel": "Fictional demo data"
}
```

## 6. Resource: `listings`

| Field | Type | Required | Example |
|---|---|---:|---|
| `id` | string | yes | `"listing-01"` |
| `sellerId` | string | yes | `"user-01"` |
| `cropId` | string | yes | `"crop-onion"` |
| `quantity` | number | yes | `500` |
| `unit` | string | yes | `"kg"` |
| `grade` | string | yes | `"Grade A"` |
| `askingPricePerUnit` | number | yes | `95` |
| `marketId` | string | yes | `"market-hyd"` |
| `district` | string | yes | `"Hyderabad"` |
| `description` | string | no | `"Fictional demo listing"` |
| `contactMethod` | string | no | `"Demo contact only"` |
| `status` | enum | yes | `"available"`, `"reserved"`, `"sold"` |
| `createdAt` | ISO date/time | yes | `"2026-10-19T09:00:00Z"` |
| `updatedAt` | ISO date/time | yes | `"2026-10-19T09:00:00Z"` |

Seed minimum: 12 listings. Ensure each seller ID references a seeded user with role `farmer`. Asking price should be compared only to prices using a compatible unit.

## 7. Resource: `alerts`

| Field | Type | Required | Example |
|---|---|---:|---|
| `id` | string | yes | `"alert-01"` |
| `userId` | string | yes | `"user-01"` |
| `cropId` | string | yes | `"crop-wheat"` |
| `marketId` | string | yes | `"market-hyd"` |
| `condition` | enum | yes | `"above"` or `"below"` |
| `targetPrice` | number | yes | `4300` |
| `isEnabled` | boolean | yes | `true` |
| `lastEvaluatedPrice` | number/null | no | `4250` |
| `lastTriggeredAt` | ISO date/time/null | no | `null` |
| `createdAt` | ISO date/time | yes | `"2026-10-18T08:00:00Z"` |

Seed minimum: 5 alerts. Only farmers should own alerts in the demo. Alert evaluation is client-triggered on load/refresh unless a real background service is added later.

## 8. Relationships and integrity rules

- `prices.cropId` → `crops.id`
- `prices.marketId` → `markets.id`
- `listings.sellerId` → `users.id`
- `listings.cropId` → `crops.id`
- `listings.marketId` → `markets.id`
- `alerts.userId` → `users.id`
- `alerts.cropId` → `crops.id`
- `alerts.marketId` → `markets.id`

Validate IDs in the application before writes because many mock APIs do not enforce foreign keys or referential integrity.

## 9. REST operations

| Request | Expected behaviour |
|---|---|
| `GET /users` | Return demo profiles |
| `GET /crops` | Return crop catalog |
| `GET /markets` | Return market catalog |
| `GET /prices` | Return price history |
| `GET /listings` | Return listings |
| `POST /listings` | Create listing |
| `GET /listings/{id}` | Read one listing |
| `PATCH /listings/{id}` or `PUT` | Update listing, subject to provider support |
| `DELETE /listings/{id}` | Delete listing |
| `GET /alerts` | Return alerts |
| `POST /alerts` | Create alert |
| `PATCH /alerts/{id}` or `PUT` | Update enabled state/fields |
| `DELETE /alerts/{id}` | Delete alert |

MockAPI providers may use different endpoint configuration and methods. Confirm the actual base URL, path syntax, API key requirements, CORS, and PATCH/PUT support in the chosen provider before integration.

## 10. Validation rules

- `role` must be `farmer` or `buyer`.
- `quantity` must be greater than zero.
- `price`, `askingPricePerUnit`, `targetPrice`, and costs must be non-negative; require a positive target if that is the selected UX rule.
- `condition` must be `above` or `below`.
- `status` must be one of the defined listing states.
- Crop and market IDs must exist in the fetched reference collections.
- One price record per crop-market-date.
- Compare prices only when crop and unit match.
- Reject malformed dates and missing required fields in the UI before sending requests.

## 11. Authorization caveat

A mock REST API and frontend-only role checks do not provide secure authorization. A user can alter the selected demo ID or call endpoints directly. For the hackathon, restrict the data to fictional demo content and present ownership controls as demonstration UX. A production implementation needs a trusted server that authenticates users and verifies ownership for every listing/alert mutation.

## 12. Seed-data quality checks

- [ ] At least 8 crops across 4+ categories.
- [ ] At least 3 markets from different districts.
- [ ] Exactly 14 consecutive dates in the intended range.
- [ ] 336 price records total for the full 8 × 3 × 14 matrix.
- [ ] No duplicate crop-market-date keys.
- [ ] At least 6 users, 12 listings, and 5 alerts.
- [ ] Every foreign-key-like ID resolves to an existing record.
- [ ] All data is clearly fictional and no live-data claims appear.
