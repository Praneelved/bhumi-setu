import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileText,
  Send,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  fetchPayments,
  fetchBeneficiaryPayments,
  initiatePayment,
  retryPayment,
  simulatePaymentStatus,
  approveCompensationAward
} from '../services/api';
import type { PaymentRecord } from '../services/api';
import { io } from 'socket.io-client';

const GovernmentCompensationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryCaseId = searchParams.get('case') || '';

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Payment for Audit Trail Modal
  const [activePayment, setActivePayment] = useState<PaymentRecord | null>(null);

  // Simulation Modal State
  const [simulationPayment, setSimulationPayment] = useState<PaymentRecord | null>(null);
  const [simulationTargetStatus, setSimulationTargetStatus] = useState<'PROCESSING' | 'SUCCESS' | 'FAILED'>('SUCCESS');
  const [simulationFailureReason, setSimulationFailureReason] = useState<string>('PFMS-ERR-902: Beneficiary Name Mismatch against Aadhaar NPCI Mapper');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load payments from backend
  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await fetchPayments({
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  // Connect to Socket.IO for real-time disbursement updates
  useEffect(() => {
    const socket = io('/', { path: '/socket.io', transports: ['websocket', 'polling'] });

    socket.on('payment_status_changed', (payload: { payment: PaymentRecord }) => {
      console.log('Real-time payment event received:', payload);
      setPayments(prev => {
        const idx = prev.findIndex(p => p.id === payload.payment.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = payload.payment;
          return updated;
        } else {
          return [payload.payment, ...prev];
        }
      });

      if (activePayment && activePayment.id === payload.payment.id) {
        setActivePayment(payload.payment);
      }

      showToast(`⚡ Real-Time Update: Payment ${payload.payment.payment_reference} status changed to ${payload.payment.status}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [activePayment]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Handle Retry
  const handleRetry = async (paymentId: string) => {
    try {
      const res = await retryPayment(paymentId, 'CALA officer verified beneficiary bank credentials and re-submitted to PFMS');
      showToast(res.message);
      loadPayments();
    } catch (err: any) {
      alert(err.message || 'Retry failed');
    }
  };

  // Execute Simulation
  const handleExecuteSimulation = async () => {
    if (!simulationPayment) return;
    setSimulating(true);
    try {
      const res = await simulatePaymentStatus(
        simulationPayment.id,
        simulationTargetStatus,
        simulationTargetStatus === 'FAILED' ? simulationFailureReason : undefined
      );
      showToast(`Simulation Applied: ${res.message}`);
      setSimulationPayment(null);
      loadPayments();
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  // Filter payments by search
  const filteredPayments = payments.filter(p => {
    if (queryCaseId && p.case_id !== queryCaseId) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.payment_reference.toLowerCase().includes(q) ||
      p.beneficiary_name.toLowerCase().includes(q) ||
      p.parcel_id.toLowerCase().includes(q) ||
      p.case_id.toLowerCase().includes(q) ||
      p.bank_name.toLowerCase().includes(q)
    );
  });

  // KPI Calculations
  const totalAmount = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const successAmount = payments.filter(p => p.status === 'SUCCESS').reduce((acc, p) => acc + (p.amount || 0), 0);
  const processingCount = payments.filter(p => p.status === 'PROCESSING' || p.status === 'INITIATED').length;
  const failedCount = payments.filter(p => p.status === 'FAILED').length;

  return (
    <div style={{ padding: 'var(--space-lg) var(--space-xl)', backgroundColor: 'var(--background)', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#0a2540',
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderLeft: '4px solid #16a34a'
        }}>
          <CheckCircle2 size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)',
        backgroundColor: '#0a2540',
        color: '#ffffff',
        padding: '18px 24px',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
              Government Compensation &amp; PFMS / DBT Payment Gateway
            </h1>
            <span style={{ backgroundColor: '#166534', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
              CALA LIVE DISBURSEMENT
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
            RFCTLARR 2013 Mandatory Solatium Grants • Direct Benefit Transfer to Landowner Bank Accounts • Zero Intermediary Escrow
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/government/gis')}
            style={{
              backgroundColor: '#ffffff',
              color: '#0a2540',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Cadastral GIS Map
          </button>
          <button
            onClick={() => navigate('/government/verification')}
            style={{
              backgroundColor: 'var(--tertiary-container)',
              color: 'var(--on-tertiary-container)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={15} /> Case Verification
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="desktop-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="surface-card" style={{ gridColumn: 'span 3', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL AWARDS ASSESSED</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--on-surface)', margin: '4px 0' }}>
            ₹ {(totalAmount / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '11px', color: 'var(--outline)' }}>Includes 100% Solatium (Sec 30)</div>
        </div>

        <div className="surface-card" style={{ gridColumn: 'span 3', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>PFMS CREDITED TO CITIZENS</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#166534', margin: '4px 0' }}>
            ₹ {(successAmount / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>100% Direct Account Credit</div>
        </div>

        <div className="surface-card" style={{ gridColumn: 'span 3', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>ACTIVE DBT MANDATES</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0284c7', margin: '4px 0' }}>
            {processingCount} In-Flight
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>RBI NACH Clearing Queue</div>
        </div>

        <div className="surface-card" style={{ gridColumn: 'span 3', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>FAILED / RETRY QUEUE</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: failedCount > 0 ? '#dc2626' : '#64748b', margin: '4px 0' }}>
            {failedCount} Exceptions
          </div>
          <div style={{ fontSize: '11px', color: failedCount > 0 ? '#dc2626' : '#64748b', fontWeight: 600 }}>
            {failedCount > 0 ? 'Requires CALA Rectification' : 'Zero Active Failures'}
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        marginBottom: 'var(--space-md)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '280px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Beneficiary, PFMS Ref (e.g. 98124), Khasra, or Bank..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--outline-variant)',
              fontSize: '13px',
              fontFamily: 'Arial, Helvetica, sans-serif'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', fontSize: '12px', backgroundColor: '#fff' }}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PROCESSING">PROCESSING (In-Flight)</option>
            <option value="SUCCESS">SUCCESS (Credited to Citizen)</option>
            <option value="FAILED">FAILED (Requires Retry)</option>
          </select>

          <button
            onClick={loadPayments}
            title="Refresh Table"
            style={{
              padding: '8px 12px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <RefreshCw size={14} color="#475569" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Payments Disbursement Table ── */}
      <div className="surface-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0a2540' }}>
              Official PFMS / DBT Direct Landowner Disbursement Ledger
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Displaying {filteredPayments.length} transactions across verified statutory cases
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#0a2540', color: '#ffffff' }}>
                <th style={{ padding: '12px 14px' }}>Payment Reference</th>
                <th style={{ padding: '12px 14px' }}>Beneficiary Landowner</th>
                <th style={{ padding: '12px 14px' }}>Parcel &amp; Case</th>
                <th style={{ padding: '12px 14px' }}>Bank Account &amp; IFSC</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Award Amount (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Gateway Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Loading live disbursement ledger…
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No payment disbursements match the current filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isSuccess = p.status === 'SUCCESS';
                  const isFailed = p.status === 'FAILED';
                  const isProcessing = p.status === 'PROCESSING' || p.status === 'INITIATED';

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isFailed ? '#fff5f5' : '#ffffff' }}>
                      
                      {/* Payment Ref */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0a2540' }}>{p.payment_reference}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Batch: {p.batch_id} • {p.payment_channel}</div>
                      </td>

                      {/* Beneficiary */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.beneficiary_name}</div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>
                          Aadhaar: {p.beneficiary_aadhaar_mask || '•••• •••• 9821'}
                        </div>
                      </td>

                      {/* Parcel & Case */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600 }}>Parcel {p.parcel_id}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Case: <strong>{p.case_id}</strong></div>
                      </td>

                      {/* Bank Details */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{p.bank_name}</div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>
                          A/C: {p.bank_account_mask} • IFSC: {p.bank_ifsc}
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: isSuccess ? '#166534' : '#0f172a' }}>
                          ₹ {(Number(p.amount) || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          (₹ {((Number(p.amount) || 0) / 100000).toFixed(2)} Lakh)
                        </div>

                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {isSuccess && (
                          <span style={{
                            backgroundColor: '#f0fdf4',
                            color: '#166534',
                            border: '1px solid #86efac',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle2 size={12} /> CREDITED
                          </span>
                        )}
                        {isProcessing && (
                          <span style={{
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #93c5fd',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Clock size={12} /> PROCESSING
                          </span>
                        )}
                        {isFailed && (
                          <span style={{
                            backgroundColor: '#fef2f2',
                            color: '#991b1b',
                            border: '1px solid #fecaca',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <AlertCircle size={12} /> FAILED
                          </span>
                        )}
                        {isFailed && p.failure_reason && (
                          <div style={{ fontSize: '10px', color: '#b91c1c', marginTop: '4px', maxWidth: '160px' }}>
                            {p.failure_reason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          
                          {/* Audit Trail Button */}
                          <button
                            onClick={() => setActivePayment(p)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FileText size={12} /> Audit Trail
                          </button>

                          {/* Retry Button (if FAILED) */}
                          {isFailed && (
                            <button
                              onClick={() => handleRetry(p.id)}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <RotateCcw size={12} /> Retry PFMS
                            </button>
                          )}

                          {/* SIH Evaluation Simulator Button */}
                          <button
                            onClick={() => {
                              setSimulationPayment(p);
                              setSimulationTargetStatus(p.status === 'SUCCESS' ? 'FAILED' : 'SUCCESS');
                            }}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#f59e0b',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Simulate Bank / Gateway Response (For Judges Demo)"
                          >
                            <Play size={12} /> Simulate
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL 1: AUDIT TRAIL MODAL
      ══════════════════════════════════════════════════════════ */}
      {activePayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0a2540' }}>
                  Statutory Payment Audit Trail
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Ref: {activePayment.payment_reference} • Beneficiary: {activePayment.beneficiary_name}
                </div>
              </div>
              <button
                onClick={() => setActivePayment(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Payment Summary */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>Case ID: <strong>{activePayment.case_id}</strong></div>
                <div>Parcel ID: <strong>{activePayment.parcel_id}</strong></div>
                <div>Amount: <strong style={{ color: '#166534' }}>₹ {activePayment.amount.toLocaleString()}</strong></div>
                <div>Bank: <strong>{activePayment.bank_name}</strong></div>
                <div>Account Mask: <strong>{activePayment.bank_account_mask}</strong></div>
                <div>IFSC: <strong>{activePayment.bank_ifsc}</strong></div>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: '#0a2540' }}>
              Immutable Transaction Milestones:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activePayment.audit_trail && activePayment.audit_trail.length > 0 ? (
                activePayment.audit_trail.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: step.status === 'SUCCESS' ? '#166534' : step.status === 'FAILED' ? '#dc2626' : '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: '1', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{step.status}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{step.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                        {step.remarks}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        Actor / System: {step.actor}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748b', fontSize: '12px' }}>No audit history found.</div>
              )}
            </div>

            <button
              onClick={() => setActivePayment(null)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '10px',
                backgroundColor: '#0a2540',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL 2: SIH DEMO SIMULATION CONTROLLER (FOR JUDGES)
      ══════════════════════════════════════════════════════════ */}
      {simulationPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '540px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            borderTop: '6px solid #f59e0b'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  SIH EVALUATION CONTROLLER (PROTOTYPE SIMULATOR)
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0a2540' }}>
                  Simulate Bank &amp; PFMS Gateway Callback
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Simulates asynchronous clearing switch callback for payment {simulationPayment.payment_reference}.
                </div>
              </div>
              <button
                onClick={() => setSimulationPayment(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
              <div>Beneficiary: <strong>{simulationPayment.beneficiary_name}</strong></div>
              <div>Amount: <strong style={{ color: '#166534' }}>₹ {simulationPayment.amount.toLocaleString()}</strong></div>
              <div>Current Status: <strong>{simulationPayment.status}</strong></div>
            </div>

            {/* Choose Target Outcome */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                Select Simulated Gateway Response:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSimulationTargetStatus('SUCCESS')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '6px',
                    border: simulationTargetStatus === 'SUCCESS' ? '2px solid #166534' : '1px solid #cbd5e1',
                    backgroundColor: simulationTargetStatus === 'SUCCESS' ? '#f0fdf4' : '#ffffff',
                    color: simulationTargetStatus === 'SUCCESS' ? '#166534' : '#334155',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✓ SUCCESS (Credit)
                </button>

                <button
                  type="button"
                  onClick={() => setSimulationTargetStatus('FAILED')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '6px',
                    border: simulationTargetStatus === 'FAILED' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                    backgroundColor: simulationTargetStatus === 'FAILED' ? '#fef2f2' : '#ffffff',
                    color: simulationTargetStatus === 'FAILED' ? '#dc2626' : '#334155',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✕ FAILED (Reject)
                </button>

                <button
                  type="button"
                  onClick={() => setSimulationTargetStatus('PROCESSING')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '6px',
                    border: simulationTargetStatus === 'PROCESSING' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    backgroundColor: simulationTargetStatus === 'PROCESSING' ? '#eff6ff' : '#ffffff',
                    color: simulationTargetStatus === 'PROCESSING' ? '#0284c7' : '#334155',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ⏳ PROCESSING
                </button>
              </div>
            </div>

            {/* If FAILED, choose failure reason */}
            {simulationTargetStatus === 'FAILED' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Simulated Failure / Rejection Reason:
                </label>
                <select
                  value={simulationFailureReason}
                  onChange={(e) => setSimulationFailureReason(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                >
                  <option value="PFMS-ERR-902: Beneficiary Name Mismatch against Aadhaar NPCI Mapper">
                    PFMS-ERR-902: Beneficiary Name Mismatch against Aadhaar NPCI Mapper
                  </option>
                  <option value="NPCI-ERR-404: Account Inactive / KYC Update Required">
                    NPCI-ERR-404: Account Inactive / KYC Update Required
                  </option>
                  <option value="RBI-CLEARING-501: Invalid IFSC Branch Code">
                    RBI-CLEARING-501: Invalid IFSC Branch Code
                  </option>
                </select>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px' }}>
              💡 Notice: Applying this simulation will instantly update the database, trigger a real-time Socket.IO event, and reflect across both the Government and Landowner portals without a page refresh.
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSimulationPayment(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSimulation}
                disabled={simulating}
                style={{
                  flex: 2,
                  padding: '10px',
                  backgroundColor: '#0a2540',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {simulating ? 'Sending Callback…' : 'Apply Simulated Callback'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GovernmentCompensationPage;
