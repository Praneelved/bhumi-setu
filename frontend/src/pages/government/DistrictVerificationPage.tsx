import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, UserCheck, FileCheck, Layers, CheckCircle2, 
  XCircle, AlertCircle, ArrowRight, Eye, ShieldCheck, 
  Building2, Camera, Calendar, ArrowLeft, RefreshCw,
  TreePine, AlertTriangle, X, RotateCcw, Clock
} from 'lucide-react';
import type { 
  VerificationCase, GovernmentOfficer, VerificationDocument, 
  StageRejectionRecord 
} from '../../types/governmentVerification';
import { DEFAULT_OFFICERS } from '../../mock/governmentMockData';
import { 
  fetchVerificationCase,
  verifyDistrictDocument,
  rejectDistrictDocument,
  toggleDistrictCheck,
  approveDistrictStage,
  resetVerificationCase
} from '../../services/verificationApi';
import { fetchProjectConstraints, updateZoneClearance } from '../../services/api';
import type { ProjectConstraintsReport, ZoneIntersection, ClearanceReviewStatus } from '../../services/api';
import { OfficerHeaderBanner } from '../../components/government/OfficerHeaderBanner';
import { StageProgressIndicator } from '../../components/government/StageProgressIndicator';
import { VerificationChecklist } from '../../components/government/VerificationChecklist';
import { StageRejectionModal } from '../../components/government/StageRejectionModal';
import { RejectDocumentModal } from '../../components/government/RejectDocumentModal';
import { VerificationHistoryTimeline } from '../../components/government/VerificationHistoryTimeline';
import { DocumentViewerModal } from '../../components/government/DocumentViewerModal';
import { ViaSocketNotificationToast } from '../../components/government/ViaSocketNotificationToast';
import { SyntheticDocumentCanvas } from '../../components/government/SyntheticDocumentCanvas';

