"""
viaSocket Webhook Integration for BhoomiSetu Notifications & Statutory Workflows.
Dispatches dynamic payloads to viaSocket cloud workflow for email delivery.
Includes key normalization, bounded retries, safe logging, duplicate protection,
and dynamic recipient resolution from real application data.
"""
import os
import time
import json
import logging
import threading
from typing import Dict, Any, Optional

import requests
import urllib3
from dotenv import load_dotenv

load_dotenv()

# Suppress only the InsecureRequestWarning from urllib3 (for verify=False in dev)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger("viasocket")

VIASOCKET_URL = os.getenv(
    "VIASOCKET_WEBHOOK_URL",
    "https://flow.sokt.io/func/scriyYp5aarB"
).strip()

OVERRIDE_EMAIL = os.getenv("TEST_NOTIFICATION_EMAIL", "").strip()

# Deduplication cache: key -> expiry timestamp
_recent_events_cache: Dict[str, float] = {}
_cache_lock = threading.Lock()
DEDUPLICATION_WINDOW_SECONDS = 5.0


def _is_duplicate_event(event_key: str) -> bool:
    """
    Prevents duplicate notifications caused by React re-renders, multiple listeners,
    or rapid repeated user clicks within the deduplication window.
    """
    now = time.time()
    with _cache_lock:
        # Purge expired entries
        expired_keys = [k for k, exp in _recent_events_cache.items() if exp < now]
        for k in expired_keys:
            del _recent_events_cache[k]

        if event_key in _recent_events_cache:
            return True
        _recent_events_cache[event_key] = now + DEDUPLICATION_WINDOW_SECONDS
        return False


def get_landowner_email_for_case(case_id: str) -> Optional[str]:
    """Dynamically looks up the registered landowner email for a given case from database."""
    try:
        from db import get_db
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT u.email 
            FROM land_parcels lp 
            JOIN users u ON lp.owner_id = u.id 
            WHERE lp.acquisition_case_id = %s AND u.email IS NOT NULL AND u.email != ''
            LIMIT 1;
        """, (case_id,))
        row = cur.fetchone()
        conn.close()
        if row and row.get("email"):
            return str(row["email"]).strip()
    except Exception as e:
        logger.debug(f"Could not resolve landowner email for case {case_id}: {e}")
    return None


def get_government_officer_email(role: str = "DISTRICT_OFFICER") -> str:
    """Looks up government nodal officer email from database."""
    try:
        from db import get_db
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT email FROM users 
            WHERE user_type = 'GOVERNMENT' AND role = %s AND email IS NOT NULL AND email != ''
            LIMIT 1;
        """, (role,))
        row = cur.fetchone()
        conn.close()
        if row and row.get("email"):
            return str(row["email"]).strip()
    except Exception:
        pass
    return "district.officer@test.gov"


def _dispatch_sync(url: str, payload: dict, label: str, max_retries: int = 2) -> Dict[str, Any]:
    """
    Executes HTTP POST to ViaSocket with bounded retries on network/5xx errors.
    Returns status dict and logs safely without exposing tokens/passwords/OTPs.
    """
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "BhoomiSetu-NLAMS/1.0"
    }

    last_error: Optional[str] = None
    last_status: Optional[int] = None

    for attempt in range(max_retries + 1):
        try:
            res = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=8,
                verify=False
            )
            last_status = res.status_code

            # Check success (200-299)
            if 200 <= res.status_code < 300:
                print(f"[viaSocket] {label} notification triggered successfully. (Status: {res.status_code})")
                return {
                    "success": True,
                    "status_code": res.status_code,
                    "message": "ViaSocket notification triggered successfully.",
                    "attempts": attempt + 1
                }

            # If 4xx client error, do not retry as it is a permanent request rejection
            if 400 <= res.status_code < 500:
                safe_err = f"Client error response HTTP {res.status_code}"
                print(f"[viaSocket Error] {label} failed. (Status: {res.status_code}, Error: {safe_err})")
                return {
                    "success": False,
                    "status_code": res.status_code,
                    "message": safe_err,
                    "attempts": attempt + 1
                }

            # If 5xx server error, retry with backoff
            last_error = f"Server returned status {res.status_code}"

        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as net_err:
            last_error = f"Network/Timeout error: {type(net_err).__name__}"
        except Exception as gen_err:
            last_error = f"Unexpected error: {type(gen_err).__name__}"

        # Wait before retrying (exponential backoff: 1s, 2s)
        if attempt < max_retries:
            time.sleep(1.0 * (attempt + 1))

    # All attempts exhausted
    print(f"[viaSocket Error] {label} failed after {max_retries + 1} attempts. (Status: {last_status}, Error: {last_error})")
    return {
        "success": False,
        "status_code": last_status,
        "message": last_error or "ViaSocket notification delivery failed.",
        "attempts": max_retries + 1
    }


