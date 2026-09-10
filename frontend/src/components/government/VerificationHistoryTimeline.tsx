import React from 'react';
import { CheckCircle2, Clock, Lock, XCircle, ChevronDown, ArrowDown } from 'lucide-react';
import type { VerificationCase, AuthorityLevel } from '../../types/governmentVerification';

interface VerificationHistoryTimelineProps {
  currentCase: VerificationCase;
}

export const VerificationHistoryTimeline: React.FC<VerificationHistoryTimelineProps> = ({ currentCase }) => {
  const stages: {
    key: AuthorityLevel;
    title: string;
    authorityRole: string;
    defaultOfficer: string;
  }[] = [
    {
      key: 'DISTRICT_COLLECTOR',
      title: 'STAGE 1: DISTRICT COLLECTOR VERIFICATION',
      authorityRole: 'District Land Acquisition Authority',
      defaultOfficer: 'Dr. Rajesh Sharma, IAS (District Collector)'
    },
    {
      key: 'STATE_GOVERNMENT',
      title: 'STAGE 2: STATE GOVERNMENT VERIFICATION',
      authorityRole: 'State Revenue & Urban Land Authority',
      defaultOfficer: 'Smt. Ananya Deshmukh, IAS (Principal Secretary)'
    },
    {
      key: 'CENTRAL_MINISTRY',
      title: 'STAGE 3: CENTRAL MINISTRY VERIFICATION',
      authorityRole: 'Ministry of Rural Development & MoRTH',
      defaultOfficer: 'Shri Vikramaditya Verma, IAS (Joint Secretary)'
    }
  ];

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
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 16px 0' }}>
        Statutory Verification Timeline & Audit Trail
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {stages.map((st, index) => {
          const stageInfo = currentCase.stages[st.key] || { status: 'LOCKED' };
          const isCurrentActive = currentCase.currentStage === st.key && stageInfo.status === 'ACTIVE';
          const isCompleted = stageInfo.status === 'COMPLETED';
          const isRejected = stageInfo.status === 'REJECTED';
          const isLocked = stageInfo.status === 'LOCKED';

          let statusBadge = (
            <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              🔒 LOCKED
            </span>
          );
          let borderLeftColor = '#cbd5e1';

          if (isCompleted) {
            statusBadge = (
              <span style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> COMPLETED ✓
              </span>
            );
            borderLeftColor = '#16a34a';
          } else if (isRejected) {
            statusBadge = (
              <span style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <XCircle size={13} /> REJECTED / CORRECTION REQUIRED
              </span>
            );
            borderLeftColor = '#dc2626';
          } else if (isCurrentActive) {
            statusBadge = (
              <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> ACTIVE IN PROGRESS 🟢
              </span>
            );
            borderLeftColor = '#0284c7';
          }

          return (
            <div key={st.key} style={{ position: 'relative' }}>
              <div style={{
                borderLeft: `3px solid ${borderLeftColor}`,
                paddingLeft: '16px',
                paddingBottom: '20px',
                marginLeft: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: isCurrentActive ? 'var(--primary)' : 'var(--on-surface)' }}>
                    {st.title}
                  </div>
                  <div>{statusBadge}</div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                  Authority: {st.authorityRole}
                </div>

                {isCompleted && (
                  <div style={{
                    marginTop: '8px',
                    backgroundColor: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontWeight: 600, color: '#166534' }}>
                      Officer: {stageInfo.verifiedBy || st.defaultOfficer}
                    </div>
                    {stageInfo.verifiedAt && (
                      <div style={{ color: 'var(--on-surface-variant)', fontSize: '11px' }}>
                        Date & Time: {stageInfo.verifiedAt}
                      </div>
                    )}
                    {stageInfo.remarks && (
                      <div style={{ color: 'var(--on-surface)', marginTop: '4px', fontStyle: 'italic' }}>
                        "{stageInfo.remarks}"
                      </div>
                    )}
                  </div>
                )}

                {isRejected && currentCase.activeRejection && currentCase.activeRejection.stage === st.key && (
                  <div style={{
                    marginTop: '8px',
                    backgroundColor: '#fef2f2',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    border: '1px solid #fecaca'
                  }}>
                    <div style={{ fontWeight: 700, color: '#991b1b' }}>
                      Rejected by: {currentCase.activeRejection.officerName} on {currentCase.activeRejection.timestamp}
                    </div>
                    <div style={{ color: '#7f1d1d', marginTop: '2px' }}>
                      <strong>Category:</strong> {currentCase.activeRejection.issueCategory}
                    </div>
                    <div style={{ color: '#7f1d1d', marginTop: '2px' }}>
                      <strong>Reason:</strong> {currentCase.activeRejection.rejectionReason}
                    </div>
                    <div style={{ color: '#991b1b', marginTop: '4px', fontWeight: 600 }}>
                      <strong>Required Correction:</strong> {currentCase.activeRejection.requiredCorrection}
                    </div>
                  </div>
                )}
              </div>

              {index < stages.length - 1 && (
                <div style={{
                  position: 'absolute',
                  left: '1px',
                  bottom: '-2px',
                  width: '12px',
                  height: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCompleted ? '#16a34a' : '#cbd5e1'
                }}>
                  <ArrowDown size={12} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
