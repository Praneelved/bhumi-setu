import React from 'react';

interface Props {
  currentStep: number; // 1–5
}

const STEPS = [
  { number: 1, label: 'Select' },
  { number: 2, label: 'Upload' },
  { number: 3, label: 'Review' },
  { number: 4, label: 'Submit' },
  { number: 5, label: 'Status' }
];

export const UploadStepIndicator: React.FC<Props> = ({ currentStep }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '28px',
      padding: '0 8px',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        return (
          <React.Fragment key={step.number}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: isCompleted ? '#166534' : isActive ? '#461300' : '#e2e8f0',
                color: isCompleted || isActive ? '#ffffff' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '15px',
                border: isActive ? '3px solid #9a3412' : '3px solid transparent',
                boxSizing: 'border-box',
                transition: 'all 0.25s ease',
                flexShrink: 0
              }}>
                {isCompleted ? '✓' : step.number}
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#461300' : isCompleted ? '#166534' : '#94a3b8',
                whiteSpace: 'nowrap'
              }}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: '3px',
                minWidth: '16px',
                margin: '0 4px',
                marginBottom: '20px',
                backgroundColor: currentStep > step.number ? '#166534' : '#e2e8f0',
                transition: 'background-color 0.3s ease',
                borderRadius: '2px'
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
