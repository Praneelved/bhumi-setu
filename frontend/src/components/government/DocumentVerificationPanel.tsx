import React from 'react';
import { 
  CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, ShieldCheck, FileCheck2, Send
} from 'lucide-react';
import type { VerificationDocument, AuthorityLevel, OverallCaseStatus } from '../../types/governmentVerification';

interface DocumentVerificationPanelProps {
  document: VerificationDocument;
  documentIndex: number;
  totalDocuments: number;
  allVerifiedForCurrentStage: boolean;
  currentAuthorityLevel: AuthorityLevel;
  caseStage: AuthorityLevel;
  overallStatus: OverallCaseStatus;
  onVerifyClick: () => void;
  onRejectClick: () => void;
  onNextDocumentClick: () => void;
  onProceedNextStageClick: () => void;
}

export const DocumentVerificationPanel: React.FC<DocumentVerificationPanelProps> = ({
  document,
  documentIndex,
  totalDocuments,
  allVerifiedForCurrentStage,
  currentAuthorityLevel,
  caseStage,
  overallStatus,
  onVerifyClick,
  onRejectClick,
  onNextDocumentClick,
  onProceedNextStageClick
}) => {
  const getStatusBadge = () => {
    switch (document.status) {
      case 'VERIFIED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#f0fdf4',
            color: '#166534',
            border: '1px solid #86efac',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            <CheckCircle2 size={16} /> ✓ Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            <XCircle size={16} /> ✕ Rejected
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#fffbe6',
            color: '#856404',
            border: '1px solid #ffeeba',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            <Clock size={16} /> ● Pending Verification
          </span>
        );
    }
  };

  const getStageNextButtonText = () => {
    switch (currentAuthorityLevel) {
      case 'DISTRICT_COLLECTOR':
        return 'PROCEED TO STATE GOVERNMENT STAGE';
      case 'STATE_GOVERNMENT':
        return 'PROCEED TO CENTRAL MINISTRY STAGE';
      case 'CENTRAL_MINISTRY':
        return 'GIVE FINAL APPROVAL & PROCEED TO ACQUISITION';
    }
  };

  return (
    <div style={{
      width: '320px',
      minWidth: '320px',
      backgroundColor: 'var(--surface-container-lowest)',
      border: '1px solid var(--outline-variant)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <div>
        {/* Panel Header */}
        <div style={{
          borderBottom: '2px solid var(--surface-container-high)',
          paddingBottom: 'var(--space-md)',
          marginBottom: 'var(--space-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={20} color="var(--primary-container)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
              Document Verification
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', margin: 0 }}>
            Official Authority Review Panel
          </p>
        </div>

        {/* Selected Document Info */}
        <div style={{
          backgroundColor: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: 'var(--space-lg)',
          border: '1px solid var(--outline-variant)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Document Selected
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
            {document.title}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '12px' }}>
            <div>
              <span style={{ color: 'var(--outline)' }}>Doc No: </span>
              <strong style={{ color: 'var(--on-surface)' }}>{document.docNumber}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--outline)' }}>Total Pages: </span>
              <strong style={{ color: 'var(--on-surface)' }}>{document.pages.length}</strong>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', marginBottom: '4px' }}>Current Status:</div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Verification History / Remarks for Document */}
        {document.status === 'VERIFIED' && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: 'var(--space-lg)',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
              ✓ Document Verified Successfully
            </div>
            <div style={{ color: '#14532d', fontSize: '11px' }}>
              Verified By: {document.verifiedBy || 'Dr. Rajesh Sharma, IAS'}<br />
              Time: {document.verifiedAt || 'Just now'}
            </div>
          </div>
        )}

        {document.status === 'REJECTED' && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: 'var(--space-lg)',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>
              ✕ Document Rejected
            </div>
            <div style={{ color: '#7f1d1d', fontSize: '11px', marginBottom: '4px' }}>
              <strong>Category:</strong> {document.rejectionCategory || 'Land survey mismatch'}
            </div>
            <div style={{ color: '#7f1d1d', fontSize: '11px' }}>
              <strong>Reason:</strong> {document.rejectionReason || 'Details do not match official land records.'}
            </div>
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#b91c1c', fontWeight: 700, backgroundColor: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>
              ✉ viaSocket Notification Queued for User
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--space-lg)' }}>
          <button
            onClick={onVerifyClick}
            disabled={document.status === 'VERIFIED'}
            style={{
              width: '100%',
              backgroundColor: document.status === 'VERIFIED' ? '#94a3b8' : '#0a6d3a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: document.status === 'VERIFIED' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: document.status === 'VERIFIED' ? 'none' : '0 2px 6px rgba(10, 109, 58, 0.2)'
            }}
          >
            <CheckCircle2 size={18} />
            {document.status === 'VERIFIED' ? '✓ DOCUMENT VERIFIED' : '✓ VERIFY DOCUMENT'}
          </button>

          <button
            onClick={onRejectClick}
            disabled={document.status === 'REJECTED'}
            style={{
              width: '100%',
              backgroundColor: document.status === 'REJECTED' ? '#94a3b8' : '#ba1a1a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: document.status === 'REJECTED' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: document.status === 'REJECTED' ? 'none' : '0 2px 6px rgba(186, 26, 26, 0.2)'
            }}
          >
            <XCircle size={18} />
            {document.status === 'REJECTED' ? '✕ DOCUMENT REJECTED' : '✕ REJECT DOCUMENT'}
          </button>

          {documentIndex < totalDocuments - 1 && (
            <button
              onClick={onNextDocumentClick}
              style={{
                width: '100%',
                backgroundColor: 'var(--surface-container-high)',
                color: 'var(--primary)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              Proceed to Next Document <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Stage Progression Section */}
      <div style={{
        backgroundColor: allVerifiedForCurrentStage ? '#f0fdf4' : 'var(--surface-container-low)',
        border: `1px solid ${allVerifiedForCurrentStage ? '#86efac' : 'var(--outline-variant)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '4px' }}>
          Stage Verification Summary
        </div>
        
        {allVerifiedForCurrentStage ? (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
              ✓ All required documents for this stage have been verified!
            </div>
            <button
              onClick={onProceedNextStageClick}
              style={{
                width: '100%',
                backgroundColor: '#0a2540',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(10, 37, 64, 0.25)'
              }}
            >
              <Send size={16} /> {getStageNextButtonText()}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            Complete verification of all documents to proceed to the next stage.
          </div>
        )}
      </div>
    </div>
  );
};
