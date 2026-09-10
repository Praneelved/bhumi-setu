import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Upload } from 'lucide-react';
import type { DocumentType, DocumentPage, SubmittedDocument } from '../types/landownerDocuments';
import { DOCUMENT_TYPE_LABELS } from '../types/landownerDocuments';
import { UploadStepIndicator } from '../components/personal/UploadStepIndicator';
import { DocumentTypeSelector } from '../components/personal/DocumentTypeSelector';
import { DocumentPageManager } from '../components/personal/DocumentPageManager';
import { DocumentReviewPanel } from '../components/personal/DocumentReviewPanel';
import { SubmitConfirmModal } from '../components/personal/SubmitConfirmModal';
import { DocumentStatusCard } from '../components/personal/DocumentStatusCard';
import {
  submitDocument,
  resubmitDocument,
  getSessionPayloadDefaults
} from '../services/documentUploadService';

type Step = 1 | 2 | 3 | 4 | 5;

export const DocumentUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reuploadId = searchParams.get('reupload');   // e.g. ?reupload=DOC-MH-003
  const preselectedType = searchParams.get('type') as DocumentType | null;

  // ─── State machine ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(preselectedType);
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDoc, setSubmittedDoc] = useState<SubmittedDocument | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill type if re-uploading a rejected document
  useEffect(() => {
    if (reuploadId) {
      if (!selectedType) {
        setSelectedType(preselectedType || 'FIELD_INSPECTION_REPORT');
      }
      setStep(2);
    }
  }, [reuploadId, preselectedType]);


  const { caseId, uploadedBy } = getSessionPayloadDefaults();

  // ─── Submit logic ──────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      let doc: SubmittedDocument;
      if (reuploadId) {
        doc = await resubmitDocument({ documentId: reuploadId, pages });
      } else {
        doc = await submitDocument({ documentType: selectedType, caseId, uploadedBy, pages });
      }
      setSubmittedDoc(doc);
      setShowConfirm(false);
      setStep(5);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReupload = (doc: SubmittedDocument) => {
    navigate(
      `/personal/documents/upload?reupload=${doc.id}&type=${doc.documentType}`
    );
    // Reset state for fresh re-upload
    setSelectedType(doc.documentType);
    setPages([]);
    setStep(2);
    setSubmittedDoc(null);
    setSubmitError(null);
  };

  const documentTypeLabel = selectedType ? DOCUMENT_TYPE_LABELS[selectedType] : '';

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: 'var(--space-xl)',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: 'var(--on-background)'
    }}>
      {/* Page header */}
      <div style={{
        backgroundColor: '#fff7ed',
        border: '1px solid #ffedd5',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <button
          onClick={() => navigate('/personal/dashboard')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#461300',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontWeight: 700,
            padding: '4px',
            flexShrink: 0
          }}
          aria-label="Back to dashboard"
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
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#9a3412' }}>
            {reuploadId ? 'Re-upload Corrected Document' : 'Submit Land Documents'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#7c2d12' }}>
            Case: <strong>LA-2026-001 (Mumbai–Pune Expansion)</strong>
            {reuploadId && (
              <span style={{
                marginLeft: '10px',
                backgroundColor: '#fef2f2', color: '#991b1b',
                border: '1px solid #fecaca', padding: '2px 8px',
                borderRadius: '4px', fontSize: '11px', fontWeight: 700
              }}>
                RE-UPLOAD
              </span>
            )}
          </p>
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
        <UploadStepIndicator currentStep={step} />

        {/* ── Step 1: Select document type ── */}
        {step === 1 && (
          <DocumentTypeSelector
            selected={selectedType}
            onSelect={setSelectedType}
            onNext={() => setStep(2)}
          />
        )}

        {/* ── Step 2: Upload pages ── */}
        {step === 2 && selectedType && (
          <DocumentPageManager
            documentTypeLabel={documentTypeLabel}
            pages={pages}
            onPagesChange={setPages}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && selectedType && pages.length > 0 && (
          <DocumentReviewPanel
            documentTypeLabel={documentTypeLabel}
            pages={pages}
            onBack={() => setStep(2)}
            onSubmit={() => setShowConfirm(true)}
          />
        )}

        {/* ── Step 4 (handled by modal above) + loading UI ── */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#461300' }}>
              Submitting document…
            </div>
            <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '8px' }}>
              Please wait while your document is being uploaded.
            </div>
          </div>
        )}

        {/* ── Step 5: Verification status ── */}
        {step === 5 && submittedDoc && (
          <div>
            {/* Success banner */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <CheckCircle2 size={36} color="#166534" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#166534' }}>
                  Document Submitted Successfully!
                </div>
                <div style={{ fontSize: '13px', color: '#15803d', marginTop: '4px' }}>
                  Your <strong>{submittedDoc.documentTypeLabel}</strong> has been submitted and is now
                  awaiting District Collector verification.
                </div>
              </div>
            </div>

            {/* Status card */}
            <DocumentStatusCard doc={submittedDoc} onReupload={handleReupload} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedType(null);
                  setPages([]);
                  setSubmittedDoc(null);
                  setSubmitError(null);
                }}
                style={{
                  backgroundColor: '#461300',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '11px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Arial, Helvetica, sans-serif'
                }}
              >
                + Submit Another Document
              </button>
              <button
                onClick={() => navigate('/personal/dashboard')}
                style={{
                  backgroundColor: 'transparent',
                  color: '#461300',
                  border: '1px solid #461300',
                  borderRadius: 'var(--radius-md)',
                  padding: '11px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Arial, Helvetica, sans-serif'
                }}
              >
                ← Back to Dashboard
              </button>
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
            fontWeight: 700
          }}>
            ⚠ {submitError}
          </div>
        )}
      </div>

      {/* Submit confirmation modal */}
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
