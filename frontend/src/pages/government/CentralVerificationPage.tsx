import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, CheckCircle2, XCircle, AlertCircle, ShieldCheck, 
  Award, Globe, Trees, Landmark, FileText, CheckCheck, RefreshCw,
  TreePine, AlertTriangle, X, RotateCcw, Eye
} from 'lucide-react';
import type { 
  VerificationCase, GovernmentOfficer, StageRejectionRecord, VerificationDocument
} from '../../types/governmentVerification';
import { DEFAULT_OFFICERS } from '../../mock/governmentMockData';
import { 
  fetchVerificationCase,
  toggleCentralCheck,
  approveCentralStage,
  rejectCentralStage,
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

export const CentralVerificationPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [currentCase, setCurrentCase] = useState<VerificationCase | null>(null);
  const [activeDocument, setActiveDocument] = useState<VerificationDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionToastEvent, setRejectionToastEvent] = useState<any>(null);
  const [finalSuccessMsg, setFinalSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // GIS Constraints & Clearance Review State
  const [gisReport, setGisReport] = useState<ProjectConstraintsReport | null>(null);
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneIntersection | null>(null);
  const [clearanceStatus, setClearanceStatus] = useState<ClearanceReviewStatus>('CLEARED');
  const [clearanceRef, setClearanceRef] = useState('');
  const [clearanceRemarks, setClearanceRemarks] = useState('');
  const [isUpdatingClearance, setIsUpdatingClearance] = useState(false);

  const officer: GovernmentOfficer = DEFAULT_OFFICERS.CENTRAL_MINISTRY;

  const loadCase = useCallback(async () => {
    if (!caseId) return;
    try {
      const data = await fetchVerificationCase(caseId);
      setCurrentCase(data);
    } catch (err: any) {
      console.error('Error fetching central verification case:', err);
    }
  }, [caseId]);

  useEffect(() => {
    loadCase();
    fetchProjectConstraints('prj-mpe-01').then(setGisReport).catch(() => {});
  }, [loadCase]);

  if (!currentCase) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '24px', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <h2 style={{ color: 'var(--primary)' }}>Loading Central Ministry Verification...</h2>
        <p style={{ color: 'var(--on-surface-variant)' }}>Connecting to Ministry of Road Transport & Land Resources ledger for {caseId || 'case'}...</p>
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

  // Strict Sequential Gating Check: State Government must be COMPLETED
  const isStateApproved = currentCase.stages.STATE_GOVERNMENT?.status === 'COMPLETED';
  if (!isStateApproved) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-lg)' }}>
        <OfficerHeaderBanner
          currentOfficer={officer}
          onSwitchAuthority={(lvl) => {
            if (lvl === 'DISTRICT_COLLECTOR') navigate(`/government/verification/district/${currentCase.id}`);
            else if (lvl === 'STATE_GOVERNMENT') navigate(`/government/verification/state/${currentCase.id}`);
          }}
        />
        <LockedStageCard currentCase={currentCase} attemptedStage="CENTRAL_MINISTRY" />
      </div>
    );
  }

  const { centralData } = currentCase;
  const checklist = centralData.checklist;
  const passedCount = checklist.filter(c => c.verified).length;
  const totalChecks = checklist.length;
  const allChecksPassed = passedCount === totalChecks;
  const isFinalVerified = currentCase.workflowStatus === 'FINAL_DOCUMENT_VERIFICATION_COMPLETE' || currentCase.stages.CENTRAL_MINISTRY?.status === 'COMPLETED';

  // Handle checklist item toggle
  const handleToggleCheck = async (checkId: string) => {
    const item = checklist.find(c => c.id === checkId);
    const nextVal = !item?.verified;
    try {
      const updated = await toggleCentralCheck(currentCase.id, checkId, officer, nextVal);
      setCurrentCase(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle Central check');
    }
  };

  // Handle Final Approval
  const handleFinalApproval = async () => {
    if (!allChecksPassed) return;
    setActionLoading(true);
    try {
      const remarks = 'Central Ministry granted final statutory approval under RFCTLARR Act 2013. National corridor statutory award declared and approved for publication in Gazette of India.';
      const updated = await approveCentralStage(currentCase.id, officer, remarks);
      setCurrentCase(updated);
      setFinalSuccessMsg('✓ Final Statutory Award Approved! Land Acquisition Case is now FULLY VERIFIED across District, State, and Central authorities.');
    } catch (err: any) {
      alert(err.message || 'Central approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Rejection
  const handleConfirmReject = async (rejection: StageRejectionRecord) => {
    setActionLoading(true);
    try {
      const updated = await rejectCentralStage(currentCase.id, rejection);
      setCurrentCase(updated);
      setIsRejectModalOpen(false);
      setRejectionToastEvent({
        caseId: currentCase.id,
        documentName: 'Central Sanction & Gazette Clearance',
        rejectedBy: officer.name,
        authorityLevel: 'CENTRAL_MINISTRY',
        reason: rejection.rejectionReason,
        issueCategory: rejection.issueCategory,
        timestamp: rejection.timestamp
      });
    } catch (err: any) {
      alert(err.message || 'Central rejection failed');
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
          else if (lvl === 'STATE_GOVERNMENT') navigate(`/government/verification/state/${currentCase.id}`);
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
        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Stage 3: Central Ministry Final Review</span>
      </div>

      {/* Stage Progress Indicator */}
      <StageProgressIndicator
        currentStage="CENTRAL_MINISTRY"
        stages={currentCase.stages}
      />

      {/* FULLY VERIFIED FINAL BANNER */}
      {isFinalVerified && (
        <div style={{
          backgroundColor: '#0a2540',
          border: '2px solid #86efac',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 32px',
          marginBottom: '24px',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(10, 37, 64, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 6px rgba(134, 239, 172, 0.2)'
            }}>
              <CheckCheck size={32} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#86efac', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Statutory Land Acquisition Award Granted
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 6px 0', color: '#ffffff' }}>
                ✓ LAND ACQUISITION CASE FULLY VERIFIED
              </h2>
              <div style={{ fontSize: '13px', color: '#e0f2fe' }}>
                Sequential Approvals Certified: <strong>District Collector ✓</strong> • <strong>State Government ✓</strong> • <strong>Central Ministry ✓</strong>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#166534',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.04em',
            border: '1px solid #86efac'
          }}>
            STATUS: FINAL_VERIFIED
          </div>
        </div>
      )}

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
              Central Verification Issue — Case Returned for Correction
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
      {finalSuccessMsg && (
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
          {finalSuccessMsg}
        </div>
      )}

      {/* Prior Approvals Summary Strip */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '12px' }}>
          Certified Sequential Gating Chain
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '13px' }}>
              <CheckCircle2 size={16} /> 1. District Collector
            </div>
            <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
              ✓ VERIFIED • {currentCase.stages.DISTRICT_COLLECTOR.verifiedBy || 'Dr. Rajesh Sharma, IAS'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Land details, titles, 7/12 & field surveys certified.
            </div>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '13px' }}>
              <CheckCircle2 size={16} /> 2. State Government
            </div>
            <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
              ✓ VERIFIED • {currentCase.stages.STATE_GOVERNMENT.verifiedBy || 'Smt. Ananya Deshmukh, IAS'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Gazette Section 11/19, 100% solatium & R&R sanctioned.
            </div>
          </div>

          <div style={{
            backgroundColor: isFinalVerified ? '#f0fdf4' : '#e0f2fe',
            border: `1px solid ${isFinalVerified ? '#86efac' : '#38bdf8'}`,
            padding: '12px',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isFinalVerified ? '#166534' : '#0369a1', fontWeight: 700, fontSize: '13px' }}>
              {isFinalVerified ? <CheckCircle2 size={16} /> : <Award size={16} />}
              3. Central Ministry
            </div>
            <div style={{ fontSize: '12px', color: isFinalVerified ? '#15803d' : '#0369a1', marginTop: '4px' }}>
              {isFinalVerified ? '✓ VERIFIED' : '🟢 ACTIVE IN PROGRESS'} • {officer.name}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              National corridor authorization & gazette award sanction.
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout for Central Review */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: '24px' }}>
        {/* Left Column: National Review Sections */}
        <div>
          {/* Section 1: National Project Authorization */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <Globe size={18} color="#0a2540" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                1. National Project Authorization & PM Gati Shakti Alignment
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>National Importance</span>
                <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{centralData.strategicImportance}</span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>PM Gati Shakti Master Plan</span>
                <span style={{ fontWeight: 700, color: '#166534', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Integrated & Synchronized
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Sponsoring Union Ministry</span>
                <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{centralData.implementingMinistry}</span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Cabinet (CCEA) Sanction Order</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{centralData.cabinetSanctionRef}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Central Inter-Ministerial Clearances */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <Trees size={18} color="#0a2540" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                2. Inter-Ministerial & Environmental Statutory Clearances
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>MoEFCC Forest Clearance Stage-II</span>
                <span style={{ fontWeight: 700, color: '#166534', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> {centralData.moefccForestClearanceStage2} (Final Stage-II Order Issued)
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Environmental Clearance Reference</span>
                <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{centralData.environmentalClearanceRef}</span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Defense & Railway RoW Clearance</span>
                <span style={{ fontWeight: 600, color: '#166534' }}>Inter-Ministerial NOC Cleared ✓</span>
              </div>
              <div>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>High Court / Supreme Court Status</span>
                <span style={{ fontWeight: 700, color: '#166534' }}>Zero Injunctions • All Writs Disposed</span>
              </div>
            </div>
          </div>

          {/* Section 3: National Scale & Treasury Outlay */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <Landmark size={18} color="#0a2540" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                3. National Infrastructure Scale & Central Treasury Outlay
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Total National Corridor Length</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>{centralData.totalCorridorLengthKm} Km</span>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: 'var(--outline)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Districts Traversed</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>{centralData.affectedDistrictsCount} Districts</span>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                <span style={{ color: '#15803d', fontSize: '11px', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Central Treasury Allocation</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#166534' }}>₹{centralData.totalTreasuryBudgetCrores} Crores</span>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                <span style={{ color: '#15803d', fontSize: '11px', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Disbursed to Escrow (100%)</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#166534' }}>₹{centralData.disbursedBudgetCrores} Crores</span>
              </div>

              <div style={{ gridColumn: 'span 2', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155' }}>
                <strong>Vigilance & CAG Audit Compliance:</strong> Final financial audit passed without objection. Public funds released under DBT statutory gateway.
              </div>
            </div>
          </div>

          {/* Section 5: Central Environmental & Inter-State Statutory Clearances */}
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
                  5. Central MoEFCC &amp; Statutory Environmental Concurrence
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
              Central Ministry gateway verification for statutory forest diversion (Forest Conservation Act 1980 / Van Sanrakshan Evam Samvardhan Adhiniyam) across corridor ({gisReport?.total_corridor_area_ha || 38.5} Ha):
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
                      Corridor Overlap: <strong>{iz.intersection_area_ha} Ha</strong> ({iz.percentage_affected}%) • Nodal Body: {iz.authority}
                    </div>
                    {iz.clearance_reference_no && (
                      <div style={{ fontSize: '10px', color: '#166534', fontWeight: 600, marginTop: '2px' }}>
                        Central Approval Ref: {iz.clearance_reference_no}
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
                      Record Central Concurrence
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '10px', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '6px 10px', borderRadius: '4px' }}>
              ℹ️ <strong>Demo/Mock Layer Notice:</strong> Central environmental layers provide simulated statutory intelligence for MoEFCC integration.
            </div>
          </div>

          {/* Section 6: District & State Signoff Audit with Original Documents */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <FileText size={18} color="#0a2540" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                6. Multi-Tier Signoff Audit & Original Landowner Document Package
              </h3>
            </div>

            {/* Dual Signoff Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '4px', fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Tier 1: District Collector Certified
                </div>
                <div style={{ color: '#15803d', marginTop: '2px' }}>
                  {currentCase.stages.DISTRICT_COLLECTOR.verifiedBy || 'Dr. Rajesh Sharma, IAS'}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                  {currentCase.stages.DISTRICT_COLLECTOR.verifiedAt || '10 Sep 2026'}
                </div>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '4px', fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Tier 2: State Government Approved
                </div>
                <div style={{ color: '#15803d', marginTop: '2px' }}>
                  {currentCase.stages.STATE_GOVERNMENT.verifiedBy || 'Smt. Ananya Deshmukh, IAS'}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                  {currentCase.stages.STATE_GOVERNMENT.verifiedAt || '10 Sep 2026'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
              Central Ministry review of original landowner records submitted and authenticated across lower tiers:
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


        {/* Right Column: Central Checklist & Final Action Bar */}
        <div>
          {/* Mandatory Checklist Card */}
          <VerificationChecklist
            title="Central Ministry Checklist"
            subtitle="Verify national project authorization, inter-ministerial clearances, and national fund sanction."
            stageName="CENTRAL_MINISTRY"
            items={checklist}
            onToggleCheck={handleToggleCheck}
            readOnly={isFinalVerified}
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
              Central Verification Summary
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
                <span style={{ color: 'var(--outline)' }}>Central Checks Passed:</span>
                <span style={{ fontWeight: 700, color: allChecksPassed ? '#166534' : '#d97706' }}>
                  {passedCount} / {totalChecks}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--outline)' }}>District Clearance:</span>
                <span style={{ fontWeight: 700, color: '#166534' }}>Verified ✓</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--outline)' }}>State Clearance:</span>
                <span style={{ fontWeight: 700, color: '#166534' }}>Verified ✓</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--outline)' }}>National Discrepancies:</span>
                <span style={{ fontWeight: 700, color: currentCase.overallStatus === 'REJECTED' ? '#dc2626' : '#166534' }}>
                  {currentCase.overallStatus === 'REJECTED' ? '1 (Correction Required)' : '0'}
                </span>
              </div>
            </div>

            {/* Gated Rule Warning */}
            {!allChecksPassed && !isFinalVerified && (
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
                <span>Final Approval remains locked until all 8 mandatory central checks are passed.</span>
              </div>
            )}

            {/* Final Action Buttons */}
            {isFinalVerified ? (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ color: '#166534', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Award size={20} /> STATUTORY AWARD DECLARED
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '6px' }}>
                  Approved by {currentCase.stages.CENTRAL_MINISTRY.verifiedBy || officer.name} on {currentCase.stages.CENTRAL_MINISTRY.verifiedAt}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                  Gazette of India Notification Ref: GOI-GAZ-MORTH-2026-AWARD-882
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/government/dashboard')}
                  style={{
                    marginTop: '14px',
                    backgroundColor: '#0a2540',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  disabled={!allChecksPassed}
                  onClick={handleFinalApproval}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: allChecksPassed ? '#166534' : '#cbd5e1',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: allChecksPassed ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: allChecksPassed ? '0 4px 12px rgba(22, 101, 52, 0.35)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Award size={18} /> ✓ FINAL APPROVAL & GAZETTE AWARD SANCTION
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
        stage="CENTRAL_MINISTRY"
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
                Central MoEFCC &amp; Statutory Concurrence Record
              </h3>
              <button
                onClick={() => setClearanceModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px' }}>
              Recording Central Ministry statutory concurrence for <strong>{selectedZone.zone_name}</strong> ({selectedZone.intersection_area_ha} Ha affected).
            </div>

            <form onSubmit={handleSaveClearance}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  Central Statutory Decision *
                </label>
                <select
                  value={clearanceStatus}
                  onChange={(e) => setClearanceStatus(e.target.value as ClearanceReviewStatus)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="CLEARED">CLEARED (MoEFCC Stage-II Final Clearance Granted)</option>
                  <option value="CONDITIONAL_CLEARANCE">CONDITIONAL_CLEARANCE (In-principle Stage-I Accorded)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (FAC Forest Advisory Committee Review)</option>
                  <option value="REJECTED">REJECTED (Corridor Realignment Mandated)</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  MoEFCC / Central Gazette Reference Number
                </label>
                <input
                  type="text"
                  value={clearanceRef}
                  onChange={(e) => setClearanceRef(e.target.value)}
                  placeholder="e.g. MOEFCC-FC-2026-IND-091"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  Central Committee Minute &amp; Stipulations
                </label>
                <textarea
                  value={clearanceRemarks}
                  onChange={(e) => setClearanceRemarks(e.target.value)}
                  placeholder="Record FAC recommendations, net present value (NPV) deposit, or conditions..."
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
                  {isUpdatingClearance ? 'Saving…' : 'Record Central Concurrence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal for Central Officer review */}
      <DocumentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={activeDocument}
      />
    </div>
  );
};

