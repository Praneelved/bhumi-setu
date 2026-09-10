import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { VerificationCase, AuthorityLevel } from '../../types/governmentVerification';

interface LockedStageCardProps {
  currentCase: VerificationCase;
  attemptedStage: AuthorityLevel;
}

export const LockedStageCard: React.FC<LockedStageCardProps> = ({ currentCase, attemptedStage }) => {
  const navigate = useNavigate();

  const getPrerequisiteInfo = () => {
    if (attemptedStage === 'STATE_GOVERNMENT') {
      return {
        stageTitle: 'State Government Verification (Stage 2)',
        prerequisiteTitle: 'District Collector Verification (Stage 1)',
        requiredRoute: `/government/verification/district/${currentCase.id}`,
        reason: 'Under the sequential statutory verification rules, State Government verification cannot commence until the District Collector has completed all land parcel, boundary, ownership, and field inspection checks.'
      };
    } else {
      return {
        stageTitle: 'Central Ministry Verification (Stage 3)',
        prerequisiteTitle: 'State Government Verification (Stage 2)',
        requiredRoute: currentCase.stages.DISTRICT_COLLECTOR.status !== 'COMPLETED'
          ? `/government/verification/district/${currentCase.id}`
          : `/government/verification/state/${currentCase.id}`,
        reason: 'Central Ministry statutory review and gazette award sanction require prior certified approvals from both District Collector (Stage 1) and State Government (Stage 2).'
      };
    }
  };

  const info = getPrerequisiteInfo();

  return (
    <div style={{
      maxWidth: '900px',
      margin: '40px auto',
      padding: '32px',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      fontFamily: 'Arial, Helvetica, sans-serif',
      textAlign: 'center'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: '#f1f5f9',
        border: '2px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px auto'
      }}>
        <Lock size={32} color="#475569" />
      </div>

      <div style={{
        display: 'inline-block',
        backgroundColor: '#fef2f2',
        color: '#991b1b',
        border: '1px solid #fecaca',
        borderRadius: '20px',
        padding: '4px 12px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        marginBottom: '12px'
      }}>
        Sequential Gating Policy Enforced
      </div>

      <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 8px 0' }}>
        {info.stageTitle} is Currently Locked
      </h2>

      <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', maxWidth: '640px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
        {info.reason}
      </p>

      {/* Case Context Strip */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        maxWidth: '560px',
        margin: '0 auto 24px auto',
        textAlign: 'left',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: 'var(--outline)' }}>Case Reference:</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{currentCase.id}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: 'var(--outline)' }}>Project Name:</span>
          <span style={{ fontWeight: 600, color: 'var(--on-surface)', textAlign: 'right', maxWidth: '340px' }}>{currentCase.projectName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--outline)' }}>Current Active Stage:</span>
          <span style={{ fontWeight: 700, color: '#0369a1' }}>
            {currentCase.currentStage.replace('_', ' ')} (IN PROGRESS)
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate('/government/dashboard')}
          style={{
            backgroundColor: '#ffffff',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ArrowLeft size={16} /> Return to Dashboard
        </button>

        <button
          type="button"
          onClick={() => navigate(info.requiredRoute)}
          style={{
            backgroundColor: '#0a2540',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(10, 37, 64, 0.25)'
          }}
        >
          Proceed to {info.prerequisiteTitle}
        </button>
      </div>
    </div>
  );
};
