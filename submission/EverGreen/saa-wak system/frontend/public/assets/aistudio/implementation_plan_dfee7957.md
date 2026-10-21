# KisanMandi — Implementation Plan

**Version:** 1.0  
**Deadline:** 5 hours 30 minutes (330 minutes)  
**Approach:** Build the complete demo path first, then add polish.

## 1. Definition of done

The submission is ready when:
- The deployed app opens and the main API calls succeed.
- Prices show demo label, daily change, and a 14-day chart.
- Marketplace search/filter and farmer listing CRUD work.
- Alerts can be created and managed, with threshold evaluation on refresh.
- Profit calculator outputs correct values and ±20% scenarios.
- Minimum seed-data counts are satisfied.
- The UI has responsive loading, empty, error, and success states.
- No unsupported live-data/security claims are made.

## 2. Timebox

| Time | Duration | Deliverable |
|---|---:|---|
| 00:00–00:20 | 20 min | Confirm scope, create repo/app, install essentials |
| 00:20–00:50 | 30 min | Configure mock API and verify HTTP reads/writes |
| 00:50–01:20 | 30 min | Create and validate seed data |
| 01:20–02:10 | 50 min | App shell, role demo, prices dashboard |
| 02:10–03:00 | 50 min | Marketplace filters and listing CRUD |
| 03:00–03:40 | 40 min | Price history chart and market comparison |
| 03:40–04:05 | 25 min | Alerts and threshold evaluation |
| 04:05–04:30 | 25 min | Profit calculator and scenario slider |
| 04:30–04:55 | 25 min | Deploy to Vercel and configure API URL |
| 04:55–05:30 | 35 min | Smoke test, fix blockers, prepare demo |

**Rule:** If the schedule slips, simplify styling before removing required behaviour. Keep a deployable build by around minute 270.

## 3. Phase-by-phase tasks

### Phase 1 — Bootstrap (0:00–0:20)
- [ ] Create React + TypeScript + Vite app.
- [ ] Install chart and icon packages only if needed.
- [ ] Create Git repository and first commit.
- [ ] Define color tokens and responsive page shell.
- [ ] Add `.env.example` and ignore local environment files.

Deliverable: app starts locally and has a basic navigation shell.

### Phase 2 — API first (0:20–0:50)
- [ ] Create six collections: users, crops, markets, prices, listings, alerts.
- [ ] Confirm GET requests work.
- [ ] Confirm POST and PATCH/PUT/DELETE work for listings and alerts.
- [ ] Confirm CORS and whether API keys are required.
- [ ] Save the base URL in local environment configuration.
- [ ] Do not put a privileged secret in a `VITE_` variable.

Deliverable: one working end-to-end CRUD request before substantial UI work.

### Phase 3 — Seed data (0:50–1:20)
- [ ] Seed 8 crops across 4+ categories.
- [ ] Seed 3 markets across different districts.
- [ ] Seed 336 price records (8 crops × 3 markets × 14 days).
- [ ] Seed 6 demo users, 12 listings, and 5 alerts.
- [ ] Check unique crop-market-date combinations and relationship IDs.
- [ ] Add fictional-data label to source fields and visible UI.

Deliverable: data is ready and consistent. If manual entry is too slow, generate JSON locally and import it if the mock provider supports bulk operations.

### Phase 4 — Prices dashboard (1:20–2:10)
- [ ] Build global app shell and role selector.
- [ ] Fetch crops, markets, and prices.
- [ ] Add crop and market selectors.
- [ ] Show latest price, unit, date, and daily change.
- [ ] Add loading, empty, error, and retry states.
- [ ] Keep demo-data disclosure visible.

Deliverable: core price experience works with real API responses.

### Phase 5 — Marketplace (2:10–3:00)
- [ ] Fetch listings and resolve crop/market/seller labels.
- [ ] Build listing cards and search/filter controls.
- [ ] Build add/edit form with validation.
- [ ] Implement create, update, and delete via API.
- [ ] Add confirmation before deletion.
- [ ] Add price-position badge with missing-data fallback.
- [ ] Show management actions only for the selected demo farmer's records.

Deliverable: marketplace browse and CRUD flows work.

### Phase 6 — Insights (3:00–3:40)
- [ ] Select 14 ordered dates for a crop-market series.
- [ ] Build responsive line chart and tooltip.
- [ ] Add multi-market comparison for the same crop/unit.
- [ ] Show latest, min, max, and period change.
- [ ] Validate missing-date handling.

Deliverable: chart and market comparison match the seeded records.

