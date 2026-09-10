import type { 
  VerificationCase, GovernmentOfficer, StageRejectionRecord 
} from '../types/governmentVerification';

const API_BASE = '/api/verification';

export async function fetchVerificationCase(caseId: string): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}`);
  if (!res.ok) {
    throw new Error(`Failed to load case ${caseId}: ${res.statusText}`);
  }
  return res.json();
}

export async function verifyDistrictDocument(
  caseId: string, 
  docId: string, 
  officer: GovernmentOfficer
): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/district/document/${docId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officer_name: officer.name,
      officer_id: officer.officerId
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to verify document');
  }
  return res.json();
}

export async function rejectDistrictDocument(
  caseId: string, 
  docId: string, 
  rejection: {
    category: string;
    reason: string;
    remarks: string;
    required_correction: string;
  },
  officer: GovernmentOfficer
): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/district/document/${docId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officer_name: officer.name,
      officer_id: officer.officerId,
      category: rejection.category,
      reason: rejection.reason,
      remarks: rejection.remarks,
      required_correction: rejection.required_correction
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to reject document');
  }
  return res.json();
}

export async function toggleDistrictCheck(
  caseId: string, 
  checkId: string, 
  officer: GovernmentOfficer, 
  verified: boolean
): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/district/check/${checkId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officer_name: officer.name,
      verified
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to toggle check');
  }
  return res.json();
}

export async function approveDistrictStage(
  caseId: string, 
  officer: GovernmentOfficer, 
  remarks: string
): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/district/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officer_name: officer.name,
      officer_id: officer.officerId,
      remarks
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to approve District stage');
  }
  return res.json();
}

export async function toggleStateCheck(
  caseId: string, 
  checkId: string, 
  officer: GovernmentOfficer, 
  verified: boolean
): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/state/check/${checkId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officer_name: officer.name,
      verified
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to toggle State check');
  }
  return res.json();
}

export async function rejectStateStage(
  caseId: string, 
  rejection: StageRejectionRecord
): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/state/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officer_name: rejection.officerName,
      officer_id: rejection.officerId,
      category: rejection.issueCategory,
      reason: rejection.rejectionReason,
      remarks: rejection.remarks,
      required_correction: rejection.requiredCorrection
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to reject State stage');
  }
  return res.json();
}

export async function approveStateStage(
  caseId: string, 
  officer: GovernmentOfficer, 
  remarks: string
): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/state/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officer_name: officer.name,
      officer_id: officer.officerId,
      remarks
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to approve State stage');
  }
  return res.json();
}

export async function toggleCentralCheck(
  caseId: string, 
  checkId: string, 
  officer: GovernmentOfficer, 
  verified: boolean
): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/central/check/${checkId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officer_name: officer.name,
      verified
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to toggle Central check');
  }
  return res.json();
}

export async function rejectCentralStage(
  caseId: string, 
  rejection: StageRejectionRecord
): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/central/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officer_name: rejection.officerName,
      officer_id: rejection.officerId,
      category: rejection.issueCategory,
      reason: rejection.rejectionReason,
      remarks: rejection.remarks,
      required_correction: rejection.requiredCorrection
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to reject Central stage');
  }
  return res.json();
}

export async function approveCentralStage(
  caseId: string, 
  officer: GovernmentOfficer, 
  remarks: string
): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/central/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officer_name: officer.name,
      officer_id: officer.officerId,
      remarks
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to approve Central stage');
  }
  return res.json();
}

export async function uploadOrResubmitDocument(
  caseId: string,
  payload: {
    documentId?: string;
    documentType: string;
    title?: string;
    pages: any[];
    uploadedBy: string;
  }
): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/documents/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: payload.documentId,
      document_type: payload.documentType,
      title: payload.title,
      pages: payload.pages,
      uploaded_by: payload.uploadedBy
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to upload document');
  }
  return res.json();
}

export async function fetchLandownerNotifications(caseId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/notifications`);
  if (!res.ok) return [];
  return res.json();
}

export async function resetVerificationCase(caseId: string = "LA-2026-001"): Promise<VerificationCase> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/reset`, {
    method: 'POST'
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to reset case');
  }
  return res.json();
}

