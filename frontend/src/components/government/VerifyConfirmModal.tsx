import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface VerifyConfirmModalProps {
  isOpen: boolean;
  documentTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const VerifyConfirmModal: React.FC<VerifyConfirmModalProps> = ({
  isOpen,
  documentTitle,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          backgroundColor: '#f0fdf4',
          borderBottom: '1px solid #bbf7d0',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={24} color="#166534" />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#14532d', margin: 0 }}>
              Verify Document?
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Are you sure this document is correct, authentic, and complete under the RFCTLARR statutory requirements?
          </p>

          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '13px'
          }}>
            <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
              Target Document
            </span>
            <div style={{ fontWeight: 700, color: '#0a2540', marginTop: '2px' }}>
              {documentTitle}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          backgroundColor: '#f8fafc'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              backgroundColor: '#0a6d3a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(10, 109, 58, 0.2)'
            }}
          >
            Confirm Verification
          </button>
        </div>
      </div>
    </div>
  );
};
