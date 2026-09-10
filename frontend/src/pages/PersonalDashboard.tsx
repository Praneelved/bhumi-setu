import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, CheckCircle2, Clock, FileText, Download,
  Upload, AlertCircle, CreditCard, ShieldCheck, Check, AlertTriangle, RefreshCw,
  Eye, History, X
} from 'lucide-react';
import { getStoredUser, fetchBeneficiaryPayments } from '../services/api';
import type { PaymentRecord } from '../services/api';
import type { SubmittedDocument } from '../types/landownerDocuments';
import { getMyDocuments } from '../services/documentUploadService';
import { fetchVerificationCase, uploadOrResubmitDocument } from '../services/verificationApi';
import { DocumentStatusCard } from '../components/personal/DocumentStatusCard';
import { DocumentViewerModal } from '../components/government/DocumentViewerModal';
import { io } from 'socket.io-client';

export const PersonalDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'PARCELS' | 'CASE_TIMELINE' | 'COMPENSATION' | 'DOCUMENTS' | 'GRIEVANCE'
  >('PARCELS');

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
    { khasra: '124/2', mauza: 'Demo Village', hadbast: '124', areaHa: 2.40, share: '100% Owner', landType: 'Dry Agricultural (Jirayat)', status: 'UNDER VERIFICATION', awardRs: '₹ 14,28,000' },
    { khasra: '124/3', mauza: 'Demo Village', hadbast: '124', areaHa: 1.20, share: '50% Co-sharer', landType: 'Commercial Corridor Strip', status: 'SECTION_19', awardRs: '₹ 7,20,000' },
    { khasra: '125/1', mauza: 'Demo Village', hadbast: '125', areaHa: 3.50, share: '100% Owner', landType: 'Wet Agricultural', status: 'POSSESSION_TAKEN', awardRs: '₹ 21,00,000' }
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

  useEffect(() => {
    loadLandownerPayments();
    loadVerificationData();
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
    });

    socket.on('verification_case_updated', () => {
      loadVerificationData();
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser.id]);


  // Load submitted documents when Documents tab is active
  useEffect(() => {
    if (activeTab === 'DOCUMENTS') {
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
      {/* ── Citizen Header Banner ── */}
      <div style={{
        backgroundColor: '#fff7ed',
        border: '1px solid #ffedd5',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              backgroundColor: '#461300', color: '#ffffff', borderRadius: '50%',
              width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#9a3412', margin: 0 }}>
                  Welcome, {currentUser.name}
                </h2>
                <span style={{ backgroundColor: '#461300', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                  LANDOWNER PORTAL
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7c2d12' }}>
                Registered Mobile: <strong>{currentUser.phone || '+91 9876543210'}</strong> | District: <strong>{currentUser.district}, {currentUser.state}</strong>
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #ffedd5', borderRadius: 'var(--radius-md)', padding: '10px 16px', fontSize: '12px', textAlign: 'right' }}>
            <span style={{ color: '#9a3412', fontWeight: 700 }}>Associated Case Code:</span><br />
            <strong style={{ fontSize: '15px', color: '#461300' }}>LA-2026-001 (Mumbai–Pune Expansion)</strong>
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

      {/* ── Prominent Document Submission Card ── */}
      <div style={{

        backgroundColor: '#461300',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: 'var(--space-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 16px rgba(70,19,0,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: '52px', height: '52px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Upload size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
              Submit Land Documents
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
              Upload the required documents for verification of your land acquisition case.
              Use your camera or select files from your device.
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('DOCUMENTS')}
          style={{
            backgroundColor: '#ffffff',
            color: '#461300',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            fontFamily: 'Arial, Helvetica, sans-serif',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <Upload size={18} /> View / Upload Documents
        </button>
      </div>

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
          { key: 'CASE_TIMELINE', label: 'Acquisition Case' },
          { key: 'COMPENSATION', label: 'Compensation' },
          { key: 'GRIEVANCE', label: 'Help & Inquiry' }
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ backgroundColor: '#461300', color: '#ffffff', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px' }}>
                  Khasra No: {p.khasra}
                </span>
                <span style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                  {p.status}
                </span>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                Mouza {p.mauza} (Hadbast No. {p.hadbast})
              </div>

              <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '16px', lineHeight: 1.6 }}>
                Land Type: <strong>{p.landType}</strong><br />
                Area Assessed: <strong>{p.areaHa} Hectares</strong><br />
                Shareholding: <strong>{p.share}</strong>
              </div>

              <div style={{ borderTop: '1px solid var(--surface-container-high)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Calculated Award</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#166534' }}>{p.awardRs}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 2: CASE TIMELINE
      ══════════════════════════════════════════ */}
      {activeTab === 'CASE_TIMELINE' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#461300', margin: '0 0 20px 0' }}>
            Acquisition Statutory Progress (Case LA-2026-001)
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
          TAB 4: DOCUMENT SUBMISSIONS (MY DOCUMENTS)
      ══════════════════════════════════════════ */}
      {activeTab === 'DOCUMENTS' && (() => {
        const rawDocs = (verificationCase?.documents && verificationCase.documents.length > 0)
          ? verificationCase.documents
          : submittedDocs;

        const currentPendingCount = rawDocs.filter((d: any) => d.status === 'PENDING' || d.status === 'RESUBMITTED').length;
        const currentRejectedCount = rawDocs.filter((d: any) => d.status === 'REJECTED').length;
        const currentVerifiedCount = rawDocs.filter((d: any) => d.status === 'VERIFIED').length;

        return (
          <div>
            {/* Header / Summary */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#461300', margin: '0 0 4px 0', letterSpacing: '0.03em' }}>
                  MY DOCUMENTS
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                  {rawDocs.length} mandatory documents for Case LA-2026-001 ·
                  <span style={{ color: '#166534', fontWeight: 700 }}> {currentVerifiedCount} verified</span> ·
                  <span style={{ color: '#856404', fontWeight: 700 }}> {currentPendingCount} pending</span>
                  {currentRejectedCount > 0 && <span style={{ color: '#991b1b', fontWeight: 700 }}> · {currentRejectedCount} rejected</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  const firstRejected = rawDocs.find((d: any) => d.status === 'REJECTED');
                  if (firstRejected) setReuploadModalDoc(firstRejected);
                  else alert('All mandatory documents are currently submitted or verified.');
                }}
                style={{
                  backgroundColor: '#461300',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'Arial, Helvetica, sans-serif'
                }}
              >
                <Upload size={16} /> Re-Upload / Update Documents
              </button>
            </div>

            {/* Rejected alert banner */}
            {currentRejectedCount > 0 && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <AlertCircle size={22} color="#991b1b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: '#991b1b', fontWeight: 700 }}>
                  {currentRejectedCount} document{currentRejectedCount > 1 ? 's' : ''} require{currentRejectedCount === 1 ? 's' : ''} correction and re-upload.
                  Please review the rejection reason and submit Version 2 below.
                </span>
              </div>
            )}

            {/* Document List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {rawDocs.map((doc: any, index: number) => {
                const isDocRejected = doc.status === 'REJECTED';
                const isDocVerified = doc.status === 'VERIFIED';

                return (
                  <div
                    key={doc.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: `1.5px solid ${isDocRejected ? '#fca5a5' : isDocVerified ? '#86efac' : 'var(--outline-variant)'}`,
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                    }}
                  >
                    {/* Card Header */}
                    <div style={{
                      backgroundColor: isDocRejected ? '#fef2f2' : isDocVerified ? '#f0fdf4' : '#f8fafc',
                      borderBottom: `1px solid ${isDocRejected ? '#fecaca' : isDocVerified ? '#bbf7d0' : '#e2e8f0'}`,
                      padding: '14px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: isDocRejected ? '#991b1b' : '#0a2540' }}>
                          {index + 1}. {doc.title}
                        </h4>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                          Ref: <strong>{doc.id}</strong> • Type: <strong>{doc.type}</strong> • Total Pages: <strong>{doc.totalPages || doc.pages?.length || 1}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: isDocRejected ? '#fee2e2' : isDocVerified ? '#dcfce7' : '#fffbeb',
                          color: isDocRejected ? '#991b1b' : isDocVerified ? '#15803d' : '#854d0e',
                          border: `1px solid ${isDocRejected ? '#fecaca' : isDocVerified ? '#86efac' : '#fde68a'}`
                        }}>
                          {isDocVerified ? '✓ Verified' : isDocRejected ? '✕ REJECTED' : '⏳ Pending Verification'}
                        </span>
                        <button
                          onClick={() => setSelectedViewerDoc(doc)}
                          style={{
                            backgroundColor: '#0a2540',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '7px 14px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '13px' }}>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Status</span>
                          <div style={{ fontWeight: 600, marginTop: '2px', color: isDocRejected ? '#991b1b' : isDocVerified ? '#166534' : '#854d0e' }}>
                            {isDocVerified ? 'Verified by Authority' : isDocRejected ? 'REJECTED' : 'Pending Verification'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Upload Date</span>
                          <div style={{ fontWeight: 600, marginTop: '2px', color: '#0f172a' }}>{doc.uploadedDate || '10 Sep 2026'}</div>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Version</span>
                          <div style={{ fontWeight: 700, marginTop: '2px', color: '#0a2540' }}>Version {doc.version || 1}</div>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Verification Authority</span>
                          <div style={{ fontWeight: 600, marginTop: '2px', color: '#0f172a' }}>District Collectorate</div>
                        </div>
                      </div>

                      {/* Prominent Rejection Banner */}
                      {isDocRejected && (
                        <div style={{
                          marginTop: '16px',
                          backgroundColor: '#fef2f2',
                          border: '1.5px solid #ef4444',
                          borderRadius: '8px',
                          padding: '16px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span style={{ backgroundColor: '#dc2626', color: '#ffffff', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                  REJECTED
                                </span>
                                <strong style={{ color: '#991b1b', fontSize: '14px' }}>Document Requires Correction</strong>
                              </div>
                              <div style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>
                                <div><strong>Reason:</strong> {doc.rejectionReason}</div>
                                {doc.rejectionRemarks && <div style={{ marginTop: '3px' }}><strong>Remarks:</strong> {doc.rejectionRemarks}</div>}
                                {doc.rejectionCategory && <div style={{ marginTop: '3px', fontSize: '12px', color: '#991b1b' }}>Category: {doc.rejectionCategory}</div>}
                              </div>
                            </div>
                            <button
                              onClick={() => setReuploadModalDoc(doc)}
                              style={{
                                backgroundColor: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                              }}
                            >
                              <RefreshCw size={15} /> RE-UPLOAD DOCUMENT
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Verification History */}
                      {doc.history && doc.history.length > 0 && (
                        <div style={{ marginTop: '14px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <History size={13} /> Verification History
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {doc.history.map((hist: any, hIdx: number) => (
                              <div key={hIdx} style={{ fontSize: '12px', color: '#334155', backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontWeight: 700 }}>Version {hist.version}</span>: {hist.status} on {hist.rejected_at || hist.verified_at || hist.uploaded_date}
                                {hist.rejection_reason && <span style={{ color: '#991b1b' }}> — Reason: {hist.rejection_reason}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Official issued documents section */}
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--outline-variant)', paddingTop: '24px' }}>
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
