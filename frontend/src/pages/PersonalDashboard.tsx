import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User, CheckCircle2, Clock, FileText, Download,
  Upload, AlertCircle, CreditCard, ShieldCheck, Check, AlertTriangle, RefreshCw,
  Eye, History, X
} from 'lucide-react';
import { getStoredUser, fetchBeneficiaryPayments } from '../services/api';
import type { PaymentRecord } from '../services/api';
import type { SubmittedDocument } from '../types/landownerDocuments';
import { getMyDocuments } from '../services/documentUploadService';
import {
  fetchVerificationCase,
  uploadOrResubmitDocument,
  fetchLandownerDocumentsSummary
} from '../services/verificationApi';
import type {
  LandownerDocumentsDashboard,
  LandownerDocumentItem
} from '../services/verificationApi';
import { DocumentStatusCard } from '../components/personal/DocumentStatusCard';
import { DocumentViewerModal } from '../components/government/DocumentViewerModal';
import { io } from 'socket.io-client';

interface PersonalDashboardProps {
  initialTab?: 'PARCELS' | 'CASE_TIMELINE' | 'COMPENSATION' | 'DOCUMENTS' | 'GRIEVANCE';
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({ initialTab = 'PARCELS' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<
    'PARCELS' | 'CASE_TIMELINE' | 'COMPENSATION' | 'DOCUMENTS' | 'GRIEVANCE'
  >(() => {
    if (location.pathname === '/personal/documents') return 'DOCUMENTS';
    return initialTab;
  });

  const [docDashboard, setDocDashboard] = useState<LandownerDocumentsDashboard | null>(null);
  const [loadingDocDashboard, setLoadingDocDashboard] = useState(false);
  const [selectedReasonDoc, setSelectedReasonDoc] = useState<LandownerDocumentItem | null>(null);

  const [submittedDocs, setSubmittedDocs] = useState<SubmittedDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [verificationCase, setVerificationCase] = useState<any>(null);
  const [selectedViewerDoc, setSelectedViewerDoc] = useState<any>(null);
  const [reuploadModalDoc, setReuploadModalDoc] = useState<any>(null);
  const [reuploading, setReuploading] = useState(false);

  const currentUser = getStoredUser() || {
    id: 'usr-landowner-demo',
    name: 'Demo Landowner',
    phone: '9373784832',
    user_type: 'PERSONAL',
    role: 'LANDOWNER',
    state: 'Demo State',
    district: 'Demo District',
    linked_parcels: ['P-001', '124/2'],
    assigned_projects: ['LA-2026-001']
  };

  const myParcels = [
    { id: 'P-001', khasra: '124/2', mauza: 'Demo Village', taluka: 'Demo Taluka', district: 'Demo District', hadbast: '124', areaHa: 2.40, share: '100% Owner', landType: 'Dry Agricultural (Jirayat)', status: 'UNDER VERIFICATION', project: 'National Highway Project', awardRs: '₹ 14,28,000' },
    { id: 'P-002', khasra: '124/3', mauza: 'Demo Village', taluka: 'Demo Taluka', district: 'Demo District', hadbast: '124', areaHa: 1.20, share: '50% Co-sharer', landType: 'Commercial Corridor Strip', status: 'SECTION 19 DECLARED', project: 'National Highway Project', awardRs: '₹ 7,20,000' },
    { id: 'P-003', khasra: '125/1', mauza: 'Demo Village', taluka: 'Demo Taluka', district: 'Demo District', hadbast: '125', areaHa: 3.50, share: '100% Owner', landType: 'Wet Agricultural', status: 'POSSESSION TAKEN', project: 'National Highway Project', awardRs: '₹ 21,00,000' }
  ];

  // Load Payments & Verification Data
  const loadLandownerPayments = () => {
    setLoadingPayments(true);
    fetchBeneficiaryPayments('usr-landowner-01')
      .then(res => setPayments(res))
      .catch(err => console.error('Failed to load landowner payments:', err))
      .finally(() => setLoadingPayments(false));
  };

  const loadVerificationData = () => {
    fetchVerificationCase('LA-2026-001')
      .then(res => setVerificationCase(res))
      .catch(err => console.error('Failed to load verification case:', err));
  };

  const loadDocumentsDashboard = () => {
    setLoadingDocDashboard(true);
    fetchLandownerDocumentsSummary('LA-2026-001')
      .then(res => setDocDashboard(res))
      .catch(err => console.error('Failed to load landowner documents dashboard:', err))
      .finally(() => setLoadingDocDashboard(false));
  };

  useEffect(() => {
    if (location.pathname === '/personal/documents') {
      setActiveTab('DOCUMENTS');
    }
  }, [location.pathname]);

  useEffect(() => {
    loadLandownerPayments();
    loadVerificationData();
    loadDocumentsDashboard();
  }, []);

  // Listen to Socket.IO for real-time payment & verification updates
  useEffect(() => {
    const socket = io('/', { path: '/socket.io', transports: ['websocket', 'polling'] });

    socket.on('payment_status_changed', (payload: { payment: PaymentRecord }) => {
      if (
        payload.payment.beneficiary_id === 'usr-landowner-01' ||
        payload.payment.beneficiary_id === currentUser.id ||
        payload.payment.parcel_id === 'P-001'
      ) {
        setPayments(prev => {
          const idx = prev.findIndex(p => p.id === payload.payment.id);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = payload.payment;
            return copy;
          }
          return [payload.payment, ...prev];
        });
      }
    });

    socket.on('landowner_notification', () => {
      loadVerificationData();
      loadDocumentsDashboard();
    });

    socket.on('verification_case_updated', () => {
      loadVerificationData();
      loadDocumentsDashboard();
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser.id]);


  // Load submitted documents when Documents tab is active
  useEffect(() => {
    if (activeTab === 'DOCUMENTS') {
      loadDocumentsDashboard();
      setLoadingDocs(true);
      getMyDocuments('LA-2026-001')
        .then(docs => setSubmittedDocs(docs))
        .finally(() => setLoadingDocs(false));
    }
  }, [activeTab]);

  const pendingCount = submittedDocs.filter(d => d.status === 'PENDING' || d.status === 'RESUBMITTED').length;
  const rejectedCount = submittedDocs.filter(d => d.status === 'REJECTED').length;
  const verifiedCount = submittedDocs.filter(d => d.status === 'VERIFIED').length;

  return (
    <div style={{
      maxWidth: '1300px',
      margin: '0 auto',
      padding: 'var(--space-xl)',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: 'var(--on-background)'
    }}>
      {/* ── Landowner Portal Profile Header ── */}
      <div style={{
        backgroundColor: '#fff7ed',
        border: '1px solid #ffedd5',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>

          {/* Left — Portal label + profile fields */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              backgroundColor: '#461300', color: '#ffffff', borderRadius: '50%',
              width: '52px', height: '52px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ backgroundColor: '#461300', color: '#ffffff', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                  LANDOWNER PORTAL
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 28px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#9a3412', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Name</span>
                  <div style={{ fontWeight: 700, color: '#1a0800', fontSize: '15px', marginTop: '1px' }}>{currentUser.name || 'Demo Landowner'}</div>
                </div>
                <div>
                  <span style={{ color: '#9a3412', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Registration No.</span>
                  <div style={{ fontWeight: 700, color: '#461300', fontSize: '14px', fontFamily: 'monospace', marginTop: '1px' }}>
                    {currentUser.id ? `LO-2026-${String(currentUser.id).replace(/\D/g, '').slice(-3).padStart(3, '0')}` : 'LO-2026-001'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#9a3412', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>District</span>
                  <div style={{ fontWeight: 600, color: '#1a0800', marginTop: '1px' }}>{currentUser.district || 'Demo District'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Case association info */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: 'var(--radius-md)', padding: '14px 20px', minWidth: '220px', fontSize: '13px' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: '#9a3412', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Association</span>
              <div style={{ fontWeight: 700, color: '#1a0800', marginTop: '2px' }}>
                {verificationCase?.projectName || verificationCase?.project_name || 'National Highway Project'}
              </div>
            </div>
            <div>
              <span style={{ color: '#9a3412', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Case Code</span>
              <div style={{ fontWeight: 800, color: '#461300', fontSize: '16px', fontFamily: 'monospace', marginTop: '2px' }}>
                {verificationCase?.caseId || 'LA-2026-001'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Rejection & Correction Alert ── */}
      {verificationCase?.activeRejection && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: 'var(--space-lg)',
          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertCircle size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: '#dc2626', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                    ACTION REQUIRED
                  </span>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#991b1b', margin: 0 }}>
                    Document Rejected: {verificationCase.activeRejection.documentTitle || 'Field Inspection & Physical Verification Report'}
                  </h3>
                </div>
                <div style={{ fontSize: '13px', color: '#7f1d1d', marginTop: '6px', lineHeight: 1.5 }}>
                  Rejected by <strong>{verificationCase.activeRejection.authorityLevel || 'District Collector'}</strong> on {verificationCase.activeRejection.timestamp}
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '6px', border: '1px solid #fecaca', marginTop: '10px', fontSize: '13px' }}>
                  <div><strong>Issue Category:</strong> {verificationCase.activeRejection.issueCategory || 'Boundary Discrepancy'}</div>
                  <div style={{ marginTop: '4px' }}><strong>Reason:</strong> {verificationCase.activeRejection.rejectionReason}</div>
                  {verificationCase.activeRejection.remarks && <div style={{ marginTop: '4px' }}><strong>Officer Remarks:</strong> {verificationCase.activeRejection.remarks}</div>}
                  <div style={{ marginTop: '6px', color: '#b91c1c', fontWeight: 700 }}>
                    Required Corrective Action: {verificationCase.activeRejection.requiredCorrection}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const targetDoc = verificationCase?.documents?.find((d: any) => d.id === verificationCase.activeRejection?.documentId) || {
                  id: verificationCase?.activeRejection?.documentId || 'DOC-002',
                  title: verificationCase?.activeRejection?.documentTitle || '7/12 Extract / Land Record',
                  type: 'SEVEN_TWELVE_EXTRACT',
                  version: 1,
                  rejectionReason: verificationCase?.activeRejection?.rejectionReason,
                  rejectionCategory: verificationCase?.activeRejection?.issueCategory,
                  rejectionRemarks: verificationCase?.activeRejection?.remarks
                };
                setReuploadModalDoc(targetDoc);
              }}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '12px 22px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
              }}
            >
              <Upload size={16} /> Re-Upload Corrected Document
            </button>
          </div>
        </div>
      )}

      {/* ── Compact document shortcut banner (non-prominent) ── */}
      {rejectedCount > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1.5px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: 'var(--space-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={16} /> {rejectedCount} document{rejectedCount > 1 ? 's' : ''} rejected — action required
          </span>
          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            Go to My Documents
          </button>
        </div>
      )}

      {/* ── Key Summary Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)'
      }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>My Land Parcels</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#461300', marginTop: '4px' }}>1 Parcel (P-001)</div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Total 2.40 Hectares (124/2)</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Award Compensation</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#166534', marginTop: '4px' }}>₹ 14,28,000</div>
          <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px', fontWeight: 600 }}>Includes 100% Solatium Grant</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Government Verification Stage</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#3730a3', marginTop: '4px' }}>
            {verificationCase?.currentStage === 'STATE_GOVERNMENT' ? 'State Stage' : verificationCase?.currentStage === 'CENTRAL_MINISTRY' ? 'Central Stage' : 'District Stage'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
            {verificationCase?.workflowStatus?.replace(/_/g, ' ') || 'Stage 1 in Progress'}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Aadhaar &amp; Bank Linking</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#166534', marginTop: '4px' }}>VERIFIED ✓</div>
          <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px', fontWeight: 600 }}>DBT Direct Transfer Ready</div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '2px solid var(--outline-variant)',
        marginBottom: 'var(--space-lg)',
        overflowX: 'auto'
      }}>
        {[
          { key: 'PARCELS', label: 'My Land' },
          { key: 'DOCUMENTS', label: 'My Documents' },
          { key: 'CASE_TIMELINE', label: 'Land Acquisition' },
          { key: 'COMPENSATION', label: 'Compensation' },
          { key: 'GRIEVANCE', label: 'Help & Query' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === t.key ? '3px solid #461300' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === t.key ? '#461300' : 'var(--on-surface-variant)',
              fontWeight: activeTab === t.key ? 700 : 600,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'Arial, Helvetica, sans-serif'
            }}
          >
            {t.label}
            {t.key === 'DOCUMENTS' && rejectedCount > 0 && (
              <span style={{
                marginLeft: '6px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px'
              }}>
                {rejectedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB 1: MY LAND PARCELS
      ══════════════════════════════════════════ */}
      {activeTab === 'PARCELS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
          {myParcels.map((p, idx) => (
            <div key={idx} style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: '#461300', color: '#ffffff', fontSize: '12px', fontWeight: 700, padding: '3px 9px', borderRadius: '4px' }}>
                    {p.id}
                  </span>
                  <span style={{ backgroundColor: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px' }}>
                    Khasra {p.khasra}
                  </span>
                </div>
                <span style={{
                  backgroundColor: p.status === 'POSSESSION TAKEN' ? '#f0fdf4' : p.status === 'SECTION 19 DECLARED' ? '#eff6ff' : '#fffbeb',
                  color: p.status === 'POSSESSION TAKEN' ? '#166534' : p.status === 'SECTION 19 DECLARED' ? '#1d4ed8' : '#854d0e',
                  border: `1px solid ${p.status === 'POSSESSION TAKEN' ? '#86efac' : p.status === 'SECTION 19 DECLARED' ? '#93c5fd' : '#fde68a'}`,
                  fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px'
                }}>
                  {p.status}
                </span>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                Mouza {p.mauza}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '14px', lineHeight: 1.7 }}>
                <span>Taluka: <strong>{p.taluka}</strong></span> &nbsp;·&nbsp;
                <span>District: <strong>{p.district}</strong></span><br />
                Land Type: <strong>{p.landType}</strong><br />
                Area: <strong>{p.areaHa} Ha</strong>&nbsp;&nbsp;|&nbsp;&nbsp;Shareholding: <strong>{p.share}</strong><br />
                Project: <strong>{p.project}</strong>
              </div>

              <div style={{ borderTop: '1px solid var(--surface-container-high)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Calculated Award</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#166534' }}>{p.awardRs}</div>
                </div>
                <button
                  onClick={() => navigate(`/gis?parcel=${p.id}`)}
                  style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Arial, Helvetica, sans-serif' }}
                >
                  🗺 View on GIS
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* ══════════════════════════════════════════
          TAB 2: CASE TIMELINE
      ══════════════════════════════════════════ */}
      {activeTab === 'CASE_TIMELINE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

          {/* Case summary banner */}
          <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius-lg)', padding: '18px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>Case Code</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#461300', fontFamily: 'monospace', marginTop: '2px' }}>{verificationCase?.caseId || 'LA-2026-001'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>Project</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a0800', marginTop: '2px' }}>{verificationCase?.projectName || 'National Highway Project'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>Parcel</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a0800', marginTop: '2px' }}>P-001 &nbsp;·&nbsp; Khasra 124/2</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>Current Stage</div>
              <div style={{ marginTop: '4px' }}>
                <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px' }}>
                  {verificationCase?.currentStage === 'STATE_GOVERNMENT' ? 'State Verification' : verificationCase?.currentStage === 'CENTRAL_MINISTRY' ? 'Central Verification' : 'District Verification'}
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>Status</div>
              <div style={{ marginTop: '4px' }}>
                <span style={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px' }}>
                  {verificationCase?.workflowStatus?.replace(/_/g, ' ') || 'In Progress'}
                </span>
              </div>
            </div>
          </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#461300', margin: '0 0 20px 0' }}>
            Acquisition Statutory Progress
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', borderLeft: '3px solid #0a2540', paddingLeft: '24px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>✓ Step 1: Section 11 Preliminary Notification Published</div>
              <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Published in Extra-Ordinary Gazette on 10 Aug 2026</div>
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>✓ Step 2: Social Impact Assessment (SIA) Approved</div>
              <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>IIT Bombay Expert Panel cleared public purpose justification on 22 Aug 2026</div>
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0369a1' }}>🟢 Step 3: District Collector Document Verification</div>
              <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Currently under active verification by Dr. Rajesh Sharma, IAS (District Collector - Pune)</div>
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8' }}>⏳ Step 4: CALA Final Compensation Award Declaration</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Pending completion of State & Central statutory clearances</div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 3: COMPENSATION & PFMS PAYMENT TRACKING
      ══════════════════════════════════════════ */}
      {activeTab === 'COMPENSATION' && (() => {
        const primaryPayment = payments[0] || null;
        const isSuccess = primaryPayment?.status === 'SUCCESS';
        const isFailed = primaryPayment?.status === 'FAILED';
        const isProcessing = primaryPayment?.status === 'PROCESSING' || primaryPayment?.status === 'INITIATED';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            
            {/* ── Live Payment Status Banner ── */}
            {primaryPayment ? (
              <div style={{
                backgroundColor: isSuccess ? '#f0fdf4' : isFailed ? '#fef2f2' : '#eff6ff',
                border: isSuccess ? '2px solid #86efac' : isFailed ? '2px solid #fecaca' : '2px solid #93c5fd',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        backgroundColor: isSuccess ? '#166534' : isFailed ? '#991b1b' : '#1d4ed8',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '12px'
                      }}>
                        PFMS DBT DISBURSEMENT: {primaryPayment.status}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Ref: <strong>{primaryPayment.payment_reference}</strong>
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      margin: '8px 0 2px 0',
                      color: isSuccess ? '#166534' : isFailed ? '#991b1b' : '#1e3a8a'
                    }}>
                      {isSuccess && '✓ Compensation Amount Successfully Credited to Your Bank Account'}
                      {isProcessing && '⏳ Compensation Payment Initiated — Clearing via RBI / NPCI'}
                      {isFailed && '✕ Payment Mandate Rejected by Bank (Rectification in Progress)'}
                    </h3>
                    
                    <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                      {isSuccess && `Direct Benefit Transfer of ₹ ${(primaryPayment.amount).toLocaleString('en-IN')} has been finalized by ${primaryPayment.bank_name}.`}
                      {isProcessing && `Disbursing Officer (CALA) has forwarded batch ${primaryPayment.batch_id} to the RBI clearing switch. Direct credit will reflect shortly.`}
                      {isFailed && `Notice: ${primaryPayment.failure_reason || 'Bank details mismatch. CALA has been notified for re-verification.'}`}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {isSuccess ? 'CREDITED AMOUNT' : 'INITIATED AMOUNT'}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: isSuccess ? '#166534' : '#0f172a' }}>
                      ₹ {(primaryPayment.amount).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      (₹ {(primaryPayment.amount / 100000).toFixed(2)} Lakh)
                    </div>
                  </div>
                </div>

                {/* Audit Steps Mini-Timeline */}
                {primaryPayment.audit_trail && primaryPayment.audit_trail.length > 0 && (
                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      LATEST GATEWAY MILESTONE:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1e293b' }}>
                      <Check size={14} color={isSuccess ? '#166534' : '#0284c7'} />
                      <span>{primaryPayment.audit_trail[primaryPayment.audit_trail.length - 1].remarks}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        ({primaryPayment.audit_trail[primaryPayment.audit_trail.length - 1].timestamp})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* ── Statutory RFCTLARR Award Breakdown ── */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#461300', margin: '0 0 4px 0' }}>
                    RFCTLARR Act 2013 Statutory Award Assessment (Khasra 124/2 • Hinjawadi)
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                    CALA Award Declaration Under Section 23 &amp; Section 30 Mandatory Solatium
                  </div>
                </div>
                <span style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px' }}>
                  Award Declared (§ 23)
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#461300', color: '#ffffff' }}>
                    <th style={{ padding: '10px 14px' }}>Compensation Component</th>
                    <th style={{ padding: '10px 14px' }}>Statutory Calculation Basis</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Assessed Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>Base Market Value</td>
                    <td style={{ padding: '10px 14px' }}>State Ready Reckoner ASR Rate (6.8 Ha @ ₹105/sq.m)</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>₹ 71,40,000</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>Schedule I Rural Multiplier Factor</td>
                    <td style={{ padding: '10px 14px' }}>Factor 1.0 (Urban Fringe / Growth Zone)</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>₹ 71,40,000</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>100% Mandatory Solatium (Section 30)</td>
                    <td style={{ padding: '10px 14px' }}>100% grant on assessed market value for compulsory acquisition</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>₹ 71,40,000</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f0fdf4', fontWeight: 700 }}>
                    <td style={{ padding: '12px 14px', color: '#166534' }}>Total Final Award Disbursable</td>
                    <td style={{ padding: '12px 14px', color: '#166534' }}>Total Gross Statutory Compensation Claim</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#166534', fontSize: '16px' }}>₹ 1,42,80,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── Verified Bank & DBT Account Details ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--space-md)'
            }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CreditCard size={18} color="#0a2540" />
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0a2540' }}>
                    Verified Bank Account for Direct Transfer
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Bank Name:</span>
                    <strong>{primaryPayment?.bank_name || 'State Bank of India (Hinjawadi Branch)'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Account Number:</span>
                    <strong>{primaryPayment?.bank_account_mask || '••••••••3421'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>IFSC Code:</span>
                    <strong>{primaryPayment?.bank_ifsc || 'SBIN0001824'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Aadhaar NPCI Mapping:</span>
                    <span style={{ color: '#166534', fontWeight: 700 }}>Active &amp; Linked ✓</span>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <ShieldCheck size={18} color="#166534" />
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#166534' }}>
                    Direct Benefit Transfer Guarantee
                  </h4>
                </div>

                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                  In compliance with Section 77 of the RFCTLARR Act 2013, 100% of the award amount is disbursed directly via the Public Financial Management System (PFMS) escrow account into the beneficiary’s bank account. No cash disbursements or physical cheques are permitted.
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => navigate('/government/gis')}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    View Parcel on GIS Map
                  </button>
                </div>
              </div>
            </div>

            {/* ── Transaction History Table ── */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0a2540' }}>
                  PFMS Transaction History &amp; Receipts
                </h4>
                <button
                  onClick={loadLandownerPayments}
                  style={{ background: 'none', border: 'none', fontSize: '12px', color: '#0284c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={12} /> Sync Status
                </button>
              </div>

              {payments.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No payment transactions recorded yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ padding: '8px 12px' }}>Date</th>
                      <th style={{ padding: '8px 12px' }}>Reference</th>
                      <th style={{ padding: '8px 12px' }}>Parcel</th>
                      <th style={{ padding: '8px 12px' }}>Amount (₹)</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                      <th style={{ padding: '8px 12px' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px' }}>{p.initiated_at.split(' ')[0]}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.payment_reference}</td>
                        <td style={{ padding: '8px 12px' }}>Parcel {p.parcel_id}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#166534' }}>
                          ₹ {(p.amount).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: p.status === 'SUCCESS' ? '#f0fdf4' : p.status === 'FAILED' ? '#fef2f2' : '#eff6ff',
                            color: p.status === 'SUCCESS' ? '#166534' : p.status === 'FAILED' ? '#991b1b' : '#1d4ed8'
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>
                          {p.status === 'SUCCESS' ? 'Credited to State Bank of India' : p.status === 'FAILED' ? p.failure_reason : 'Processing with RBI NACH'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        );
      })()}


      {/* ══════════════════════════════════════════
          TAB 4: DOCUMENT STATUS DASHBOARD
      ══════════════════════════════════════════ */}
      {activeTab === 'DOCUMENTS' && (() => {
        const summary = docDashboard?.summary || {
          verified: 1,
          pending: 2,
          required: 3,
          actionRequired: 1,
          totalRequired: 7
        };

        const docs = docDashboard?.documents || [];

        const getDocBadge = (item: LandownerDocumentItem) => {
          if (item.status === 'VERIFIED') {
            return { label: item.displayStatus || '✓ VERIFIED BY DISTRICT', color: '#166534', bg: '#dcfce7', border: '#86efac' };
          }
          if (item.status === 'REJECTED') {
            return { label: item.displayStatus || '✕ REJECTED BY DISTRICT', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' };
          }
          if (item.status === 'PENDING_VERIFICATION' || (item as any).status === 'PENDING') {
            return { label: item.displayStatus || '⏳ PENDING DISTRICT VERIFICATION', color: '#854d0e', bg: '#fffbeb', border: '#fde68a' };
          }
          return { label: item.displayStatus || '● REQUIRED — NOT UPLOADED', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };
        };

        return (
          <div>
            {/* Header / Case Title */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#461300', margin: 0, letterSpacing: '0.02em' }}>
                    MY DOCUMENTS — STATUS DASHBOARD
                  </h3>
                  <span style={{
                    backgroundColor: '#ffedd5',
                    color: '#9a3412',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #fed7aa'
                  }}>
                    LANDOWNER PORTAL
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Case: <strong style={{ color: '#0f172a' }}>{docDashboard?.caseId || 'LA-2026-001'}</strong> ({(docDashboard as any)?.caseTitle || 'Mumbai–Pune Expressway Widening & Corridor Project'}) · Khasra 124/2 (Parcel P-001)
                </div>
              </div>
            </div>

            {/* ── Summary Counters Header (4 Cards) ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: '24px'
            }}>
              {/* Verified Card */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '10px',
                padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Verified
                  </span>
                  <CheckCircle2 size={18} color="#166534" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#166534', lineHeight: 1 }}>
                  {summary.verified}
                </div>
                <div style={{ fontSize: '11px', color: '#15803d', marginTop: '6px', fontWeight: 600 }}>
                  Approved by verification officers
                </div>
              </div>

              {/* Pending Verification Card */}
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: '10px',
                padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#854d0e', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Pending Verification
                  </span>
                  <Clock size={18} color="#854d0e" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#854d0e', lineHeight: 1 }}>
                  {summary.pending}
                </div>
                <div style={{ fontSize: '11px', color: '#a16207', marginTop: '6px', fontWeight: 600 }}>
                  Uploaded — waiting in officer queue
                </div>
              </div>

              {/* Required Card */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Required
                  </span>
                  <FileText size={18} color="#475569" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {summary.required}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
                  Not yet uploaded
                </div>
              </div>

              {/* Action Required Card */}
              <div style={{
                backgroundColor: summary.actionRequired > 0 ? '#fef2f2' : '#f8fafc',
                border: `1.5px solid ${summary.actionRequired > 0 ? '#fca5a5' : '#e2e8f0'}`,
                borderRadius: '10px',
                padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: summary.actionRequired > 0 ? '#991b1b' : '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Action Required
                  </span>
                  <AlertCircle size={18} color={summary.actionRequired > 0 ? '#991b1b' : '#94a3b8'} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: summary.actionRequired > 0 ? '#991b1b' : '#64748b', lineHeight: 1 }}>
                  {summary.actionRequired}
                </div>
                <div style={{ fontSize: '11px', color: summary.actionRequired > 0 ? '#b91c1c' : '#94a3b8', marginTop: '6px', fontWeight: 600 }}>
                  {summary.actionRequired > 0 ? 'Rejected — re-upload required' : 'No rejected items'}
                </div>
              </div>
            </div>

            {/* ── Multi-tier Verification Progress ── */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#461300', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                Overall Verification Progress
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {/* District */}
                <div style={{
                  flex: 1,
                  minWidth: '220px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#fff7ed',
                  border: '1px solid #ffedd5'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#461300' }}>1. District Verification</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a'
                    }}>
                      STAGE 1 · IN PROGRESS
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#7c2d12' }}>
                    CALA Officer / Talathi field boundary &amp; title verification
                  </div>
                </div>

                <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '16px' }}>→</div>

                {/* State */}
                <div style={{
                  flex: 1,
                  minWidth: '220px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>2. State Verification</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#f1f5f9',
                      color: '#64748b',
                      border: '1px solid #cbd5e1'
                    }}>
                      STAGE 2 · PENDING
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    State Revenue Department legal endorsement
                  </div>
                </div>

                <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '16px' }}>→</div>

                {/* Central */}
                <div style={{
                  flex: 1,
                  minWidth: '220px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>3. Central Verification</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#f1f5f9',
                      color: '#64748b',
                      border: '1px solid #cbd5e1'
                    }}>
                      STAGE 3 · PENDING
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Central Ministry PFMS compensation clearing
                  </div>
                </div>
              </div>
            </div>

            {/* ── Required Documents List Section ── */}
            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#461300', margin: '0 0 4px 0' }}>
                Required Documents Checklist
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Every required document for land acquisition verification and compensation clearance. Select <strong>Upload</strong> or <strong>Re-upload</strong> directly on any document.
              </p>
            </div>

            {/* Document Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              {docs.map((doc, idx) => {
                const isRejected = doc.status === 'REJECTED';
                const isVerified = doc.status === 'VERIFIED';
                const isPending = doc.status === 'PENDING_VERIFICATION' || (doc as any).status === 'PENDING';
                const isNotUploaded = doc.status === 'NOT_UPLOADED';
                const badge = getDocBadge(doc);

                const cardBg = isRejected ? '#fef2f2' : isVerified ? '#f0fdf4' : isPending ? '#fffdf5' : '#f8fafc';
                const cardBorder = isRejected ? '2px solid #ef4444' : isVerified ? '1.5px solid #86efac' : isPending ? '1.5px solid #fde68a' : '1.5px dashed #94a3b8';
                const cardShadow = isRejected ? '0 2px 8px rgba(239, 68, 68, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)';

                return (
                  <div
                    key={doc.slug}
                    style={{
                      backgroundColor: cardBg,
                      border: cardBorder,
                      borderRadius: '10px',
                      padding: '18px 20px',
                      boxShadow: cardShadow,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                      {/* Left: Document Info */}
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8' }}>
                            {idx + 1}.
                          </span>
                          <h4 style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 700,
                            color: isRejected ? '#991b1b' : isVerified ? '#14532d' : isPending ? '#78350f' : '#0f172a'
                          }}>
                            {doc.title}
                          </h4>
                          {doc.version && doc.version > 1 && (
                            <span style={{
                              backgroundColor: '#e2e8f0',
                              color: '#334155',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              Version {doc.version}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', lineHeight: 1.4 }}>
                          {doc.subtitle || (doc as any).description}
                        </div>

                        {/* Status specific details */}
                        {isNotUploaded && (
                          <div style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700 }}>Accepted formats:</span> {doc.acceptedFormats || 'PDF, JPG, PNG'} • Max size: {doc.maxSizeMb || 10}MB
                          </div>
                        )}

                        {isPending && (
                          <div style={{ fontSize: '12px', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>Uploaded on: <strong>{doc.uploadedDate || 'Today'}</strong></span>
                            <span>•</span>
                            <span>{doc.totalPages || (doc as any).pagesCount || (doc.pages && doc.pages.length) || 1} page(s) submitted</span>
                            <span>•</span>
                            <span>Ref: <strong>{doc.documentId || 'SUBMITTED'}</strong></span>
                          </div>
                        )}

                        {isVerified && (
                          <div style={{ fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>Verified on: <strong>{doc.verifiedAt || doc.uploadedDate || '10 Sep 2026'}</strong></span>
                            <span>•</span>
                            <span>Ref: <strong>{doc.documentId}</strong></span>
                            <span>•</span>
                            <span>Verified for Case {docDashboard?.caseId || 'LA-2026-001'}</span>
                          </div>
                        )}

                        {/* REJECTED Callout Box */}
                        {isRejected && (
                          <div style={{
                            marginTop: '12px',
                            backgroundColor: '#ffffff',
                            border: '1.5px solid #fca5a5',
                            borderRadius: '8px',
                            padding: '12px 16px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <AlertCircle size={15} color="#dc2626" />
                              <span style={{ color: '#991b1b', fontSize: '12px', fontWeight: 800 }}>
                                REJECTION NOTICE
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#991b1b', lineHeight: 1.5 }}>
                              <strong>Reason:</strong> {doc.rejectionReason || 'Document could not be verified by District Officer'}
                            </div>
                            {doc.rejectionRemarks && (
                              <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '4px' }}>
                                <strong>Officer Remarks:</strong> {doc.rejectionRemarks}
                              </div>
                            )}
                            <div style={{ marginTop: '8px', display: 'inline-block', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.03em' }}>
                              Action: RE-UPLOAD REQUIRED
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Badge & Contextual Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                        {/* Status Badge */}
                        <span style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '4px 12px',
                          borderRadius: '20px',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.02em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          {badge.label}
                        </span>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {isNotUploaded && (
                            <button
                              onClick={() => navigate(`/personal/documents/upload/${doc.slug}`)}
                              style={{
                                backgroundColor: '#461300',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 18px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                                boxShadow: '0 1px 3px rgba(70, 19, 0, 0.2)'
                              }}
                            >
                              <Upload size={14} /> Upload
                            </button>
                          )}

                          {isPending && (
                            <button
                              onClick={() => {
                                const targetDoc = (doc as any).document || {
                                  id: doc.documentId || `DOC-${doc.slug}`,
                                  title: doc.title,
                                  type: doc.documentType,
                                  docNumber: doc.documentId || 'SUBMITTED',
                                  status: 'PENDING',
                                  version: doc.version || 1,
                                  totalPages: doc.totalPages || (doc as any).pagesCount || (doc.pages && doc.pages.length) || 1,
                                  uploadedDate: doc.uploadedDate || 'Today',
                                  history: doc.history || [],
                                  pages: (doc.pages && doc.pages.length > 0) ? doc.pages : [
                                    {
                                      pageNumber: 1,
                                      title: doc.title,
                                      contentHeading: `Landowner Upload Submission`,
                                      khasraNumbers: ['124/2'],
                                      areaHa: 2.40,
                                      landowner: currentUser.name,
                                      village: 'Demo Village',
                                      taluka: 'Demo Taluka',
                                      district: 'Demo District',
                                      statusLabel: 'WAITING FOR DISTRICT VERIFICATION'
                                    }
                                  ]
                                };
                                setSelectedViewerDoc(targetDoc);
                              }}
                              style={{
                                backgroundColor: '#ffffff',
                                color: '#461300',
                                border: '1.5px solid #461300',
                                borderRadius: '6px',
                                padding: '7px 16px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontFamily: 'Arial, Helvetica, sans-serif'
                              }}
                            >
                              <Eye size={14} /> View
                            </button>
                          )}

                          {isVerified && (
                            <button
                              onClick={() => {
                                const targetDoc = (doc as any).document || {
                                  id: doc.documentId || `DOC-${doc.slug}`,
                                  title: doc.title,
                                  type: doc.documentType,
                                  docNumber: doc.documentId || 'VERIFIED',
                                  status: 'VERIFIED',
                                  version: doc.version || 1,
                                  totalPages: doc.totalPages || (doc as any).pagesCount || (doc.pages && doc.pages.length) || 1,
                                  uploadedDate: doc.uploadedDate || '10 Sep 2026',
                                  history: doc.history || [],
                                  pages: (doc.pages && doc.pages.length > 0) ? doc.pages : [
                                    {
                                      pageNumber: 1,
                                      title: doc.title,
                                      contentHeading: `District Verified Acquisition Record`,
                                      khasraNumbers: ['124/2'],
                                      areaHa: 2.40,
                                      landowner: currentUser.name,
                                      village: 'Demo Village',
                                      taluka: 'Demo Taluka',
                                      district: 'Demo District',
                                      statusLabel: 'AUTHENTICATED AND APPROVED'
                                    }
                                  ]
                                };
                                setSelectedViewerDoc(targetDoc);
                              }}
                              style={{
                                backgroundColor: '#166534',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '7px 16px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontFamily: 'Arial, Helvetica, sans-serif'
                              }}
                            >
                              <Eye size={14} /> View
                            </button>
                          )}

                          {isRejected && (
                            <>
                              <button
                                onClick={() => setSelectedReasonDoc(doc)}
                                style={{
                                  backgroundColor: '#ffffff',
                                  color: '#dc2626',
                                  border: '1.5px solid #dc2626',
                                  borderRadius: '6px',
                                  padding: '7px 14px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontFamily: 'Arial, Helvetica, sans-serif'
                                }}
                              >
                                <AlertCircle size={14} /> View Reason
                              </button>
                              <button
                                onClick={() => navigate(`/personal/documents/upload/${doc.slug}${doc.documentId ? `?reupload=${doc.documentId}` : ''}`)}
                                style={{
                                  backgroundColor: '#dc2626',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '7px 16px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontFamily: 'Arial, Helvetica, sans-serif',
                                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)'
                                }}
                              >
                                <RefreshCw size={14} /> Re-upload
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Official issued documents section */}
            <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#461300', margin: '0 0 14px 0' }}>
                Official Issued Certificates &amp; Gazette Notices
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Section 11 Gazette Notice Copy', '7/12 Verified Title Extract', 'Cadastral Survey Map Sheet', 'Preliminary Award Notice'].map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} color="#461300" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>{doc}</span>
                    </div>
                    <button
                      onClick={() => alert(`Downloading official ${doc}...`)}
                      style={{ backgroundColor: '#461300', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Arial, Helvetica, sans-serif' }}
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════
          TAB 5: GRIEVANCE
      ══════════════════════════════════════════ */}
      {activeTab === 'GRIEVANCE' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '28px', maxWidth: '650px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#461300', margin: '0 0 12px 0' }}>
            District CALA Landowner Help &amp; Inquiry Desk
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '20px' }}>
            Have a question regarding your land area assessment, survey numbers, or award disbursement? Submit an inquiry directly to the CALA office.
          </p>

          <form onSubmit={e => { e.preventDefault(); alert('Inquiry submitted to District Collectorate CALA desk!'); }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#461300', marginBottom: '6px' }}>Subject</label>
              <input
                type="text"
                placeholder="e.g. Khasra 124/2 area measurement clarification"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--outline-variant)', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#461300', marginBottom: '6px' }}>Inquiry Message</label>
              <textarea
                rows={4}
                placeholder="Type your inquiry details..."
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--outline-variant)', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              style={{ backgroundColor: '#461300', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              Submit Inquiry to District CALA Office
            </button>
          </form>
        </div>
      )}

      {/* ── Document Viewer Modal ── */}
      <DocumentViewerModal
        isOpen={Boolean(selectedViewerDoc)}
        onClose={() => setSelectedViewerDoc(null)}
        document={selectedViewerDoc}
      />

      {/* ── Landowner Rejection Reason & Action Modal ── */}
      {selectedReasonDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          fontFamily: 'Arial, Helvetica, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{ backgroundColor: '#991b1b', color: '#ffffff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#fca5a5" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Rejection Notice &amp; Required Action
                </h3>
              </div>
              <button onClick={() => setSelectedReasonDoc(null)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedReasonDoc.title}
                </h4>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Ref: {selectedReasonDoc.documentId || 'N/A'} • Submitted Version: Version {selectedReasonDoc.version || 1}
                </div>
              </div>

              {/* Rejection Notice */}
              <div style={{ backgroundColor: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#991b1b', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Officer Findings (District Land Acquisition Office):
                </div>
                <div style={{ fontSize: '14px', color: '#7f1d1d', fontWeight: 600, lineHeight: 1.5 }}>
                  {selectedReasonDoc.rejectionReason}
                </div>
                {selectedReasonDoc.rejectionRemarks && (
                  <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '6px', borderTop: '1px dashed #fca5a5', paddingTop: '6px' }}>
                    <strong>Officer Remarks:</strong> {selectedReasonDoc.rejectionRemarks}
                  </div>
                )}
              </div>

              {/* Action Required Box */}
              <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#9a3412' }}>
                <strong>Required Action:</strong>
                <div style={{ marginTop: '4px' }}>
                  Please obtain a clear and updated copy addressing the officer remarks above and re-upload. Your re-submission will be logged as <strong>Version {(selectedReasonDoc.version || 1) + 1}</strong> and immediately routed back to the verification queue.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedReasonDoc(null)}
                  style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const slug = selectedReasonDoc.slug;
                    const docId = selectedReasonDoc.documentId;
                    setSelectedReasonDoc(null);
                    navigate(`/personal/documents/upload/${slug}${docId ? `?reupload=${docId}` : ''}`);
                  }}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  <RefreshCw size={15} /> Re-upload Corrected Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Landowner Re-Upload Modal ── */}
      {reuploadModalDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          fontFamily: 'Arial, Helvetica, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{ backgroundColor: '#461300', color: '#ffffff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={20} color="#fca5a5" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Re-Upload Corrected Document (Version {(reuploadModalDoc.version || 1) + 1})
                </h3>
              </div>
              <button onClick={() => setReuploadModalDoc(null)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Rejection Notice */}
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>
                  Previous Version {reuploadModalDoc.version || 1} Rejection Details:
                </div>
                <div style={{ fontSize: '13px', color: '#7f1d1d' }}>
                  <strong>{reuploadModalDoc.rejectionCategory || 'Survey number mismatch'}:</strong> {reuploadModalDoc.rejectionReason}
                </div>
                {reuploadModalDoc.rejectionRemarks && (
                  <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '4px' }}>
                    Remarks: {reuploadModalDoc.rejectionRemarks}
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#166534' }}>
                <strong>Correction Applied (Version {(reuploadModalDoc.version || 1) + 1}):</strong>
                <div style={{ marginTop: '4px' }}>
                  Corrected survey number to <strong>124/2</strong> matching cadastral parcel <strong>P-001</strong>. Clean non-encumbrance title extract attached.
                </div>
              </div>

              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '18px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                <FileText size={36} color="#461300" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {reuploadModalDoc.title.replace(/[\/\s]+/g, '_')}_v{(reuploadModalDoc.version || 1) + 1}_CORRECTED.pdf
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  DEMO DOCUMENT — FOR SIH PROTOTYPE
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setReuploadModalDoc(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reuploading}
                  onClick={() => {
                    const handleUpload = async () => {
                      setReuploading(true);
                      try {
                        const correctedPages = [
                          {
                            pageNumber: 1,
                            title: "Form VII-XII Record of Rights (Corrected)",
                            contentHeading: "DEMO DOCUMENT — FOR SIH PROTOTYPE",
                            khasraNumbers: ["124/2"],
                            areaHa: 2.40,
                            landowner: "Demo Landowner",
                            village: "Demo Village",
                            taluka: "Demo Taluka",
                            district: "Demo District",
                            landType: "Dry Agricultural (Jirayat)",
                            statusLabel: "CORRECTED VERSION 2 — SUBMITTED"
                          },
                          {
                            pageNumber: 2,
                            title: "Form 6 Mutation Register Entries (Authenticated)",
                            contentHeading: "Succession & Lawful Possession Attestation (Talathi Endorsement)"
                          }
                        ];

                        const res = await uploadOrResubmitDocument('LA-2026-001', {
                          documentId: reuploadModalDoc.id,
                          documentType: reuploadModalDoc.type,
                          title: reuploadModalDoc.title,
                          pages: correctedPages,
                          uploadedBy: "Demo Landowner"
                        });
                        setVerificationCase(res);
                        setReuploadModalDoc(null);
                      } catch (err: any) {
                        alert(err.message || 'Failed to submit document');
                      } finally {
                        setReuploading(false);
                      }
                    };
                    handleUpload();
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#461300',
                    color: '#ffffff',
                    cursor: reuploading ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Upload size={16} /> {reuploading ? 'Submitting...' : `Submit Corrected Version ${(reuploadModalDoc.version || 1) + 1}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDashboard;