### Phase 7 — Alerts (3:40–4:05)
- [ ] Build alert form and list.
- [ ] Create and delete alerts via API.
- [ ] Implement enabled toggle using PATCH/PUT.
- [ ] Evaluate above/below conditions on load/refresh.
- [ ] Avoid duplicate alert events while condition remains continuously true.
- [ ] Display the limitation: no guaranteed background notifications.

Deliverable: alert management and on-refresh evaluation work.

### Phase 8 — Profit calculator (4:05–4:30)
- [ ] Add quantity, selling price, and cost inputs.
- [ ] Calculate revenue, total cost, profit/loss, and margin.
- [ ] Add slider from -20% to +20%.
- [ ] Handle zero revenue and invalid input.
- [ ] Add excluded-costs disclaimer.

Deliverable: calculator works without needing an API mutation.

### Phase 9 — Deploy (4:30–4:55)
- [ ] Run `npm run build`.
- [ ] Fix build-time issues.
- [ ] Push latest code to GitHub.
- [ ] Import project into Vercel.
- [ ] Configure API base URL for the production environment.
- [ ] Deploy and open the production URL.
- [ ] Confirm remote API CORS and reads.

Deliverable: public demo URL. Vite's default production output is `dist`; use platform deployment guidance rather than serving the development server publicly.

### Phase 10 — QA and demo (4:55–5:30)
- [ ] Test mobile width around 360 px.
- [ ] Test farmer listing create/edit/delete.
- [ ] Test buyer browsing and no management actions.
- [ ] Test alert above and below boundaries.
- [ ] Test daily change and profit calculations manually.
- [ ] Test API failure and retry state.
- [ ] Refresh the deployed URL and confirm data persists in the mock API.
- [ ] Prepare a 2–3 minute demo and clearly disclose fictional data.

## 4. Implementation order and dependency logic

```text
Project setup
    ↓
Mock API + seed data
    ↓
API client + shared types
    ↓
Prices dashboard ─────→ Insights chart
    ↓                         ↓
Marketplace CRUD          Alerts
    ↓
Profit calculator
    ↓
Deployment
    ↓
QA + demo
```

The calculator can be built independently at any point after the app shell. API setup and seed data should happen early because they are the largest external risk.

## 5. Suggested task split for a team

If multiple people are available:
- **Person A:** API setup, seed-data validation, API client.
- **Person B:** App shell, prices dashboard, responsive design.
- **Person C:** Marketplace cards, forms, CRUD.
- **Person D (if available):** Chart, alerts, calculator, integration tests.

Agree on the TypeScript interfaces and endpoint names before parallel implementation. One person should own integration and deployment.

## 6. Smoke-test cases

| Feature | Test | Expected result |
|---|---|---|
| Daily change | Latest 4200, previous 4000 | +200 and +5% |
| Zero baseline | Previous price 0 | Percent change unavailable; no divide-by-zero |
| Alert above | Latest 4300, target 4250 | Triggered on evaluation |
| Alert below | Latest 4100, target 4200 | Triggered on evaluation |
| Market badge | Mean 100, ask 94 | Below market |
| Market badge | Mean 100, ask 105 | Near market under strict `> 1.05 × mean` rule |
| Profit | Q=10, price=100, cost=70 | Revenue 1000, cost 700, profit 300, margin 30% |
| Scenario | Base price 100, slider +20% | Scenario price 120 |
| Missing data | No comparable market price | “Comparison unavailable” |
| Ownership UX | Buyer views listing | No edit/delete controls |

Use the same boundary rules in implementation and tests. For the badge, exactly 95% and 105% are “Near market” with the definitions in the schema/spec.

## 7. Scope control / cut line

### Must ship
- Prices dashboard and demo label.
- 14-day chart / market comparison.
- Marketplace browsing and farmer CRUD.
- Profit calculator.
- Alert create/manage and evaluation on refresh.
- Seed minimums and deployment.

### Simplify if behind
- Use one compact filter panel instead of advanced filtering.
- Use one chart type and a simple legend.
- Use seeded demo profiles rather than building authentication.
- Use toast/banner feedback instead of complex notification center.
- Keep styling consistent but avoid animation and elaborate onboarding.

### Do not fake
- Live prices, real seller verification, secure authorization, background alerts, or a successful deployment that has not been tested.

## 8. Final handoff checklist

- [ ] Repository README has setup steps and a clear demo-data disclaimer.
- [ ] `.env.example` has placeholder values only.
- [ ] No real secrets or personal data are committed.
- [ ] Seed counts and relationships validated.
- [ ] Build passes.
- [ ] Deployed URL manually tested.
- [ ] Demo script rehearsed.
