import React, { useState, useEffect } from 'react';
import { Map, Users, CheckCircle2, AlertTriangle, FileText, ShieldCheck, ChevronDown, RefreshCw, Cpu, Upload, X, ArrowRight, Check, Zap, Wifi } from 'lucide-react';
import { fetchParcels, verifyParcel, calculateCompensation, extractDocumentOCR, getStoredUser, type Parcel, type CompensationCalcResult, type OCRResult } from '../services/api';
import { useSocket } from '../services/socket';

const CadastralTracker = () => {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [socketNotice, setSocketNotice] = useState<string | null>(null);

  // Compensation Calculator State
  const [calcArea, setCalcArea] = useState<number>(1.84);
  const [calcBaseRate, setCalcBaseRate] = useState<number>(18.40);
  const [calcMultiplier, setCalcMultiplier] = useState<number>(1.50);
  const [calcResult, setCalcResult] = useState<CompensationCalcResult>({
    area_ha: 1.84,
    base_rate_lakh_per_ha: 18.40,
    market_value_lakh: 33.86,
    multiplier_factor: 1.50,
    assessed_value_lakh: 50.78,
    solatium_100_percent_lakh: 50.78,
    total_payable_lakh: 101.57,
    total_payable_cr: 1.0157
  });

  // OCR Modal State
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  // Real-Time Socket.IO Integration
  const { isConnected } = useSocket({
    parcel_verified: (data: any) => {
      console.log('⚡ Socket event received: parcel_verified', data);
      if (data && data.parcel) {
        setParcels(prev => prev.map(p => p.id === data.parcel.id ? data.parcel : p));
        setSocketNotice(`Real-time update: Khasra ${data.parcel.khasra_no} was certified by ${data.parcel.verified_by}`);
        setTimeout(() => setSocketNotice(null), 5000);
      }
    },
    parcel_status_changed: (data: any) => {
      console.log('⚡ Socket event received: parcel_status_changed', data);
      if (data && data.parcel) {
        setParcels(prev => prev.map(p => p.id === data.parcel.id ? data.parcel : p));
      }
    }
  });

  const loadParcels = async (filter?: string) => {
    setLoading(true);
    try {
      const data = await fetchParcels(filter || statusFilter);
      setParcels(data);
    } catch (err: any) {
      console.error("Failed to fetch parcels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getStoredUser());
    loadParcels();
  }, [statusFilter]);

  const handleVerifyParcel = async (id: string) => {
    setVerifyingId(id);
    setActionSuccess(null);
    try {
      const res = await verifyParcel(id);
      setActionSuccess(res.message);
      setParcels(prev => prev.map(p => p.id === id ? res.parcel : p));
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to verify parcel");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRecalculate = async () => {
    try {
      const res = await calculateCompensation(calcArea, calcBaseRate, calcMultiplier);
      setCalcResult(res);
    } catch (err) {
      console.error("Failed to calculate compensation:", err);
    }
  };

  const handleRunOcr = async () => {
    setOcrLoading(true);
    try {
      const res = await extractDocumentOCR('JAMABANDI');
      setOcrResult(res);
    } catch (err: any) {
      alert("OCR Extraction failed: " + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  const canVerify = currentUser && (
    currentUser.user_type === 'GOVERNMENT' ||
    ['CENTRAL_ADMIN', 'STATE_OFFICER', 'DISTRICT_OFFICER', 'ACQUISITION_OFFICER'].includes(currentUser.role)
  );

  return (
    <div style={{ padding: 'var(--space-lg) var(--space-xl)', backgroundColor: 'var(--background)' }}>
      {/* Top Breadcrumb & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>National Portal</span>
        <span style={{ color: 'var(--outline-variant)' }}>›</span>
        <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Punjab (State Code 03)</span>
        <span style={{ color: 'var(--outline-variant)' }}>›</span>
        <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>District Ludhiana (LDU-PB)</span>
        <span style={{ color: 'var(--outline-variant)' }}>›</span>
        <span className="label-sm" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          {currentUser ? `${currentUser.role} • ${currentUser.name}` : 'CALA SLAO Ludhiana West'}
        </span>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span className="label-sm" style={{ color: isConnected ? 'var(--secondary)' : 'var(--outline)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wifi size={12} /> {isConnected ? 'Socket.IO Real-Time Live' : 'Connecting Real-Time...'}
          </span>
          <span style={{ backgroundColor: 'var(--secondary-container)', color: 'var(--on-secondary-container)', padding: '4px 8px', borderRadius: 'var(--radius)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> NIC Digital Token Validated
          </span>
        </div>
      </div>

      {/* Socket Broadcast Alert */}
      {socketNotice && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 'var(--radius)', color: '#1E40AF', marginBottom: 'var(--space-md)', fontSize: '13px', fontWeight: 600 }}>
          <Zap size={16} />
          <span>{socketNotice}</span>
        </div>
      )}

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#EDF7EE', border: '1px solid #86EFAC', borderRadius: 'var(--radius)', color: '#046A38', marginBottom: 'var(--space-md)', fontSize: '14px', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Project Header */}
      <div className="surface-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <span style={{ backgroundColor: 'var(--primary-container)', color: 'var(--on-primary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 700 }}>NH-704, Pkg-03B</span>
              <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#B45309' }}></div> Section 19 Declared
              </span>
              <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Ludhiana West, Punjab</span>
              {currentUser?.user_type === 'PERSONAL' && (
                <span style={{ backgroundColor: 'var(--secondary-container)', color: 'var(--on-secondary-container)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 700 }}>
                  Landowner View
                </span>
              )}
            </div>
            <h1 className="headline-2xl" style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--on-surface)' }}>Delhi–Amritsar–Katra Expressway</h1>
            <p className="body-md" style={{ margin: 0, color: 'var(--on-surface-variant)' }}>Gazette Ref: S.O. 4192(E) • CALA SDM Ludhiana West</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button 
              onClick={() => setOcrModalOpen(true)}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-container)', cursor: 'pointer' }}>
              <Cpu size={16} /> AI OCR Document Extraction
            </button>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Map size={16} /> Corridor Map
            </button>
          </div>
        </div>

        {/* Project KPIs */}
        <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
          <div style={{ flex: 1, backgroundColor: 'var(--surface-container-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)' }}>
            <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 8px 0' }}>LENGTH</p>
            <div className="headline-xl" style={{ color: 'var(--on-surface)', margin: 0 }}>42.6 km</div>
            <p className="label-sm" style={{ color: 'var(--secondary)', margin: '4px 0 0 0' }}>100% Pegged</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'var(--surface-container-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)' }}>
            <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 8px 0' }}>LAND REQUIRED</p>
            <div className="headline-xl" style={{ color: 'var(--on-surface)', margin: 0 }}>480.2 Ha</div>
            <p className="label-sm" style={{ color: 'var(--outline)', margin: '4px 0 0 0' }}>3,842 Kanal</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'var(--surface-container-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)' }}>
            <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 8px 0' }}>AUTHORIZED PARCELS</p>
            <div className="headline-xl" style={{ color: 'var(--on-surface)', margin: 0 }}>{parcels.length}</div>
            <p className="label-sm" style={{ color: 'var(--secondary)', margin: '4px 0 0 0' }}>{parcels.filter(p => p.status === 'VERIFIED').length} Verified</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'var(--surface-container-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)' }}>
            <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 8px 0' }}>PAID</p>
            <div className="headline-xl" style={{ color: 'var(--secondary)', margin: 0 }}>₹142.8 Cr</div>
            <p className="label-sm" style={{ color: 'var(--outline)', margin: '4px 0 0 0' }}>via PFMS</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-xl)', borderBottom: '1px solid var(--outline-variant)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ padding: 'var(--space-md) 0', borderBottom: '3px solid var(--primary-container)', fontWeight: 700, color: 'var(--primary)' }}>
          {currentUser?.user_type === 'PERSONAL' ? `My Registered Land Records (${parcels.length})` : `Authorized Land Parcels (${parcels.length})`}
        </div>
        <div style={{ padding: 'var(--space-md) 0', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Compensation Calculator</div>
        <div style={{ padding: 'var(--space-md) 0', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Approvals & Status</div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
        {/* Left Side: Parcel List */}
        <div style={{ flex: 1 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Status Filter:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 600 }}>
                <option value="ALL">All ({parcels.length})</option>
                <option value="VERIFIED">Verified Title</option>
                <option value="OBJECTION">Under Review / §15 Hearing</option>
                <option value="AWARD_DECLARED">Award Declared (§23)</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Tehsil:</span>
              <div style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                Ludhiana West
              </div>
            </div>
          </div>

          {/* Parcel Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {loading ? (
              <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Loading authorized land parcels from secure database...</div>
            ) : parcels.length === 0 ? (
              <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', backgroundColor: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
                <AlertTriangle size={32} color="var(--outline)" style={{ marginBottom: '8px' }} />
                <h3 className="headline-sm">No Land Parcels Found</h3>
                <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>No records match your authorization or current filter criteria.</p>
              </div>
            ) : (
              parcels.map((parcel, idx) => (
                <div key={parcel.id} className="surface-card" style={{ padding: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                      <div style={{ backgroundColor: 'var(--surface-container-high)', width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary-container)' }}>
                        0{idx + 1}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
                          <h3 className="headline-md" style={{ margin: 0 }}>Khasra No. {parcel.khasra_no}</h3>
                          {parcel.status === 'VERIFIED' ? (
                            <span style={{ backgroundColor: 'var(--secondary-container)', color: 'var(--on-secondary-container)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> {parcel.status_label}
                            </span>
                          ) : parcel.status === 'OBJECTION' ? (
                            <span style={{ backgroundColor: '#FFF3EB', color: '#C2410C', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #FDBA74' }}>
                              <AlertTriangle size={12} /> {parcel.status_label}
                            </span>
                          ) : (
                            <span style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--primary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 600 }}>
                              {parcel.status_label}
                            </span>
                          )}
                        </div>
                        <p className="body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>{parcel.mauza} (Hadbast #{parcel.hadbast_no}) • {parcel.land_type}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 4px 0' }}>Area</p>
                      <p className="headline-md" style={{ margin: 0 }}>{parcel.area_ha} Ha</p>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--surface-container-lowest)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <div>
                      <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 4px 0' }}>Owners</p>
                      <p className="body-md" style={{ fontWeight: 600, margin: 0 }}>{parcel.owners}</p>
                    </div>
                    <div>
                      <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 4px 0' }}>Status</p>
                      <p className="body-md" style={{ fontWeight: 600, color: parcel.status === 'VERIFIED' ? 'var(--secondary)' : '#C2410C', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {parcel.status === 'VERIFIED' ? <><CheckCircle2 size={14} /> Clean Deed</> : <><AlertTriangle size={14} /> Section 15 Hearing</>}
                      </p>
                    </div>
                    <div>
                      <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 4px 0' }}>Estimated Value</p>
                      <p className="body-md" style={{ fontWeight: 600, margin: 0 }}>₹ {parcel.estimated_value_cr} Cr</p>
                    </div>
                  </div>

                  {parcel.objection_summary && (
                    <div style={{ backgroundColor: '#FFF8F1', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid #FED7AA', marginBottom: 'var(--space-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                        <h4 className="label-md" style={{ color: '#9A3412', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                          <AlertTriangle size={14} /> Hearing on {parcel.hearing_date || 'Upcoming Notice'}
                        </h4>
                        <span className="label-sm" style={{ color: '#9A3412' }}>Disbursement On Hold</span>
                      </div>
                      <p className="body-sm" style={{ color: '#9A3412', margin: 0 }}>{parcel.objection_summary}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label-sm" style={{ color: 'var(--outline)' }}>
                      DGPS Accuracy: {parcel.dgps_accuracy} {parcel.verified_at && `• Verified by ${parcel.verified_by}`}
                    </span>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      {canVerify && parcel.status !== 'VERIFIED' ? (
                        <button 
                          onClick={() => handleVerifyParcel(parcel.id)}
                          disabled={verifyingId === parcel.id}
                          className="btn-primary" 
                          style={{ height: '32px', fontSize: '13px', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <Check size={14} /> {verifyingId === parcel.id ? 'Certifying...' : 'Certify & Verify Title'}
                        </button>
                      ) : parcel.status === 'VERIFIED' ? (
                        <span style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={14} /> DSC Digitally Signed
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#C2410C', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> Pending SDM Action
                        </span>
                      )}
                      <button 
                        onClick={() => {
                          setCalcArea(parcel.area_ha);
                          handleRecalculate();
                        }}
                        className="btn-secondary" 
                        style={{ height: '32px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <FileText size={14} /> Load in Calc
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Calculator & Action Desk */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Compensation Calculator */}
          <div className="surface-card" style={{ padding: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 className="label-md" style={{ color: 'var(--primary-container)', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                <FileText size={16} /> Compensation Calculator
              </h3>
              <span className="label-sm" style={{ backgroundColor: 'var(--surface-container-high)', padding: '2px 6px', borderRadius: 'var(--radius)' }}>RFCTLARR 2013</span>
            </div>
            <p className="body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-md)' }}>
              Dynamic statutory award calculation (Base Circle Rate × Multiplier + 100% Solatium).
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-md)' }}>
              <label className="label-sm">Area to Acquire (Hectares):</label>
              <input 
                type="number" 
                step="0.01" 
                value={calcArea} 
                onChange={(e) => setCalcArea(parseFloat(e.target.value) || 0)}
                style={{ padding: '8px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', fontSize: '14px' }} 
              />
            </div>

            <div style={{ backgroundColor: 'var(--surface-container-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span className="body-sm">Base Rate</span>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>₹ {calcResult.base_rate_lakh_per_ha.toFixed(2)} L / Ha</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span className="body-sm">Market Value</span>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>₹ {calcResult.market_value_lakh.toFixed(2)} L</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span className="body-sm">Rural Multiplier</span>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>× {calcResult.multiplier_factor.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <span className="body-sm">Bonus Solatium (100% §30)</span>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>+ ₹ {calcResult.solatium_100_percent_lakh.toFixed(2)} L</span>
              </div>
              
              <div style={{ backgroundColor: 'var(--primary-container)', color: 'var(--on-primary)', padding: 'var(--space-md)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="label-md" style={{ color: 'white' }}>Total Award Payable</span>
                <span className="tabular-nums headline-md" style={{ color: 'white', margin: 0 }}>₹ {calcResult.total_payable_cr.toFixed(2)} Cr</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-md)' }}>
              <span className="label-sm" style={{ color: 'var(--outline)' }}>Circle Rates FY 2024-25</span>
              <span 
                onClick={handleRecalculate}
                className="label-sm" 
                style={{ color: 'var(--primary-container)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600 }}>
                <RefreshCw size={12} /> Recalculate Award
              </span>
            </div>
          </div>

          {/* Action Desk */}
          <div className="surface-card" style={{ padding: 'var(--space-md)' }}>
            <h3 className="label-md" style={{ color: 'var(--primary-container)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: 'var(--space-xs)' }}>
              <ShieldCheck size={16} /> CALA & Agency Action Desk
            </h3>
            <p className="label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-md)' }}>
              Execution & Survey Integration Panel
            </p>
            
            <button 
              onClick={() => setOcrModalOpen(true)}
              className="btn-secondary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={16} /> Run AI OCR on Revenue Deed</span>
              <span>›</span>
            </button>
            <button 
              onClick={() => alert("Simulating DSC Token authentication: eMudra Class-3 USB key verified.")}
              className="btn-secondary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} /> Upload DSC Signed Field Report</span>
              <span className="label-sm" style={{ color: 'var(--outline)' }}>Token: eMudra</span>
            </button>
            <button 
              onClick={() => alert("Statutory package recommendation forwarded to District Collector.")}
              className="btn-primary" 
              style={{ width: '100%', backgroundColor: 'var(--secondary)', color: 'white', display: 'flex', justifyContent: 'space-between', padding: '12px', cursor: 'pointer' }}>
              <span style={{ textAlign: 'left' }}>Forward to District Collector</span>
              <span>›</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI OCR Modal */}
      {ocrModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 37, 64, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--space-md)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '650px',
            padding: 'var(--space-xl)',
            boxShadow: '0 20px 25px -5px rgba(10,37,64,0.2)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={22} color="var(--primary-container)" />
                <h3 className="headline-md" style={{ margin: 0 }}>AI OCR Cadastral Document Parser</h3>
              </div>
              <button 
                onClick={() => setOcrModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p className="body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-lg)' }}>
              Extracts survey numbers, Mauza Hadbast codes, owner hierarchies, and mutation stamps from Jamabandi, Form 7/12, and Registry deeds.
            </p>

            <div style={{
              border: '2px dashed var(--outline-variant)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-xl)',
              textAlign: 'center',
              backgroundColor: 'var(--surface-container-low)',
              marginBottom: 'var(--space-lg)'
            }}>
              <Upload size={32} color="var(--outline)" style={{ marginBottom: '8px' }} />
              <p className="body-md" style={{ margin: '0 0 4px 0', fontWeight: 600 }}>Drop Land Record Deed (PDF / Image)</p>
              <p className="body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 var(--space-md) 0' }}>Supports Punjabi/Hindi/Urdu revenue scripts</p>
              <button 
                onClick={handleRunOcr}
                disabled={ocrLoading}
                className="btn-primary" 
                style={{ margin: '0 auto', cursor: 'pointer' }}>
                {ocrLoading ? 'Running AI Vision OCR Pipeline...' : 'Run Sample Jamabandi Analysis'}
              </button>
            </div>

            {ocrResult && (
              <div style={{
                backgroundColor: 'var(--surface-container-lowest)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 'var(--radius)',
                padding: 'var(--space-md)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="label-sm" style={{ color: 'var(--secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Extraction Successful ({Math.round(ocrResult.confidence_score * 100)}% Confidence)
                  </span>
                  <span className="label-sm" style={{ color: 'var(--outline)' }}>{ocrResult.document_id}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '13px' }}>
                  <div><strong>Khasra Survey No:</strong> {ocrResult.survey_number}</div>
                  <div><strong>Area Extracted:</strong> {ocrResult.land_area_ha} Ha</div>
                  <div><strong>Primary Owner:</strong> {ocrResult.owner_name}</div>
                  <div><strong>Mauza / Village:</strong> {ocrResult.village}, {ocrResult.district}</div>
                  <div><strong>Mutation Ref:</strong> {ocrResult.mutation_number}</div>
                  <div><strong>Gazette Ref:</strong> {ocrResult.document_number}</div>
                </div>

                <button 
                  onClick={() => {
                    setOcrModalOpen(false);
                    setCalcArea(ocrResult.land_area_ha);
                    handleRecalculate();
                  }}
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: 'var(--space-md)', backgroundColor: 'var(--secondary)', cursor: 'pointer' }}>
                  Load Extracted Parcel into Compensation Calculator <ArrowRight size={14} style={{ display: 'inline', marginLeft: '4px' }} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CadastralTracker;
