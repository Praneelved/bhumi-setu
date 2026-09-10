import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, CheckCircle2, XCircle, Clock, ShieldCheck, 
  Building2, MapPin, Users, Calendar, Layers, Send
} from 'lucide-react';
import type { 
  VerificationCase, VerificationDocument, GovernmentOfficer, 
  AuthorityLevel, DocumentPage, RejectionEvent 
} from '../types/governmentVerification';
import { DEFAULT_OFFICERS, getCaseById, updateCase } from '../mock/governmentMockData';
import { notifyDocumentRejection } from '../services/verificationEventService';
import { OfficerHeaderBanner } from '../components/government/OfficerHeaderBanner';
import { StageProgressIndicator } from '../components/government/StageProgressIndicator';
import { DocumentViewerArea } from '../components/government/DocumentViewerArea';
import { DocumentVerificationPanel } from '../components/government/DocumentVerificationPanel';
import { VerifyConfirmModal } from '../components/government/VerifyConfirmModal';
import { RejectDocumentModal } from '../components/government/RejectDocumentModal';
import { AuditHistoryTable } from '../components/government/AuditHistoryTable';
import { ViaSocketNotificationToast } from '../components/government/ViaSocketNotificationToast';

export const CaseVerificationPage: React.FC = () => {
  const { caseId, documentId } = useParams<{ caseId: string; documentId?: string }>();
  const navigate = useNavigate();

  const [currentCase, setCurrentCase] = useState<VerificationCase | null>(null);
  const [selectedAuthority, setSelectedAuthority] = useState<AuthorityLevel>('DISTRICT_COLLECTOR');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Modal States
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);

  // viaSocket Notification Toast State
  const [activeRejectionEvent, setActiveRejectionEvent] = useState<RejectionEvent | null>(null);

  useEffect(() => {
    if (!caseId) return;
    const found = getCaseById(caseId);
    if (found) {
      setCurrentCase(found);
      setSelectedAuthority(found.currentStage);
      
      // If documentId param is provided, select it, else default to first document
      if (documentId && found.documents.some(d => d.id === documentId)) {
        setSelectedDocId(documentId);
      } else if (found.documents.length > 0) {
        setSelectedDocId(found.documents[0].id);
      }
    }
  }, [caseId, documentId]);

  if (!currentCase) {
    return (
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '24px', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <h2 style={{ color: 'var(--primary)' }}>Case Not Found</h2>
        <p style={{ color: 'var(--on-surface-variant)' }}>The requested land acquisition case ID ({caseId}) does not exist in the registry.</p>
        <button
          onClick={() => navigate('/government/dashboard')}
          style={{
            backgroundColor: '#0a2540',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: '16px'
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentOfficer: GovernmentOfficer = DEFAULT_OFFICERS[selectedAuthority];

  const selectedDocument = currentCase.documents.find(d => d.id === selectedDocId) || currentCase.documents[0];
  const selectedDocIndex = currentCase.documents.findIndex(d => d.id === selectedDocument.id);

  // Check if all documents are verified for the current stage
  const allVerifiedForCurrentStage = currentCase.documents.every(d => d.status === 'VERIFIED');

  // Handle document selection
  const handleSelectDocument = (doc: VerificationDocument) => {
    setSelectedDocId(doc.id);
    navigate(`/government/verification/case/${currentCase.id}/document/${doc.id}`, { replace: true });
  };

  // Handle Verify Confirmation
  const handleConfirmVerification = () => {
    if (!selectedDocument || !currentCase) return;

    const now = new Date().toLocaleString();
    const updatedDocs = currentCase.documents.map((d) => {
      if (d.id === selectedDocument.id) {
        return {
          ...d,
          status: 'VERIFIED' as const,
          verifiedAt: now,
          verifiedBy: currentOfficer.name
        };
      }
      return d;
    });

    const newAuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: now,
      authorityLevel: currentOfficer.authorityLevel,
      authorityTitle: `${currentOfficer.designation} (${currentOfficer.district})`,
      officerName: currentOfficer.name,
      officerId: currentOfficer.officerId,
      action: 'VERIFIED' as const,
      documentTitle: selectedDocument.title,
      remarks: `Document '${selectedDocument.title}' verified and authenticated under RFCTLARR statutory standards.`
    };

    const updatedCase: VerificationCase = {
      ...currentCase,
      documents: updatedDocs,
      auditLogs: [newAuditLog, ...currentCase.auditLogs],
      lastUpdated: now
    };

    setCurrentCase(updatedCase);
    updateCase(updatedCase);
    setIsVerifyModalOpen(false);
  };

  // Handle Reject Confirmation & viaSocket event
  const handleConfirmRejection = (category: string, reason: string) => {
    if (!selectedDocument || !currentCase) return;

    const now = new Date().toLocaleString();
    const updatedDocs = currentCase.documents.map((d) => {
      if (d.id === selectedDocument.id) {
        return {
          ...d,
          status: 'REJECTED' as const,
          rejectionCategory: category,
          rejectionReason: reason,
          rejectedAt: now,
          rejectedBy: currentOfficer.name
        };
      }
      return d;
    });

    const newAuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: now,
      authorityLevel: currentOfficer.authorityLevel,
      authorityTitle: `${currentOfficer.designation} (${currentOfficer.district})`,
      officerName: currentOfficer.name,
      officerId: currentOfficer.officerId,
      action: 'REJECTED' as const,
      documentTitle: selectedDocument.title,
      remarks: `Document rejected. Category: ${category}. Reason: ${reason}`
    };

    const updatedCase: VerificationCase = {
      ...currentCase,
      overallStatus: 'REJECTED' as const,
      documents: updatedDocs,
      auditLogs: [newAuditLog, ...currentCase.auditLogs],
      lastUpdated: now
    };

    setCurrentCase(updatedCase);
    updateCase(updatedCase);
    setIsRejectModalOpen(false);

    // Trigger viaSocket event notify function
    const eventData: RejectionEvent = {
      caseId: currentCase.id,
      documentId: selectedDocument.id,
      documentName: selectedDocument.title,
      rejectedBy: currentOfficer.name,
      authorityLevel: currentOfficer.authorityLevel,
      reason: reason,
      issueCategory: category,
      timestamp: now
    };

    notifyDocumentRejection(eventData);
    setActiveRejectionEvent(eventData);
  };

  // Handle Adding Page to Document
  const handleAddPage = (docId: string, newPage: DocumentPage) => {
    if (!currentCase) return;

    const now = new Date().toLocaleString();
    const updatedDocs = currentCase.documents.map((d) => {
      if (d.id === docId) {
        return {
          ...d,
          totalPages: d.totalPages + 1,
          pages: [...d.pages, newPage]
        };
      }
      return d;
    });

    const newAuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: now,
      authorityLevel: currentOfficer.authorityLevel,
      authorityTitle: `${currentOfficer.designation} (${currentOfficer.district})`,
      officerName: currentOfficer.name,
      officerId: currentOfficer.officerId,
      action: 'PAGE_ADDED' as const,
      documentTitle: selectedDocument.title,
      remarks: `Added Page ${newPage.pageNumber} (${newPage.title}) to document during statutory verification.`
    };

    const updatedCase: VerificationCase = {
      ...currentCase,
      documents: updatedDocs,
      auditLogs: [newAuditLog, ...currentCase.auditLogs],
      lastUpdated: now
    };

    setCurrentCase(updatedCase);
    updateCase(updatedCase);
  };

  // Handle Stage Progression (District -> State -> Central -> Final)
  const handleProceedNextStage = () => {
    if (!currentCase) return;

    const now = new Date().toLocaleString();
    let nextStage: AuthorityLevel = currentCase.currentStage;
    let newStages = { ...currentCase.stages };
    let remarkText = '';

    if (currentCase.currentStage === 'DISTRICT_COLLECTOR') {
      nextStage = 'STATE_GOVERNMENT';
      newStages.DISTRICT_COLLECTOR = { status: 'COMPLETED', verifiedBy: currentOfficer.name, verifiedAt: now };
      newStages.STATE_GOVERNMENT = { status: 'ACTIVE' };
      remarkText = 'District Collector verified all documents and approved progression to State Government Verification.';
    } else if (currentCase.currentStage === 'STATE_GOVERNMENT') {
      nextStage = 'CENTRAL_MINISTRY';
      newStages.STATE_GOVERNMENT = { status: 'COMPLETED', verifiedBy: currentOfficer.name, verifiedAt: now };
      newStages.CENTRAL_MINISTRY = { status: 'ACTIVE' };
      remarkText = 'State Government verified all documents and approved progression to Central Ministry Final Approval.';
    } else if (currentCase.currentStage === 'CENTRAL_MINISTRY') {
      newStages.CENTRAL_MINISTRY = { status: 'COMPLETED', verifiedBy: currentOfficer.name, verifiedAt: now };
      remarkText = 'Central Ministry granted final statutory approval for land acquisition award declaration.';
    }

    const newAuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: now,
      authorityLevel: currentOfficer.authorityLevel,
      authorityTitle: `${currentOfficer.designation} (${currentOfficer.district})`,
      officerName: currentOfficer.name,
      officerId: currentOfficer.officerId,
      action: 'STAGE_ADVANCED' as const,
      remarks: remarkText
    };

    const updatedCase: VerificationCase = {
      ...currentCase,
      currentStage: nextStage,
      overallStatus: currentCase.currentStage === 'CENTRAL_MINISTRY' ? 'VERIFIED' : 'IN_PROGRESS',
      stages: newStages,
      auditLogs: [newAuditLog, ...currentCase.auditLogs],
      lastUpdated: now
    };

    setCurrentCase(updatedCase);
    updateCase(updatedCase);
    setSelectedAuthority(nextStage);
  };

  const getDocStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <span style={{ color: '#166534', fontWeight: 700, fontSize: '11px' }}>✓ Verified</span>;
      case 'REJECTED':
        return <span style={{ color: '#991b1b', fontWeight: 700, fontSize: '11px' }}>✕ Rejected</span>;
      case 'PENDING':
      default:
        return <span style={{ color: '#856404', fontWeight: 700, fontSize: '11px' }}>● Pending</span>;
    }
  };

  return (
    <div style={{
      maxWidth: '1600px',
      margin: '0 auto',
      padding: 'var(--space-lg)',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: 'var(--on-background)'
    }}>
      {/* Navigation Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <button
          onClick={() => navigate('/government/dashboard')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: 0
          }}
        >
          <ArrowLeft size={16} /> Back to Government Dashboard
        </button>

        <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
          Last System Update: {currentCase.lastUpdated}
        </span>
      </div>

      {/* Officer Banner & Stage Indicator */}
      <OfficerHeaderBanner
        currentOfficer={currentOfficer}
        onSwitchAuthority={(level) => setSelectedAuthority(level)}
      />

      <StageProgressIndicator
        currentStage={currentCase.currentStage}
        stages={currentCase.stages}
        onSelectStage={(stage) => setSelectedAuthority(stage)}
      />

      {/* CASE INFORMATION SUMMARY CARD */}
      <div style={{
        backgroundColor: 'var(--surface-container-lowest)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--surface-container-high)',
          paddingBottom: '8px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase' }}>
            Case Information Summary — {currentCase.id}
          </div>
          <span style={{
            backgroundColor: '#0a2540',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            Overall Status: {currentCase.overallStatus}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-md)',
          fontSize: '13px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 600 }}>Project Name</div>
            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{currentCase.projectName}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 600 }}>Project Agency</div>
            <div style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{currentCase.agency}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 600 }}>State & District</div>
            <div style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{currentCase.district}, {currentCase.state}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 600 }}>Total Land Parcels</div>
            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{currentCase.totalParcels} Parcels ({currentCase.affectedFamilies} Families)</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 600 }}>Submission Date</div>
            <div style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{currentCase.submittedDate}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 600 }}>Current Verification Stage</div>
            <div style={{ fontWeight: 700, color: '#0369a1' }}>{currentCase.currentStage.replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      {/* ---------------- MAIN WORKFLOW CONTAINER (DOCUMENT LIST + VIEWER + PANEL) ---------------- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 320px',
        gap: 'var(--space-md)',
        height: '820px',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* LEFT-SIDE DOCUMENT NAVIGATION PANEL */}
        <div style={{
          backgroundColor: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--primary)',
            textTransform: 'uppercase',
            borderBottom: '2px solid var(--surface-container-high)',
            paddingBottom: '8px',
            marginBottom: '12px'
          }}>
            Documents Submitted ({currentCase.documents.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {currentCase.documents.map((doc, idx) => {
              const isSelected = doc.id === selectedDocument.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  style={{
                    backgroundColor: isSelected ? '#0a2540' : 'var(--surface-container-low)',
                    color: isSelected ? '#ffffff' : 'var(--on-surface)',
                    border: `1px solid ${isSelected ? '#0a2540' : 'var(--outline-variant)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(10,37,64,0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#9ef6b6' : 'var(--outline)' }}>
                      Doc {doc.docNumber}
                    </span>
                    {getDocStatusBadge(doc.status)}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.3 }}>
                    {doc.title}
                  </div>
                  <div style={{ fontSize: '10px', color: isSelected ? '#b0c8eb' : 'var(--on-surface-variant)', marginTop: '4px' }}>
                    {doc.pages.length} Pages | {doc.type}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER DOCUMENT VIEWER AREA */}
        <DocumentViewerArea
          document={selectedDocument}
          documentIndex={selectedDocIndex}
          totalDocuments={currentCase.documents.length}
          onAddPage={handleAddPage}
          onPrevDoc={() => {
            if (selectedDocIndex > 0) {
              handleSelectDocument(currentCase.documents[selectedDocIndex - 1]);
            }
          }}
          onNextDoc={() => {
            if (selectedDocIndex < currentCase.documents.length - 1) {
              handleSelectDocument(currentCase.documents[selectedDocIndex + 1]);
            }
          }}
        />

        {/* RIGHT-SIDE DOCUMENT VERIFICATION PANEL */}
        <DocumentVerificationPanel
          document={selectedDocument}
          documentIndex={selectedDocIndex}
          totalDocuments={currentCase.documents.length}
          allVerifiedForCurrentStage={allVerifiedForCurrentStage}
          currentAuthorityLevel={currentOfficer.authorityLevel}
          caseStage={currentCase.currentStage}
          overallStatus={currentCase.overallStatus}
          onVerifyClick={() => setIsVerifyModalOpen(true)}
          onRejectClick={() => setIsRejectModalOpen(true)}
          onNextDocumentClick={() => {
            if (selectedDocIndex < currentCase.documents.length - 1) {
              handleSelectDocument(currentCase.documents[selectedDocIndex + 1]);
            }
          }}
          onProceedNextStageClick={handleProceedNextStage}
        />
      </div>

      {/* VERIFICATION HISTORY & AUDIT LOG TABLE */}
      <AuditHistoryTable logs={currentCase.auditLogs} />

      {/* MODALS */}
      <VerifyConfirmModal
        isOpen={isVerifyModalOpen}
        documentTitle={selectedDocument.title}
        onClose={() => setIsVerifyModalOpen(false)}
        onConfirm={handleConfirmVerification}
      />

      <RejectDocumentModal
        isOpen={isRejectModalOpen}
        documentTitle={selectedDocument.title}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirmReject={handleConfirmRejection}
      />

      {/* viaSocket NOTIFICATION TOAST */}
      <ViaSocketNotificationToast
        event={activeRejectionEvent}
        onDismiss={() => setActiveRejectionEvent(null)}
      />
    </div>
  );
};
