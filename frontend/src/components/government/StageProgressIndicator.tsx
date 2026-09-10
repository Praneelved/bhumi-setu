import React from 'react';
import { CheckCircle2, Lock, Clock, ArrowRight, PlayCircle } from 'lucide-react';
import type { AuthorityLevel, StageStatus } from '../../types/governmentVerification';

interface StageProgressIndicatorProps {
  currentStage: AuthorityLevel;
  stages: Record<AuthorityLevel, { status: StageStatus; verifiedBy?: string; verifiedAt?: string }>;
  onSelectStage?: (stage: AuthorityLevel) => void;
}

export const StageProgressIndicator: React.FC<StageProgressIndicatorProps> = ({
  currentStage,
  stages,
  onSelectStage
}) => {
  const stageList: { key: AuthorityLevel; title: string; subtitle: string; num: string }[] = [
    {
      key: 'DISTRICT_COLLECTOR',
      title: 'District Collector',
      subtitle: 'Stage 1 Verification',
      num: '1'
    },
    {
      key: 'STATE_GOVERNMENT',
      title: 'State Government',
      subtitle: 'Stage 2 Verification',
      num: '2'
    },
    {
      key: 'CENTRAL_MINISTRY',
      title: 'Central Ministry',
      subtitle: 'Stage 3 Final Approval',
      num: '3'
    }
  ];

  const getStageDisplay = (key: AuthorityLevel) => {
    const info = stages[key] || { status: 'PENDING' };
    const isCurrent = currentStage === key;

    let badgeText = 'PENDING';
    let icon = <Clock size={16} />;
    let bg = '#f8fafc';
    let border = '#cbd5e1';
    let text = '#64748b';

    if (info.status === 'COMPLETED') {
      badgeText = 'VERIFIED ✓';
      icon = <CheckCircle2 size={16} color="#166534" />;
      bg = '#f0fdf4';
      border = '#86efac';
      text = '#166534';
    } else if (info.status === 'ACTIVE' || isCurrent) {
      badgeText = 'ACTIVE 🟢';
      icon = <PlayCircle size={16} color="#0284c7" />;
      bg = '#e0f2fe';
      border = '#38bdf8';
      text = '#0369a1';
    } else if (info.status === 'LOCKED') {
      badgeText = 'LOCKED 🔒';
      icon = <Lock size={16} color="#94a3b8" />;
      bg = '#f1f5f9';
      border = '#e2e8f0';
      text = '#94a3b8';
    }

    return { badgeText, icon, bg, border, text, isCurrent };
  };

  return (
    <div style={{
      backgroundColor: 'var(--surface-container-lowest)',
      border: '1px solid var(--outline-variant)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-md) var(--space-lg)',
      marginBottom: 'var(--space-lg)',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--on-surface-variant)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 'var(--space-md)'
      }}>
        Government Statutory Verification Pipeline (3 Stages)
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr auto 1fr',
        alignItems: 'center',
        gap: 'var(--space-sm)'
      }}>
        {stageList.map((st, idx) => {
          const display = getStageDisplay(st.key);
          const isClickable = Boolean(onSelectStage);

          return (
            <React.Fragment key={st.key}>
              <div
                onClick={() => isClickable && onSelectStage && onSelectStage(st.key)}
                style={{
                  backgroundColor: display.bg,
                  border: `2px solid ${display.isCurrent ? '#0a2540' : display.border}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  boxShadow: display.isCurrent ? '0 4px 12px rgba(10, 37, 64, 0.12)' : 'none',
                  position: 'relative'
                }}
              >
                {display.isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '12px',
                    backgroundColor: '#0a2540',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    CURRENT STAGE
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: display.isCurrent ? '#0a2540' : '#e2e8f0',
                    color: display.isCurrent ? '#ffffff' : '#334155',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {st.num}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: display.text }}>
                    {display.icon}
                    <span>{display.badgeText}</span>
                  </div>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
                  {st.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                  {st.subtitle}
                </div>
              </div>

              {idx < stageList.length - 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--outline)' }}>
                  <ArrowRight size={20} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
