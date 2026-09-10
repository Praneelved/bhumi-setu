import React, { useState } from 'react';
import { X, AlertTriangle, XCircle, Send } from 'lucide-react';
import type { AuthorityLevel, StageRejectionRecord } from '../../types/governmentVerification';

interface StageRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  stage: AuthorityLevel;
  officerName: string;
  officerId: string;
  onConfirmReject: (rejection: StageRejectionRecord) => void;
}

export const StageRejectionModal: React.FC<StageRejectionModalProps> = ({
  isOpen,
  onClose,
  caseId,
  stage,
  officerName,
  officerId,
  onConfirmReject
}) => {
  if (!isOpen) return null;

  const getStageTitle = () => {
    switch (stage) {
      case 'DISTRICT_COLLECTOR':
        return 'District Collector Verification Rejection';
      case 'STATE_GOVERNMENT':
        return 'State Government Verification Rejection';
      case 'CENTRAL_MINISTRY':
        return 'Central Ministry Verification Rejection';
    }
  };

  const getCategories = () => {
    switch (stage) {
      case 'DISTRICT_COLLECTOR':
        return [
          'Survey Number / Khasra Discrepancy',
          'Area Mismatch with Land Record (7/12)',
          'Incomplete Title Deed or Mutation Record',
          'Cadastral Boundary Geo-fence Overlap',
          'Field Inspection Report Inconclusive',
          'Co-sharer Objection / Unsettled Heirship'
        ];
      case 'STATE_GOVERNMENT':
        return [
          'RFCTLARR Section 11/19 Gazette Notification Defect',
          'Solatium / Additional Compensation Miscalculation',
          'Rehabilitation & Resettlement (R&R) Scheme Inadequate',
          'Public Objections Hearing Summary Deficient',
          'State Revenue Department NOC Missing'
        ];
      case 'CENTRAL_MINISTRY':
        return [
          'MoEFCC Forest Clearance Stage-II Pending',
          'National Infrastructure / CCEA Sanction Order Missing',
          'Inter-Ministerial / Defense Corridor Clearance Discrepancy',
          'Central Treasury Fund DBT Escrow Mismatch',
          'Pending High Court / Supreme Court Stay Order'
        ];
    }
  };

  const categories = getCategories();
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [requiredCorrection, setRequiredCorrection] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !requiredCorrection.trim()) {
      setError('Please provide both an issue description and the required correction.');
      return;
    }

    const now = new Date().toLocaleString();
    const rejectionRecord: StageRejectionRecord = {
      caseId,
      stage,
      authorityLevel: stage,
      officerName,
      officerId,
      timestamp: now,
      issueCategory: category,
      rejectionReason: description.trim(),
      requiredCorrection: requiredCorrection.trim(),
      remarks: remarks.trim() || 'Returned for statutory revision as per administrative mandate.'
    };

    onConfirmReject(rejectionRecord);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        border: '1px solid #fca5a5'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#fef2f2',
          padding: '16px 20px',
          borderBottom: '1px solid #fecaca',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={22} color="#991b1b" />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#991b1b' }}>
                {getStageTitle()}
              </h3>
              <div style={{ fontSize: '12px', color: '#7f1d1d' }}>Case Reference: {caseId}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7f1d1d' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px' }}>
              Issue Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'Arial, Helvetica, sans-serif',
                backgroundColor: '#ffffff'
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px' }}>
              Issue Description / Ground for Rejection *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Survey number 101/2 does not match certified 7/12 extract boundary demarcated by Revenue Inspector..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px' }}>
              Required Correction / Action for Resubmission *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Agency/Landowner must submit updated Joint Measurement Survey sheet signed by Talathi..."
              value={requiredCorrection}
              onChange={(e) => setRequiredCorrection(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px' }}>
              Statutory Officer Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Case returned under Section 15(2) RFCTLARR statutory mandate."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
            />
          </div>

          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#92400e',
            marginBottom: '20px',
            lineHeight: 1.4
          }}>
            <strong>Important Gating Consequence:</strong> Rejection at this stage will lock the case in <strong>REJECTED</strong> status and prevent downstream authorities from reviewing it until corrective documentation is resubmitted.
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                padding: '9px 18px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)'
              }}
            >
              <XCircle size={15} /> Reject & Return to Agency / Landowner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
