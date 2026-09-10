// ─── Landowner Document Upload Service ────────────────────────────────────────
// All functions are async with mock delays.
// Future: replace mock implementations with real API calls.
// viaSocket hook is pre-wired for future real-time rejection notifications.

import type { SubmittedDocument, DocumentType, DocumentPage } from '../types/landownerDocuments';
import { DOCUMENT_TYPE_LABELS } from '../types/landownerDocuments';
import {
  addLandownerDocument,
  updateLandownerDocument,
  getStoredLandownerDocuments
} from '../mock/landownerDocumentMockData';
import { getStoredUser } from './api';

// ─── Request Types ────────────────────────────────────────────────────────────

export interface UploadPayload {
  documentType: DocumentType;
  caseId: string;
  uploadedBy: string;
  pages: DocumentPage[];
}

export interface ResubmitPayload {
  documentId: string;
  pages: DocumentPage[];
}

import { uploadOrResubmitDocument } from './verificationApi';

// ─── Future Backend API: POST /api/personal/documents/upload ──────────────────
export async function submitDocument(payload: UploadPayload): Promise<SubmittedDocument> {
  const now = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const doc: SubmittedDocument = {
    id: `DOC-MH-${Date.now()}`,
    documentType: payload.documentType,
    documentTypeLabel: DOCUMENT_TYPE_LABELS[payload.documentType],
    status: 'PENDING',
    pages: payload.pages,
    totalPages: payload.pages.length,
    caseId: payload.caseId,
    uploadedBy: payload.uploadedBy,
    submittedAt: now,
    lastUpdated: now,
    verificationStage: 'SUBMITTED'
  };

  addLandownerDocument(doc);

  try {
    await uploadOrResubmitDocument(payload.caseId || 'LA-2026-001', {
      documentType: payload.documentType,
      title: DOCUMENT_TYPE_LABELS[payload.documentType],
      pages: payload.pages,
      uploadedBy: payload.uploadedBy || 'Balwant Singh (Landowner)'
    });
  } catch (err) {
    console.warn('Backend document upload sync error:', err);
  }

  return doc;
}

// ─── Future Backend API: GET /api/personal/documents ─────────────────────────
export async function getMyDocuments(_caseId: string): Promise<SubmittedDocument[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return getStoredLandownerDocuments();
}

// ─── Future Backend API: POST /api/personal/documents/{id}/resubmit ──────────
export async function resubmitDocument(payload: ResubmitPayload): Promise<SubmittedDocument> {
  const docs = getStoredLandownerDocuments();
  const existing = docs.find(d => d.id === payload.documentId) || docs[0];

  const now = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const updated: SubmittedDocument = {
    ...(existing || {}),
    id: payload.documentId,
    documentType: existing?.documentType || 'FIELD_INSPECTION_REPORT',
    documentTypeLabel: existing?.documentTypeLabel || 'Field Inspection & Physical Verification Report',
    pages: payload.pages,
    totalPages: payload.pages.length,
    status: 'RESUBMITTED',
    verificationStage: 'SUBMITTED',
    rejectionReason: undefined,
    rejectionCategory: undefined,
    lastUpdated: now,
    submittedAt: now
  };

  updateLandownerDocument(updated);

  // Sync to PostgreSQL backend
  try {
    const backendDocId = payload.documentId.includes('DOC-00') ? payload.documentId : 'DOC-003';
    await uploadOrResubmitDocument('LA-2026-001', {
      documentId: backendDocId,
      documentType: existing?.documentType || 'Officer Report',
      title: existing?.documentTypeLabel || 'Field Inspection & Physical Verification Report',
      pages: payload.pages.map((p, idx) => ({
        pageNumber: idx + 1,
        title: p.pageLabel || `Page ${idx + 1}`,
        contentHeading: `Page ${idx + 1} - ${p.pageLabel || 'Document'}`
      })),
      uploadedBy: 'Balwant Singh (Landowner)'
    });
  } catch (err) {
    console.warn('Backend document resubmission sync error:', err);
  }

  return updated;
}


// ─── Session Helpers ──────────────────────────────────────────────────────────
export function getSessionPayloadDefaults(): { caseId: string; uploadedBy: string } {
  const user = getStoredUser();
  return {
    caseId: (user?.assigned_projects?.[0]) || 'LA-2026-001',
    uploadedBy: user?.id || 'LANDOWNER-MH-7710'
  };
}

// ─── Future viaSocket Hook ────────────────────────────────────────────────────
// Channel: personal:doc-rejection:{caseId}
// Fires when a government officer rejects a submitted document.
//
// To activate: replace the stub below with:
//   viaSocket.subscribe(`personal:doc-rejection:${caseId}`, callback);
//
// Example event payload:
// {
//   documentId: 'DOC-MH-003',
//   documentName: 'Cadastral / Survey Map',
//   reason: 'Survey number mismatch...',
//   category: 'Survey Number Mismatch',
//   rejectedBy: 'Dr. Rajesh Sharma, IAS',
//   timestamp: '07 Sep 2026, 09:00 AM'
// }

export type DocRejectionEvent = {
  documentId: string;
  documentName: string;
  reason: string;
  category: string;
  rejectedBy: string;
  timestamp: string;
};

const rejectionListeners: Array<(event: DocRejectionEvent) => void> = [];

export function onDocumentRejectionEvent(
  _caseId: string,
  callback: (event: DocRejectionEvent) => void
): () => void {
  // TODO: viaSocket.subscribe(`personal:doc-rejection:${_caseId}`, callback);
  rejectionListeners.push(callback);
  // Return unsubscribe function
  return () => {
    const idx = rejectionListeners.indexOf(callback);
    if (idx >= 0) rejectionListeners.splice(idx, 1);
    // TODO: viaSocket.unsubscribe(`personal:doc-rejection:${_caseId}`, callback);
  };
}

// Internal: used by government side mock to trigger the landowner notification
export function _mockFireRejectionEvent(event: DocRejectionEvent): void {
  rejectionListeners.forEach(cb => cb(event));
}
