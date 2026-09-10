-- ============================================================================
-- BHOOMI SETU: POSTGRESQL + POSTGIS PRODUCTION SCHEMA
-- Standards: RFCTLARR Act 2013 & NIC Cadastral Security
-- ============================================================================

-- 1. Enable PostGIS Extension (Skipped for local fallback)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Land Parcels Table with Spatial Geometry
CREATE TABLE IF NOT EXISTS land_parcels (
    id VARCHAR(64) PRIMARY KEY,
    survey_number VARCHAR(64) NOT NULL,
    khasra_number VARCHAR(64),
    village VARCHAR(128) NOT NULL,
    taluka VARCHAR(128) NOT NULL,
    district VARCHAR(128) NOT NULL,
    state VARCHAR(128) NOT NULL,
    area_ha NUMERIC(10, 4) NOT NULL,
    area_sqm NUMERIC(12, 4),
    land_type VARCHAR(128),
    land_classification VARCHAR(128),
    owner_id VARCHAR(64),
    owner_name VARCHAR(255) NOT NULL,
    owner_contact VARCHAR(64),
    project_id VARCHAR(64) NOT NULL,
    project_name VARCHAR(255),
    acquisition_case_id VARCHAR(64) NOT NULL,
    acquisition_status VARCHAR(64) NOT NULL,
    verification_status VARCHAR(64),
    compensation_status VARCHAR(64) NOT NULL,
    possession_status VARCHAR(64) NOT NULL,
    geometry_geojson TEXT NOT NULL,
    centroid_lat NUMERIC(10, 6),
    centroid_lng NUMERIC(10, 6),
    bbox_json TEXT,
    market_rate_per_sqm NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Spatial GIST Index on Geometry Column
-- CREATE INDEX IF NOT EXISTS idx_land_parcels_geometry
-- ON land_parcels USING GIST (geometry);

-- 4. B-Tree Indexes for Fast Administrative Search & Scoping
CREATE INDEX IF NOT EXISTS idx_land_parcels_project ON land_parcels(project_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_case ON land_parcels(acquisition_case_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_owner ON land_parcels(owner_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_survey ON land_parcels(survey_number);
CREATE INDEX IF NOT EXISTS idx_land_parcels_district ON land_parcels(district, state);

-- 5. Compensations Table
CREATE TABLE IF NOT EXISTS compensations (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    parcel_id VARCHAR(64) NOT NULL,
    beneficiary_id VARCHAR(64) NOT NULL,
    beneficiary_name VARCHAR(255) NOT NULL,
    bank_account_masked VARCHAR(64) NOT NULL,
    ifsc_code VARCHAR(32) NOT NULL,
    market_value_lakh NUMERIC(12, 2) NOT NULL,
    solatium_amount_lakh NUMERIC(12, 2) NOT NULL, -- 100% Solatium under Section 30 RFCTLARR
    additional_interest_lakh NUMERIC(12, 2) NOT NULL, -- 12% p.a. under Section 30(3)
    total_amount_lakh NUMERIC(12, 2) NOT NULL,
    total_amount_cr NUMERIC(10, 4) NOT NULL,
    status VARCHAR(64) NOT NULL, -- ASSESSED, REVIEWED, APPROVED, DISBURSED, REJECTED
    assessed_by VARCHAR(255),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parcel_id) REFERENCES land_parcels(id)
);

CREATE INDEX IF NOT EXISTS idx_compensations_case ON compensations(case_id);
CREATE INDEX IF NOT EXISTS idx_compensations_beneficiary ON compensations(beneficiary_id);

-- 6. Payments Table (Government → Landowner Disbursal)
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    compensation_id VARCHAR(64) NOT NULL,
    beneficiary_id VARCHAR(64) NOT NULL,
    beneficiary_name VARCHAR(255) NOT NULL,
    amount_rs NUMERIC(14, 2) NOT NULL,
    payment_type VARCHAR(64) NOT NULL, -- COMPENSATION, SOLATIUM, R_AND_R, OTHER
    status VARCHAR(64) NOT NULL, -- PENDING, APPROVED, INITIATED, PROCESSING, SUCCESS, FAILED
    payment_reference VARCHAR(128) NOT NULL UNIQUE,
    payment_provider VARCHAR(128) DEFAULT 'PFMS_GOV_GATEWAY_MOCK',
    initiated_by VARCHAR(255),
    initiated_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    credited_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    bank_account_masked VARCHAR(64),
    ifsc_code VARCHAR(32),
    urn_number VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compensation_id) REFERENCES compensations(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_case ON payments(case_id);
CREATE INDEX IF NOT EXISTS idx_payments_beneficiary ON payments(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 7. Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64),
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(128) NOT NULL,
    resource_id VARCHAR(64),
    details TEXT,
    ip_address VARCHAR(64),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. GIS SENSITIVE & RESTRICTED ZONES (PostGIS MultiPolygon Layer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gis_zones (
    id VARCHAR(64) PRIMARY KEY,
    zone_name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(64) NOT NULL, -- FOREST, GREEN_BELT, ECO_SENSITIVE, WETLAND, WATER_BODY, AGRICULTURAL, RESIDENTIAL, INDUSTRIAL
    geometry_geojson TEXT NOT NULL,
    authority VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL, -- State Forest Dept, PMRDA, MoEFCC, State Wetland Auth
    source_date DATE,
    metadata JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CREATE INDEX IF NOT EXISTS idx_gis_zones_geometry
-- ON gis_zones USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_gis_zones_type ON gis_zones(zone_type);
CREATE INDEX IF NOT EXISTS idx_gis_zones_active ON gis_zones(is_active);

-- ============================================================================
-- 9. PROJECT ZONE INTERSECTIONS (Spatial Analysis & Compliance Record)
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_zone_intersections (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    zone_id VARCHAR(64) NOT NULL,
    intersection_area_ha NUMERIC(10, 4) NOT NULL,
    percentage_affected NUMERIC(6, 2) NOT NULL,
    risk_level VARCHAR(32) NOT NULL, -- LOW, MODERATE, HIGH, CRITICAL
    review_status VARCHAR(64) NOT NULL DEFAULT 'PENDING', -- PENDING, UNDER_REVIEW, CLEARED, CONDITIONAL_CLEARANCE, NOT_APPLICABLE
    clearance_reference VARCHAR(128),
    remarks TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (zone_id) REFERENCES gis_zones(id)
);

CREATE INDEX IF NOT EXISTS idx_pzi_project ON project_zone_intersections(project_id);
CREATE INDEX IF NOT EXISTS idx_pzi_zone ON project_zone_intersections(zone_id);
CREATE INDEX IF NOT EXISTS idx_pzi_risk ON project_zone_intersections(risk_level);

-- ============================================================================
-- 10. PARCEL ZONE INTERSECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS parcel_zone_intersections (
    id VARCHAR(64) PRIMARY KEY,
    parcel_id VARCHAR(64) NOT NULL,
    zone_id VARCHAR(64) NOT NULL,
    intersection_area_ha NUMERIC(10, 4) NOT NULL,
    percentage_affected NUMERIC(6, 2) NOT NULL,
    risk_level VARCHAR(32) NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parcel_id) REFERENCES land_parcels(id),
    FOREIGN KEY (zone_id) REFERENCES gis_zones(id)
);

CREATE INDEX IF NOT EXISTS idx_parzi_parcel ON parcel_zone_intersections(parcel_id);
CREATE INDEX IF NOT EXISTS idx_parzi_zone ON parcel_zone_intersections(zone_id);

-- ============================================================================
-- PRODUCTION POSTGIS SPATIAL INTERSECTION QUERY (Reference)
-- ============================================================================
-- SELECT 
--     z.id AS zone_id,
--     z.zone_name,
--     z.zone_type,
--     z.authority,
--     ST_Area(ST_Intersection(p.geometry, z.geometry)::geography) / 10000.0 AS intersection_area_ha,
--     (ST_Area(ST_Intersection(p.geometry, z.geometry)::geography) / ST_Area(p.geometry::geography)) * 100.0 AS percentage_affected
-- FROM projects p
-- JOIN gis_zones z ON ST_Intersects(p.geometry, z.geometry)
-- WHERE p.id = 'prj-mpe-01' AND z.is_active = TRUE;

