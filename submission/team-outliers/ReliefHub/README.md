# ReliefHub — Technical Architecture & Local Operations Manual

ReliefHub is a web dashboard built for flood relief coordination in Sindh during the AWS Cloud Club MUET HacktoberFest 3.0 hackathon.

---

## 🏗️ Architecture Overview

The system consists of three architectural layers:

1. **Storage & Mock REST API (`api/`):**
   - Database: [`api/db.json`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/api/db.json) containing 6 normalized entities (`camps`, `inventory`, `needs`, `dispatches`, `donations`, `volunteers`).
   - Server: Dual-mode [`api/server_runner.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/api/server_runner.py) supporting standard `json-server` or an embedded Python REST HTTP server.
   - Seed Utility: [`api/seed.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/api/seed.py) to reset or verify target sample counts.

2. **Domain Service Layer (`services/`):**
   - [`services/api_client.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/services/api_client.py): HTTP client with timeout and network failure protection.
   - [`services/camp_service.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/services/camp_service.py): Camp management with auto-Full status when families reach capacity.
   - [`services/inventory_service.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/services/inventory_service.py): Stock adjustments and low-stock badge calculations.
   - [`services/need_service.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/services/need_service.py): Camp needs tracking, fulfillment progress, and Critical Gap math.
   - [`services/dispatch_service.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/services/dispatch_service.py): Immediate stock reservation, stock cap validation, unreserved need limit, and cancellation stock restoration.
   - [`services/donation_service.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/services/donation_service.py): Cash & in-kind contributions; in-kind donations immediately increase warehouse inventory.
   - [`services/volunteer_service.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/services/volunteer_service.py): Responder skill registry, single-assignment limit, and prohibition of deployment to Closed camps.

3. **Presentation Layer (`views/` & `app.py`):**
   - [`app.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/app.py): Global layout, navigation, role switcher (`Relief Coordinator (Admin)` vs. `Field Volunteer`), and API health monitor.
   - Views:
     - [`views/dashboard_view.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/views/dashboard_view.py): Executive KPIs, Category Fulfillment bar chart, Warehouse stock vs. reorder levels, Critical Gaps table, and Geospatial distribution map.
     - [`views/camps_view.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/views/camps_view.py): Camp registry, search/filter, and Add/Edit/Delete forms.
     - [`views/inventory_view.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/views/inventory_view.py): Warehouse catalog, low-stock alerts, and quick stock adjustments.
     - [`views/needs_view.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/views/needs_view.py): Resource requests per camp and progress bars.
     - [`views/dispatches_view.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/views/dispatches_view.py): Dispatches pipeline and status transitions (`Pending`, `In Transit`, `Delivered`, `Cancelled`).
     - [`views/donations_view.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/views/donations_view.py): Contribution ledger and fund breakdown charts.
     - [`views/volunteers_view.py`](file:///C:/Users/Sobia/Downloads/aws%20hackathon/Team-Outliers/submission/team-outliers/ReliefHub/views/volunteers_view.py): Volunteer directory, skill filters, and assignment controls.

---

## ⚡ Execution Commands

### Launch API
```bash
python api/server_runner.py
```

### Launch Streamlit App
```bash
python -m streamlit run app.py
```

### Run Unit Tests
```bash
python -m pytest tests/test_services.py -v
```

### Reset Database
```bash
python api/seed.py
```
