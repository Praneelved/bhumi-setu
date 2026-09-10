import React, { useState } from 'react';
import { CheckCircle2, Clock, XCircle, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import type { SubmittedDocument } from '../../types/landownerDocuments';

interface Props {
  doc: SubmittedDocument;
  onReupload?: (doc: SubmittedDocument) => void;
}

const STAGE_PIPELINE = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'DISTRICT', label: 'District' },
  { key: 'STATE', label: 'State' },
  { key: 'CENTRAL', label: 'Central' },
  { key: 'FINAL', label: 'Final' }
];

export const DocumentStatusCard: React.FC<Props> = ({ doc, onReupload }) => {
  const [showReason, setShowReason] = useState(false);

  const stageIdx = STAGE_PIPELINE.findIndex(s => s.key === doc.verificationStage);
  const isRejected = doc.status === 'REJECTED';
  const isVerified = doc.status === 'VERIFIED';

  const statusBadge = () => {
    switch (doc.status) {
      case 'VERIFIED':
        return (
          <span style={badge('#f0fdf4', '#166534', '#86efac')}>✓ Verified</span>
        );
      case 'REJECTED':
        return (
          <span style={badge('#fef2f2', '#991b1b', '#fecaca')}>✕ Rejected</span>
        );
      case 'RESUBMITTED':
        return (
          <span style={badge('#e0f2fe', '#0369a1', '#7dd3fc')}>↻ Resubmitted</span>
        );
      default:
        return (
          <span style={badge('#fffbe6', '#856404', '#fde68a')}>⏳ Pending Verification</span>
        );
    }
  };

  const cardBorderColor = isRejected ? '#fecaca' : isVerified ? '#86efac' : 'var(--outline-variant)';
  const headerBg = isRejected ? '#fef2f2' : isVerified ? '#f0fdf4' : '#fff7ed';
  const headerBorder = isRejected ? '#fecaca' : isVerified ? '#86efac' : '#ffedd5';

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: `1px solid ${cardBorderColor}`,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      {/* Card header */}
      <div style={{
        backgroundColor: headerBg,
        borderBottom: `1px solid ${headerBorder}`,
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#461300' }}>
            {doc.documentTypeLabel}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
            {doc.totalPages} {doc.totalPages === 1 ? 'page' : 'pages'} · Submitted {doc.submittedAt}
          </div>
        </div>
        {statusBadge()}
      </div>

      {/* Verification pipeline */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--outline)',
          textTransform: 'uppercase', marginBottom: '12px'
        }}>
          Verification Stage
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {STAGE_PIPELINE.map((stage, idx) => {
            const completed = idx < stageIdx || isVerified;
            const active = idx === stageIdx && !isRejected && !isVerified;
            const rejected = idx === stageIdx && isRejected;
            const locked = idx > stageIdx && !isVerified;

            const circleBg =
              completed ? '#166534' :
              active ? '#461300' :
              rejected ? '#991b1b' :
              '#e2e8f0';

            return (
              <React.Fragment key={stage.key}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    backgroundColor: circleBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {completed && <CheckCircle2 size={14} color="#ffffff" />}
                    {active && <Clock size={13} color="#ffffff" />}
                    {rejected && <XCircle size={14} color="#ffffff" />}
                    {locked && <Lock size={12} color="#94a3b8" />}
                  </div>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: completed ? '#166534' : active ? '#461300' : rejected ? '#991b1b' : '#94a3b8',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    maxWidth: '48px',
                    lineHeight: 1.2
                  }}>
                    {stage.label}
                  </span>
                </div>
                {idx < STAGE_PIPELINE.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    minWidth: '8px',
                    marginBottom: '18px',
                    backgroundColor: completed ? '#166534' : '#e2e8f0',
                    borderRadius: '2px'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Rejection section */}
        {isRejected && (
          <div style={{ marginTop: '16px', borderTop: '1px solid #fecaca', paddingTop: '14px' }}>
            <button
              onClick={() => setShowReason(!showReason)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '10px',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
            >
              {showReason ? <EyeOff size={14} /> : <Eye size={14} />}
              {showReason ? 'Hide' : 'View'} Rejection Reason
            </button>

            {showReason && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '12px'
              }}>
                {doc.rejectionCategory && (
                  <div style={{
                    fontSize: '11px', fontWeight: 700,
                    color: '#991b1b', textTransform: 'uppercase',
                    marginBottom: '6px'
                  }}>
                    Category: {doc.rejectionCategory}
                  </div>
                )}
                <div style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: 1.6 }}>
                  {doc.rejectionReason}
                </div>
              </div>
            )}

            <button
              onClick={() => onReupload?.(doc)}
              style={{
                backgroundColor: '#461300',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '9px 18px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
            >
              <RefreshCw size={14} /> Re-upload Corrected Document
            </button>
          </div>
        )}

        {/* Verified section */}
        {isVerified && doc.verifiedBy && (
          <div style={{
            marginTop: '12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#166534'
          }}>
            ✓ Verified by <strong>{doc.verifiedBy}</strong>
            {doc.verifiedAt && <> on {doc.verifiedAt}</>}
          </div>
        )}
      </div>
    </div>
  );
};

function badge(bg: string, color: string, borderColor: string): React.CSSProperties {
  return {
    backgroundColor: bg,
    color,
    border: `1px solid ${borderColor}`,
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  };
}
