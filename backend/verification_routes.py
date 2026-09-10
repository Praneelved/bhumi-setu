from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, Field

import verification_service as vs
from sockets import sio
from auth import decode_access_token

router = APIRouter(prefix="/api/verification", tags=["Document Verification"])

def get_current_user_role(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
        return payload.get("role")
    except Exception:
        return None

def verify_role_authorization(request: Request, allowed_roles: List[str], tier_name: str):
    role = get_current_user_role(request)
    if role and role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Authorization Error: Role '{role}' is not authorized to access {tier_name} Verification."
        )

# ----------------- Request Models -----------------

class OfficerActionRequest(BaseModel):
    officer_name: str = "Dr. Rajesh Sharma, IAS"
    officer_id: str = "GOV-IAS-2024-8842"

class RejectDocumentRequest(BaseModel):
    officer_name: str
    officer_id: str
    category: str
    reason: str
    remarks: str
    required_correction: str

class ToggleCheckRequest(BaseModel):
    officer_name: str
    verified: bool

class ApproveStageRequest(BaseModel):
    officer_name: str
    officer_id: str
    remarks: str

class DocumentUploadRequest(BaseModel):
    document_id: Optional[str] = None # Present when re-uploading a rejected document
    document_type: str
    title: Optional[str] = None
    pages: List[Dict[str, Any]] = []
    uploaded_by: str = "Balwant Singh (Landowner)"

# ----------------- Endpoints -----------------

@router.get("/cases")
def list_cases():
    case = vs.get_verification_case("LA-2026-001")
    return [case] if case else []

@router.get("/cases/{case_id}")
def get_case_details(case_id: str):
    case = vs.get_verification_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Verification case not found.")
    return case

# 1. District Collector Endpoints
@router.post("/cases/{case_id}/district/document/{doc_id}/verify")
async def verify_district_doc(case_id: str, doc_id: str, req: OfficerActionRequest, request: Request):
    verify_role_authorization(request, ["DISTRICT_OFFICER", "DISTRICT_COLLECTOR", "ACQUISITION_OFFICER"], "District Collector")
    try:
        updated = vs.verify_district_document(case_id, doc_id, req.officer_name, req.officer_id)
        await sio.emit("verification_case_updated", {"caseId": case_id, "stage": "DISTRICT_COLLECTOR", "action": "DOCUMENT_VERIFIED"})
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/cases/{case_id}/district/document/{doc_id}/reject")
async def reject_district_doc(case_id: str, doc_id: str, req: RejectDocumentRequest, request: Request):
    verify_role_authorization(request, ["DISTRICT_OFFICER", "DISTRICT_COLLECTOR", "ACQUISITION_OFFICER"], "District Collector")
    try:
        updated = vs.reject_district_document(
            case_id, doc_id, req.category, req.reason, req.remarks, req.required_correction,
            req.officer_name, req.officer_id
        )
        await sio.emit("verification_case_updated", {"caseId": case_id, "stage": "DISTRICT_COLLECTOR", "action": "DOCUMENT_REJECTED"})
        await sio.emit("landowner_notification", {
            "caseId": case_id,
            "documentId": doc_id,
            "authority": "District Collector",
            "reason": req.reason,
            "remarks": req.remarks,
            "requiredCorrection": req.required_correction
        })
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/cases/{case_id}/district/check/{check_id}")
async def toggle_district_checklist_item(case_id: str, check_id: str, req: ToggleCheckRequest, request: Request):
    verify_role_authorization(request, ["DISTRICT_OFFICER", "DISTRICT_COLLECTOR", "ACQUISITION_OFFICER"], "District Collector")
    try:
        updated = vs.toggle_district_check(case_id, check_id, req.officer_name, req.verified)
        await sio.emit("verification_case_updated", {"caseId": case_id, "stage": "DISTRICT_COLLECTOR", "action": "CHECK_TOGGLED"})
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/cases/{case_id}/district/approve")
async def approve_district(case_id: str, req: ApproveStageRequest, request: Request):
    verify_role_authorization(request, ["DISTRICT_OFFICER", "DISTRICT_COLLECTOR", "ACQUISITION_OFFICER"], "District Collector")
    try:
        updated = vs.approve_district_stage(case_id, req.officer_name, req.officer_id, req.remarks)
        await sio.emit("verification_case_updated", {"caseId": case_id, "stage": "DISTRICT_COLLECTOR", "action": "STAGE_APPROVED"})
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 2. State Government Endpoints (STRICTLY GATED)
@router.post("/cases/{case_id}/state/check/{check_id}")
async def toggle_state_checklist_item(case_id: str, check_id: str, req: ToggleCheckRequest, request: Request):
    verify_role_authorization(request, ["STATE_OFFICER", "STATE_GOVERNMENT"], "State Government")
    try:
        updated = vs.toggle_state_check(case_id, check_id, req.officer_name, req.verified)
        await sio.emit("verification_case_updated", {"caseId": case_id, "stage": "STATE_GOVERNMENT", "action": "CHECK_TOGGLED"})
        return updated
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