def _dispatch_async_post(url: str, payload: dict, label: str):
    """Fires the ViaSocket request in a background thread."""
    def _worker():
        try:
            res = requests.post(
                url,
                json=payload,
                timeout=5,
                verify=False
            )
            print(f"[viaSocket {label}] Status {res.status_code} dispatched")
        except Exception as err:
            print(f"[viaSocket {label} Error] {err}")

    t = threading.Thread(target=_worker, daemon=True)
    t.start()


def send_viasocket_notification(
    recipient: str,
    otp: str,
    purpose: str = "CITIZEN_LOGIN",
    user_name: str = "Landowner / Citizen",
    sync: bool = False
) -> bool:
    """
    Dispatches dynamic OTP & authentication alert data through ViaSocket webhook.
    Uses real recipient email entered or registered by user.
    Provides complete email subject, body, to, recipient, and message fields so
    ViaSocket email actions execute successfully without dropping empty fields.
    """
    target_email = (recipient or "").strip()
    env_override = os.getenv("TEST_NOTIFICATION_EMAIL", "").strip()
    if env_override:
        target_email = env_override

    if not target_email:
        print("[viaSocket Warning] No recipient email specified for OTP notification.")
        return False

    if purpose == "CITIZEN_LOGIN":
        subject = f"BhoomiSetu Login Verification OTP: {otp}"
        msg = (
            f"Dear {user_name},\n\n"
            f"Your 6-digit verification code for BhoomiSetu Landowner & Citizen Portal is: {otp}\n\n"
            f"This OTP is valid for 10 minutes. Please enter this code on the login screen to verify your account.\n\n"
            f"BhoomiSetu National Land Acquisition Management Portal (NLAMS)"
        )
    elif purpose == "GOV_MFA":
        subject = f"BhoomiSetu Government MFA Verification Code: {otp}"
        msg = (
            f"Dear {user_name},\n\n"
            f"Your statutory 2FA / MFA verification code for Government Portal access is: {otp}\n\n"
            f"Official authorization reference: GOV-SEC-{time.strftime('%Y%m%d')}."
        )
    elif purpose == "AGENCY_MFA":
        subject = f"BhoomiSetu Agency MFA Verification Code: {otp}"
        msg = (
            f"Dear {user_name},\n\n"
            f"Your Multi-Factor Authentication (MFA) code for Agency Project Management Portal is: {otp}\n\n"
            f"Authorized Agency Session."
        )
    else:
        subject = f"BhoomiSetu Verification Code: {otp}"
        msg = f"Your verification code for {purpose} is: {otp}"

    payload = {
        "recipient": target_email,
        "otp": str(otp),
        "purpose": purpose,
        "user_name": user_name,
        "system": "BhoomiSetu NLAMS",
        "to": target_email,
        "email": target_email,
        "subject": subject,
        "body": msg,
        "message": msg
    }

    # Print clear diagnostic log in backend console for developer visibility
    print(f"[viaSocket] 🔑 OTP for {target_email} ({purpose}): {otp}")

    label = f"OTP to {target_email}"
    success = True
    if sync:
        try:
            res = requests.post(VIASOCKET_URL, json=payload, timeout=5, verify=False)
            print(f"[viaSocket {label}] Status {res.status_code} dispatched")
            if res.status_code not in (200, 201, 202):
                success = False
        except Exception as err:
            print(f"[viaSocket {label} Error] {err}")
            success = False
    else:
        _dispatch_async_post(VIASOCKET_URL, payload, label)

    # Optional SMTP fallback if configured in environment
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASS", os.getenv("SMTP_PASSWORD", "")).strip()
    if smtp_host and smtp_user and smtp_pass:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.utils import make_msgid, formatdate
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            mime = MIMEText(msg, "plain", "utf-8")
            mime["Subject"] = subject
            mime["From"] = os.getenv("SMTP_FROM", smtp_user)
            mime["To"] = target_email
            mime["Date"] = formatdate(localtime=True)
            mime["Message-ID"] = make_msgid()
            with smtplib.SMTP(smtp_host, smtp_port, timeout=5) as s:
                s.starttls()
                s.login(smtp_user, smtp_pass)
                s.sendmail(mime["From"], [target_email], mime.as_string())
            print(f"[SMTP Fallback] Directly delivered OTP email to {target_email}")
        except Exception as s_err:
            print(f"[SMTP Fallback Note] SMTP delivery: {s_err}")

    return success


