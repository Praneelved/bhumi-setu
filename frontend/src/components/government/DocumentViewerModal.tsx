import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import type { VerificationDocument } from '../../types/governmentVerification';
import { SyntheticDocumentCanvas } from './SyntheticDocumentCanvas';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: VerificationDocument | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document
}) => {
  const [activePage, setActivePage] = useState(1);

  if (!isOpen || !document) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '880px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--outline-variant)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#0a2540',
          color: '#ffffff',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#7dd3fc" />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                {document.title}
              </h3>
              <div style={{ fontSize: '11px', color: '#93c5fd' }}>
                Ref: #{document.docNumber} • Type: {document.type} • {document.totalPages} Pages • Version {document.version || 1}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Canvas Body */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(92vh - 120px)' }}>
          <SyntheticDocumentCanvas
            document={document}
            selectedPageNumber={activePage}
            onPageChange={setActivePage}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--outline-variant)',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#f8fafc'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '4px',
              backgroundColor: '#0a2540',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

