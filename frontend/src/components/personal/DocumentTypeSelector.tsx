import React from 'react';
import { FileText } from 'lucide-react';
import type { DocumentType } from '../../types/landownerDocuments';
import { DOCUMENT_TYPE_LABELS } from '../../types/landownerDocuments';

interface Props {
  selected: DocumentType | null;
  onSelect: (type: DocumentType) => void;
  onNext: () => void;
}

const DOCUMENT_TYPES: DocumentType[] = [
  'LAND_OWNERSHIP_RECORD',
  'SALE_DEED',
  'SEVEN_TWELVE_EXTRACT',
  'PROPERTY_CARD',
  'AADHAAR_IDENTITY',
  'LAND_TAX_RECEIPT',
  'CADASTRAL_SURVEY_MAP',
  'BANK_ACCOUNT_CHEQUE',
  'FIELD_INSPECTION_REPORT',
  'OTHER_SUPPORTING'
];

const TYPE_DESCRIPTIONS: Record<DocumentType, string> = {
  LAND_OWNERSHIP_RECORD: 'Original title deed or possession certificate',
  SALE_DEED: 'Registered sale deed or conveyance deed',
  SEVEN_TWELVE_EXTRACT: '7/12 extract from village revenue records',
  PROPERTY_CARD: 'Urban property card (Sanad / Hak Patra)',
  AADHAAR_IDENTITY: 'Aadhaar card or any government photo ID',
  LAND_TAX_RECEIPT: 'Land revenue or property tax payment receipt',
  CADASTRAL_SURVEY_MAP: 'Survey / cadastral map with khasra boundaries',
  BANK_ACCOUNT_CHEQUE: 'Cancelled cheque or bank passbook for DBT',
  FIELD_INSPECTION_REPORT: 'Field Inspection & Physical Verification Report',
  OTHER_SUPPORTING: 'Any other relevant supporting document'
};

export const DocumentTypeSelector: React.FC<Props> = ({ selected, onSelect, onNext }) => {
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#461300', margin: '0 0 6px 0' }}>
          Step 1: Select Document Type
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: 0 }}>
          Choose the type of document you want to upload for land acquisition verification.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '10px',
        marginBottom: '24px'
      }}>
        {DOCUMENT_TYPES.map(type => {
          const isSelected = selected === type;
          return (
            <div
              key={type}
              onClick={() => onSelect(type)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(type)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                border: isSelected ? '2px solid #461300' : '1px solid var(--outline-variant)',
                backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 2px 8px rgba(70,19,0,0.12)' : 'none',
                outline: 'none'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: isSelected ? '#461300' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background-color 0.15s ease'
              }}>
                <FileText size={18} color={isSelected ? '#ffffff' : '#94a3b8'} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: isSelected ? '#461300' : 'var(--on-surface)',
                  marginBottom: '3px'
                }}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--on-surface-variant)',
                  lineHeight: 1.4
                }}>
                  {TYPE_DESCRIPTIONS[type]}
                </div>
              </div>
              {isSelected && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '16px',
                  color: '#461300',
                  flexShrink: 0,
                  alignSelf: 'center'
                }}>✓</span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!selected}
        style={{
          backgroundColor: selected ? '#461300' : '#e2e8f0',
          color: selected ? '#ffffff' : '#94a3b8',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '12px 28px',
          fontSize: '14px',
          fontWeight: 700,
          cursor: selected ? 'pointer' : 'not-allowed',
          fontFamily: 'Arial, Helvetica, sans-serif',
          transition: 'background-color 0.2s ease'
        }}
      >
        Continue to Upload →
      </button>
    </div>
  );
};
