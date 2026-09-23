import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Layers,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Send,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  FileCheck,
  Check,
  AlertOctagon,
  XCircle,
  HelpCircle
} from 'lucide-react';
import {
  type ProjectProposal,
  approveProposalAndCreateProject,
  sendProposalClarification
} from '../../data/projectProposalData';
import { getStoredUser } from '../../services/api';

interface ReviewModalProps {
  proposal: ProjectProposal | null;
  isOpen?: boolean;
  onClose: () => void;
  onReviewed?: (updated: ProjectProposal) => void;
  onProposalUpdated?: () => void;
  officerName?: string;
  officerDesignation?: string;
}

export const GovernmentProposalReviewModal: React.FC<ReviewModalProps> = ({
  proposal,
  isOpen = true,
  onClose,
  onReviewed,
  onProposalUpdated,
  officerName: propOfficerName,
  officerDesignation: propOfficerDesignation
}) => {
  const currentUser = getStoredUser();
  const effectiveOfficerName = propOfficerName || currentUser?.name || 'Dr. Rajesh Sharma, IAS';
  const effectiveOfficerDesignation = propOfficerDesignation || currentUser?.role || 'District Collector & Competent Authority (CALA)';

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'GIS_LAND' | 'DOCUMENTS' | 'ACTION'>('OVERVIEW');

  // Clarification form state
  const [clarificationMsg, setClarificationMsg] = useState('');
  const [clarificationAction, setClarificationAction] = useState('Upload revised cadastral DGPS survey map and Form-A schedule.');
  const [approvalNotes, setApprovalNotes] = useState('Approved by Competent Authority under Section 11 RFCTLARR 2013 development corridor.');

  const [isProcessing, setIsProcessing] = useState(false);
  const [actionDoneMsg, setActionDoneMsg] = useState<string | null>(null);

  if (!isOpen || !proposal) return null;

  const handleApprove = () => {
    if (!window.confirm(`Approve proposal "${proposal.title}" and authorize creation of new active infrastructure project in State GIS?`)) {
      return;
    }
    setIsProcessing(true);

    const res = approveProposalAndCreateProject(
      proposal.id,
      effectiveOfficerName,
      effectiveOfficerDesignation,
      approvalNotes
    );

    setIsProcessing(false);
    if (res) {
      setActionDoneMsg(`Proposal Approved! New active project created in GIS: ${res.newProjectId}`);
      if (onReviewed) onReviewed(res.proposal);
      if (onProposalUpdated) onProposalUpdated();
      setTimeout(() => {
        setActionDoneMsg(null);
        onClose();
      }, 2000);
    }
  };

  const handleSendClarification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationMsg.trim()) return;

    setIsProcessing(true);

    const updated = sendProposalClarification(
      proposal.id,
      clarificationMsg.trim(),
      clarificationAction.trim(),
      effectiveOfficerName,
      effectiveOfficerDesignation
    );

    setIsProcessing(false);
    if (updated) {
      setActionDoneMsg('Clarification notice sent to agency. Proposal status updated to "Clarification Required".');
      if (onReviewed) onReviewed(updated);
      if (onProposalUpdated) onProposalUpdated();
      setTimeout(() => {
        setActionDoneMsg(null);
        onClose();
      }, 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 37, 64, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '960px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#0a2540',
          color: '#ffffff',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#059669', color: '#ffffff', padding: '2px 8px', borderRadius: '4px' }}>
                GOVERNMENT OVERSIGHT
              </span>
              <span style={{ fontSize: '12px', color: '#93c5fd' }}>
                {proposal.id}
              </span>
            </div>
            <h2 style={{ margin: '4px 0 2px 0', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              Statutory Review: {proposal.title}
            </h2>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Submitting Agency: <strong>{proposal.agencyDetails.agencyName}</strong> • Submitted: {proposal.submittedDate}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#cbd5e1' }}
          >
            <X size={22} />
          </button>
        </div>

        {actionDoneMsg && (
          <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '12px 24px', fontSize: '13px', fontWeight: 700, borderBottom: '1px solid #bbf7d0' }}>
            ✓ {actionDoneMsg}
          </div>
        )}

        {/* Tab Strip */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '0 24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          {[
            { key: 'OVERVIEW', label: '1. Proposal Charter' },
            { key: 'GIS_LAND', label: `2. GIS & Cadastral Parcels (${proposal.affectedParcels.length})` },
            { key: 'DOCUMENTS', label: `3. Documents (${proposal.documents.length})` },
            { key: 'ACTION', label: '4. Decision & Clarification ⚖️' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              style={{
                padding: '12px 16px',
                border: 'none',
                borderBottom: activeTab === t.key ? '3px solid #0a2540' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === t.key ? '#0a2540' : '#64748b',
                fontWeight: activeTab === t.key ? 800 : 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '18px' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 800, color: '#0a2540' }}>
                    Project Description
                  </h4>
                  <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                    {proposal.projectDescription}
                  </p>

                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 800, color: '#0a2540' }}>
                    Public &amp; Development Purpose
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                    {proposal.publicPurpose}
                  </p>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                  <div style={{ fontWeight: 800, color: '#0a2540', marginBottom: '10px' }}>Financial Estimates</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>Total Cost: <strong>₹{proposal.estimatedTotalCostCr} Cr</strong></div>
                    <div>Land Acquisition Cost: <strong style={{ color: '#9a3412' }}>₹{proposal.landAcquisitionCostCr} Cr</strong></div>
                    <div>Construction: <strong style={{ color: '#059669' }}>₹{proposal.constructionCostCr} Cr</strong></div>
                    <div>Funding Source: <strong>{proposal.fundingSource}</strong></div>
                  </div>
                </div>
              </div>

              {/* Justification */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', fontSize: '12px' }}>
                <div style={{ fontWeight: 800, color: '#0a2540', marginBottom: '8px' }}>Existing Problem &amp; Urgency</div>
                <div style={{ color: '#334155', marginBottom: '8px' }}>{proposal.justification.existingProblem}</div>
                <div style={{ color: '#b91c1c', fontWeight: 600 }}>Consequences if Deferred: {proposal.justification.consequencesIfNotImplemented}</div>
              </div>
            </div>
          )}

          {/* TAB 2: GIS & LAND REQUIREMENT */}
          {activeTab === 'GIS_LAND' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: '#0a2540', color: '#ffffff', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#93c5fd', fontWeight: 700 }}>TOTAL REQUIRED</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{proposal.totalLandRequiredAcres} Ac</div>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#166534', fontWeight: 700 }}>GOVT LAND</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#166534' }}>{proposal.governmentLandRequiredAcres} Ac</div>
                </div>
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fed7aa', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#b45309', fontWeight: 700 }}>PRIVATE LAND</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#9a3412' }}>{proposal.privateLandRequiredAcres} Ac</div>
                </div>
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 700 }}>FOREST LAND</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>{proposal.forestProtectedLandAcres} Ac</div>
                </div>
              </div>

              {/* Parcels Table */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '12px', color: '#0a2540' }}>
                  Intersecting Cadastral Survey Numbers ({proposal.affectedParcels.length})
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        <th style={{ padding: '8px 12px' }}>Survey No</th>
                        <th style={{ padding: '8px 12px' }}>Landowner</th>
                        <th style={{ padding: '8px 12px' }}>Village</th>
                        <th style={{ padding: '8px 12px' }}>Total Area</th>
                        <th style={{ padding: '8px 12px' }}>Affected Area</th>
                        <th style={{ padding: '8px 12px' }}>Land Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.affectedParcels.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{p.surveyNumber}</td>
                          <td style={{ padding: '8px 12px' }}>{p.landownerName}</td>
                          <td style={{ padding: '8px 12px' }}>{p.village}</td>
                          <td style={{ padding: '8px 12px' }}>{p.totalAreaAcres} Ac</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#9a3412' }}>{p.affectedAreaAcres} Ac</td>
                          <td style={{ padding: '8px 12px' }}>{p.landCategory}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === 'DOCUMENTS' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#0a2540', marginBottom: '12px' }}>
                Statutory Documents Submitted by Agency ({proposal.documents.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {proposal.documents.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '10px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} color="#0284c7" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#0a2540' }}>{doc.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {doc.type} • {doc.fileSize} • Uploaded {doc.uploadDate}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#f0fdf4',
                      color: '#166534'
                    }}>
                      ✓ Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DECISION & CLARIFICATION */}
          {activeTab === 'ACTION' && (
            <div>
              {/* Option A: Approve Proposal */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '18px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>
                  <CheckCircle2 size={18} /> Option A: Formally Approve Proposal &amp; Provision Project in GIS
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#15803d' }}>
                  Approving this proposal officially creates the active infrastructure project in both Agency GIS and Government GIS, with all cadastral parcels, corridors, and statutory records initialized.
                </p>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                    Approval Remarks / Gazette Order Ref:
                  </label>
                  <input
                    type="text"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #86efac', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isProcessing}
                  style={{
                    padding: '9px 20px',
                    backgroundColor: '#166534',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(22, 101, 52, 0.3)'
                  }}
                >
                  <Check size={14} /> Approve Proposal &amp; Create Project in GIS
                </button>
              </div>

              {/* Option B: Request Clarification */}
              <form onSubmit={handleSendClarification} style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '8px',
                padding: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>
                  <AlertOctagon size={18} /> Option B: Request Clarification / Additional Documents
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#9f1239' }}>
                  If information, environmental clearances, or survey maps are incomplete, send a formal statutory objection notice to the agency.
                </p>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>
                    Clarification Message *
                  </label>
                  <textarea
                    rows={2}
                    value={clarificationMsg}
                    onChange={(e) => setClarificationMsg(e.target.value)}
                    placeholder="Specify the deficiency (e.g., 'Please upload the revised DGPS survey certificate and MoEFCC clearance affidavit.')..."
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #fca5a5', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>
                    Required Action Required from Agency:
                  </label>
                  <input
                    type="text"
                    value={clarificationAction}
                    onChange={(e) => setClarificationAction(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #fca5a5', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !clarificationMsg.trim()}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#991b1b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: clarificationMsg.trim() ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={13} /> Send Clarification Notice to Agency
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GovernmentProposalReviewModal;
