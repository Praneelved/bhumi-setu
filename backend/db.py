import os
import hashlib
import binascii
import datetime
from typing import Optional, List, Dict, Any

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "10.166.218.49")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")
POSTGRES_DB = os.getenv("POSTGRES_DB", "land_acquisition_db")

def hash_password(password: str) -> str:
    """Hashes password with PBKDF2-HMAC-SHA256 and a secure salt."""
    salt = binascii.hexlify(os.urandom(16)).decode('ascii')
    pwdhash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('ascii'),
        100000
    )
    pwdhash_hex = binascii.hexlify(pwdhash).decode('ascii')
    return f"{salt}${pwdhash_hex}"

def verify_password(stored_password_hash: str, provided_password: str) -> bool:
    """Verifies a stored password hash against a provided password."""
    if not stored_password_hash or '$' not in stored_password_hash:
        return False
    salt, stored_hash = stored_password_hash.split('$')
    pwdhash = hashlib.pbkdf2_hmac(
        'sha256',
        provided_password.encode('utf-8'),
        salt.encode('ascii'),
        100000
    )
    pwdhash_hex = binascii.hexlify(pwdhash).decode('ascii')
    return pwdhash_hex == stored_hash

def get_db():
    conn = psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        dbname=POSTGRES_DB,
        cursor_factory=psycopg2.extras.RealDictCursor,
        connect_timeout=5
    )
    return conn

def _column_exists(cursor, table: str, column: str) -> bool:
    cursor.execute("""
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = %s AND column_name = %s;
    """, (table, column))
    return cursor.fetchone() is not None

