# ReliefHub: 5.5-hour plan, pitch and demo script

Run it: `cd reliefhub && node server.js` then open http://localhost:3001 (Node 18+, nothing to install).
Reset demo data any time: `curl -X POST localhost:3001/api/reset`

## 1. Time plan (the video's rule: 3 solid core features beat 15 half-built ones)

| Time | Goal |
|---|---|
| 0:00-0:20 | Read the brief twice. Run this app, click everything, list what you want to change. |
| 0:20-1:00 | Understand the rules by testing them: try over-dispatching, cancelling, assigning to a Closed camp. |
| 1:00-3:00 | Your own improvements on the core flow only (camps, needs, dispatch, dashboard). |
| 3:00-4:00 | Edge cases: validation messages, empty states, mobile layout, Field Volunteer role. |
| 4:00-4:45 | Pitch deck (see section 2) plus screenshots for the before/after slide. |
| 4:45-5:15 | Rehearse the demo 3 times with `/api/reset` between runs. |
| 5:15-5:30 | Buffer. Do not add features. |

Ideas worth adding if time remains: need-level "Dispatch" shortcut (already included), CSV export of critical gaps, Urdu labels, a map of camps.

## 2. Pitch deck (6 slides, 4 minutes)

1. **Problem.** "When floods hit Sindh, three organisations can send rice to the same camp while another camp has no clean water. Who is told?"
2. **Evidence.** Add 2-3 real facts: number of displaced people, reports of duplicate or missed aid (cite NDMA/PDMA/UN OCHA or news reports; do not invent numbers).
3. **Cost of the problem.** Quantify: spoiled or duplicated stock, days a camp waits, disease risk from unsafe water. Use sourced figures.
4. **Solution.** Screenshot of the Dashboard: Critical Gaps table. One line: "One shared view that shows who is underserved right now and stops over-dispatching."
5. **How it works.** Camp needs, reserved stock, dispatch states, donations that feed stock, volunteers assigned. Mention server-enforced rules.
6. **Impact and roadmap.** Before/after (example format: "finding the neediest camp: 2 hours of phone calls to 10 seconds"). Roadmap: SMS updates from field volunteers, map view, offline mode.

## 3. Live demo script (3 minutes)

1. Dashboard: point at KPIs and the red Critical Gaps rows. "These camps are short of high-priority items."
2. Click **Dispatch** on the worst gap. Enter more than the remaining quantity to show the error. Enter a valid one. Show stock dropped immediately (Needs & Warehouse tab).
3. Dispatches tab: Mark In Transit, Mark Delivered. Go back to the camp: progress bar moved, gap shrank.
4. Cancel another dispatch: stock is restored.
5. Donations: add an in-kind donation, show stock increased.
6. Camps: raise a camp's families to capacity: it flips to **Full** automatically.
7. Volunteers: try assigning to the Closed camp (not offered). Assign one to a camp.
8. Switch role to Field Volunteer: delete and inventory actions disappear (and the server rejects them too).

## 4. Q&A prep (be honest, never fake features)

- *"Why a server-side rule check?"* The UI cannot bypass stock or reservation limits, so two coordinators cannot over-dispatch the same need.
- *"How does it scale?"* Swap `db.json` for PostgreSQL; the REST contract stays the same.
- *"What's missing?"* Real authentication (roles are a header in this demo), audit log, offline mode. All are on the roadmap.
- Listen to the whole question, answer calmly, do not argue.

## 5. Brief-to-feature checklist

M1 camps CRUD, search, status filter, auto-Full, two roles: done. M2 needs CRUD with progress, inventory CRUD, Low Stock badge: done. M3 reserve on create, stock and remainder caps, 4 states, restore on cancel: done. M4 cash/in-kind donations, totals, volunteers with skill filter, one assignment, no Closed camps: done. M5 KPIs, category bar chart, Critical Gaps with link back: done. M6 HTTP API for all 6 collections with the required seed counts: done.