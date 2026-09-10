import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, CheckCircle2, XCircle, AlertCircle, FileCheck, 
  Coins, Users, ShieldCheck, Scale, ArrowRight, Eye, Calendar, Award,
  TreePine, AlertTriangle, X, RefreshCw, RotateCcw
} from 'lucide-react';
import type { 
  VerificationCase, GovernmentOfficer, StageRejectionRecord, VerificationDocument
} from '../../types/governmentVerification';
import { DEFAULT_OFFICERS } from '../../mock/governmentMockData';
import { 
  fetchVerificationCase,
  toggleStateCheck,
  approveStateStage,
  rejectStateStage,
  resetVerificationCase
} from '../../services/verificationApi';
import { fetchProjectConstraints, updateZoneClearance } from '../../services/api';
import type { ProjectConstraintsReport, ZoneIntersection, ClearanceReviewStatus } from '../../services/api';
import { OfficerHeaderBanner } from '../../components/government/OfficerHeaderBanner';
import { StageProgressIndicator } from '../../components/government/StageProgressIndicator';
import { VerificationChecklist } from '../../components/government/VerificationChecklist';
import { StageRejectionModal } from '../../components/government/StageRejectionModal';
import { VerificationHistoryTimeline } from '../../components/government/VerificationHistoryTimeline';
import { LockedStageCard } from '../../components/government/LockedStageCard';
import { DocumentViewerModal } from '../../components/government/DocumentViewerModal';
import { ViaSocketNotificationToast } from '../../components/government/ViaSocketNotificationToast';

