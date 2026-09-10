"""
viaSocket Webhook Integration for BhoomiSetu OTP & Alert Notifications.
Dispatches dynamic payloads to a viaSocket cloud flow that triggers email delivery.
"""
import os
import requests
import urllib3

from dotenv import load_dotenv

load_dotenv()

# Suppress only the InsecureRequestWarning from urllib3 (for verify=False in dev)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VIASOCKET_URL = os.getenv(
    "VIASOCKET_WEBHOOK_URL",
    "https://flow.sokt.io/func/scriyYp5aarB"
)
OVERRIDE_EMAIL = os.getenv("TEST_NOTIFICATION_EMAIL", "").strip()


import threading

def _dispatch_async_post(url: str, payload: dict, label: str):
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
    user_name: str = "Landowner / Citizen"
) -> bool:
    """Dispatches dynamic OTP & alert data through viaSocket webhook asynchronously."""
    target_email = OVERRIDE_EMAIL if OVERRIDE_EMAIL else recipient
    payload = {
        "recipient": target_email,
        "otp": otp,
        "purpose": purpose,
        "user_name": user_name,
        "system": "BhoomiSetu NLAMS"
    }
    _dispatch_async_post(VIASOCKET_URL, payload, f"OTP to {recipient}")
    return True


def send_viasocket_document_event(
    event_type: str,
    payload: dict
) -> bool:
    """
    Dispatches statutory document verification events through viaSocket webhook asynchronously.
    Supported events:
      - document.rejected
      - document.verified
      - document.resubmitted
      - document.verification_completed
    """
    target_email = OVERRIDE_EMAIL if OVERRIDE_EMAIL else payload.get("recipient", "landowner@test.com")
    
    # Format subject based on event type
    if event_type == "document.rejected":
        subject = f"Land Document Rejected — Action Required ({payload.get('document_name', 'Document')})"
    elif event_type == "document.verified":
        subject = f"Land Document Verified ({payload.get('document_name', 'Document')})"
    elif event_type == "document.resubmitted":
        subject = f"Land Document Re-submitted for Verification ({payload.get('document_name', 'Document')})"
    elif event_type == "document.verification_completed":
        subject = f"Final Document Verification Complete — Authorization Issued (Case {payload.get('case_id')})"
    else:
        subject = f"Document Verification Notification — {event_type}"

    full_payload = {
        "event": event_type,
        "subject": subject,
        "recipient": target_email,
        "system": "BhoomiSetu NLAMS",
        "document_id": payload.get("document_id"),
        "case_id": payload.get("case_id"),
        "landowner_id": payload.get("landowner_id", "usr-landowner-demo"),
        "document_name": payload.get("document_name"),
        "rejected_by": payload.get("rejected_by"),
        "authority_level": payload.get("authority_level"),
        "rejection_category": payload.get("rejection_category"),
        "rejection_reason": payload.get("rejection_reason"),
        "remarks": payload.get("remarks"),
        "timestamp": payload.get("timestamp")
    }

    _dispatch_async_post(VIASOCKET_URL, full_payload, f"Event {event_type}")
    return True


