// ─── Landowner Document Mock Data ─────────────────────────────────────────────
import type { SubmittedDocument } from '../types/landownerDocuments';

const STORAGE_KEY = 'bhoomi_landowner_documents';

// Pre-populated mock documents covering all status scenarios
export const DEFAULT_LANDOWNER_DOCUMENTS: SubmittedDocument[] = [
  {
    id: 'DOC-MH-001',
    documentType: 'LAND_OWNERSHIP_RECORD',
    documentTypeLabel: 'Land Ownership Record',
    status: 'VERIFIED',
    pages: [
      {
        id: 'PAGE-001-1',
        pageNumber: 1,
        source: 'FILE',
        previewUrl: '',
        fileName: 'ownership_record.pdf',
        fileSize: 245000,
        fileType: 'application/pdf'
      }
    ],
    totalPages: 1,
    caseId: 'LA-2026-001',
    uploadedBy: 'LANDOWNER-MH-7710',
    submittedAt: '05 Sep 2026, 10:30 AM',
    lastUpdated: '08 Sep 2026, 02:15 PM',
    verificationStage: 'DISTRICT',
    verifiedAt: '08 Sep 2026',
    verifiedBy: 'Dr. Rajesh Sharma, IAS'
  },
  {
    id: 'DOC-MH-002',
    documentType: 'SEVEN_TWELVE_EXTRACT',
    documentTypeLabel: '7/12 Extract',
    status: 'PENDING',
    pages: [
      {
        id: 'PAGE-002-1',
        pageNumber: 1,
        source: 'CAMERA',
        previewUrl: '',
        fileName: 'page_1.jpg',
        fileSize: 180000,
        fileType: 'image/jpeg'
      },
      {
        id: 'PAGE-002-2',
        pageNumber: 2,
        source: 'CAMERA',
        previewUrl: '',
        fileName: 'page_2.jpg',
        fileSize: 192000,
        fileType: 'image/jpeg'
      }
    ],
    totalPages: 2,
    caseId: 'LA-2026-001',
    uploadedBy: 'LANDOWNER-MH-7710',
    submittedAt: '06 Sep 2026, 03:45 PM',
    lastUpdated: '06 Sep 2026, 03:45 PM',
    verificationStage: 'SUBMITTED'
  },
  {
    id: 'DOC-MH-003',
    documentType: 'CADASTRAL_SURVEY_MAP',
    documentTypeLabel: 'Cadastral / Survey Map',
    status: 'REJECTED',
    pages: [
      {
        id: 'PAGE-003-1',
        pageNumber: 1,
        source: 'FILE',
        previewUrl: '',
        fileName: 'survey_map.jpg',
        fileSize: 312000,
        fileType: 'image/jpeg'
      }
    ],
    totalPages: 1,
    caseId: 'LA-2026-001',
    uploadedBy: 'LANDOWNER-MH-7710',
    submittedAt: '04 Sep 2026, 11:00 AM',
    lastUpdated: '07 Sep 2026, 09:00 AM',
    verificationStage: 'DISTRICT',
    rejectionReason:
      'Survey number 204 does not match the submitted Land Ownership Record. Please resubmit the correct survey map for Khasra No. 204, Mouza Maan, Hadbast No. 82.',
    rejectionCategory: 'Survey Number Mismatch'
  }
];

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

export function getStoredLandownerDocuments(): SubmittedDocument[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore parse errors
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LANDOWNER_DOCUMENTS));
  return DEFAULT_LANDOWNER_DOCUMENTS;
}

export function saveLandownerDocuments(docs: SubmittedDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function addLandownerDocument(doc: SubmittedDocument): void {
  const docs = getStoredLandownerDocuments();
  docs.unshift(doc);
  saveLandownerDocuments(docs);
}

export function updateLandownerDocument(updated: SubmittedDocument): void {
  const docs = getStoredLandownerDocuments();
  const idx = docs.findIndex(d => d.id === updated.id);
  if (idx >= 0) {
    docs[idx] = updated;
  } else {
    docs.unshift(updated);
  }
  saveLandownerDocuments(docs);
}

export function resetLandownerDocumentsToDefault(): SubmittedDocument[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LANDOWNER_DOCUMENTS));
  return DEFAULT_LANDOWNER_DOCUMENTS;
}
