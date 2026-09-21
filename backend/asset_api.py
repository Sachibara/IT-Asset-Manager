from __future__ import annotations

import json
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = Path(__file__).resolve().parent / "data"
DB_PATH = DATA_DIR / "assets.db"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def db() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS people(
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                department TEXT NOT NULL,
                email TEXT NOT NULL,
                location TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS assets(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tag TEXT UNIQUE,
                hostname TEXT NOT NULL,
                type TEXT NOT NULL,
                serial TEXT NOT NULL UNIQUE,
                status TEXT NOT NULL,
                owner_id INTEGER,
                department TEXT NOT NULL,
                location TEXT NOT NULL,
                purchase_date TEXT,
                warranty_expiry TEXT,
                specs_json TEXT NOT NULL DEFAULT '{}',
                updated_at TEXT NOT NULL,
                FOREIGN KEY(owner_id) REFERENCES people(id)
            );

            CREATE TABLE IF NOT EXISTS maintenance(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                vendor TEXT NOT NULL,
                opened_at TEXT NOT NULL,
                due_at TEXT NOT NULL,
                completed_at TEXT,
                notes TEXT NOT NULL,
                FOREIGN KEY(asset_id) REFERENCES assets(id)
            );

            CREATE TABLE IF NOT EXISTS software(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                vendor TEXT NOT NULL,
                licenses INTEGER NOT NULL,
                assigned INTEGER NOT NULL,
                expiry TEXT NOT NULL,
                category TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS audit(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                at TEXT NOT NULL,
                actor TEXT NOT NULL,
                action TEXT NOT NULL,
                detail TEXT NOT NULL,
                asset_id INTEGER,
                FOREIGN KEY(asset_id) REFERENCES assets(id)
            );
            """
        )
        seed(conn)
        conn.commit()


def seed(conn: sqlite3.Connection) -> None:
    if not conn.execute("SELECT 1 FROM people LIMIT 1").fetchone():
        conn.executemany(
            "INSERT INTO people(id,name,department,email,location) VALUES(?,?,?,?,?)",
            [
                (1,"Alyssa Reyes","Finance","alyssa.reyes@contoso.local","Main Office"),
                (2,"Marco Santos","Operations","marco.santos@contoso.local","Main Office"),
                (3,"Nina Cruz","Human Resources","nina.cruz@contoso.local","Main Office"),
                (4,"Daniel Lee","Sales","daniel.lee@contoso.local","Branch Office"),
                (5,"Mika Torres","Marketing","mika.torres@contoso.local","Main Office"),
                (10,"Jim Camus","IT","jim.camus@contoso.local","Main Office"),
            ],
        )

    if not conn.execute("SELECT 1 FROM assets LIMIT 1").fetchone():
        now = datetime.now(timezone.utc)
        rows = [
            ("FIN-LT-014","Laptop","LNV-83F4A2","Assigned",1,"Finance","Main Office","2025-01-16",now+timedelta(days=118),{"CPU":"Intel Core i5-1345U","RAM":"16 GB","Storage":"512 GB NVMe","OS":"Windows 11 Pro"}),
            ("OPS-DT-022","Desktop","DEL-72D19B","Assigned",2,"Operations","Main Office","2024-07-04",now+timedelta(days=38),{"CPU":"Intel Core i7-12700","RAM":"16 GB","Storage":"1 TB SSD","OS":"Windows 11 Pro"}),
            ("HR-LT-008","Laptop","HP-19A8D1","Assigned",3,"Human Resources","Main Office","2024-04-22",now-timedelta(days=12),{"CPU":"AMD Ryzen 7 7840U","RAM":"16 GB","Storage":"512 GB SSD","OS":"Windows 11 Pro"}),
            ("CORE-SW-01","Switch","CSC-9200-01","Assigned",10,"IT","MDF","2025-05-10",now+timedelta(days=680),{"Model":"Cisco Catalyst 9200L","Ports":"48 x 1GbE","Uplink":"4 x 10GbE","OS":"Cisco IOS XE"}),
            ("AP-F2-03","Access Point","UBQ-U6-003","Assigned",10,"IT","Floor 2","2025-02-18",now+timedelta(days=310),{"Model":"UniFi U6 Pro","Radio":"Wi-Fi 6","PoE":"802.3at","Controller":"UniFi"}),
            ("PRN-FIN-01","Printer","HP-M428-11","In Repair",None,"Finance","IT Repair Bench","2023-09-11",now-timedelta(days=168),{"Model":"HP LaserJet Pro M428","Network":"Ethernet","Duplex":"Automatic"}),
            ("SRV-AD01","Server","DEL-R550-01","Assigned",10,"IT","Server Room","2024-11-03",now+timedelta(days=420),{"CPU":"2 x Intel Xeon Silver","RAM":"128 GB","Storage":"RAID 10","OS":"Windows Server 2022"}),
            ("SPARE-LT-02","Laptop","ACR-SWIFT-02","Available",None,"IT","IT Stockroom","2025-08-20",now+timedelta(days=610),{"CPU":"Intel Core Ultra 5","RAM":"16 GB","Storage":"512 GB SSD","OS":"Windows 11 Pro"}),
            ("SALES-LT-031","Laptop","ASU-31C99F","Assigned",4,"Sales","Branch Office","2024-01-17",now+timedelta(days=8),{"CPU":"Intel Core i5-1235U","RAM":"8 GB","Storage":"512 GB SSD","OS":"Windows 11 Pro"}),
            ("MKT-LT-012","Laptop","LEN-12MKT9","Assigned",5,"Marketing","Main Office","2025-03-02",now+timedelta(days=350),{"CPU":"Intel Core i7-1360P","RAM":"16 GB","Storage":"1 TB SSD","OS":"Windows 11 Pro"}),
            ("MON-27-044","Monitor","DEL-U2723-44","Available",None,"IT","IT Stockroom","2025-06-06",now+timedelta(days=540),{"Size":"27 inch","Resolution":"2560x1440","Panel":"IPS"}),
            ("OLD-LT-004","Laptop","HP-OLD004","Retired",None,"IT","Disposal Cage","2020-03-14",now-timedelta(days=920),{"CPU":"Intel Core i5-8265U","RAM":"8 GB","Storage":"256 GB SSD","OS":"Windows 10 Pro"}),
        ]
        for idx, row in enumerate(rows, start=1):
            hostname, typ, serial, status, owner_id, dept, loc, purchase, warranty, specs = row
            conn.execute(
                """
                INSERT INTO assets(tag,hostname,type,serial,status,owner_id,department,location,purchase_date,warranty_expiry,specs_json,updated_at)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
                """,
                (f"AST-{1000+idx}",hostname,typ,serial,status,owner_id,dept,loc,purchase,warranty.date().isoformat(),json.dumps(specs),utc_now()),
            )

    if not conn.execute("SELECT 1 FROM maintenance LIMIT 1").fetchone():
        now = datetime.now(timezone.utc)
        conn.executemany(
            """
            INSERT INTO maintenance(asset_id,status,severity,title,vendor,opened_at,due_at,completed_at,notes)
            VALUES(?,?,?,?,?,?,?,?,?)
            """,
            [
                (6,"Open","High","Fuser assembly fault","Internal IT",(now-timedelta(days=1)).isoformat(),(now+timedelta(days=1)).isoformat(),None,"Printer reports hardware error after repeated paper jams."),
                (3,"Completed","Medium","Battery replacement","Authorized service center",(now-timedelta(days=63)).isoformat(),(now-timedelta(days=58)).isoformat(),(now-timedelta(days=59)).isoformat(),"Battery replaced after health dropped below threshold."),
                (2,"Scheduled","Low","Preventive cleaning","Internal IT",(now-timedelta(days=2)).isoformat(),(now+timedelta(days=14)).isoformat(),None,"Quarterly preventive maintenance."),
                (9,"Open","Medium","Intermittent charging","Vendor warranty",(now-timedelta(hours=12)).isoformat(),(now+timedelta(days=3)).isoformat(),None,"Charging disconnects when cable is moved."),
            ],
        )

    if not conn.execute("SELECT 1 FROM software LIMIT 1").fetchone():
        now = datetime.now(timezone.utc)
        conn.executemany(
            "INSERT INTO software(name,vendor,licenses,assigned,expiry,category) VALUES(?,?,?,?,?,?)",
            [
                ("Microsoft 365 Business Premium","Microsoft",25,22,(now+timedelta(days=275)).date().isoformat(),"Productivity"),
                ("Adobe Acrobat Pro","Adobe",10,9,(now+timedelta(days=94)).date().isoformat(),"Document"),
                ("Endpoint Security Suite","Security Vendor",30,27,(now+timedelta(days=190)).date().isoformat(),"Security"),
                ("Remote Support Agent","Support Vendor",15,15,(now+timedelta(days=42)).date().isoformat(),"IT Operations"),
                ("Network Monitoring","Infrastructure Vendor",5,3,(now+timedelta(days=330)).date().isoformat(),"Infrastructure"),
            ],
        )

    if not conn.execute("SELECT 1 FROM audit LIMIT 1").fetchone():
        conn.execute("INSERT INTO audit(at,actor,action,detail,asset_id) VALUES(?,?,?,?,?)",(utc_now(),"System","Inventory initialized","Initial asset inventory created.",None))


def person_name(conn: sqlite3.Connection, owner_id: int | None) -> str:
    if owner_id is None:
        return "Unassigned"
    row = conn.execute("SELECT name FROM people WHERE id=?", (owner_id,)).fetchone()
    return row["name"] if row else "Unassigned"


def asset_dict(conn: sqlite3.Connection, row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item["owner"] = person_name(conn, item["owner_id"])
    try:
        item["specs"] = json.loads(item.pop("specs_json") or "{}")
    except json.JSONDecodeError:
        item["specs"] = {}
        item.pop("specs_json", None)
    return item


def bootstrap() -> dict[str, Any]:
    with db() as conn:
        assets = [asset_dict(conn,r) for r in conn.execute("SELECT * FROM assets ORDER BY tag").fetchall()]
        people = [dict(r) for r in conn.execute("SELECT * FROM people ORDER BY name").fetchall()]
        maintenance = []
        for r in conn.execute(
            """
            SELECT m.*,a.hostname AS asset
            FROM maintenance m JOIN assets a ON a.id=m.asset_id
            ORDER BY m.opened_at DESC
            """
        ).fetchall():
            maintenance.append(dict(r))
        software = [dict(r) for r in conn.execute("SELECT * FROM software ORDER BY name").fetchall()]
        audit = [dict(r) for r in conn.execute("SELECT * FROM audit ORDER BY at DESC,id DESC LIMIT 500").fetchall()]
    return {"generated_at":utc_now(),"people":people,"assets":assets,"maintenance":maintenance,"software":software,"audit":audit}


def log_audit(conn: sqlite3.Connection, action: str, detail: str, asset_id: int | None = None, actor: str = "Jim Camus") -> None:
    conn.execute("INSERT INTO audit(at,actor,action,detail,asset_id) VALUES(?,?,?,?,?)",(utc_now(),actor,action,detail,asset_id))


class AssetCreate(BaseModel):
    hostname: str = Field(min_length=1,max_length=120)
    type: str = Field(min_length=1,max_length=80)
    serial: str = Field(min_length=1,max_length=120)
    location: str = Field(min_length=1,max_length=120)
    purchase_date: str = ""
    warranty_expiry: str = ""


class AssetUpdate(BaseModel):
    hostname: str = Field(min_length=1,max_length=120)
    type: str = Field(min_length=1,max_length=80)
    serial: str = Field(min_length=1,max_length=120)
    status: str
    owner_id: int | None = None
    location: str = Field(min_length=1,max_length=120)
    purchase_date: str = ""
    warranty_expiry: str = ""


class AssignmentUpdate(BaseModel):
    owner_id: int | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="IT Asset Manager API",version="1.0.0",description="Persistent local asset lifecycle backend.",lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8795","http://localhost:8795"],
    allow_credentials=False,
    allow_methods=["GET","POST","PUT"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health():
    return {"ok":True,"service":"IT Asset Manager","database":str(DB_PATH)}


@app.get("/api/bootstrap")
def get_bootstrap():
    return bootstrap()


@app.post("/api/assets")
def create_asset(request: AssetCreate):
    now = utc_now()
    with db() as conn:
        if conn.execute("SELECT 1 FROM assets WHERE serial=?", (request.serial.strip(),)).fetchone():
            raise HTTPException(status_code=409,detail="Serial number already exists.")
        cur = conn.execute(
            """
            INSERT INTO assets(tag,hostname,type,serial,status,owner_id,department,location,purchase_date,warranty_expiry,specs_json,updated_at)
            VALUES(NULL,?,?,?,'Available',NULL,'IT',?,?,?,'{}',?)
            """,
            (request.hostname.strip(),request.type.strip(),request.serial.strip(),request.location.strip(),request.purchase_date,request.warranty_expiry,now),
        )
        asset_id = int(cur.lastrowid)
        tag = f"AST-{1000+asset_id}"
        conn.execute("UPDATE assets SET tag=? WHERE id=?",(tag,asset_id))
        log_audit(conn,"Asset created",f"{tag} added to inventory.",asset_id)
        conn.commit()
        row = conn.execute("SELECT * FROM assets WHERE id=?",(asset_id,)).fetchone()
        return asset_dict(conn,row)


@app.put("/api/assets/{asset_id}")
def update_asset(asset_id: int, request: AssetUpdate):
    with db() as conn:
        current = conn.execute("SELECT * FROM assets WHERE id=?",(asset_id,)).fetchone()
        if not current:
            raise HTTPException(status_code=404,detail="Asset not found.")
        owner = None
        department = current["department"]
        if request.owner_id is not None:
            owner = conn.execute("SELECT * FROM people WHERE id=?",(request.owner_id,)).fetchone()
            if not owner:
                raise HTTPException(status_code=400,detail="Owner not found.")
            department = owner["department"]
        elif request.status == "Available":
            department = "IT"

        duplicate = conn.execute("SELECT 1 FROM assets WHERE serial=? AND id<>?",(request.serial.strip(),asset_id)).fetchone()
        if duplicate:
            raise HTTPException(status_code=409,detail="Serial number already exists.")

        conn.execute(
            """
            UPDATE assets SET hostname=?,type=?,serial=?,status=?,owner_id=?,department=?,location=?,purchase_date=?,warranty_expiry=?,updated_at=?
            WHERE id=?
            """,
            (request.hostname.strip(),request.type.strip(),request.serial.strip(),request.status,request.owner_id,department,request.location.strip(),request.purchase_date,request.warranty_expiry,utc_now(),asset_id),
        )
        log_audit(conn,"Asset updated",f"{current['tag']} inventory record updated.",asset_id)
        conn.commit()
        row = conn.execute("SELECT * FROM assets WHERE id=?",(asset_id,)).fetchone()
        return asset_dict(conn,row)


@app.post("/api/assets/{asset_id}/assign")
def assign_asset(asset_id: int, request: AssignmentUpdate):
    with db() as conn:
        asset = conn.execute("SELECT * FROM assets WHERE id=?",(asset_id,)).fetchone()
        if not asset:
            raise HTTPException(status_code=404,detail="Asset not found.")
        if request.owner_id is None:
            conn.execute("UPDATE assets SET owner_id=NULL,department='IT',status='Available',location='IT Stockroom',updated_at=? WHERE id=?",(utc_now(),asset_id))
            log_audit(conn,"Asset checked in",f"{asset['tag']} returned to available stock.",asset_id)
        else:
            person = conn.execute("SELECT * FROM people WHERE id=?",(request.owner_id,)).fetchone()
            if not person:
                raise HTTPException(status_code=400,detail="Owner not found.")
            conn.execute("UPDATE assets SET owner_id=?,department=?,status='Assigned',updated_at=? WHERE id=?",(request.owner_id,person["department"],utc_now(),asset_id))
            log_audit(conn,"Asset assigned",f"{asset['tag']} assigned to {person['name']}.",asset_id)
        conn.commit()
        row = conn.execute("SELECT * FROM assets WHERE id=?",(asset_id,)).fetchone()
        return asset_dict(conn,row)


@app.get("/")
def ui():
    return FileResponse(ROOT / "index.html")


@app.get("/styles.css")
def styles():
    return FileResponse(ROOT / "styles.css",media_type="text/css")


@app.get("/demo-data.js")
def demo():
    return FileResponse(ROOT / "demo-data.js",media_type="application/javascript")


@app.get("/app.js")
def script():
    return FileResponse(ROOT / "app.js",media_type="application/javascript")


def main() -> None:
    import uvicorn
    print("IT Asset Manager: http://127.0.0.1:8795")
    uvicorn.run(app,host="127.0.0.1",port=8795,log_level="info")


if __name__ == "__main__":
    main()