def init_db():
    """
    Adapts the existing PostgreSQL schema to work with the BhoomiSetu backend.
    The database already has core tables (roles, users, organizations, projects,
    land_parcels, etc.) with UUID primary keys. This function:
    1. Adds missing columns to existing tables (user_type, role, state, district, etc.)
    2. Creates supplementary tables that don't exist (otp_sessions, permissions, etc.)
    3. Seeds initial data if tables are empty.
    """
    conn = get_db()
    cursor = conn.cursor()

    # ── 0. Create Base Tables if they don't exist ──
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
        name VARCHAR(200) NOT NULL,
        type VARCHAR(100),
        state VARCHAR(100),
        district VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
        full_name VARCHAR(200) NOT NULL,
        email VARCHAR(200) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password_hash TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,
        project_code VARCHAR(100),
        status VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """)

    # ── 1. Add missing columns to existing 'users' table ──
    alter_columns = [
        ("users", "user_type", "VARCHAR(50) DEFAULT 'GOVERNMENT'"),
        ("users", "role", "VARCHAR(100)"),
        ("users", "organization_id", "VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL"),
        ("users", "state", "VARCHAR(100)"),
        ("users", "district", "VARCHAR(100)"),
        ("users", "mfa_enabled", "BOOLEAN DEFAULT TRUE"),
    ]
    for table, col, col_def in alter_columns:
        if not _column_exists(cursor, table, col):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_def};")

    # ── 2. Add missing columns to existing 'organizations' table ──
    org_columns = [
        ("organizations", "type", "VARCHAR(100)"),
        ("organizations", "state", "VARCHAR(100)"),
        ("organizations", "district", "VARCHAR(100)"),
        ("organizations", "is_active", "BOOLEAN DEFAULT TRUE"),
    ]
    for table, col, col_def in org_columns:
        if not _column_exists(cursor, table, col):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_def};")

    # ── 3. Add missing columns to existing 'projects' table ──
    prj_columns = [
        ("projects", "code", "VARCHAR(100)"),
        ("projects", "state", "VARCHAR(100)"),
        ("projects", "district", "VARCHAR(100)"),
        ("projects", "length_km", "REAL"),
        ("projects", "land_required_ha", "REAL"),
        ("projects", "gazette_ref", "TEXT"),
    ]
    for table, col, col_def in prj_columns:
        if not _column_exists(cursor, table, col):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_def};")

    # ── 4. Add missing columns to existing 'land_parcels' table ──
    parcel_columns = [
        ("land_parcels", "khasra_no", "VARCHAR(100)"),
        ("land_parcels", "mauza", "VARCHAR(200)"),
        ("land_parcels", "hadbast_no", "VARCHAR(100)"),
        ("land_parcels", "owners", "TEXT"),
        ("land_parcels", "owner_count", "INTEGER DEFAULT 1"),
        ("land_parcels", "status", "VARCHAR(100)"),
        ("land_parcels", "status_label", "TEXT"),
        ("land_parcels", "estimated_value_cr", "REAL"),
        ("land_parcels", "area_ha", "REAL"),
        ("land_parcels", "dgps_accuracy", "VARCHAR(50) DEFAULT '±0.04m'"),
        ("land_parcels", "hearing_date", "TEXT"),
        ("land_parcels", "objection_summary", "TEXT"),
        ("land_parcels", "verified_by", "TEXT"),
        ("land_parcels", "verified_at", "TEXT"),
    ]
    for table, col, col_def in parcel_columns:
        if not _column_exists(cursor, table, col):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_def};")

    # ── 5. Create supplementary tables that don't exist ──

    # PERMISSIONS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT
    );
    """)

    # ROLE_PERMISSIONS (references roles which uses UUID)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS role_permissions (
        role_id VARCHAR(64) NOT NULL,
        permission_id VARCHAR(100) NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );
    """)

    # USER_PROJECTS (references users and projects which use UUID)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_projects (
        user_id VARCHAR(64) NOT NULL,
        project_id VARCHAR(64) NOT NULL,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, project_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    """)

    # USER_PARCELS (references users and land_parcels which use UUID)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_parcels (
        user_id VARCHAR(64) NOT NULL,
        parcel_id VARCHAR(64) NOT NULL,
        ownership_share REAL DEFAULT 1.0,
        linked_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, parcel_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parcel_id) REFERENCES land_parcels(id) ON DELETE CASCADE
    );
    """)

    # PARCEL_OWNERS (Relationship: LANDOWNER -> PARCEL OWNER -> LAND PARCEL)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS parcel_owners (
        id SERIAL PRIMARY KEY,
        parcel_id VARCHAR(64) NOT NULL,
        owner_id VARCHAR(64) NOT NULL,
        ownership_percentage REAL DEFAULT 100.0,
        is_primary_owner BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (parcel_id, owner_id),
        FOREIGN KEY (parcel_id) REFERENCES land_parcels(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # OTP_SESSIONS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS otp_sessions (
        id VARCHAR(200) PRIMARY KEY,
        identifier VARCHAR(200) NOT NULL,
        user_id VARCHAR(64),
        otp_hash TEXT NOT NULL,
        dev_plain_otp VARCHAR(20),
        purpose VARCHAR(50) NOT NULL,
        expires_at TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """)

    # 12. GIS LAND PARCELS (Cadastral Boundaries with MultiPolygon GeoJSON & Spatial Coordinates)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS land_parcels (
        id TEXT PRIMARY KEY,
        survey_number TEXT NOT NULL,
        khasra_number TEXT NOT NULL,
        village TEXT NOT NULL,
        taluk TEXT NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        project_id TEXT NOT NULL,
        project_name TEXT NOT NULL,
        acquisition_case_id TEXT,
        owner_id TEXT,
        owner_name TEXT NOT NULL,
        owner_contact TEXT,
        land_classification TEXT NOT NULL,
        area_ha REAL NOT NULL,
        area_sqm REAL NOT NULL,
        acquisition_status TEXT NOT NULL,
        compensation_status TEXT NOT NULL,
        possession_status TEXT NOT NULL,
        geometry_geojson TEXT NOT NULL,
        centroid_lat REAL NOT NULL,
        centroid_lng REAL NOT NULL,
        bbox_json TEXT NOT NULL,
        market_rate_per_sqm REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    );
    """)

    # 13. COMPENSATIONS (RFCTLARR 2013 Statutory Award Assessments)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS compensations (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        parcel_id TEXT NOT NULL,
        beneficiary_id TEXT NOT NULL,
        beneficiary_name TEXT NOT NULL,
        base_market_value REAL NOT NULL,
        multiplication_factor REAL DEFAULT 1.0,
        market_value_total REAL NOT NULL,
        solatium_amount REAL NOT NULL,
        assets_attached_value REAL DEFAULT 0.0,
        total_award_amount REAL NOT NULL,
        status TEXT NOT NULL, -- ASSESSED, REVIEWED, APPROVED
        approved_by TEXT,
        approval_date TEXT,
        award_gazette_ref TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parcel_id) REFERENCES land_parcels(id)
    );
    """)

    # 14. PAYMENTS (PFMS / DBT Government-to-Landowner Transactions)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        compensation_id TEXT NOT NULL,
        case_id TEXT NOT NULL,
        parcel_id TEXT NOT NULL,
        beneficiary_id TEXT NOT NULL,
        beneficiary_name TEXT NOT NULL,
        beneficiary_aadhaar_mask TEXT,
        bank_account_mask TEXT NOT NULL,
        bank_ifsc TEXT NOT NULL,
        bank_name TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_channel TEXT DEFAULT 'PFMS_DBT',
        payment_reference TEXT UNIQUE,
        batch_id TEXT,
        status TEXT NOT NULL, -- INITIATED, PROCESSING, SUCCESS, FAILED
        failure_reason TEXT,
        retry_count INTEGER DEFAULT 0,
        initiated_by TEXT NOT NULL,
        initiated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        credited_at TEXT,
        audit_trail_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (compensation_id) REFERENCES compensations(id),
        FOREIGN KEY (parcel_id) REFERENCES land_parcels(id)
    );
    """)

    # 15. GIS SENSITIVE & RESTRICTED ZONES (Forest, Green Belt, Wetland, Water Body, Zoning)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gis_zones (
        id TEXT PRIMARY KEY,
        zone_name TEXT NOT NULL,
        zone_type TEXT NOT NULL, -- FOREST, GREEN_BELT, ECO_SENSITIVE, WETLAND, WATER_BODY, AGRICULTURAL, RESIDENTIAL, INDUSTRIAL
        geometry_geojson TEXT NOT NULL,
        authority TEXT NOT NULL,
        source TEXT NOT NULL,
        source_date TEXT,
        metadata_json TEXT,
        color TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 16. PROJECT ZONE INTERSECTIONS (Spatial Analysis & Statutory Clearance Record)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS project_zone_intersections (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        intersection_area_ha REAL NOT NULL,
        percentage_affected REAL NOT NULL,
        risk_level TEXT NOT NULL, -- LOW, MODERATE, HIGH, CRITICAL
        review_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, UNDER_REVIEW, CLEARED, CONDITIONAL_CLEARANCE, NOT_APPLICABLE
        clearance_reference TEXT,
        remarks TEXT,
        detected_at TEXT DEFAULT CURRENT_TIMESTAMP,
        reviewed_by TEXT,
        reviewed_at TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (zone_id) REFERENCES gis_zones(id)
    );
    """)

    # 17. PARCEL ZONE INTERSECTIONS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS parcel_zone_intersections (
        id TEXT PRIMARY KEY,
        parcel_id TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        intersection_area_ha REAL NOT NULL,
        percentage_affected REAL NOT NULL,
        risk_level TEXT NOT NULL,
        detected_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parcel_id) REFERENCES land_parcels(id),
        FOREIGN KEY (zone_id) REFERENCES gis_zones(id)
    );
    """)

    # Migration: Add geometry_geojson to projects if not present
    try:
        cursor.execute("ALTER TABLE projects ADD COLUMN geometry_geojson TEXT;")
    except Exception:
        pass

    conn.commit()

    # ── 6. Seed data if users table is empty ──
    cursor.execute("SELECT COUNT(*) AS cnt FROM users;")
    if cursor.fetchone()["cnt"] == 0:
        seed_data(conn)
    else:
        cursor.execute("SELECT COUNT(*) AS cnt FROM land_parcels;")
        if cursor.fetchone()["cnt"] == 0:
            seed_gis_and_payment_data(conn)
        cursor.execute("SELECT COUNT(*) AS cnt FROM gis_zones;")
        if cursor.fetchone()["cnt"] == 0:
            seed_gis_zones_and_intersections(conn)

    try:
        from verification_service import seed_verification_cases_if_empty
        seed_verification_cases_if_empty(conn)
    except Exception as e:
        print(f"[WARN] Verification cases seeding: {e}")

    conn.close()


def seed_data(conn):
    cursor = conn.cursor()

    # 1. Add app-specific roles to existing roles table
    app_roles = [
        ("CENTRAL_ADMIN", "Apex national authority with pan-India visibility"),
        ("STATE_OFFICER", "State-level revenue & land acquisition authority"),
        ("DISTRICT_OFFICER", "District Collector / Competent Authority for Land Acquisition"),
        ("ACQUISITION_OFFICER", "CALA / SLAO Sub-Divisional Officer"),
        ("AGENCY_ADMIN", "Apex administrator for implementing agency"),
        ("FIELD_OFFICER", "Field surveying and physical parcel verification"),
        ("LANDOWNER", "Registered owner of acquired or affected land parcels"),
    ]
    for name, desc in app_roles:
        # Only insert if role name doesn't already exist
        cursor.execute("SELECT 1 FROM roles WHERE name = %s;", (name,))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO roles (name, description) VALUES (%s, %s);",
                (name, desc)
            )

    # 2. Permissions
    permissions = [
        ("VIEW_NATIONAL", "View National Dashboard", "Pan-India visibility"),
        ("VIEW_STATE", "View State Dashboard", "State-level visibility"),
        ("VIEW_DISTRICT", "View District Dashboard", "District-level records"),
        ("VERIFY_PARCEL", "Verify Land Parcel", "Certify title and sign digitally"),
        ("CALCULATE_AWARD", "Calculate Award", "Assess RFCTLARR compensation"),
        ("DISBURSE_FUNDS", "Disburse Funds", "Authorize PFMS payment"),
        ("SUBMIT_PROPOSAL", "Submit Project Proposal", "Agency proposal initiation"),
        ("VIEW_OWN_PARCEL", "View Own Parcel", "Landowner self-service access")
    ]
    for pid, name, desc in permissions:
        cursor.execute("SELECT 1 FROM permissions WHERE id = %s;", (pid,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO permissions (id, name, description) VALUES (%s, %s, %s);", (pid, name, desc))

    # 3. Organizations
    orgs = [
        ("org-morth", "Ministry of Road Transport & Highways", "GOVERNMENT", "Delhi", "Central"),
        ("org-nhai", "National Highways Authority of India (NHAI)", "HIGHWAY_AGENCY", "Delhi", "Pan-India"),
        ("org-dfccil", "Dedicated Freight Corridor Corp (DFCCIL)", "RAILWAY", "Delhi", "Pan-India"),
        ("org-punjab-rev", "Department of Revenue, Punjab", "REVENUE_DEPARTMENT", "Punjab", "Ludhiana"),
    ]
    org_ids = {}
    for org_id, name, org_type, state, district in orgs:
        cursor.execute("SELECT id FROM organizations WHERE id = %s;", (org_id,))
        existing = cursor.fetchone()
        if existing:
            org_ids[name] = existing["id"]
        else:
            cursor.execute(
                "INSERT INTO organizations (id, name, type, state, district) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
                (org_id, name, org_type, state, district)
            )
            org_ids[name] = cursor.fetchone()["id"]

    # Helper: get role UUID by name
    def get_role_id(role_name):
        cursor.execute("SELECT id FROM roles WHERE name = %s;", (role_name,))
        row = cursor.fetchone()
        return str(row["id"]) if row else None

    # 4. Users (Government, Agency, Personal)
    users = [
        # (user_id, full_name, email, phone, password, user_type, role_name, org_name, state, district)
        ("usr-central-01", "Dr. Rajeshwar Sharma", "central.admin@test.gov", "9811001100", "Admin@123", "GOVERNMENT", "CENTRAL_ADMIN", "Ministry of Road Transport & Highways", "National", "All"),
        ("usr-gov-03", "Gurpreet Singh IAS", "state.officer@test.gov", "9811001101", "State@123", "GOVERNMENT", "STATE_OFFICER", "Department of Revenue, Punjab", "Punjab", "All"),
        ("usr-gov-04", "Balwant Singh Dhillon", "district.officer@test.gov", "9811001102", "District@123", "GOVERNMENT", "DISTRICT_OFFICER", "Department of Revenue, Punjab", "Punjab", "Ludhiana"),
        ("usr-cala-01", "Simranjit Kaur PCS", "revenue.cala.moradabad@nic.in", "9811001103", "GovPortal@2026", "GOVERNMENT", "ACQUISITION_OFFICER", "Department of Revenue, Punjab", "Punjab", "Ludhiana"),
        ("usr-agency-01", "Vikramaditya Rao", "agency.admin@test.com", "9822002200", "Agency@123", "AGENCY", "AGENCY_ADMIN", "National Highways Authority of India (NHAI)", "Delhi", "Pan-India"),
        ("usr-agency-02", "Amitabh Deshmukh", "project.manager@test.com", "9822002201", "Project@123", "AGENCY", "PROJECT_MANAGER", "National Highways Authority of India (NHAI)", "Punjab", "Ludhiana"),
        ("usr-agency-03", "Harinder Sandhu", "field.officer@test.com", "9822002202", "Field@123", "AGENCY", "FIELD_OFFICER", "National Highways Authority of India (NHAI)", "Punjab", "Ludhiana"),
        ("usr-landowner-01", "Balwant Singh", "landowner@test.com", "9372161379", "no-password", "PERSONAL", "LANDOWNER", None, "Punjab", "Ludhiana"),
    ]

    user_ids = {}
    for u_id, full_name, email, phone, pwd, user_type, role_name, org_name, state, district in users:
        pwd_hash = hash_password(pwd) if pwd else None
        org_id = org_ids.get(org_name) if org_name else None

        cursor.execute(
            """INSERT INTO users (id, full_name, email, phone, password_hash, user_type, role, organization_id, state, district, is_active, mfa_enabled)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, TRUE) RETURNING id;""",
            (u_id, full_name, email, phone, pwd_hash, user_type, role_name, org_id, state, district)
        )
        user_ids[email] = cursor.fetchone()["id"]

    # 5. Projects
    projects_data = [
        ("prj-nh704", "NH-704-PKG-03B", "Delhi–Amritsar–Katra Expressway (Pkg 03B)", "National Highways Authority of India (NHAI)", "Punjab", "Ludhiana", 42.6, 480.2, "SECTION_19", "S.O. 4192(E)"),
        ("prj-pun-orr", "PUN-ORR-04", "Pune Outer Ring Road (Southern Arc)", "National Highways Authority of India (NHAI)", "Maharashtra", "Pune", 68.4, 620.0, "POSSESSION", "S.O. 1824(E)"),
    ]
    project_ids = {}
    for p_id, code, name, org_name, state, district, length_km, land_ha, status_val, gazette in projects_data:
        org_id = org_ids.get(org_name)
        cursor.execute(
            """INSERT INTO projects (id, name, organization_id, project_code, code, state, district, length_km, land_required_ha, status, gazette_ref)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;""",
            (p_id, name, org_id, code, code, state, district, length_km, land_ha, status_val, gazette)
        )
        project_ids[code] = cursor.fetchone()["id"]

    # 6. User-Project Assignments
    assignments = [
        ("agency.admin@test.com", "NH-704-PKG-03B"),
        ("agency.admin@test.com", "PUN-ORR-04"),
        ("project.manager@test.com", "NH-704-PKG-03B"),
        ("field.officer@test.com", "NH-704-PKG-03B"),
        ("district.officer@test.gov", "NH-704-PKG-03B"),
        ("revenue.cala.moradabad@nic.in", "NH-704-PKG-03B"),
    ]
    for email, prj_code in assignments:
        cursor.execute(
            "INSERT INTO user_projects (user_id, project_id) VALUES (%s, %s);",
            (user_ids[email], project_ids[prj_code])
        )

    conn.commit()
    seed_gis_and_payment_data(conn)

def seed_gis_and_payment_data(conn):
    import json
    cursor = conn.cursor()

    # Seed Showcase Projects if not already present
    additional_projects = [
        (
            "prj-mpe-01", "MPE-EXP-03", "Mumbai–Pune Expressway Expansion Project (Phase III)",
            "org-nhai", "Maharashtra", "Pune", 54.2, 380.0, "SECTION_19", "S.O. 3120(E)"
        ),
        (
            "prj-bce-02", "BCE-EXP-02", "Bangalore–Chennai Expressway (Package 2)",
            "org-nhai", "Karnataka", "Kolar", 71.0, 510.0, "POSSESSION", "S.O. 2241(E)"
        ),
        (
            "prj-dme-04", "DME-VAD-04", "Delhi–Mumbai Expressway (Vadodara Section)",
            "org-nhai", "Gujarat", "Vadodara", 48.5, 415.0, "SECTION_19", "S.O. 1824(E)"
        )
    ]
    cursor.executemany("""
    INSERT INTO projects (id, project_code, name, organization_id, state, district, length_km, land_required_ha, status, gazette_ref)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
    """, additional_projects)

    # Assign projects to users
    user_proj_addons = [
        ("usr-agency-01", "prj-mpe-01"),
        ("usr-agency-02", "prj-mpe-01"),
        ("usr-agency-03", "prj-mpe-01"),
        ("usr-gov-03", "prj-mpe-01"),
        ("usr-gov-04", "prj-mpe-01")
    ]
    cursor.executemany("INSERT INTO user_projects (user_id, project_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;", user_proj_addons)

    # Seed GIS Cadastral Parcels with fixed MultiPolygon geometries
    # Pune Corridor: Around Hinjawadi / Maan (Longitude: ~73.72 to 73.75, Latitude: ~18.58 to 18.60)
    p001_coords = [[
        [73.7360, 18.5900],
        [73.7410, 18.5900],
        [73.7415, 18.5935],
        [73.7380, 18.5940],
        [73.7355, 18.5925],
        [73.7360, 18.5900]
    ]]
    p001_geom = json.dumps({"type": "MultiPolygon", "coordinates": [p001_coords]})
    p001_bbox = json.dumps([73.7355, 18.5900, 73.7415, 18.5940])

    p002_coords = [[
        [73.7410, 18.5900],
        [73.7450, 18.5900],
        [73.7455, 18.5938],
        [73.7415, 18.5935],
        [73.7410, 18.5900]
    ]]
    p002_geom = json.dumps({"type": "MultiPolygon", "coordinates": [p002_coords]})
    p002_bbox = json.dumps([73.7410, 18.5900, 73.7455, 18.5938])

    p003_coords = [[
        [73.7300, 18.5855],
        [73.7345, 18.5860],
        [73.7340, 18.5895],
        [73.7295, 18.5890],
        [73.7300, 18.5855]
    ]]
    p003_geom = json.dumps({"type": "MultiPolygon", "coordinates": [p003_coords]})
    p003_bbox = json.dumps([73.7295, 18.5855, 73.7345, 18.5895])

    p004_coords = [[
        [73.7250, 18.5815],
        [73.7295, 18.5820],
        [73.7290, 18.5855],
        [73.7245, 18.5850],
        [73.7250, 18.5815]
    ]]
    p004_geom = json.dumps({"type": "MultiPolygon", "coordinates": [p004_coords]})
    p004_bbox = json.dumps([73.7245, 18.5815, 73.7295, 18.5855])

    p005_coords = [[
        [73.7450, 18.5900],
        [73.7490, 18.5905],
        [73.7485, 18.5940],
        [73.7455, 18.5938],
        [73.7450, 18.5900]
    ]]
    p005_geom = json.dumps({"type": "MultiPolygon", "coordinates": [p005_coords]})
    p005_bbox = json.dumps([73.7450, 18.5900, 73.7490, 18.5940])

    # Kolar Corridor (Bangalore-Chennai)
    p101_coords = [[
        [78.1300, 12.9830],
        [78.1350, 12.9835],
        [78.1345, 12.9870],
        [78.1295, 12.9865],
        [78.1300, 12.9830]
    ]]
    p101_geom = json.dumps({"type": "MultiPolygon", "coordinates": [p101_coords]})
    p101_bbox = json.dumps([78.1295, 12.9830, 78.1350, 12.9870])

    # Vadodara Corridor (Delhi-Mumbai)
    p201_coords = [[
        [73.0820, 22.2430],
        [73.0875, 22.2435],
        [73.0870, 22.2480],
        [73.0815, 22.2475],
        [73.0820, 22.2430]
    ]]
    p201_geom = json.dumps({"type": "MultiPolygon", "coordinates": [p201_coords]})
    p201_bbox = json.dumps([73.0815, 22.2430, 73.0875, 22.2480])

    land_parcels_data = [
        (
            "P-001", "124/2", "124/2", "Hinjawadi", "Mulshi", "Pune", "Maharashtra",
            "prj-mpe-01", "Mumbai–Pune Expressway Expansion Project (Phase III)",
            "LA-2026-001", "usr-landowner-01", "Ramesh Baliram Patil", "+91 9876543210",
            "Dry Agricultural (Jirayat)", 6.8, 68000.0,
            "AWARD_DECLARED", "APPROVED", "NOTICED",
            p001_geom, 18.5912, 73.7385, p001_bbox, 105.0
        ),
        (
            "P-002", "124/3", "124/3", "Hinjawadi", "Mulshi", "Pune", "Maharashtra",
            "prj-mpe-01", "Mumbai–Pune Expressway Expansion Project (Phase III)",
            "LA-2026-001", "usr-landowner-02", "Suresh Narayan Gaikwad", "+91 9823011223",
            "Commercial Corridor Strip", 2.4, 24000.0,
            "SECTION_19", "ASSESSED", "PENDING",
            p002_geom, 18.5920, 73.7430, p002_bbox, 150.0
        ),
        (
            "P-003", "125/1", "125/1", "Maan", "Mulshi", "Pune", "Maharashtra",
            "prj-mpe-01", "Mumbai–Pune Expressway Expansion Project (Phase III)",
            "LA-2026-001", "usr-landowner-03", "Anil Pandurang Shinde", "+91 9822998877",
            "Wet Agricultural (Bagayat)", 4.5, 45000.0,
            "POSSESSION_TAKEN", "DISBURSED", "TAKEN",
            p003_geom, 18.5875, 73.7320, p003_bbox, 120.0
        ),
        (
            "P-004", "126/4", "126/4", "Maan", "Mulshi", "Pune", "Maharashtra",
            "prj-mpe-01", "Mumbai–Pune Expressway Expansion Project (Phase III)",
            "LA-2026-001", "usr-gov-03", "Maan Village Gram Panchayat", "+91 9422001122",
            "Government / Gaothan Common", 8.2, 82000.0,
            "SECTION_11", "NOT_ASSESSED", "PENDING",
            p004_geom, 18.5835, 73.7270, p004_bbox, 90.0
        ),
        (
            "P-005", "127/1", "127/1", "Hinjawadi", "Mulshi", "Pune", "Maharashtra",
            "prj-mpe-01", "Mumbai–Pune Expressway Expansion Project (Phase III)",
            "LA-2026-001", "usr-landowner-05", "Sunita Vilas Patil", "+91 9822445566",
            "Dry Agricultural (Jirayat)", 3.1, 31000.0,
            "AWARD_DECLARED", "APPROVED", "PENDING",
            p005_geom, 18.5922, 73.7470, p005_bbox, 105.0
        ),
        (
            "P-101", "88/1A", "88/1A", "Kolar Gold Fields", "Bangarapet", "Kolar", "Karnataka",
            "prj-bce-02", "Bangalore–Chennai Expressway (Package 2)",
            "LA-2026-088", "usr-landowner-10", "Venkatesh Murthy", "+91 9845012345",
            "Industrial Corridor", 3.6, 36000.0,
            "AWARD_DECLARED", "APPROVED", "NOTICED",
            p101_geom, 12.9850, 78.1320, p101_bbox, 140.0
        ),
        (
            "P-201", "204/B", "204/B", "Padra", "Vadodara", "Vadodara", "Gujarat",
            "prj-dme-04", "Delhi–Mumbai Expressway (Vadodara Section)",
            "LA-2026-204", "usr-landowner-20", "Dineshbhai Patel", "+91 9898012345",
            "Irrigated Farmland", 5.1, 51000.0,
            "SECTION_19", "ASSESSED", "PENDING",
            p201_geom, 22.2450, 73.0850, p201_bbox, 110.0
        )
    ]

    cursor.executemany("""
    INSERT INTO land_parcels (
        id, survey_number, khasra_number, village, taluka, district, state,
        project_id, project_name, acquisition_case_id, owner_id, owner_name, owner_contact,
        land_classification, area_ha, area_sqm,
        acquisition_status, compensation_status, possession_status,
        geometry_geojson, centroid_lat, centroid_lng, bbox_json, market_rate_per_sqm
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
    """, land_parcels_data)

    # Populate matching rows into base parcels table for FK & backward-compatibility
    # (Skipped because parcels table doesn't exist)
    
    # Link usr-landowner-01 to P-001 in user_parcels
    cursor.execute("INSERT INTO user_parcels (user_id, parcel_id, ownership_share) VALUES ('usr-landowner-01', 'P-001', 1.0) ON CONFLICT DO NOTHING;")

    # Seed Compensations
    compensations_data = [
        (
            "COMP-2026-001", "LA-2026-001", "P-001", "usr-landowner-01", "Ramesh Baliram Patil",
            "••••••••3421", "SBIN0001824", 71.4, 71.4, 0.0, 142.8, 1.428,
            "APPROVED", "Dr. Rajesh Sharma", "Dr. Rajesh Sharma", "2026-09-08"
        ),
        (
            "COMP-2026-002", "LA-2026-001", "P-002", "usr-landowner-02", "Suresh Narayan Gaikwad",
            "••••••••4532", "HDFC0001234", 36.0, 36.0, 0.0, 72.0, 0.720,
            "ASSESSED", "Dr. Rajesh Sharma", None, None
        ),
        (
            "COMP-2026-003", "LA-2026-001", "P-003", "usr-landowner-03", "Anil Pandurang Shinde",
            "••••••••7712", "MAHB0000123", 54.0, 54.0, 0.0, 108.0, 1.080,
            "APPROVED", "Dr. Rajesh Sharma", "Dr. Rajesh Sharma", "2026-09-05"
        ),
        (
            "COMP-2026-005", "LA-2026-001", "P-005", "usr-landowner-05", "Sunita Vilas Patil",
            "••••••••5566", "SBIN0001824", 32.55, 32.55, 0.0, 65.1, 0.651,
            "APPROVED", "Dr. Rajesh Sharma", "Dr. Rajesh Sharma", "2026-09-08"
        )
    ]

    cursor.executemany("""
    INSERT INTO compensations (
        id, case_id, parcel_id, beneficiary_id, beneficiary_name,
        bank_account_masked, ifsc_code, market_value_lakh, solatium_amount_lakh,
        additional_interest_lakh, total_amount_lakh, total_amount_cr, status,
        assessed_by, approved_by, approved_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
    """, compensations_data)

    # Seed Payments
    p1_audit = json.dumps([
        {"timestamp": "2026-09-09 11:20:00", "status": "INITIATED", "actor": "Dr. Rajesh Sharma (CALA)", "remarks": "PFMS-DBT payment order generated"},
        {"timestamp": "2026-09-09 11:22:15", "status": "PROCESSING", "actor": "PFMS Core Banking Gateway", "remarks": "Mandate batch PFMS-BTH-881 accepted by RBI / NPCI"}
    ])

    p3_audit = json.dumps([
        {"timestamp": "2026-09-08 14:10:00", "status": "INITIATED", "actor": "Dr. Rajesh Sharma (CALA)", "remarks": "PFMS batch created"},
        {"timestamp": "2026-09-08 14:15:00", "status": "PROCESSING", "actor": "PFMS Gateway", "remarks": "Mandate accepted"},
        {"timestamp": "2026-09-08 16:45:00", "status": "SUCCESS", "actor": "Bank of Maharashtra", "remarks": "UTR: BOM2026090888129 credited to beneficiary"}
    ])

    payments_data = [
        (
            "PAY-2026-001", "LA-2026-001", "COMP-2026-001", "usr-landowner-01", "Ramesh Baliram Patil",
            14280000.0, "PFMS_DBT", "PROCESSING", "PFMS-DBT-2026-98124", "PFMS",
            "Dr. Rajeshwar Sharma", "2026-09-09 11:20:00", None, None, None,
            0, "2026-09-09 11:20:00", "2026-09-09 11:20:00", "••••••••3421", "SBIN0001824", "PFMS-BTH-881"
        ),
        (
            "PAY-2026-003", "LA-2026-001", "COMP-2026-003", "usr-landowner-03", "Anil Pandurang Shinde",
            10800000.0, "PFMS_DBT", "SUCCESS", "PFMS-DBT-2026-97992", "PFMS",
            "Dr. Rajeshwar Sharma", "2026-09-08 14:10:00", "2026-09-08 16:45:00", "2026-09-08 16:45:00", None,
            0, "2026-09-08 14:10:00", "2026-09-08 16:45:00", "••••••••7712", "MAHB0000123", "PFMS-BTH-875"
        )
    ]

    cursor.executemany("""
    INSERT INTO payments (
        id, case_id, compensation_id, beneficiary_id, beneficiary_name,
        amount_rs, payment_type, status, payment_reference, payment_provider,
        initiated_by, initiated_at, processed_at, credited_at, failure_reason,
        retry_count, created_at, updated_at,
        bank_account_masked, ifsc_code, urn_number
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
    """, payments_data)

    conn.commit()
    seed_gis_zones_and_intersections(conn)

def seed_gis_zones_and_intersections(conn: Any):
    import json
    cursor = conn.cursor()

    # 1. Update project corridor geometry for prj-mpe-01
    corridor_geom = {
        "type": "MultiPolygon",
        "coordinates": [[
            [
                [73.7200, 18.5880],
                [73.7550, 18.5930],
                [73.7550, 18.5960],
                [73.7200, 18.5910],
                [73.7200, 18.5880]
            ]
        ]]
    }
    cursor.execute("""
    UPDATE projects 
    SET geometry_geojson = %s
    WHERE id = 'prj-mpe-01';
    """, (json.dumps(corridor_geom),))

    # 2. Seed Sensitive & Restricted Zones
    # Forest Zone: Mulshi Reserved Forest Block III
    z_forest_coords = [[
        [73.7220, 18.5860],
        [73.7330, 18.5870],
        [73.7340, 18.5920],
        [73.7230, 18.5910],
        [73.7220, 18.5860]
    ]]
    z_forest_geom = json.dumps({"type": "MultiPolygon", "coordinates": [z_forest_coords]})

    # Green Belt: Mula-Mutha River Basin Eco-Green Buffer
    z_green_coords = [[
        [73.7380, 18.5910],
        [73.7460, 18.5920],
        [73.7460, 18.5960],
        [73.7380, 18.5950],
        [73.7380, 18.5910]
    ]]
    z_green_geom = json.dumps({"type": "MultiPolygon", "coordinates": [z_green_coords]})

    # Water Body: Mula River Tributary Flood Buffer
    z_water_coords = [[
        [73.7340, 18.5870],
        [73.7370, 18.5870],
        [73.7370, 18.5950],
        [73.7340, 18.5950],
        [73.7340, 18.5870]
    ]]
    z_water_geom = json.dumps({"type": "MultiPolygon", "coordinates": [z_water_coords]})

    # Industrial Planning: Hinjawadi Special IT / Industrial Zone
    z_ind_coords = [[
        [73.7440, 18.5880],
        [73.7550, 18.5890],
        [73.7550, 18.5960],
        [73.7440, 18.5950],
        [73.7440, 18.5880]
    ]]
    z_ind_geom = json.dumps({"type": "MultiPolygon", "coordinates": [z_ind_coords]})

    # Wetland: Pashan Lake Catchment Wetland
    z_wet_coords = [[
        [73.7750, 18.5350],
        [73.7850, 18.5350],
        [73.7850, 18.5450],
        [73.7750, 18.5450],
        [73.7750, 18.5350]
    ]]
    z_wet_geom = json.dumps({"type": "MultiPolygon", "coordinates": [z_wet_coords]})

    # Eco-Sensitive Zone: Western Ghats ESZ Buffer
    z_esz_coords = [[
        [73.5500, 18.6500],
        [73.6500, 18.6500],
        [73.6500, 18.7500],
        [73.5500, 18.7500],
        [73.5500, 18.6500]
    ]]
    z_esz_geom = json.dumps({"type": "MultiPolygon", "coordinates": [z_esz_coords]})

    zones_data = [
        (
            "ZONE-FOR-01", "Mulshi Reserved Forest Block III", "FOREST",
            z_forest_geom, "Maharashtra State Forest Department (Pune Circle)",
            "Working Plan & Survey of India Forest Compartment Map (2024)",
            "2024-03-15",
            json.dumps({"canopy_density": "0.45", "legal_status": "Reserved Forest u/s 20 IFA 1927", "clearance_type": "MoEFCC Stage-I & Stage-II Required"}),
            True, "2024-03-15 00:00:00"
        ),
        (
            "ZONE-GRN-01", "Mula-Mutha River Basin Eco-Green Buffer", "GREEN_BELT",
            z_green_geom, "PMRDA Development Planning Cell",
            "Pune Metropolitan Regional Development Plan 2041 (Gazette S.O. 1102)",
            "2023-11-20",
            json.dumps({"zoning_clause": "PMRDA Reg 14.2 Green Buffer", "restriction": "No permanent non-transport construction without tree authority NOC"}),
            True, "2023-11-20 00:00:00"
        ),
        (
            "ZONE-WAT-01", "Mula River Tributary Flood Buffer Line", "WATER_BODY",
            z_water_geom, "Department of Water Resources, Govt. of Maharashtra",
            "Blue Line / Red Line Flood Zone Survey (CWC / WRD 2025)",
            "2025-01-10",
            json.dumps({"hfl_level": "558.4m MSL", "buffer_distance_m": 50, "clearance_type": "Irrigation Dept Pier & Embankment NOC"}),
            True, "2025-01-10 00:00:00"
        ),
        (
            "ZONE-IND-01", "Hinjawadi Special IT / Industrial Planning Zone", "INDUSTRIAL",
            z_ind_geom, "Maharashtra Industrial Development Corporation (MIDC)",
            "Rajiv Gandhi Infotech Park Phase 3 Master Plan",
            "2022-08-01",
            json.dumps({"utility_corridor": "Designated Transport / Highway Corridor Alignment", "clearance_type": "Corridor Consent Obtained"}),
            True, "2022-08-01 00:00:00"
        ),
        (
            "ZONE-WET-01", "Pashan Lake Catchment Wetland", "WETLAND",
            z_wet_geom, "State Wetland Authority, Maharashtra",
            "National Wetland Atlas (SAC/ISRO 2023)",
            "2023-06-12",
            json.dumps({"ramsar_status": "State Protected Wetland", "zone_status": "No Development in 50m Zone"}),
            True, "2023-06-12 00:00:00"
        ),
        (
            "ZONE-ESZ-01", "Western Ghats Eco-Sensitive Buffer Zone", "ECO_SENSITIVE",
            z_esz_geom, "Ministry of Environment, Forest & Climate Change (MoEFCC)",
            "Eco-Sensitive Zone Statutory Notification S.O. 2488(E)",
            "2024-07-31",
            json.dumps({"notification_ref": "S.O. 2488(E)", "appraisal_body": "ESZ Monitoring Committee"}),
            True, "2024-07-31 00:00:00"
        )
    ]

    cursor.executemany("""
    INSERT INTO gis_zones (
        id, zone_name, zone_type, geometry_geojson, authority, source,
        source_date, metadata, is_active, created_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
    """, zones_data)

    # 3. Seed Project Intersections for prj-mpe-01
    project_intersections = [
        (
            "PZI-MPE-FOR-01", "prj-mpe-01", "ZONE-FOR-01", 8.40, 7.0, "HIGH", "UNDER_REVIEW",
            "FC-MH-2026-9912",
            "MoEFCC Stage-I Forest Clearance Application submitted to Principal Chief Conservator of Forests (PCCF). Site inspection by Deputy Conservator of Forests completed.",
            "2026-09-02 10:15:00", "Dr. Rajesh Sharma, IAS", "2026-09-08 14:30:00"
        ),
        (
            "PZI-MPE-GRN-01", "prj-mpe-01", "ZONE-GRN-01", 3.20, 2.7, "MODERATE", "PENDING",
            None,
            "PMRDA Tree Authority Compensatory Afforestation Plan (1:3 sapling ratio) under joint site verification.",
            "2026-09-02 10:15:00", None, None
        ),
        (
            "PZI-MPE-WAT-01", "prj-mpe-01", "ZONE-WAT-01", 1.10, 0.9, "MODERATE", "PENDING",
            None,
            "Water Resources Dept high flood level (HFL) bridge pier clearance submitted for CALA review.",
            "2026-09-02 10:15:00", None, None
        ),
        (
            "PZI-MPE-IND-01", "prj-mpe-01", "ZONE-IND-01", 14.80, 12.3, "LOW", "NOT_APPLICABLE",
            "MIDC-NOC-2026-441",
            "MIDC Special Planning Authority statutory corridor consent registered without objection.",
            "2026-09-02 10:15:00", "Smt. Ananya Deshmukh, IAS", "2026-09-07 11:20:00"
        ),
        (
            "PZI-MPE-WET-01", "prj-mpe-01", "ZONE-WET-01", 0.00, 0.0, "LOW", "CLEARED",
            "WET-CLR-EXEMPT",
            "Spatial intersection check confirms project boundary is 4.2 km clear of Pashan Lake wetland catchment.",
            "2026-09-02 10:15:00", "Dr. Rajesh Sharma, IAS", "2026-09-08 14:30:00"
        ),
        (
            "PZI-MPE-ESZ-01", "prj-mpe-01", "ZONE-ESZ-01", 0.00, 0.0, "LOW", "CLEARED",
            "ESZ-CLR-EXEMPT",
            "Automated GIS spatial check confirms highway corridor lies outside notified Western Ghats ESA boundary.",
            "2026-09-02 10:15:00", "Shri Vikramaditya Verma, IAS", "2026-09-08 16:00:00"
        )
    ]

    cursor.executemany("""
    INSERT INTO project_zone_intersections (
        id, project_id, zone_id, intersection_area_ha, percentage_affected,
        risk_level, review_status, clearance_reference, remarks,
        detected_at, reviewed_by, reviewed_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
    """, project_intersections)

    # 4. Seed Parcel-Level Intersections
    parcel_intersections = [
        ("PAZI-P001-GRN", "P-001", "ZONE-GRN-01", 0.82, 12.1, "MODERATE", "2026-09-02 10:15:00"),
        ("PAZI-P003-WAT", "P-003", "ZONE-WAT-01", 0.65, 14.4, "MODERATE", "2026-09-02 10:15:00"),
        ("PAZI-P004-FOR", "P-004", "ZONE-FOR-01", 2.40, 29.3, "HIGH", "2026-09-02 10:15:00"),
        ("PAZI-P002-IND", "P-002", "ZONE-IND-01", 1.80, 75.0, "LOW", "2026-09-02 10:15:00")
    ]

    cursor.executemany("""
    INSERT INTO parcel_zone_intersections (
        id, parcel_id, zone_id, intersection_area_ha, percentage_affected,
        risk_level, detected_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
    """, parcel_intersections)

    conn.commit()


if __name__ == "__main__":
    init_db()
    print("Database initialized and seeded successfully.")
