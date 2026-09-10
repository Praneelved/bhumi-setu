import json
import datetime
from typing import Dict, Any, List, Optional
from db import get_db
from viasocket_service import send_viasocket_notification, send_viasocket_document_event

INITIAL_DISTRICT_CHECKLIST = [
    {"id": "DC-01", "label": "Landowner name & ownership details verified", "description": "Title deeds, mutation register entries (Form 6), and co-owner percentage shares verified against 7/12 extract.", "verified": False, "mandatory": True},
    {"id": "DC-02", "label": "Survey / Khasra number verified", "description": "Cadastral survey and Khasra numbers cross-referenced against sub-registrar and revenue records.", "verified": False, "mandatory": True},
    {"id": "DC-03", "label": "Land area validated against GIS polygon", "description": "Acquired area (14.50 Ha) validated against spatial DGPS survey coordinates.", "verified": False, "mandatory": True},
    {"id": "DC-04", "label": "Village, Taluka & District boundaries verified", "description": "Revenue boundaries for Hinjawadi village and Mulshi taluka authenticated.", "verified": False, "mandatory": True},
    {"id": "DC-05", "label": "7/12 extract & land records authenticated", "description": "Official 7/12 extract and non-encumbrance certificate validated.", "verified": False, "mandatory": True},
    {"id": "DC-06", "label": "Land map & cadastral boundary map certified", "description": "Joint Measurement Survey (JMS) sheet and boundary geo-fencing verified.", "verified": False, "mandatory": True},
    {"id": "DC-07", "label": "Uploaded document clarity & consistency confirmed", "description": "Clarity of submitted deeds and zero discrepancy with parcel registry confirmed.", "verified": False, "mandatory": True},
    {"id": "DC-08", "label": "Field verification report confirmed", "description": "Physical inspection report and geo-tagged site photographs verified by Revenue Inspector.", "verified": False, "mandatory": True}
]

INITIAL_STATE_CHECKLIST = [
    {"id": "SC-01", "label": "District verification status certified", "description": "District Collector certified land schedule and local revenue clearance authenticated.", "verified": False, "mandatory": True},
    {"id": "SC-02", "label": "State-level land acquisition compliance (RFCTLARR 2013)", "description": "Sections 11 preliminary notification and Section 19 declaration validated in State Gazette.", "verified": False, "mandatory": True},
    {"id": "SC-03", "label": "State-specific statutory requirements satisfied", "description": "Public objections hearing (Section 15) completed and administrative sanction granted.", "verified": False, "mandatory": True},
    {"id": "SC-04", "label": "Compensation assessment & Solatium review", "description": "Land valuation per acre, 100% Solatium (Sec 30), and 12% additional interest verified.", "verified": False, "mandatory": True},
    {"id": "SC-05", "label": "Rehabilitation & Resettlement (R&R) documentation approved", "description": "R&R scheme for 412 affected families and integrated colony allocation validated.", "verified": False, "mandatory": True},
    {"id": "SC-06", "label": "Project impact & environmental sensitivity appraisal", "description": "Social Impact Assessment (SIA) appraisal approved by state expert group.", "verified": False, "mandatory": True},
    {"id": "SC-07", "label": "Land-use & zoning consistency verified", "description": "Regional development plan zoning and non-agricultural classification verified.", "verified": False, "mandatory": True},
    {"id": "SC-08", "label": "State-level approvals & inter-departmental clearances", "description": "State PWD, irrigation, and revenue department clearances in order.", "verified": False, "mandatory": True}
]

INITIAL_CENTRAL_CHECKLIST = [
    {"id": "CC-01", "label": "Central-level authorization & CCEA Cabinet sanction", "description": "Cabinet Committee on Economic Affairs (CCEA) sanction and expenditure approvals verified.", "verified": False, "mandatory": True},
    {"id": "CC-02", "label": "National statutory compliance & PM Gati Shakti alignment", "description": "Alignment with PM Gati Shakti National Master Plan and national logistics guidelines.", "verified": False, "mandatory": True},
    {"id": "CC-03", "label": "District & State verification signoff audit", "description": "Prior verification records from District Collector and State Secretariat certified.", "verified": False, "mandatory": True},
    {"id": "CC-04", "label": "Final document package review & completeness", "description": "Comprehensive document repository verified with full chain of custody.", "verified": False, "mandatory": True},
    {"id": "CC-05", "label": "National project scale & treasury outlay allocation", "description": "Central treasury fund allocation and Direct Benefit Transfer (DBT) escrow verified.", "verified": False, "mandatory": True},
    {"id": "CC-06", "label": "Central statutory clearances (MoEFCC Stage-II Forest)", "description": "Ministry of Environment, Forest & Climate Change Stage-II clearance orders on record.", "verified": False, "mandatory": True},
    {"id": "CC-07", "label": "Final risk, vigilance & litigation clearance", "description": "Supreme Court and High Court litigation status clear; zero stay orders in effect.", "verified": False, "mandatory": True},
    {"id": "CC-08", "label": "Statutory digital certificate & final approval seal", "description": "Final digital certificate of land acquisition authorization sealed.", "verified": False, "mandatory": True}
]

