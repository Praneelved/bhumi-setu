import React, { useState } from 'react';
import { AlertOctagon, X, Send } from 'lucide-react';

interface RejectDocumentModalProps {
  isOpen: boolean;
  documentTitle: string;
  onClose: () => void;
  onConfirmReject: (category: string, reason: string, remarks: string, requiredCorrection: string) => void;
}

const REJECTION_CATEGORIES = [
  'Survey number mismatch',
  'Document unclear',
  'Incorrect information',
  'Ownership mismatch',
  'Missing page',
  'Invalid document',
  'Other'
];


export const RejectDocumentModal: React.FC<RejectDocumentModalProps> = ({
  isOpen,
  documentTitle,
  onClose,
  onConfirmReject
}) => {
  const [category, setCategory] = useState<string>('Boundary Discrepancy');
  const [reason, setReason] = useState<string>('Survey boundary discrepancy on Northern alignment with adjacent Khasra 101/4.');
  const [remarks, setRemarks] = useState<string>('Boundary coordinates mismatch observed during Joint Measurement Survey inspection.');
  const [requiredCorrection, setRequiredCorrection] = useState<string>('Re-upload corrected Field Inspection & Boundary Survey report with surveyor signature.');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a specific rejection reason for statutory audit logging.');
      return;
    }
    setError(null);
    onConfirmReject(category, reason.trim(), remarks.trim(), requiredCorrection.trim());
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      backdropFilter: 'blur(2px)',
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
        maxWidth: '560px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          backgroundColor: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertOctagon size={22} color="#dc2626" />
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#991b1b', margin: 0 }}>
              Reject Land Document
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '13px'
            }}>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                Document Being Rejected:
              </span>
              <div style={{ fontWeight: 700, color: '#0a2540', marginTop: '2px', fontSize: '14px' }}>
                {documentTitle}
              </div>
            </div>

            {/* Issue Category Select */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Rejection Category <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  backgroundColor: '#ffffff'
                }}
              >
                {REJECTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Rejection Reason Text Area */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Rejection Reason <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Enter specific discrepancy reason..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: error ? '1px solid #dc2626' : '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  resize: 'vertical'
                }}
              />
              {error && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>
                  {error}
                </div>
              )}
            </div>

            {/* Officer Remarks */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Officer Remarks & Notes
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Add official officer observations for audit trail..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Required Corrective Action */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Required Corrective Action (Sent to Landowner) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={requiredCorrection}
                onChange={(e) => setRequiredCorrection(e.target.value)}
                placeholder="e.g. Re-upload corrected survey sheet with joint surveyor signoff"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'Arial, Helvetica, sans-serif'
                }}
              />
            </div>

            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: '11px',
              color: '#1e40af'
            }}>
              <strong>Statutory Notification:</strong> Upon rejection, the landowner receives immediate notification via email/SMS & WebSockets containing the rejection category, reason, officer remarks, and corrective instructions. Subsequent verification stages will remain LOCKED.
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: '#f8fafc'
          }}>
            <button
              type="button"
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
              type="submit"
              style={{
                backgroundColor: '#ba1a1a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(186, 26, 26, 0.2)'
              }}
            >
              <Send size={14} /> Submit Rejection & Notify Landowner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

