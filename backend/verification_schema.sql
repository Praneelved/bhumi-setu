-- ============================================================================
-- BHOOMI SETU: STAGE-SPECIFIC DOCUMENT VERIFICATION SCHEMA
-- Stages: District Collector -> State Government -> Central Ministry
-- ============================================================================

-- 1. Verification Cases
CREATE TABLE IF NOT EXISTS verification_cases (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64),
    project_name VARCHAR(255) NOT NULL,
    agency VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    total_parcels INTEGER DEFAULT 1,
    affected_families INTEGER DEFAULT 1,
    submitted_date VARCHAR(50) NOT NULL,
    current_stage VARCHAR(50) NOT NULL DEFAULT 'DISTRICT_COLLECTOR',
    workflow_status VARCHAR(60) NOT NULL DEFAULT 'DISTRICT_DOCUMENT_VERIFICATION_PENDING',
    overall_status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    stages_json JSONB NOT NULL,
    district_data JSONB NOT NULL,
    state_data JSONB NOT NULL,
    central_data JSONB NOT NULL,
    active_rejection JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Verification Documents
CREATE TABLE IF NOT EXISTS verification_documents (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES verification_cases(id) ON DELETE CASCADE,
    doc_number VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    total_pages INTEGER DEFAULT 1,
    pages_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    uploaded_date VARCHAR(50) NOT NULL,
    uploaded_by VARCHAR(100) DEFAULT 'Landowner',
    version INTEGER DEFAULT 1,
    verified_at VARCHAR(50),
    verified_by VARCHAR(100),
    rejection_category TEXT,
    rejection_reason TEXT,
    rejection_remarks TEXT,
    required_correction TEXT,
    rejected_at VARCHAR(50),
    rejected_by VARCHAR(100),
    required_for_stage JSONB NOT NULL DEFAULT '["DISTRICT_COLLECTOR"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Verification Audit Logs
CREATE TABLE IF NOT EXISTS verification_audit_logs (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    case_id VARCHAR(64) NOT NULL REFERENCES verification_cases(id) ON DELETE CASCADE,
    timestamp VARCHAR(50) NOT NULL,
    authority_level VARCHAR(50) NOT NULL,
    authority_title VARCHAR(255) NOT NULL,
    officer_name VARCHAR(255) NOT NULL,
    officer_id VARCHAR(64) NOT NULL,
    action VARCHAR(50) NOT NULL,
    document_id VARCHAR(64),
    document_title VARCHAR(255),
    check_id VARCHAR(64),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    reason TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Landowner Notifications
CREATE TABLE IF NOT EXISTS landowner_notifications (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    case_id VARCHAR(64) NOT NULL REFERENCES verification_cases(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    document_id VARCHAR(64),
    document_name VARCHAR(255),
    authority VARCHAR(50) NOT NULL,
    rejection_reason TEXT,
    officer_remarks TEXT,
    required_correction TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verif_cases_stage ON verification_cases(current_stage, workflow_status);
CREATE INDEX IF NOT EXISTS idx_verif_docs_case ON verification_documents(case_id, status);
CREATE INDEX IF NOT EXISTS idx_verif_audit_case ON verification_audit_logs(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landowner_notif_case ON landowner_notifications(case_id, created_at DESC);
