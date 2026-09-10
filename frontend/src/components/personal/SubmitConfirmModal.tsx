import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  documentTypeLabel: string;
  pageCount: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SubmitConfirmModal: React.FC<Props> = ({
  isOpen,
  documentTypeLabel,
  pageCount,
  loading,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px'
      }}
      onClick={e => { if (!loading && e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        fontFamily: 'Arial, Helvetica, sans-serif'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              backgroundColor: '#fff7ed',
              borderRadius: '50%',
              width: '52px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={26} color="#461300" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#461300' }}>
                Submit for Verification?
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                Review your submission below
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: '#94a3b8', padding: '4px' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Document summary */}
        <div style={{
          backgroundColor: '#fff7ed',
          border: '1px solid #ffedd5',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: '18px'
        }}>
          <div style={{ fontSize: '11px', color: '#9a3412', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
            Document Being Submitted
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#461300' }}>{documentTypeLabel}</div>
          <div style={{ fontSize: '12px', color: '#7c2d12', marginTop: '4px' }}>
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </div>
        </div>

        {/* Warning text */}
        <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', lineHeight: 1.65, marginBottom: '24px' }}>
          Once submitted, this document will be reviewed by the authorized District Collector authority under the <strong>RFCTLARR Act 2013</strong>.
          You will be notified if the document is verified or if corrections are required.
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              backgroundColor: 'transparent',
              color: '#461300',
              border: '1px solid #461300',
              borderRadius: 'var(--radius-md)',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Arial, Helvetica, sans-serif'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#94a3b8' : '#461300',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Arial, Helvetica, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '150px',
              justifyContent: 'center'
            }}
          >
            {loading ? (
              <>⏳ Submitting…</>
            ) : (
              <>✓ Confirm &amp; Submit</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