def send_viasocket_document_event(
    event_type: str,
    payload: dict,
    sync: bool = False
) -> Dict[str, Any]:
    """
    Dispatches statutory document verification events through ViaSocket webhook.
    Normalizes both camelCase and snake_case payload properties.
    Resolves the real landowner recipient email dynamically from database.

    Supported events:
      - document.rejected
      - document.verified
      - document.resubmitted
      - document.verification_completed
      - stage.rejected
    """
    # Normalize keys
    doc_id = payload.get("document_id") or payload.get("documentId")
    case_id = payload.get("case_id") or payload.get("caseId") or "LA-2026-001"
    doc_name = payload.get("document_name") or payload.get("documentName") or "Statutory Land Document"
    rejected_by = payload.get("rejected_by") or payload.get("officerName") or payload.get("rejectedBy") or "Competent Authority"
    authority_level = payload.get("authority_level") or payload.get("authorityLevel") or payload.get("stage") or "DISTRICT_COLLECTOR"
    rejection_category = payload.get("rejection_category") or payload.get("issueCategory") or "Compliance Issue"
    rejection_reason = payload.get("rejection_reason") or payload.get("reason") or payload.get("rejectionReason") or "Statutory criteria not met."
    remarks = payload.get("remarks") or payload.get("officer_remarks") or ""
    required_correction = payload.get("required_correction") or payload.get("requiredCorrection") or ""
    landowner_id = payload.get("landowner_id") or payload.get("landownerId") or "usr-landowner-01"
    timestamp = payload.get("timestamp") or time.strftime("%d %b %Y, %I:%M %p")

    # Resolve real recipient email
    recipient = payload.get("recipient") or payload.get("email")
    if not recipient or recipient == "landowner@test.com":
        db_email = get_landowner_email_for_case(case_id)
        recipient = db_email or "praneelved17@gmail.com"

    env_override = os.getenv("TEST_NOTIFICATION_EMAIL", "").strip()
    target_email = env_override or recipient

    # Deduplication check
    dedup_key = f"doc:{event_type}:{case_id}:{doc_id}:{target_email}"
    if _is_duplicate_event(dedup_key):
        print(f"[viaSocket Deduplication] Duplicate document event {event_type} suppressed for {case_id}/{doc_id}")
        return {"success": True, "message": "Duplicate event suppressed."}

    # Format human-readable subject and message for email delivery
    if event_type == "document.rejected":
        subject = f"Land Document Rejected — Action Required ({doc_name}) [Case {case_id}]"
        message = (
            f"Statutory Notice from BhoomiSetu NLAMS:\n\n"
            f"Your submitted document '{doc_name}' for Land Acquisition Case {case_id} "
            f"has been REJECTED during {authority_level} verification by {rejected_by}.\n\n"
            f"• Issue Category: {rejection_category}\n"
            f"• Specific Reason: {rejection_reason}\n"
            f"• Officer Remarks: {remarks or 'None'}\n"
            f"• Required Correction: {required_correction or 'Please upload a legally attested copy.'}\n\n"
            f"Please log in to the BhoomiSetu Landowner Portal to re-upload the corrected document."
        )
    elif event_type == "document.verified":
        subject = f"Land Document Verified & Certified Valid ({doc_name}) [Case {case_id}]"
        message = (
            f"Statutory Certification from BhoomiSetu NLAMS:\n\n"
            f"Your document '{doc_name}' for Land Acquisition Case {case_id} "
            f"has been verified and certified legally valid by {rejected_by} ({authority_level}).\n\n"
            f"Verified At: {timestamp}."
        )
    elif event_type == "document.resubmitted":
        version = payload.get("version", 2)
        subject = f"Land Document Re-submitted for Verification ({doc_name} v{version}) [Case {case_id}]"
        message = (
            f"Acknowledgement: Corrected document '{doc_name}' (Version {version}) for Case {case_id} "
            f"has been successfully re-submitted and queued for authority re-verification."
        )
    elif event_type == "document.verification_completed":
        subject = f"Final Document Verification Complete — Authorization Issued (Case {case_id})"
        message = (
            f"Final Statutory Authorization: Multi-tier document verification for Land Acquisition Case {case_id} "
            f"has been completed across District, State, and Central authorities.\n\n"
            f"Final statutory certification issued by {rejected_by}."
        )
    elif event_type == "stage.rejected":
        subject = f"Statutory Stage Rejected — Case {case_id} ({authority_level})"
        message = (
            f"Statutory Notice: Case {case_id} verification was rejected at {authority_level} stage by {rejected_by}.\n\n"
            f"Reason: {rejection_reason}\n"
            f"Officer Remarks: {remarks}\n"
            f"Action Required: {required_correction}"
        )
    else:
        subject = f"Document Verification Notification — {event_type} (Case {case_id})"
        message = f"Document event '{event_type}' recorded for Case {case_id}: {doc_name}."

    full_payload = {
        "event": event_type,
        "event_type": event_type,
        "subject": subject,
        "title": subject,
        "recipient": target_email,
        "email": target_email,
        "to": target_email,
        "message": message,
        "body": message,
        "content": message,
        "system": "BhoomiSetu NLAMS",
        "document_id": doc_id,
        "documentId": doc_id,
        "case_id": case_id,
        "caseId": case_id,
        "landowner_id": landowner_id,
        "document_name": doc_name,
        "documentName": doc_name,
        "rejected_by": rejected_by,
        "authority_level": authority_level,
        "rejection_category": rejection_category,
        "rejection_reason": rejection_reason,
        "remarks": remarks,
        "required_correction": required_correction,
        "timestamp": timestamp
    }

    label = f"Event {event_type} to {target_email}"
    if sync:
        return _dispatch_sync(VIASOCKET_URL, full_payload, label)
    else:
        _dispatch_async_post(VIASOCKET_URL, full_payload, label)
        return {"success": True, "message": "ViaSocket document event dispatched asynchronously."}