export const DistrictVerificationPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [currentCase, setCurrentCase] = useState<VerificationCase | null>(null);
  const [activeDocument, setActiveDocument] = useState<VerificationDocument | null>(null);
  const [viewerPage, setViewerPage] = useState<number>(1);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [docToReject, setDocToReject] = useState<VerificationDocument | null>(null);

  const [isRejectDocModalOpen, setIsRejectDocModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionToastEvent, setRejectionToastEvent] = useState<any>(null);
  const [approvalSuccessMsg, setApprovalSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // GIS Constraints & Clearance Review State
  const [gisReport, setGisReport] = useState<ProjectConstraintsReport | null>(null);
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneIntersection | null>(null);
  const [clearanceStatus, setClearanceStatus] = useState<ClearanceReviewStatus>('UNDER_REVIEW');
  const [clearanceRef, setClearanceRef] = useState('');
  const [clearanceRemarks, setClearanceRemarks] = useState('');
  const [isUpdatingClearance, setIsUpdatingClearance] = useState(false);

  const officer: GovernmentOfficer = DEFAULT_OFFICERS.DISTRICT_COLLECTOR;

  const loadCase = useCallback(async () => {
    if (!caseId) return;
    try {
      const data = await fetchVerificationCase(caseId);
      setCurrentCase(data);
    } catch (err: any) {
      console.error('Error fetching verification case:', err);
    }
  }, [caseId]);

  useEffect(() => {
    loadCase();
    fetchProjectConstraints('prj-mpe-01').then(setGisReport).catch(() => {});
  }, [loadCase]);

  if (!currentCase) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '24px', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <h2 style={{ color: 'var(--primary)' }}>Loading Land Verification Registry...</h2>
        <p style={{ color: 'var(--on-surface-variant)' }}>Connecting to District Collector PostgreSQL ledger for {caseId || 'case'}...</p>
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

  const { districtData } = currentCase;
  const checklist = districtData.checklist;
  const passedCount = checklist.filter(c => c.verified).length;
  const totalChecks = checklist.length;
  const allChecksPassed = passedCount === totalChecks;

  const unverifiedDocs = currentCase.documents.filter(d => d.status !== 'VERIFIED');
  const verifiedDocsCount = currentCase.documents.filter(d => d.status === 'VERIFIED').length;
  const canApprove = unverifiedDocs.length === 0 && allChecksPassed;

  // Individual Document Verification
  const handleVerifyDoc = async (docId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await verifyDistrictDocument(currentCase.id, docId, officer);
      setCurrentCase(updated);
    } catch (err: any) {
      setActionError(err.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Open rejection modal for a document
  const handleOpenRejectDocModal = (doc: VerificationDocument) => {
    setDocToReject(doc);
    setIsRejectDocModalOpen(true);
  };

  // Submit rejection for a document
  const handleConfirmRejectDoc = async (category: string, reason: string, remarks: string, requiredCorrection: string) => {
    if (!docToReject) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await rejectDistrictDocument(
        currentCase.id,
        docToReject.id,
        { category, reason, remarks, required_correction: requiredCorrection },
        officer
      );
      setCurrentCase(updated);
      setIsRejectDocModalOpen(false);
      setDocToReject(null);
      setRejectionToastEvent({
        caseId: currentCase.id,
        documentName: docToReject.title,
        rejectedBy: officer.name,
        authorityLevel: 'DISTRICT_COLLECTOR',
        reason,
        issueCategory: category,
        timestamp: new Date().toLocaleString()
      });
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle checklist item
  const handleToggleCheck = async (checkId: string) => {
    const item = checklist.find(c => c.id === checkId);
    const nextVal = !item?.verified;
    try {
      const updated = await toggleDistrictCheck(currentCase.id, checkId, officer, nextVal);
      setCurrentCase(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle check');
    }
  };

  // Handle Approve & Forward to State
  const handleApproveDistrict = async () => {
    if (!canApprove) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const remarks = 'District Collector verified all land parcel boundaries, revenue records, and physical inspection reports. Case certified and forwarded to State Government.';
      const updated = await approveDistrictStage(currentCase.id, officer, remarks);
      setCurrentCase(updated);
      setApprovalSuccessMsg('✓ District Verification Approved! The case has been successfully forwarded to State Government Verification.');
      setTimeout(() => {
        navigate(`/government/verification/state/${currentCase.id}`);
      }, 1500);
    } catch (err: any) {
      setActionError(err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reset Case
  const handleResetCase = async () => {
    if (!window.confirm('Reset this verification case back to initial District-pending state?')) return;
    setActionLoading(true);
    try {
      const updated = await resetVerificationCase(currentCase.id);
      setCurrentCase(updated);
      setApprovalSuccessMsg('Case reset to initial District-pending state.');
      setTimeout(() => setApprovalSuccessMsg(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    } finally {
      setActionLoading(false);
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
          if (lvl === 'STATE_GOVERNMENT') navigate(`/government/verification/state/${currentCase.id}`);
          else if (lvl === 'CENTRAL_MINISTRY') navigate(`/government/verification/central/${currentCase.id}`);
        }}
      />

      {/* Navigation Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '12px',
        color: 'var(--on-surface-variant)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Stage 1: District Collector Verification</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={loadCase}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#334155',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={11} /> Refresh
          </button>

          <button
            type="button"
            onClick={handleResetCase}
            style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={11} /> Reset Demo Case
          </button>
        </div>
      </div>

      {approvalSuccessMsg && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          color: '#166534',
          fontWeight: 700,
          fontSize: '13px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>{approvalSuccessMsg}</span>
        </div>
      )}


      {/* Stage Progress Indicator */}
      <StageProgressIndicator
        currentStage="DISTRICT_COLLECTOR"
        stages={currentCase.stages}
      />

      {/* Rejection / Correction Banner if rejected */}
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
              Correction Required — Verification Rejected at {currentCase.activeRejection.stage.replace('_', ' ')} Stage
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
              Stage 1 • District Land Acquisition Authority Review
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '6px 0 2px 0' }}>
              {currentCase.projectName}
            </h1>
            <div style={{ fontSize: '13px', color: '#e0f2fe' }}>
              Acquiring Agency: {currentCase.agency} • Jurisdiction: {districtData.village}, {districtData.taluka}, {districtData.district}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase' }}>Case ID</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>{currentCase.id}</div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Submitted: {currentCase.submittedDate}</div>
          </div>
        </div>
      </div>
        {/* ═════════════════════════════════════════════════════════════════════
          3-COLUMN DISTRICT DOCUMENT VERIFICATION WORKSPACE
          LEFT: Documents List (DOC-001 to DOC-005)
          CENTER: Actual PDF / Image Document Viewer Canvas
          RIGHT: Verification Action Panel (Verify/Reject, Checklist, Approval)
          ═════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px minmax(0, 1.3fr) 380px',
        gap: '20px',
        alignItems: 'start',
        marginBottom: '28px'
      }}>
        {/* ── COLUMN 1 (LEFT): Mandatory Documents List ── */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck size={17} color="#0a2540" />
              Documents ({currentCase.documents.length})
            </h3>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: unverifiedDocs.length === 0 ? '#f0fdf4' : '#fffbeb',
              color: unverifiedDocs.length === 0 ? '#166534' : '#b45309',
              border: `1px solid ${unverifiedDocs.length === 0 ? '#86efac' : '#fde68a'}`
            }}>
              {verifiedDocsCount}/{currentCase.documents.length} Verified
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentCase.documents.map((doc) => {
              const currentActive = activeDocument || currentCase.documents[0];
              const isSelected = currentActive?.id === doc.id;
              const isVerified = doc.status === 'VERIFIED';
              const isRejected = doc.status === 'REJECTED';

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setActiveDocument(doc);
                    setViewerPage(1);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#f0f9ff' : isRejected ? '#fef2f2' : isVerified ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#0369a1' : '#0f172a' }}>
                      {doc.title}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#475569' }}>
                      v{doc.version || 1}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                    Ref #{doc.docNumber || '01'} • {doc.totalPages} Pages
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isVerified ? (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#166534', backgroundColor: '#dcfce7', border: '1px solid #86efac', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={11} /> VERIFIED
                      </span>
                    ) : isRejected ? (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#991b1b', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <XCircle size={11} /> REJECTED
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> PENDING
                      </span>
                    )}

                    <span style={{ fontSize: '10px', color: isSelected ? '#0284c7' : '#94a3b8', fontWeight: isSelected ? 700 : 400 }}>
                      {isSelected ? 'Active Preview ▸' : 'Click to View'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
            Select any document to view its synthetic preview in the center canvas and verify or reject individually.
          </div>
        </div>

        {/* ── COLUMN 2 (CENTER): Live Document Viewer Canvas ── */}
        <div style={{ minHeight: '660px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {activeDocument || currentCase.documents[0] ? (
            <SyntheticDocumentCanvas
              document={activeDocument || currentCase.documents[0]}
              selectedPageNumber={viewerPage}
              onPageChange={setViewerPage}
            />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              No document selected for review.
            </div>
          )}
        </div>

        {/* ── COLUMN 3 (RIGHT): Verification Action Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Document Actions Card */}
          {(() => {
            const currentDoc = activeDocument || currentCase.documents[0];
            if (!currentDoc) return null;
            const isVerified = currentDoc.status === 'VERIFIED';
            const isRejected = currentDoc.status === 'REJECTED';

            return (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--outline-variant)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Document Actions
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0a2540', margin: '4px 0 10px 0' }}>
                  {currentDoc.title}
                </div>

                {/* Status Indicator */}
                {isVerified && (
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #86efac',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle2 size={16} color="#166534" />
                    <div>
                      <div style={{ fontWeight: 700 }}>Document Verified &amp; Certified</div>
                      <div style={{ fontSize: '10px', color: '#15803d' }}>
                        {currentDoc.verifiedBy ? `By ${currentDoc.verifiedBy} on ${currentDoc.verifiedAt}` : 'Certified by District Collector'}
                      </div>
                    </div>
                  </div>
                )}

                {isRejected && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#991b1b'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                      <XCircle size={15} /> Document Rejected
                    </div>
                    <div><strong>Category:</strong> {currentDoc.rejectionCategory || 'Discrepancy'}</div>
                    <div style={{ marginTop: '2px' }}><strong>Reason:</strong> {currentDoc.rejectionReason}</div>
                    {currentDoc.rejectionRemarks && <div style={{ marginTop: '2px', fontSize: '11px', color: '#7f1d1d' }}><strong>Remarks:</strong> {currentDoc.rejectionRemarks}</div>}
                  </div>
                )}

                {/* Individual Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={actionLoading || isVerified}
                    onClick={() => handleVerifyDoc(currentDoc.id)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: isVerified ? '#e2e8f0' : '#166534',
                      color: isVerified ? '#64748b' : '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: isVerified ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CheckCircle2 size={15} /> {isVerified ? 'Verified' : 'Verify'}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleOpenRejectDocModal(currentDoc)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dc2626',
                      backgroundColor: isRejected ? '#fef2f2' : '#ffffff',
                      color: '#dc2626',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <XCircle size={15} /> {isRejected ? 'Edit Rejection' : 'Reject'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Landowner Details & Parcel Summary Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            fontSize: '12px'
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              Statutory Parcel Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', lineHeight: 1.4 }}>
              <div><span style={{ color: '#64748b' }}>Owner:</span> <strong style={{ color: '#0a2540' }}>Demo Landowner</strong></div>
              <div><span style={{ color: '#64748b' }}>Survey No:</span> <strong style={{ color: '#0a2540' }}>124/2</strong></div>
              <div><span style={{ color: '#64748b' }}>Area:</span> <strong style={{ color: '#166534' }}>2.40 Hectares</strong></div>
              <div><span style={{ color: '#64748b' }}>Village:</span> <strong>Demo Village</strong></div>
              <div><span style={{ color: '#64748b' }}>Case:</span> <strong>LA-2026-001</strong></div>
              <div><span style={{ color: '#64748b' }}>Compensation:</span> <strong style={{ color: '#166534' }}>₹14,28,000</strong></div>
            </div>
          </div>

          {/* District Statutory Checklist */}
          <VerificationChecklist
            title="District Verification Checklist"
            subtitle="Local land record consistency checks"
            stageName="DISTRICT_COLLECTOR"
            items={checklist}
            onToggleCheck={handleToggleCheck}
            readOnly={currentCase.stages.DISTRICT_COLLECTOR.status === 'COMPLETED'}
          />

          {/* Gated Stage Approval Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Documents Verified:</span>
              <strong style={{ color: unverifiedDocs.length === 0 ? '#166534' : '#b45309' }}>
                {verifiedDocsCount} / {currentCase.documents.length}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '12px' }}>
              <span style={{ color: '#64748b' }}>Checklist Items:</span>
              <strong style={{ color: allChecksPassed ? '#166534' : '#b45309' }}>
                {passedCount} / {totalChecks}
              </strong>
            </div>

            {!canApprove && currentCase.stages.DISTRICT_COLLECTOR.status !== 'COMPLETED' && (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '4px',
                padding: '8px 10px',
                fontSize: '11px',
                color: '#92400e',
                marginBottom: '12px'
              }}>
                District Approval is strictly gated until all 5 documents are marked VERIFIED and all 8 checklist items are complete.
              </div>
            )}

            {currentCase.stages.DISTRICT_COLLECTOR.status === 'COMPLETED' ? (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '12px',
                color: '#166534',
                fontWeight: 700
              }}>
                ✓ District Verification Approved &amp; State Unlocked
              </div>
            ) : (
              <button
                type="button"
                disabled={!canApprove || actionLoading}
                onClick={handleApproveDistrict}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: canApprove ? '#0a2540' : '#cbd5e1',
                  color: canApprove ? '#ffffff' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: canApprove ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: canApprove ? '0 2px 6px rgba(10, 37, 64, 0.25)' : 'none'
                }}
              >
                Approve District &amp; Forward to State →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Supporting Sections Below 3-Column Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Section 1: Land Details & Coordinates */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <MapPin size={18} color="#0a2540" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
              Land Parcel Cadastral Record Details
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Khasra / Survey Numbers</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{districtData.khasraNumbers.join(', ')}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Total Acquisition Area</span>
              <span style={{ fontWeight: 700, color: '#166534' }}>{districtData.areaHectares} Hectares</span>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Revenue Village &amp; Taluka</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{districtData.village}, {districtData.taluka}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Land Classification</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{districtData.landType}</span>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>DGPS GIS Boundary Polygon Coordinates</span>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#334155', backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '4px', display: 'block', marginTop: '2px', border: '1px solid #e2e8f0' }}>
                {districtData.boundaryCoordinates} (GIS Ref: {districtData.gisParcelId})
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Ownership & Khatoni Co-owners */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <UserCheck size={18} color="#0a2540" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
              Ownership &amp; Title Verification Details
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Primary Landowner</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{districtData.primaryOwner}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Ownership Share</span>
              <span style={{ fontWeight: 700, color: '#166534' }}>{districtData.ownershipPercentage}% Undivided Share</span>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Aadhaar &amp; PAN Seeding</span>
              <span style={{ fontWeight: 600, color: '#166534' }}>Linked &amp; e-KYC Verified ✓</span>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Encumbrance Certificate</span>
              <span style={{ fontWeight: 600, color: '#334155' }}>{districtData.encumbranceCertificateNo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: GIS & Land-Use Compliance (Environmental Constraints) */}
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
              5. GIS Land-Use &amp; Environmental Compliance
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
          Automated spatial polygon intersection analysis of alignment corridor ({gisReport?.total_corridor_area_ha || 38.5} Ha) against statutory restricted land-use layers:
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
                  Affected: <strong>{iz.intersection_area_ha} Ha</strong> ({iz.percentage_affected}%) • Authority: {iz.authority}
                </div>
                {iz.clearance_reference_no && (
                  <div style={{ fontSize: '10px', color: '#166534', fontWeight: 600, marginTop: '2px' }}>
                    Clearance Ref: {iz.clearance_reference_no}
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
                  Update NOC / Status
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '10px', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '6px 10px', borderRadius: '4px' }}>
          ℹ️ <strong>Demo/Mock Layer Notice:</strong> Environmental layers are decision support integrations and ready for authoritative state GIS gateway APIs.
        </div>
      </div>

      {/* Timeline & Audit Log */}
      <VerificationHistoryTimeline currentCase={currentCase} />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={activeDocument}
      />

      {/* Reject Document Modal (Individual Document Rejection) */}
      <RejectDocumentModal
        isOpen={isRejectDocModalOpen}
        documentTitle={docToReject?.title || ''}
        onClose={() => {
          setIsRejectDocModalOpen(false);
          setDocToReject(null);
        }}
        onConfirmReject={handleConfirmRejectDoc}
      />

      {/* Stage Rejection Modal */}
      <StageRejectionModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        caseId={currentCase.id}
        stage="DISTRICT_COLLECTOR"
        officerName={officer.name}
        officerId={officer.officerId}
        onConfirmReject={(rej) => {
          handleConfirmRejectDoc(rej.issueCategory, rej.rejectionReason, rej.remarks, rej.requiredCorrection);
          setIsRejectModalOpen(false);
        }}
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
                Statutory Environmental Clearance Decision
              </h3>
              <button
                onClick={() => setClearanceModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px' }}>
              Evaluating clearance for <strong>{selectedZone.zone_name}</strong> ({selectedZone.intersection_area_ha} Ha affected).
            </div>

            <form onSubmit={handleSaveClearance}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  Clearance Status *
                </label>
                <select
                  value={clearanceStatus}
                  onChange={(e) => setClearanceStatus(e.target.value as ClearanceReviewStatus)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Inspection in Progress)</option>
                  <option value="CONDITIONAL_CLEARANCE">CONDITIONAL_CLEARANCE (In-principle / CA Deposit Req)</option>
                  <option value="CLEARED">CLEARED (Full Statutory NOC / Stage-II Granted)</option>
                  <option value="REJECTED">REJECTED (Alignment Deviation Required)</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  Clearance / NOC Reference Number
                </label>
                <input
                  type="text"
                  value={clearanceRef}
                  onChange={(e) => setClearanceRef(e.target.value)}
                  placeholder="e.g. FC-MH-2026-9912 / PMRDA-NOC-44"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  Official Remarks / Statutory Conditions
                </label>
                <textarea
                  value={clearanceRemarks}
                  onChange={(e) => setClearanceRemarks(e.target.value)}
                  placeholder="Record CA sapling ratio, joint inspection report ref, or conditions..."
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
                  {isUpdatingClearance ? 'Saving…' : 'Record Clearance Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
