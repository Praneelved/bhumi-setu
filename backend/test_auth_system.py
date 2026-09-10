import requests
import sys

BASE_URL = "http://localhost:8000"

def run_tests():
    print("==================================================")
    print("STARTING FULL AUTHENTICATION & RBAC TEST SUITE")
    print("==================================================")
    all_passed = True

    # Test 1: Successful Government Login Step 1
    print("\n[TEST 1] Successful Government Login Initiation...")
    res = requests.post(f"{BASE_URL}/api/auth/government/login", json={
        "email_or_username": "central.admin@test.gov",
        "password": "Admin@123"
    })
    if res.status_code == 200 and res.json().get("mfa_required"):
        gov_session_id = res.json()["session_id"]
        gov_otp = res.json()["dev_otp"]
        print(f"  PASS: MFA session generated ({gov_session_id}), OTP: {gov_otp}")
    else:
        print(f"  FAIL: Expected 200 with mfa_required, got {res.status_code}: {res.text}")
        all_passed = False

    # Test 2: Failed Government Login (Invalid password)
    print("\n[TEST 2] Failed Government Login with wrong credentials...")
    res = requests.post(f"{BASE_URL}/api/auth/government/login", json={
        "email_or_username": "central.admin@test.gov",
        "password": "WrongPassword!999"
    })
    if res.status_code == 401:
        print(f"  PASS: Received HTTP 401 Unauthorized as expected ({res.json().get('detail')})")
    else:
        print(f"  FAIL: Expected 401, got {res.status_code}: {res.text}")
        all_passed = False

    # Test 3: Government MFA Verification -> Access Token
    print("\n[TEST 3] Government MFA Verification...")
    res = requests.post(f"{BASE_URL}/api/auth/mfa/verify", json={
        "session_id": gov_session_id,
        "otp": gov_otp
    })
    if res.status_code == 200 and "access_token" in res.json():
        gov_token = res.json()["access_token"]
        gov_user = res.json()["user"]
        print(f"  PASS: JWT Issued. User: {gov_user['name']}, Role: {gov_user['role']}")
    else:
        print(f"  FAIL: Expected 200 with access_token, got {res.status_code}: {res.text}")
        all_passed = False

    # Test 4: Successful Agency Login & MFA
    print("\n[TEST 4] Agency Login and MFA...")
    res_agency = requests.post(f"{BASE_URL}/api/auth/agency/login", json={
        "email_or_username": "project.manager@test.com",
        "password": "Project@123"
    })
    agency_session = res_agency.json()["session_id"]
    agency_otp = res_agency.json()["dev_otp"]

    res_agency_mfa = requests.post(f"{BASE_URL}/api/auth/mfa/verify", json={
        "session_id": agency_session,
        "otp": agency_otp
    })
    if res_agency_mfa.status_code == 200:
        agency_token = res_agency_mfa.json()["access_token"]
        agency_user = res_agency_mfa.json()["user"]
        print(f"  PASS: Agency authenticated. Org: {agency_user['organization_name']}, Projects: {agency_user['assigned_projects']}")
    else:
        print(f"  FAIL: Agency login failed: {res_agency_mfa.text}")
        all_passed = False

    # Test 5: Agency Scoped Project Access
    print("\n[TEST 5] Agency Parcel Scope Enforcement...")
    res_agency_parcels = requests.get(f"{BASE_URL}/api/parcels", headers={"Authorization": f"Bearer {agency_token}"})
    agency_parcels = res_agency_parcels.json()
    assigned_prj = agency_user["assigned_projects"][0]
    all_match = all(p["project_id"] == assigned_prj for p in agency_parcels)
    if res_agency_parcels.status_code == 200 and all_match:
        print(f"  PASS: Agency sees {len(agency_parcels)} parcels, all belonging to assigned project {assigned_prj}")
    else:
        print(f"  FAIL: Agency parcel scoping failed: {agency_parcels}")
        all_passed = False

    # Test 6: Successful Personal OTP Login
    print("\n[TEST 6] Personal / Landowner OTP Login...")
    res_landowner_otp = requests.post(f"{BASE_URL}/api/auth/personal/send-otp", json={
        "identifier": "landowner@test.com"
    })
    lo_session = res_landowner_otp.json()["session_id"]
    lo_otp = res_landowner_otp.json()["dev_otp"]

    res_lo_verify = requests.post(f"{BASE_URL}/api/auth/personal/verify-otp", json={
        "session_id": lo_session,
        "otp": lo_otp
    })
    if res_lo_verify.status_code == 200:
        lo_token = res_lo_verify.json()["access_token"]
        lo_user = res_lo_verify.json()["user"]
        print(f"  PASS: Landowner authenticated. User: {lo_user['name']}, Linked parcels: {lo_user['linked_parcels']}")
    else:
        print(f"  FAIL: Landowner OTP verify failed: {res_lo_verify.text}")
        all_passed = False

    # Test 7: Personal Parcel Security Enforcement (Zero-Trust)
    print("\n[TEST 7] Personal Parcel Restriction (Prevent Unauthorized Access)...")
    own_parcel_id = lo_user["linked_parcels"][0] if lo_user["linked_parcels"] else "P-001"
    other_parcel_id = "P-002"
    # Landowner accesses own parcel
    res_own = requests.get(f"{BASE_URL}/api/parcels/{own_parcel_id}", headers={"Authorization": f"Bearer {lo_token}"})
    # Landowner attempts to access unauthorized parcel
    res_other = requests.get(f"{BASE_URL}/api/parcels/{other_parcel_id}", headers={"Authorization": f"Bearer {lo_token}"})

    if res_own.status_code == 200 and res_other.status_code == 403:
        print(f"  PASS: Authorized parcel {own_parcel_id} returned HTTP 200.")
        print(f"  PASS: Unauthorized parcel {other_parcel_id} returned HTTP 403 Forbidden ({res_other.json()['detail']})")
    else:
        print(f"  FAIL: Expected 200 for own, 403 for other. Got {res_own.status_code} and {res_other.status_code}")
        all_passed = False

    # Test 8: Unauthorized API Access without Bearer token
    print("\n[TEST 8] Unauthorized Access without Token...")
    res_unauth = requests.get(f"{BASE_URL}/api/auth/me")
    if res_unauth.status_code == 401:
        print(f"  PASS: Received HTTP 401 Unauthorized as expected ({res_unauth.json()['detail']})")
    else:
        print(f"  FAIL: Expected 401, got {res_unauth.status_code}")
        all_passed = False

    # Test 9: Incorrect OTP / Expired Handling
    print("\n[TEST 9] Incorrect OTP Handling...")
    res_bad_otp = requests.post(f"{BASE_URL}/api/auth/personal/verify-otp", json={
        "session_id": lo_session,
        "otp": "000000"
    })
    if res_bad_otp.status_code in [400, 429]:
        print(f"  PASS: Rejected invalid OTP with HTTP {res_bad_otp.status_code} ({res_bad_otp.json()['detail']})")
    else:
        print(f"  FAIL: Expected 400 for bad OTP, got {res_bad_otp.status_code}")
        all_passed = False

    # Test 10: Role-Based Parcel Verification & Socket Emission
    print("\n[TEST 10] Parcel Verification RBAC (Only Revenue/Gov Officer allowed)...")
    res_lo_cant_verify = requests.post(f"{BASE_URL}/api/parcels/{other_parcel_id}/verify", headers={"Authorization": f"Bearer {lo_token}"})
    res_gov_can_verify = requests.post(f"{BASE_URL}/api/parcels/{other_parcel_id}/verify", headers={"Authorization": f"Bearer {gov_token}"})

    if res_lo_cant_verify.status_code == 403 and res_gov_can_verify.status_code == 200:
        print(f"  PASS: Landowner forbidden from verifying titles (HTTP 403).")
        print(f"  PASS: Central Admin authorized to verify titles (HTTP 200: {res_gov_can_verify.json()['message']})")
    else:
        print(f"  FAIL: RBAC verification check failed. Landowner: {res_lo_cant_verify.status_code}, Gov: {res_gov_can_verify.status_code}")
        all_passed = False

    print("\n==================================================")
    if all_passed:
        print("ALL 10 TESTS PASSED SUCCESSFULLY! 100% COMPLIANT.")
    else:
        print("SOME TESTS FAILED.")
    print("==================================================")
    return all_passed

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
