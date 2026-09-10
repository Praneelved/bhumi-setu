import React from 'react';
import { Mail, CheckCircle2, X, Zap } from 'lucide-react';
import type { RejectionEvent } from '../../types/governmentVerification';

interface ViaSocketNotificationToastProps {
  event: RejectionEvent | null;
  onDismiss: () => void;
}

export const ViaSocketNotificationToast: React.FC<ViaSocketNotificationToastProps> = ({
  event,
  onDismiss
}) => {
  if (!event) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '420px',
      backgroundColor: '#ffffff',
      border: '2px solid #0a2540',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 12px 30px rgba(10, 37, 64, 0.25)',
      zIndex: 2000,
      overflow: 'hidden',
      fontFamily: 'Arial, Helvetica, sans-serif',
      animation: 'slideUp 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#0a2540',
        color: '#ffffff',
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="#9ef6b6" />
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em' }}>
            VIASOCKET REJECTION EVENT QUEUED
          </span>
        </div>
        <button
          onClick={onDismiss}
          style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '14px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, marginBottom: '8px' }}>
          <CheckCircle2 size={14} /> Rejection Event Captured & Notification Dispatched
        </div>

        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px', marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Payload Event Details (viaSocket API Hook)
          </div>
          <div style={{ margin: '4px 0', fontWeight: 700, color: '#0a2540' }}>
            Case: {event.caseId} | Document: {event.documentName}
          </div>
          <div style={{ color: '#991b1b', fontSize: '11px', fontWeight: 600 }}>
            Category: {event.issueCategory}
          </div>
          <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
            Reason: "{event.reason}"
          </div>
        </div>

        {/* Mock Future Email Preview */}
        <div style={{ backgroundColor: '#eff6ff', border: '1px dashed #3b82f6', borderRadius: '4px', padding: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>
            <Mail size={14} /> Future User Notification Email Preview:
          </div>
          <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 700 }}>
            Subject: Land Acquisition Document Verification Failed
          </div>
          <div style={{ fontSize: '10px', color: '#1e40af', marginTop: '4px', lineHeight: 1.4 }}>
            "Your submitted document could not be verified for Case {event.caseId}.<br />
            Document: {event.documentName}<br />
            Issue: {event.reason}<br />
            Please review and resubmit the corrected document."
          </div>
        </div>
      </div>
    </div>
  );
};
