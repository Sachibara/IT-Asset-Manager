> **Consolidated module:** This project is preserved as source/history, but its public product experience is now part of **[OpsFusion](https://sachibara.github.io/HelpDesk-Pro/)**. The consolidation reduces duplicate portfolio projects and connects this capability to a shared enterprise data/workflow model.

# IT Asset Manager

A portfolio-grade IT Asset & Inventory Management platform for IT Operations, IT Service Desk, Desktop Support, System Administration, and Infrastructure teams.

The project supports two operating modes:

- **Browser Workspace Mode** — public browser application with realistic asset, employee, warranty, maintenance, software, and assignment data.
- **Live Backend Mode** — local FastAPI + SQLite backend with persistent asset lifecycle records.


## Public App

**Live app:** https://sachibara.github.io/IT-Asset-Manager/

## Core Features

- Hardware asset inventory
- Employee / department ownership
- Check-in and check-out
- Asset lifecycle states
- Serial number / asset tag tracking
- Warranty and expiry monitoring
- Maintenance history
- Accessories and peripherals
- Software and license records
- Locations and departments
- QR-ready asset labels
- Audit history
- Search, filtering, and sorting
- Inventory analytics
- CSV export
- REST API
- SQLite persistence
- Responsive operations UI

## Run Live Mode

```powershell
python -m pip install -r backend/requirements.txt
python backend/asset_api.py
```

Then open:

```text
http://127.0.0.1:8795
```

## Developer

**Jim Rodmark Camus**  
BSIT — Network Technology  
GitHub: [@Sachibara](https://github.com/Sachibara)
