import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Upload, FileText, Camera, ShieldCheck, AlertCircle } from 'lucide-react';
import type { DocumentType, DocumentPage, SubmittedDocument } from '../types/landownerDocuments';
import { DOCUMENT_TYPE_LABELS, MAX_FILE_SIZE_MB, ACCEPTED_FILE_TYPES } from '../types/landownerDocuments';
import { UploadStepIndicator } from '../components/personal/UploadStepIndicator';
import { DocumentTypeSelector } from '../components/personal/DocumentTypeSelector';
import { DocumentPageManager } from '../components/personal/DocumentPageManager';
import { DocumentReviewPanel } from '../components/personal/DocumentReviewPanel';
import { SubmitConfirmModal } from '../components/personal/SubmitConfirmModal';
import {
  submitDocument,
  resubmitDocument,
  getSessionPayloadDefaults
} from '../services/documentUploadService';

const SLUG_TO_DOC_INFO: Record<string, { type: DocumentType; label: string; description: string }> = {
  'land-ownership': {
    type: 'LAND_OWNERSHIP_RECORD',
    label: 'Land Ownership Record',
    description: 'Title deed, 7/12 extract, Sanad, or mutation register entry (Form 6)'
  },
  'sale-deed': {
    type: 'SALE_DEED',
    label: 'Sale Deed / Title Document',
    description: 'Registered conveyance or purchase deed with Sub-Registrar endorsement'
  },
  'identity-proof': {
    type: 'AADHAAR_IDENTITY',
    label: 'Identity Proof',
    description: 'Aadhaar Card, Voter ID, or government photo identity document'
  },
  'survey-map': {
    type: 'CADASTRAL_SURVEY_MAP',
    label: 'Land Parcel / Survey Map',
    description: 'Cadastral map sheet, DGPS survey coordinates, or boundary demarcation map'
  },
  'encumbrance-certificate': {
    type: 'ENCUMBRANCE_CERTIFICATE',
    label: 'Encumbrance Certificate',
    description: 'Form 15/16 non-encumbrance certificate from Sub-Registrar office'
  },
  'bank-account': {
    type: 'BANK_ACCOUNT_CHEQUE',
    label: 'Bank Account / Beneficiary Details',
    description: 'Cancelled cheque leaf or bank passbook copy for compensation Direct Benefit Transfer (DBT)'
  },
  '712-extract': {
    type: 'SEVEN_TWELVE_EXTRACT',
    label: '7/12 Extract',
    description: 'Official Village Form VII-XII record of rights with current crops & occupancy'
  },
  'other-supporting': {
    type: 'OTHER_SUPPORTING',
    label: 'Other Supporting Document',
    description: 'Any other relevant statutory document or affidavit'
  }
};

export const DocumentUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { docSlug } = useParams<{ docSlug?: string }>();
  const [searchParams] = useSearchParams();
  const reuploadId = searchParams.get('reupload');
  const paramType = searchParams.get('type') as DocumentType | null;
  const paramSlug = searchParams.get('slug');

  // Resolve document type from slug or query param
  const slugKey = docSlug || paramSlug || '';
  const matchedInfo = SLUG_TO_DOC_INFO[slugKey];
  const initialType: DocumentType | null = matchedInfo?.type || paramType || null;
  const isDirectContext = Boolean(matchedInfo || paramType || reuploadId);

  // If a document was targeted, jump straight to Page Manager (step 2).
  const [step, setStep] = useState<number>(isDirectContext ? 2 : 1);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(initialType);
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initialType && selectedType !== initialType) {
      setSelectedType(initialType);
      setStep(2);
    }
  }, [initialType, selectedType]);

  const { caseId, uploadedBy } = getSessionPayloadDefaults();

  const handleConfirm = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (reuploadId) {
        await resubmitDocument({ documentId: reuploadId, pages });
      } else {
        await submitDocument({ documentType: selectedType, caseId, uploadedBy, pages });
      }
      setShowConfirm(false);

      // Requirement 8: Return immediately to MY DOCUMENTS
      navigate('/personal/documents', {
        replace: true,
        state: {
          flashSuccess: true,
          message: `${documentTypeLabel} submitted successfully! Status updated to Pending District Verification.`
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setSubmitError(msg);
      setIsSubmitting(false);
    }
  };

  const documentTypeLabel = selectedType ? (DOCUMENT_TYPE_LABELS[selectedType] || matchedInfo?.label || selectedType) : (matchedInfo?.label || 'Document');
  const documentDescription = matchedInfo?.description || 'Upload statutory document for official land acquisition verification.';

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: 'var(--space-xl)',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: 'var(--on-background)'
    }}>
      {/* Top Banner Header */}
      <div style={{
        backgroundColor: '#fff7ed',
        border: '1px solid #ffedd5',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/personal/documents')}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#461300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
            title="Back to My Documents"
          >
            <ArrowLeft size={18} />
          </button>

          <div style={{
            backgroundColor: '#461300',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Upload size={22} color="#ffffff" />
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#9a3412' }}>
              {reuploadId ? `Re-upload ${documentTypeLabel}` : `Upload ${documentTypeLabel}`}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#7c2d12' }}>
              Required for: <strong>Land Acquisition Case LA-2026-001 (Mumbai–Pune Expansion)</strong>
              {reuploadId && (
                <span style={{
                  marginLeft: '10px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  RE-UPLOAD (VERSION 2)
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/personal/documents')}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #461300',
            color: '#461300',
            borderRadius: '6px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Arial, Helvetica, sans-serif'
          }}
        >
          ← Cancel & Return to My Documents
        </button>
      </div>

      {/* Document Specification Callout */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#9a3412" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              {documentTypeLabel}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: '#64748b' }}>
            {documentDescription}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#475569', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b' }}>Accepted Formats: </span>
            <strong style={{ color: '#0f172a' }}>PDF, JPG, JPEG, PNG</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#475569', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b' }}>Max File Size: </span>
            <strong style={{ color: '#0f172a' }}>{MAX_FILE_SIZE_MB} MB</strong>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        {/* Step indicator */}
        <UploadStepIndicator currentStep={step as any} />

        {/* Step 1: Only shown if no direct context */}
        {step === 1 && !isDirectContext && (
          <DocumentTypeSelector
            selected={selectedType}
            onSelect={setSelectedType}
            onNext={() => setStep(2)}
          />
        )}

        {/* Step 2: Upload Pages via Camera or File */}
        {step === 2 && selectedType && (
          <DocumentPageManager
            documentTypeLabel={documentTypeLabel}
            pages={pages}
            onPagesChange={setPages}
            onNext={() => setStep(3)}
            onBack={() => {
              if (isDirectContext) {
                navigate('/personal/documents');
              } else {
                setStep(1);
              }
            }}
          />
        )}

        {/* Step 3: Review Pages before submission */}
        {step === 3 && selectedType && pages.length > 0 && (
          <DocumentReviewPanel
            documentTypeLabel={documentTypeLabel}
            pages={pages}
            onBack={() => setStep(2)}
            onSubmit={() => setShowConfirm(true)}
          />
        )}

        {/* Step 4: Submitting */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#461300' }}>
              Submitting {documentTypeLabel}…
            </div>
            <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '8px' }}>
              Please wait while your document is securely recorded for government verification.
            </div>
          </div>
        )}

        {/* Error banner */}
        {submitError && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginTop: '16px',
            fontSize: '13px',
            color: '#991b1b',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} /> {submitError}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={showConfirm}
        documentTypeLabel={documentTypeLabel}
        pageCount={pages.length}
        loading={isSubmitting}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default DocumentUploadPage;

