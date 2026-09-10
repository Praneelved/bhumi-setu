import React from 'react';
import { CheckCircle2, Circle, ShieldCheck, AlertCircle } from 'lucide-react';
import type { StageChecklistItem } from '../../types/governmentVerification';

interface VerificationChecklistProps {
  title: string;
  subtitle?: string;
  stageName: string;
  items: StageChecklistItem[];
  onToggleCheck: (checkId: string) => void;
  readOnly?: boolean;
}

export const VerificationChecklist: React.FC<VerificationChecklistProps> = ({
  title,
  subtitle,
  stageName,
  items,
  onToggleCheck,
  readOnly = false
}) => {
  const verifiedCount = items.filter(i => i.verified).length;
  const totalCount = items.length;
  const allVerified = verifiedCount === totalCount && totalCount > 0;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid var(--outline-variant)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      marginBottom: 'var(--space-lg)',
      fontFamily: 'Arial, Helvetica, sans-serif',
      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
    }}>
      {/* Header with Title and Counter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--outline-variant)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#0a2540" />
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
              {title}
            </h3>
          </div>
          {subtitle && (
            <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: '4px 0 0 0' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Counter Badge */}
        <div style={{
          backgroundColor: allVerified ? '#f0fdf4' : '#f8fafc',
          border: `1px solid ${allVerified ? '#86efac' : '#cbd5e1'}`,
          color: allVerified ? '#166534' : '#334155',
          borderRadius: '20px',
          padding: '6px 14px',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {allVerified ? <CheckCircle2 size={16} color="#166534" /> : <AlertCircle size={16} color="#0284c7" />}
          <span>Checks Passed: {verifiedCount} / {totalCount}</span>
        </div>
      </div>

      {/* Checklist Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {items.map((item, index) => {
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: item.verified ? '#f0fdf4' : '#ffffff',
                border: `1px solid ${item.verified ? '#bbf7d0' : '#e2e8f0'}`,
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                <div style={{ marginTop: '2px', color: item.verified ? '#166534' : '#94a3b8' }}>
                  {item.verified ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: item.verified ? '#166534' : 'var(--on-surface)'
                    }}>
                      {index + 1}. {item.label}
                    </span>
                    {item.mandatory && (
                      <span style={{
                        fontSize: '10px',
                        backgroundColor: '#fef2f2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontWeight: 700
                      }}>
                        MANDATORY
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: item.verified ? '#15803d' : 'var(--on-surface-variant)',
                    margin: '4px 0 0 0',
                    lineHeight: 1.4
                  }}>
                    {item.description}
                  </p>
                  {item.verified && item.verifiedBy && (
                    <div style={{
                      fontSize: '11px',
                      color: '#166534',
                      fontWeight: 600,
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ✓ Verified by {item.verifiedBy} {item.verifiedAt ? `• ${item.verifiedAt}` : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onToggleCheck(item.id)}
                  style={{
                    backgroundColor: item.verified ? '#dcfce7' : '#0a2540',
                    color: item.verified ? '#166534' : '#ffffff',
                    border: item.verified ? '1px solid #86efac' : 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'opacity 0.15s ease'
                  }}
                >
                  {item.verified ? (
                    <>
                      <CheckCircle2 size={14} /> Verified ✓
                    </>
                  ) : (
                    <>
                      Verify Check
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
