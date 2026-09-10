// ─── Landowner Document Submission — TypeScript Types ─────────────────────────

export type DocumentType =
  | 'LAND_OWNERSHIP_RECORD'
  | 'SALE_DEED'
  | 'SEVEN_TWELVE_EXTRACT'
  | 'PROPERTY_CARD'
  | 'AADHAAR_IDENTITY'
  | 'LAND_TAX_RECEIPT'
  | 'CADASTRAL_SURVEY_MAP'
  | 'BANK_ACCOUNT_CHEQUE'
  | 'FIELD_INSPECTION_REPORT'
  | 'OTHER_SUPPORTING';

export type DocumentPageSource = 'CAMERA' | 'FILE';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESUBMITTED';

export type VerificationStage = 'SUBMITTED' | 'DISTRICT' | 'STATE' | 'CENTRAL' | 'FINAL';

export interface DocumentPage {
  id: string;
  pageNumber: number;
  source: DocumentPageSource;
  previewUrl: string; // data URL (camera) or object URL (file)
  pageLabel?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface SubmittedDocument {
  id: string;
  documentType: DocumentType;
  documentTypeLabel: string;
  status: DocumentStatus;
  pages: DocumentPage[];
  totalPages: number;
  caseId: string;
  uploadedBy: string;
  submittedAt: string;
  lastUpdated: string;
  verificationStage: VerificationStage;
  rejectionReason?: string;
  rejectionCategory?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

// ─── Document Type Labels (configurable from backend later) ───────────────────
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  LAND_OWNERSHIP_RECORD: 'Land Ownership Record',
  SALE_DEED: 'Sale Deed / Registry',
  SEVEN_TWELVE_EXTRACT: '7/12 Extract',
  PROPERTY_CARD: 'Property Card',
  AADHAAR_IDENTITY: 'Aadhaar / Identity Proof',
  LAND_TAX_RECEIPT: 'Land Tax Receipt',
  CADASTRAL_SURVEY_MAP: 'Cadastral / Survey Map',
  BANK_ACCOUNT_CHEQUE: 'Bank Account / Cancelled Cheque',
  FIELD_INSPECTION_REPORT: 'Field Inspection & Physical Verification Report',
  OTHER_SUPPORTING: 'Other Supporting Document'
};

// ─── Upload Configuration (future: load from backend) ─────────────────────────
export const MAX_FILE_SIZE_MB = 10;
export const ACCEPTED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png'];
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png'
];
