import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Download,
  Info
} from 'lucide-react';
import {
  type ProjectProposal,
  type ProposalWorkflowStage,
  type AffectedProposalParcel,
  submitOrUpdateProposal
} from '../../data/projectProposalData';
import { ParcelDetailModal } from './ParcelDetailModal';

interface DetailModalProps {
  proposal: ProjectProposal | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: ProjectProposal) => void;
  isGovernmentView?: boolean;
}

export const ProposalDetailModal: React.FC<DetailModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onUpdate,
  isGovernmentView = false
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'GIS_LAND' | 'FINANCIALS' | 'DOCUMENTS' | 'TIMELINE'>('OVERVIEW');
  const [agencyReply, setAgencyReply] = useState<string>('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  const [inspectedParcel, setInspectedParcel] = useState<AffectedProposalParcel | null>(null);

  if (!isOpen || !proposal) return null;

  // Handle Agency responding to Government clarification
  const handleResubmitWithClarification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyReply.trim()) return;

    const now = new Date().toLocaleString();
    const updatedClarifications = (proposal.clarificationRequests || []).map((clr, i) => {
      if (i === 0) {
        return {
          ...clr,
          agencyResponse: agencyReply.trim(),
          responseDate: now,
          resolved: true
        };
      }
      return clr;
    });

    const updated: ProjectProposal = {
      ...proposal,
      status: 'Submitted – Pending Government Review',
      currentWorkflowStage: 'GOVERNMENT_REVIEW',
      lastUpdated: now,
      clarificationRequests: updatedClarifications
    };

    submitOrUpdateProposal(updated);
    onUpdate(updated);
    setActionSuccessNotice('Clarification response submitted. Proposal status updated to "Submitted – Pending Government Review".');
    setAgencyReply('');
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  const isRejected = proposal.status === 'Rejected' || proposal.currentWorkflowStage === 'REJECTED';
  const isApproved = proposal.status === 'Approved' || proposal.currentWorkflowStage === 'PROJECT_CREATED';

  // Workflow timeline steps
  const timelineSteps: { key: ProposalWorkflowStage; label: string }[] = [
    { key: 'PROPOSAL_CREATED', label: 'Proposal Created' },
    { key: 'SUBMITTED_TO_GOVERNMENT', label: 'Submitted to Government' },
    { key: 'GOVERNMENT_REVIEW', label: 'Government Review' },
    { key: 'CLARIFICATION_VERIFICATION', label: 'Clarification / Verification' },
    { key: 'APPROVED', label: isRejected ? 'Rejected' : 'Approved' },
    { key: 'PROJECT_CREATED', label: 'Project Created in GIS' }
  ];

  const getStepIndex = (stage: ProposalWorkflowStage) => {
    if (stage === 'REJECTED') return 4;
    return timelineSteps.findIndex(s => s.key === stage);
  };

  const currentStepIdx = getStepIndex(proposal.currentWorkflowStage);

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
        maxWidth: '1000px',
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
          alignItems: 'flex-start',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '4px' }}>
                {proposal.id}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: proposal.status === 'Approved' ? '#059669' : proposal.status === 'Clarification Required' ? '#dc2626' : '#d97706',
                color: '#ffffff'
              }}>
                {proposal.status}
              </span>
            </div>
            <h2 style={{ margin: '6px 0 2px 0', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              {proposal.title}
            </h2>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Type: <strong>{proposal.projectType}</strong> • Submitted: <strong>{proposal.submittedDate}</strong> • Agency: <strong>{proposal.agencyDetails.agencyName}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#cbd5e1' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Workflow Timeline Strip */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflowX: 'auto'
        }}>
          {timelineSteps.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isCompleted || isCurrent ? 1 : 0.5 }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#059669' : isCurrent ? '#0a2540' : '#cbd5e1',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span style={{ fontSize: '11px', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#0a2540' : '#475569', whiteSpace: 'nowrap' }}>
                  {step.label}
                </span>
                {idx < timelineSteps.length - 1 && (
                  <div style={{ width: '20px', height: '2px', backgroundColor: isCompleted ? '#059669' : '#cbd5e1', margin: '0 4px' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Action Success Alert */}
        {actionSuccessNotice && (
          <div style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', color: '#166534', padding: '10px 24px', fontSize: '12px', fontWeight: 700 }}>
            ✓ {actionSuccessNotice}
          </div>
        )}

        {/* REJECTED BANNER (If Active) */}
        {isRejected && (
          <div style={{
            backgroundColor: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            padding: '16px 24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991b1b', fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>
              <AlertOctagon size={16} /> Proposal Rejected by Government Authority:
            </div>
            <div style={{ fontSize: '12px', color: '#7f1d1d', marginBottom: '6px', lineHeight: 1.5 }}>
              "{proposal.governmentReviewNotes || 'Proposal rejected by Competent Authority under statutory provisions.'}"
            </div>
            {proposal.reviewedByOfficer && (
              <div style={{ fontSize: '11px', color: '#991b1b' }}>
                Reviewed by: <strong>{proposal.reviewedByOfficer}</strong> • Updated: {proposal.lastUpdated}
              </div>
            )}
          </div>
        )}

        {/* CLARIFICATION REQUIRED BANNER (If Active) */}
        {proposal.status === 'Clarification Required' && proposal.clarificationRequests?.[0] && !proposal.clarificationRequests[0].resolved && (
          <div style={{
            backgroundColor: '#fff1f2',
            borderBottom: '1px solid #fecdd3',
            padding: '16px 24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991b1b', fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>
              <AlertOctagon size={16} /> Government Clarification Requested:
            </div>
            <div style={{ fontSize: '12px', color: '#881337', marginBottom: '8px', lineHeight: 1.5 }}>
              "{proposal.clarificationRequests[0].message}"
            </div>
            <div style={{ fontSize: '11px', color: '#9f1239', marginBottom: '12px' }}>
              Requested by <strong>{proposal.clarificationRequests[0].officerName}</strong> ({proposal.clarificationRequests[0].officerDesignation}) on {proposal.clarificationRequests[0].requestedDate}
            </div>

            {!isGovernmentView && (
              <form onSubmit={handleResubmitWithClarification} style={{ marginTop: '10px' }}>
                <textarea
                  rows={2}
                  value={agencyReply}
                  onChange={(e) => setAgencyReply(e.target.value)}
                  placeholder="Type agency clarification response or details of revised reports uploaded..."
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #fca5a5', fontSize: '12px', boxSizing: 'border-box', marginBottom: '8px' }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#991b1b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={13} /> Submit Clarification &amp; Resubmit Proposal
                </button>
              </form>
            )}
          </div>
        )}

        {/* APPROVED BANNER (If Active) */}
        {proposal.status === 'Approved' && (
          <div style={{
            backgroundColor: '#f0fdf4',
            borderBottom: '1px solid #bbf7d0',
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} color="#166534" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>
                  Project Proposal Formally Approved by Competent Authority
                </div>
                <div style={{ fontSize: '11px', color: '#15803d' }}>
                  {proposal.governmentReviewNotes || 'Statutory RFCTLARR Land Acquisition scheme approved.'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                navigate('/agency/gis');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
              }}
            >
              <MapPin size={14} /> Open in Agency GIS Map <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '0 24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff'
        }}>
          {[
            { key: 'OVERVIEW', label: 'Overview & Objectives' },
            { key: 'GIS_LAND', label: `Location & Land (${proposal.totalLandRequiredAcres} Ac)` },
            { key: 'FINANCIALS', label: `Cost (₹${proposal.estimatedTotalCostCr} Cr)` },
            { key: 'DOCUMENTS', label: `Documents (${proposal.documents.length})` },
            { key: 'TIMELINE', label: `Phases (${proposal.implementationPhases.length})` }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              style={{
                padding: '12px 14px',
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

        {/* Body Content */}
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
                    Public &amp; Development Objective
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                    {proposal.projectObjective}
                  </p>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                  <div style={{ fontWeight: 800, color: '#0a2540', marginBottom: '8px' }}>Proposal Parameters</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>Category: <strong>{proposal.projectCategory}</strong></div>
                    <div>Priority: <strong style={{ color: '#0284c7' }}>{proposal.projectPriority}</strong></div>
                    <div>Duration: <strong>{proposal.estimatedDurationMonths} Months</strong></div>
                    <div>Proposed Timeline: <strong>{proposal.proposedStartDate}</strong> to <strong>{proposal.proposedCompletionDate}</strong></div>
                  </div>
                </div>
              </div>

              {/* Justification Matrix */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 800, color: '#0a2540' }}>
                  Statutory Public Interest Justification
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#64748b' }}>Existing Problem:</span>
                    <div style={{ marginTop: '2px', color: '#334155' }}>{proposal.justification.existingProblem}</div>
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: '#64748b' }}>Proposed Solution:</span>
                    <div style={{ marginTop: '2px', color: '#334155' }}>{proposal.justification.proposedSolution}</div>
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: '#64748b' }}>Public Benefit:</span>
                    <div style={{ marginTop: '2px', color: '#334155' }}>{proposal.justification.publicBenefit}</div>
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: '#b91c1c' }}>Consequences if Deferred:</span>
                    <div style={{ marginTop: '2px', color: '#991b1b' }}>{proposal.justification.consequencesIfNotImplemented}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GIS & LAND REQUIREMENT */}
          {activeTab === 'GIS_LAND' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '18px'
              }}>
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

              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px' }}>
                Location: <strong>{proposal.village}</strong>, Taluka: <strong>{proposal.taluka}</strong>, District: <strong>{proposal.district}, {proposal.state}</strong> • Address: <strong>{proposal.projectAddress}</strong> (PIN: {proposal.pinCode})
              </div>

              {/* Affected Parcels Schedule */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '12px', color: '#0a2540' }}>
                  Identified Cadastral Land Parcels ({proposal.affectedParcels.length})
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        <th style={{ padding: '8px 12px' }}>Parcel ID</th>
                        <th style={{ padding: '8px 12px' }}>Survey No</th>
                        <th style={{ padding: '8px 12px' }}>Landowner</th>
                        <th style={{ padding: '8px 12px' }}>Holding</th>
                        <th style={{ padding: '8px 12px' }}>Affected Area</th>
                        <th style={{ padding: '8px 12px' }}>Category</th>
                        <th style={{ padding: '8px 12px' }}>Est. Compensation</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.affectedParcels.map(p => (
                        <tr
                          key={p.id}
                          onClick={() => setInspectedParcel(p)}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title="Click to view cadastral parcel details"
                        >
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0284c7' }}>{p.id}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{p.surveyNumber}</td>
                          <td style={{ padding: '8px 12px' }}>{p.landownerName}</td>
                          <td style={{ padding: '8px 12px' }}>{p.totalAreaAcres} Ac</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#9a3412' }}>{p.affectedAreaAcres} Ac</td>
                          <td style={{ padding: '8px 12px' }}>{p.landCategory}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#166534' }}>₹{p.estimatedCompensationCr} Cr</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectedParcel(p);
                              }}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#0a2540',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIALS */}
          {activeTab === 'FINANCIALS' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <div style={{ fontWeight: 800, color: '#0a2540', marginBottom: '12px' }}>Capital Expenditure Schedule</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Estimated Total Cost:</span>
                    <strong style={{ fontSize: '16px', color: '#0a2540' }}>₹{proposal.estimatedTotalCostCr} Cr</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Land Acquisition &amp; Solatium:</span>
                    <strong style={{ color: '#9a3412' }}>₹{proposal.landAcquisitionCostCr} Cr</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Civil Construction Cost:</span>
                    <strong style={{ color: '#059669' }}>₹{proposal.constructionCostCr} Cr</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Contingency &amp; Statutory Fees:</span>
                    <strong style={{ color: '#475569' }}>₹{proposal.otherEstimatedCostCr} Cr</strong>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <div style={{ fontWeight: 800, color: '#0a2540', marginBottom: '12px' }}>Funding &amp; Treasury Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Funding Model:</span>
                    <div style={{ fontWeight: 800, color: '#0284c7' }}>{proposal.fundingSource}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Allocation Particulars:</span>
                    <div style={{ color: '#334155' }}>{proposal.fundingDetails}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {activeTab === 'DOCUMENTS' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#0a2540', marginBottom: '12px' }}>
                Attached Statutory Documents ({proposal.documents.length})
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
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TIMELINE */}
          {activeTab === 'TIMELINE' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#0a2540', marginBottom: '12px' }}>
                Phased Implementation Milestones ({proposal.implementationPhases.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {proposal.implementationPhases.map(ph => (
                  <div
                    key={ph.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0a2540' }}>
                        Phase {ph.phaseNumber}: {ph.phaseName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        {ph.description}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>
                      {ph.startDate} → {ph.endDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Authorized Signatory: <strong>{proposal.authorizedSignatoryName}</strong> ({proposal.authorizedSignatoryDesignation})
          </div>
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
            Close Dossier
          </button>
        </div>
      </div>

      {/* Cadastral Parcel Detail Modal */}
      <ParcelDetailModal
        parcel={inspectedParcel}
        isOpen={!!inspectedParcel}
        onClose={() => setInspectedParcel(null)}
      />
    </div>
  );
};

export default ProposalDetailModal;