@router.post("/cases/{case_id}/state/reject")
async def reject_state(case_id: str, req: RejectDocumentRequest, request: Request):
    verify_role_authorization(request, ["STATE_OFFICER", "STATE_GOVERNMENT"], "State Government")
    try:
        updated = vs.reject_state_stage(
            case_id, req.category, req.reason, req.remarks, req.required_correction,
            req.officer_name, req.officer_id
        )
        await sio.emit("verification_case_updated", {"caseId": case_id, "stage": "STATE_GOVERNMENT", "action": "STAGE_REJECTED"})
        await sio.emit("landowner_notification", {
            "caseId": case_id,
            "authority": "State Government",
            "reason": req.reason,
            "remarks": req.remarks,
            "requiredCorrection": req.required_correction
        })
        return updated
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

@router.post("/cases/{case_id}/state/approve")
async def approve_state(case_id: str, req: ApproveStageRequest, request: Request):
    verify_role_authorization(request, ["STATE_OFFICER", "STATE_GOVERNMENT"], "State Government")
    try:
        updated = vs.approve_state_stage(case_id, req.officer_name, req.officer_id, req.remarks)
        await sio.emit("verification_case_updated", {"caseId": case_id, "stage": "STATE_GOVERNMENT", "action": "STAGE_APPROVED"})
        return updated
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

# 3. Central Ministry Endpoints (STRICTLY GATED)
@router.post("/cases/{case_id}/central/check/{check_id}")
async def toggle_central_checklist_item(case_id: str, check_id: str, req: ToggleCheckRequest, request: Request):
    verify_role_authorization(request, ["CENTRAL_OFFICER", "CENTRAL_ADMIN", "CENTRAL_MINISTRY"], "Central Ministry")
    try:
        updated = vs.toggle_central_check(case_id, check_id, req.officer_name, req.verified)
        await sio.emit("verification_case_updated", {"caseId": case_id, "stage": "CENTRAL_MINISTRY", "action": "CHECK_TOGGLED"})
        return updated
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

@router.post("/cases/{case_id}/central/reject")
async def reject_central(case_id: str, req: RejectDocumentRequest, request: Request):
    verify_role_authorization(request, ["CENTRAL_OFFICER", "CENTRAL_ADMIN", "CENTRAL_MINISTRY"], "Central Ministry")
    try:
        updated = vs.reject_central_stage(
            case_id, req.category, req.reason, req.remarks, req.required_correction,
            req.officer_name, req.officer_id
        )
        await sio.emit("verification_case_updated", {"caseId": case_id, "stage": "CENTRAL_MINISTRY", "action": "STAGE_REJECTED"})
        await sio.emit("landowner_notification", {
            "caseId": case_id,
            "authority": "Central Ministry",
            "reason": req.reason,
            "remarks": req.remarks,
            "requiredCorrection": req.required_correction
        })
        return updated
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

@router.post("/cases/{case_id}/central/approve")
async def approve_central(case_id: str, req: ApproveStageRequest, request: Request):
    verify_role_authorization(request, ["CENTRAL_OFFICER", "CENTRAL_ADMIN", "CENTRAL_MINISTRY"], "Central Ministry")
    try:
        updated = vs.approve_central_stage(case_id, req.officer_name, req.officer_id, req.remarks)
        await sio.emit("verification_case_updated", {"caseId": case_id, "stage": "CENTRAL_MINISTRY", "action": "FINAL_APPROVED"})
        return updated
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

# 4. Landowner Upload & Re-upload
@router.post("/cases/{case_id}/documents/upload")
async def upload_document(case_id: str, req: DocumentUploadRequest):
    try:
        updated = vs.upload_or_resubmit_document(
            case_id, req.document_id, req.document_type, req.title or req.document_type,
            req.pages, req.uploaded_by
        )
        await sio.emit("verification_case_updated", {"caseId": case_id, "stage": "LANDOWNER_PORTAL", "action": "DOCUMENT_UPLOADED"})
        return updated
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

@router.get("/cases/{case_id}/notifications")
def get_notifications(case_id: str):
    return vs.get_landowner_notifications(case_id)

@router.post("/cases/{case_id}/reset")
async def reset_case(case_id: str):
    try:
        updated = vs.reset_verification_case(case_id)
        await sio.emit("verification_case_updated", {"caseId": case_id, "action": "CASE_RESET"})
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

