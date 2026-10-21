# ReliefHub — Team Omnitrix

A local flood-relief coordination dashboard for [HacktoberFest issue #10](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/10).

Manage camps, camp needs, warehouse supplies, dispatches, donations and volunteers across Sindh. The overview highlights urgent gaps and resource coverage.

## Run in VS Code

Requires Python 3.10 or newer. In the VS Code terminal:

```powershell
cd D:\Hacktober\Team_Omnitrix\submission\omnitrix\reliefhub
python -m pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:5050**. The first launch creates and seeds the database automatically. Later launches preserve changes. If port 5050 is occupied, run `python app.py --port 5051`.

No Node installation, build step, cloud account, API key, payment card or external asset service is required. Flask is the only application dependency; SQLite ships with Python. Once Flask is installed, the app works offline. Local app operation incurs no cloud or API charges; AI-tool subscriptions are separate.

## Team

- Farhan — [his012](https://github.com/his012)
- Zain Arshad — [zain-arshad-arain](https://github.com/zain-arshad-arain)
- Huzaifa Abbasi — [HuzaifaAbbasi6901](https://github.com/HuzaifaAbbasi6901)

Member work allocation is not asserted; record actual contributions before submission.

## Implemented milestones

The interface uses an olive and earth-toned palette, system serif headings, square controls and responsive record tables. Warehouse includes stock tabs, name/stock sorting, resettable search and CSV export of the current results. Destructive actions use a confirmation dialog. Initial loading has a skeleton state. Workspace guide, demo terms and privacy policy are available from the footer. No external fonts, icon libraries, gradients, shadows or hover animations are used.

1. **Camps:** create, edit, delete, validated capacity/family counts, district/name search, status filters and automatic Full status. Closed stays Closed until explicitly reopened.
2. **Needs and warehouse:** need CRUD, priority and fulfilment, available inventory CRUD, low stock at or below reorder level.
3. **Dispatches:** camp/need selection, immediate stock reservation, available-stock and unreserved-need validation, status filters, in-transit, delivery and cancellation actions.
4. **Donations and volunteers:** Cash and In-Kind contributions, automatic stock receipt, cash totals and category/unit totals, volunteer registration, skill/search filters, assignment and unassignment.
5. **Dashboard:** five KPIs, a category fulfilment bar chart, recent dispatches, ordered critical gaps linking to camps.
6. **Mock API:** all browser data reads and writes use same-origin HTTP requests to the six required collections. SQLite persists data on disk.

## Roles

Use the sidebar role selector. Relief Coordinator (Admin) manages all operations. Field Volunteer can view all sections, update camp family counts, and create/edit camp needs. Server-side permission checks reject other volunteer mutations.

This is a **local demo role switcher, not identity authentication**. Anyone using the demo can choose Admin. Do not deploy it as a public operational service without real authentication, authorization policies and a production server. The development server binds to loopback only.

## Data and business rules

- `inventory.stock` is **available** stock, excluding reservations. Creating a dispatch subtracts stock once. Delivery increments fulfilment without another stock deduction. Cancelling Pending/In Transit adds stock back exactly once.
- Remaining unreserved need = required − fulfilled − Pending/In Transit quantities.
- Dispatch transitions: Pending → In Transit/Delivered/Cancelled; In Transit → Delivered/Cancelled. Delivered and Cancelled are terminal. Repeating the same status has no second effect.
- SQLite `BEGIN IMMEDIATE` takes a write lock before stock/reservation checks. Dispatch, donation and status changes commit atomically, including under concurrent requests.
- A need cannot be reduced below fulfilled + reserved quantities or moved to another camp/item. Fulfilment changes only through delivery.
- Referenced inventory and needs cannot be deleted. Camps require removal of their needs and volunteer assignments before deletion; dispatch history is protected. Unassign volunteers and resolve outstanding dispatches before closing a camp.
- Units cannot change while an item has needs or donation history. In-kind donations use positive whole units; cash permits two decimals. Donation records are append-only so receipt history is retained.
- Active-camp KPI includes Active and Full camps; family KPI excludes Closed camps. Overall and category fulfilment use the **arithmetic mean of individual need percentages**, avoiding sums across incompatible units. Critical gaps include High needs strictly below 40%, sorted by lowest fulfilment.
- Donation category summaries keep cash (PKR) and physical units separate; kilograms are never added to litres.

## Seed data

The initial dataset includes exactly 8 camps across 6 districts, including a Full and a Closed camp; 12 inventory items including 2 Low Stock; 20 needs including 3 Critical Gaps; 10 dispatches; 10 donations; and 15 volunteers.

Seed stock is an opening snapshot of **available stock after historical receipts and reservations**. Fulfilled quantities include historical deliveries beyond the ten displayed example dispatches. Seeded donations and dispatches are history and are not reapplied at startup.

`seed.py` refuses to overwrite an existing database. To start a fresh demo, stop the server, move `reliefhub.db` to a backup location, then start again. Database files and Python caches are ignored by Git.

## API

Collections: `/api/camps`, `/api/inventory`, `/api/needs`, `/api/dispatches`, `/api/donations`, `/api/volunteers`.

- `GET /api/<collection>` lists records; `GET /api/<collection>/<id>` reads one.
- `POST /api/<collection>` creates a record.
- `PUT /api/<collection>/<id>` updates camps, inventory, needs, dispatch status or volunteers.
- `DELETE /api/<collection>/<id>` deletes unreferenced camps, inventory, needs or volunteers.
- `POST /api/session` selects `Admin` or `Field Volunteer`; `GET /api/session` reads the demo role.
- Mutations require JSON and a role session. Responses use 400 for validation, 401/403 for permissions, 404 for missing records and 409 for protected history/transitions.

## Verification

```powershell
python -m unittest -v test_app
```

The suite tests seed invariants, camp/inventory/need operations, delivery and cancellation idempotency, concurrent reservations, donation stock changes, invalid inputs, single volunteer assignments, closed-camp restrictions, role enforcement and database persistence. Tests use isolated temporary databases and never touch your demo data.

## Demo walkthrough

1. Open Overview and inspect the three Critical Gaps.
2. Open Sehwan Base Camp and inspect its antibiotic need.
3. Create a dispatch for that need: initially 80 boxes are available and 200 remain unreserved. Quantities above 80 are rejected.
4. Mark it In Transit, then Delivered; review the need's progress and dashboard.
5. Record an In-Kind donation and verify available inventory rises.
6. Assign an available volunteer to an open camp; unassign before moving to another.
7. Switch to Field Volunteer and demonstrate the restricted edit controls.

## Location

Project: `submission/omnitrix/reliefhub` on branch `omnitrix`. The existing AWS autoscaling submission and earlier `submission/reliefhub` draft are separate and were preserved.
