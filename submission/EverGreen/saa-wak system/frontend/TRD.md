# KisanMandi — Technical Requirements Document (TRD)

**Version:** 1.0  
**Architecture target:** Fast-to-build responsive SPA using a mock REST API  
**Primary constraint:** 5 hours 30 minutes

## 1. Recommended stack

- **Frontend:** React + TypeScript + Vite.
- **Styling:** Tailwind CSS or a small consistent CSS token system.
- **Charts:** Recharts.
- **Icons:** Lucide React.
- **API:** MockAPI.io or another HTTP mock REST service that supports the required CRUD operations.
- **Hosting:** Vercel static deployment.
- **Source control:** GitHub.
- **Date handling:** ISO 8601 date strings; display dates in a consistent local format.
- **Currency:** PKR, displayed with explicit unit per crop.

References: [Vite Guide](https://vite.dev/guide/), [MockAPI REST API docs](https://www.mockapi.com/docs/rest-api), [Recharts](https://recharts.org/), [Vite static deployment](https://vite.dev/guide/static-deploy.html), [Vercel Vite guide](https://vercel.com/docs/frameworks/frontend/vite).

## 2. System context

```text
Browser (React SPA)
  ├── UI components / pages
  ├── domain calculations (price deltas, alert evaluation, profit)
  └── API client (fetch + error handling)
          |
          | HTTPS JSON requests
          v
      Mock REST API
        ├── users
        ├── crops
        ├── markets
        ├── prices
        ├── listings
        └── alerts
```

No privileged credentials or secrets should be embedded in the browser bundle. If the provider requires an API key that grants write access, treat it as exposed and use a safe public demo setup or a server-side proxy. A mock API is not a production security boundary.

## 3. Application structure

Suggested project structure:

```text
kisanmandi/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── DemoDataBanner.tsx
│   │   ├── PriceCard.tsx
│   │   ├── PriceChart.tsx
│   │   ├── MarketComparison.tsx
│   │   ├── ListingCard.tsx
│   │   ├── AlertForm.tsx
│   │   ├── ProfitCalculator.tsx
│   │   ├── EmptyState.tsx
│   │   └── ErrorState.tsx
│   ├── pages/
│   │   ├── OnboardingPage.tsx
│   │   ├── PricesPage.tsx
│   │   ├── MarketplacePage.tsx
│   │   ├── InsightsPage.tsx
│   │   ├── AlertsPage.tsx
│   │   └── MyListingsPage.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── calculations.ts
│   │   ├── validation.ts
│   │   └── formatters.ts
│   ├── types/
│   │   └── index.ts
│   ├── data/
│   │   └── seed-plan.md
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Use only the modules needed for the chosen scaffold; do not spend the timebox creating boilerplate folders that are not used.

## 4. Runtime and configuration

Use a single configurable API base URL, for example:

```env
VITE_API_BASE_URL=https://your-mock-api-host.example
```

`.env.example` contains placeholders only. Local `.env` files must be ignored by Git. Anything prefixed with `VITE_` is client-visible and must not contain secrets.

API client requirements:
- Use `fetch`.
- Set `Content-Type: application/json` for JSON writes.
- Check `response.ok`; throw a useful typed error for non-2xx responses.
- Parse JSON defensively.
- Add a small request timeout only if it can be implemented without distracting from core functionality.
- Centralize endpoint paths and API errors.
- After POST/PATCH/DELETE, use the returned record or re-fetch the relevant collection to synchronize UI state.
- Show a loading state and a retry action on failed requests.

## 5. API contract

Base URL is provider-specific. Each endpoint below is a resource path relative to the configured base URL.

| Resource | Methods | Purpose |
|---|---|---|
| `/users` | GET | Read demo users |
| `/crops` | GET | Crop catalog and units |
| `/markets` | GET | Market catalog |
| `/prices` | GET | Read price history; filter client-side if provider filtering is limited |
| `/listings` | GET, POST | Browse and create listings |
| `/listings/{id}` | GET, PATCH/PUT, DELETE | Read/update/delete a listing |
| `/alerts` | GET, POST | Read and create alerts |
| `/alerts/{id}` | PATCH/PUT, DELETE | Toggle/update/delete an alert |

Mock providers differ in path syntax, filtering, pagination, and API-key requirements. Validate the actual endpoint behaviour in the provider playground before wiring every page. Do not assume nested relations or complex query filtering are supported.

## 6. Data relationships

- A `Price` belongs to one `Crop` and one `Market`.
- A `Listing` belongs to one seller `User` and one `Crop`, and may reference one `Market`.
- An `Alert` belongs to one owner `User`, one `Crop`, and one `Market`.
- A `User` has a role of `farmer` or `buyer`.
- IDs should be strings because mock services commonly generate string identifiers.

Keep relationships as IDs in the API payload; resolve labels from fetched crops, markets, and users in the UI. Avoid duplicating mutable crop/market names across records.

## 7. Required calculations

### Daily change

For selected crop and market, sort by date ascending and identify the latest two available records.

- `change = latestPrice - previousPrice`
- `changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : null`

If either record is missing, show “Change unavailable.” Do not treat missing values as zero.

### 14-day history

- Use the latest 14 consecutive calendar dates.
- Validate exactly one price per crop-market-date combination.
- If dates are missing, display a gap or explicit unavailable state; do not fabricate points.

### Best market

Compare the latest available price for the same crop, same unit, and comparable date across markets. Mark the best price as the highest price only; do not imply it is the best overall sale after transport/commission costs.

### Listing price badge

Let `meanPrice` be the mean of the latest available comparable prices for the same crop and unit across markets.

- `askingPrice < meanPrice * 0.95` → Below market.
- `askingPrice > meanPrice * 1.05` → Above market.
- Otherwise → Near market.

If no comparable prices exist, show unavailable. This is a simple demo heuristic, not an appraisal.

### Alerts

- `above`: latest price >= target.
- `below`: latest price <= target.
- Only evaluate enabled alerts with matching crop and market.
- Avoid duplicate in-app events while an alert remains continuously triggered; store the last triggered state/time locally or add a field if the mock schema permits it.
- Evaluation happens on load/refresh in this scope, not as a guaranteed background task.

### Profit calculator

- `revenue = quantity * sellingPricePerUnit`
- `totalCost = quantity * costPerUnit`
- `profit = revenue - totalCost`
- `marginPercent = revenue > 0 ? profit / revenue * 100 : null`
- `scenarioPrice = basePrice * (1 + sliderPercent / 100)` where slider is bounded from -20 to +20.

Validate quantity > 0, selling price >= 0, and cost >= 0. Label the calculation as an estimate.

## 8. Security and privacy constraints

- No real passwords, identity documents, or sensitive user information in seeded data.
- A role switcher or selected demo-user ID is not authentication.
- Client-side ownership checks are UX-only. Anyone can modify requests in browser dev tools.
- Do not use a public mock API for confidential data.
- Do not expose provider secrets in frontend environment variables.
- Display only fictional names and contact values that are clearly demo-safe.
- Production-grade authorization requires a trusted backend to verify user identity and resource ownership on every write.

## 9. Performance and reliability

- Fetch independent collections in parallel when practical.
- Cache fetched reference data (crops, markets, users) in app state during a session.
- Avoid repeated full-collection fetches on every component render.
- Keep charts responsive and avoid rendering all 336 points in every chart at once.
- Add empty, loading, failure, and success states.
- Confirm the build command succeeds before deployment.

## 10. Deployment

1. Set the API base URL in the deployment environment.
2. Confirm the API can be reached from the deployed origin and CORS permits requests.
3. Run the production build locally (`npm run build`).
4. Push source to GitHub.
5. Import the repository into Vercel or deploy with its CLI.
6. Open the deployed URL and test reads and writes against the remote API.
7. Do not mark deployment successful until the deployed URL and key flows have been manually checked.

Vite outputs production assets to `dist` by default. Vite's preview server is for local preview, not production hosting. See [Vite build](https://vite.dev/guide/build) and [Vite deployment](https://vite.dev/guide/static-deploy.html).

## 11. Technical acceptance criteria

- All six required resources exist and can be read.
- Listing and alert mutations reach the HTTP API and update the UI.
- No secret is committed or bundled.
- Daily changes, alert thresholds, market comparisons, and profit outputs pass manual test cases.
- Build completes with no blocking TypeScript or bundler errors.
- Deployed app successfully loads its data and can perform intended demo writes.