INITIAL_DOCUMENTS = [
    {
        "id": "DOC-001",
        "doc_number": "01",
        "title": "Land Ownership Record",
        "type": "LAND_OWNERSHIP",
        "status": "PENDING",
        "total_pages": 2,
        "required_for_stage": ["DISTRICT_COLLECTOR"],
        "uploaded_date": "10 Sep 2026",
        "uploaded_by": "Demo Landowner",
        "version": 1,
        "pages": [
            {
                "pageNumber": 1,
                "title": "Title Deed & Possession Sanad",
                "contentHeading": "DEMO DOCUMENT — FOR SIH PROTOTYPE",
                "khasraNumbers": ["124/2"],
                "areaHa": 2.40,
                "officialRef": "SANAD-DEMO-2026-124",
                "landowner": "Demo Landowner",
                "village": "Demo Village",
                "taluka": "Demo Taluka",
                "district": "Demo District",
                "state": "Demo State",
                "statusLabel": "PENDING DISTRICT VERIFICATION"
            },
            {
                "pageNumber": 2,
                "title": "Revenue Record Endorsement Sheet",
                "contentHeading": "Tehsildar Title Certification & Non-Encumbrance Seal",
                "officialRef": "TEH-VAL-2026-441"
            }
        ]
    },
    {
        "id": "DOC-002",
        "doc_number": "02",
        "title": "7/12 Extract / Land Record",
        "type": "SEVEN_TWELVE_EXTRACT",
        "status": "PENDING",
        "total_pages": 2,
        "required_for_stage": ["DISTRICT_COLLECTOR"],
        "uploaded_date": "10 Sep 2026",
        "uploaded_by": "Demo Landowner",
        "version": 1,
        "pages": [
            {
                "pageNumber": 1,
                "title": "Form VII-XII Record of Rights",
                "contentHeading": "DEMO DOCUMENT — FOR SIH PROTOTYPE",
                "khasraNumbers": ["124/3"],
                "discrepancyNotice": "Demonstration Discrepancy: Khasra number indicates 124/3 on extract sheet while registered parcel is 124/2.",
                "areaHa": 2.40,
                "landowner": "Demo Landowner",
                "village": "Demo Village",
                "taluka": "Demo Taluka",
                "district": "Demo District",
                "landType": "Dry Agricultural (Jirayat)"
            },
            {
                "pageNumber": 2,
                "title": "Form 6 Mutation Register Entries",
                "contentHeading": "Succession & Lawful Possession Attestation (Talathi Endorsement)"
            }
        ]
    },
    {
        "id": "DOC-003",
        "doc_number": "03",
        "title": "Registered Sale Deed",
        "type": "SALE_DEED",
        "status": "PENDING",
        "total_pages": 3,
        "required_for_stage": ["DISTRICT_COLLECTOR"],
        "uploaded_date": "10 Sep 2026",
        "uploaded_by": "Demo Landowner",
        "version": 1,
        "pages": [
            {
                "pageNumber": 1,
                "title": "Conveyance Deed Registration Certificate",
                "contentHeading": "DEMO DOCUMENT — FOR SIH PROTOTYPE",
                "officialRef": "DEED-REG-2021-99882",
                "seller": "Fictional Vendor (Ramesh Sharma)",
                "buyer": "Demo Landowner",
                "registrationDate": "14 May 2021",
                "khasraNumbers": ["124/2"],
                "areaHa": 2.40
            },
            {
                "pageNumber": 2,
                "title": "Schedule of Land Boundaries & Consideration",
                "contentHeading": "Boundary Demarcation: North Survey 123, South Highway, East 125, West 124/1"
            },
            {
                "pageNumber": 3,
                "title": "Sub-Registrar Attestation & Stamp Duty Receipt",
                "contentHeading": "Government Stamp Duty Paid: ₹ 1,42,800 • Registration Endorsed"
            }
        ]
    },
    {
        "id": "DOC-004",
        "doc_number": "04",
        "title": "Land Parcel Map (Cadastral GIS Map)",
        "type": "CADASTRAL_SURVEY_MAP",
        "status": "PENDING",
        "total_pages": 2,
        "required_for_stage": ["DISTRICT_COLLECTOR"],
        "uploaded_date": "10 Sep 2026",
        "uploaded_by": "Demo Landowner",
        "version": 1,
        "pages": [
            {
                "pageNumber": 1,
                "title": "Cadastral Map Sheet #14 - Survey 124/2",
                "contentHeading": "DEMO GIS DOCUMENT — FOR SIH PROTOTYPE",
                "officialRef": "GIS-CAD-DEMO-001",
                "khasraNumbers": ["124/2"],
                "areaHa": 2.40,
                "village": "Demo Village",
                "district": "Demo District",
                "scale": "1:2000 Metric",
                "northArrow": "North [↑ N]",
                "boundaryCoordinates": "18.5912° N, 73.7385° E to 18.5925° N, 73.7440° E"
            },
            {
                "pageNumber": 2,
                "title": "Joint Measurement Survey (JMS) Coordinates",
                "contentHeading": "4 ETRF-2000 GIS Pillar Geo-tag Demarcation Points Certified"
            }
        ]
    },
    {
        "id": "DOC-005",
        "doc_number": "05",
        "title": "Identity & Citizenship Document (e-KYC)",
        "type": "AADHAAR_IDENTITY",
        "status": "PENDING",
        "total_pages": 1,
        "required_for_stage": ["DISTRICT_COLLECTOR"],
        "uploaded_date": "10 Sep 2026",
        "uploaded_by": "Demo Landowner",
        "version": 1,
        "pages": [
            {
                "pageNumber": 1,
                "title": "Fictional Government e-KYC Identity Verification",
                "contentHeading": "DEMO DOCUMENT — FOR SIH PROTOTYPE (FICTIONAL)",
                "idNumber": "DEMO-ID-9928-XXXX-001",
                "landowner": "Demo Landowner",
                "dob": "12/08/1976",
                "address": "House No. 42, Demo Village, Demo Taluka, Demo District, Demo State - 411057"
            }
        ]
    }
]

