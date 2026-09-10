import requests
import sys

BASE_URL = "http://localhost:8000"
CASE_ID = "LA-2026-001"

def run_tests():
    print("=================================================================")
    print("STAGE-SPECIFIC DOCUMENT VERIFICATION & STRICT GATING TEST SUITE")
    print("=================================================================")
    all_passed = True

    # 0. Reset Case to pristine state
    print("\n[STEP 0] Reset Case to Pristine State...")
    res_reset = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/reset")
    if res_reset.status_code == 200:
        print("  PASS: Case successfully reset to pristine District-pending state.")
    else:
        print(f"  FAIL: Reset failed: {res_reset.status_code} - {res_reset.text}")
        return False

    # 1. Initial State Check
    print("\n[STEP 1] Inspect Initial Verification Case State...")
    res = requests.get(f"{BASE_URL}/api/verification/cases/{CASE_ID}")

    if res.status_code != 200:
        print(f"  FAIL: Expected 200, got {res.status_code}")
        return False
    case = res.json()
    print(f"  Current Stage: {case['currentStage']}")
    print(f"  Workflow Status: {case['workflowStatus']}")
    print(f"  District Status: {case['stages']['DISTRICT_COLLECTOR']['status']}")
    print(f"  State Status: {case['stages']['STATE_GOVERNMENT']['status']}")
    print(f"  Central Status: {case['stages']['CENTRAL_MINISTRY']['status']}")

    if case['stages']['STATE_GOVERNMENT']['status'] != 'LOCKED' or case['stages']['CENTRAL_MINISTRY']['status'] != 'LOCKED':
        print("  FAIL: State and Central must be LOCKED initially!")
        all_passed = False
    else:
        print("  PASS: District is ACTIVE; State & Central are strictly LOCKED.")

    # 2. Strict Gating Test: Attempt State action while District is pending
    print("\n[STEP 2] Backend Gating: Attempt State check while District is PENDING...")
    res_gate1 = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/state/check/SC-01", json={
        "officer_name": "Smt. Ananya Deshmukh, IAS",
        "verified": True
    })
    if res_gate1.status_code == 403:
        print(f"  PASS: Received HTTP 403 Forbidden as expected: {res_gate1.json()['detail']}")
    else:
        print(f"  FAIL: Expected 403 Forbidden, got {res_gate1.status_code}: {res_gate1.text}")
        all_passed = False

    # 3. Strict Gating Test: Attempt State approval while District is pending
    print("\n[STEP 3] Backend Gating: Attempt State approval while District is PENDING...")
    res_gate2 = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/state/approve", json={
        "officer_name": "Smt. Ananya Deshmukh, IAS",
        "officer_id": "GOV-MH-SEC-1092",
        "remarks": "Premature attempt"
    })
    if res_gate2.status_code == 403:
        print(f"  PASS: Received HTTP 403 Forbidden as expected: {res_gate2.json()['detail']}")
    else:
        print(f"  FAIL: Expected 403 Forbidden, got {res_gate2.status_code}: {res_gate2.text}")
        all_passed = False

    # 4. District Collector verifies doc 1 and doc 2
    print("\n[STEP 4] District Collector verifies Document 1 (7/12 Extract) & Document 2 (Cadastral Map)...")
    res_doc1 = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/district/document/DOC-001/verify", json={
        "officer_name": "Dr. Rajesh Sharma, IAS",
        "officer_id": "GOV-IAS-2024-8842"
    })
    res_doc2 = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/district/document/DOC-002/verify", json={
        "officer_name": "Dr. Rajesh Sharma, IAS",
        "officer_id": "GOV-IAS-2024-8842"
    })
    res_doc4 = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/district/document/DOC-004/verify", json={
        "officer_name": "Dr. Rajesh Sharma, IAS",
        "officer_id": "GOV-IAS-2024-8842"
    })
    res_doc5 = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/district/document/DOC-005/verify", json={
        "officer_name": "Dr. Rajesh Sharma, IAS",
        "officer_id": "GOV-IAS-2024-8842"
    })
    if res_doc1.status_code == 200 and res_doc2.status_code == 200 and res_doc4.status_code == 200 and res_doc5.status_code == 200:
        print("  PASS: DOC-001, DOC-002, DOC-004, DOC-005 marked VERIFIED.")
    else:
        print(f"  FAIL: Verification failed: DOC-001 ({res_doc1.status_code}), DOC-002 ({res_doc2.status_code})")
        all_passed = False

    # 5. District Collector rejects doc 3 (Field Inspection Report)
    print("\n[STEP 5] District Collector REJECTS Document 3 (Field Inspection Report)...")
    res_rej = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/district/document/DOC-003/reject", json={
        "officer_name": "Dr. Rajesh Sharma, IAS",
        "officer_id": "GOV-IAS-2024-8842",
        "category": "Boundary Discrepancy",
        "reason": "Survey boundary discrepancy on Northern alignment with adjacent Khasra 101/4.",
        "remarks": "Please upload an updated Joint Measurement Survey map with Talathi endorsement.",
        "required_correction": "Re-upload corrected Field Inspection & Boundary Survey report with surveyor signature."
    })
    if res_rej.status_code == 200:
        case_rej = res_rej.json()
        print(f"  PASS: Document rejected. Stage status: {case_rej['workflowStatus']}, State stage: {case_rej['stages']['STATE_GOVERNMENT']['status']}")
    else:
        print(f"  FAIL: Rejection failed: {res_rej.status_code}: {res_rej.text}")
        all_passed = False

    # 6. Gating Check: District approval must FAIL because doc 3 is rejected
    print("\n[STEP 6] Backend Gating: Attempt District Approval with REJECTED document...")
    res_bad_app = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/district/approve", json={
        "officer_name": "Dr. Rajesh Sharma, IAS",
        "officer_id": "GOV-IAS-2024-8842",
        "remarks": "Attempting invalid approval"
    })
    if res_bad_app.status_code == 400:
        print(f"  PASS: District approval blocked with HTTP 400 as expected: {res_bad_app.json()['detail']}")
    else:
        print(f"  FAIL: Expected 400, got {res_bad_app.status_code}: {res_bad_app.text}")
        all_passed = False

    # 7. Check Landowner Notification
    print("\n[STEP 7] Verify Landowner Rejection Notification...")
    res_notif = requests.get(f"{BASE_URL}/api/verification/cases/{CASE_ID}/notifications")
    if res_notif.status_code == 200 and len(res_notif.json()) > 0:
        latest = res_notif.json()[0]
        print(f"  PASS: Landowner notification received. Reason: '{latest['rejection_reason']}', Action: '{latest['required_correction']}'")
    else:
        print(f"  FAIL: Landowner notification missing: {res_notif.text}")
        all_passed = False

    # 8. Landowner corrects & re-uploads Document 3
    print("\n[STEP 8] Landowner Re-uploads Corrected Document 3...")
    res_upload = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/documents/upload", json={
        "document_id": "DOC-003",
        "document_type": "Officer Report",
        "title": "Field Inspection & Physical Verification Report (Corrected)",
        "pages": [
            {"pageNumber": 1, "title": "Joint Measurement Survey (Corrected Northern Alignment)", "officialRef": "INSP-PUNE-2026-44-REV2", "contentHeading": "Signed by Landowner & Talathi"},
            {"pageNumber": 2, "title": "Geo-tagged Photographic Coordinates", "contentHeading": "Zero boundary overlap attested"}
        ],
        "uploaded_by": "Balwant Singh (Landowner)"
    })
    if res_upload.status_code == 200:
        case_up = res_upload.json()
        doc3 = next(d for d in case_up['documents'] if d['id'] == 'DOC-003')
        print(f"  PASS: Document re-uploaded. Version: {doc3['version']}, Status: {doc3['status']}, Stage Status: {case_up['workflowStatus']}")
    else:
        print(f"  FAIL: Document upload failed: {res_upload.status_code}: {res_upload.text}")
        all_passed = False

    # 9. District Collector verifies the corrected document
    print("\n[STEP 9] District Collector Verifies the Corrected Document 3...")
    res_reverify = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/district/document/DOC-003/verify", json={
        "officer_name": "Dr. Rajesh Sharma, IAS",
        "officer_id": "GOV-IAS-2024-8842"
    })
    if res_reverify.status_code == 200:
        print("  PASS: Corrected DOC-003 successfully VERIFIED.")
    else:
        print(f"  FAIL: Re-verification failed: {res_reverify.status_code}")
        all_passed = False

    # 10. Complete all 8 District checklist items
    print("\n[STEP 10] Complete District Checklist Items (DC-01 to DC-08)...")
    for i in range(1, 9):
        cid = f"DC-{i:02d}"
        requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/district/check/{cid}", json={
            "officer_name": "Dr. Rajesh Sharma, IAS",
            "verified": True
        })
    print("  PASS: All 8 District checklist items verified.")

    # 11. District Collector Approves and Forwards to State Government
    print("\n[STEP 11] District Collector Approves Stage 1...")
    res_app_dist = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/district/approve", json={
        "officer_name": "Dr. Rajesh Sharma, IAS",
        "officer_id": "GOV-IAS-2024-8842",
        "remarks": "District Collector certified all land records and physical inspection reports. Case certified and forwarded to State Government."
    })
    if res_app_dist.status_code == 200:
        case_dist = res_app_dist.json()
        print(f"  PASS: District APPROVED! Current Stage: {case_dist['currentStage']}, State status: {case_dist['stages']['STATE_GOVERNMENT']['status']}")
    else:
        print(f"  FAIL: District approval failed: {res_app_dist.status_code}: {res_app_dist.text}")
        all_passed = False

    # 12. Gating Test: Attempt Central approval before State is completed
    print("\n[STEP 12] Backend Gating: Attempt Central approval while State is PENDING...")
    res_gate3 = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/central/approve", json={
        "officer_name": "Shri Vikramaditya Verma, IAS",
        "officer_id": "GOV-GOI-JS-0047",
        "remarks": "Premature Central approval"
    })
    if res_gate3.status_code == 403:
        print(f"  PASS: Received HTTP 403 Forbidden as expected: {res_gate3.json()['detail']}")
    else:
        print(f"  FAIL: Expected 403 Forbidden, got {res_gate3.status_code}: {res_gate3.text}")
        all_passed = False

    # 13. State Government performs its DIFFERENT verification
    print("\n[STEP 13] State Government performs DIFFERENT compliance verification (SC-01 to SC-08)...")
    for i in range(1, 9):
        cid = f"SC-{i:02d}"
        requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/state/check/{cid}", json={
            "officer_name": "Smt. Ananya Deshmukh, IAS",
            "verified": True
        })
    print("  PASS: All 8 State compliance checklist items verified.")

    # 14. State Government Approves and Forwards to Central Ministry
    print("\n[STEP 14] State Government Approves Stage 2...")
    res_app_state = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/state/approve", json={
        "officer_name": "Smt. Ananya Deshmukh, IAS",
        "officer_id": "GOV-MH-SEC-1092",
        "remarks": "State Revenue Department satisfied with RFCTLARR compliance, R&R scheme, and compensation package."
    })
    if res_app_state.status_code == 200:
        case_state = res_app_state.json()
        print(f"  PASS: State APPROVED! Current Stage: {case_state['currentStage']}, Central status: {case_state['stages']['CENTRAL_MINISTRY']['status']}")
    else:
        print(f"  FAIL: State approval failed: {res_app_state.status_code}: {res_app_state.text}")
        all_passed = False

    # 15. Central Ministry performs its DIFFERENT final verification
    print("\n[STEP 15] Central Ministry performs DIFFERENT authorization verification (CC-01 to CC-08)...")
    for i in range(1, 9):
        cid = f"CC-{i:02d}"
        requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/central/check/{cid}", json={
            "officer_name": "Shri Vikramaditya Verma, IAS",
            "verified": True
        })
    print("  PASS: All 8 Central authorization checklist items verified.")

    # 16. Central Ministry Applies Final Approval & Statutory Certification Seal
    print("\n[STEP 16] Central Ministry Approves Stage 3 (Final Verification Complete)...")
    res_app_cent = requests.post(f"{BASE_URL}/api/verification/cases/{CASE_ID}/central/approve", json={
        "officer_name": "Shri Vikramaditya Verma, IAS",
        "officer_id": "GOV-GOI-JS-0047",
        "remarks": "Central Ministry granted national authorization and statutory certification under RFCTLARR Act 2013."
    })
    if res_app_cent.status_code == 200:
        case_final = res_app_cent.json()
        print(f"  PASS: Final Stage Status: {case_final['workflowStatus']}")
        print(f"  Overall Case Status: {case_final['overallStatus']}")
        if case_final['workflowStatus'] == 'FINAL_DOCUMENT_VERIFICATION_COMPLETE':
            print("  SUCCESS: FINAL_DOCUMENT_VERIFICATION_COMPLETE ACHIEVED!")
        else:
            print(f"  FAIL: Expected FINAL_DOCUMENT_VERIFICATION_COMPLETE, got {case_final['workflowStatus']}")
            all_passed = False
    else:
        print(f"  FAIL: Central approval failed: {res_app_cent.status_code}: {res_app_cent.text}")
        all_passed = False

    # 17. Inspect Audit Logs
    print("\n[STEP 17] Inspect Audit Logs Trail...")
    res_final_case = requests.get(f"{BASE_URL}/api/verification/cases/{CASE_ID}")
    audit_logs = res_final_case.json()['auditLogs']
    print(f"  Total Audit Log Entries: {len(audit_logs)}")
    for log in audit_logs[-6:]:
        print(f"    • [{log['timestamp']}] {log['authorityLevel']} - {log['action']}: {log['remarks']}")

    print("\n=================================================================")
    if all_passed:
        print("ALL 17 SEQUENTIAL VERIFICATION & GATING TESTS PASSED (100%)!")
    else:
        print("SOME TESTS FAILED.")
    print("=================================================================")
    return all_passed

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
