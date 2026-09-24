import React from 'react';
import { X, MapPin, CheckCircle2, AlertCircle, FileText, User, ShieldCheck, Scale } from 'lucide-react';
import type { AffectedProposalParcel } from '../../data/projectProposalData';

interface ParcelDetailModalProps {
  parcel: AffectedProposalParcel | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ParcelDetailModal: React.FC<ParcelDetailModalProps> = ({
  parcel,
  isOpen,
  onClose
}) => {
  if (!isOpen || !parcel) return null;

  const percentageAffected = Math.min(
    100,
    Math.round((parcel.affectedAreaAcres / (parcel.totalAreaAcres || 1)) * 100)
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 37, 64, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0a2540',
            color: '#ffffff',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800
                }}
              >
                CADASTRAL RECORD
              </span>
              <span style={{ fontSize: '12px', color: '#93c5fd' }}>{parcel.id}</span>
            </div>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>
              Survey No. {parcel.surveyNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Landowner Record Strip */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7'
              }}
            >
              <User size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                REGISTERED TITLE HOLDER (JAMABANDI)
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0a2540' }}>
                {parcel.landownerName}
              </div>
              <div style={{ fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <ShieldCheck size={14} /> Title Deed &amp; 7/12 Extract Verified in Revenue Database
              </div>
            </div>
          </div>

          {/* Location & Jurisdiction */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              padding: '12px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Village</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0a2540' }}>{parcel.village}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Taluka / Tahsil</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0a2540' }}>{parcel.taluka}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>District</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0a2540' }}>{parcel.district}</div>
            </div>
          </div>

          {/* Area Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px'
            }}
          >
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Total Survey Area</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0a2540', marginTop: '2px' }}>
                {parcel.totalAreaAcres} Acres
              </div>
            </div>
            <div style={{ border: '1px solid #fed7aa', backgroundColor: '#fffbeb', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700 }}>Affected by Project</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#9a3412', marginTop: '2px' }}>
                {parcel.affectedAreaAcres} Acres
              </div>
              <div style={{ fontSize: '10px', color: '#c2410c' }}>({percentageAffected}% of parcel)</div>
            </div>
            <div style={{ border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>Est. Compensation</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                ₹{parcel.estimatedCompensationCr} Cr
              </div>
              <div style={{ fontSize: '10px', color: '#166534' }}>RFCTLARR 2013 Matrix</div>
            </div>
          </div>

          {/* Land Category & Verification Details */}
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Land Classification:</span>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '11px',
                  backgroundColor: parcel.landCategory === 'Government Revenue' ? '#f0fdf4' : '#fffbeb',
                  color: parcel.landCategory === 'Government Revenue' ? '#166534' : '#b45309',
                  border: `1px solid ${parcel.landCategory === 'Government Revenue' ? '#bbf7d0' : '#fed7aa'}`
                }}
              >
                {parcel.landCategory}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Khasra / Gatsankhya:</span>
              <strong style={{ color: '#0a2540' }}>{parcel.khasraNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Spatial Alignment Status:</span>
              <span style={{ color: '#0284c7', fontWeight: 700 }}>Intersected with RoW Corridor</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Sub-Registrar Mutation:</span>
              <span style={{ color: '#166534', fontWeight: 700 }}>Clean Title (No Encumbrance)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              backgroundColor: '#0a2540',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