def seed_verification_cases_if_empty(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM verification_cases;")
    count = cursor.fetchone()["count"]
    if count > 0:
        return

    district_data = {
        "khasraNumbers": ["124/2"],
        "village": "Demo Village",
        "taluka": "Demo Taluka",
        "district": "Demo District",
        "state": "Demo State",
        "areaHectares": 2.40,
        "landType": "Dry Agricultural (Jirayat)",
        "boundaryCoordinates": "18.5912° N, 73.7385° E to 18.5925° N, 73.7440° E",
        "gisParcelId": "P-001",
        "primaryOwner": "Demo Landowner",
        "ownershipPercentage": 100.0,
        "coOwners": [],
        "aadhaarPanLinked": True,
        "encumbranceCertificateNo": "EC-DEMO-2026-88319",
        "fieldInspector": "Shri S. K. Kulkarni (Revenue Inspector)",
        "inspectionDate": "08 Sep 2026",
        "fieldVerificationStatus": "COMPLETED",
        "inspectionNotes": "Physical field inspection completed. Parcel boundaries match DGPS survey for Survey 124/2. Ground verification shows no unauthorized permanent masonry structures.",
        "boundaryGeoFenceMatches": True,
        "sitePhotosCount": 6,
        "checklist": INITIAL_DISTRICT_CHECKLIST
    }

    state_data = {
        "districtApprovalDate": "",
        "districtApprovedBy": "",
        "districtCollectorRemarks": "",
        "projectPurpose": "Strategic National Expressway Capacity Expansion (Phase III 8-lane widening)",
        "projectCategory": "National Highways & Linear Infrastructure",
        "projectAgency": "National Highways Authority of India (NHAI)",
        "projectRequirement": "Acquisition of 14.50 Ha linear buffer for service roads & intelligent traffic management center.",
        "stateGazetteNotificationRef": "MAH-GAZ-REV-2026-1944 (Section 11(1) RFCTLARR)",
        "rfctlarrSection11Date": "15 Jan 2026",
        "section19DeclarationDate": "28 Jul 2026",
        "publicHearingsCompleted": True,
        "siaAppraisalApproved": True,
        "landValuationRatePerAcre": 4800000,
        "basicMarketValueCr": 17.20,
        "solatiumPercentage": 100,
        "solatiumAmountCr": 17.20,
        "additionalInterestCr": 4.12,
        "totalAwardPackageCr": 38.52,
        "affectedFamiliesCount": 412,
        "displacedFamiliesCount": 48,
        "rehabilitationColonyLocation": "Mouza Maan Sector-4 Integrated R&R Layout",
        "subsistenceGrantPerFamily": 360000,
        "resettlementPlanStatus": "APPROVED",
        "checklist": INITIAL_STATE_CHECKLIST
    }

    central_data = {
        "districtApprovedBy": "",
        "districtApprovalDate": "",
        "stateApprovedBy": "",
        "stateApprovalDate": "",
        "strategicImportance": "Primary Golden Quadrilateral High-Density Freight Link (Corridor C-08)",
        "gatiShaktiAlignment": True,
        "implementingMinistry": "Ministry of Road Transport and Highways (MoRTH)",
        "cabinetSanctionRef": "CCEA-SANCTION-2025-NOV-092",
        "moefccForestClearanceStage2": "CLEARED",
        "environmentalClearanceRef": "EC-MOEFCC-IA-III-2025-78321",
        "defenseOrRailwayClearance": "CLEARED",
        "totalCorridorLengthKm": 94.5,
        "affectedDistrictsCount": 3,
        "totalTreasuryBudgetCrores": 2450.0,
        "disbursedBudgetCrores": 620.0,
        "supremeCourtHighCourtLitigation": "CLEARED_NO_STAY",
        "vigilanceAuditClearance": "CLEARED",
        "checklist": INITIAL_CENTRAL_CHECKLIST
    }

    stages_json = {
        "DISTRICT_COLLECTOR": {"status": "ACTIVE", "remarks": "Assigned to District Collector for local verification."},
        "STATE_GOVERNMENT": {"status": "LOCKED", "remarks": "Locked until District Collector verification is approved."},
        "CENTRAL_MINISTRY": {"status": "LOCKED", "remarks": "Locked until State Government verification is approved."}
    }

    cursor.execute("""
    INSERT INTO verification_cases (
        id, project_id, project_name, agency, state, district, total_parcels,
        affected_families, submitted_date, current_stage, workflow_status, overall_status,
        stages_json, district_data, state_data, central_data
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """, (
        "LA-2026-001",
        "prj-mpe-01",
        "Mumbai–Pune Expressway Expansion Project (Phase III)",
        "National Highways Authority of India (NHAI)",
        "Maharashtra",
        "Pune District",
        124,
        412,
        "10 Sep 2026",
        "DISTRICT_COLLECTOR",
        "DISTRICT_DOCUMENT_VERIFICATION_PENDING",
        "IN_PROGRESS",
        json.dumps(stages_json),
        json.dumps(district_data),
        json.dumps(state_data),
        json.dumps(central_data)
    ))

    # Insert initial documents
    for doc in INITIAL_DOCUMENTS:
        cursor.execute("""
        INSERT INTO verification_documents (
            id, case_id, doc_number, title, type, status, total_pages, pages_json,
            uploaded_date, uploaded_by, version, required_for_stage
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            doc["id"],
            "LA-2026-001",
            doc["doc_number"],
            doc["title"],
            doc["type"],
            doc["status"],
            doc["total_pages"],
            json.dumps(doc["pages"]),
            doc["uploaded_date"],
            doc["uploaded_by"],
            doc["version"],
            json.dumps(doc["required_for_stage"])
        ))

    # Insert initial audit log
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p")
    cursor.execute("""
    INSERT INTO verification_audit_logs (
        case_id, timestamp, authority_level, authority_title, officer_name, officer_id,
        action, remarks
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
    """, (
        "LA-2026-001",
        now,
        "DISTRICT_COLLECTOR",
        "District Collector (Pune District)",
        "Dr. Rajesh Sharma, IAS",
        "GOV-IAS-2024-8842",
        "CASE_CREATED",
        "Case LA-2026-001 submitted by landowner/agency and initialized in District Collector Queue."
    ))

    conn.commit()

# ----------------- Service Functions -----------------

def get_verification_case(case_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM verification_cases WHERE id = %s;", (case_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return None

    case = dict(row)
    # Parse json columns if strings
    for k in ["stages_json", "district_data", "state_data", "central_data", "active_rejection"]:
        if isinstance(case.get(k), str):
            case[k] = json.loads(case[k])
        elif case.get(k) is None and k == "active_rejection":
            case[k] = None

    case["stages"] = case.pop("stages_json", {})
    case["currentStage"] = case["current_stage"]
    case["workflowStatus"] = case["workflow_status"]
    case["overallStatus"] = case["overall_status"]
    case["districtData"] = case.pop("district_data", {})
    case["stateData"] = case.pop("state_data", {})
    case["centralData"] = case.pop("central_data", {})
    case["activeRejection"] = case.pop("active_rejection", None)
    case["projectName"] = case.pop("project_name")
    case["totalParcels"] = case.pop("total_parcels")
    case["affectedFamilies"] = case.pop("affected_families")
    case["submittedDate"] = case.pop("submitted_date")
    case["lastUpdated"] = case.get("updated_at").strftime("%d %b %Y, %I:%M %p") if case.get("updated_at") else ""

    # Fetch documents
    cur.execute("SELECT * FROM verification_documents WHERE case_id = %s ORDER BY doc_number ASC;", (case_id,))
    docs = []
    for d in cur.fetchall():
        d_dict = dict(d)
        if isinstance(d_dict.get("pages_json"), str):
            d_dict["pages"] = json.loads(d_dict["pages_json"])
        else:
            d_dict["pages"] = d_dict.get("pages_json") or []
        if isinstance(d_dict.get("required_for_stage"), str):
            d_dict["requiredForStage"] = json.loads(d_dict["required_for_stage"])
        else:
            d_dict["requiredForStage"] = d_dict.get("required_for_stage") or []
        d_dict["docNumber"] = d_dict.pop("doc_number")
        d_dict["totalPages"] = d_dict.pop("total_pages")
        d_dict["uploadedDate"] = d_dict.pop("uploaded_date")
        d_dict["uploadedBy"] = d_dict.pop("uploaded_by", "")
        d_dict["verifiedAt"] = d_dict.pop("verified_at", None)
        d_dict["verifiedBy"] = d_dict.pop("verified_by", None)
        d_dict["rejectedAt"] = d_dict.pop("rejected_at", None)
        d_dict["rejectedBy"] = d_dict.pop("rejected_by", None)
        d_dict["rejectionCategory"] = d_dict.pop("rejection_category", None)
        d_dict["rejectionReason"] = d_dict.pop("rejection_reason", None)
        d_dict["rejectionRemarks"] = d_dict.pop("rejection_remarks", None)
        d_dict["requiredCorrection"] = d_dict.pop("required_correction", None)
        if isinstance(d_dict.get("history_json"), str):
            d_dict["history"] = json.loads(d_dict["history_json"])
        else:
            d_dict["history"] = d_dict.get("history_json") or []
        docs.append(d_dict)
    case["documents"] = docs

    # Fetch audit logs
    cur.execute("SELECT * FROM verification_audit_logs WHERE case_id = %s ORDER BY created_at ASC;", (case_id,))
    logs = []
    for l in cur.fetchall():
        l_dict = dict(l)
        l_dict["authorityLevel"] = l_dict.pop("authority_level")
        l_dict["authorityTitle"] = l_dict.pop("authority_title")
        l_dict["officerName"] = l_dict.pop("officer_name")
        l_dict["officerId"] = l_dict.pop("officer_id")
        l_dict["documentTitle"] = l_dict.pop("document_title", None)
        logs.append(l_dict)
    case["auditLogs"] = logs

    conn.close()
    return case

def log_audit(cur, case_id: str, authority_level: str, authority_title: str, officer_name: str, officer_id: str, action: str, remarks: str, doc_id: Optional[str] = None, doc_title: Optional[str] = None, check_id: Optional[str] = None, prev_status: Optional[str] = None, new_status: Optional[str] = None, reason: Optional[str] = None):
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p")
    cur.execute("""
    INSERT INTO verification_audit_logs (
        case_id, timestamp, authority_level, authority_title, officer_name, officer_id,
        action, document_id, document_title, check_id, previous_status, new_status, reason, remarks
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """, (
        case_id, now, authority_level, authority_title, officer_name, officer_id,
        action, doc_id, doc_title, check_id, prev_status, new_status, reason, remarks
    ))

def verify_district_document(case_id: str, doc_id: str, officer_name: str, officer_id: str) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p")
    
    cur.execute("SELECT * FROM verification_documents WHERE id = %s AND case_id = %s;", (doc_id, case_id))
    doc = cur.fetchone()
    if not doc:
        conn.close()
        raise ValueError("Document not found")
    
    prev_status = doc["status"]
    cur.execute("""
    UPDATE verification_documents
    SET status = 'VERIFIED', verified_at = %s, verified_by = %s,
        rejection_category = NULL, rejection_reason = NULL, rejection_remarks = NULL, required_correction = NULL,
        updated_at = NOW()
    WHERE id = %s;
    """, (now, officer_name, doc_id))

    # Update workflow status to in review if pending
    cur.execute("""
    UPDATE verification_cases
    SET workflow_status = 'DISTRICT_DOCUMENT_VERIFICATION_IN_REVIEW', updated_at = NOW()
    WHERE id = %s AND workflow_status = 'DISTRICT_DOCUMENT_VERIFICATION_PENDING';
    """, (case_id,))

    log_audit(
        cur, case_id, "DISTRICT_COLLECTOR", "District Collector (Pune District)",
        officer_name, officer_id, "VERIFIED",
        f"Document {doc['title']} certified as legally valid.",
        doc_id=doc_id, doc_title=doc["title"], prev_status=prev_status, new_status="VERIFIED"
    )
    conn.commit()
    conn.close()
    return get_verification_case(case_id)

def reject_district_document(case_id: str, doc_id: str, category: str, reason: str, remarks: str, required_correction: str, officer_name: str, officer_id: str) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p")

    cur.execute("SELECT * FROM verification_documents WHERE id = %s AND case_id = %s;", (doc_id, case_id))
    doc = cur.fetchone()
    if not doc:
        conn.close()
        raise ValueError("Document not found")

    prev_status = doc["status"]
    cur.execute("""
    UPDATE verification_documents
    SET status = 'REJECTED', rejected_at = %s, rejected_by = %s,
        rejection_category = %s, rejection_reason = %s, rejection_remarks = %s, required_correction = %s,
        updated_at = NOW()
    WHERE id = %s;
    """, (now, officer_name, category, reason, remarks, required_correction, doc_id))

    # Set case to rejected and keep state locked
    active_rejection = {
        "caseId": case_id,
        "documentId": doc_id,
        "documentName": doc["title"],
        "stage": "DISTRICT_COLLECTOR",
        "authorityLevel": "DISTRICT_COLLECTOR",
        "officerName": officer_name,
        "officerId": officer_id,
        "timestamp": now,
        "issueCategory": category,
        "rejectionReason": reason,
        "remarks": remarks,
        "requiredCorrection": required_correction
    }

    cur.execute("SELECT stages_json FROM verification_cases WHERE id = %s;", (case_id,))
    stages = cur.fetchone()["stages_json"]
    if isinstance(stages, str):
        stages = json.loads(stages)
    stages["DISTRICT_COLLECTOR"]["status"] = "REJECTED"
    stages["STATE_GOVERNMENT"]["status"] = "LOCKED"
    stages["CENTRAL_MINISTRY"]["status"] = "LOCKED"

    cur.execute("""
    UPDATE verification_cases
    SET workflow_status = 'DISTRICT_DOCUMENT_VERIFICATION_REJECTED',
        overall_status = 'REJECTED',
        stages_json = %s,
        active_rejection = %s,
        updated_at = NOW()
    WHERE id = %s;
    """, (json.dumps(stages), json.dumps(active_rejection), case_id))

    # Insert Landowner Notification
    cur.execute("""
    INSERT INTO landowner_notifications (
        case_id, recipient, document_id, document_name, authority, rejection_reason, officer_remarks, required_correction
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
    """, (
        case_id, "landowner@test.com", doc_id, doc["title"], "District Collector",
        reason, remarks, required_correction
    ))

    log_audit(
        cur, case_id, "DISTRICT_COLLECTOR", "District Collector (Pune District)",
        officer_name, officer_id, "REJECTED",
        f"Document {doc['title']} rejected. Category: {category}. Reason: {reason}. Action required: {required_correction}",
        doc_id=doc_id, doc_title=doc["title"], prev_status=prev_status, new_status="REJECTED", reason=reason
    )

    conn.commit()
    conn.close()

    # Dispatch external notification via viaSocket webhook
    send_viasocket_document_event(
        "document.rejected",
        active_rejection
    )

    return get_verification_case(case_id)

def toggle_district_check(case_id: str, check_id: str, officer_name: str, verified: bool) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT district_data FROM verification_cases WHERE id = %s;", (case_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError("Case not found")

    d_data = row["district_data"]
    if isinstance(d_data, str):
        d_data = json.loads(d_data)

    item_label = ""
    for item in d_data.get("checklist", []):
        if item["id"] == check_id:
            item["verified"] = verified
            item["verifiedBy"] = officer_name if verified else None
            item["verifiedAt"] = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p") if verified else None
            item_label = item["label"]
            break

    cur.execute("""
    UPDATE verification_cases
    SET district_data = %s, updated_at = NOW()
    WHERE id = %s;
    """, (json.dumps(d_data), case_id))

    log_audit(
        cur, case_id, "DISTRICT_COLLECTOR", "District Collector (Pune District)",
        officer_name, "GOV-IAS-2024-8842", "CHECK_TOGGLED",
        f"Check '{item_label}' marked as {'VERIFIED' if verified else 'PENDING'}",
        check_id=check_id, new_status="VERIFIED" if verified else "PENDING"
    )
    conn.commit()
    conn.close()
    return get_verification_case(case_id)

def approve_district_stage(case_id: str, officer_name: str, officer_id: str, remarks: str) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM verification_cases WHERE id = %s;", (case_id,))
    case_row = cur.fetchone()
    if not case_row:
        conn.close()
        raise ValueError("Case not found")

    # GATING RULE 1: All documents required for District must be VERIFIED
    cur.execute("SELECT id, title, status FROM verification_documents WHERE case_id = %s;", (case_id,))
    docs = cur.fetchall()
    unverified_docs = [d["title"] for d in docs if d["status"] != "VERIFIED"]
    if unverified_docs:
        conn.close()
        raise ValueError(f"District verification cannot be approved: {len(unverified_docs)} document(s) are not verified ({', '.join(unverified_docs)}).")

    # GATING RULE 2: All mandatory district checklist items must be verified
    d_data = case_row["district_data"]
    if isinstance(d_data, str):
        d_data = json.loads(d_data)
    unverified_checks = [c["label"] for c in d_data.get("checklist", []) if c.get("mandatory") and not c.get("verified")]
    if unverified_checks:
        conn.close()
        raise ValueError(f"District verification cannot be approved: {len(unverified_checks)} checklist item(s) are not verified ({', '.join(unverified_checks)}).")

    # Advance stage to STATE_GOVERNMENT UNLOCKED
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p")
    stages = case_row["stages_json"]
    if isinstance(stages, str):
        stages = json.loads(stages)
    stages["DISTRICT_COLLECTOR"] = {
        "status": "COMPLETED",
        "verifiedBy": officer_name,
        "verifiedAt": now,
        "remarks": remarks
    }
    stages["STATE_GOVERNMENT"] = {
        "status": "ACTIVE",
        "remarks": "Unlocked by District Collector approval."
    }
    stages["CENTRAL_MINISTRY"] = {
        "status": "LOCKED",
        "remarks": "Locked until State Government approval."
    }

    # Pass district approval details to stateData
    s_data = case_row["state_data"]
    if isinstance(s_data, str):
        s_data = json.loads(s_data)
    s_data["districtApprovedBy"] = officer_name
    s_data["districtApprovalDate"] = now
    s_data["districtCollectorRemarks"] = remarks

    cur.execute("""
    UPDATE verification_cases
    SET workflow_status = 'DISTRICT_DOCUMENT_VERIFICATION_APPROVED',
        current_stage = 'STATE_GOVERNMENT',
        overall_status = 'IN_PROGRESS',
        stages_json = %s,
        state_data = %s,
        active_rejection = NULL,
        updated_at = NOW()
    WHERE id = %s;
    """, (json.dumps(stages), json.dumps(s_data), case_id))

    log_audit(
        cur, case_id, "DISTRICT_COLLECTOR", "District Collector (Pune District)",
        officer_name, officer_id, "STAGE_ADVANCED",
        f"District Collector certified all land records. Case forwarded to State Government. Remarks: {remarks}"
    )
    conn.commit()
    conn.close()
    return get_verification_case(case_id)

def toggle_state_check(case_id: str, check_id: str, officer_name: str, verified: bool) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT stages_json, state_data FROM verification_cases WHERE id = %s;", (case_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError("Case not found")

    stages = row["stages_json"]
    if isinstance(stages, str):
        stages = json.loads(stages)

    # BACKEND GATING ENFORCEMENT: District must be COMPLETED
    if stages.get("DISTRICT_COLLECTOR", {}).get("status") != "COMPLETED":
        conn.close()
        raise PermissionError("Workflow Error: State Government verification is LOCKED. District Collector verification must be approved first.")

    s_data = row["state_data"]
    if isinstance(s_data, str):
        s_data = json.loads(s_data)

    item_label = ""
    for item in s_data.get("checklist", []):
        if item["id"] == check_id:
            item["verified"] = verified
            item["verifiedBy"] = officer_name if verified else None
            item["verifiedAt"] = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p") if verified else None
            item_label = item["label"]
            break

    cur.execute("""
    UPDATE verification_cases
    SET state_data = %s,
        workflow_status = 'STATE_DOCUMENT_VERIFICATION_IN_REVIEW',
        updated_at = NOW()
    WHERE id = %s;
    """, (json.dumps(s_data), case_id))

    log_audit(
        cur, case_id, "STATE_GOVERNMENT", "Principal Secretary (State Revenue)",
        officer_name, "GOV-MH-SEC-1092", "CHECK_TOGGLED",
        f"State check '{item_label}' marked as {'VERIFIED' if verified else 'PENDING'}",
        check_id=check_id, new_status="VERIFIED" if verified else "PENDING"
    )
    conn.commit()
    conn.close()
    return get_verification_case(case_id)

def reject_state_stage(case_id: str, category: str, reason: str, remarks: str, required_correction: str, officer_name: str, officer_id: str) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT stages_json FROM verification_cases WHERE id = %s;", (case_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError("Case not found")

    stages = row["stages_json"]
    if isinstance(stages, str):
        stages = json.loads(stages)

    # BACKEND GATING: District must be completed
    if stages.get("DISTRICT_COLLECTOR", {}).get("status") != "COMPLETED":
        conn.close()
        raise PermissionError("Workflow Error: State Government verification is LOCKED.")

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p")
    stages["STATE_GOVERNMENT"]["status"] = "REJECTED"
    stages["CENTRAL_MINISTRY"]["status"] = "LOCKED"

    active_rejection = {
        "caseId": case_id,
        "stage": "STATE_GOVERNMENT",
        "authorityLevel": "STATE_GOVERNMENT",
        "officerName": officer_name,
        "officerId": officer_id,
        "timestamp": now,
        "issueCategory": category,
        "rejectionReason": reason,
        "remarks": remarks,
        "requiredCorrection": required_correction
    }

    cur.execute("""
    UPDATE verification_cases
    SET workflow_status = 'STATE_DOCUMENT_VERIFICATION_REJECTED',
        overall_status = 'REJECTED',
        stages_json = %s,
        active_rejection = %s,
        updated_at = NOW()
    WHERE id = %s;
    """, (json.dumps(stages), json.dumps(active_rejection), case_id))

    # Insert Landowner Notification
    cur.execute("""
    INSERT INTO landowner_notifications (
        case_id, recipient, authority, rejection_reason, officer_remarks, required_correction
    ) VALUES (%s, %s, %s, %s, %s, %s);
    """, (
        case_id, "landowner@test.com", "State Government",
        reason, remarks, required_correction
    ))

    log_audit(
        cur, case_id, "STATE_GOVERNMENT", "Principal Secretary (State Revenue)",
        officer_name, officer_id, "REJECTED",
        f"State Government compliance rejected. Category: {category}. Reason: {reason}. Action: {required_correction}",
        reason=reason
    )
    conn.commit()
    conn.close()

    send_viasocket_notification(
        recipient="landowner@test.com",
        otp="N/A",
        purpose="STATE_COMPLIANCE_REJECTED",
        user_name=f"Balwant Singh (State Government Rejection: {reason})"
    )

    return get_verification_case(case_id)

def approve_state_stage(case_id: str, officer_name: str, officer_id: str, remarks: str) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM verification_cases WHERE id = %s;", (case_id,))
    case_row = cur.fetchone()
    if not case_row:
        conn.close()
        raise ValueError("Case not found")

    stages = case_row["stages_json"]
    if isinstance(stages, str):
        stages = json.loads(stages)

    # BACKEND GATING: District must be completed
    if stages.get("DISTRICT_COLLECTOR", {}).get("status") != "COMPLETED":
        conn.close()
        raise PermissionError("Workflow Error: State Government verification is LOCKED. District Collector verification must be approved first.")

    s_data = case_row["state_data"]
    if isinstance(s_data, str):
        s_data = json.loads(s_data)
    unverified_checks = [c["label"] for c in s_data.get("checklist", []) if c.get("mandatory") and not c.get("verified")]
    if unverified_checks:
        conn.close()
        raise ValueError(f"State verification cannot be approved: {len(unverified_checks)} item(s) not verified ({', '.join(unverified_checks)}).")

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p")
    stages["STATE_GOVERNMENT"] = {
        "status": "COMPLETED",
        "verifiedBy": officer_name,
        "verifiedAt": now,
        "remarks": remarks
    }
    stages["CENTRAL_MINISTRY"] = {
        "status": "ACTIVE",
        "remarks": "Unlocked by State Government approval."
    }

    # Pass state approval details to centralData
    c_data = case_row["central_data"]
    if isinstance(c_data, str):
        c_data = json.loads(c_data)
    c_data["stateApprovedBy"] = officer_name
    c_data["stateApprovalDate"] = now
    c_data["districtApprovedBy"] = s_data.get("districtApprovedBy", "Dr. Rajesh Sharma, IAS")
    c_data["districtApprovalDate"] = s_data.get("districtApprovalDate", now)

    cur.execute("""
    UPDATE verification_cases
    SET workflow_status = 'STATE_DOCUMENT_VERIFICATION_APPROVED',
        current_stage = 'CENTRAL_MINISTRY',
        stages_json = %s,
        central_data = %s,
        active_rejection = NULL,
        updated_at = NOW()
    WHERE id = %s;
    """, (json.dumps(stages), json.dumps(c_data), case_id))

    log_audit(
        cur, case_id, "STATE_GOVERNMENT", "Principal Secretary (State Revenue)",
        officer_name, officer_id, "STAGE_ADVANCED",
        f"State Government approved statutory land acquisition and R&R compliance. Forwarded to Central Ministry. Remarks: {remarks}"
    )
    conn.commit()
    conn.close()
    return get_verification_case(case_id)

def toggle_central_check(case_id: str, check_id: str, officer_name: str, verified: bool) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT stages_json, central_data FROM verification_cases WHERE id = %s;", (case_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError("Case not found")

    stages = row["stages_json"]
    if isinstance(stages, str):
        stages = json.loads(stages)

    # BACKEND GATING: State must be completed
    if stages.get("STATE_GOVERNMENT", {}).get("status") != "COMPLETED":
        conn.close()
        raise PermissionError("Workflow Error: Central Ministry verification is LOCKED. State Government verification must be approved first.")

    c_data = row["central_data"]
    if isinstance(c_data, str):
        c_data = json.loads(c_data)

    item_label = ""
    for item in c_data.get("checklist", []):
        if item["id"] == check_id:
            item["verified"] = verified
            item["verifiedBy"] = officer_name if verified else None
            item["verifiedAt"] = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p") if verified else None
            item_label = item["label"]
            break

    cur.execute("""
    UPDATE verification_cases
    SET central_data = %s,
        workflow_status = 'CENTRAL_DOCUMENT_VERIFICATION_IN_REVIEW',
        updated_at = NOW()
    WHERE id = %s;
    """, (json.dumps(c_data), case_id))

    log_audit(
        cur, case_id, "CENTRAL_MINISTRY", "Joint Secretary (Land Resources)",
        officer_name, "GOV-GOI-JS-0047", "CHECK_TOGGLED",
        f"Central check '{item_label}' marked as {'VERIFIED' if verified else 'PENDING'}",
        check_id=check_id, new_status="VERIFIED" if verified else "PENDING"
    )
    conn.commit()
    conn.close()
    return get_verification_case(case_id)

def reject_central_stage(case_id: str, category: str, reason: str, remarks: str, required_correction: str, officer_name: str, officer_id: str) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT stages_json FROM verification_cases WHERE id = %s;", (case_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError("Case not found")

    stages = row["stages_json"]
    if isinstance(stages, str):
        stages = json.loads(stages)

    # BACKEND GATING: State must be completed
    if stages.get("STATE_GOVERNMENT", {}).get("status") != "COMPLETED":
        conn.close()
        raise PermissionError("Workflow Error: Central Ministry verification is LOCKED.")

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p")
    stages["CENTRAL_MINISTRY"]["status"] = "REJECTED"

    active_rejection = {
        "caseId": case_id,
        "stage": "CENTRAL_MINISTRY",
        "authorityLevel": "CENTRAL_MINISTRY",
        "officerName": officer_name,
        "officerId": officer_id,
        "timestamp": now,
        "issueCategory": category,
        "rejectionReason": reason,
        "remarks": remarks,
        "requiredCorrection": required_correction
    }

    cur.execute("""
    UPDATE verification_cases
    SET workflow_status = 'CENTRAL_DOCUMENT_VERIFICATION_REJECTED',
        overall_status = 'REJECTED',
        stages_json = %s,
        active_rejection = %s,
        updated_at = NOW()
    WHERE id = %s;
    """, (json.dumps(stages), json.dumps(active_rejection), case_id))

    cur.execute("""
    INSERT INTO landowner_notifications (
        case_id, recipient, authority, rejection_reason, officer_remarks, required_correction
    ) VALUES (%s, %s, %s, %s, %s, %s);
    """, (
        case_id, "landowner@test.com", "Central Ministry",
        reason, remarks, required_correction
    ))

    log_audit(
        cur, case_id, "CENTRAL_MINISTRY", "Joint Secretary (Land Resources)",
        officer_name, officer_id, "REJECTED",
        f"Central Ministry authorization rejected. Category: {category}. Reason: {reason}. Action: {required_correction}",
        reason=reason
    )
    conn.commit()
    conn.close()
    return get_verification_case(case_id)

def approve_central_stage(case_id: str, officer_name: str, officer_id: str, remarks: str) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM verification_cases WHERE id = %s;", (case_id,))
    case_row = cur.fetchone()
    if not case_row:
        conn.close()
        raise ValueError("Case not found")

    stages = case_row["stages_json"]
    if isinstance(stages, str):
        stages = json.loads(stages)

    # FINAL GATING: District must be COMPLETED AND State must be COMPLETED
    if stages.get("DISTRICT_COLLECTOR", {}).get("status") != "COMPLETED":
        conn.close()
        raise PermissionError("Workflow Error: District Collector verification is not completed.")
    if stages.get("STATE_GOVERNMENT", {}).get("status") != "COMPLETED":
        conn.close()
        raise PermissionError("Workflow Error: State Government verification is not completed.")

    c_data = case_row["central_data"]
    if isinstance(c_data, str):
        c_data = json.loads(c_data)
    unverified_checks = [c["label"] for c in c_data.get("checklist", []) if c.get("mandatory") and not c.get("verified")]
    if unverified_checks:
        conn.close()
        raise ValueError(f"Central verification cannot be approved: {len(unverified_checks)} item(s) not verified ({', '.join(unverified_checks)}).")

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p")
    stages["CENTRAL_MINISTRY"] = {
        "status": "COMPLETED",
        "verifiedBy": officer_name,
        "verifiedAt": now,
        "remarks": remarks
    }

    cur.execute("""
    UPDATE verification_cases
    SET workflow_status = 'FINAL_DOCUMENT_VERIFICATION_COMPLETE',
        overall_status = 'VERIFIED',
        stages_json = %s,
        active_rejection = NULL,
        updated_at = NOW()
    WHERE id = %s;
    """, (json.dumps(stages), case_id))

    log_audit(
        cur, case_id, "CENTRAL_MINISTRY", "Joint Secretary (Land Resources)",
        officer_name, officer_id, "STAGE_ADVANCED",
        f"FINAL DOCUMENT VERIFICATION COMPLETE. Central Ministry granted national authorization and statutory certification. Remarks: {remarks}"
    )
    conn.commit()
    conn.close()
    return get_verification_case(case_id)

def upload_or_resubmit_document(case_id: str, doc_id: Optional[str], document_type: str, title: str, pages: List[Dict[str, Any]], uploaded_by: str) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b %Y, %I:%M %p")

    # Check if this is a resubmission of an existing document
    if doc_id:
        cur.execute("SELECT * FROM verification_documents WHERE id = %s AND case_id = %s;", (doc_id, case_id))
        doc = cur.fetchone()
    else:
        doc = None

    if doc:
        new_version = doc["version"] + 1
        history = doc.get("history_json")
        history_list = json.loads(history) if history and isinstance(history, str) else []
        history_list.append({
            "version": doc["version"],
            "status": doc["status"],
            "uploaded_date": doc["uploaded_date"],
            "uploaded_by": doc["uploaded_by"],
            "rejection_category": doc["rejection_category"],
            "rejection_reason": doc["rejection_reason"],
            "rejection_remarks": doc["rejection_remarks"],
            "required_correction": doc["required_correction"],
            "rejected_at": doc["rejected_at"],
            "rejected_by": doc["rejected_by"],
            "verified_at": doc["verified_at"],
            "verified_by": doc["verified_by"]
        })

        cur.execute("""
        UPDATE verification_documents
        SET pages_json = %s,
            total_pages = %s,
            status = 'PENDING',
            version = %s,
            history_json = %s,
            uploaded_date = %s,
            rejection_category = NULL,
            rejection_reason = NULL,
            rejection_remarks = NULL,
            required_correction = NULL,
            rejected_at = NULL,
            rejected_by = NULL,
            updated_at = NOW()
        WHERE id = %s;
        """, (json.dumps(pages), len(pages), new_version, json.dumps(history_list), now, doc_id))

        # Check if active rejection was for this document, and reset stage back to IN_REVIEW
        cur.execute("SELECT current_stage, stages_json, active_rejection FROM verification_cases WHERE id = %s;", (case_id,))
        case_info = cur.fetchone()
        cur_stage = case_info["current_stage"]
        stages = case_info["stages_json"]
        if isinstance(stages, str):
            stages = json.loads(stages)
        active_rej = case_info["active_rejection"]
        if isinstance(active_rej, str):
            active_rej = json.loads(active_rej)

        if active_rej and active_rej.get("documentId") == doc_id:
            stages[cur_stage]["status"] = "ACTIVE"
            cur.execute("""
            UPDATE verification_cases
            SET workflow_status = 'DISTRICT_DOCUMENT_VERIFICATION_IN_REVIEW',
                overall_status = 'IN_PROGRESS',
                stages_json = %s,
                active_rejection = NULL,
                updated_at = NOW()
            WHERE id = %s;
            """, (json.dumps(stages), case_id))

        log_audit(
            cur, case_id, "LANDOWNER", "Landowner Portal",
            uploaded_by, "LANDOWNER", "DOCUMENT_RESUBMITTED",
            f"Landowner re-uploaded corrected document '{doc['title']}' (v{new_version}). Ready for re-verification.",
            doc_id=doc_id, doc_title=doc["title"], new_status="PENDING"
        )

        send_viasocket_document_event("document.resubmitted", {
            "document_id": doc_id,
            "case_id": case_id,
            "landowner_id": uploaded_by,
            "document_name": doc["title"],
            "version": new_version,
            "timestamp": now
        })
    else:
        # Create new document
        new_doc_id = f"DOC-{int(datetime.datetime.now().timestamp())}"
        cur.execute("SELECT COUNT(*) as c FROM verification_documents WHERE case_id = %s;", (case_id,))
        count = cur.fetchone()["c"] + 1
        doc_num = f"{count:02d}"

        cur.execute("""
        INSERT INTO verification_documents (
            id, case_id, doc_number, title, type, status, total_pages, pages_json,
            uploaded_date, uploaded_by, version, required_for_stage
        ) VALUES (%s, %s, %s, %s, %s, 'PENDING', %s, %s, %s, %s, 1, '["DISTRICT_COLLECTOR"]'::jsonb);
        """, (
            new_doc_id, case_id, doc_num, title or document_type, document_type,
            len(pages), json.dumps(pages), now, uploaded_by
        ))

        log_audit(
            cur, case_id, "LANDOWNER", "Landowner Portal",
            uploaded_by, "LANDOWNER", "DOCUMENT_UPLOADED",
            f"Landowner uploaded new document '{title or document_type}' ({len(pages)} pages).",
            doc_id=new_doc_id, doc_title=title or document_type, new_status="PENDING"
        )

    conn.commit()
    conn.close()
    return get_verification_case(case_id)

def get_landowner_notifications(case_id: str) -> List[Dict[str, Any]]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM landowner_notifications WHERE case_id = %s ORDER BY created_at DESC;", (case_id,))
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def reset_verification_case(case_id: str = "LA-2026-001") -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()

    # Clear audit logs and notifications for this case
    cur.execute("DELETE FROM verification_audit_logs WHERE case_id = %s;", (case_id,))
    cur.execute("DELETE FROM landowner_notifications WHERE case_id = %s;", (case_id,))
    cur.execute("DELETE FROM verification_documents WHERE case_id = %s;", (case_id,))

    # Reset checklist items
    d_checks = [{**c, "verified": False} for c in INITIAL_DISTRICT_CHECKLIST]
    s_checks = [{**c, "verified": False} for c in INITIAL_STATE_CHECKLIST]
    c_checks = [{**c, "verified": False} for c in INITIAL_CENTRAL_CHECKLIST]

    cur.execute("SELECT district_data, state_data, central_data FROM verification_cases WHERE id = %s;", (case_id,))
    row = cur.fetchone()
    if row:
        d_data = {
            "khasraNumbers": ["124/2"],
            "village": "Demo Village",
            "taluka": "Demo Taluka",
            "district": "Demo District",
            "state": "Demo State",
            "areaHectares": 2.40,
            "landType": "Dry Agricultural (Jirayat)",
            "boundaryCoordinates": "18.5912° N, 73.7385° E to 18.5925° N, 73.7440° E",
            "gisParcelId": "P-001",
            "primaryOwner": "Demo Landowner",
            "ownershipPercentage": 100.0,
            "coOwners": [],
            "aadhaarPanLinked": True,
            "encumbranceCertificateNo": "EC-DEMO-2026-88319",
            "fieldInspector": "Shri S. K. Kulkarni (Revenue Inspector)",
            "inspectionDate": "08 Sep 2026",
            "fieldVerificationStatus": "COMPLETED",
            "inspectionNotes": "Physical field inspection completed. Parcel boundaries match DGPS survey for Survey 124/2. Ground verification shows no unauthorized permanent masonry structures.",
            "boundaryGeoFenceMatches": True,
            "sitePhotosCount": 6,
            "checklist": d_checks
        }

        s_data = row["state_data"]
        if isinstance(s_data, str):
            s_data = json.loads(s_data)
        s_data["checklist"] = s_checks
        s_data["districtApprovedBy"] = ""
        s_data["districtApprovalDate"] = ""
        s_data["districtCollectorRemarks"] = ""

        c_data = row["central_data"]
        if isinstance(c_data, str):
            c_data = json.loads(c_data)
        c_data["checklist"] = c_checks
        c_data["districtApprovedBy"] = ""
        c_data["districtApprovalDate"] = ""
        c_data["stateApprovedBy"] = ""
        c_data["stateApprovalDate"] = ""

        stages_json = {
            "DISTRICT_COLLECTOR": {"status": "ACTIVE", "remarks": "Assigned to District Collector for local verification."},
            "STATE_GOVERNMENT": {"status": "LOCKED", "remarks": "Locked until District Collector verification is approved."},
            "CENTRAL_MINISTRY": {"status": "LOCKED", "remarks": "Locked until State Government verification is approved."}
        }

        cur.execute("""
        UPDATE verification_cases
        SET project_id = 'PROJ-DEMO-001',
            project_name = 'National Highway Project',
            district = 'Demo District',
            state = 'Demo State',
            current_stage = 'DISTRICT_COLLECTOR',
            workflow_status = 'DISTRICT_DOCUMENT_VERIFICATION_PENDING',
            overall_status = 'IN_PROGRESS',
            stages_json = %s,
            district_data = %s,
            state_data = %s,
            central_data = %s,
            active_rejection = NULL,
            updated_at = NOW()
        WHERE id = %s;
        """, (json.dumps(stages_json), json.dumps(d_data), json.dumps(s_data), json.dumps(c_data), case_id))

    # Re-insert pristine initial documents
    for doc in INITIAL_DOCUMENTS:
        cur.execute("""
        INSERT INTO verification_documents (
            id, case_id, doc_number, title, type, status, total_pages, pages_json,
            uploaded_date, uploaded_by, version, required_for_stage
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            doc["id"],
            case_id,
            doc["doc_number"],
            doc["title"],
            doc["type"],
            doc["status"],
            doc["total_pages"],
            json.dumps(doc["pages"]),
            doc["uploaded_date"],
            doc["uploaded_by"],
            doc["version"],
            json.dumps(doc["required_for_stage"])
        ))

    log_audit(
        cur, case_id, "DISTRICT_COLLECTOR", "District Collector (Pune District)",
        "Dr. Rajesh Sharma, IAS", "GOV-IAS-2024-8842", "CASE_RESET",
        f"Case {case_id} reset to pristine initial state (District Collector Queue)."
    )

    conn.commit()
    conn.close()
    return get_verification_case(case_id)