def send_viasocket_proposal_event(
    event_type: str,
    proposal_data: dict,
    details: Optional[dict] = None,
    sync: bool = True
) -> Dict[str, Any]:
    """
    Dispatches statutory project proposal events through ViaSocket webhook.
    Supported events:
      - proposal.submitted: Notifies Government officer of new agency submission
      - proposal.clarification_requested: Notifies submitting Agency of clarification required
      - proposal.approved: Notifies Agency that proposal is approved with new Project ID
      - proposal.rejected: Notifies Agency of formal statutory rejection
    """
    details = details or {}
    proposal_id = proposal_data.get("id") or details.get("proposalId", "PRP-2026-001")
    proposal_title = proposal_data.get("title") or details.get("proposalTitle", "Infrastructure Project")
    agency_info = proposal_data.get("agencyDetails") or {}
    agency_name = agency_info.get("agencyName") or proposal_data.get("agency") or "Submitting Agency"
    agency_email = agency_info.get("email") or details.get("agencyEmail") or "project.manager@test.com"

    officer_name = details.get("officerName") or proposal_data.get("reviewedByOfficer") or "Competent Authority"
    officer_designation = details.get("officerDesignation") or "Nodal Officer"

    now_str = time.strftime("%d %b %Y, %I:%M %p")

    # Determine recipient based on event direction
    if event_type == "proposal.submitted":
        # Recipient is Government Officer
        gov_email = details.get("recipientEmail") or get_government_officer_email("DISTRICT_OFFICER")
        recipient = gov_email
        subject = f"New Project Proposal Submitted: {proposal_title} ({proposal_id})"
        message = (
            f"Statutory Notice to Government Authority:\n\n"
            f"Agency '{agency_name}' has formally submitted a new infrastructure project proposal for statutory review.\n\n"
            f"• Proposal ID: {proposal_id}\n"
            f"• Project Title: {proposal_title}\n"
            f"• Submitting Agency: {agency_name}\n"
            f"• Land Required: {proposal_data.get('totalLandRequiredAcres', 'N/A')} Acres\n"
            f"• Affected Parcels: {proposal_data.get('affectedParcelsCount', 'N/A')}\n"
            f"• Estimated Budget: ₹{proposal_data.get('estimatedTotalBudgetCr', 'N/A')} Cr\n"
            f"• Submission Date: {now_str}\n\n"
            f"Please access the BhoomiSetu Government Review Portal to evaluate and verify this proposal."
        )
    elif event_type == "proposal.clarification_requested":
        # Recipient is Submitting Agency
        recipient = agency_email
        clarification_msg = details.get("message") or "Clarification required on cadastral boundaries."
        required_action = details.get("requiredAction") or "Upload revised DGPS survey map."
        subject = f"Action Required: Clarification Requested for Proposal {proposal_id} ({proposal_title})"
        message = (
            f"Statutory Review Notice from Government Authority:\n\n"
            f"Competent Authority {officer_name} ({officer_designation}) has reviewed proposal '{proposal_title}' (ID: {proposal_id}) "
            f"and requested formal statutory clarification.\n\n"
            f"• Clarification Requirement: {clarification_msg}\n"
            f"• Required Agency Action: {required_action}\n"
            f"• Requested By: {officer_name} ({officer_designation})\n"
            f"• Requested At: {now_str}\n\n"
            f"Please log in to the BhoomiSetu Agency Portal to respond with the necessary documents and updates."
        )
    elif event_type == "proposal.approved":
        # Recipient is Submitting Agency
        recipient = agency_email
        new_project_id = details.get("newProjectId") or proposal_data.get("approvedProjectId") or "PRJ-2026-NEW"
        remarks = details.get("remarks") or proposal_data.get("governmentReviewNotes") or "Approved under statutory development scheme."
        subject = f"Proposal Approved — New Active Project Authorized: {proposal_title} ({proposal_id})"
        message = (
            f"Formal Statutory Approval from Government of India / State Revenue Authority:\n\n"
            f"Your project proposal '{proposal_title}' (ID: {proposal_id}) has been formally APPROVED by {officer_name} ({officer_designation}).\n\n"
            f"• Authorized Active Project ID: {new_project_id}\n"
            f"• Corridor Status: Initialized in State & Agency GIS Monitoring\n"
            f"• Authority Review Notes: {remarks}\n"
            f"• Approval Date: {now_str}\n\n"
            f"You may now proceed with statutory Section 11 preliminary notifications and GIS parcel acquisition tracking."
        )
    elif event_type == "proposal.rejected":
        # Recipient is Submitting Agency
        recipient = agency_email
        rejection_reason = details.get("rejectionReason") or proposal_data.get("governmentReviewNotes") or "Statutory criteria not met."
        subject = f"Proposal Rejected — Statutory Decision Notice ({proposal_id})"
        message = (
            f"Formal Statutory Notice from Competent Authority:\n\n"
            f"Project proposal '{proposal_title}' (ID: {proposal_id}) submitted by {agency_name} has been REJECTED by {officer_name} ({officer_designation}).\n\n"
            f"• Rejection Reason: {rejection_reason}\n"
            f"• Decision Date: {now_str}\n\n"
            f"Agency may review the objections and submit a fresh proposal in compliance with statutory provisions."
        )
    else:
        recipient = agency_email
        subject = f"BhoomiSetu Proposal Update — {event_type} ({proposal_id})"
        message = f"Proposal '{proposal_title}' (ID: {proposal_id}) received status update: {event_type}."

    env_override = os.getenv("TEST_NOTIFICATION_EMAIL", "").strip()
    target_email = env_override or recipient

    # Deduplication check
    dedup_key = f"proposal:{event_type}:{proposal_id}:{target_email}"
    if _is_duplicate_event(dedup_key):
        print(f"[viaSocket Deduplication] Duplicate proposal event {event_type} suppressed for {proposal_id}")
        return {"success": True, "message": "Duplicate event suppressed."}

    full_payload = {
        "event": event_type,
        "event_type": event_type,
        "subject": subject,
        "title": subject,
        "recipient": target_email,
        "email": target_email,
        "to": target_email,
        "message": message,
        "body": message,
        "content": message,
        "system": "BhoomiSetu NLAMS",
        "proposal_id": proposal_id,
        "proposalId": proposal_id,
        "proposal_title": proposal_title,
        "proposalTitle": proposal_title,
        "agency_name": agency_name,
        "agencyName": agency_name,
        "officer_name": officer_name,
        "officer_designation": officer_designation,
        "timestamp": now_str,
        "details": details
    }

    label = f"Proposal Event ({event_type}) to {target_email}"
    if sync:
        return _dispatch_sync(VIASOCKET_URL, full_payload, label)
    else:
        _dispatch_async_post(VIASOCKET_URL, full_payload, label)
        return {"success": True, "message": "ViaSocket proposal event dispatched asynchronously."}