export const StateVerificationPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [currentCase, setCurrentCase] = useState<VerificationCase | null>(null);
  const [activeDocument, setActiveDocument] = useState<VerificationDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionToastEvent, setRejectionToastEvent] = useState<any>(null);
  const [approvalSuccessMsg, setApprovalSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // GIS Constraints & Clearance Review State
  const [gisReport, setGisReport] = useState<ProjectConstraintsReport | null>(null);
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneIntersection | null>(null);
  const [clearanceStatus, setClearanceStatus] = useState<ClearanceReviewStatus>('UNDER_REVIEW');
  const [clearanceRef, setClearanceRef] = useState('');
  const [clearanceRemarks, setClearanceRemarks] = useState('');
  const [isUpdatingClearance, setIsUpdatingClearance] = useState(false);

  const officer: GovernmentOfficer = DEFAULT_OFFICERS.STATE_GOVERNMENT;

  const loadCase = useCallback(async () => {
    if (!caseId) return;
    try {
      const data = await fetchVerificationCase(caseId);
      setCurrentCase(data);
    } catch (err: any) {
      console.error('Error fetching state verification case:', err);
    }
  }, [caseId]);

  useEffect(() => {
    loadCase();
    fetchProjectConstraints('prj-mpe-01').then(setGisReport).catch(() => {});
  }, [loadCase]);

  if (!currentCase) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '24px', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <h2 style={{ color: 'var(--primary)' }}>Loading State Government Verification...</h2>
        <p style={{ color: 'var(--on-surface-variant)' }}>Connecting to State Secretariat revenue register for {caseId || 'case'}...</p>
        <button
          type="button"
          onClick={() => navigate('/government/dashboard')}
          style={{ backgroundColor: '#0a2540', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Strict Sequential Gating Check: District must be COMPLETED
  const isDistrictApproved = currentCase.stages.DISTRICT_COLLECTOR?.status === 'COMPLETED';
  if (!isDistrictApproved) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-lg)' }}>
        <OfficerHeaderBanner
          currentOfficer={officer}
          onSwitchAuthority={(lvl) => {
            if (lvl === 'DISTRICT_COLLECTOR') navigate(`/government/verification/district/${currentCase.id}`);
            else if (lvl === 'CENTRAL_MINISTRY') navigate(`/government/verification/central/${currentCase.id}`);
          }}
        />
        <LockedStageCard currentCase={currentCase} attemptedStage="STATE_GOVERNMENT" />
      </div>
    );
  }

  const { stateData } = currentCase;
  const checklist = stateData.checklist;
  const passedCount = checklist.filter(c => c.verified).length;
  const totalChecks = checklist.length;
  const allChecksPassed = passedCount === totalChecks;

  // Handle individual checklist toggle
  const handleToggleCheck = async (checkId: string) => {
    const item = checklist.find(c => c.id === checkId);
    const nextVal = !item?.verified;
    try {
      const updated = await toggleStateCheck(currentCase.id, checkId, officer, nextVal);
      setCurrentCase(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle state check');
    }
  };

  // Handle Approve & Forward to Central
  const handleApproveState = async () => {
    if (!allChecksPassed) return;
    setActionLoading(true);
    try {
      const remarks = 'State Government verified statutory notifications under RFCTLARR Act 2013, approved 100% Solatium and compensation award calculation, and sanctioned R&R scheme. Forwarded to Central Ministry for Final Gazette Award.';
      const updated = await approveStateStage(currentCase.id, officer, remarks);
      setCurrentCase(updated);
      setApprovalSuccessMsg('✓ State Verification Approved! The case has been successfully forwarded to Central Ministry Verification.');
      setTimeout(() => {
        navigate(`/government/verification/central/${currentCase.id}`);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'State approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Rejection
  const handleConfirmReject = async (rejection: StageRejectionRecord) => {
    setActionLoading(true);
    try {
      const updated = await rejectStateStage(currentCase.id, rejection);
      setCurrentCase(updated);
      setIsRejectModalOpen(false);
      setRejectionToastEvent({
        caseId: currentCase.id,
        documentName: 'State Compliance & Compensation Award',
        rejectedBy: officer.name,
        authorityLevel: 'STATE_GOVERNMENT',
        reason: rejection.rejectionReason,
        issueCategory: rejection.issueCategory,
        timestamp: rejection.timestamp
      });
    } catch (err: any) {
      alert(err.message || 'State rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetCase = async () => {
    if (!window.confirm('Reset this verification case back to initial District-pending state?')) return;
    try {
      const updated = await resetVerificationCase(currentCase.id);
      setCurrentCase(updated);
      navigate(`/government/verification/district/${currentCase.id}`);
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    }
  };

  const handleOpenDocViewer = (doc: VerificationDocument) => {
    setActiveDocument(doc);
    setIsViewerOpen(true);
  };


  const handleOpenClearance = (zone: ZoneIntersection) => {
    setSelectedZone(zone);
    setClearanceStatus(zone.review_status);
    setClearanceRef(zone.clearance_reference_no || '');
    setClearanceRemarks(zone.remarks || '');
    setClearanceModalOpen(true);
  };

  const handleSaveClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;
    setIsUpdatingClearance(true);
    try {
      const updated = await updateZoneClearance('prj-mpe-01', {
        zone_id: selectedZone.zone_id,
        review_status: clearanceStatus,
        clearance_reference_no: clearanceRef,
        remarks: clearanceRemarks,
        cleared_by_officer: officer.name
      });
      setGisReport(updated);
      setClearanceModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update clearance');
    } finally {
      setIsUpdatingClearance(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1350px',
      margin: '0 auto',
      padding: 'var(--space-lg)',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: 'var(--on-background)'
    }}>
      {/* Toast */}
      {rejectionToastEvent && (
        <ViaSocketNotificationToast
          event={rejectionToastEvent}
          onDismiss={() => setRejectionToastEvent(null)}
        />
      )}

      {/* Officer Header */}
      <OfficerHeaderBanner
        currentOfficer={officer}
        onSwitchAuthority={(lvl) => {
          if (lvl === 'DISTRICT_COLLECTOR') navigate(`/government/verification/district/${currentCase.id}`);
          else if (lvl === 'CENTRAL_MINISTRY') navigate(`/government/verification/central/${currentCase.id}`);
        }}
      />

      {/* Navigation Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: 'var(--on-surface-variant)',
        marginBottom: '16px'
      }}>
        <button
          type="button"
          onClick={() => navigate('/government/dashboard')}
          style={{ background: 'none', border: 'none', color: '#0a2540', fontWeight: 700, cursor: 'pointer', padding: 0 }}
        >
          ← Government Dashboard
        </button>
        <span>/</span>
        <span>Case {currentCase.id}</span>
        <span>/</span>
        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Stage 2: State Government Verification</span>
      </div>

      {/* Stage Progress Indicator */}
      <StageProgressIndicator
        currentStage="STATE_GOVERNMENT"
        stages={currentCase.stages}
      />

      {/* Rejection Banner if rejected */}
      {currentCase.overallStatus === 'REJECTED' && currentCase.activeRejection && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <XCircle size={22} color="#dc2626" style={{ marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>
              State Verification Issue — Case Returned for Correction
            </div>
            <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '4px' }}>
              <strong>Category:</strong> {currentCase.activeRejection.issueCategory} • <strong>Reason:</strong> {currentCase.activeRejection.rejectionReason}
            </div>
            <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px', fontWeight: 600 }}>
              <strong>Required Resubmission Action:</strong> {currentCase.activeRejection.requiredCorrection}
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {approvalSuccessMsg && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '20px',
          color: '#166534',
          fontWeight: 700,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} color="#166534" />
          {approvalSuccessMsg}
        </div>
      )}

      {/* Certified District Approval Prerequisite Card */}
      <div style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={24} color="#166534" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>
              Stage 1 Prerequisite Satisfied
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#166534' }}>
              DISTRICT COLLECTOR VERIFICATION • COMPLETED & CERTIFIED ✓
            </div>
            <div style={{ fontSize: '12px', color: '#14532d', marginTop: '2px' }}>
              Verified By: <strong>{currentCase.stages.DISTRICT_COLLECTOR.verifiedBy || stateData.districtApprovedBy || 'District Collector (Dr. Rajesh Sharma, IAS)'}</strong>
              {currentCase.stages.DISTRICT_COLLECTOR.verifiedAt && ` on ${currentCase.stages.DISTRICT_COLLECTOR.verifiedAt}`}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/government/verification/district/${currentCase.id}`)}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #86efac',
            color: '#166534',
            padding: '8px 14px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          View District Certificate →
        </button>
      </div>

      {/* Case Overview Banner */}
      <div style={{
        backgroundColor: '#0a2540',
        color: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(10, 37, 64, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Stage 2 • State Land Acquisition & Revenue Authority Review
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '6px 0 2px 0' }}>
              {currentCase.projectName}
            </h1>
            <div style={{ fontSize: '13px', color: '#e0f2fe' }}>
              State Secretariat: {officer.department} • Statutory State Review
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase' }}>Case ID</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>{currentCase.id}</div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Parcels: {currentCase.totalParcels} | Affected Families: {stateData.affectedFamiliesCount}</div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: '24px' }}>
        {/* Left Column: State Review Cards */}
        <div>
          {/* Section 1: Project Validation & Public Purpose */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <Building2 size={18} color="#0a2540" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                1. State Project Validation & Public Purpose
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Project Purpose</span>
                <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{stateData.projectPurpose}</span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Project Category</span>
                <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{stateData.projectCategory}</span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Implementing Agency</span>
                <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{stateData.projectAgency}</span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>State Gazette Ref</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{stateData.stateGazetteNotificationRef}</span>
              </div>
              <div style={{ gridColumn: 'span 2', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
                <strong>State Infrastructure Requirement:</strong> {stateData.projectRequirement}
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Compliance & Notifications */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <Scale size={18} color="#0a2540" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                2. RFCTLARR 2013 Statutory Compliance & Gazette Notifications
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Section 11(1) Preliminary Notification</span>
                <span style={{ fontWeight: 700, color: '#166534', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Published on {stateData.rfctlarrSection11Date}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Section 19 Declaration of Acquisition</span>
                <span style={{ fontWeight: 700, color: '#166534', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Published on {stateData.section19DeclarationDate}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Section 15 Public Hearing Objections</span>
                <span style={{ fontWeight: 600, color: '#166534' }}>Hearings Completed • Objections Disposed</span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>SIA Appraisal Committee Approval</span>
                <span style={{ fontWeight: 600, color: '#166534' }}>Unanimously Approved</span>
              </div>
            </div>
          </div>

          {/* Section 3: Compensation Review & Solatium Calculation */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <Coins size={18} color="#0a2540" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                3. Statutory Compensation Assessment & Solatium Matrix
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Market Valuation Rate</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>₹{stateData.landValuationRatePerAcre.toLocaleString('en-IN')} / Acre</span>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Basic Land Valuation</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>₹{stateData.basicMarketValueCr} Crores</span>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                <span style={{ color: '#15803d', fontSize: '11px', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Mandatory 100% Solatium (Sec 30)</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#166534' }}>₹{stateData.solatiumAmountCr} Crores (100%)</span>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                <span style={{ color: '#15803d', fontSize: '11px', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>12% Additional Compensation (Sec 30(3))</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#166534' }}>₹{stateData.additionalInterestCr} Crores</span>
              </div>

              <div style={{ gridColumn: 'span 2', backgroundColor: '#0a2540', color: '#ffffff', padding: '14px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700 }}>Total Statutory Compensation Award (Escrow Sanctioned)</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>₹{stateData.totalAwardPackageCr} Crores</div>
                </div>
                <span style={{ backgroundColor: '#166534', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                  Statutorily Cleared ✓
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Rehabilitation & Resettlement (R&R) */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <Users size={18} color="#0a2540" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                4. Rehabilitation & Resettlement (R&R) Scheme Review
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Total Project Affected Families</span>
                <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{stateData.affectedFamiliesCount} Families</span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Physically Displaced Families</span>
                <span style={{ fontWeight: 700, color: '#b45309' }}>{stateData.displacedFamiliesCount} Families</span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Rehabilitation Colony Allotment</span>
                <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{stateData.rehabilitationColonyLocation}</span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>One-time Subsistence Allowance</span>
                <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>₹{stateData.subsistenceGrantPerFamily.toLocaleString('en-IN')} / Family</span>
              </div>
              <div style={{ gridColumn: 'span 2', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '4px', border: '1px solid #bbf7d0', fontSize: '12px', color: '#166534' }}>
                ✓ State R&R Commissionerate has sanctioned the integrated township layout and skill development entitlement funds.
              </div>
            </div>
          </div>

          {/* Section 5: GIS Environmental Compliance & Compensatory Afforestation */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TreePine size={18} color="#15803d" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                  5. GIS Environmental Compliance &amp; Compensatory Afforestation
                </h3>
              </div>
              {gisReport && (
                <span style={{
                  backgroundColor: gisReport.overall_risk_level === 'HIGH' ? '#fff7ed' : '#f0fdf4',
                  color: gisReport.overall_risk_level === 'HIGH' ? '#c2410c' : '#166534',
                  border: `1px solid ${gisReport.overall_risk_level === 'HIGH' ? '#fed7aa' : '#bbf7d0'}`,
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <AlertTriangle size={11} /> {gisReport.overall_risk_level} ENVIRONMENTAL RISK
                </span>
              )}
            </div>

            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
              State Forest Department &amp; Development Authority restricted zone overlap verification for alignment corridor ({gisReport?.total_corridor_area_ha || 38.5} Ha):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {gisReport?.intersections.map(iz => (
                <div
                  key={iz.id}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: `4px solid ${iz.color_hex || '#15803d'}`,
                    padding: '10px 12px',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>
                      {iz.zone_name} ({iz.zone_type})
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Overlap: <strong>{iz.intersection_area_ha} Ha</strong> ({iz.percentage_affected}%) • Authority: {iz.authority}
                    </div>
                    {iz.clearance_reference_no && (
                      <div style={{ fontSize: '10px', color: '#166534', fontWeight: 600, marginTop: '2px' }}>
                        State NOC / Ref: {iz.clearance_reference_no}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{
                      backgroundColor: iz.review_status === 'CLEARED' ? '#dcfce7' : iz.review_status === 'CONDITIONAL_CLEARANCE' ? '#fef9c3' : '#e0f2fe',
                      color: iz.review_status === 'CLEARED' ? '#15803d' : iz.review_status === 'CONDITIONAL_CLEARANCE' ? '#854d0e' : '#0369a1',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {iz.review_status.replace('_', ' ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenClearance(iz)}
                      style={{
                        padding: '3px 8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#0a2540',
                        cursor: 'pointer'
                      }}
                    >
                      Update State NOC
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '10px', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '6px 10px', borderRadius: '4px' }}>
              ℹ️ <strong>Demo/Mock Layer Notice:</strong> Environmental layers are decision support integrations and ready for authoritative state GIS gateway APIs.
            </div>
          </div>

          {/* Section 6: District Collector Signoff & Original Land Records */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <FileCheck size={18} color="#0a2540" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                6. District Collector Signoff & Original Landowner Documents
              </h3>
            </div>

            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '4px', marginBottom: '14px', fontSize: '12px', color: '#166534' }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> District Collector Verification Certified & Approved
              </div>
              <div style={{ marginTop: '4px' }}>
                Signoff Officer: <strong>{currentCase.stages.DISTRICT_COLLECTOR.verifiedBy || 'Dr. Rajesh Sharma, IAS (District Collector)'}</strong> • Date: {currentCase.stages.DISTRICT_COLLECTOR.verifiedAt || '10 Sep 2026'}
              </div>
              <div style={{ marginTop: '2px', color: '#15803d' }}>
                Remarks: {currentCase.stages.DISTRICT_COLLECTOR.remarks || 'District Collector certified all land records and physical inspection reports.'}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
              State officers can open and inspect the original landowner-uploaded documents verified by the District Collector:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentCase.documents.map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '4px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#0a2540' }}>{doc.title}</span>
                    <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>v{doc.version} • {doc.totalPages} pages • {doc.status}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenDocViewer(doc)}
                    style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#0a2540', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Eye size={12} /> View Document
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Right Column: State Checklist & Gated Action Bar */}
        <div>
          {/* Mandatory Checklist Card */}
          <VerificationChecklist
            title="State Verification Checklist"
            subtitle="Verify state-level statutory notifications, compensation award calculations, and R&R sanctions."
            stageName="STATE_GOVERNMENT"
            items={checklist}
            onToggleCheck={handleToggleCheck}
            readOnly={currentCase.stages.STATE_GOVERNMENT.status === 'COMPLETED'}
          />

          {/* Verification Summary & Gated Final Actions */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 14px 0' }}>
              State Verification Summary
            </h3>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '18px',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--outline)' }}>State Checks Passed:</span>
                <span style={{ fontWeight: 700, color: allChecksPassed ? '#166534' : '#d97706' }}>
                  {passedCount} / {totalChecks}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--outline)' }}>Prior District Clearance:</span>
                <span style={{ fontWeight: 700, color: '#166534' }}>Certified ✓</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--outline)' }}>Solatium Compliance:</span>
                <span style={{ fontWeight: 700, color: '#166534' }}>100% Solatium Verified</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--outline)' }}>State Issues:</span>
                <span style={{ fontWeight: 700, color: currentCase.overallStatus === 'REJECTED' ? '#dc2626' : '#166534' }}>
                  {currentCase.overallStatus === 'REJECTED' ? '1 (Correction Required)' : '0'}
                </span>
              </div>
            </div>

            {/* Gated Rule Warning */}
            {!allChecksPassed && currentCase.stages.STATE_GOVERNMENT.status !== 'COMPLETED' && (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                padding: '10px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#92400e',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>Approval remains locked until all 8 mandatory state checks are passed.</span>
              </div>
            )}

            {/* Final Action Buttons */}
            {currentCase.stages.STATE_GOVERNMENT.status === 'COMPLETED' ? (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ color: '#166534', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <CheckCircle2 size={18} /> State Government Verification Completed
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                  Approved by {currentCase.stages.STATE_GOVERNMENT.verifiedBy || officer.name} on {currentCase.stages.STATE_GOVERNMENT.verifiedAt}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/government/verification/central/${currentCase.id}`)}
                  style={{
                    marginTop: '12px',
                    backgroundColor: '#0a2540',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Proceed to Central Ministry Verification →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  disabled={!allChecksPassed}
                  onClick={handleApproveState}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: allChecksPassed ? '#166534' : '#cbd5e1',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: allChecksPassed ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: allChecksPassed ? '0 2px 6px rgba(22, 101, 52, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CheckCircle2 size={16} /> ✓ APPROVE & FORWARD TO CENTRAL
                </button>

                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fca5a5',
                    backgroundColor: '#ffffff',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <XCircle size={16} /> ✕ REJECT / RETURN FOR CORRECTION
                </button>
              </div>
            )}
          </div>

          {/* Timeline & Audit Log */}
          <VerificationHistoryTimeline currentCase={currentCase} />
        </div>
      </div>

      {/* Stage Rejection Modal */}
      <StageRejectionModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        caseId={currentCase.id}
        stage="STATE_GOVERNMENT"
        officerName={officer.name}
        officerId={officer.officerId}
        onConfirmReject={handleConfirmReject}
      />

      {/* Statutory Clearance Review Modal */}
      {clearanceModalOpen && selectedZone && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            width: '480px',
            maxWidth: '90vw',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0a2540' }}>
                State Environmental / Master Plan NOC Record
              </h3>
              <button
                onClick={() => setClearanceModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px' }}>
              Recording State level appraisal for <strong>{selectedZone.zone_name}</strong> ({selectedZone.intersection_area_ha} Ha affected).
            </div>

            <form onSubmit={handleSaveClearance}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  State Review Status *
                </label>
                <select
                  value={clearanceStatus}
                  onChange={(e) => setClearanceStatus(e.target.value as ClearanceReviewStatus)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW (State Committee Appraisal in Progress)</option>
                  <option value="CONDITIONAL_CLEARANCE">CONDITIONAL_CLEARANCE (Compensatory Afforestation Approved)</option>
                  <option value="CLEARED">CLEARED (State Forest / Master Plan NOC Issued)</option>
                  <option value="REJECTED">REJECTED (Non-compliant with Master Plan)</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  State NOC / Gazette Order Reference
                </label>
                <input
                  type="text"
                  value={clearanceRef}
                  onChange={(e) => setClearanceRef(e.target.value)}
                  placeholder="e.g. MH-REV-NOC-2026-8812"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  State Committee Observations / Conditions
                </label>
                <textarea
                  value={clearanceRemarks}
                  onChange={(e) => setClearanceRemarks(e.target.value)}
                  placeholder="Record CA land allocation survey numbers, tree authority conditions, etc."
                  rows={3}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setClearanceModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingClearance}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#0a2540', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                >
                  {isUpdatingClearance ? 'Saving…' : 'Record State Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal for State Officer review */}
      <DocumentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={activeDocument}
      />
    </div>
  );
};

